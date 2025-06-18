"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, UserPlus, Mail, Send, Settings2, Filter, ArrowUpDown, MessageCircle, UserX, Trash2, ChevronDown, Check, X } from 'lucide-react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Profile {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    professional_role: string | null;
    company: string | null;
}

interface Connection {
    id: string;
    sender_id: string;
    receiver_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    sender?: Profile;
    receiver?: Profile;
}

export default function MyNetworkPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('connections');
    const [searchQuery, setSearchQuery] = useState('');
    const [connections, setConnections] = useState<Connection[]>([]);
    const [receivedInvitations, setReceivedInvitations] = useState<Connection[]>([]);
    const [sentInvitations, setSentInvitations] = useState<Connection[]>([]);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUser(user.id);
                return user.id;
            }
            return null;
        };

        const fetchConnections = async (userId: string) => {
            setLoading(true);
            try {
                // Fetch accepted connections
                const { data: acceptedConnections, error: connectionsError } = await supabase
                    .from('connections')
                    .select(`
                        *,
                        sender:sender_id(id, username, full_name, avatar_url, professional_role),
                        receiver:receiver_id(id, username, full_name, avatar_url, professional_role)
                    `)
                    .eq('status', 'accepted')
                    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

                if (connectionsError) {
                    console.error('Error fetching connections:', JSON.stringify(connectionsError, null, 2));
                    return;
                }

                // Fetch received invitations (pending, where user is receiver)
                const { data: received, error: receivedError } = await supabase
                    .from('connections')
                    .select(`
                        *,
                        sender:sender_id(id, username, full_name, avatar_url, professional_role)
                    `)
                    .eq('receiver_id', userId)
                    .eq('status', 'pending');

                if (receivedError) {
                    console.error('Error fetching received invitations:', JSON.stringify(receivedError, null, 2));
                    return;
                }

                // Fetch sent invitations (pending, where user is sender)
                const { data: sent, error: sentError } = await supabase
                    .from('connections')
                    .select(`
                        *,
                        receiver:receiver_id(id, username, full_name, avatar_url, professional_role)
                    `)
                    .eq('sender_id', userId)
                    .eq('status', 'pending');

                if (sentError) {
                    console.error('Error fetching sent invitations:', JSON.stringify(sentError, null, 2));
                    return;
                }

                setConnections(acceptedConnections || []);
                setReceivedInvitations(received || []);
                setSentInvitations(sent || []);
            } catch (error) {
                console.error('Error in fetchConnections:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentUser().then(userId => {
            if (userId) {
                fetchConnections(userId);
            }
        });
    }, []);

    const handleAcceptInvitation = async (connectionId: string) => {
        const { error } = await supabase
            .from('connections')
            .update({ status: 'accepted' })
            .eq('id', connectionId);

        if (error) {
            console.error('Error accepting invitation:', error);
            return;
        }

        // Refresh the connections
        if (currentUser) {
            const { data: connection } = await supabase
                .from('connections')
                .select(`
                    *,
                    sender:sender_id(id, username, full_name, avatar_url, professional_role)
                `)
                .eq('id', connectionId)
                .single();

            if (connection) {
                setConnections(prev => [...prev, connection]);
                setReceivedInvitations(prev => prev.filter(inv => inv.id !== connectionId));
            }
        }
    };

    const handleRejectInvitation = async (connectionId: string) => {
        const { error } = await supabase
            .from('connections')
            .update({ status: 'rejected' })
            .eq('id', connectionId);

        if (error) {
            console.error('Error rejecting invitation:', error);
            return;
        }

        setReceivedInvitations(prev => prev.filter(inv => inv.id !== connectionId));
    };

    const handleRemoveConnection = async (connectionId: string) => {
        const { error } = await supabase
            .from('connections')
            .delete()
            .eq('id', connectionId);

        if (error) {
            console.error('Error removing connection:', error);
            return;
        }

        setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    };

    const handleMessage = (userId: string) => {
        router.push(`/dashboard/messages?userId=${userId}`);
    };

    const handleProfileClick = (userId: string) => {
        router.push(`/dashboard/profile/${userId}`);
    };

    const getOtherUser = (connection: Connection) => {
        if (!currentUser) return null;
        return connection.sender_id === currentUser ? connection.receiver : connection.sender;
    };

    const renderConnectionCards = (data: Connection[]) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map(connection => {
                const otherUser = getOtherUser(connection);
                if (!otherUser) return null;

                return (
                    <Card key={connection.id}>
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={otherUser.avatar_url || undefined} />
                                <AvatarFallback>{otherUser.full_name?.charAt(0) || otherUser.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle 
                                    className="text-lg cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleProfileClick(otherUser.id)}
                                >
                                    {otherUser.full_name || otherUser.username}
                                </CardTitle>
                                <CardDescription>{otherUser.professional_role || 'No role specified'}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-xs text-muted-foreground">Connected since {new Date(connection.created_at).toLocaleDateString()}</p>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleMessage(otherUser.id)}>
                                    <MessageCircle className="h-4 w-4 mr-2" /> Message
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveConnection(connection.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );

    const renderInvitationCards = (data: Connection[], type: 'received' | 'sent') => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map(invitation => {
                const user = type === 'received' ? invitation.sender : invitation.receiver;
                if (!user) return null;

                return (
                    <Card key={invitation.id}>
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback>{user.full_name?.charAt(0) || user.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle 
                                    className="text-lg cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleProfileClick(user.id)}
                                >
                                    {user.full_name || user.username}
                                </CardTitle>
                                <CardDescription>{user.professional_role || 'No role specified'}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                                {type === 'received' ? 'Received' : 'Sent'} on {new Date(invitation.created_at).toLocaleDateString()}
                            </p>
                            {type === 'received' && (
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleAcceptInvitation(invitation.id)}>
                                        <Check className="h-4 w-4 mr-2" /> Accept
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleRejectInvitation(invitation.id)}>
                                        <X className="h-4 w-4 mr-2" /> Decline
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Manage your professional network</h2>
                <Link href="/dashboard/my-network/invite-contacts">
                    <Button>
                        <UserPlus className="mr-2 h-4 w-4" /> Invite contacts
                    </Button>
                </Link>
            </div>
            <p className="text-muted-foreground">Connect with professionals to grow your entrepreneurial ecosystem</p>

            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
                <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search your network..." 
                        className="pl-8 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap items-center space-x-2 w-full md:w-2/3 justify-end">
                    <Select>
                        <SelectTrigger className="w-[150px]">
                            <Settings2 className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filters" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="type">Type</SelectItem>
                            <SelectItem value="location">Location</SelectItem>
                        </SelectContent>
                    </Select>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto md:ml-0">
                                <ArrowUpDown className="mr-2 h-4 w-4" /> Sort by <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Date Connected</DropdownMenuItem>
                            <DropdownMenuItem>Name</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="connections">
                        My Connections <span className="ml-2 text-xs font-semibold text-primary">{connections.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="received-invitations">
                        Received Invitations <span className="ml-2 text-xs font-semibold text-primary">{receivedInvitations.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="sent-invitations">
                        Sent Invitations <span className="ml-2 text-xs font-semibold text-primary">{sentInvitations.length}</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="connections">
                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Loading connections...</p>
                        </div>
                    ) : connections.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No connections yet.</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Start connecting with other professionals to grow your network.
                            </p>
                        </div>
                    ) : (
                        renderConnectionCards(connections)
                    )}
                </TabsContent>
                <TabsContent value="received-invitations">
                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Loading invitations...</p>
                        </div>
                    ) : receivedInvitations.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No new invitations.</p>
                        </div>
                    ) : (
                        renderInvitationCards(receivedInvitations, 'received')
                    )}
                </TabsContent>
                <TabsContent value="sent-invitations">
                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Loading sent invitations...</p>
                        </div>
                    ) : sentInvitations.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No pending sent invitations.</p>
                        </div>
                    ) : (
                        renderInvitationCards(sentInvitations, 'sent')
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}