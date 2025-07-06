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

    const { payeeId } = await request.json();

    if (!payeeId) {
      return NextResponse.json({ error: 'Missing payee ID' }, { status: 400 });
    }

    // Get the payee's Connect account
    const { data: payeeAccount, error: payeeAccountError } = await supabase
      .from('stripe_connect_accounts')
      .select('*')
      .eq('user_id', payeeId)
      .single();

    console.log('Payee account lookup:', {
      payeeId,
      payeeAccount,
      payeeAccountError
    });

    if (!payeeAccount) {
      return NextResponse.json({ 
        error: 'Payee does not have a Stripe Connect account',
        debug: { payeeId, error: payeeAccountError }
      }, { status: 404 });
    }

    // Get the current account status from Stripe
    try {
      const stripeAccount = await stripe.accounts.retrieve(payeeAccount.stripe_account_id);
      
      return NextResponse.json({
        success: true,
        payeeAccount: {
          id: payeeAccount.id,
          userId: payeeAccount.user_id,
          stripeAccountId: payeeAccount.stripe_account_id,
          accountStatus: payeeAccount.account_status,
          chargesEnabled: payeeAccount.charges_enabled,
          onboardingCompleted: payeeAccount.onboarding_completed,
          payoutsEnabled: payeeAccount.payouts_enabled
        },
        stripeAccount: {
          id: stripeAccount.id,
          chargesEnabled: stripeAccount.charges_enabled,
          detailsSubmitted: stripeAccount.details_submitted,
          payoutsEnabled: stripeAccount.payouts_enabled,
          requirements: stripeAccount.requirements,
          businessType: stripeAccount.business_type,
          country: stripeAccount.country
        },
        isActive: stripeAccount.charges_enabled && stripeAccount.details_submitted
      });
    } catch (stripeError) {
      console.error('Error retrieving Stripe account:', stripeError);
      return NextResponse.json({ 
        error: 'Unable to retrieve Stripe account status',
        debug: { 
          stripeError: stripeError instanceof Error ? stripeError.message : 'Unknown error',
          payeeAccount
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error checking payee status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 