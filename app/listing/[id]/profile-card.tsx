'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserPlus, MapPin, Briefcase, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Badge } from '@/components/ui/badge';

interface ProfileCardProps {
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    professional_role: string | null;
    country?: string | null;
    company?: string | null;
    experience_years?: number | null;
  };
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleMessage = () => {
    router.push(`/dashboard/messages?userId=${profile.id}`);
  };

  const handleConnect = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to connect with users');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('connections')
        .insert({
          sender_id: user.id,
          receiver_id: profile.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for the receiver
      await supabase
        .from('notifications')
        .insert({
          user_id: profile.id,
          type: 'connection_request',
          content: 'sent you a connection request',
          sender_id: user.id,
          read: false
        });

      toast.success('Connection request sent successfully');
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
    }
  };

  return (
    <Card className="border-none shadow-lg bg-white dark:bg-zinc-900/50">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Header Section - Avatar and Basic Info */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-primary/10 shrink-0">
              <AvatarImage src={profile?.avatar_url || '/placeholder-user.jpg'} alt={profile?.full_name || 'User'} />
              <AvatarFallback className="text-2xl">{profile?.full_name?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-bold tracking-tight truncate">
                {profile?.full_name || 'Unknown User'}
              </CardTitle>
              <CardDescription className="text-base mt-0.5 truncate">
                {profile?.professional_role}
              </CardDescription>
              {profile?.company && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  {profile.company}
                </p>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile?.country && (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium text-sm">{profile.country}</p>
                </div>
              </div>
            )}

            {profile?.experience_years && (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <Briefcase className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p className="font-medium text-sm">{profile.experience_years} years</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button 
              className="flex-1 gap-2 min-w-[120px] h-9" 
              onClick={handleMessage}
            >
              <MessageSquare className="h-4 w-4" />
              Message
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 gap-2 min-w-[120px] h-9" 
              onClick={handleConnect}
            >
              <UserPlus className="h-4 w-4" />
              Connect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 