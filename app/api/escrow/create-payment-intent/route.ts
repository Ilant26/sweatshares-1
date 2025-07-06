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

    const { escrowTransactionId } = await request.json();

    if (!escrowTransactionId) {
      return NextResponse.json({ error: 'Missing escrow transaction ID' }, { status: 400 });
    }

    // Get the escrow transaction
    const { data: escrowTransaction, error: escrowError } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('id', escrowTransactionId)
      .single();

    if (escrowError || !escrowTransaction) {
      return NextResponse.json({ error: 'Escrow transaction not found' }, { status: 404 });
    }

    // Verify user is the payer
    if (escrowTransaction.payer_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if payment intent already exists and handle it properly
    if (escrowTransaction.stripe_payment_intent_id) {
      try {
        // Try to retrieve the existing payment intent
        const existingPaymentIntent = await stripe.paymentIntents.retrieve(escrowTransaction.stripe_payment_intent_id);
        
        console.log('Found existing payment intent:', {
          id: existingPaymentIntent.id,
          status: existingPaymentIntent.status,
          amount: existingPaymentIntent.amount,
          currency: existingPaymentIntent.currency
        });

        // If the payment intent is still in a usable state, create a new checkout session
        if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existingPaymentIntent.status)) {
          // For checkout sessions, we'll create a new session even if payment intent exists
          console.log('Existing payment intent found, but creating new checkout session');
        } else if (existingPaymentIntent.status === 'succeeded') {
          return NextResponse.json({ 
            error: 'Payment has already been completed for this escrow transaction',
            paymentIntentId: escrowTransaction.stripe_payment_intent_id
          }, { status: 400 });
        } else {
          // Payment intent is in a failed or cancelled state, we'll create a new one
          console.log('Existing payment intent is in unusable state, creating new one');
        }
      } catch (error) {
        console.log('Error retrieving existing payment intent, creating new one:', error);
        // If we can't retrieve the payment intent, we'll create a new one
      }
    }

    // Get the payee's Connect account - try multiple approaches
    let payeeAccount = null;
    let payeeAccountError = null;

    console.log('Looking for payee account:', {
      payeeId: escrowTransaction.payee_id,
      escrowTransactionId: escrowTransaction.id
    });

    // First, try to get by user_id
    const { data: accountByUserId, error: errorByUserId } = await supabase
      .from('stripe_connect_accounts')
      .select('*')
      .eq('user_id', escrowTransaction.payee_id)
      .maybeSingle();

    console.log('Account lookup result:', {
      accountByUserId,
      errorByUserId,
      found: !!accountByUserId
    });

    if (accountByUserId) {
      payeeAccount = accountByUserId;
      console.log('Found payee account:', {
        accountId: payeeAccount.id,
        stripeAccountId: payeeAccount.stripe_account_id,
        status: payeeAccount.account_status,
        chargesEnabled: payeeAccount.charges_enabled,
        onboardingCompleted: payeeAccount.onboarding_completed
      });
    } else {
      // If not found by user_id, check if there are any accounts for this user
      const { data: allAccounts, error: allAccountsError } = await supabase
        .from('stripe_connect_accounts')
        .select('*')
        .eq('user_id', escrowTransaction.payee_id);

      console.log('All accounts lookup:', {
        allAccounts,
        allAccountsError,
        count: allAccounts?.length || 0
      });

      if (allAccounts && allAccounts.length > 0) {
        // Use the first account found
        payeeAccount = allAccounts[0];
        console.log('Using first account found:', {
          accountId: payeeAccount.id,
          stripeAccountId: payeeAccount.stripe_account_id
        });
      } else {
        payeeAccountError = errorByUserId;
      }
    }



    if (!payeeAccount) {
      // Check if the payee exists in the profiles table
      const { data: payeeProfile } = await supabase
        .from('profiles')
        .select('id, full_name, username, email')
        .eq('id', escrowTransaction.payee_id)
        .single();

      const payeeName = payeeProfile?.full_name || payeeProfile?.username || 'The invoice sender';
      
      // Check if there are any incomplete Stripe Connect attempts
      const { data: incompleteAccounts } = await supabase
        .from('stripe_connect_accounts')
        .select('*')
        .eq('user_id', escrowTransaction.payee_id)
        .eq('account_status', 'pending');

      const hasIncompleteSetup = incompleteAccounts && incompleteAccounts.length > 0;
      
      // Check if there are any accounts at all for this user (regardless of status)
      const { data: anyAccounts } = await supabase
        .from('stripe_connect_accounts')
        .select('*')
        .eq('user_id', escrowTransaction.payee_id);


      
      return NextResponse.json({ 
        error: `${payeeName} needs to complete their Stripe Connect setup before you can make this payment. They need to connect their Stripe account to receive escrow payments.`,
        debug: { 
          payeeId: escrowTransaction.payee_id, 
          payeeName,
          error: payeeAccountError,
          hasProfile: !!payeeProfile,
          hasIncompleteSetup,
          incompleteAccounts,
          anyAccounts,
          totalAccounts: anyAccounts?.length || 0
        },
        payeeInfo: payeeProfile ? {
          name: payeeName,
          email: payeeProfile.email,
          hasIncompleteSetup,
          hasAnyAccounts: anyAccounts && anyAccounts.length > 0
        } : null
      }, { status: 400 });
    }

    // Verify the payee's account status with Stripe
    try {
      console.log('Verifying Stripe account:', payeeAccount.stripe_account_id);
      
      const stripeAccount = await stripe.accounts.retrieve(payeeAccount.stripe_account_id);
      
      console.log('Stripe account retrieved:', {
        accountId: payeeAccount.stripe_account_id,
        chargesEnabled: stripeAccount.charges_enabled,
        detailsSubmitted: stripeAccount.details_submitted,
        payoutsEnabled: stripeAccount.payouts_enabled,
        businessType: stripeAccount.business_type,
        country: stripeAccount.country
      });
      
      // Check if the account is properly set up
      if (!stripeAccount.charges_enabled || !stripeAccount.details_submitted) {
        console.log('Account not properly set up:', {
          chargesEnabled: stripeAccount.charges_enabled,
          detailsSubmitted: stripeAccount.details_submitted
        });
        
        // Update our database with the current status
        await supabase
          .from('stripe_connect_accounts')
          .update({
            account_status: stripeAccount.charges_enabled ? 'pending' : 'pending',
            onboarding_completed: stripeAccount.details_submitted || false,
            charges_enabled: stripeAccount.charges_enabled || false,
            payouts_enabled: stripeAccount.payouts_enabled || false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', escrowTransaction.payee_id);

        return NextResponse.json({ 
          error: 'Payee does not have an active Stripe Connect account. Their account needs to complete onboarding and verification.',
          debug: {
            chargesEnabled: stripeAccount.charges_enabled,
            detailsSubmitted: stripeAccount.details_submitted,
            requirements: stripeAccount.requirements
          }
        }, { status: 400 });
      }
      
      // Account is properly set up, continue with payment
      console.log('Payee Stripe account verified successfully');

    } catch (stripeError) {
      console.error('Error verifying payee Stripe account:', stripeError);
      
      return NextResponse.json({ 
        error: 'Unable to verify payee Stripe Connect account status',
        debug: { stripeError: stripeError instanceof Error ? stripeError.message : 'Unknown error' }
      }, { status: 500 });
    }

    // Calculate platform fee (5% with min/max limits)
    const platformFee = Math.min(Math.max(escrowTransaction.amount * 0.05, 250), 5000); // €2.50 to €50.00
    const transferAmount = escrowTransaction.amount - platformFee;

    console.log('Creating checkout session:', {
      amount: escrowTransaction.amount,
      currency: escrowTransaction.currency,
      platformFee,
      transferAmount,
      destination: payeeAccount.stripe_account_id,
      escrowTransactionId: escrowTransaction.id
    });

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: escrowTransaction.currency.toLowerCase(),
            product_data: {
              name: `Escrow Payment - Invoice ${escrowTransaction.invoice_id || 'N/A'}`,
              description: escrowTransaction.transaction_description || 'Secure escrow payment',
            },
            unit_amount: Math.round(escrowTransaction.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/dashboard/escrow-payment/${escrowTransaction.invoice_id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/dashboard/escrow-payment/${escrowTransaction.invoice_id}?cancelled=true`,
      payment_intent_data: {
        application_fee_amount: Math.round(platformFee * 100),
        transfer_data: {
          destination: payeeAccount.stripe_account_id,
        },
        metadata: {
          escrow_transaction_id: escrowTransaction.id,
          invoice_id: escrowTransaction.invoice_id,
          payer_id: escrowTransaction.payer_id,
          payee_id: escrowTransaction.payee_id,
          transaction_type: escrowTransaction.transaction_type
        },
      },
    });

    console.log('Checkout session created successfully:', {
      sessionId: session.id,
      url: session.url
    });

    // Update escrow transaction with session ID
    const { error: updateError } = await supabase
      .from('escrow_transactions')
      .update({ 
        stripe_payment_intent_id: session.payment_intent as string,
        status: 'pending_payment'
      })
      .eq('id', escrowTransactionId);

    if (updateError) {
      console.error('Error updating escrow transaction:', updateError);
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,
      escrowTransaction: {
        id: escrowTransaction.id,
        amount: escrowTransaction.amount,
        platformFee,
        transferAmount
      }
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 