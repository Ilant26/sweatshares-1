import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Received Stripe webhook event:', event.type);

    const supabase = createRouteHandlerClient({ cookies });

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabase);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, supabase);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, supabase);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: any) {
  console.log('Processing checkout.session.completed for session:', session.id);
  
  if (session.payment_status !== 'paid') {
    console.log('Session payment status is not paid:', session.payment_status);
    return;
  }

  // Look for escrow transaction with this session ID
  const { data: escrowTransaction, error } = await supabase
    .from('escrow_transactions')
    .select('*')
    .eq('stripe_payment_intent_id', session.payment_intent)
    .single();

  if (error || !escrowTransaction) {
    console.log('No escrow transaction found for payment intent:', session.payment_intent);
    return;
  }

  console.log('Found escrow transaction:', escrowTransaction.id);

  // Update escrow transaction status
  const { error: updateError } = await supabase
    .from('escrow_transactions')
    .update({
      status: 'funded',
      updated_at: new Date().toISOString()
    })
    .eq('id', escrowTransaction.id);

  if (updateError) {
    console.error('Error updating escrow transaction:', updateError);
    return;
  }

  // Update invoice status
  if (escrowTransaction.invoice_id) {
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', escrowTransaction.invoice_id);

    if (invoiceError) {
      console.error('Error updating invoice status:', invoiceError);
    } else {
      console.log('Invoice status updated to paid for invoice:', escrowTransaction.invoice_id);
    }
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  console.log('Processing payment_intent.succeeded for payment intent:', paymentIntent.id);
  
  // Look for escrow transaction with this payment intent ID
  const { data: escrowTransaction, error } = await supabase
    .from('escrow_transactions')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single();

  if (error || !escrowTransaction) {
    console.log('No escrow transaction found for payment intent:', paymentIntent.id);
    return;
  }

  console.log('Found escrow transaction:', escrowTransaction.id);

  // Update escrow transaction status
  const { error: updateError } = await supabase
    .from('escrow_transactions')
    .update({
      status: 'funded',
      updated_at: new Date().toISOString()
    })
    .eq('id', escrowTransaction.id);

  if (updateError) {
    console.error('Error updating escrow transaction:', updateError);
    return;
  }

  // Update invoice status
  if (escrowTransaction.invoice_id) {
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', escrowTransaction.invoice_id);

    if (invoiceError) {
      console.error('Error updating invoice status:', invoiceError);
    } else {
      console.log('Invoice status updated to paid for invoice:', escrowTransaction.invoice_id);
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  console.log('Processing payment_intent.payment_failed for payment intent:', paymentIntent.id);
  
  // Look for escrow transaction with this payment intent ID
  const { data: escrowTransaction, error } = await supabase
    .from('escrow_transactions')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single();

  if (error || !escrowTransaction) {
    console.log('No escrow transaction found for payment intent:', paymentIntent.id);
    return;
  }

  console.log('Found escrow transaction:', escrowTransaction.id);

  // Update escrow transaction status to failed
  const { error: updateError } = await supabase
    .from('escrow_transactions')
    .update({
      status: 'payment_failed',
      updated_at: new Date().toISOString()
    })
    .eq('id', escrowTransaction.id);

  if (updateError) {
    console.error('Error updating escrow transaction:', updateError);
  }
} 