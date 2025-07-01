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
    
    // Add signature to the first page
    const targetPage = pages[0]
    const { width, height } = targetPage.getSize()
    
    // Embed the signature image with error handling
    let signaturePdfImage
    try {
      signaturePdfImage = await pdfDoc.embedPng(signatureImage)
    } catch (error) {
      console.error('Error embedding signature image:', error)
      throw new Error('Failed to process signature image')
    }
    
    // Calculate signature position and size
    // Use a more flexible approach that preserves aspect ratio
    const maxSignatureWidth = 200
    const maxSignatureHeight = 80
    const margin = 50
    
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
    
    // Position signature in bottom right corner with bounds checking
    let x = width - signatureWidth - margin
    let y = margin + signatureHeight
    
    // Ensure signature doesn't go off the page
    if (x < margin) {
      x = margin
    }
    if (y > height - margin) {
      y = height - margin - signatureHeight
    }
    if (y < margin) {
      y = margin
    }
    
    // Add a subtle background rectangle for the signature area
    targetPage.drawRectangle({
      x: x - 5,
      y: y - 5,
      width: signatureWidth + 10,
      height: signatureHeight + 10,
      borderWidth: 1,
      borderColor: rgb(0.8, 0.8, 0.8),
      color: rgb(1, 1, 1), // White background
    })
    
    // Add signature to the page with proper scaling
    targetPage.drawImage(signaturePdfImage, {
      x,
      y,
      width: signatureWidth,
      height: signatureHeight,
    })

    // Add signature metadata text
    const fontSize = 10
    const textY = y - 25 // Increased spacing to avoid overlap
    
    // Add signer name
    if ((signatureRequest as any).receiver?.full_name) {
      targetPage.drawText(`Signed by: ${(signatureRequest as any).receiver.full_name}`, {
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
    
    targetPage.drawText(`Date: ${signatureDate}`, {
      x: x,
      y: textY - 15,
      size: fontSize,
      color: rgb(0, 0, 0),
    })

    // Add signature request ID for verification
    targetPage.drawText(`Request ID: ${(signatureRequest as any).id}`, {
      x: x,
      y: textY - 30,
      size: fontSize - 2,
      color: rgb(0.5, 0.5, 0.5),
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