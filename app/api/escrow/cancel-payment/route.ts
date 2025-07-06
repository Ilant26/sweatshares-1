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

    // If there's a payment intent, try to cancel it
    if (escrowTransaction.stripe_payment_intent_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(escrowTransaction.stripe_payment_intent_id);
        
        // Only cancel if it's in a cancellable state
        if (['requires_payment_method', 'requires_confirmation'].includes(paymentIntent.status)) {
          await stripe.paymentIntents.cancel(escrowTransaction.stripe_payment_intent_id);
          console.log('Payment intent cancelled:', escrowTransaction.stripe_payment_intent_id);
        } else {
          console.log('Payment intent not in cancellable state:', paymentIntent.status);
        }
      } catch (error) {
        console.error('Error cancelling payment intent:', error);
        // Continue with clearing the database even if Stripe cancellation fails
      }
    }

    // Clear the payment intent from the escrow transaction
    const { error: updateError } = await supabase
      .from('escrow_transactions')
      .update({ 
        stripe_payment_intent_id: null,
        status: 'pending'
      })
      .eq('id', escrowTransactionId);

    if (updateError) {
      console.error('Error updating escrow transaction:', updateError);
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 