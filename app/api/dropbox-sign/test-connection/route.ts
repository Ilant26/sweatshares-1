import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore: No types for hellosign-sdk
import HelloSign from 'hellosign-sdk';

const hellosign = new HelloSign({ key: process.env.DROPBOX_SIGN_API_KEY! });

export async function GET(req: NextRequest) {
  try {
    // Test the API key by getting account info
    const account = await hellosign.account.get();
    console.log('Dropbox Sign API connection successful:', account);
    
    return NextResponse.json({ 
      success: true, 
      account: account.account,
      message: 'API key is valid and working'
    });
  } catch (error: any) {
    console.error('Dropbox Sign API test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'API key test failed'
    }, { status: 500 });
  }
} 