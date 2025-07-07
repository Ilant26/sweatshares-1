"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, UserPlus, Mail, Send, Settings2, Filter, ArrowUpDown, MessageCircle, UserX, Trash2, ChevronDown, Check, X, Globe2, MapPin, Briefcase, Loader2, AlertCircle } from 'lucide-react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useNotifications } from '@/components/providers/notifications-provider';

interface Profile {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    professional_role: string | null;
    company?: string | null;
    bio: string | null;
    country: string | null;
    is_online: boolean;
    last_seen: string | null;
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

interface ConnectionStatus {
    [key: string]: 'none' | 'pending' | 'accepted' | 'rejected';
}

interface LoadingStates {
    [key: string]: boolean;
}

export default function MyNetworkPage() {
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [receivedInvitations, setReceivedInvitations] = useState<Connection[]>([]);
    const [sentInvitations, setSentInvitations] = useState<Connection[]>([]);
    const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all-users');
    const [loadingStates, setLoadingStates] = useState<LoadingStates>({});
    const router = useRouter();
    const { refreshUnreadCount } = useNotifications();

    // Helper function to update loading state
    const setLoadingState = (key: string, isLoading: boolean) => {
        setLoadingStates(prev => ({
            ...prev,
            [key]: isLoading
        }));
    };

    // Helper function to show toast messages
    const showToast = (title: string, description?: string, variant: 'default' | 'destructive' = 'default') => {
        toast({
            title,
            description,
            variant,
        });
    };

    // Function to mark connection notifications as read
    const markConnectionNotificationsAsRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    type: 'connection_request'
                }),
            });
            await refreshUnreadCount();
        } catch (error) {
            console.error('Error marking connection notifications as read:', error);
        }
    };

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUser(user.id);
                return user.id;
            }
            return null;
        };

        const fetchAllData = async (userId: string) => {
            setLoading(true);
            try {
                // Fetch all profiles (excluding current user)
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url, professional_role, bio, country, is_online, last_seen')
                    .neq('id', userId);

                if (profilesError) {
                    console.error('Error fetching profiles:', JSON.stringify(profilesError, null, 2));
                    showToast('Error', 'Failed to load users', 'destructive');
                    return;
                }

                setAllProfiles(profiles || []);

                // Fetch accepted connections
                const { data: acceptedConnections, error: connectionsError } = await supabase
                    .from('connections')
                    .select(`
                        *,
                        sender:sender_id(id, username, full_name, avatar_url, professional_role, bio, country, is_online, last_seen),
                        receiver:receiver_id(id, username, full_name, avatar_url, professional_role, bio, country, is_online, last_seen)
                    `)
                    .eq('status', 'accepted')
                    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

                if (connectionsError) {
                    console.error('Error fetching connections:', JSON.stringify(connectionsError, null, 2));
                    showToast('Error', 'Failed to load connections', 'destructive');
                    return;
                }

                // Fetch received invitations (pending, where user is receiver)
                const { data: received, error: receivedError } = await supabase
                    .from('connections')
                    .select(`
                        *,
                        sender:sender_id(id, username, full_name, avatar_url, professional_role, bio, country, is_online, last_seen)
                    `)
                    .eq('receiver_id', userId)
                    .eq('status', 'pending');

                if (receivedError) {
                    console.error('Error fetching received invitations:', JSON.stringify(receivedError, null, 2));
                    showToast('Error', 'Failed to load received invitations', 'destructive');
                    return;
                }

                // Fetch sent invitations (pending, where user is sender)
                const { data: sent, error: sentError } = await supabase
                    .from('connections')
                    .select(`
                        *,
                        receiver:receiver_id(id, username, full_name, avatar_url, professional_role, bio, country, is_online, last_seen)
                    `)
                    .eq('sender_id', userId)
                    .eq('status', 'pending');

                if (sentError) {
                    console.error('Error fetching sent invitations:', JSON.stringify(sentError, null, 2));
                    showToast('Error', 'Failed to load sent invitations', 'destructive');
                    return;
                }

                setConnections(acceptedConnections || []);
                setReceivedInvitations(received || []);
                setSentInvitations(sent || []);

                // Build connection status map
                const statusMap: ConnectionStatus = {};
                
                // Add accepted connections
                acceptedConnections?.forEach(conn => {
                    const otherUserId = conn.sender_id === userId ? conn.receiver_id : conn.sender_id;
                    statusMap[otherUserId] = 'accepted';
                });

                // Add pending connections (both sent and received)
                received?.forEach(conn => {
                    statusMap[conn.sender_id] = 'pending';
                });

                sent?.forEach(conn => {
                    statusMap[conn.receiver_id] = 'pending';
                });

                setConnectionStatus(statusMap);

            } catch (error) {
                console.error('Error in fetchAllData:', error);
                showToast('Error', 'Failed to load network data', 'destructive');
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentUser().then(userId => {
            if (userId) {
                fetchAllData(userId);
                // Mark connection notifications as read when visiting the page
                markConnectionNotificationsAsRead();
            }
        });
    }, []);

    const handleAcceptInvitation = async (connectionId: string) => {
        setLoadingState(`accept-${connectionId}`, true);
        
        try {
            const { error } = await supabase
                .from('connections')
                .update({ status: 'accepted' })
                .eq('id', connectionId);

            if (error) {
                console.error('Error accepting invitation:', error);
                showToast('Error', 'Failed to accept invitation', 'destructive');
                return;
            }

            // Refresh the connections
            if (currentUser) {
                const { data: connection } = await supabase
                    .from('connections')
                    .select(`
                        *,
                        sender:sender_id(id, username, full_name, avatar_url, professional_role, bio, country, is_online, last_seen)
                    `)
                    .eq('id', connectionId)
                    .single();

                if (connection) {
                    setConnections(prev => [...prev, connection]);
                    setReceivedInvitations(prev => prev.filter(inv => inv.id !== connectionId));
                    setConnectionStatus(prev => ({
                        ...prev,
                        [connection.sender_id]: 'accepted'
                    }));
                    
                    showToast('Success', 'Connection request accepted');
                    // Refresh notification count after accepting connection
                    await refreshUnreadCount();
                }
            }
        } catch (error) {
            console.error('Error accepting invitation:', error);
            showToast('Error', 'Failed to accept invitation', 'destructive');
        } finally {
            setLoadingState(`accept-${connectionId}`, false);
        }
    };

    const handleRejectInvitation = async (connectionId: string) => {
        setLoadingState(`reject-${connectionId}`, true);
        
        try {
            const { error } = await supabase
                .from('connections')
                .update({ status: 'rejected' })
                .eq('id', connectionId);

            if (error) {
                console.error('Error rejecting invitation:', error);
                showToast('Error', 'Failed to reject invitation', 'destructive');
                return;
            }

            setReceivedInvitations(prev => prev.filter(inv => inv.id !== connectionId));
            showToast('Success', 'Connection request rejected');
            // Refresh notification count after rejecting connection
            await refreshUnreadCount();
        } catch (error) {
            console.error('Error rejecting invitation:', error);
            showToast('Error', 'Failed to reject invitation', 'destructive');
        } finally {
            setLoadingState(`reject-${connectionId}`, false);
        }
    };

    const handleRemoveConnection = async (connectionId: string, otherUserId: string) => {
        setLoadingState(`remove-${connectionId}`, true);
        
        try {
            const { error } = await supabase
                .from('connections')
                .delete()
                .eq('id', connectionId);

            if (error) {
                console.error('Error removing connection:', error);
                showToast('Error', 'Failed to remove connection', 'destructive');
                return;
            }

            // Update all relevant state
            setConnections(prev => prev.filter(conn => conn.id !== connectionId));
            setConnectionStatus(prev => ({
                ...prev,
                [otherUserId]: 'none'
            }));
            
            showToast('Success', 'Connection removed');
        } catch (error) {
            console.error('Error removing connection:', error);
            showToast('Error', 'Failed to remove connection', 'destructive');
        } finally {
            setLoadingState(`remove-${connectionId}`, false);
        }
    };

    const handleConnect = async (profileId: string) => {
        if (!currentUser) return;

        // Prevent multiple requests
        if (loadingStates[`connect-${profileId}`]) return;

        setLoadingState(`connect-${profileId}`, true);
        
        try {
            // Check if connection already exists
            const { data: existingConnection } = await supabase
                .from('connections')
                .select('*')
                .or(`and(sender_id.eq.${currentUser},receiver_id.eq.${profileId}),and(sender_id.eq.${profileId},receiver_id.eq.${currentUser})`)
                .single();

            if (existingConnection) {
                showToast('Info', 'Connection request already exists', 'destructive');
                return;
            }

            const { data, error } = await supabase
                .from('connections')
                .insert({
                    sender_id: currentUser,
                    receiver_id: profileId,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) {
                console.error('Error sending connection request:', error);
                showToast('Error', 'Failed to send connection request', 'destructive');
                return;
            }

            // Update local state
            setConnectionStatus(prev => ({
                ...prev,
                [profileId]: 'pending'
            }));

            // Add to sent invitations
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, professional_role, bio, country, is_online, last_seen')
                .eq('id', profileId)
                .single();

            if (profile) {
                const newInvitation: Connection = {
                    id: data.id,
                    sender_id: currentUser,
                    receiver_id: profileId,
                    status: 'pending',
                    created_at: data.created_at,
                    receiver: profile
                };
                setSentInvitations(prev => [...prev, newInvitation]);
            }

            // Create notification for the receiver
            await supabase
                .from('notifications')
                .insert({
                    user_id: profileId,
                    type: 'connection_request',
                    content: 'sent you a connection request',
                    sender_id: currentUser,
                    read: false
                });

            showToast('Success', 'Connection request sent');
        } catch (error) {
            console.error('Error sending connection request:', error);
            showToast('Error', 'Failed to send connection request', 'destructive');
        } finally {
            setLoadingState(`connect-${profileId}`, false);
        }
    };

    const handleCancelInvitation = async (connectionId: string, receiverId: string) => {
        setLoadingState(`cancel-${connectionId}`, true);
        
        try {
            const { error } = await supabase
                .from('connections')
                .delete()
                .eq('id', connectionId);

            if (error) {
                console.error('Error canceling invitation:', error);
                showToast('Error', 'Failed to cancel invitation', 'destructive');
                return;
            }

            setSentInvitations(prev => prev.filter(inv => inv.id !== connectionId));
            setConnectionStatus(prev => ({
                ...prev,
                [receiverId]: 'none'
            }));
            
            showToast('Success', 'Invitation canceled');
        } catch (error) {
            console.error('Error canceling invitation:', error);
            showToast('Error', 'Failed to cancel invitation', 'destructive');
        } finally {
            setLoadingState(`cancel-${connectionId}`, false);
        }
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

    const getConnectionButton = (profile: Profile) => {
        const status = connectionStatus[profile.id] || 'none';
        const isLoading = loadingStates[`connect-${profile.id}`];

        if (isLoading) {
            return (
                <Button variant="outline" size="sm" disabled>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Sending...
                </Button>
            );
        }

        if (status === 'pending') {
            return (
                <Button variant="outline" size="sm" disabled>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Connection sent
                </Button>
            );
        }
        if (status === 'accepted') {
            return (
                <Button variant="ghost" size="sm" disabled>
                    <Check className="h-4 w-4 mr-1" />
                    Connected
                </Button>
            );
        }
        if (status === 'rejected') {
            return (
                <Button variant="outline" size="sm" onClick={() => handleConnect(profile.id)}>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Connect Again
                </Button>
            );
        }
        return (
            <Button variant="outline" size="sm" onClick={() => handleConnect(profile.id)}>
                <UserPlus className="h-4 w-4 mr-1" />
                Connect
            </Button>
        );
    };

    const filteredProfiles = allProfiles.filter(profile => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            profile.full_name?.toLowerCase().includes(query) ||
            profile.username.toLowerCase().includes(query) ||
            profile.professional_role?.toLowerCase().includes(query) ||
            profile.bio?.toLowerCase().includes(query) ||
            profile.country?.toLowerCase().includes(query)
        );
    });

    const renderAllUsersCards = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredProfiles.map(profile => (
                <Card key={profile.id}>
                    <CardHeader className="flex flex-row items-center gap-3 sm:gap-4 space-y-0 pb-2">
                        <div className="relative">
                            <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                                <AvatarImage src={profile.avatar_url || undefined} />
                                <AvatarFallback>{profile.full_name?.charAt(0) || profile.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {profile.is_online && (
                                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle 
                                className="text-base sm:text-lg cursor-pointer hover:text-primary transition-colors truncate"
                                onClick={() => handleProfileClick(profile.id)}
                            >
                                {profile.full_name || profile.username}
                            </CardTitle>
                            <CardDescription className="truncate">{profile.professional_role || 'No role specified'}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4 sm:p-6">
                        <div className="space-y-2">
                            {profile.bio && (
                                <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>@{profile.username}</span>
                                {profile.professional_role && (
                                    <>
                                        <span>•</span>
                                        <Briefcase className="h-3 w-3" />
                                        <span>{profile.professional_role}</span>
                                    </>
                                )}
                                {profile.country && (
                                    <>
                                        <span>•</span>
                                        <Globe2 className="h-3 w-3" />
                                        <span>{profile.country}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleMessage(profile.id)} className="w-full sm:w-auto">
                                <MessageCircle className="h-4 w-4 mr-2" /> Message
                            </Button>
                            {getConnectionButton(profile)}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    const renderConnectionCards = (data: Connection[]) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {data.map(connection => {
                const otherUser = getOtherUser(connection);
                if (!otherUser) return null;

                const isLoading = loadingStates[`remove-${connection.id}`];

                return (
                    <Card key={connection.id}>
                        <CardHeader className="flex flex-row items-center gap-3 sm:gap-4 space-y-0 pb-2">
                            <div className="relative">
                                <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                                    <AvatarImage src={otherUser.avatar_url || undefined} />
                                    <AvatarFallback>{otherUser.full_name?.charAt(0) || otherUser.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {otherUser.is_online && (
                                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <CardTitle 
                                    className="text-base sm:text-lg cursor-pointer hover:text-primary transition-colors truncate"
                                    onClick={() => handleProfileClick(otherUser.id)}
                                >
                                    {otherUser.full_name || otherUser.username}
                                </CardTitle>
                                <CardDescription className="truncate">{otherUser.professional_role || 'No role specified'}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 p-4 sm:p-6">
                            <p className="text-xs text-muted-foreground">Connected since {new Date(connection.created_at).toLocaleDateString()}</p>
                            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                                <Button variant="outline" size="sm" onClick={() => handleMessage(otherUser.id)} className="w-full sm:w-auto">
                                    <MessageCircle className="h-4 w-4 mr-2" /> Message
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            disabled={isLoading}
                                            className="w-full sm:w-auto"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <UserX className="h-4 w-4" />
                                            )}
                                            {isLoading ? 'Removing...' : 'Remove'}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Remove Connection</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to remove {otherUser.full_name || otherUser.username} from your network? This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleRemoveConnection(connection.id, otherUser.id)}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Remove Connection
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );

    const renderInvitationCards = (data: Connection[], type: 'received' | 'sent') => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {data.map(invitation => {
                const user = type === 'received' ? invitation.sender : invitation.receiver;
                if (!user) return null;

                const acceptLoading = loadingStates[`accept-${invitation.id}`];
                const rejectLoading = loadingStates[`reject-${invitation.id}`];
                const cancelLoading = loadingStates[`cancel-${invitation.id}`];

                return (
                    <Card key={invitation.id}>
                        <CardHeader className="flex flex-row items-center gap-3 sm:gap-4 space-y-0 pb-2">
                            <div className="relative">
                                <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                                    <AvatarImage src={user.avatar_url || undefined} />
                                    <AvatarFallback>{user.full_name?.charAt(0) || user.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {user.is_online && (
                                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <CardTitle 
                                    className="text-base sm:text-lg cursor-pointer hover:text-primary transition-colors truncate"
                                    onClick={() => handleProfileClick(user.id)}
                                >
                                    {user.full_name || user.username}
                                </CardTitle>
                                <CardDescription className="truncate">{user.professional_role || 'No role specified'}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 p-4 sm:p-6">
                            <p className="text-xs text-muted-foreground">
                                {type === 'received' ? 'Sent you a connection request' : 'Connection request sent'}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                                {type === 'received' ? (
                                    <>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleAcceptInvitation(invitation.id)} 
                                            disabled={acceptLoading || rejectLoading}
                                            className="w-full sm:w-auto"
                                        >
                                            {acceptLoading ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Check className="h-4 w-4 mr-2" />
                                            )}
                                            {acceptLoading ? 'Accepting...' : 'Accept'}
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handleRejectInvitation(invitation.id)} 
                                            disabled={acceptLoading || rejectLoading}
                                            className="w-full sm:w-auto"
                                        >
                                            {rejectLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <X className="h-4 w-4" />
                                            )}
                                            {rejectLoading ? 'Rejecting...' : 'Reject'}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            disabled 
                                            className="w-full sm:w-auto"
                                        >
                                            <UserPlus className="h-4 w-4 mr-2" /> Pending
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    disabled={cancelLoading}
                                                    className="w-full sm:w-auto"
                                                >
                                                    {cancelLoading ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <X className="h-4 w-4" />
                                                    )}
                                                    {cancelLoading ? 'Canceling...' : 'Cancel'}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to cancel the connection request to {user.full_name || user.username}?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Keep Request</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleCancelInvitation(invitation.id, user.id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Cancel Request
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );

    return (
        <div className="flex flex-col flex-1 h-full bg-background p-8 pt-6">
            {/* Header Section */}
            <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Network</h1>
                            <p className="text-sm text-muted-foreground">Connect with professionals and grow your network</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/connect" passHref legacyBehavior>
                            <a className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                <div className="flex items-center">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Find People
                                </div>
                            </a>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="relative w-full mt-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name, username, role, or bio..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 w-full mt-6">
                <TabsList className="w-full grid grid-cols-4">
                    <TabsTrigger value="all-users" className="text-xs sm:text-sm">
                        All Users <span className="ml-2 text-xs font-semibold text-primary">{filteredProfiles.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="connections" className="text-xs sm:text-sm">
                        My Connections <span className="ml-2 text-xs font-semibold text-primary">{connections.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="received-invitations" className="text-xs sm:text-sm">
                        Received Invitations <span className="ml-2 text-xs font-semibold text-primary">{receivedInvitations.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="sent-invitations" className="text-xs sm:text-sm">
                        Sent Invitations <span className="ml-2 text-xs font-semibold text-primary">{sentInvitations.length}</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all-users">
                    {loading ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">Loading users...</p>
                        </div>
                    ) : filteredProfiles.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">No users found.</p>
                            {searchQuery && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Try adjusting your search terms
                                </p>
                            )}
                        </div>
                    ) : (
                        renderAllUsersCards()
                    )}
                </TabsContent>

                <TabsContent value="connections">
                    {loading ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">Loading connections...</p>
                        </div>
                    ) : connections.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
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
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">Loading invitations...</p>
                        </div>
                    ) : receivedInvitations.length === 0 ? (
                        <div className="text-center py-8">
                            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">No received invitations.</p>
                        </div>
                    ) : (
                        renderInvitationCards(receivedInvitations, 'received')
                    )}
                </TabsContent>

                <TabsContent value="sent-invitations">
                    {loading ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">Loading invitations...</p>
                        </div>
                    ) : sentInvitations.length === 0 ? (
                        <div className="text-center py-8">
                            <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">No sent invitations.</p>
                        </div>
                    ) : (
                        renderInvitationCards(sentInvitations, 'sent')
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}