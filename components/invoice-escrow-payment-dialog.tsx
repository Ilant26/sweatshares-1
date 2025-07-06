'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EscrowPaymentForm } from '@/components/escrow-payment-form';
import { useToast } from '@/components/ui/use-toast';
import { Shield, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

interface Invoice {
  id: string;
  invoice_number: string;
  sender_id: string;
  receiver_id?: string;
  total: number;
  amount: number;
  currency: string;
  escrow_transaction_id?: string;
  payment_method?: 'standard' | 'payment_link' | 'escrow';
}

interface InvoiceEscrowPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onSuccess?: () => void;
}

export function InvoiceEscrowPaymentDialog({
  open,
  onOpenChange,
  invoice,
  onSuccess
}: InvoiceEscrowPaymentDialogProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [escrowTransactionId, setEscrowTransactionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    if (open && invoice) {
      fetchOrCreateEscrowTransaction();
    }
  }, [open, invoice]);

  const fetchOrCreateEscrowTransaction = async () => {
    if (!invoice) return;

    setLoading(true);
    setError(null);

    try {
      // First, try to fetch existing escrow transaction
      if (invoice.escrow_transaction_id) {
        const { data: existingTransaction, error: fetchError } = await supabase
          .from('escrow_transactions')
          .select('*')
          .eq('id', invoice.escrow_transaction_id)
          .single();

        if (existingTransaction && !fetchError) {
          setEscrowTransactionId(existingTransaction.id);
          setLoading(false);
          return;
        }
      }

      // If no existing transaction, create one
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Creating escrow transaction:', {
        invoiceId: invoice.id,
        invoiceSenderId: invoice.sender_id,
        currentUserId: user.id,
        amount: invoice.total || invoice.amount
      });

      // Create escrow transaction using the API endpoint
      const escrowResponse = await fetch('/api/escrow/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: invoice.total || invoice.amount,
          transactionType: 'work',
          payerId: invoice.sender_id,
          description: `Escrow payment for invoice ${invoice.invoice_number}`,
          customTimeline: {
            completion_deadline_days: 30,
            review_period_days: 7
          }
        }),
      });

      if (!escrowResponse.ok) {
        const errorData = await escrowResponse.json();
        throw new Error(errorData.error || 'Failed to create escrow transaction');
      }

      const escrowData = await escrowResponse.json();
      const newTransaction = escrowData.escrowTransaction;

      console.log('Escrow transaction created:', {
        transactionId: newTransaction?.id,
        payerId: newTransaction?.payer_id,
        payeeId: newTransaction?.payee_id,
        stripeConnectAccountId: newTransaction?.stripe_connect_account_id
      });

      if (!newTransaction) {
        throw new Error('Failed to create escrow transaction');
      }

      setEscrowTransactionId(newTransaction.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to setup escrow transaction';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setIsSuccess(true);
    toast({
      title: 'Payment Successful',
      description: 'Your payment has been processed and funds are held in escrow.',
    });
    onSuccess?.();
  };

  const handleCancel = async () => {
    // If there's an escrow transaction ID, cancel the payment
    if (escrowTransactionId) {
      try {
        const response = await fetch('/api/escrow/cancel-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ escrowTransactionId }),
        });

        if (response.ok) {
          console.log('Payment cancelled successfully');
        } else {
          console.error('Failed to cancel payment');
        }
      } catch (error) {
        console.error('Error cancelling payment:', error);
      }
    }

    onOpenChange(false);
    setIsSuccess(false);
    setEscrowTransactionId(null);
    setError(null);
  };

  const handleClose = () => {
    if (isSuccess) {
      onOpenChange(false);
      setIsSuccess(false);
      setEscrowTransactionId(null);
      setError(null);
    }
  };

  if (!invoice) {
    return null;
  }

  const amount = invoice.total || invoice.amount;
  const currency = invoice.currency || 'EUR';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                Payment Successful
              </DialogTitle>
              <DialogDescription>
                Your payment has been processed successfully. The funds are now held securely in escrow.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/50 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Funds Secured</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  €{amount.toFixed(2)} is now held in escrow and will be released when work is completed.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>• You will be notified when work is submitted for review</p>
                <p>• You have {currency === 'EUR' ? '7' : '5'} days to review and approve the work</p>
                <p>• Funds will be automatically released if no action is taken</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Secure Escrow Payment
              </DialogTitle>
              <DialogDescription>
                Complete your payment to fund the escrow transaction for invoice {invoice.invoice_number}. 
                Your funds will be held securely until work is completed.
              </DialogDescription>
            </DialogHeader>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <span className="ml-2">Setting up escrow transaction...</span>
              </div>
            ) : error ? (
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-950/50 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Error</span>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                </div>
                <button
                  onClick={handleCancel}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : escrowTransactionId ? (
              <EscrowPaymentForm
                escrowTransactionId={escrowTransactionId}
                amount={amount}
                currency={currency}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 