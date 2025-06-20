"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { MapPin, Heart, Share2, Mail, Briefcase, ArrowRight, ListFilter, Settings2, Filter, DollarSign, Star, Search, Users } from "lucide-react";
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
        .select("*, profiles(full_name, professional_role, avatar_url, country)")
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
              <Briefcase className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{listings.length}</p>
                <p className="text-sm text-muted-foreground">Active Listings</p>
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
                placeholder="Search listings..."
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
              >
                <Card className="h-full cursor-pointer transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={listing.profiles?.avatar_url} alt={listing.profiles?.full_name} />
                          <AvatarFallback>{listing.profiles?.full_name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{listing.profiles?.full_name}</p>
                          <p className="text-sm text-muted-foreground truncate">{listing.profiles?.professional_role}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeListing(listing.id);
                        }}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Heart className={cn("h-4 w-4", isListingLiked(listing.id) && "fill-current text-primary")} />
                      </Button>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default" className="text-xs">{listing.profile_type}</Badge>
                      <Badge variant="secondary" className="text-xs">{formatListingType(listing.listing_type)}</Badge>
                      {listing.sector && <Badge variant="outline" className="text-xs">{listing.sector}</Badge>}
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-2 mb-2">{listing.title}</h3>
                      <div 
                        className="text-sm text-muted-foreground line-clamp-3 prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:text-muted-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-md prose-img:shadow-md
                        [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1
                        [&_p]:my-2 [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_h4]:text-base
                        [&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic
                        [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:overflow-x-auto
                        [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
                        [&_hr]:my-4 [&_hr]:border-muted"
                        dangerouslySetInnerHTML={{ __html: listing.description || '' }}
                      />
                    </div>

                    {/* Details */}
                    <div className="space-y-2">
                      {listing.location_country && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{listing.location_country}{listing.location_city && `, ${listing.location_city}`}</span>
                        </div>
                      )}
                      {listing.amount && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>{listing.amount}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/listings/${listing.id}`);
                        }}
                      >
                        View Details
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMessage(listing.profiles.id);
                        }}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(listing);
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
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
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No listings found</h3>
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