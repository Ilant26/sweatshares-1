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
import { Search, SlidersHorizontal, Eye, Heart, Share2, Briefcase, MapPin, Building2, Loader2, Star } from 'lucide-react';

interface Profile {
  id: string;
  type: 'profile';
  addedDate: string;
  image: string;
  name: string;
  title: string;
  description: string;
  skills: { label: string; color: string; }[];
  location: string;
}

interface Listing {
  id: string;
  type: 'listing';
  addedDate: string;
  icon: React.ReactNode;
  title: string;
  company: string;
  location: string;
  description: string;
  postedAgo: string;
}

type FavoriteItem = Profile | Listing;

export default function MyFavoritesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [softRemovedItems, setSoftRemovedItems] = useState<Set<string>>(new Set());
  const [removedProfilesCache, setRemovedProfilesCache] = useState<Profile[]>([]);
  const [removedListingsCache, setRemovedListingsCache] = useState<Listing[]>([]);
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
    
    if (minutes < 1) return 'Added to favorite just now';
    if (minutes < 60) return `Added to favorite ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    if (hours < 24) return `Added to favorite ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    if (days === 0) return 'Added to favorite today';
    if (days === 1) return 'Added to favorite yesterday';
    if (days < 7) return `Added to favorite ${days} days ago`;
    if (days < 30) return `Added to favorite ${Math.floor(days / 7)} ${Math.floor(days / 7) === 1 ? 'week' : 'weeks'} ago`;
    if (days < 365) return `Added to favorite ${Math.floor(days / 30)} ${Math.floor(days / 30) === 1 ? 'month' : 'months'} ago`;
    return `Added to favorite ${Math.floor(days / 365)} ${Math.floor(days / 365) === 1 ? 'year' : 'years'} ago`;
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

  // Transform saved profiles data and include cached removed items
  const activeProfiles = savedProfiles.map(saved => ({
    id: saved.profile.id,
    type: 'profile' as const,
    addedDate: formatDate(saved.created_at),
    image: saved.profile.avatar_url || '',
    name: saved.profile.full_name || 'Anonymous',
    title: saved.profile.professional_role || 'Role not specified',
    description: saved.profile.bio || 'No description available',
    skills: (saved.profile.skills || []).map((skill: string) => ({
      label: skill,
      color: getSkillColor(skill),
    })),
    location: saved.profile.country || 'Location not specified',
  }));

  // Transform liked listings data and include cached removed items
  const listings = likedListings.map(liked => ({
    id: liked.listing.id,
    type: 'listing' as const,
    addedDate: formatDate(liked.created_at),
    icon: <Building2 className="h-4 w-4" />,
    title: liked.listing.title || 'Untitled Listing',
    company: liked.listing.sector || 'Company not specified',
    location: liked.listing.location_country || 'Location not specified',
    description: stripHtml(liked.listing.description || 'No description available'),
    postedAgo: formatDate(liked.listing.created_at),
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

  // Filter items based on search and tab
  const filteredItems = allItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      (item.type === 'profile' ? item.name : item.title)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.type === 'listing' && item.company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTab = activeTab === 'all' || activeTab === item.type + 's';
    return matchesSearch && matchesTab;
  });

  const handleRemoveFavorite = async (item: FavoriteItem) => {
    try {
      // Add to soft removed items without changing order
      setSoftRemovedItems(prev => new Set([...prev, item.id]));
      
      if (item.type === 'profile') {
        // Cache the profile before removing
        setRemovedProfilesCache(prev => {
          if (prev.some(p => p.id === item.id)) return prev;
          return [...prev, item as Profile];
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
          return [...prev, item as Listing];
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
                    <div className="flex items-center space-x-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <SlidersHorizontal className="mr-2 h-4 w-4" /> Sort by
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Date Added (newest)</DropdownMenuItem>
                                <DropdownMenuItem>Date Added (oldest)</DropdownMenuItem>
                                <DropdownMenuItem>Name (A-Z)</DropdownMenuItem>
                                <DropdownMenuItem>Name (Z-A)</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search in your favorites..."
            className="pl-8 max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const isSoftRemoved = softRemovedItems.has(item.id);
            return (
            <Card key={item.id} className="flex flex-col">
              <CardHeader className="flex-row items-center gap-4 space-y-0 pb-2">
                {item.type === 'profile' ? (
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={item.image} alt={item.name} />
                    <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                ) : (
                  (item as Listing).icon
                )}
                <div className="flex-1">
                  <CardDescription className="text-xs font-semibold">Added {item.addedDate}</CardDescription>
                  <CardTitle className="text-lg leading-tight">
                    {item.type === 'profile' ? item.name : item.title}
                  </CardTitle>
                  {item.type === 'listing' && (
                    <CardDescription className="text-sm text-muted-foreground">
                      {(item as Listing).company} &bull; {(item as Listing).location}
                    </CardDescription>
                  )}
                  {item.type === 'profile' && (
                    <CardDescription className="text-sm text-muted-foreground">
                      {item.title}
                    </CardDescription>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {item.description}
                </p>
                {item.type === 'profile' && item.skills && item.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.skills.map((skill, index) => (
                      <Badge key={index} className={skill.color}>
                        {skill.label}
                      </Badge>
                    ))}
                  </div>
                )}
                {item.type === 'listing' && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-1 h-4 w-4" />
                    <span>{(item as Listing).location}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="mt-auto flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewItem(item)}
                >
                  {item.type === 'profile' ? 'View Profile' : 'View Listing'}
                </Button>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                      onClick={() => handleToggleFavorite(item)}
                      className={isSoftRemoved 
                        ? "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50" 
                        : "text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50"
                      }
                  >
                      <Star className={`h-4 w-4 ${isSoftRemoved ? 'text-gray-400' : 'fill-yellow-400 text-yellow-500'}`} />
                  </Button>
                  <Button variant="ghost" size="icon"><Share2 className="h-4 w-4" /></Button>
                </div>
              </CardFooter>
            </Card>
            );
          })
        ) : (
          <p className="col-span-full text-center text-muted-foreground">
            No favorites found.
          </p>
        )}
      </div>
    </div>
  );
}
 