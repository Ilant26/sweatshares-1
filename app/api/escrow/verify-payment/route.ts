import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    const { sessionId, escrowTransactionId } = await request.json();

    if (!sessionId || !escrowTransactionId) {
      return NextResponse.json(
        { error: 'Missing sessionId or escrowTransactionId' },
        { status: 400 }
      );
    }

    console.log('Verifying payment for session:', sessionId, 'escrow transaction:', escrowTransactionId);

    // Get the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    console.log('Stripe session status:', session.payment_status);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Get the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
    
    console.log('Payment intent status:', paymentIntent.status);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment intent not succeeded' },
        { status: 400 }
      );
    }

    // Update the escrow transaction
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    console.log('Updating escrow transaction status to funded');

    // Update escrow transaction status
    const { error: updateError } = await supabase
      .from('escrow_transactions')
      .update({
        status: 'funded',
        stripe_payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', escrowTransactionId);

    if (updateError) {
      console.error('Error updating escrow transaction:', updateError);
      return NextResponse.json(
        { error: 'Failed to update escrow transaction' },
        { status: 500 }
      );
    }

    console.log('Escrow transaction updated successfully');

    // Update the invoice status if it exists
    const { data: escrowTransaction, error: escrowFetchError } = await supabase
      .from('escrow_transactions')
      .select('invoice_id')
      .eq('id', escrowTransactionId)
      .single();

    if (escrowFetchError) {
      console.error('Error fetching escrow transaction:', escrowFetchError);
      return NextResponse.json(
        { error: 'Failed to fetch escrow transaction' },
        { status: 500 }
      );
    }

    if (escrowTransaction?.invoice_id) {
      console.log('Updating invoice status to paid for invoice:', escrowTransaction.invoice_id);
      
      const { error: invoiceUpdateError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowTransaction.invoice_id);

      if (invoiceUpdateError) {
        console.error('Error updating invoice status:', invoiceUpdateError);
        return NextResponse.json(
          { error: 'Failed to update invoice status' },
          { status: 500 }
        );
      }

      console.log('Invoice status updated successfully to paid');
    } else {
      console.warn('No invoice_id found for escrow transaction:', escrowTransactionId);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and escrow transaction updated',
      invoiceId: escrowTransaction?.invoice_id
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
} 