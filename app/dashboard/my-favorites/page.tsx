'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useFavorites } from '@/hooks/use-favorites';
import { useToast } from '@/components/ui/use-toast';
import { Search, SlidersHorizontal, Eye, Heart, Share2, Briefcase, MapPin, Building2, Loader2, Star, User, Tag, DollarSign, Mail, X } from 'lucide-react';
import { motion, AnimatePresence, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

type FavoriteItem = {
  id: string;
  type: 'profile' | 'listing';
  addedDate: string;
  data: any;
  created_at: string;
};

// Animation variants from find-partner page
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

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Function to format listing type values for display
const formatListingType = (listingType: string): string => {
  const typeMap: { [key: string]: string } = {
    "find-funding": "Find Funding",
    "cofounder": "Co Founder",
    "expert-freelance": "Expert/ Freelance",
    "employee": "Employee",
    "mentor": "Mentor",
    "sell-startup": "Startup Sale",
    "investment-opportunity": "Investment Opportunity",
    "buy-startup": "Buy Startup",
    "co-investor": "Co-investor",
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

export default function MyFavoritesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [softRemovedItems, setSoftRemovedItems] = useState<Set<string>>(new Set());
  const [removedProfilesCache, setRemovedProfilesCache] = useState<FavoriteItem[]>([]);
  const [removedListingsCache, setRemovedListingsCache] = useState<FavoriteItem[]>([]);
  const [itemOrder, setItemOrder] = useState<string[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const { 
    savedProfiles, 
    likedListings, 
    loading, 
    saveProfile,
    unsaveProfile, 
    likeListing,
    unlikeListing 
  } = useFavorites();

  // Initialize and maintain item order
  useEffect(() => {
    const allItems = [
      ...savedProfiles.map(p => ({ id: p.profile.id, type: 'profile' })),
      ...likedListings.map(l => ({ id: l.listing.id, type: 'listing' }))
    ];
    
    setItemOrder(prev => {
      const newOrder = [...prev];
      // Add new items at their original positions
      allItems.forEach(({ id }) => {
        if (!newOrder.includes(id)) {
          newOrder.push(id);
        }
      });
      // Remove items that no longer exist and aren't in soft-removed cache
      return newOrder.filter(id => 
        allItems.some(item => item.id === id) || 
        softRemovedItems.has(id)
      );
    });
  }, [savedProfiles, likedListings]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'to favorite just now';
    if (minutes < 60) return `to favorite ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    if (hours < 24) return `to favorite ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    if (days === 0) return 'to favorite today';
    if (days === 1) return 'to favorite yesterday';
    if (days < 7) return `to favorite ${days} days ago`;
    if (days < 30) return `to favorite ${Math.floor(days / 7)} ${Math.floor(days / 7) === 1 ? 'week' : 'weeks'} ago`;
    if (days < 365) return `to favorite ${Math.floor(days / 30)} ${Math.floor(days / 30) === 1 ? 'month' : 'months'} ago`;
    return `to favorite ${Math.floor(days / 365)} ${Math.floor(days / 365) === 1 ? 'year' : 'years'} ago`;
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getSkillColor = (skill: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-orange-100 text-orange-800',
      'bg-indigo-100 text-indigo-800',
      'bg-teal-100 text-teal-800',
    ];
    const index = skill.length % colors.length;
    return colors[index];
  };

  // Transform saved profiles data to match find-partner structure
  const activeProfiles = savedProfiles.map(saved => ({
    id: saved.profile.id,
    type: 'profile' as const,
    addedDate: formatDate(saved.created_at),
    data: saved.profile,
    created_at: saved.created_at
  }));

  // Transform liked listings data to match find-partner structure
  const listings = likedListings.map(liked => ({
    id: liked.listing.id,
    type: 'listing' as const,
    addedDate: formatDate(liked.created_at),
    data: {
      ...liked.listing,
      profiles: liked.listing_profile // Map listing_profile to profiles to match find-partner structure
    },
    created_at: liked.created_at
  }));

  // Combine active and cached items, maintaining order
  const allItems = [...activeProfiles, ...removedProfilesCache, ...listings, ...removedListingsCache]
    .filter((item, index, self) => 
      // Remove duplicates, keeping the active version if it exists
      index === self.findIndex(t => t.id === item.id)
    )
    .sort((a, b) => {
      const aIndex = itemOrder.indexOf(a.id);
      const bIndex = itemOrder.indexOf(b.id);
      // If both items are in the order, use their order
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      // If only one item is in the order, put the other at the end
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      // If neither item is in the order, maintain their current order
      return 0;
    });

  // Filter items based on tab only
  const filteredItems = allItems.filter(item => {
    const matchesTab = activeTab === 'all' || activeTab === item.type + 's';
    return matchesTab;
  });

  const handleRemoveFavorite = async (item: FavoriteItem) => {
    try {
      // Add to soft removed items without changing order
      setSoftRemovedItems(prev => new Set([...prev, item.id]));
      
      if (item.type === 'profile') {
        // Cache the profile before removing
        setRemovedProfilesCache(prev => {
          if (prev.some(p => p.id === item.id)) return prev;
          return [...prev, item];
        });
        
        await unsaveProfile(item.id);
        toast({
          title: "Profile removed from favorites",
          description: "The profile has been removed from your favorites.",
        });
      } else {
        // Cache the listing before removing
        setRemovedListingsCache(prev => {
          if (prev.some(l => l.id === item.id)) return prev;
          return [...prev, item];
        });
        
        await unlikeListing(item.id);
        toast({
          title: "Listing removed from favorites",
          description: "The listing has been removed from your favorites.",
        });
      }
    } catch (error) {
      // If removal fails, restore state
      setSoftRemovedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
      
      if (item.type === 'profile') {
        setRemovedProfilesCache(prev => prev.filter(p => p.id !== item.id));
      } else {
        setRemovedListingsCache(prev => prev.filter(l => l.id !== item.id));
      }
      
      toast({
        title: "Error",
        description: "Failed to remove from favorites. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorite = async (item: FavoriteItem) => {
    const isSoftRemoved = softRemovedItems.has(item.id);
    
    if (isSoftRemoved) {
      // Re-favorite the item
      try {
        // Remove from soft removed items
        setSoftRemovedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });

        // Remove from cache since it's being re-added
        if (item.type === 'profile') {
          setRemovedProfilesCache(prev => prev.filter(p => p.id !== item.id));
          // Add back to favorites
          await saveProfile(item.id);
          toast({
            title: "Profile added back to favorites",
            description: "The profile has been re-added to your favorites.",
          });
        } else {
          setRemovedListingsCache(prev => prev.filter(l => l.id !== item.id));
          // Add back to favorites
          await likeListing(item.id);
          toast({
            title: "Listing added back to favorites",
            description: "The listing has been re-added to your favorites.",
          });
        }
      } catch (error) {
        // If re-adding fails, put it back in soft removed state
        setSoftRemovedItems(prev => new Set([...prev, item.id]));
        
        toast({
          title: "Error",
          description: "Failed to add back to favorites. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Remove from favorites
      await handleRemoveFavorite(item);
    }
  };

  const handleViewItem = (item: FavoriteItem) => {
    if (item.type === 'profile') {
      router.push(`/dashboard/profile/${item.id}`);
    } else {
      router.push(`/dashboard/listings/${item.id}`);
    }
  };

  const handleShareItem = async (item: FavoriteItem) => {
    try {
      let url = '';
      if (item.type === 'profile') {
        url = `${window.location.origin}/dashboard/profile/${item.id}`;
      } else {
        url = `${window.location.origin}/dashboard/listings/${item.id}`;
      }
      
      await navigator.clipboard.writeText(url);
      
      toast({
        title: "Link copied to clipboard",
        description: "The link has been copied to your clipboard and is ready to share.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy link",
        description: "Please try again or copy the link manually.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

      return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            {/* Header Section */}
            <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Star className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Favorites</h1>
                            <p className="text-sm text-muted-foreground">Your saved profiles and listings</p>
                        </div>
                    </div>
                </div>
            </div>

      <div className="flex items-center justify-end">
        <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full flex-1">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, idx) => {
            const isSoftRemoved = softRemovedItems.has(item.id);
            if (item.type === 'profile') {
              const profile = item.data;
              const skillsArr = Array.isArray(profile.skills)
                ? profile.skills
                : typeof profile.skills === "string"
                ? profile.skills.split(",").map((s: string) => s.trim()).filter((s: string) => Boolean(s))
                : [];
            return (
                <motion.div
                  key={profile.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  transition={{ delay: idx * 0.1 }}
                  className="h-full"
                >
                  <Card className="group relative h-full bg-gradient-to-br from-white to-gray-50/50 dark:from-zinc-900/80 dark:to-zinc-800/60 border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-3xl overflow-hidden backdrop-blur-sm">
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <CardContent className="relative p-0 flex flex-col h-full">
                      {/* Header Section */}
                      <div className="p-4 pb-3">
                        {/* Profile Type Badge */}
                        {profile.profile_type && (
                          <div className="flex justify-end mb-2">
                            <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                              {profile.profile_type === "Founder" && <Briefcase className="h-3.5 w-3.5" />}
                              {profile.profile_type === "Investor" && <DollarSign className="h-3.5 w-3.5" />}
                              {profile.profile_type === "Expert" && <Star className="h-3.5 w-3.5" />}
                              <span>{profile.profile_type}</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-4">
                          {/* Avatar with status indicator */}
                          <div className="relative">
                            <Avatar className="h-12 w-12 border-4 border-white/80 dark:border-zinc-800/80 shadow-lg">
                              <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || undefined} />
                              <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary to-primary/80 text-white">
                                {getInitials(profile.full_name)}
                              </AvatarFallback>
                  </Avatar>
                            {/* Online status indicator */}
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white dark:border-zinc-800 rounded-full" />
                          </div>
                          
                          {/* Profile Info */}
                          <div className="flex-1 min-w-0">
                              <h3 
                              className="font-bold text-base text-gray-900 dark:text-white cursor-pointer hover:text-primary transition-colors mb-1"
                                onClick={() => handleViewItem(item)}
                              >
                                {profile.full_name}
                              </h3>
                            
                            {profile.professional_role && (
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {profile.professional_role}
                                {profile.company && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <span className="text-gray-600">{profile.company}</span>
                                  </>
                                )}
                              </p>
                            )}
                            
                            {/* Location */}
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{profile.country || "Location not specified"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bio Section */}
                      {profile.bio && (
                        <div className="px-4 pb-4">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">About</h4>
                          <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                            {profile.bio}
                          </div>
                        </div>
                      )}

                      {/* Details Section */}
                      <div className="px-4 pb-4 space-y-3">
                        {/* Skills */}
                        {skillsArr.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Skills & Expertise</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {skillsArr.map((skill: string) => (
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
                </div>

                      {/* Action Buttons */}
                      <div className="mt-auto p-4 pt-3">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl h-8"
                            onClick={() => handleViewItem(item)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </Button>
                          
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                              onClick={() => handleToggleFavorite(item)}
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  isSoftRemoved
                                    ? "text-gray-400 hover:text-yellow-500"
                                    : "fill-yellow-400 text-yellow-500"
                                }`}
                                strokeWidth={isSoftRemoved ? 1.5 : 0}
                              />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              onClick={() => handleShareItem(item)}
                            >
                              <Share2 className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            } else if (item.type === 'listing') {
              const listing = item.data;
              return (
                <motion.div
                  key={listing.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  transition={{ delay: idx * 0.1 }}
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
                                onClick={() => handleViewItem(item)}
                              >
                                {listing.profiles?.full_name || listing.user_id || 'Unknown User'}
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
                  onClick={() => handleViewItem(item)}
                >
                            <Eye className="h-4 w-4 mr-2" />
                            View Listing
                </Button>
                          
                          <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                              size="sm"
                              className="h-8 w-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20" 
                      onClick={() => handleToggleFavorite(item)}
                            >
                              <Star 
                                className={`h-4 w-4 ${
                                  isSoftRemoved 
                                    ? "text-gray-400 hover:text-yellow-500" 
                                    : "fill-yellow-400 text-yellow-500"
                                }`} 
                                strokeWidth={isSoftRemoved ? 1.5 : 0} 
                              />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              onClick={() => handleShareItem(item)}
                            >
                              <Share2 className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                  </Button>
                          </div>
                        </div>
                </div>
                    </CardContent>
            </Card>
                </motion.div>
            );
            }
            return null;
          })
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-muted-foreground col-span-full">
            <img src="/images/empty-state.svg" alt="No results" className="w-32 h-32 mb-4 opacity-80" />
            <span className="text-lg font-semibold">No favorites found.</span>
            <span className="text-sm mt-1">Start adding profiles and listings to your favorites.</span>
          </div>
        )}
      </div>
    </div>
  );
}
 