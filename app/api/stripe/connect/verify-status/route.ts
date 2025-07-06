import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stripeAccountId } = await request.json();

    if (!stripeAccountId) {
      return NextResponse.json({ error: 'Missing Stripe account ID' }, { status: 400 });
    }

    // Verify the user owns this Stripe account
    const { data: connectAccount, error: dbError } = await supabase
      .from('stripe_connect_accounts')
      .select('*')
      .eq('stripe_account_id', stripeAccountId)
      .eq('user_id', user.id)
      .single();

    if (dbError || !connectAccount) {
      return NextResponse.json({ error: 'Account not found or access denied' }, { status: 404 });
    }

    // Get the current account status from Stripe
    const account = await stripe.accounts.retrieve(stripeAccountId);

    // Update our database with the latest status
    const { error: updateError } = await supabase
      .from('stripe_connect_accounts')
      .update({
        account_status: account.charges_enabled ? 'active' : 'pending',
        onboarding_completed: account.details_submitted,
        payouts_enabled: account.payouts_enabled || false,
        charges_enabled: account.charges_enabled || false,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_account_id', stripeAccountId);

    if (updateError) {
      console.error('Error updating Connect account status:', updateError);
    }

    return NextResponse.json({
      success: true,
      accountStatus: {
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
        requirements: account.requirements,
        business_type: account.business_type,
        country: account.country
      }
    });

  } catch (error) {
    console.error('Error verifying Stripe Connect status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 