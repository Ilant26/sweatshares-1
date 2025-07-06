'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { getStatusDisplayInfo, getTimelineInfo, type EscrowTransaction } from '@/lib/escrow';
import { Clock, AlertTriangle, CheckCircle, Shield, FileText, Edit, DollarSign, Undo } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

interface EscrowStatusBadgeProps {
  transaction?: EscrowTransaction;
  invoiceId?: string;
  showCountdown?: boolean;
  className?: string;
}

const statusIcons = {
  pending: Clock,
  paid_in_escrow: Shield,
  work_completed: CheckCircle,
  approved: CheckCircle,
  revision_requested: Edit,
  disputed: AlertTriangle,
  released: DollarSign,
  refunded: Undo
};

export function EscrowStatusBadge({ transaction, invoiceId, showCountdown = true, className }: EscrowStatusBadgeProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [escrowTransaction, setEscrowTransaction] = useState<EscrowTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient<Database>();

  // Use provided transaction or fetch by invoiceId
  const currentTransaction = transaction || escrowTransaction;

  // Fetch escrow transaction if we have invoiceId but no transaction
  useEffect(() => {
    if (!transaction && invoiceId && !escrowTransaction) {
      const fetchEscrowTransaction = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('escrow_transactions')
            .select('*')
            .eq('invoice_id', invoiceId)
            .single();

          if (data && !error) {
            setEscrowTransaction(data);
          }
        } catch (error) {
          console.error('Error fetching escrow transaction:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchEscrowTransaction();
    }
  }, [transaction, invoiceId, escrowTransaction, supabase]);

  // Countdown effect - always called but only active when conditions are met
  useEffect(() => {
    if (!showCountdown || !currentTransaction) return;

    const updateCountdown = () => {
      const now = new Date();
      let targetDate: Date | null = null;

      if (currentTransaction.status === 'paid_in_escrow' && currentTransaction.completion_deadline_date) {
        targetDate = new Date(currentTransaction.completion_deadline_date);
      } else if (currentTransaction.status === 'work_completed' && currentTransaction.auto_release_date) {
        targetDate = new Date(currentTransaction.auto_release_date);
      }

      if (targetDate) {
        const diff = targetDate.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeLeft('Expired');
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          
          if (days > 0) {
            setTimeLeft(`${days}d ${hours}h`);
          } else if (hours > 0) {
            setTimeLeft(`${hours}h`);
          } else {
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setTimeLeft(`${minutes}m`);
          }
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [currentTransaction, showCountdown]);

  // Don't render anything if we don't have transaction data
  if (!currentTransaction) {
    return null;
  }

  const statusInfo = getStatusDisplayInfo(currentTransaction.status);
  const timelineInfo = getTimelineInfo(currentTransaction);
  const IconComponent = statusIcons[currentTransaction.status];

  const getBadgeVariant = () => {
    if (timelineInfo.isOverdue) return 'destructive';
    if (timelineInfo.isAutoReleaseImminent) return 'warning';
    return statusInfo.color as any;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={getBadgeVariant()} className="flex items-center gap-1">
        {IconComponent && <IconComponent className="h-3 w-3" />}
        {statusInfo.label}
      </Badge>
      
      {showCountdown && timeLeft && (
        <span className={`text-xs ${
          timelineInfo.isOverdue ? 'text-destructive' :
          timelineInfo.isAutoReleaseImminent ? 'text-warning' :
          'text-muted-foreground'
        }`}>
          {currentTransaction.status === 'paid_in_escrow' ? 'Deadline: ' : 'Auto-release: '}
          {timeLeft}
        </span>
      )}
    </div>
  );
} 