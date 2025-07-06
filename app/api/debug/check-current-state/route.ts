import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get all escrow transactions
    const { data: escrowTransactions, error: escrowError } = await supabase
      .from('escrow_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    // Get all Stripe Connect accounts
    const { data: stripeAccounts, error: stripeError } = await supabase
      .from('stripe_connect_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .order('created_at', { ascending: false });

    const currentState = {
      escrowTransactions: escrowTransactions || [],
      stripeAccounts: stripeAccounts || [],
      profiles: profiles || [],
      errors: {
        escrowError,
        stripeError,
        profilesError
      }
    };

    console.log('Current database state:', JSON.stringify(currentState, null, 2));

    return NextResponse.json({
      success: true,
      currentState
    });

  } catch (error) {
    console.error('Error checking current state:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: { error: error instanceof Error ? error.message : 'Unknown error' }
    }, { status: 500 });
  }
} 