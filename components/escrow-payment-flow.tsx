'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  Lock, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  CreditCard,
  Shield,
  ArrowRight
} from 'lucide-react';
import { useSession } from '@/components/providers/session-provider';
import { useToast } from '@/components/ui/use-toast';
import { initializeDealPayment, releaseEscrowFunds, refundEscrowFunds, Deal } from '@/lib/deals';
import { loadStripe } from '@stripe/stripe-js';
import { motion } from 'framer-motion';

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface EscrowPaymentFlowProps {
  deal: Deal;
  onStatusUpdate: () => void;
}

export function EscrowPaymentFlow({ deal, onStatusUpdate }: EscrowPaymentFlowProps) {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'released' | 'refunded'>('pending');
  const { user } = useSession();
  const { toast } = useToast();

  const isBuyer = user?.id === deal.buyer_id;
  const isSeller = user?.id === deal.seller_id;

  useEffect(() => {
    // Check if payment has been made
    if (deal.stripe_payment_intent_id) {
      setPaymentStatus('paid');
    }
  }, [deal.stripe_payment_intent_id]);

  const handlePayment = async () => {
    if (!isBuyer) return;

    setLoading(true);
    try {
      const paymentData = await initializeDealPayment(deal.id);
      if (!paymentData) {
        throw new Error('Failed to initialize payment');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.confirmPayment({
        clientSecret: paymentData.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/deals/${deal.id}?payment_success=true`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseFunds = async () => {
    if (!isBuyer) return;

    setLoading(true);
    try {
      // For now, we'll use a placeholder Connect account ID
      // In a real implementation, you'd get this from the seller's profile
      const success = await releaseEscrowFunds(deal.id, 'acct_placeholder');
      
      if (success) {
        setPaymentStatus('released');
        toast({
          title: "Funds Released",
          description: "Payment has been released to the seller.",
        });
        onStatusUpdate();
      } else {
        throw new Error('Failed to release funds');
      }
    } catch (error) {
      console.error('Release error:', error);
      toast({
        title: "Release Failed",
        description: "Failed to release funds. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!isBuyer) return;

    setLoading(true);
    try {
      const success = await refundEscrowFunds(deal.id);
      
      if (success) {
        setPaymentStatus('refunded');
        toast({
          title: "Refund Processed",
          description: "Your payment has been refunded.",
        });
        onStatusUpdate();
      } else {
        throw new Error('Failed to process refund');
      }
    } catch (error) {
      console.error('Refund error:', error);
      toast({
        title: "Refund Failed",
        description: "Failed to process refund. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatus = () => {
    if (paymentStatus === 'refunded') return 'Refunded';
    if (paymentStatus === 'released') return 'Released to Seller';
    if (paymentStatus === 'paid') return 'Paid & Held in Escrow';
    return 'Payment Pending';
  };

  const getStatusColor = () => {
    if (paymentStatus === 'refunded') return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    if (paymentStatus === 'released') return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (paymentStatus === 'paid') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
  };

  const getStatusIcon = () => {
    if (paymentStatus === 'refunded') return <AlertCircle className="h-4 w-4" />;
    if (paymentStatus === 'released') return <CheckCircle className="h-4 w-4" />;
    if (paymentStatus === 'paid') return <Lock className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Escrow Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor()}>
              {getStatusIcon()}
              {getPaymentStatus()}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">${deal.amount}</p>
            <p className="text-sm text-muted-foreground">{deal.currency}</p>
          </div>
        </div>

        <Separator />

        {/* Escrow Process */}
        <div className="space-y-4">
          <h4 className="font-semibold">How Escrow Works:</h4>
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Payment Made</p>
                <p className="text-sm text-muted-foreground">Funds are held securely by our platform</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">Work Completed</p>
                <p className="text-sm text-muted-foreground">Both parties confirm completion</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">Funds Released</p>
                <p className="text-sm text-muted-foreground">Payment is transferred to seller</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-3">
          {isBuyer && paymentStatus === 'pending' && (
            <Button 
              onClick={handlePayment} 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <motion.div
                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay ${deal.amount} (Held in Escrow)
                </>
              )}
            </Button>
          )}

          {isBuyer && paymentStatus === 'paid' && deal.status === 'accepted' && (
            <div className="space-y-2">
              <Button 
                onClick={handleReleaseFunds} 
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <motion.div
                      className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Releasing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Release Payment to Seller
                  </>
                )}
              </Button>
              <Button 
                onClick={handleRefund} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Request Refund
              </Button>
            </div>
          )}

          {isSeller && paymentStatus === 'paid' && (
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Payment is held in escrow. Once the work is completed and the buyer confirms, 
                the funds will be released to your account.
              </p>
            </div>
          )}

          {paymentStatus === 'released' && (
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                Payment has been released to the seller. The deal is now complete.
              </p>
            </div>
          )}

          {paymentStatus === 'refunded' && (
            <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                Payment has been refunded to the buyer. The deal has been cancelled.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 