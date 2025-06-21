import Stripe from 'stripe';

// Initialize Stripe with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Stripe Connect configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  connectClientId: process.env.STRIPE_CONNECT_CLIENT_ID!,
};

// Create a payment intent for a deal
export async function createPaymentIntent(amount: number, currency: string = 'usd', metadata: any = {}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

// Create a Connect account for a seller
export async function createConnectAccount(email: string, country: string = 'US') {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    return account;
  } catch (error) {
    console.error('Error creating Connect account:', error);
    throw error;
  }
}

// Create a payment intent with Connect
export async function createConnectPaymentIntent(
  amount: number,
  currency: string = 'usd',
  application_fee_amount: number,
  transfer_data: { destination: string },
  metadata: any = {}
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      application_fee_amount: Math.round(application_fee_amount * 100),
      transfer_data,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    return paymentIntent;
  } catch (error) {
    console.error('Error creating Connect payment intent:', error);
    throw error;
  }
}

// Confirm a payment intent
export async function confirmPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    throw error;
  }
}

// Get Connect account link for onboarding
export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
    return accountLink;
  } catch (error) {
    console.error('Error creating account link:', error);
    throw error;
  }
}

// Calculate platform fee (e.g., 10%)
export function calculatePlatformFee(amount: number, feePercentage: number = 0.10) {
  return amount * feePercentage;
}

// Calculate seller amount after platform fee
export function calculateSellerAmount(amount: number, feePercentage: number = 0.10) {
  return amount * (1 - feePercentage);
} 