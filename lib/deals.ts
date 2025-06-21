import { supabase } from './supabase';
import { createPaymentIntent, createConnectPaymentIntent, calculatePlatformFee, stripe } from './stripe';

export interface Deal {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'counter_offered' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  description?: string;
  terms?: string;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  completed_at?: string;
  stripe_payment_intent_id?: string;
  stripe_connect_account_id?: string;
  // Related data from joins
  listing?: any;
  buyer?: any;
  seller?: any;
}

export interface DealOffer {
  id: string;
  deal_id: string;
  offered_by_id: string;
  amount: number;
  message?: string;
  created_at: string;
}

export interface DealMessage {
  id: string;
  deal_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface DealDeliverable {
  id: string;
  deal_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  file_url?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// Create a new deal
export async function createDeal(
  listingId: string,
  buyerId: string,
  sellerId: string,
  amount: number,
  description?: string,
  terms?: string
): Promise<Deal | null> {
  try {
    // First, get the listing to determine the correct buyer/seller roles
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('listing_type, user_id')
      .eq('id', listingId)
      .single();

    if (listingError) throw listingError;

    // Define freelancer search listing types where the listing owner should be the buyer
    const freelancerSearchTypes = ['expert-freelance', 'employee', 'mentor', 'job'];
    
    let finalBuyerId = buyerId;
    let finalSellerId = sellerId;

    // For freelancer search listings, swap the roles
    if (freelancerSearchTypes.includes(listing.listing_type)) {
      // Listing owner (who is looking for a freelancer) becomes the buyer
      // Person making the deal (the freelancer) becomes the seller
      finalBuyerId = listing.user_id;
      finalSellerId = buyerId; // The person making the deal
    }

    const { data, error } = await supabase
      .from('deals')
      .insert({
        listing_id: listingId,
        buyer_id: finalBuyerId,
        seller_id: finalSellerId,
        amount,
        description,
        terms,
        currency: 'USD'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating deal:', error);
    return null;
  }
}

// Get deals for a user (as buyer or seller)
export async function getUserDeals(userId: string): Promise<Deal[]> {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        listing:listings(*),
        buyer:profiles!deals_buyer_id_fkey(*),
        seller:profiles!deals_seller_id_fkey(*)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user deals:', error);
    return [];
  }
}

// Get a specific deal with all related data
export async function getDeal(dealId: string): Promise<Deal | null> {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        listing:listings(*),
        buyer:profiles!deals_buyer_id_fkey(*),
        seller:profiles!deals_seller_id_fkey(*)
      `)
      .eq('id', dealId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching deal:', error);
    return null;
  }
}

// Update deal status
export async function updateDealStatus(dealId: string, status: Deal['status']): Promise<boolean> {
  try {
    const updateData: any = { status };
    
    if (status === 'accepted') {
      updateData.accepted_at = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', dealId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating deal status:', error);
    return false;
  }
}

// Create a counter offer
export async function createCounterOffer(
  dealId: string,
  offeredById: string,
  amount: number,
  message?: string
): Promise<DealOffer | null> {
  try {
    const { data, error } = await supabase
      .from('deal_offers')
      .insert({
        deal_id: dealId,
        offered_by_id: offeredById,
        amount,
        message
      })
      .select()
      .single();

    if (error) throw error;

    // Update deal status to counter_offered
    await updateDealStatus(dealId, 'counter_offered');

    return data;
  } catch (error) {
    console.error('Error creating counter offer:', error);
    return null;
  }
}

// Get counter offers for a deal
export async function getDealOffers(dealId: string): Promise<DealOffer[]> {
  try {
    const { data, error } = await supabase
      .from('deal_offers')
      .select(`
        *,
        offered_by:profiles!deal_offers_offered_by_id_fkey(*)
      `)
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching deal offers:', error);
    return [];
  }
}

// Send a message in a deal
export async function sendDealMessage(
  dealId: string,
  senderId: string,
  content: string
): Promise<DealMessage | null> {
  try {
    const { data, error } = await supabase
      .from('deal_messages')
      .insert({
        deal_id: dealId,
        sender_id: senderId,
        content
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending deal message:', error);
    return null;
  }
}

// Get messages for a deal
export async function getDealMessages(dealId: string): Promise<DealMessage[]> {
  try {
    const { data, error } = await supabase
      .from('deal_messages')
      .select(`
        *,
        sender:profiles!deal_messages_sender_id_fkey(*)
      `)
      .eq('deal_id', dealId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching deal messages:', error);
    return [];
  }
}

// Create a deliverable
export async function createDeliverable(
  dealId: string,
  title: string,
  description?: string
): Promise<DealDeliverable | null> {
  try {
    const { data, error } = await supabase
      .from('deal_deliverables')
      .insert({
        deal_id: dealId,
        title,
        description
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating deliverable:', error);
    return null;
  }
}

// Update deliverable status
export async function updateDeliverableStatus(
  deliverableId: string,
  status: DealDeliverable['status']
): Promise<boolean> {
  try {
    const updateData: any = { status };
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('deal_deliverables')
      .update(updateData)
      .eq('id', deliverableId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating deliverable status:', error);
    return false;
  }
}

// Get deliverables for a deal
export async function getDealDeliverables(dealId: string): Promise<DealDeliverable[]> {
  try {
    const { data, error } = await supabase
      .from('deal_deliverables')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching deal deliverables:', error);
    return [];
  }
}

// Initialize payment for a deal
export async function initializeDealPayment(dealId: string): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
  try {
    const deal = await getDeal(dealId);
    if (!deal) throw new Error('Deal not found');

    // Always use platform-held escrow for security
    const paymentIntent = await createPaymentIntent(
      deal.amount,
      deal.currency.toLowerCase(),
      { deal_id: dealId }
    );

    // Update deal with payment intent ID
    await supabase
      .from('deals')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', dealId);

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('Error initializing deal payment:', error);
    return null;
  }
}

// Release escrow funds to seller
export async function releaseEscrowFunds(dealId: string, sellerStripeAccountId: string): Promise<boolean> {
  try {
    const deal = await getDeal(dealId);
    if (!deal || !deal.stripe_payment_intent_id) {
      throw new Error('Deal or payment intent not found');
    }

    // Create a transfer to the seller's Connect account
    const transfer = await stripe.transfers.create({
      amount: Math.round(deal.amount * 100), // Convert to cents
      currency: deal.currency.toLowerCase(),
      destination: sellerStripeAccountId,
      source_transaction: deal.stripe_payment_intent_id,
      metadata: {
        deal_id: dealId,
        type: 'escrow_release'
      }
    });

    // Update deal status to completed
    await updateDealStatus(dealId, 'completed');

    return true;
  } catch (error) {
    console.error('Error releasing escrow funds:', error);
    return false;
  }
}

// Refund escrow funds to buyer
export async function refundEscrowFunds(dealId: string): Promise<boolean> {
  try {
    const deal = await getDeal(dealId);
    if (!deal || !deal.stripe_payment_intent_id) {
      throw new Error('Deal or payment intent not found');
    }

    // Create a refund
    const refund = await stripe.refunds.create({
      payment_intent: deal.stripe_payment_intent_id,
      metadata: {
        deal_id: dealId,
        type: 'escrow_refund'
      }
    });

    // Update deal status to cancelled
    await updateDealStatus(dealId, 'cancelled');

    return true;
  } catch (error) {
    console.error('Error refunding escrow funds:', error);
    return false;
  }
} 