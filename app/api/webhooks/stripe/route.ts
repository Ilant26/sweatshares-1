import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      
      case 'transfer.created':
        await handleTransferCreated(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  const responseId = paymentIntent.metadata?.response_id;
  
  if (!responseId) {
    console.log('No response_id in payment intent metadata');
    return;
  }

  // Update escrow transaction status to funded
  const { error } = await supabase
    .from('escrow_transactions')
    .update({ status: 'funded' })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Error updating escrow transaction:', error);
    throw error;
  }

  console.log(`Escrow funded for response: ${responseId}`);
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  const responseId = paymentIntent.metadata?.response_id;
  
  if (!responseId) {
    console.log('No response_id in payment intent metadata');
    return;
  }

  // Update escrow transaction status to failed
  const { error } = await supabase
    .from('escrow_transactions')
    .update({ status: 'failed' })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Error updating escrow transaction:', error);
    throw error;
  }

  console.log(`Escrow payment failed for response: ${responseId}`);
}

async function handleTransferCreated(transfer: any) {
  // Handle successful transfers to sellers
  console.log(`Transfer created: ${transfer.id}`);
} 