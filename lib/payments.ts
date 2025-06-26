import Stripe from 'stripe';
import { ResponseService } from './responses';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export interface PaymentIntentData {
  amount: number;
  currency: string;
  responseId: string;
  metadata: {
    responseId: string;
    listingId: string;
    responderId: string;
    listingOwnerId: string;
  };
}

export interface TransferData {
  amount: number;
  currency: string;
  destination: string; // Stripe account ID
  metadata: {
    responseId: string;
    transactionId: string;
  };
}

export class PaymentService {
  // Commission de la plateforme (5%)
  static readonly PLATFORM_FEE_PERCENTAGE = 0.05;

  // Créer un Payment Intent pour une réponse
  static async createPaymentIntent(paymentData: PaymentIntentData): Promise<{ data: Stripe.PaymentIntent | null; error: any }> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(paymentData.amount * 100), // Stripe utilise les centimes
        currency: paymentData.currency.toLowerCase(),
        metadata: paymentData.metadata,
        automatic_payment_methods: {
          enabled: true,
        },
        application_fee_amount: Math.round(paymentData.amount * 100 * this.PLATFORM_FEE_PERCENTAGE),
      });

      return { data: paymentIntent, error: null };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return { data: null, error };
    }
  }

  // Confirmer un paiement
  static async confirmPayment(paymentIntentId: string): Promise<{ data: Stripe.PaymentIntent | null; error: any }> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        return { data: paymentIntent, error: null };
      }

      return { data: null, error: 'Payment not succeeded' };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return { data: null, error };
    }
  }

  // Effectuer un transfert vers le vendeur
  static async createTransfer(transferData: TransferData): Promise<{ data: Stripe.Transfer | null; error: any }> {
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(transferData.amount * 100),
        currency: transferData.currency.toLowerCase(),
        destination: transferData.destination,
        metadata: transferData.metadata,
      });

      return { data: transfer, error: null };
    } catch (error) {
      console.error('Error creating transfer:', error);
      return { data: null, error };
    }
  }

  // Rembourser un paiement
  static async refundPayment(paymentIntentId: string, amount?: number): Promise<{ data: Stripe.Refund | null; error: any }> {
    try {
      const refundData: any = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      const refund = await stripe.refunds.create(refundData);

      return { data: refund, error: null };
    } catch (error) {
      console.error('Error creating refund:', error);
      return { data: null, error };
    }
  }

  // Obtenir les détails d'un Payment Intent
  static async getPaymentIntent(paymentIntentId: string): Promise<{ data: Stripe.PaymentIntent | null; error: any }> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return { data: paymentIntent, error: null };
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      return { data: null, error };
    }
  }

  // Calculer les frais de plateforme
  static calculatePlatformFee(amount: number): number {
    return amount * this.PLATFORM_FEE_PERCENTAGE;
  }

  // Calculer le montant net pour le vendeur
  static calculateNetAmount(amount: number): number {
    return amount - this.calculatePlatformFee(amount);
  }

  // Traiter l'acceptation d'une réponse avec paiement
  static async processResponseAcceptance(responseId: string): Promise<{ data: any; error: any }> {
    try {
      // 1. Récupérer les détails de la réponse
      const { data: response, error: responseError } = await ResponseService.getResponseWithDetails(responseId);
      if (responseError || !response) {
        return { data: null, error: 'Response not found' };
      }

      // 2. Vérifier qu'il y a un montant proposé
      if (!response.proposed_amount) {
        return { data: null, error: 'No amount specified for this response' };
      }

      // 3. Créer une transaction en base
      const platformFee = this.calculatePlatformFee(response.proposed_amount);
      const { data: transaction, error: transactionError } = await ResponseService.createTransaction({
        response_id: responseId,
        amount: response.proposed_amount,
        currency: response.currency,
        status: 'pending',
        platform_fee: platformFee,
      });

      if (transactionError || !transaction) {
        return { data: null, error: 'Failed to create transaction' };
      }

      // 4. Créer le Payment Intent Stripe
      const { data: paymentIntent, error: paymentError } = await this.createPaymentIntent({
        amount: response.proposed_amount,
        currency: response.currency,
        responseId: responseId,
        metadata: {
          responseId: responseId,
          listingId: response.listing_id,
          responderId: response.responder_id,
          listingOwnerId: response.listings?.user_id || '',
        },
      });

      if (paymentError || !paymentIntent) {
        return { data: null, error: 'Failed to create payment intent' };
      }

      // 5. Mettre à jour la transaction avec l'ID du Payment Intent
      await ResponseService.updateTransactionStatus(transaction.id, 'pending', {
        payment_intent_id: paymentIntent.id,
      });

      return {
        data: {
          transaction,
          paymentIntent,
          clientSecret: paymentIntent.client_secret,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error processing response acceptance:', error);
      return { data: null, error };
    }
  }

  // Libérer le paiement vers le vendeur
  static async releasePayment(transactionId: string, sellerStripeAccountId: string): Promise<{ data: any; error: any }> {
    try {
      // 1. Récupérer la transaction
      const { data: transaction, error: transactionError } = await ResponseService.getTransaction(transactionId);
      if (transactionError || !transaction) {
        return { data: null, error: 'Transaction not found' };
      }

      // 2. Vérifier que le paiement a été effectué
      if (transaction.status !== 'paid') {
        return { data: null, error: 'Payment not completed' };
      }

      // 3. Calculer le montant net pour le vendeur
      const netAmount = this.calculateNetAmount(transaction.amount);

      // 4. Effectuer le transfert
      const { data: transfer, error: transferError } = await this.createTransfer({
        amount: netAmount,
        currency: transaction.currency,
        destination: sellerStripeAccountId,
        metadata: {
          responseId: transaction.response_id,
          transactionId: transaction.id,
        },
      });

      if (transferError || !transfer) {
        return { data: null, error: 'Failed to create transfer' };
      }

      // 5. Mettre à jour le statut de la transaction
      await ResponseService.updateTransactionStatus(transaction.id, 'released', {
        transfer_id: transfer.id,
      });

      return { data: { transfer, netAmount }, error: null };
    } catch (error) {
      console.error('Error releasing payment:', error);
      return { data: null, error };
    }
  }
} 