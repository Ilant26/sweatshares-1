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
        receiver:profiles!signature_requests_receiver_id_fkey(id, full_name, avatar_url)
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
    
    // Get the first page to determine page size
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()
    
    // Embed the signature image with error handling
    let signaturePdfImage
    try {
      signaturePdfImage = await pdfDoc.embedPng(signatureImage)
    } catch (error) {
      console.error('Error embedding signature image:', error)
      throw new Error('Failed to process signature image')
    }
    
    // Add a new page for the signature
    const signaturePage = pdfDoc.addPage([width, height])
    
    // Calculate signature position and size
    // Use a more flexible approach that preserves aspect ratio
    const maxSignatureWidth = 300
    const maxSignatureHeight = 120
    const margin = 80
    
    // Calculate aspect ratio of the signature image
    const signatureAspectRatio = signaturePdfImage.width / signaturePdfImage.height
    
    // Calculate optimal size while maintaining aspect ratio
    let signatureWidth = maxSignatureWidth
    let signatureHeight = signatureWidth / signatureAspectRatio
    
    // If height exceeds max, scale down proportionally
    if (signatureHeight > maxSignatureHeight) {
      signatureHeight = maxSignatureHeight
      signatureWidth = signatureHeight * signatureAspectRatio
    }
    
    // Center the signature on the new page
    const x = (width - signatureWidth) / 2
    const y = height - margin - signatureHeight
    
    // Add a title to the signature page
    const titleFontSize = 16
    const titleY = height - 50
    signaturePage.drawText('DOCUMENT SIGNATURE PAGE', {
      x: (width - 300) / 2, // Center the title
      y: titleY,
      size: titleFontSize,
      color: rgb(0, 0, 0),
    })
    
    // Add a separator line below the title
    signaturePage.drawLine({
      start: { x: 50, y: titleY - 20 },
      end: { x: width - 50, y: titleY - 20 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    })
    
    // Add a subtle background rectangle for the signature area
    signaturePage.drawRectangle({
      x: x - 10,
      y: y - 10,
      width: signatureWidth + 20,
      height: signatureHeight + 20,
      borderWidth: 2,
      borderColor: rgb(0.7, 0.7, 0.7),
      color: rgb(0.98, 0.98, 0.98), // Light gray background
    })
    
    // Add signature to the new page with proper scaling
    signaturePage.drawImage(signaturePdfImage, {
      x,
      y,
      width: signatureWidth,
      height: signatureHeight,
    })

    // Add signature metadata text
    const fontSize = 12
    const textY = y - 40 // Increased spacing to avoid overlap
    
    // Add signer name
    if ((signatureRequest as any).receiver?.full_name) {
      signaturePage.drawText(`Signed by: ${(signatureRequest as any).receiver.full_name}`, {
        x: x,
        y: textY,
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
    
    signaturePage.drawText(`Date: ${signatureDate}`, {
      x: x,
      y: textY - 20,
      size: fontSize,
      color: rgb(0, 0, 0),
    })

    // Add signature request ID for verification
    signaturePage.drawText(`Request ID: ${(signatureRequest as any).id}`, {
      x: x,
      y: textY - 40,
      size: fontSize - 2,
      color: rgb(0.5, 0.5, 0.5),
    })
    
    // Add document information
    if ((signatureRequest as any).document?.filename) {
      signaturePage.drawText(`Document: ${(signatureRequest as any).document.filename}`, {
        x: x,
        y: textY - 60,
        size: fontSize - 2,
        color: rgb(0.3, 0.3, 0.3),
      })
    }
    
    // Add a footer note
    const footerY = 50
    signaturePage.drawText('This page contains the digital signature for the above document.', {
      x: (width - 400) / 2, // Center the footer
      y: footerY,
      size: fontSize - 2,
      color: rgb(0.5, 0.5, 0.5),
    })
    
    // Add page number indicator
    const totalPages = pdfDoc.getPageCount()
    signaturePage.drawText(`Page ${totalPages} of ${totalPages} - Signature Page`, {
      x: width - 150,
      y: 30,
      size: fontSize - 3,
      color: rgb(0.4, 0.4, 0.4),
    })

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