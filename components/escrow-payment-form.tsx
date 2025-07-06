'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

interface EscrowPaymentFormProps {
  escrowTransactionId: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function EscrowPaymentForm({ 
  escrowTransactionId, 
  amount, 
  currency, 
  onSuccess, 
  onCancel 
}: EscrowPaymentFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setPaymentStatus('processing');
    setErrorMessage(null);

    try {
      console.log('Creating payment intent for escrow transaction:', escrowTransactionId);

      const response = await fetch('/api/escrow/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escrowTransactionId,
          amount,
          currency: currency.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      console.log('Payment intent created:', data);

      // Load Stripe
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        throw new Error(error.message);
      }

    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setErrorMessage(errorMessage);
      setPaymentStatus('error');
      
      toast({
        title: 'Payment Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Listen for payment success from Stripe redirect
  useEffect(() => {
    const checkPaymentStatus = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      if (sessionId) {
        setLoading(true);
        try {
          const response = await fetch('/api/escrow/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              escrowTransactionId,
            }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            setPaymentStatus('success');
            onSuccess();
          } else {
            throw new Error(data.error || 'Payment verification failed');
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
          setErrorMessage(errorMessage);
          setPaymentStatus('error');
        } finally {
          setLoading(false);
        }
      }
    };

    checkPaymentStatus();
  }, [escrowTransactionId, onSuccess]);

  if (paymentStatus === 'success') {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            Payment Successful
          </CardTitle>
          <CardDescription>
            Your payment has been processed successfully. The funds are now held securely in escrow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 dark:bg-green-950/50 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Funds Secured</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              €{amount.toFixed(2)} is now held in escrow and will be released when work is completed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            Payment Failed
          </CardTitle>
          <CardDescription>
            There was an error processing your payment. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 dark:bg-red-950/50 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{errorMessage}</p>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Shield className="h-4 w-4" />
          <span className="font-medium">Secure Escrow Payment</span>
        </div>
        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
          Your payment will be held securely in escrow until the work is completed and approved.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Amount to Pay</span>
          <span className="text-2xl font-bold">€{amount.toFixed(2)}</span>
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p>• Payment will be processed securely through Stripe</p>
          <p>• Funds will be held in escrow until work completion</p>
          <p>• You'll have time to review work before funds are released</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handlePayment} 
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay €{amount.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default EscrowPaymentForm;