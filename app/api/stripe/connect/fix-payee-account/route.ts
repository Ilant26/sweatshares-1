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

    console.log('Attempting to fix payee account for:', payeeId);

    // Check if payee already has a Stripe Connect account
    const { data: existingAccount } = await supabase
      .from('stripe_connect_accounts')
      .select('*')
      .eq('user_id', payeeId)
      .maybeSingle();

    if (existingAccount) {
      console.log('Payee already has account:', existingAccount);
      return NextResponse.json({
        success: true,
        message: 'Payee already has a Stripe Connect account',
        account: existingAccount
      });
    }

    // Get payee profile
    const { data: payeeProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', payeeId)
      .single();

    if (!payeeProfile) {
      return NextResponse.json({ 
        error: 'Payee profile not found' 
      }, { status: 404 });
    }

    // Try to create a new Stripe Connect account for the payee
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        email: payeeProfile.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          url: 'https://sweatshares.com',
          mcc: '7399', // Business Services - Not Elsewhere Classified
        },
      });

      // Store the Connect account in our database
      const { data: connectAccount, error: dbError } = await supabase
        .from('stripe_connect_accounts')
        .insert({
          user_id: payeeId,
          stripe_account_id: account.id,
          account_status: account.charges_enabled ? 'active' : 'pending',
          onboarding_completed: account.details_submitted,
          payouts_enabled: account.payouts_enabled || false,
          charges_enabled: account.charges_enabled || false,
          user_type: 'Freelancer' // Default type
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error saving Connect account:', dbError);
        return NextResponse.json({ error: 'Failed to save account' }, { status: 500 });
      }

      console.log('Created new Stripe Connect account for payee:', connectAccount);

      return NextResponse.json({
        success: true,
        message: 'Created new Stripe Connect account for payee',
        account: connectAccount,
        needsOnboarding: !account.charges_enabled || !account.details_submitted
      });

    } catch (stripeError) {
      console.error('Error creating Stripe account:', stripeError);
      return NextResponse.json({ 
        error: 'Failed to create Stripe Connect account',
        debug: { stripeError: stripeError instanceof Error ? stripeError.message : 'Unknown error' }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error fixing payee account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 