import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const event = body.event;
  if (!event) return NextResponse.json({}, { status: 400 });

  // Handle signature request signed event
  if (event.event_type === 'signature_request_signed') {
    const signatureRequestId = event.event_metadata.related_signature_id;
    await supabase
      .from('signature_requests')
      .update({ status: 'signed', updated_at: new Date().toISOString() })
      .eq('signature_request_id', signatureRequestId);
  }

  return NextResponse.json({});
} 