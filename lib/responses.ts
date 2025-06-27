import { supabase } from './supabase';
import { stripe, createConnectPaymentIntent, calculatePlatformFee, calculateSellerAmount } from './stripe';
import { sendMessage, sendSystemMessage } from './messages';

// Define which party should make the escrow payment based on listing type
const ESCROW_PAYMENT_RESPONSIBILITY: Record<string, 'lister' | 'responder'> = {
  // Founder listing types
  "find-funding": "responder", // The user that makes the response needs to make the escrow payment
  "cofounder": "lister", // The lister makes the escrow payment
  "expert-freelance": "lister", // The lister makes the escrow payment
  "employee": "lister", // The lister makes the payment
  "mentor": "lister", // The lister makes the payment
  "sell-startup": "responder", // The user that makes the response needs to make the escrow payment
  
  // Investor listing types
  "investment-opportunity": "lister", // The lister makes the payment
  "buy-startup": "responder", // The user that makes the response needs to make the escrow payment
  "co-investor": "lister", // Default to lister for co-investor
  
  // Expert listing types
  "mission": "responder", // The answerer makes the response
  "job": "lister" // The lister makes the payment
};

export interface ListingResponse {
  id: string;
  listing_id: string;
  responder_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'in_escrow' | 'completed' | 'disputed' | 'cancelled';
  type: string;
  message: string;
  proposed_amount: number;
  currency: string;
  terms: string;
  attachments: any;
  created_at: string;
  updated_at: string;
  responder?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    username?: string;
  };
  escrow_transaction?: EscrowTransaction;
  messages?: ResponseMessage[];
  listing?: {
    id: string;
    title: string;
    user_id: string;
    listing_type: string;
  };
}

export interface EscrowTransaction {
  id: string;
  response_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  stripe_payment_intent_id: string;
  stripe_connect_account_id?: string;
  status: 'pending' | 'funded' | 'released' | 'refunded' | 'disputed';
  platform_fee: number;
  seller_amount: number;
  created_at: string;
  updated_at: string;
}

export interface ResponseMessage {
  id: string;
  response_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export async function fetchListingResponses(listingId: string): Promise<ListingResponse[]> {
  const { data, error } = await supabase
    .from('listing_responses')
    .select(`
      *,
      responder:profiles(id, full_name, avatar_url, username),
      escrow_transaction:escrow_transactions(*),
      messages:response_messages(
        *,
        sender:profiles(id, full_name, avatar_url)
      ),
      listing:listings(id, title, user_id, listing_type)
    `)
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching listing responses:', error);
    return [];
  }
  return data as ListingResponse[];
}

export async function createListingResponse(responseData: {
  listing_id: string;
  responder_id: string;
  type: string;
  message: string;
  proposed_amount: number;
  currency: string;
  terms?: string;
  attachments?: any;
}): Promise<ListingResponse | null> {
  const { data, error } = await supabase
    .from('listing_responses')
    .insert([responseData])
    .select(`
      *,
      responder:profiles(id, full_name, avatar_url, username),
      listing:listings(id, title, user_id, listing_type)
    `)
    .single();

  if (error) {
    console.error('Error creating listing response:', error);
    return null;
  }

  const response = data as ListingResponse;

  // Send automatic messages to both parties
  try {
    await sendAutomaticResponseMessages(response);
  } catch (error) {
    console.error('Error sending automatic messages:', error);
    // Don't fail the response creation if messaging fails
  }

  return response;
}

async function sendAutomaticResponseMessages(response: ListingResponse) {
  if (!response.listing) {
    console.error('Listing information not available for messaging');
    return;
  }

  const listingOwnerId = response.listing.user_id;
  const responderId = response.responder_id;
  const listingTitle = response.listing.title;
  const responderName = response.responder?.full_name || response.responder?.username || 'Someone';
  const amount = response.proposed_amount;
  const currency = response.currency;

  // Message to listing owner (from responder)
  const ownerMessage = `🎯 **New Response Received!**

**Listing:** ${listingTitle}
**From:** ${responderName}
**Offer:** ${amount} ${currency}

**Message:**
${response.message}

**Next Steps:**
Review and manage this response at: /dashboard/listings/${response.listing_id}/responses

You can accept, reject, or start escrow once you're ready.`;

  // Message to responder (system message)
  const responderMessage = `📝 **Response Submitted Successfully!**

**Listing:** ${listingTitle}
**Your Offer:** ${amount} ${currency}

**Your Message:**
${response.message}

**What's Next:**
The listing owner will review your response and get back to you soon.

Track your response status at: /dashboard/my-responses

You'll receive notifications when the owner takes action on your response.`;

  try {
    // Send message to listing owner (from responder)
    await sendMessage(listingOwnerId, ownerMessage);
    
    // Send system message to responder
    await sendSystemMessage(responderId, responderMessage);
  } catch (error) {
    console.error('Failed to send automatic messages:', error);
  }
}

export async function updateResponseStatus(
  responseId: string, 
  status: ListingResponse['status']
): Promise<boolean> {
  const { error } = await supabase
    .from('listing_responses')
    .update({ status })
    .eq('id', responseId);

  if (error) {
    console.error('Error updating response status:', error);
    return false;
  }

  // Send status update messages
  try {
    await sendStatusUpdateMessages(responseId, status);
  } catch (error) {
    console.error('Error sending status update messages:', error);
  }

  return true;
}

async function sendStatusUpdateMessages(responseId: string, status: ListingResponse['status']) {
  // Get response details with listing and responder info
  const { data: response, error } = await supabase
    .from('listing_responses')
    .select(`
      *,
      responder:profiles(id, full_name, avatar_url, username),
      listing:listings(id, title, user_id, listing_type)
    `)
    .eq('id', responseId)
    .single();

  if (error || !response) {
    console.error('Error fetching response for status update messages:', error);
    return;
  }

  const listingOwnerId = response.listing.user_id;
  const responderId = response.responder_id;
  const listingTitle = response.listing.title;
  const listingType = response.listing.listing_type;
  const responderName = response.responder?.full_name || response.responder?.username || 'Someone';
  const amount = response.proposed_amount;
  const currency = response.currency;

  // Determine who should make the escrow payment based on listing type
  const paymentResponsibility = ESCROW_PAYMENT_RESPONSIBILITY[listingType] || 'lister';
  const isListerPaying = paymentResponsibility === 'lister';
  const isResponderPaying = paymentResponsibility === 'responder';

  let ownerMessage = '';
  let responderMessage = '';

  switch (status) {
    case 'accepted':
      ownerMessage = `✅ **Response Accepted!**

**Listing:** ${listingTitle}
**Responder:** ${responderName}
**Amount:** ${amount} ${currency}

You've accepted this response. ${isListerPaying ? 'You will need to make the escrow payment to proceed.' : 'The responder will make the escrow payment to proceed.'}

**Manage Response:** /dashboard/listings/${response.listing_id}/responses`;

      responderMessage = `🎉 **Your Response Was Accepted!**

**Listing:** ${listingTitle}
**Amount:** ${amount} ${currency}

Congratulations! The listing owner has accepted your response.

**Next Steps:**
${isResponderPaying ? 'You will need to make the escrow payment to secure this deal.' : 'The listing owner will make the escrow payment to proceed.'}

**Track Your Response:** /dashboard/my-responses`;
      break;

    case 'rejected':
      ownerMessage = `❌ **Response Rejected**

**Listing:** ${listingTitle}
**Responder:** ${responderName}
**Amount:** ${amount} ${currency}

You've rejected this response.

**View All Responses:** /dashboard/listings/${response.listing_id}/responses`;

      responderMessage = `😔 **Response Not Accepted**

**Listing:** ${listingTitle}
**Amount:** ${amount} ${currency}

Unfortunately, your response was not accepted by the listing owner.

**Don't Give Up:**
Keep browsing other opportunities - there are many great listings available!

**Browse More Listings:** /dashboard/listings`;
      break;

    case 'in_escrow':
      if (isResponderPaying) {
        ownerMessage = `🔒 **Escrow Started!**

**Listing:** ${listingTitle}
**Responder:** ${responderName}
**Amount:** ${amount} ${currency}

Escrow has been initiated. The responder will complete the payment shortly.

**Manage Escrow:** /dashboard/listings/${response.listing_id}/responses`;

        responderMessage = `💳 **Payment Required for Escrow**

**Listing:** ${listingTitle}
**Amount:** ${amount} ${currency}

Escrow has been started for your response. Please complete the payment to secure this deal.

**Complete Payment:** /dashboard/my-responses

You'll receive payment instructions shortly.`;
      } else {
        ownerMessage = `🔒 **Escrow Started!**

**Listing:** ${listingTitle}
**Responder:** ${responderName}
**Amount:** ${amount} ${currency}

Escrow has been initiated. Please complete the payment to proceed with this deal.

**Complete Payment:** /dashboard/listings/${response.listing_id}/responses

You'll receive payment instructions shortly.`;

        responderMessage = `🔒 **Escrow Started!**

**Listing:** ${listingTitle}
**Amount:** ${amount} ${currency}

Escrow has been started for your response. The listing owner will complete the payment shortly.

**Track Your Response:** /dashboard/my-responses`;
      }
      break;

    case 'completed':
      ownerMessage = `✅ **Deal Completed Successfully!**

**Listing:** ${listingTitle}
**Responder:** ${responderName}
**Amount:** ${amount} ${currency}

The escrow has been completed and funds have been released to ${isResponderPaying ? 'you' : responderName}.

**View Completed Deals:** /dashboard/listings/${response.listing_id}/responses`;

      responderMessage = `💰 **Payment Received!**

**Listing:** ${listingTitle}
**Amount:** ${amount} ${currency}

Your escrow has been completed successfully. The funds have been released to your account.

**View Your Earnings:** /dashboard/my-responses

Thank you for using our platform!`;
      break;
  }

  if (ownerMessage) {
    try {
      await sendMessage(listingOwnerId, ownerMessage);
    } catch (error) {
      console.error('Failed to send owner status update message:', error);
    }
  }

  if (responderMessage) {
    try {
      await sendSystemMessage(responderId, responderMessage);
    } catch (error) {
      console.error('Failed to send responder status update message:', error);
    }
  }
}

export async function createEscrowTransaction(escrowData: {
  response_id: string;
  amount: number;
  currency: string;
  stripe_connect_account_id?: string;
}): Promise<EscrowTransaction | null> {
  // Get response details to determine payment responsibility
  const { data: response, error: responseError } = await supabase
    .from('listing_responses')
    .select(`
      *,
      listing:listings(id, title, user_id, listing_type)
    `)
    .eq('id', escrowData.response_id)
    .single();

  if (responseError || !response) {
    console.error('Error fetching response for escrow creation:', responseError);
    return null;
  }

  const listingType = response.listing.listing_type;
  const paymentResponsibility = ESCROW_PAYMENT_RESPONSIBILITY[listingType] || 'lister';
  
  // Determine buyer and seller based on payment responsibility
  const buyer_id = paymentResponsibility === 'responder' ? response.responder_id : response.listing.user_id;
  const seller_id = paymentResponsibility === 'responder' ? response.listing.user_id : response.responder_id;

  const platformFee = calculatePlatformFee(escrowData.amount);
  const sellerAmount = calculateSellerAmount(escrowData.amount);

  // Create Stripe payment intent
  let paymentIntent;
  try {
    if (escrowData.stripe_connect_account_id) {
      paymentIntent = await createConnectPaymentIntent(
        escrowData.amount,
        escrowData.currency.toLowerCase(),
        platformFee,
        { destination: escrowData.stripe_connect_account_id },
        { response_id: escrowData.response_id }
      );
    } else {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(escrowData.amount * 100),
        currency: escrowData.currency.toLowerCase(),
        metadata: { response_id: escrowData.response_id },
        automatic_payment_methods: { enabled: true },
      });
    }
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return null;
  }

  // Create escrow transaction record
  const { data, error } = await supabase
    .from('escrow_transactions')
    .insert([{
      response_id: escrowData.response_id,
      buyer_id,
      seller_id,
      amount: escrowData.amount,
      currency: escrowData.currency,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_connect_account_id: escrowData.stripe_connect_account_id,
      platform_fee: platformFee,
      seller_amount: sellerAmount,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating escrow transaction:', error);
    return null;
  }

  // Update response status to in_escrow
  await updateResponseStatus(escrowData.response_id, 'in_escrow');

  return data as EscrowTransaction;
}

export async function releaseEscrowFunds(
  escrowTransactionId: string,
  releaseData: {
    released_by_id: string;
    release_type: 'full' | 'partial' | 'refund';
    amount: number;
    reason?: string;
  }
): Promise<boolean> {
  // Get escrow transaction
  const { data: escrowData, error: escrowError } = await supabase
    .from('escrow_transactions')
    .select('*')
    .eq('id', escrowTransactionId)
    .single();

  if (escrowError || !escrowData) {
    console.error('Error fetching escrow transaction:', escrowError);
    return false;
  }

  // Create release record
  const { error: releaseError } = await supabase
    .from('escrow_releases')
    .insert([{
      escrow_transaction_id: escrowTransactionId,
      ...releaseData,
    }]);

  if (releaseError) {
    console.error('Error creating escrow release:', releaseError);
    return false;
  }

  // Update escrow transaction status
  const newStatus = releaseData.release_type === 'refund' ? 'refunded' : 'released';
  const { error: updateError } = await supabase
    .from('escrow_transactions')
    .update({ status: newStatus })
    .eq('id', escrowTransactionId);

  if (updateError) {
    console.error('Error updating escrow transaction status:', updateError);
    return false;
  }

  // Update response status to completed if full release
  if (releaseData.release_type === 'full') {
    await updateResponseStatus(escrowData.response_id, 'completed');
  }

  return true;
}

export async function sendResponseMessage(messageData: {
  response_id: string;
  sender_id: string;
  message: string;
}): Promise<ResponseMessage | null> {
  const { data, error } = await supabase
    .from('response_messages')
    .insert([messageData])
    .select(`
      *,
      sender:profiles(id, full_name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error sending response message:', error);
    return null;
  }
  return data as ResponseMessage;
}

export async function fetchResponseMessages(responseId: string): Promise<ResponseMessage[]> {
  const { data, error } = await supabase
    .from('response_messages')
    .select(`
      *,
      sender:profiles(id, full_name, avatar_url)
    `)
    .eq('response_id', responseId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching response messages:', error);
    return [];
  }
  return data as ResponseMessage[];
}

export async function getUserResponses(userId: string): Promise<ListingResponse[]> {
  const { data, error } = await supabase
    .from('listing_responses')
    .select(`
      *,
      responder:profiles(id, full_name, avatar_url, username),
      escrow_transaction:escrow_transactions(*),
      listing:listings(id, title, user_id, listing_type)
    `)
    .eq('responder_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user responses:', error);
    return [];
  }
  return data as ListingResponse[];
}

export async function getEscrowTransaction(responseId: string): Promise<EscrowTransaction | null> {
  const { data, error } = await supabase
    .from('escrow_transactions')
    .select('*')
    .eq('response_id', responseId)
    .single();

  if (error) {
    console.error('Error fetching escrow transaction:', error);
    return null;
  }
  return data as EscrowTransaction;
}

// Helper function to determine who should make the escrow payment
export function getPaymentResponsibility(listingType: string): 'lister' | 'responder' {
  return ESCROW_PAYMENT_RESPONSIBILITY[listingType] || 'lister';
}

// Helper function to check if a user should make the payment for a response
export function shouldUserMakePayment(response: ListingResponse, userId: string): boolean {
  if (!response.listing?.listing_type) return false;
  
  const paymentResponsibility = getPaymentResponsibility(response.listing.listing_type);
  const isLister = response.listing.user_id === userId;
  const isResponder = response.responder_id === userId;
  
  if (paymentResponsibility === 'lister' && isLister) return true;
  if (paymentResponsibility === 'responder' && isResponder) return true;
  
  return false;
} 