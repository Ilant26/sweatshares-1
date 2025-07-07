'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, MapPin, Calendar, Briefcase, Building, Mail, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from 'sonner';
import Link from 'next/link';

interface AlertMatch {
  id: string;
  matched_entity_id: string;
  matched_entity_type: 'profile' | 'listing';
  match_score: number;
  notified: boolean;
  created_at: string;
  entity_data: any;
}

export default function AlertMatchesPage() {
  const params = useParams();
  const router = useRouter();
  const alertId = params.id as string;
  
  const [matches, setMatches] = useState<AlertMatch[]>([]);
  const [alertType, setAlertType] = useState<'profile' | 'listing'>('profile');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (alertId) {
      fetchMatches();
    }
  }, [alertId]);

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/alerts/${alertId}/matches`);
      const data = await response.json();
      
      if (response.ok) {
        setMatches(data.matches || []);
        setAlertType(data.alert_type);
      } else {
        toast.error(data.error || 'Failed to fetch matches');
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to fetch matches');
    } finally {
      setIsLoading(false);
    }
  };

  const formatListingType = (listingType: string): string => {
    const typeMap: { [key: string]: string } = {
      'find-funding': 'Find Funding',
      'cofounder': 'Co-Founder',
      'expert-freelance': 'Expert/Freelancer',
      'employee': 'Employee',
      'mentor': 'Mentor',
      'sell-startup': 'Sell Startup',
      'investment-opportunity': 'Investment Opportunity',
      'buy-startup': 'Buy Startup',
      'co-investor': 'Co-investor',
      'mission': 'Mission',
      'job': 'Job',
    };
    return typeMap[listingType] || listingType;
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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alert Matches</h1>
          <p className="text-muted-foreground">
            {matches.length} {alertType === 'profile' ? 'profile' : 'listing'} match{matches.length !== 1 ? 'es' : ''} found
          </p>
        </div>
      </div>

      {/* Matches */}
      {matches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
            <p className="text-muted-foreground text-center">
              We'll notify you when new {alertType === 'profile' ? 'profiles' : 'listings'} match your criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {matches.map((match) => {
            const entity = match.entity_data;
            
            if (alertType === 'profile') {
              return (
                <Card key={match.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={entity.avatar_url} />
                          <AvatarFallback>
                            {entity.full_name?.charAt(0) || entity.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {entity.full_name || entity.username || 'Anonymous User'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            {entity.professional_role || 'No role specified'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {entity.profile_type || 'Profile'}
                        </Badge>
                        <Link href={`/dashboard/profile/${entity.id}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {entity.bio && (
                      <p className="text-sm text-muted-foreground">{entity.bio}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {entity.country && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {entity.country}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Joined {format(new Date(entity.created_at), 'MMM yyyy')}
                      </div>
                    </div>

                    {entity.skills && entity.skills.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {entity.skills.slice(0, 8).map((skill: string) => (
                            <Badge key={skill} className={`text-xs ${getSkillColor(skill)}`}>
                              {skill}
                            </Badge>
                          ))}
                          {entity.skills.length > 8 && (
                            <Badge variant="outline" className="text-xs">
                              +{entity.skills.length - 8} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="text-xs text-muted-foreground">
                        Matched on {format(new Date(match.created_at), 'MMM dd, yyyy')}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant={match.notified ? "secondary" : "default"}>
                          {match.notified ? "Viewed" : "New"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            } else {
              // Listing match
              return (
                <Card key={match.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={entity.profiles?.avatar_url} />
                          <AvatarFallback>
                            {entity.profiles?.full_name?.charAt(0) || entity.profiles?.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {entity.title || 'Untitled Listing'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            by {entity.profiles?.full_name || entity.profiles?.username || 'Anonymous'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {formatListingType(entity.listing_type)}
                        </Badge>
                        <Link href={`/dashboard/listings/${entity.id}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Listing
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {entity.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {entity.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {entity.location_country && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {entity.location_country}{entity.location_city && `, ${entity.location_city}`}
                        </div>
                      )}
                      {entity.sector && (
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {entity.sector}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Posted {format(new Date(entity.created_at), 'MMM dd, yyyy')}
                      </div>
                    </div>

                    {entity.skills && entity.skills.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Required Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {entity.skills.split(', ').filter((skill: string) => skill.trim()).slice(0, 6).map((skill: string) => (
                            <Badge key={skill.trim()} className={`text-xs ${getSkillColor(skill.trim())}`}>
                              {skill.trim()}
                            </Badge>
                          ))}
                          {entity.skills.split(', ').filter((skill: string) => skill.trim()).length > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{entity.skills.split(', ').filter((skill: string) => skill.trim()).length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="text-xs text-muted-foreground">
                        Matched on {format(new Date(match.created_at), 'MMM dd, yyyy')}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant={match.notified ? "secondary" : "default"}>
                          {match.notified ? "Viewed" : "New"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }
          })}
        </div>
      )}
    </div>
  );
} 