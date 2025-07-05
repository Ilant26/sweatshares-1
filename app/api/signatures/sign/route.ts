import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PDFDocument, rgb } from 'pdf-lib'
import type { Database } from '@/lib/database.types'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId, signatureData } = await request.json()

    if (!requestId || !signatureData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the signature request
    const { data: signatureRequest, error: fetchError } = await supabase
      .from('signature_requests')
      .select(`
        *,
        document:vault_documents(id, filename, filepath, description),
        sender:profiles!signature_requests_sender_id_fkey(id, full_name, avatar_url),
        receiver:profiles!signature_requests_receiver_id_fkey(id, full_name, avatar_url),
        positions:signature_positions(*)
      `)
      .eq('id', requestId)
      .single()

    if (fetchError || !signatureRequest) {
      return NextResponse.json({ error: 'Signature request not found' }, { status: 404 })
    }

    // Check if user is the receiver
    if ((signatureRequest as any).receiver_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if already signed
    if ((signatureRequest as any).status === 'signed') {
      return NextResponse.json({ error: 'Document already signed' }, { status: 400 })
    }

    if (!(signatureRequest as any).document?.filepath) {
      return NextResponse.json({ error: 'Document filepath not found' }, { status: 400 })
    }

    // Download the original PDF
    const { data: originalPdfData, error: downloadError } = await supabase.storage
      .from('vault')
      .download((signatureRequest as any).document.filepath)

    if (downloadError) {
      console.error('Error downloading original PDF:', downloadError)
      return NextResponse.json({ error: 'Failed to download original PDF' }, { status: 500 })
    }

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(await originalPdfData.arrayBuffer())
    const pages = pdfDoc.getPages()
    
    if (pages.length === 0) {
      return NextResponse.json({ error: 'PDF has no pages' }, { status: 400 })
    }

    // Convert base64 signature to image
    const signatureImage = await createSignatureImage(signatureData)
    
    // Embed the signature image with error handling
    let signaturePdfImage
    try {
      signaturePdfImage = await pdfDoc.embedPng(signatureImage)
    } catch (error) {
      console.error('Error embedding signature image:', error)
      throw new Error('Failed to process signature image')
    }
    
    // Get signature positions from the request
    const positions = (signatureRequest as any).positions || []
    
    // The coordinates are stored from the PDF viewer at base scale
    // We need to scale them back down to the original PDF coordinates
    // Each position should have its own scale information
    
    // Process each signature position
    for (const position of positions) {
      const pageIndex = position.page_number - 1
      if (pageIndex >= 0 && pageIndex < pages.length) {
        const page = pages[pageIndex]
        const { width, height } = page.getSize()
        
        // Log the coordinate information for debugging
        console.log('Processing signature position:', {
          position: {
            x: position.x_position,
            y: position.y_position,
            width: position.width,
            height: position.height,
            scale: position.scale,
            original_pdf_width: position.original_pdf_width,
            original_pdf_height: position.original_pdf_height
          },
          page: {
            width,
            height
          }
        });
        
        // The coordinates are already in original PDF coordinate space from the frontend
        const boxWidth = position.width || 300
        const boxHeight = position.height || 200
        
        // Verify coordinates are within PDF bounds
        if (position.x_position < 0 || position.y_position < 0 || 
            position.x_position + boxWidth > width || 
            position.y_position + boxHeight > height) {
          console.warn('Signature position outside PDF bounds:', {
            position: { x: position.x_position, y: position.y_position, width: boxWidth, height: boxHeight },
            pageBounds: { width, height }
          });
        }
        
        // Calculate space for signature and metadata within the box
        const metadataHeight = 60 // Space for 3 lines of metadata
        const signatureAreaHeight = boxHeight - metadataHeight
        const signatureAreaWidth = boxWidth
        
        // Calculate aspect ratio of the signature image
        const signatureAspectRatio = signaturePdfImage.width / signaturePdfImage.height
        
        // Calculate optimal signature size that fits within the signature area
        // while maintaining aspect ratio
        let signatureWidth = signatureAreaWidth
        let signatureHeight = signatureWidth / signatureAspectRatio
        
        // If height exceeds available space, scale down proportionally
        if (signatureHeight > signatureAreaHeight) {
          signatureHeight = signatureAreaHeight
          signatureWidth = signatureHeight * signatureAspectRatio
        }
        
        // If width exceeds available space, scale down proportionally
        if (signatureWidth > signatureAreaWidth) {
          signatureWidth = signatureAreaWidth
          signatureHeight = signatureWidth / signatureAspectRatio
        }
        
        // Position signature at the top of the box (above metadata)
        const signatureX = position.x_position + (signatureAreaWidth - signatureWidth) / 2
        const signatureY = height - position.y_position - signatureHeight // Flip Y coordinate
        
        // Add signature to the page (at the top of the box)
        page.drawImage(signaturePdfImage, {
          x: signatureX,
          y: signatureY,
          width: signatureWidth,
          height: signatureHeight,
        })
        
        // Calculate metadata positioning (directly below the signature)
        const metadataX = position.x_position
        const metadataY = signatureY - 5 // Start 5 points below the signature
        
        // Add metadata within the signature box
        const fontSize = 10
        const lineHeight = 12 // Reduced line height for tighter spacing
        
        // Add signer name
        if ((signatureRequest as any).receiver?.full_name) {
          page.drawText(`Signed by: ${(signatureRequest as any).receiver.full_name}`, {
            x: metadataX,
            y: metadataY - lineHeight * 2,
            size: fontSize,
            color: rgb(0, 0, 0),
          })
        }
        
        // Add signature date
        const signatureDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        
        page.drawText(`Date: ${signatureDate}`, {
          x: metadataX,
          y: metadataY - lineHeight,
          size: fontSize,
          color: rgb(0, 0, 0),
        })

        // Add signature request ID for verification (smaller and lighter)
        page.drawText(`Request ID: ${(signatureRequest as any).id}`, {
          x: metadataX,
          y: metadataY,
          size: fontSize - 2,
          color: rgb(0.5, 0.5, 0.5),
        })
        
        // Add field label if it's a text field
        if (position.field_type === 'text' && position.field_label) {
          page.drawText(position.field_label, {
            x: metadataX,
            y: metadataY + lineHeight,
            size: 10,
            color: rgb(0.5, 0.5, 0.5),
          })
        }
        
        // Add date for date fields
        if (position.field_type === 'date') {
          const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })
          page.drawText(currentDate, {
            x: metadataX,
            y: metadataY + lineHeight * 2,
            size: 12,
            color: rgb(0, 0, 0),
          })
        }
      }
    }
    
    // Note: Metadata is now added within each signature box instead of at fixed coordinates

    // Serialize the PDF
    const signedPdfBytes = await pdfDoc.save()
    
    // Generate new filename for signed document
    const originalFilename = (signatureRequest as any).document?.filename || 'document.pdf'
    const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '')
    const signedFilename = `${nameWithoutExt}_SIGNED_${Date.now()}.pdf`
    const signedFilepath = `${user.id}/signed-documents/${(signatureRequest as any).id}/${signedFilename}`
    
    // Upload the signed PDF
    const { error: uploadError } = await supabase.storage
      .from('vault')
      .upload(signedFilepath, signedPdfBytes, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading signed PDF:', uploadError)
      return NextResponse.json({ error: 'Failed to upload signed PDF' }, { status: 500 })
    }

    // Update the signature request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('signature_requests')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signature_data: {
          signature: signatureData,
          signed_document_path: signedFilepath,
          signed_document_filename: signedFilename
        },
      } as any)
      .eq('id', requestId)
      .eq('receiver_id', user.id)
      .select(`
        *,
        document:vault_documents(id, filename, filepath, description),
        sender:profiles!signature_requests_sender_id_fkey(id, full_name, avatar_url),
        receiver:profiles!signature_requests_receiver_id_fkey(id, full_name, avatar_url)
      `)
      .single()

    if (updateError) {
      console.error('Error updating signature request:', updateError)
      return NextResponse.json({ error: 'Failed to update signature request' }, { status: 500 })
    }

    // Send message to sender about the signed document
    try {
      const signerProfile = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', user.id)
        .single()

      const signerName = signerProfile?.data?.full_name || signerProfile?.data?.username || 'Someone'
      
      const messageContent = JSON.stringify({
        type: 'document_signed',
        signatureRequestId: requestId,
        documentName: (signatureRequest as any).document?.filename || 'Document',
        signerName: signerName
      })

      // Send the message
      await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: (signatureRequest as any).sender_id,
          content: messageContent,
          read: false
        })
    } catch (error) {
      console.error('Error sending signature message:', error)
      // Don't fail the entire request if message sending fails
    }

    return NextResponse.json({
      success: true,
      signatureRequest: updatedRequest,
      signedDocument: {
        filepath: signedFilepath,
        filename: signedFilename
      }
    })

  } catch (error) {
    console.error('Error in sign document API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to convert base64 signature to image
async function createSignatureImage(signatureData: string): Promise<Uint8Array> {
  // Remove data URL prefix if present
  const base64Data = signatureData.replace(/^data:image\/[a-z]+;base64,/, '')
  
  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data, 'base64')
  
  // Validate that we have valid image data
  if (buffer.length === 0) {
    throw new Error('Invalid signature image data')
  }
  
  return new Uint8Array(buffer)
} 