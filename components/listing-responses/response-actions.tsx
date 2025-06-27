import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { updateResponseStatus, createEscrowTransaction, releaseEscrowFunds, shouldUserMakePayment } from '@/lib/responses';
import { useSession } from '@/components/providers/session-provider';
import { CheckCircle, XCircle, Shield, DollarSign, AlertCircle, CreditCard } from 'lucide-react';

export interface ResponseActionsProps {
  responseId: string;
  status: string;
  proposedAmount: number;
  currency: string;
  responderId: string;
  listingOwnerId: string;
  listingType: string;
  escrowTransaction?: any;
  onStatusUpdate: (newStatus: string) => void;
  onEscrowUpdate: (escrowData: any) => void;
  isLoading?: boolean;
}

const releaseTypes = [
  { value: 'full', label: 'Full Release' },
  { value: 'partial', label: 'Partial Release' },
  { value: 'refund', label: 'Refund' },
];

export function ResponseActions({ 
  responseId, 
  status, 
  proposedAmount, 
  currency, 
  responderId, 
  listingOwnerId,
  listingType,
  escrowTransaction,
  onStatusUpdate,
  onEscrowUpdate,
  isLoading 
}: ResponseActionsProps) {
  const { user } = useSession();
  const { toast } = useToast();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showEscrowDialog, setShowEscrowDialog] = useState(false);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [releaseType, setReleaseType] = useState('full');
  const [releaseAmount, setReleaseAmount] = useState(proposedAmount.toString());
  const [releaseReason, setReleaseReason] = useState('');

  const isOwner = user?.id === listingOwnerId;
  const isResponder = user?.id === responderId;
  
  // Determine who should make the payment based on listing type
  const shouldMakePayment = user ? shouldUserMakePayment({
    responder_id: responderId,
    listing: { user_id: listingOwnerId, listing_type: listingType }
  } as any, user.id) : false;

  const handleAccept = async () => {
    if (!isOwner) return;
    
    setIsActionLoading(true);
    try {
      const success = await updateResponseStatus(responseId, 'accepted');
      if (success) {
        onStatusUpdate('accepted');
        toast({
          title: "Response accepted",
          description: "The response has been accepted. You can now start escrow when ready.",
        });
      } else {
        throw new Error('Failed to accept response');
      }
    } catch (error) {
      toast({
        title: "Action failed",
        description: "There was an error accepting the response.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!isOwner) return;
    
    setIsActionLoading(true);
    try {
      const success = await updateResponseStatus(responseId, 'rejected');
      if (success) {
        onStatusUpdate('rejected');
        toast({
          title: "Response rejected",
          description: "The response has been rejected.",
        });
      } else {
        throw new Error('Failed to reject response');
      }
    } catch (error) {
      toast({
        title: "Action failed",
        description: "There was an error rejecting the response.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStartEscrow = async () => {
    if (!user) return;
    
    setIsActionLoading(true);
    try {
      const escrowData = await createEscrowTransaction({
        response_id: responseId,
        amount: proposedAmount,
        currency,
      });

      if (escrowData) {
        onEscrowUpdate(escrowData);
        onStatusUpdate('in_escrow');
        setShowEscrowDialog(true);
        
        const paymentMessage = shouldMakePayment 
          ? "You will need to complete the payment to proceed with this deal."
          : "The other party will complete the payment to proceed with this deal.";
          
        toast({
          title: "Escrow created",
          description: `Escrow transaction has been created. ${paymentMessage}`,
        });
      } else {
        throw new Error('Failed to create escrow');
      }
    } catch (error) {
      toast({
        title: "Escrow creation failed",
        description: "There was an error creating the escrow transaction.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReleaseFunds = async () => {
    if (!user) return;
    
    const amount = parseFloat(releaseAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    setIsActionLoading(true);
    try {
      const success = await releaseEscrowFunds(escrowTransaction.id, {
        released_by_id: user.id,
        release_type: releaseType as 'full' | 'partial' | 'refund',
        amount,
        reason: releaseReason.trim() || undefined,
      });

      if (success) {
        onEscrowUpdate({ ...escrowTransaction, status: releaseType === 'refund' ? 'refunded' : 'released' });
        setShowReleaseDialog(false);
        toast({
          title: "Funds released",
          description: `Funds have been ${releaseType === 'refund' ? 'refunded' : 'released'} successfully.`,
        });
      } else {
        throw new Error('Failed to release funds');
      }
    } catch (error) {
      toast({
        title: "Release failed",
        description: "There was an error releasing the funds.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: AlertCircle, text: 'Pending' },
      accepted: { variant: 'default' as const, icon: CheckCircle, text: 'Accepted' },
      rejected: { variant: 'destructive' as const, icon: XCircle, text: 'Rejected' },
      in_escrow: { variant: 'default' as const, icon: Shield, text: 'In Escrow' },
      completed: { variant: 'default' as const, icon: CheckCircle, text: 'Completed' },
      disputed: { variant: 'destructive' as const, icon: AlertCircle, text: 'Disputed' },
      cancelled: { variant: 'secondary' as const, icon: XCircle, text: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          {getStatusBadge()}
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {proposedAmount} {currency}
          </span>
        </div>
      </div>

      {isOwner && status === 'pending' && (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="default"
            onClick={handleAccept}
            disabled={isActionLoading || isLoading}
            className="flex items-center gap-1"
      >
            <CheckCircle className="h-3 w-3" />
        Accept
      </Button>
      <Button
        size="sm"
        variant="destructive"
            onClick={handleReject}
            disabled={isActionLoading || isLoading}
            className="flex items-center gap-1"
      >
            <XCircle className="h-3 w-3" />
        Reject
      </Button>
        </div>
      )}

      {/* Show escrow button to the party responsible for payment */}
      {status === 'accepted' && shouldMakePayment && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleStartEscrow}
          disabled={isActionLoading || isLoading}
          className="flex items-center gap-1"
        >
          <CreditCard className="h-3 w-3" />
          Start Escrow & Pay
        </Button>
      )}

      {/* Show escrow button to owner if they're not the one paying */}
      {isOwner && status === 'accepted' && !shouldMakePayment && (
      <Button
        size="sm"
        variant="outline"
          onClick={handleStartEscrow}
          disabled={isActionLoading || isLoading}
          className="flex items-center gap-1"
      >
          <Shield className="h-3 w-3" />
        Start Escrow
      </Button>
      )}

      {escrowTransaction && escrowTransaction.status === 'funded' && (
        <div className="space-y-2">
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">Escrow Funded</p>
            <p className="text-xs text-muted-foreground">
              Amount: {escrowTransaction.amount} {escrowTransaction.currency}
            </p>
          </div>
          {(isOwner || isResponder) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReleaseDialog(true)}
              disabled={isActionLoading || isLoading}
            >
              Release Funds
            </Button>
          )}
        </div>
      )}

      {/* Escrow Created Dialog */}
      <Dialog open={showEscrowDialog} onOpenChange={setShowEscrowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escrow Created Successfully</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
              <p className="text-sm">
                An escrow transaction has been created for {proposedAmount} {currency}.
                {shouldMakePayment 
                  ? " You will need to complete the payment to proceed with this deal."
                  : " The other party will complete the payment to proceed with this deal."
                }
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>• Platform fee: {escrowTransaction?.platform_fee || 0} {currency}</p>
              <p>• Seller will receive: {escrowTransaction?.seller_amount || 0} {currency}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowEscrowDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Release Funds Dialog */}
      <Dialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Escrow Funds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Release Type</Label>
              <Select value={releaseType} onValueChange={setReleaseType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {releaseTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Amount ({currency})</Label>
              <Input
                type="number"
                value={releaseAmount}
                onChange={e => setReleaseAmount(e.target.value)}
                min="0"
                max={proposedAmount}
                step="0.01"
              />
            </div>
            
            <div>
              <Label>Reason (optional)</Label>
              <Textarea
                value={releaseReason}
                onChange={e => setReleaseReason(e.target.value)}
                placeholder="Explain why you're releasing these funds..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReleaseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReleaseFunds} disabled={isActionLoading}>
              {isActionLoading ? 'Processing...' : 'Release Funds'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 