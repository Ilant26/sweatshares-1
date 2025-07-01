import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore: No types for hellosign-sdk
import HelloSign from 'hellosign-sdk';
import { createClient } from '@supabase/supabase-js';

const hellosign = new HelloSign({ key: process.env.DROPBOX_SIGN_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { documentId, fileUrl: storagePath, senderId, recipientEmail, title, message } = body;

  try {
    // Log the storage path
    console.log('Requested storagePath:', storagePath);
    
    // Download the file from Supabase storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('vault')
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError);
      return NextResponse.json({ error: 'Failed to download file from storage.' }, { status: 500 });
    }

    console.log('File downloaded successfully, size:', fileData.size);

    // Convert the file to base64 for Dropbox Sign
    const arrayBuffer = await fileData.arrayBuffer();
    const base64File = Buffer.from(arrayBuffer).toString('base64');
    const fileName = storagePath.split('/').pop() || 'document.pdf';

    // 1. Create signature request with file data instead of URL
    const response = await hellosign.signatureRequest.send({
      title: title || 'Document Signature Request',
      message: message || 'Please sign this document.',
      signers: [
        { email_address: recipientEmail, name: 'Recipient' }
      ],
      file_data: [{
        file_data: base64File,
        name: fileName
      }], // Use file_data with proper format
      test_mode: 1, // Enable test mode for free/dev accounts
    });

    const signatureRequestId = response.signature_request.signature_request_id;
    console.log('Dropbox Sign request created, ID:', signatureRequestId);

    // 2. Store in Supabase
    const { error } = await supabase
      .from('signature_requests')
      .insert([{
        document_id: documentId,
        sender_id: senderId,
        recipient_email: recipientEmail,
        signature_request_id: signatureRequestId,
        status: 'pending'
      }]);

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return NextResponse.json({ signatureRequestId });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
} 