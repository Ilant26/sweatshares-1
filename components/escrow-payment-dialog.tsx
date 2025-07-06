'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EscrowPaymentForm } from '@/components/escrow-payment-form';
import { useToast } from '@/components/ui/use-toast';
import { Shield, CreditCard, CheckCircle } from 'lucide-react';

interface EscrowPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escrowTransactionId: string;
  amount: number;
  currency: string;
  onSuccess?: () => void;
}

export function EscrowPaymentDialog({
  open,
  onOpenChange,
  escrowTransactionId,
  amount,
  currency,
  onSuccess
}: EscrowPaymentDialogProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSuccess = () => {
    setIsSuccess(true);
    toast({
      title: 'Payment Successful',
      description: 'Your payment has been processed and funds are held in escrow.',
    });
    onSuccess?.();
  };

  const handleCancel = () => {
    onOpenChange(false);
    setIsSuccess(false);
  };

  const handleClose = () => {
    if (isSuccess) {
      onOpenChange(false);
      setIsSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Payment Successful
              </DialogTitle>
              <DialogDescription>
                Your payment has been processed successfully. The funds are now held securely in escrow.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Funds Secured</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
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
                Complete your payment to fund the escrow transaction. Your funds will be held securely until work is completed.
              </DialogDescription>
            </DialogHeader>
            <EscrowPaymentForm
              escrowTransactionId={escrowTransactionId}
              amount={amount}
              currency={currency}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 