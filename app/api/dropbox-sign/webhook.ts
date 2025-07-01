import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const event = req.body.event;
  if (!event) return res.status(400).end();

  // Handle signature request signed event
  if (event.event_type === 'signature_request_signed') {
    const signatureRequestId = event.event_metadata.related_signature_id;
    await supabase
      .from('signature_requests')
      .update({ status: 'signed', updated_at: new Date().toISOString() })
      .eq('signature_request_id', signatureRequestId);
  }

  res.status(200).end();
} 