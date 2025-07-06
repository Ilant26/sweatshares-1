import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './database.types';
import { stripe, createPaymentIntent, createConnectAccount } from './stripe';

// Escrow transaction types
export interface EscrowTransaction {
  id: string;
  invoice_id: string;
  stripe_payment_intent_id: string;
  stripe_connect_account_id?: string;
  amount: number;
  currency: string;
  transaction_type: 'work' | 'business_sale' | 'partnership' | 'service' | 'consulting' | 'investment' | 'other';
  status: 'pending' | 'paid_in_escrow' | 'work_completed' | 'approved' | 'revision_requested' | 'disputed' | 'released' | 'refunded';
  payer_id: string;
  payee_id: string;
  completion_deadline_days: number;
  review_period_days: number;
  completion_deadline_date?: string;
  auto_release_date?: string;
  completion_submitted_at?: string;
  completion_approved_at?: string;
  funds_released_at?: string;
  dispute_reason?: string;
  transaction_description?: string;
  completion_proof: {
    files?: string[];
    links?: string[];
    notes?: string;
    description?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface EscrowDispute {
  id: string;
  escrow_transaction_id: string;
  disputer_id: string;
  reason: string;
  evidence?: string;
  status: 'open' | 'under_review' | 'resolved_for_payer' | 'resolved_for_payee';
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface StripeConnectAccount {
  id: string;
  user_id: string;
  stripe_account_id: string;
  account_status: 'pending' | 'active' | 'restricted' | 'disabled';
  onboarding_completed: boolean;
  payouts_enabled: boolean;
  charges_enabled: boolean;
  user_type: 'Founder' | 'Investor' | 'Expert' | 'Freelancer' | 'Consultant';
  created_at: string;
  updated_at: string;
}

// Timeline configuration by transaction type
export const TIMELINE_CONFIG = {
  work: { completion_deadline_days: 30, review_period_days: 7 },
  service: { completion_deadline_days: 30, review_period_days: 7 },
  consulting: { completion_deadline_days: 45, review_period_days: 10 },
  partnership: { completion_deadline_days: 60, review_period_days: 10 },
  business_sale: { completion_deadline_days: 90, review_period_days: 14 },
  investment: { completion_deadline_days: 120, review_period_days: 14 },
  other: { completion_deadline_days: 30, review_period_days: 7 }
} as const;

// Create escrow transaction
export async function createEscrowTransaction(
  supabase: any,
  invoiceId: string,
  amount: number,
  transactionType: EscrowTransaction['transaction_type'],
  payerId: string,
  payeeId: string,
  description?: string,
  customTimeline?: { completion_deadline_days: number; review_period_days: number }
) {
  const timeline = customTimeline || TIMELINE_CONFIG[transactionType];
  
  // Look up the payee's Stripe Connect account
  let stripeConnectAccountId = null;
  try {
    const { data: connectAccount, error: connectError } = await supabase
      .from('stripe_connect_accounts')
      .select('stripe_account_id')
      .eq('user_id', payeeId)
      .eq('account_status', 'active')
      .eq('onboarding_completed', true)
      .single();

    if (!connectError && connectAccount) {
      stripeConnectAccountId = connectAccount.stripe_account_id;
      console.log('Found payee Stripe Connect account:', stripeConnectAccountId);
    } else {
      console.log('Payee does not have an active Stripe Connect account:', connectError);
    }
  } catch (error) {
    console.error('Error looking up payee Stripe Connect account:', error);
  }
  
  const { data, error } = await supabase
    .from('escrow_transactions')
    .insert({
      invoice_id: invoiceId,
      amount,
      currency: 'EUR',
      transaction_type: transactionType,
      status: 'pending',
      payer_id: payerId,
      payee_id: payeeId,
      stripe_connect_account_id: stripeConnectAccountId,
      completion_deadline_days: timeline.completion_deadline_days,
      review_period_days: timeline.review_period_days,
      transaction_description: description
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get escrow transactions for a user
export async function getEscrowTransactions(userId: string) {
  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from('escrow_transactions')
    .select(`
      *,
      invoice:invoices(*)
    `)
    .or(`payer_id.eq.${userId},payee_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Update escrow transaction status
export async function updateEscrowStatus(
  transactionId: string,
  status: EscrowTransaction['status'],
  additionalData?: Partial<EscrowTransaction>
) {
  const supabase = createClientComponentClient<Database>();
  
  const updateData = {
    status,
    ...additionalData
  };

  const { data, error } = await supabase
    .from('escrow_transactions')
    .update(updateData)
    .eq('id', transactionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Submit work completion
export async function submitWorkCompletion(
  transactionId: string,
  completionProof: {
    files?: string[];
    links?: string[];
    notes?: string;
    description?: string;
  }
) {
  return updateEscrowStatus(transactionId, 'work_completed', {
    completion_proof: completionProof
  });
}

// Approve work completion
export async function approveWorkCompletion(transactionId: string) {
  return updateEscrowStatus(transactionId, 'approved');
}

// Request revision
export async function requestRevision(transactionId: string, reason: string) {
  return updateEscrowStatus(transactionId, 'revision_requested', {
    dispute_reason: reason
  });
}

// Create dispute
export async function createDispute(
  transactionId: string,
  disputerId: string,
  reason: string,
  evidence?: string
) {
  const supabase = createClientComponentClient<Database>();
  
  // Update transaction status to disputed
  await updateEscrowStatus(transactionId, 'disputed', {
    dispute_reason: reason
  });

  // Create dispute record
  const { data, error } = await supabase
    .from('escrow_disputes')
    .insert({
      escrow_transaction_id: transactionId,
      disputer_id: disputerId,
      reason,
      evidence,
      status: 'open'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get disputes for a user
export async function getDisputes(userId: string) {
  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from('escrow_disputes')
    .select(`
      *,
      escrow_transaction:escrow_transactions(*)
    `)
    .eq('disputer_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Create Stripe Connect account
export async function createStripeConnectAccount(
  userId: string,
  userType: StripeConnectAccount['user_type']
) {
  const supabase = createClientComponentClient<Database>();
  
  try {
    // Create Connect account in Stripe
    const account = await createConnectAccount(userId, 'EU');
    
    // Store in database
    const { data, error } = await supabase
      .from('stripe_connect_accounts')
      .insert({
        user_id: userId,
        stripe_account_id: account.id,
        account_status: 'pending',
        user_type: userType
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating Connect account:', error);
    throw error;
  }
}

// Get Connect account for user
export async function getConnectAccount(userId: string) {
  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from('stripe_connect_accounts')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data;
}

// Calculate platform fee
export function calculatePlatformFee(amount: number): number {
  const feePercentage = 0.05; // 5%
  const fee = amount * feePercentage;
  return Math.max(2.50, Math.min(50.00, fee)); // Min €2.50, Max €50.00
}

// Calculate seller amount after platform fee
export function calculateSellerAmount(amount: number): number {
  const platformFee = calculatePlatformFee(amount);
  return amount - platformFee;
}

// Get timeline information for a transaction
export function getTimelineInfo(transaction: EscrowTransaction) {
  const now = new Date();
  const completionDeadline = transaction.completion_deadline_date ? new Date(transaction.completion_deadline_date) : null;
  const autoReleaseDate = transaction.auto_release_date ? new Date(transaction.auto_release_date) : null;
  
  return {
    isOverdue: completionDeadline ? now > completionDeadline : false,
    daysUntilDeadline: completionDeadline ? Math.ceil((completionDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null,
    daysUntilAutoRelease: autoReleaseDate ? Math.ceil((autoReleaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null,
    isAutoReleaseImminent: autoReleaseDate ? (autoReleaseDate.getTime() - now.getTime()) < (24 * 60 * 60 * 1000) : false // Within 24 hours
  };
}

// Get status display information
export function getStatusDisplayInfo(status: EscrowTransaction['status']) {
  const statusConfig = {
    pending: { label: 'In Escrow', color: 'default', icon: 'shield' },
    paid_in_escrow: { label: 'Paid in Escrow', color: 'success', icon: 'shield' },
    work_completed: { label: 'Work Completed', color: 'info', icon: 'check-circle' },
    approved: { label: 'Approved', color: 'success', icon: 'check' },
    revision_requested: { label: 'Revision Requested', color: 'warning', icon: 'edit' },
    disputed: { label: 'Disputed', color: 'destructive', icon: 'alert-triangle' },
    released: { label: 'Funds Released', color: 'success', icon: 'dollar-sign' },
    refunded: { label: 'Refunded', color: 'destructive', icon: 'undo' }
  };

  return statusConfig[status] || statusConfig.pending;
} 