'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { safeFormatDate } from '@/lib/utils';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  Download, 
  Eye, 
  MessageSquare,
  Shield,
  FileText,
  Calendar,
  Euro,
  XCircle
} from 'lucide-react';
import { WorkCompletionForm } from './work-completion-form';

interface EscrowWorkInterfaceProps {
  invoiceId: string;
  escrowTransaction: any;
  userRole: 'payer' | 'payee';
  onUpdate?: () => void;
  onPaymentRequest?: () => void;
}

export function EscrowWorkInterface({ 
  invoiceId, 
  escrowTransaction, 
  userRole, 
  onUpdate,
  onPaymentRequest
}: EscrowWorkInterfaceProps) {
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [isApprovingWork, setIsApprovingWork] = useState(false);
  const [isDisputing, setIsDisputing] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [showWorkCompletionDialog, setShowWorkCompletionDialog] = useState(false);
  const { toast } = useToast();

  const isPayee = userRole === 'payee';
  const isPayer = userRole === 'payer';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending_payment': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'payment_received': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'work_in_progress': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'work_submitted': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'work_approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'work_rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'disputed': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Shield className="h-4 w-4" />;
      case 'pending_payment': return <Shield className="h-4 w-4" />;
      case 'payment_received': return <Shield className="h-4 w-4" />;
      case 'work_in_progress': return <FileText className="h-4 w-4" />;
      case 'work_submitted': return <Upload className="h-4 w-4" />;
      case 'work_approved': return <CheckCircle className="h-4 w-4" />;
      case 'work_rejected': return <AlertCircle className="h-4 w-4" />;
      case 'disputed': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'In Escrow';
      case 'pending_payment': return 'In Escrow';
      case 'payment_received': return 'Payment Received';
      case 'work_in_progress': return 'Work in Progress';
      case 'work_submitted': return 'Work Submitted';
      case 'work_approved': return 'Work Approved';
      case 'work_rejected': return 'Work Rejected';
      case 'disputed': return 'Disputed';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    }
  };

  const calculateProgress = () => {
    const statusOrder = [
      'pending',
      'pending_payment',
      'payment_received', 
      'work_in_progress',
      'work_submitted',
      'work_approved',
      'completed'
    ];
    const currentIndex = statusOrder.indexOf(escrowTransaction.status);
    return Math.max(0, Math.min(100, (currentIndex / (statusOrder.length - 1)) * 100));
  };

  const handleSubmitWork = async (workData: any) => {
    setIsSubmittingWork(true);
    try {
      const response = await fetch('/api/escrow/submit-work-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escrowTransactionId: escrowTransaction.id,
          description: workData.description,
          attachments: workData.attachments,
          notes: workData.notes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit work completion');
      }

      toast({
        title: 'Work Submitted',
        description: 'Your work has been submitted for review.',
      });

      setShowWorkCompletionDialog(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error submitting work:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit work. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingWork(false);
    }
  };

  const handleApproveWork = async () => {
    setIsApprovingWork(true);
    try {
      const response = await fetch('/api/escrow/approve-work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escrowTransactionId: escrowTransaction.id,
          approve: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve work');
      }

      toast({
        title: 'Work Approved',
        description: 'Payment has been released to the payee.',
      });

      onUpdate?.();
    } catch (error) {
      console.error('Error approving work:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve work. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsApprovingWork(false);
    }
  };

  const handleRejectWork = async () => {
    setIsApprovingWork(true);
    try {
      const response = await fetch('/api/escrow/approve-work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escrowTransactionId: escrowTransaction.id,
          approve: false,
          rejectionReason: 'Work does not meet requirements'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject work');
      }

      toast({
        title: 'Work Rejected',
        description: 'Work has been rejected and returned for revision.',
      });

      onUpdate?.();
    } catch (error) {
      console.error('Error rejecting work:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject work. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsApprovingWork(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for the dispute.',
        variant: 'destructive',
      });
      return;
    }

    setIsDisputing(true);
    try {
      const response = await fetch('/api/escrow/dispute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escrowTransactionId: escrowTransaction.id,
          reason: disputeReason,
          initiatorRole: userRole
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create dispute');
      }

      toast({
        title: 'Dispute Created',
        description: 'A dispute has been created and will be reviewed by our team.',
      });

      setShowDisputeDialog(false);
      setDisputeReason('');
      onUpdate?.();
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast({
        title: 'Error',
        description: 'Failed to create dispute. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDisputing(false);
    }
  };

  const canPay = isPayer && (escrowTransaction.status === 'pending' || escrowTransaction.status === 'pending_payment');
  const canSubmitWork = isPayee && escrowTransaction.status === 'payment_received';
  const canApproveWork = isPayer && escrowTransaction.status === 'work_submitted';
  const canDispute = escrowTransaction.status !== 'completed' && escrowTransaction.status !== 'cancelled';

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Escrow Status
          </CardTitle>
          <CardDescription>
            Transaction ID: {escrowTransaction.id}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(calculateProgress())}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>

          {/* Current Status */}
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(escrowTransaction.status)}>
              {getStatusIcon(escrowTransaction.status)}
              <span className="ml-1">
                {getStatusText(escrowTransaction.status)}
              </span>
            </Badge>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Completion Deadline:</span>
              <span className="font-medium">
                {safeFormatDate(escrowTransaction.completion_deadline)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Review Period:</span>
              <span className="font-medium">
                {escrowTransaction.review_period_days} days
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Action Card */}
      {canPay && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-yellow-600" />
              Payment Required
            </CardTitle>
            <CardDescription>
              Complete your payment to fund the escrow transaction and start the work.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Amount to Pay:</span>
                  <span className="text-lg font-bold text-green-600">
                    €{escrowTransaction.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Platform Fee:</span>
                  <span className="text-sm text-muted-foreground">
                    €{(escrowTransaction.amount * 0.05).toFixed(2)} (5%)
                  </span>
                </div>
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={onPaymentRequest}
              >
                <Shield className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Cards */}
      {canSubmitWork && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Submit Work Completion
            </CardTitle>
            <CardDescription>
              Upload your completed work and deliverables for review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showWorkCompletionDialog} onOpenChange={setShowWorkCompletionDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Work
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Submit Work Completion</DialogTitle>
                  <DialogDescription>
                    Upload your completed work and provide details about what was delivered.
                  </DialogDescription>
                </DialogHeader>
                <WorkCompletionForm
                  transaction={escrowTransaction}
                  onComplete={() => {
                    setShowWorkCompletionDialog(false);
                    onUpdate?.();
                  }}
                  onCancel={() => setShowWorkCompletionDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {canApproveWork && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              Review Submitted Work
            </CardTitle>
            <CardDescription>
              Review the submitted work and approve or request revisions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Work Submission Details */}
            {escrowTransaction.work_submission && (
              <div className="space-y-3 p-4 bg-white rounded-lg border">
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {escrowTransaction.work_submission.description}
                  </p>
                </div>
                {escrowTransaction.work_submission.notes && (
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {escrowTransaction.work_submission.notes}
                    </p>
                  </div>
                )}
                {escrowTransaction.work_submission.attachments?.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Attachments</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {escrowTransaction.work_submission.attachments.map((attachment: any, index: number) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(attachment.url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {attachment.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleApproveWork}
                disabled={isApprovingWork}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve & Release Payment
              </Button>
              <Button
                onClick={handleRejectWork}
                disabled={isApprovingWork}
                variant="outline"
                className="flex-1"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Request Revision
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dispute Section */}
      {canDispute && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Dispute Resolution
            </CardTitle>
            <CardDescription>
              If you have concerns about this transaction, you can create a dispute.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-100">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Create Dispute
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Dispute</DialogTitle>
                  <DialogDescription>
                    Please provide a detailed reason for your dispute. Our team will review and mediate.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dispute-reason">Reason for Dispute</Label>
                    <Textarea
                      id="dispute-reason"
                      placeholder="Describe the issue and why you're disputing this transaction..."
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDisputeDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDispute}
                    disabled={isDisputing || !disputeReason.trim()}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isDisputing ? 'Creating...' : 'Create Dispute'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Transaction Details */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Amount:</span>
              <p className="font-medium">€{escrowTransaction.amount.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Platform Fee:</span>
              <p className="font-medium">€{(escrowTransaction.amount * 0.05).toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Transaction Type:</span>
              <p className="font-medium capitalize">
                {escrowTransaction.transaction_type.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <p className="font-medium">
                {safeFormatDate(escrowTransaction.created_at)}
              </p>
            </div>
          </div>
          
          {escrowTransaction.description && (
            <div>
              <span className="text-muted-foreground text-sm">Description:</span>
              <p className="text-sm mt-1">{escrowTransaction.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 