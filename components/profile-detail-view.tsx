import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, Briefcase, Mail, Star, MessageCircle, Share2, Building2, DollarSign, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useUser } from '@/hooks/use-user';
import { useFavorites } from '@/hooks/use-favorites';

interface ProfileDetailViewProps {
  profile: any;
  onClose: () => void;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const getSkillColor = (skill: string) => {
  const colors = [
    'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
    'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
  ];
  const index = skill.length % colors.length;
  return colors[index];
};

export function ProfileDetailView({ profile, onClose }: ProfileDetailViewProps) {
  const { user } = useUser();
  const { saveProfile, unsaveProfile, isProfileSaved } = useFavorites();

  const handleMessage = () => {
    if (!user) return;
    window.location.href = `/dashboard/messages?userId=${profile.id}`;
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    
    try {
      if (isProfileSaved(profile.id)) {
        await unsaveProfile(profile.id);
      } else {
        await saveProfile(profile.id);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const skillsArr = Array.isArray(profile.skills)
    ? profile.skills
    : typeof profile.skills === "string"
    ? profile.skills.split(",").map((s: string) => s.trim()).filter((s: string) => Boolean(s))
    : [];

  return (
    <div className="p-6 space-y-6">
      {/* Profile Header */}
      <div className="text-center space-y-4">
        <Avatar className="h-24 w-24 mx-auto border-4 border-primary/20">
          <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || undefined} />
          <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-primary to-primary/80 text-white">
            {getInitials(profile.full_name)}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <h1 className="text-2xl font-bold">{profile.full_name}</h1>
          <p className="text-muted-foreground">{profile.professional_role}</p>
          {profile.company && (
            <p className="text-sm text-muted-foreground">{profile.company}</p>
          )}
        </div>

        {/* Profile Type Badge */}
        {profile.profile_type && (
          <div className="flex justify-center">
            <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 px-3 py-1.5 rounded-full text-sm font-medium">
              {profile.profile_type === "Founder" && <Briefcase className="h-4 w-4" />}
              {profile.profile_type === "Investor" && <DollarSign className="h-4 w-4" />}
              {profile.profile_type === "Expert" && <Users className="h-4 w-4" />}
              <span>{profile.profile_type}</span>
            </div>
          </div>
        )}

        {/* Location and Date */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          {profile.country && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{profile.country}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span>Joined {profile.created_at ? format(new Date(profile.created_at), "MMM yyyy") : "recently"}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {user && profile.id !== user.id && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <Button onClick={handleMessage} className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Message
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSaveProfile}
              className="flex items-center gap-2"
            >
              <Star className={`h-4 w-4 ${isProfileSaved(profile.id) ? 'fill-yellow-400 text-yellow-500' : ''}`} strokeWidth={isProfileSaved(profile.id) ? 0 : 1.5} />
              {isProfileSaved(profile.id) ? 'Saved' : 'Save Profile'}
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Bio Section */}
      {profile.bio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Skills Section */}
      {skillsArr.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Skills & Expertise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skillsArr.map((skill: string) => (
                <Badge 
                  key={skill} 
                  className={`px-3 py-1 text-sm font-medium ${getSkillColor(skill)}`}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.company && (
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Company</p>
                <p className="text-sm text-muted-foreground">{profile.company}</p>
              </div>
            </div>
          )}
          
          {profile.country && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{profile.country}</p>
              </div>
            </div>
          )}

          {profile.created_at && (
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Member Since</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(profile.created_at), "MMMM yyyy")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Full Profile Button */}
      <div className="text-center pt-4">
        <Button 
          onClick={() => window.location.href = `/dashboard/profile/${profile.id}`}
          className="w-full"
        >
          View Full Profile
        </Button>
      </div>
    </div>
  );
} 