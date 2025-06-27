'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ResponseList } from '@/components/listing-responses/response-list';
import { ResponseItem } from '@/components/listing-responses/response-item';
import { ResponseActions } from '@/components/listing-responses/response-actions';
import { ResponseChat } from '@/components/listing-responses/response-chat';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  MessageSquare, 
  Users, 
  DollarSign, 
  Shield, 
  CheckCircle, 
  Clock, 
  Briefcase,
  Target,
  Building2
} from 'lucide-react';
import { fetchListingResponses, ListingResponse, getPaymentResponsibility } from '@/lib/responses';
import { useSession } from '@/components/providers/session-provider';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

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

export default function ListingResponsesPage() {
  const params = useParams();
  const { user } = useSession();
  const { toast } = useToast();
  const listingId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [responses, setResponses] = useState<ListingResponse[]>([]);
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    loadData();
  }, [listingId]);

  const loadData = async () => {
    if (!listingId) return;
    setLoading(true);
    setError(null);
    try {
      // Load listing information
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (listingError) {
        throw new Error('Failed to load listing');
      }

      setListing(listingData);

      // Load responses
      const responsesData = await fetchListingResponses(listingId);
      setResponses(responsesData);
    } catch (err) {
      setError('Failed to load data.');
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedResponse = responses.find(r => r.id === selectedResponseId) || null;

  function handleSelectResponse(responseId: string) {
    setSelectedResponseId(responseId);
  }

  function handleCloseModal() {
    setSelectedResponseId(null);
  }

  function handleStatusUpdate(responseId: string, newStatus: string) {
    setResponses(prev => 
      prev.map(r => r.id === responseId ? { ...r, status: newStatus as any } : r)
    );
  }

  function handleEscrowUpdate(responseId: string, escrowData: any) {
    setResponses(prev => 
      prev.map(r => r.id === responseId ? { ...r, escrow_transaction: escrowData } : r)
    );
  }

  const pendingCount = responses.filter(r => r.status === 'pending').length;
  const acceptedCount = responses.filter(r => r.status === 'accepted').length;
  const inEscrowCount = responses.filter(r => r.status === 'in_escrow').length;
  const completedCount = responses.filter(r => r.status === 'completed').length;
  const totalValue = responses.reduce((sum, r) => sum + r.proposed_amount, 0);
  const escrowValue = inEscrowCount > 0 ? responses.filter(r => r.status === 'in_escrow').reduce((sum, r) => sum + r.proposed_amount, 0) : 0;
  
  const paymentResponsibility = listing ? getPaymentResponsibility(listing.listing_type) : 'lister';
  const ListingIcon = listing ? getListingTypeIcon(listing.listing_type) : Briefcase;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/my-listings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Listing Responses</h1>
              {listing && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <ListingIcon className="h-4 w-4" />
                  {getListingTypeLabel(listing.listing_type)}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Manage responses to your listing
              {listing && (
                <span className="ml-2">
                  • {paymentResponsibility === 'lister' ? 'You pay escrow' : 'Responders pay escrow'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total</span>
              </div>
              <p className="text-2xl font-bold">{responses.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Accepted</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{acceptedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">In Escrow</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{inEscrowCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Completed</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">Total Value</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">${totalValue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Responses List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading responses...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadData} variant="outline">
            Try Again
          </Button>
        </div>
      ) : responses.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No responses yet</h3>
          <p className="text-muted-foreground mb-4">
            When people respond to your listing, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">All Responses</h2>
            <ResponseList responses={responses} onSelectResponse={handleSelectResponse} />
          </div>
        </div>
      )}

      {/* Response Details Modal */}
      <Dialog open={!!selectedResponse} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Response Details</DialogTitle>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-6">
              <ResponseItem response={selectedResponse} />
              
              <Separator />
              
              <ResponseActions
                responseId={selectedResponse.id}
                status={selectedResponse.status}
                proposedAmount={selectedResponse.proposed_amount}
                currency={selectedResponse.currency}
                responderId={selectedResponse.responder_id}
                listingOwnerId={user?.id || ''} // Use current user as listing owner
                listingType={listing?.listing_type || 'job'} // Default to job if not available
                escrowTransaction={selectedResponse.escrow_transaction}
                onStatusUpdate={(newStatus) => handleStatusUpdate(selectedResponse.id, newStatus)}
                onEscrowUpdate={(escrowData) => handleEscrowUpdate(selectedResponse.id, escrowData)}
                isLoading={isActionLoading}
              />
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Conversation</h3>
                <ResponseChat
                  responseId={selectedResponse.id}
                  isLoading={isActionLoading}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 