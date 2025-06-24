'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Handshake, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  ArrowRight,
  Calendar,
  User,
  Building2,
  MapPin,
  Eye
} from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { useSession } from '@/components/providers/session-provider';
import { getUserDeals, Deal } from '@/lib/deals';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';

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

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSession();
  const { toast } = useToast();

  // Define freelancer search listing types
  const freelancerSearchTypes = ['expert-freelance', 'employee', 'mentor', 'job'];

  useEffect(() => {
    const fetchDeals = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const userDeals = await getUserDeals(user.id);
        setDeals(userDeals);
      } catch (error) {
        console.error('Error fetching deals:', error);
        toast({
          title: "Error",
          description: "Failed to load your deals.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, [user, toast]);

  const getDealRole = (deal: Deal) => {
    if (deal.buyer_id === user?.id) return 'buyer';
    if (deal.seller_id === user?.id) return 'seller';
    return 'unknown';
  };

  const getRoleLabel = (deal: Deal, role: string) => {
    const isFreelancerSearch = deal.listing?.listing_type && freelancerSearchTypes.includes(deal.listing.listing_type);
    if (!isFreelancerSearch) return role;
    return role === 'buyer' ? 'client' : 'freelancer';
  };

  const getOtherParty = (deal: Deal) => {
    const role = getDealRole(deal);
    if (role === 'buyer') {
      return deal.seller;
    } else if (role === 'seller') {
      return deal.buyer;
    }
    return null;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to view your deals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-background">
      <motion.div 
        className="max-w-7xl mx-auto p-6 space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">My Deals</h1>
          <p className="text-muted-foreground">
            Manage your deals, track progress, and handle payments
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Deals', value: deals.length, icon: Handshake },
            { label: 'Pending', value: deals.filter(d => d.status === 'pending').length, icon: Clock },
            { label: 'In Progress', value: deals.filter(d => d.status === 'in_progress').length, icon: Building2 },
            { label: 'Completed', value: deals.filter(d => d.status === 'completed').length, icon: CheckCircle },
          ].map((stat, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center space-x-3">
                <stat.icon className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>

        {/* Deals List */}
        <motion.div variants={itemVariants} className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading deals...</p>
            </div>
          ) : deals.length === 0 ? (
            <Card className="p-8 text-center">
              <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No deals found</h3>
              <p className="text-muted-foreground mb-4">
                You haven't made or received any deals yet.
              </p>
              <Button asChild>
                <Link href="/dashboard/listings">
                  Browse Listings
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {deals.map((deal, index) => (
                <motion.div
                  key={deal.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
                          {/* Header */}
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={getOtherParty(deal)?.avatar_url} />
                              <AvatarFallback>
                                {getOtherParty(deal)?.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">
                                  {deal.listing?.title || 'Untitled Listing'}
                                </h3>
                                <Badge className={getStatusColor(deal.status)}>
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(deal.status)}
                                    {formatStatus(deal.status)}
                                  </div>
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">
                                with {getOtherParty(deal)?.full_name || 'Unknown User'}
                              </p>
                            </div>
                          </div>

                          {/* Deal Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-primary" />
                              <span className="font-medium">${deal.amount}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(deal.created_at), 'MMM dd, yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-primary" />
                              <span className="text-sm text-muted-foreground capitalize">
                                You are the {getRoleLabel(deal, getDealRole(deal))}
                              </span>
                            </div>
                          </div>

                          {/* Description */}
                          {deal.description && (
                            <div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {deal.description}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 ml-4">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/dashboard/deals/${deal.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                          <Button asChild size="sm">
                            <Link href={`/dashboard/deals/${deal.id}`}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
} 