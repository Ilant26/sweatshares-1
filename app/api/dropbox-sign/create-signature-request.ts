// @ts-ignore: No types for hellosign-sdk
import { NextApiRequest, NextApiResponse } from 'next';
import HelloSign from 'hellosign-sdk';
import { createClient } from '@supabase/supabase-js';

const hellosign = new HelloSign({ key: process.env.DROPBOX_SIGN_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { documentId, fileUrl, senderId, recipientEmail, title, message } = req.body;

  try {
    // 1. Create signature request
    const response = await hellosign.signatureRequest.send({
      title: title || 'Document Signature Request',
      message: message || 'Please sign this document.',
      signers: [
        { email_address: recipientEmail, name: 'Recipient' }
      ],
      files_url: [fileUrl],
    });

    const signatureRequestId = response.signature_request.signature_request_id;

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

    if (error) throw error;

    res.status(200).json({ signatureRequestId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
} 