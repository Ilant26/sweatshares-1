import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, Briefcase, Mail, Star, MessageCircle, Share2, Building2, DollarSign, Users, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useUser } from '@/hooks/use-user';
import { useFavorites } from '@/hooks/use-favorites';
import { useRouter } from 'next/navigation';

interface ListingDetailViewProps {
  listing: any;
  onClose: () => void;
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

export function ListingDetailView({ listing, onClose }: ListingDetailViewProps) {
  const { user } = useUser();
  const { likeListing, unlikeListing, isListingLiked } = useFavorites();
  const router = useRouter();

  const handleMessage = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    window.location.href = `/dashboard/messages?userId=${listing.profiles?.id}`;
  };

  const handleLikeListing = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    try {
      if (isListingLiked(listing.id)) {
        await unlikeListing(listing.id);
      } else {
        await likeListing(listing.id);
      }
    } catch (error) {
      console.error('Error toggling listing like:', error);
    }
  };

  const handleShare = async () => {
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
    }
  };

  const handleViewProfile = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    window.location.href = `/dashboard/profile/${listing.profiles?.id}`;
  };

  const handleViewFullListing = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    window.location.href = `/dashboard/listings/${listing.id}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Listing Header */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={listing.profiles?.avatar_url || undefined} alt={listing.profiles?.full_name || 'User'} />
            <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary to-primary/80 text-white">
              {listing.profiles?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold line-clamp-2">{listing.title}</h1>
            <p className="text-muted-foreground">{listing.profiles?.full_name}</p>
            {listing.profiles?.professional_role && (
              <p className="text-sm text-muted-foreground">{listing.profiles.professional_role}</p>
            )}
          </div>
        </div>

        {/* Listing Type Badge */}
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            {formatListingType(listing.listing_type)}
          </Badge>
          {listing.sector && (
            <Badge variant="outline">{listing.sector}</Badge>
          )}
        </div>

        {/* Posted Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Posted {listing.created_at ? format(new Date(listing.created_at), "MMM dd, yyyy") : "recently"}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleMessage} className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Message
          </Button>
          <Button 
            variant="outline" 
            onClick={handleLikeListing}
            className="flex items-center gap-2"
          >
            <Star className={`h-4 w-4 ${isListingLiked(listing.id) ? 'fill-yellow-400 text-yellow-500' : ''}`} strokeWidth={isListingLiked(listing.id) ? 0 : 1.5} />
            {isListingLiked(listing.id) ? 'Saved' : 'Save'}
          </Button>
          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:text-muted-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-md prose-img:shadow-md
            [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1
            [&_p]:my-2 [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_h4]:text-base
            [&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic
            [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:overflow-x-auto
            [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
            [&_hr]:my-4 [&_hr]:border-muted"
            dangerouslySetInnerHTML={{ __html: listing.description || '' }}
          />
        </CardContent>
      </Card>

      {/* Key Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {listing.funding_stage && (
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Funding Stage</p>
                <p className="text-sm text-muted-foreground">{listing.funding_stage}</p>
              </div>
            </div>
          )}

          {listing.compensation_type && (
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Compensation Type</p>
                <p className="text-sm text-muted-foreground">{listing.compensation_type}</p>
                {listing.compensation_value && (
                  <p className="text-sm text-muted-foreground">
                    {typeof listing.compensation_value === 'object' 
                      ? listing.compensation_value.equity || listing.compensation_value.value 
                      : listing.compensation_value}
                  </p>
                )}
              </div>
            </div>
          )}

          {listing.amount && (
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Amount Seeking</p>
                <p className="text-sm text-muted-foreground">{listing.amount}</p>
              </div>
            </div>
          )}

          {listing.location_country && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-sm text-muted-foreground">
                  {listing.location_city ? `${listing.location_city}, ` : ""}{listing.location_country}
                </p>
              </div>
            </div>
          )}

          {listing.sector && (
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Sector</p>
                <p className="text-sm text-muted-foreground">{listing.sector}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* About the Author */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About the Author</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={listing.profiles?.avatar_url || undefined} alt={listing.profiles?.full_name || 'User'} />
              <AvatarFallback>{listing.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-semibold">{listing.profiles?.full_name}</h4>
              <p className="text-sm text-muted-foreground">{listing.profiles?.professional_role}</p>
              {listing.profiles?.country && (
                <p className="text-sm text-muted-foreground">{listing.profiles.country}</p>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleViewProfile}
            >
              View Profile
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* View Full Listing Button */}
      <div className="text-center pt-4">
        <Button 
          onClick={handleViewFullListing}
          className="w-full"
        >
          View Full Listing
        </Button>
      </div>
    </div>
  );
} 