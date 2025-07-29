"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { MapPin, Heart, Share2, Mail, Briefcase, ArrowRight, ListFilter, Settings2, Filter, DollarSign, Star, Search, Users, Eye, Building2, Handshake } from "lucide-react";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Transition } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from '@/components/providers/session-provider';
import { useFavorites } from '@/hooks/use-favorites';
import { useToast } from '@/components/ui/use-toast';

// Function to format listing type values for display
const formatListingType = (listingType: string): string => {
  const typeMap: { [key: string]: string } = {
    // Founder listing types
    "find-funding": "Find Funding",
    "cofounder": "Co Founder",
    "expert-freelance": "Expert/ Freelance",
    "employee": "Employee",
    "mentor": "Mentor",
    "sell-startup": "Startup Sale",
    
    // Investor listing types
    "investment-opportunity": "Investment Opportunity",
    "buy-startup": "Buy Startup",
    "co-investor": "Co-investor",
    
    // Expert listing types
    "mission": "Mission",
    "job": "Job"
  };
  
  return typeMap[listingType] || listingType;
};

// Helper functions to get proper labels based on listing type and profile type
const getAmountLabel = (listingType: string, profileType: string): string => {
  if (profileType === "Founder" && listingType === "sell-startup") {
    return "Sale Price";
  }
  if (profileType === "Investor" && (listingType === "investment-opportunity" || listingType === "buy-startup")) {
    return "Investment Capacity";
  }
  if (profileType === "Investor" && listingType === "co-investor") {
    return "Missing Capital";
  }
  if (profileType === "Founder" && listingType === "find-funding") {
    return "Amount Seeking";
  }
  return "Amount";
};

const getCompensationValueLabel = (listingType: string, profileType: string): string => {
  if (profileType === "Founder" && listingType === "sell-startup") {
    return "Percentage for Sale";
  }
  if (profileType === "Investor" && listingType === "co-investor") {
    return "Equity Offered";
  }
  return "Compensation";
};

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: "spring",
                bounce: 0.3,
                duration: 1.5,
            } as Transition,
        },
    },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.8,
      stiffness: 50
    }
  },
  hover: {
    y: -5,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.3
    }
  }
};

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.8,
      stiffness: 50
    }
  }
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.8,
      stiffness: 50
    }
  }
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.8,
      stiffness: 50
    }
  }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.8,
      stiffness: 50
    }
  }
};

const contentVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.8,
      stiffness: 50
    }
  }
};

const filterVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.8,
      stiffness: 50
    }
  }
};

const searchVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.8,
      stiffness: 50
    }
  }
};

const buttonVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.8,
      stiffness: 50
    }
  }
};

const statsVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.8,
      stiffness: 50
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.8,
      stiffness: 50
    }
  }
};

type ListingType = "all" | "Job" | "Project" | "Investment" | "Partnership";

export default function DashboardListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [listingType, setListingType] = useState<ListingType>("all");
  const { user } = useSession();
  const { likeListing, unlikeListing, isListingLiked } = useFavorites();
  const { toast } = useToast();

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      let query = supabase
        .from("listings")
        .select("*, profiles(full_name, professional_role, avatar_url, country, profile_type)")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (listingType && listingType !== "all") {
        query = query.eq("listing_type", listingType.toLowerCase());
      }

      const { data, error } = await query;

      if (error) {
        setError("Failed to fetch listings");
        console.error("Error fetching listings:", error);
      } else {
        setListings(data || []);
      }
      setLoading(false);
    };

    fetchListings();
  }, [listingType]);

  const handleProfileClick = (userId: string) => {
    router.push(`/dashboard/profile/${userId}`);
  };

  const handleLikeListing = async (listingId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like listings",
        variant: "destructive",
      });
      return;
    }

    try {
      const isLiked = await isListingLiked(listingId);
      if (isLiked) {
        await unlikeListing(listingId);
        toast({
          title: "Removed from favorites",
          description: "Listing removed from your favorites",
        });
      } else {
        await likeListing(listingId);
        toast({
          title: "Added to favorites",
          description: "Listing added to your favorites",
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  };

  const handleMessage = (userId: string) => {
    router.push(`/dashboard/messages?userId=${userId}`);
  };

  const handleShare = async (listing: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: listing.description,
          url: `${window.location.origin}/dashboard/listings/${listing.id}`,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      const url = `${window.location.origin}/dashboard/listings/${listing.id}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Listing link copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <h2 className="text-xl font-semibold mb-2">Error loading listings</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <motion.div 
        className="max-w-7xl mx-auto p-6 space-y-8"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        {/* Header Section */}
        <motion.div variants={slideInLeft} className="space-y-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold tracking-tight">Discover Opportunities</h1>
            <p className="text-xl text-muted-foreground">
              Find the perfect match for your next venture
            </p>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          variants={statsVariants}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{listings.length}</p>
                <p className="text-sm text-muted-foreground">Active Opportunities</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{new Set(listings.map(l => l.profiles?.id)).size}</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{listings.filter(l => l.featured).length}</p>
                <p className="text-sm text-muted-foreground">Featured</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{listings.filter(l => l.listing_type === 'investment-opportunity').length}</p>
                <p className="text-sm text-muted-foreground">Investment Opportunities</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Filters and Search */}
        <motion.div 
          variants={filterVariants}
          className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
        >
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Search opportunities..."
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Select value={listingType} onValueChange={(value) => setListingType(value as ListingType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Job">Job</SelectItem>
                <SelectItem value="Project">Project</SelectItem>
                <SelectItem value="Investment">Investment</SelectItem>
                <SelectItem value="Partnership">Partnership</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Advanced Filters
          </Button>
        </motion.div>

        {/* Listings Grid */}
        <motion.div 
          variants={contentVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence>
            {listings.map((listing, index) => (
              <motion.div
                key={listing.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ delay: index * 0.1 }}
                whileHover="hover"
                className="h-full"
              >
                <Card className="group relative h-full bg-gradient-to-br from-white to-gray-50/50 dark:from-zinc-900/80 dark:to-zinc-800/60 border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-3xl overflow-hidden backdrop-blur-sm">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <CardContent className="relative p-0 flex flex-col h-full">
                    {/* Header Section */}
                    <div className="p-4 pb-3">
                      {/* Listing Type Badge */}
                      <div className="flex justify-end mb-2">
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs px-2 py-1">
                          {formatListingType(listing.listing_type)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <Avatar className="h-12 w-12 border-4 border-white/80 dark:border-zinc-800/80 shadow-lg">
                          <AvatarImage src={listing.profiles?.avatar_url || undefined} alt={listing.profiles?.full_name || 'User'} />
                          <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary to-primary/80 text-white">
                            {listing.profiles?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Listing Info */}
                        <div className="flex-1 min-w-0">
                            <h3 
                            className="font-bold text-base text-gray-900 dark:text-white cursor-pointer hover:text-primary transition-colors mb-1"
                              onClick={() => handleProfileClick(listing.profiles?.id)}
                            >
                              {listing.profiles?.full_name || 'Unknown User'}
                            </h3>
                          
                          {listing.profiles?.professional_role && (
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {listing.profiles.professional_role}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Title and Description */}
                    <div className="px-4 pb-4">
                      <h4 className="font-bold text-base text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                        {listing.title}
                      </h4>
                      
                      <div 
                        className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed mb-4"
                        dangerouslySetInnerHTML={{ __html: listing.description || '' }}
                      />
                    </div>

                    {/* Details Section */}
                    <div className="px-4 pb-4 space-y-3">
                      {/* Skills */}
                      {listing.skills && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Required Skills</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {(Array.isArray(listing.skills) ? listing.skills : listing.skills.split(",").map((s: string) => s.trim())).map((skill: string) => (
                              <Badge 
                                key={skill} 
                                variant="secondary"
                                className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 
                                         text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-700/50 
                                         hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors
                                         text-xs px-2 py-0.5 rounded-lg"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Compensation Information */}
                      {(listing.compensation_type || listing.compensation_value || listing.amount) && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {listing.profiles?.profile_type === "Founder" && listing.listing_type === "sell-startup" ? "Sale Details" : 
                             listing.profiles?.profile_type === "Investor" && (listing.listing_type === "investment-opportunity" || listing.listing_type === "buy-startup") ? "Investment Details" :
                             listing.profiles?.profile_type === "Investor" && listing.listing_type === "co-investor" ? "Co-Investment Details" :
                             "Compensation"}
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {listing.compensation_type && (
                              <Badge 
                                variant="secondary"
                                className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                         text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                         hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                         text-xs px-2 py-0.5 rounded-lg"
                              >
                                {listing.compensation_type}
                              </Badge>
                            )}
                            {listing.compensation_value && (
                              <>
                                {typeof listing.compensation_value === 'object' ? (
                                  <>
                                    {listing.compensation_value.salary && (
                              <Badge 
                                variant="secondary"
                                className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                         text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                         hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                         text-xs px-2 py-0.5 rounded-lg"
                              >
                                        Salary: {listing.compensation_value.salary}
                              </Badge>
                                    )}
                                    {listing.compensation_value.equity && (
                                      <Badge 
                                        variant="secondary"
                                        className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                                 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                                 hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                                 text-xs px-2 py-0.5 rounded-lg"
                                      >
                                        Equity: {listing.compensation_value.equity}
                                      </Badge>
                                    )}
                                    {listing.compensation_value.cash && (
                                      <Badge 
                                        variant="secondary"
                                        className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                                 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                                 hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                                 text-xs px-2 py-0.5 rounded-lg"
                                      >
                                        Cash: {listing.compensation_value.cash}
                                      </Badge>
                                    )}
                                    {listing.compensation_value.value && (
                                      <Badge 
                                        variant="secondary"
                                        className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                                 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                                 hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                                 text-xs px-2 py-0.5 rounded-lg"
                                      >
                                        {getCompensationValueLabel(listing.listing_type, listing.profiles?.profile_type || '')}: {listing.compensation_value.value}
                                      </Badge>
                                    )}
                                  </>
                                ) : (
                                  <Badge 
                                    variant="secondary"
                                    className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                             text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                             hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                             text-xs px-2 py-0.5 rounded-lg"
                                  >
                                    {getCompensationValueLabel(listing.listing_type, listing.profiles?.profile_type || '')}: {listing.compensation_value}
                                  </Badge>
                                )}
                              </>
                            )}
                            {listing.amount && (
                              <Badge 
                                variant="secondary"
                                className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                         text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                         hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                         text-xs px-2 py-0.5 rounded-lg"
                              >
                                {getAmountLabel(listing.listing_type, listing.profiles?.profile_type || '')}: {listing.amount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Key Details Badges */}
                      <div className="flex flex-wrap gap-2">
                        {listing.funding_stage && (
                          <div className="flex items-center gap-1.5 bg-purple-500/10 text-purple-600 px-3 py-1.5 rounded-full text-xs font-medium">
                            <Building2 className="h-3.5 w-3.5" />
                            <span>Stage: {listing.funding_stage}</span>
                          </div>
                        )}
                      </div>

                      {/* Location and Sector */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin className="h-3 w-3" />
                        <span>{listing.location_city ? `${listing.location_city}, ` : ""}{listing.location_country}</span>
                        {listing.sector && (
                          <>
                            <span className="mx-1">•</span>
                            <Badge variant="outline" className="text-xs border-gray-200 dark:border-gray-700">
                              {listing.sector}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto p-4 pt-3">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl h-8"
                          onClick={() => router.push(`/dashboard/listings/${listing.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Listing
                        </Button>
                        
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20" 
                            onClick={() => handleLikeListing(listing.id)}
                          >
                            <Star 
                              className={`h-4 w-4 ${
                                isListingLiked(listing.id) 
                                  ? "fill-yellow-400 text-yellow-500" 
                                  : "text-gray-400 hover:text-yellow-500"
                              }`} 
                              strokeWidth={isListingLiked(listing.id) ? 0 : 1.5} 
                            />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            onClick={() => handleMessage(listing.user_id)}
                          >
                            <Mail className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {listings.length === 0 && !loading && (
          <motion.div 
            variants={fadeIn}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <Handshake className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No opportunities found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or check back later for new opportunities.
            </p>
            <Button onClick={() => setListingType("all")}>Clear Filters</Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
} 