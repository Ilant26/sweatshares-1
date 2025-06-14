'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ProfileCardProps {
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    professional_role: string | null;
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
    <Card className="border-none shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Avatar className="h-24 w-24 border-2 border-primary/10">
            <AvatarImage src={profile?.avatar_url || '/placeholder-user.jpg'} alt={profile?.full_name || 'User'} />
            <AvatarFallback className="text-lg">{profile?.full_name?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-left">
            <CardTitle className="text-2xl font-bold mb-2">{profile?.full_name || 'Unknown User'}</CardTitle>
            <CardDescription className="text-lg mb-4">{profile?.professional_role}</CardDescription>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Button className="gap-2" onClick={handleMessage}>
                <MessageSquare className="h-4 w-4" />
                Message
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleConnect}>
                <UserPlus className="h-4 w-4" />
                Connect
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 