'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { getUserResponses, ListingResponse, getPaymentResponsibility } from '@/lib/responses';
import { useSession } from '@/components/providers/session-provider';
import { useToast } from '@/components/ui/use-toast';
import { ResponseActions } from '@/components/listing-responses/response-actions';
import { ResponseChat } from '@/components/listing-responses/response-chat';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Shield, 
  DollarSign, 
  MessageSquare,
  ExternalLink,
  Calendar,
  AlertCircle,
  Briefcase,
  Target,
  Users,
  Building2
} from 'lucide-react';
import Link from 'next/link';

const getStatusConfig = (status: string) => {
  const configs = {
    pending: { variant: 'secondary' as const, icon: Clock, text: 'Pending', color: 'text-yellow-600' },
    accepted: { variant: 'default' as const, icon: CheckCircle, text: 'Accepted', color: 'text-green-600' },
    rejected: { variant: 'destructive' as const, icon: XCircle, text: 'Rejected', color: 'text-red-600' },
    in_escrow: { variant: 'default' as const, icon: Shield, text: 'In Escrow', color: 'text-blue-600' },
    completed: { variant: 'default' as const, icon: CheckCircle, text: 'Completed', color: 'text-green-600' },
    disputed: { variant: 'destructive' as const, icon: AlertCircle, text: 'Disputed', color: 'text-red-600' },
    cancelled: { variant: 'secondary' as const, icon: XCircle, text: 'Cancelled', color: 'text-gray-600' },
  };
  return configs[status as keyof typeof configs] || configs.pending;
};

function getListingTypeIcon(listingType: string) {
  switch (listingType) {
    case 'find-funding':
    case 'investment-opportunity':
    case 'buy-startup':
    case 'co-investor':
      return DollarSign;
    case 'job':
    case 'employee':
      return Briefcase;
    case 'mission':
    case 'expert-freelance':
      return Target;
    case 'cofounder':
    case 'mentor':
      return Users;
    case 'sell-startup':
      return Building2;
    default:
      return Briefcase;
  }
}

function getListingTypeLabel(listingType: string) {
  switch (listingType) {
    case 'find-funding':
      return 'Find Funding';
    case 'investment-opportunity':
      return 'Investment Opportunity';
    case 'job':
      return 'Job';
    case 'mission':
      return 'Mission';
    case 'expert-freelance':
      return 'Expert/Freelance';
    case 'cofounder':
      return 'Co-founder';
    case 'employee':
      return 'Employee';
    case 'mentor':
      return 'Mentor';
    case 'sell-startup':
      return 'Sell Startup';
    case 'buy-startup':
      return 'Buy Startup';
    case 'co-investor':
      return 'Co-investor';
    default:
      return listingType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

export default function MyResponsesPage() {
  const { user } = useSession();
  const { toast } = useToast();
  const [responses, setResponses] = useState<ListingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<ListingResponse | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (user) {
      loadResponses();
    }
  }, [user]);

  const loadResponses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await getUserResponses(user.id);
      setResponses(data);
    } catch (error) {
      console.error('Error loading responses:', error);
      toast({
        title: "Error",
        description: "Failed to load your responses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (responseId: string, newStatus: string) => {
    setResponses(prev => 
      prev.map(r => r.id === responseId ? { ...r, status: newStatus as any } : r)
    );
  };

  const handleEscrowUpdate = (responseId: string, escrowData: any) => {
    setResponses(prev => 
      prev.map(r => r.id === responseId ? { ...r, escrow_transaction: escrowData } : r)
    );
  };

  const pendingResponses = responses.filter(r => r.status === 'pending');
  const acceptedResponses = responses.filter(r => r.status === 'accepted');
  const inEscrowResponses = responses.filter(r => r.status === 'in_escrow');
  const completedResponses = responses.filter(r => r.status === 'completed');
  const rejectedResponses = responses.filter(r => r.status === 'rejected');

  const totalAmount = responses.reduce((sum, r) => sum + r.proposed_amount, 0);
  const acceptedAmount = acceptedResponses.reduce((sum, r) => sum + r.proposed_amount, 0);
  const escrowAmount = inEscrowResponses.reduce((sum, r) => sum + r.proposed_amount, 0);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your responses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Responses</h1>
        <p className="text-muted-foreground">Track your responses to listings and manage escrow payments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Responses</span>
            </div>
            <p className="text-2xl font-bold">{responses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Value</span>
            </div>
            <p className="text-2xl font-bold text-green-600">${totalAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">In Escrow</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">${escrowAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Accepted</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{acceptedResponses.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Responses Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({responses.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingResponses.length})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({acceptedResponses.length})</TabsTrigger>
          <TabsTrigger value="escrow">Escrow ({inEscrowResponses.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedResponses.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedResponses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {responses.map(response => (
            <ResponseCard 
              key={response.id} 
              response={response} 
              onSelect={() => {
                setSelectedResponse(response);
                setShowDetails(true);
              }}
            />
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingResponses.map(response => (
            <ResponseCard 
              key={response.id} 
              response={response} 
              onSelect={() => {
                setSelectedResponse(response);
                setShowDetails(true);
              }}
            />
          ))}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4">
          {acceptedResponses.map(response => (
            <ResponseCard 
              key={response.id} 
              response={response} 
              onSelect={() => {
                setSelectedResponse(response);
                setShowDetails(true);
              }}
            />
          ))}
        </TabsContent>

        <TabsContent value="escrow" className="space-y-4">
          {inEscrowResponses.map(response => (
            <ResponseCard 
              key={response.id} 
              response={response} 
              onSelect={() => {
                setSelectedResponse(response);
                setShowDetails(true);
              }}
            />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedResponses.map(response => (
            <ResponseCard 
              key={response.id} 
              response={response} 
              onSelect={() => {
                setSelectedResponse(response);
                setShowDetails(true);
              }}
            />
          ))}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedResponses.map(response => (
            <ResponseCard 
              key={response.id} 
              response={response} 
              onSelect={() => {
                setSelectedResponse(response);
                setShowDetails(true);
              }}
            />
          ))}
        </TabsContent>
      </Tabs>

      {/* Response Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Response Details</DialogTitle>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-6">
              <ResponseCard response={selectedResponse} onSelect={() => {}} />
              
              <Separator />
              
              <ResponseActions
                responseId={selectedResponse.id}
                status={selectedResponse.status}
                proposedAmount={selectedResponse.proposed_amount}
                currency={selectedResponse.currency}
                responderId={selectedResponse.responder_id}
                listingOwnerId={user?.id || ''}
                listingType={selectedResponse.listing?.listing_type || 'job'}
                escrowTransaction={selectedResponse.escrow_transaction}
                onStatusUpdate={(newStatus) => handleStatusUpdate(selectedResponse.id, newStatus)}
                onEscrowUpdate={(escrowData) => handleEscrowUpdate(selectedResponse.id, escrowData)}
              />
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Conversation</h3>
                <ResponseChat
                  responseId={selectedResponse.id}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResponseCard({ response, onSelect }: { response: ListingResponse; onSelect: () => void }) {
  const statusConfig = getStatusConfig(response.status);
  const Icon = statusConfig.icon;
  const ListingIcon = getListingTypeIcon(response.listing?.listing_type || 'job');
  const paymentResponsibility = getPaymentResponsibility(response.listing?.listing_type || 'job');
  const isUserPaying = paymentResponsibility === 'responder';

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm font-medium">
                  {response.responder?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{response.responder?.full_name || 'Unknown User'}</h3>
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <ListingIcon className="h-3 w-3" />
                    {getListingTypeLabel(response.listing?.listing_type || 'job')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">@{response.responder?.username || 'user'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-lg">
                  {response.proposed_amount} {response.currency}
                </span>
              </div>
              <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {statusConfig.text}
              </Badge>
              {isUserPaying && (
                <Badge variant="outline" className="text-xs">
                  You Pay
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {response.message}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(response.created_at).toLocaleDateString()}
              </div>
              <Link href={`/dashboard/listings/${response.listing_id}`} className="flex items-center gap-1 hover:text-primary">
                <ExternalLink className="h-3 w-3" />
                View Listing
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 