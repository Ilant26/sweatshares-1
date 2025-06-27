import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ListingResponse } from '@/lib/responses';

export type ResponseItemProps = {
  response: ListingResponse;
  onSelect?: (responseId: string) => void;
};

const getStatusConfig = (status: string) => {
  const configs = {
    pending: { variant: 'secondary' as const, icon: Clock, text: 'Pending' },
    accepted: { variant: 'default' as const, icon: CheckCircle, text: 'Accepted' },
    rejected: { variant: 'destructive' as const, icon: XCircle, text: 'Rejected' },
    in_escrow: { variant: 'default' as const, icon: Shield, text: 'In Escrow' },
    completed: { variant: 'default' as const, icon: CheckCircle, text: 'Completed' },
    disputed: { variant: 'destructive' as const, icon: AlertCircle, text: 'Disputed' },
    cancelled: { variant: 'secondary' as const, icon: XCircle, text: 'Cancelled' },
  };
  return configs[status as keyof typeof configs] || configs.pending;
};

export function ResponseItem({ response, onSelect }: ResponseItemProps) {
  const statusConfig = getStatusConfig(response.status);
  const Icon = statusConfig.icon;

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={response.responder?.avatar_url} />
            <AvatarFallback className="text-sm font-medium">
              {response.responder?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{response.responder?.full_name || 'Unknown User'}</div>
            <div className="text-xs text-muted-foreground">
              @{response.responder?.username || 'user'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusConfig.variant} className="flex items-center gap-1">
            <Icon className="h-3 w-3" />
            {statusConfig.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Offer:</span>
            <span className="text-lg font-bold text-primary">
              {response.proposed_amount} {response.currency}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(response.created_at).toLocaleDateString()}
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground line-clamp-2">
          {response.message}
        </div>
        
        {response.terms && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <strong>Terms:</strong> {response.terms}
          </div>
        )}
        
        {response.escrow_transaction && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Escrow Status: {response.escrow_transaction.status}
              </span>
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              Platform Fee: {response.escrow_transaction.platform_fee} {response.escrow_transaction.currency}
            </div>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onSelect?.(response.id)}
            className="flex-1"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 