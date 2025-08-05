'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import EscrowPaymentForm from '@/components/escrow-payment-form';
import { useToast } from '@/components/ui/use-toast';
import { Shield, CreditCard, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
  description?: string;
  issue_date: string;
  due_date: string;
}

interface EscrowTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  stripe_payment_intent_id?: string;
  stripe_connect_account_id?: string;
  completion_deadline_days: number;
  review_period_days: number;
  transaction_description?: string;
}

export default function EscrowPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [escrowTransaction, setEscrowTransaction] = useState<EscrowTransaction | null>(null);
  const [escrowTransactionId, setEscrowTransactionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [senderProfile, setSenderProfile] = useState<any>(null);

  const invoiceId = params.id as string;

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceAndSetup();
    }
  }, [invoiceId]);

  const fetchInvoiceAndSetup = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Fetch invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoiceData) {
        throw new Error('Invoice not found');
      }

      setInvoice(invoiceData);

      // Fetch sender profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, company')
        .eq('id', invoiceData.sender_id)
        .single();

      setSenderProfile(profileData);

      // Check if escrow transaction exists
      if (invoiceData.escrow_transaction_id) {
        const { data: escrowData, error: escrowError } = await supabase
          .from('escrow_transactions')
          .select('*')
          .eq('id', invoiceData.escrow_transaction_id)
          .single();

        if (escrowData && !escrowError) {
          setEscrowTransaction(escrowData);
          setEscrowTransactionId(escrowData.id);
          setLoading(false);
          return;
        }
      }

      // Create escrow transaction if it doesn't exist
      console.log('Creating escrow transaction:', {
        invoiceId: invoiceData.id,
        invoiceSenderId: invoiceData.sender_id,
        currentUserId: user.id,
        amount: invoiceData.total || invoiceData.amount
      });

      const escrowResponse = await fetch('/api/escrow/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoiceData.id,
          amount: invoiceData.total || invoiceData.amount,
          transactionType: 'work',
          payerId: user.id,
          payeeId: invoiceData.sender_id,
          description: `Escrow payment for invoice ${invoiceData.invoice_number}`,
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

      setEscrowTransaction(newTransaction);
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

  const handleSuccess = async () => {
    setIsSuccess(true);
    
    // Refresh the invoice status to ensure it's updated
    try {
      const response = await fetch('/api/escrow/refresh-invoice-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId: invoice?.id }),
      });

      if (response.ok) {
        console.log('Invoice status refreshed successfully');
      } else {
        console.warn('Failed to refresh invoice status');
      }
    } catch (error) {
      console.error('Error refreshing invoice status:', error);
    }

    toast({
      title: 'Payment Successful',
      description: 'Your payment has been processed and funds are held in escrow.',
    });

    // Redirect to invoices page after a short delay
    setTimeout(() => {
      router.push('/dashboard/my-invoices');
    }, 3000);
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

    router.push('/dashboard/my-invoices');
  };

  const handleBack = () => {
    router.push('/dashboard/my-invoices');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Setting up escrow payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                Payment Setup Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 dark:bg-red-950/50 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={handleBack} variant="outline">
                  Back to Invoices
                </Button>
                <Button onClick={fetchInvoiceAndSetup}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!invoice || !escrowTransaction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Invoice or escrow transaction not found.</p>
          <Button onClick={handleBack} className="mt-4">
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  const amount = invoice.total || invoice.amount;
  const currency = invoice.currency || 'EUR';

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          
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
                <div className="flex gap-2">
                  <Button onClick={handleBack}>
                    Back to Invoices
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">Secure Escrow Payment</h1>
              <p className="text-muted-foreground mt-2">
                Complete your payment to fund the escrow transaction for invoice {invoice.invoice_number}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card>
                            <CardHeader>
                <CardTitle>Payment Form</CardTitle>
              </CardHeader>
              <CardContent>
                {escrowTransactionId ? (
                  <EscrowPaymentForm
                    escrowTransactionId={escrowTransactionId}
                    amount={amount}
                    currency={currency}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Preparing payment form...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Invoice Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-medium">{invoice.invoice_number}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold">€{amount.toFixed(2)}</p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">From</p>
                  <div className="flex items-center gap-2 mt-1">
                    {senderProfile?.avatar_url && (
                      <img 
                        src={senderProfile.avatar_url} 
                        alt={senderProfile.full_name || senderProfile.username}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium">{senderProfile?.full_name || senderProfile?.username}</p>
                      {senderProfile?.company && (
                        <p className="text-sm text-muted-foreground">{senderProfile.company}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <Badge variant="outline" className="mt-1">
                    <Shield className="h-3 w-3 mr-1" />
                    Escrow
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Escrow Timeline</p>
                  <div className="text-sm mt-1">
                    <p>• {escrowTransaction.completion_deadline_days} days to complete work</p>
                    <p>• {escrowTransaction.review_period_days} days to review</p>
                  </div>
                </div>

                {invoice.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="text-sm mt-1">{invoice.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 