"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, MessageCircle } from 'lucide-react';
import { sendFriendRequest } from '@/lib/friends';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role?: string;
  company?: string;
}

export default function InviteContactsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .neq('id', user.id);

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (userId: string) => {
        try {
            await sendFriendRequest(userId);
            toast.success('Friend request sent successfully');
        } catch (error) {
            console.error('Error sending friend request:', error);
            toast.error('Failed to send friend request');
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Invite new contacts</h2>
            </div>
            <p className="text-muted-foreground">Discover and connect with professionals.</p>

            <div className="relative w-full md:w-1/2 lg:w-1/3 mb-6">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search for people..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <p className="text-center text-muted-foreground">Loading users...</p>
            ) : filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground">No users found matching your search.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map(user => (
                        <Card key={user.id}>
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={user.avatar_url || undefined} alt={user.username} />
                                    <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-lg">{user.full_name || user.username}</CardTitle>
                                    <CardDescription>@{user.username}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm">
                                        <MessageCircle className="h-4 w-4 mr-2" /> Message
                                    </Button>
                                    <Button size="sm" onClick={() => handleConnect(user.id)}>
                                        <UserPlus className="h-4 w-4 mr-2" /> Connect
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
} 