import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for additional data
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Parse request body (make fields optional)
    let requestBody: any = {};
    try {
      requestBody = await request.json();
    } catch (e) {
      // If no body provided, use defaults
      requestBody = {};
    }

    const { userType = 'Freelancer' } = requestBody;
    const email = user.email || userProfile?.email;

    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // Check if user already has a Connect account
    const { data: existingAccount } = await supabase
      .from('stripe_connect_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingAccount) {
      // Get the current account status from Stripe
      const stripeAccount = await stripe.accounts.retrieve(existingAccount.stripe_account_id);
      
      // Update our database with current status
      await supabase
        .from('stripe_connect_accounts')
        .update({
          account_status: stripeAccount.charges_enabled ? 'active' : 'pending',
          onboarding_completed: stripeAccount.details_submitted,
          payouts_enabled: stripeAccount.payouts_enabled || false,
          charges_enabled: stripeAccount.charges_enabled || false,
        })
        .eq('user_id', user.id);

      // If account is fully active, return success
      if (stripeAccount.charges_enabled && stripeAccount.details_submitted) {
        return NextResponse.json({
          success: true,
          account: {
            ...existingAccount,
            charges_enabled: stripeAccount.charges_enabled,
            onboarding_completed: stripeAccount.details_submitted,
            payouts_enabled: stripeAccount.payouts_enabled || false,
          },
          status: 'active'
        });
      }

      // If account exists but needs onboarding, create account link
      const accountLink = await stripe.accountLinks.create({
        account: existingAccount.stripe_account_id,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/my-invoices`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/my-invoices?payment=success`,
        type: 'account_onboarding',
      });

      return NextResponse.json({
        success: true,
        account: {
          ...existingAccount,
          charges_enabled: stripeAccount.charges_enabled,
          onboarding_completed: stripeAccount.details_submitted,
          payouts_enabled: stripeAccount.payouts_enabled || false,
        },
        accountLink: accountLink.url,
        status: 'pending_onboarding'
      });
    }

    // Create new Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      email,
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
        user_id: user.id,
        stripe_account_id: account.id,
        account_status: account.charges_enabled ? 'active' : 'pending',
        onboarding_completed: account.details_submitted,
        payouts_enabled: account.payouts_enabled || false,
        charges_enabled: account.charges_enabled || false,
        user_type: userType
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving Connect account:', dbError);
      return NextResponse.json({ error: 'Failed to save account' }, { status: 500 });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/my-invoices`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/my-invoices?payment=success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      success: true,
      account: connectAccount,
      accountLink: accountLink.url,
      status: 'new_account'
    });

  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 