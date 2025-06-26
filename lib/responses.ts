import { supabase } from './supabase';
import { Database } from './database.types';

type ListingResponse = Database['public']['Tables']['listing_responses']['Row'];
type ListingResponseInsert = Database['public']['Tables']['listing_responses']['Insert'];
type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type ResponseMessage = Database['public']['Tables']['response_messages']['Row'];
type ResponseMessageInsert = Database['public']['Tables']['response_messages']['Insert'];

export interface ResponseWithDetails extends ListingResponse {
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    professional_role: string | null;
  } | null;
  listings: {
    id: string;
    title: string | null;
    user_id: string | null;
  } | null;
  transactions: Transaction[];
  _count: {
    response_messages: number;
  };
}

export interface ResponseMessageWithProfile extends ResponseMessage {
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export class ResponseService {
  // Créer une nouvelle réponse
  static async createResponse(response: ListingResponseInsert): Promise<{ data: ListingResponse | null; error: any }> {
    const { data, error } = await supabase
      .from('listing_responses')
      .insert(response)
      .select()
      .single();

    return { data, error };
  }

  // Obtenir toutes les réponses pour une annonce
  static async getResponsesForListing(listingId: string): Promise<{ data: ResponseWithDetails[] | null; error: any }> {
    const { data, error } = await supabase
      .from('listing_responses')
      .select(`
        *,
        profiles!listing_responses_responder_id_fkey(id, full_name, avatar_url, professional_role),
        listings(id, title, user_id),
        transactions(*),
        _count(response_messages)
      `)
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  // Obtenir les réponses d'un utilisateur
  static async getUserResponses(userId: string): Promise<{ data: ResponseWithDetails[] | null; error: any }> {
    const { data, error } = await supabase
      .from('listing_responses')
      .select(`
        *,
        profiles!listing_responses_responder_id_fkey(id, full_name, avatar_url, professional_role),
        listings(id, title, user_id),
        transactions(*),
        _count(response_messages)
      `)
      .eq('responder_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  // Obtenir les réponses reçues pour les annonces d'un utilisateur
  static async getReceivedResponses(userId: string): Promise<{ data: ResponseWithDetails[] | null; error: any }> {
    // D'abord, récupérer les IDs des annonces de l'utilisateur
    const { data: userListings, error: listingsError } = await supabase
      .from('listings')
      .select('id')
      .eq('user_id', userId);

    if (listingsError) {
      return { data: null, error: listingsError };
    }

    if (!userListings || userListings.length === 0) {
      return { data: [], error: null };
    }

    const listingIds = userListings.map(listing => listing.id);

    // Ensuite, récupérer les réponses pour ces annonces
    const { data, error } = await supabase
      .from('listing_responses')
      .select(`
        *,
        profiles!listing_responses_responder_id_fkey(id, full_name, avatar_url, professional_role),
        listings(id, title, user_id),
        transactions(*),
        _count(response_messages)
      `)
      .in('listing_id', listingIds)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  // Mettre à jour le statut d'une réponse
  static async updateResponseStatus(responseId: string, status: ListingResponse['status']): Promise<{ data: ListingResponse | null; error: any }> {
    const { data, error } = await supabase
      .from('listing_responses')
      .update({ status })
      .eq('id', responseId)
      .select()
      .single();

    return { data, error };
  }

  // Créer une transaction
  static async createTransaction(transaction: TransactionInsert): Promise<{ data: Transaction | null; error: any }> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();

    return { data, error };
  }

  // Mettre à jour le statut d'une transaction
  static async updateTransactionStatus(transactionId: string, status: Transaction['status'], stripeData?: { payment_intent_id?: string; transfer_id?: string }): Promise<{ data: Transaction | null; error: any }> {
    const updateData: any = { status };
    if (stripeData?.payment_intent_id) updateData.stripe_payment_intent_id = stripeData.payment_intent_id;
    if (stripeData?.transfer_id) updateData.stripe_transfer_id = stripeData.transfer_id;

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)
      .select()
      .single();

    return { data, error };
  }

  // Obtenir les messages d'une réponse
  static async getResponseMessages(responseId: string): Promise<{ data: ResponseMessageWithProfile[] | null; error: any }> {
    const { data, error } = await supabase
      .from('response_messages')
      .select(`
        *,
        profiles!response_messages_sender_id_fkey(id, full_name, avatar_url)
      `)
      .eq('response_id', responseId)
      .order('created_at', { ascending: true });

    return { data, error };
  }

  // Envoyer un message
  static async sendMessage(message: ResponseMessageInsert): Promise<{ data: ResponseMessage | null; error: any }> {
    const { data, error } = await supabase
      .from('response_messages')
      .insert(message)
      .select()
      .single();

    return { data, error };
  }

  // Obtenir une réponse avec tous ses détails
  static async getResponseWithDetails(responseId: string): Promise<{ data: ResponseWithDetails | null; error: any }> {
    const { data, error } = await supabase
      .from('listing_responses')
      .select(`
        *,
        profiles!listing_responses_responder_id_fkey(id, full_name, avatar_url, professional_role),
        listings(id, title, user_id),
        transactions(*),
        _count(response_messages)
      `)
      .eq('id', responseId)
      .single();

    return { data, error };
  }

  // Vérifier si un utilisateur a déjà répondu à une annonce
  static async hasUserResponded(listingId: string, userId: string): Promise<{ data: boolean; error: any }> {
    const { data, error } = await supabase
      .from('listing_responses')
      .select('id')
      .eq('listing_id', listingId)
      .eq('responder_id', userId)
      .single();

    return { data: !!data, error };
  }

  // Obtenir une transaction par ID
  static async getTransaction(transactionId: string): Promise<{ data: Transaction | null; error: any }> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    return { data, error };
  }

  // Obtenir les statistiques des réponses
  static async getResponseStats(userId: string): Promise<{ data: { sent: number; received: number; pending: number; accepted: number } | null; error: any }> {
    try {
      // Réponses envoyées
      const { data: sentResponses, error: sentError } = await supabase
        .from('listing_responses')
        .select('status')
        .eq('responder_id', userId);

      if (sentError) {
        return { data: null, error: sentError };
      }

      // Réponses reçues - d'abord récupérer les IDs des annonces de l'utilisateur
      const { data: userListings, error: listingsError } = await supabase
        .from('listings')
        .select('id')
        .eq('user_id', userId);

      if (listingsError) {
        return { data: null, error: listingsError };
      }

      let receivedResponses: any[] = [];
      if (userListings && userListings.length > 0) {
        const listingIds = userListings.map(listing => listing.id);
        const { data: receivedData, error: receivedError } = await supabase
          .from('listing_responses')
          .select('status')
          .in('listing_id', listingIds);

        if (receivedError) {
          return { data: null, error: receivedError };
        }
        receivedResponses = receivedData || [];
      }

      const allResponses = [...(sentResponses || []), ...receivedResponses];
      
      const stats = {
        sent: sentResponses?.length || 0,
        received: receivedResponses.length,
        pending: allResponses.filter(r => r.status === 'pending').length,
        accepted: allResponses.filter(r => r.status === 'accepted').length,
      };

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to fetch response stats' };
    }
  }
} 