import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore: No types for hellosign-sdk
import HelloSign from 'hellosign-sdk';

const hellosign = new HelloSign({ key: process.env.DROPBOX_SIGN_API_KEY! });

export async function GET(req: NextRequest) {
  try {
    // Get account info to check quotas
    const account = await hellosign.account.get();
    
    return NextResponse.json({ 
      success: true, 
      quotas: account.account.quotas,
      account_type: account.account.is_paid_hs ? 'paid' : 'free',
      can_send_requests: account.account.quotas.api_signature_requests_left > 0,
      message: account.account.quotas.api_signature_requests_left > 0 
        ? 'You can send signature requests' 
        : 'No signature requests left in quota'
    });
  } catch (error: any) {
    console.error('Dropbox Sign quota check failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Quota check failed'
    }, { status: 500 });
  }
} 