"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, MessageCircle, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface User {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role?: string;
  company?: string;
}

interface ConnectionStatus {
  [key: string]: 'none' | 'pending' | 'accepted' | 'rejected'
}

export default function InviteContactsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({});
    const router = useRouter();
    const supabase = createClientComponentClient();

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUser(user.id);
            }
        };

        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchUsers();
        }
    }, [currentUser]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .neq('id', currentUser);

            if (error) throw error;
            setUsers(data || []);

            // Fetch connection statuses for all users
            if (currentUser && data) {
                const { data: connections } = await supabase
                    .from('connections')
                    .select('*')
                    .or(`sender_id.eq.${currentUser},receiver_id.eq.${currentUser}`);

                const statusMap: ConnectionStatus = {};
                connections?.forEach(conn => {
                    const otherUserId = conn.sender_id === currentUser ? conn.receiver_id : conn.sender_id;
                    statusMap[otherUserId] = conn.status;
                });
                setConnectionStatus(statusMap);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (userId: string) => {
        if (!currentUser) return;

        try {
            const { data, error } = await supabase
                .from('connections')
                .insert({
                    sender_id: currentUser,
                    receiver_id: userId,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            // Update local state
            setConnectionStatus(prev => ({
                ...prev,
                [userId]: 'pending'
            }));

            // Create notification for the receiver
            await supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    type: 'connection_request',
                    content: 'sent you a connection request',
                    sender_id: currentUser,
                    read: false
                });

            toast.success('Connection request sent successfully');
        } catch (error) {
            console.error('Error sending connection request:', error);
            toast.error('Failed to send connection request');
        }
    };

    const handleMessage = (userId: string) => {
        router.push(`/dashboard/messages?userId=${userId}`);
    };

    const getConnectionButton = (user: User) => {
        const status = connectionStatus[user.id] || 'none';

        if (status === 'pending') {
            return (
                <Button variant="outline" size="sm" disabled>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Connection sent
                </Button>
            );
        }
        if (status === 'accepted') {
            return (
                <Button variant="ghost" size="sm" disabled>
                    <Check className="h-4 w-4 mr-2" />
                    Connected
                </Button>
            );
        }
        if (status === 'rejected') {
            return null;
        }
        return (
            <Button size="sm" onClick={() => handleConnect(user.id)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Connect
            </Button>
        );
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
                                    <Button variant="outline" size="sm" onClick={() => handleMessage(user.id)}>
                                        <MessageCircle className="h-4 w-4 mr-2" /> Message
                                    </Button>
                                    {getConnectionButton(user)}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
} 