'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Handshake, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  ArrowLeft,
  Calendar,
  User,
  Building2,
  MapPin,
  Target,
  Award,
  Send,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  TrendingUp
} from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { useSession } from '@/components/providers/session-provider';
import { getDeal, updateDealStatus, createCounterOffer, getDealOffers, getDealMessages, sendDealMessage, Deal } from '@/lib/deals';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';
import { EscrowPaymentFlow } from '@/components/escrow-payment-flow';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.6
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      type: "spring",
      bounce: 0.2
    }
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'counter_offered':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'accepted':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'in_progress':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'counter_offered':
      return <Handshake className="h-4 w-4" />;
    case 'accepted':
      return <CheckCircle className="h-4 w-4" />;
    case 'in_progress':
      return <Clock className="h-4 w-4" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'rejected':
      return <XCircle className="h-4 w-4" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const formatStatus = (status: string) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useSession();
  const { toast } = useToast();

  const dealId = params.id as string;

  // Define freelancer search listing types
  const freelancerSearchTypes = ['expert-freelance', 'employee', 'mentor', 'job'];
  const isFreelancerSearch = deal?.listing?.listing_type && freelancerSearchTypes.includes(deal.listing.listing_type);

  useEffect(() => {
    const fetchDealData = async () => {
      if (!dealId || !user) return;
      
      setLoading(true);
      try {
        const [dealData, offersData, messagesData] = await Promise.all([
          getDeal(dealId),
          getDealOffers(dealId),
          getDealMessages(dealId)
        ]);
        
        setDeal(dealData);
        setOffers(offersData);
        setMessages(messagesData);
      } catch (error) {
        console.error('Error fetching deal data:', error);
        toast({
          title: "Error",
          description: "Failed to load deal details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDealData();
  }, [dealId, user, toast]);

  const getDealRole = () => {
    if (!deal || !user) return 'unknown';
    if (deal.buyer_id === user.id) return 'buyer';
    if (deal.seller_id === user.id) return 'seller';
    return 'unknown';
  };

  const getOtherParty = () => {
    if (!deal) return null;
    const role = getDealRole();
    if (role === 'buyer') {
      return deal.seller;
    } else if (role === 'seller') {
      return deal.buyer;
    }
    return null;
  };

  const getRoleLabel = (role: string) => {
    if (!isFreelancerSearch) return role;
    return role === 'buyer' ? 'client' : 'freelancer';
  };

  const getOtherPartyLabel = () => {
    if (!isFreelancerSearch) return 'Other Party';
    const role = getDealRole();
    return role === 'buyer' ? 'Freelancer' : 'Client';
  };

  const handleAcceptDeal = async () => {
    if (!deal) return;
    
    setActionLoading(true);
    try {
      const success = await updateDealStatus(deal.id, 'accepted');
      if (success) {
        setDeal({ ...deal, status: 'accepted' });
        toast({
          title: "Deal Accepted!",
          description: "The deal has been accepted and is now active.",
        });
      } else {
        throw new Error('Failed to accept deal');
      }
    } catch (error) {
      console.error('Error accepting deal:', error);
      toast({
        title: "Error",
        description: "Failed to accept deal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDeal = async () => {
    if (!deal) return;
    
    setActionLoading(true);
    try {
      const success = await updateDealStatus(deal.id, 'rejected');
      if (success) {
        setDeal({ ...deal, status: 'rejected' });
        toast({
          title: "Deal Rejected",
          description: "The deal has been rejected.",
        });
      } else {
        throw new Error('Failed to reject deal');
      }
    } catch (error) {
      console.error('Error rejecting deal:', error);
      toast({
        title: "Error",
        description: "Failed to reject deal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCounterOffer = async () => {
    if (!deal || !counterAmount) return;
    
    setActionLoading(true);
    try {
      const success = await createCounterOffer(
        deal.id,
        user!.id,
        parseFloat(counterAmount),
        counterMessage
      );
      if (success) {
        setDeal({ ...deal, status: 'counter_offered' });
        setCounterAmount('');
        setCounterMessage('');
        toast({
          title: "Counter Offer Sent!",
          description: "Your counter offer has been sent to the other party.",
        });
      } else {
        throw new Error('Failed to create counter offer');
      }
    } catch (error) {
      console.error('Error creating counter offer:', error);
      toast({
        title: "Error",
        description: "Failed to send counter offer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!deal || !newMessage.trim()) return;
    
    try {
      const success = await sendDealMessage(deal.id, user!.id, newMessage);
      if (success) {
        setNewMessage('');
        // Refresh messages
        const updatedMessages = await getDealMessages(deal.id);
        setMessages(updatedMessages);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const refreshDeal = () => {
    // Trigger a refresh of the deal data
    window.location.reload();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to view deal details.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading deal details...</p>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Deal Not Found</h2>
          <p className="text-muted-foreground">This deal does not exist or you don't have access to it.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/deals">
              Back to Deals
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const role = getDealRole();
  const otherParty = getOtherParty();
  const canTakeAction = role === 'seller' && deal.status === 'pending';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-background">
      <motion.div 
        className="max-w-7xl mx-auto p-6 space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/deals" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Deals
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Deal: {deal.listing?.title || 'Untitled Listing'}
            </h1>
            <p className="text-muted-foreground">
              with {otherParty?.full_name || 'Unknown User'}
            </p>
          </div>
          <Badge className={getStatusColor(deal.status)}>
            <div className="flex items-center gap-1">
              {getStatusIcon(deal.status)}
              {formatStatus(deal.status)}
            </div>
          </Badge>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="offers">Offers</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Deal Details */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Deal Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <DollarSign className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Amount</p>
                            <p className="font-medium">${deal.amount}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Calendar className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Created</p>
                            <p className="font-medium">{format(new Date(deal.created_at), 'MMM dd, yyyy')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <User className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Your Role</p>
                            <p className="font-medium capitalize">{getRoleLabel(role)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Handshake className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p className="font-medium">{formatStatus(deal.status)}</p>
                          </div>
                        </div>
                      </div>

                      {deal.description && (
                        <div>
                          <h4 className="font-semibold mb-2">Description</h4>
                          <p className="text-muted-foreground">{deal.description}</p>
                        </div>
                      )}

                      {deal.terms && (
                        <div>
                          <h4 className="font-semibold mb-2">Terms</h4>
                          <p className="text-muted-foreground">{deal.terms}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Listing Info */}
                  {deal.listing && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Listing Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <h3 className="text-lg font-semibold">{deal.listing.title}</h3>
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: deal.listing.description || '' }}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Actions Sidebar */}
                <div className="space-y-6">
                  {/* Deal Actions */}
                  {canTakeAction && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Deal Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button 
                          onClick={handleAcceptDeal}
                          disabled={actionLoading}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          {actionLoading ? (
                            <>
                              <motion.div
                                className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              Accept Deal
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={handleRejectDeal}
                          disabled={actionLoading}
                          variant="outline"
                          className="w-full"
                        >
                          <ThumbsDown className="h-4 w-4 mr-2" />
                          Reject Deal
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Counter Offer */}
                  {canTakeAction && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Counter Offer</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="counter-amount">Amount (USD)</Label>
                          <Input
                            id="counter-amount"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Enter counter offer amount"
                            value={counterAmount}
                            onChange={(e) => setCounterAmount(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="counter-message">Message (Optional)</Label>
                          <Textarea
                            id="counter-message"
                            placeholder="Explain your counter offer..."
                            value={counterMessage}
                            onChange={(e) => setCounterMessage(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <Button 
                          onClick={handleCounterOffer}
                          disabled={actionLoading || !counterAmount}
                          variant="outline"
                          className="w-full"
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Send Counter Offer
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Other Party Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{getOtherPartyLabel()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={otherParty?.avatar_url} />
                          <AvatarFallback>
                            {otherParty?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{otherParty?.full_name || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">{otherParty?.professional_role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Offers Tab */}
            <TabsContent value="offers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Counter Offers</CardTitle>
                </CardHeader>
                <CardContent>
                  {offers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No counter offers yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {offers.map((offer) => (
                        <div key={offer.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={offer.offered_by?.avatar_url} />
                                <AvatarFallback>
                                  {offer.offered_by?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{offer.offered_by?.full_name}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">${offer.amount}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(offer.created_at), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          {offer.message && (
                            <p className="text-sm text-muted-foreground">{offer.message}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Messages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {messages.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No messages yet.</p>
                    ) : (
                      messages.map((message) => (
                        <div key={message.id} className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs p-3 rounded-lg ${
                            message.sender_id === user?.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={message.sender?.avatar_url} />
                                <AvatarFallback>
                                  {message.sender?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{message.sender?.full_name}</span>
                            </div>
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {format(new Date(message.created_at), 'MMM dd, HH:mm')}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="space-y-4">
              <EscrowPaymentFlow deal={deal} onStatusUpdate={refreshDeal} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
} 