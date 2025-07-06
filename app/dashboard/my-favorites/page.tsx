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
import { Search, SlidersHorizontal, Eye, Heart, Share2, Mail, Briefcase, MapPin, Building2, Loader2, Star } from 'lucide-react';

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
  const router = useRouter();
  const { toast } = useToast();
  const { 
    savedProfiles, 
    likedListings, 
    loading, 
    unsaveProfile, 
    unlikeListing 
  } = useFavorites();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
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

  // Transform saved profiles data
  const profiles: Profile[] = savedProfiles.map(saved => ({
    id: saved.profile.id,
    type: 'profile' as const,
    addedDate: formatDate(saved.created_at),
    image: saved.profile.avatar_url || '',
    name: saved.profile.full_name || 'Unknown',
    title: saved.profile.professional_role || 'No title',
    description: saved.profile.bio || 'No description available.',
    skills: (saved.profile.skills || []).map((skill: string) => ({
      label: skill,
      color: getSkillColor(skill)
    })),
    location: saved.profile.country || 'Unknown location',
  }));

  // Transform liked listings data
  const listings: Listing[] = likedListings.map(liked => ({
    id: liked.listing.id,
    type: 'listing' as const,
    addedDate: formatDate(liked.created_at),
    icon: <Briefcase className="h-8 w-8 text-muted-foreground" />,
    title: liked.listing.title,
    company: liked.listing_profile?.full_name || 'Unknown',
    location: `${liked.listing.location_city ? `${liked.listing.location_city}, ` : ''}${liked.listing.location_country}`,
    description: stripHtml(liked.listing.description),
    postedAgo: formatDate(liked.listing.created_at),
  }));

  const filteredContent: FavoriteItem[] = [
    ...profiles.filter(profile => {
      const matchesSearch = searchTerm === '' || 
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        profile.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'all' || activeTab === 'profiles';
      return matchesSearch && matchesTab;
    }),
    ...listings.filter(listing => {
      const matchesSearch = searchTerm === '' || 
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        listing.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        listing.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'all' || activeTab === 'listings';
      return matchesSearch && matchesTab;
    }),
  ];

  const handleRemoveFavorite = async (item: FavoriteItem) => {
    try {
      if (item.type === 'profile') {
        await unsaveProfile(item.id);
        toast({
          title: "Profile removed from favorites",
          description: "The profile has been removed from your favorites.",
        });
      } else {
        await unlikeListing(item.id);
        toast({
          title: "Listing removed from favorites",
          description: "The listing has been removed from your favorites.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from favorites. Please try again.",
        variant: "destructive",
      });
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
        {filteredContent.length > 0 ? (
          filteredContent.map((item) => (
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
                    onClick={() => handleRemoveFavorite(item)}
                    className="text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50"
                  >
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />
                  </Button>
                  <Button variant="ghost" size="icon"><Share2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon"><Mail className="h-4 w-4" /></Button>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground">
            No favorites found.
          </p>
        )}
      </div>
    </div>
  );
}
 