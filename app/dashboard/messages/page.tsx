"use client"

import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMessages } from '@/hooks/use-messages';
import { MobileMessages } from './mobile-messages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Paperclip, Search, Plus, User, FileText, CreditCard, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { NewMessageDialog } from '@/components/new-message-dialog'
import { supabase } from '@/lib/supabase';
import { Message } from '@/lib/messages';

interface Conversation {
    id: string;
    name: string;
    avatar: string | undefined;
    lastMessage: string;
    time: string;
    unread: number;
    online: boolean;
    isPlaceholder?: boolean;
}

export default function MessagesPage() {
    const isMobile = useIsMobile();
    const [currentFilter, setCurrentFilter] = useState('all');
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [newMessageDialogOpen, setNewMessageDialogOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
    const [allConnections, setAllConnections] = useState<any[]>([]);
    const [allMessages, setAllMessages] = useState<Message[]>([]);
    const [isLoadingAllMessages, setIsLoadingAllMessages] = useState(true);

    const {
        messages,
        sendMessage,
        isLoading,
        error,
        userStatus
    } = useMessages({ userId: selectedUserId });

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                console.log('Fetching current user...');
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error) {
                    console.error('Error fetching current user:', error);
                    return;
                }
                console.log('Current user:', user?.id);
                if (user) setCurrentUserId(user.id);
            } catch (error) {
                console.error('Error in fetchCurrentUser:', error);
            }
        };
        fetchCurrentUser();
    }, []);

    // Add new effect to fetch all messages on mount
    useEffect(() => {
        const fetchAllMessages = async () => {
            if (!currentUserId) return;
            try {
                setIsLoadingAllMessages(true);
                console.log('Fetching all messages for user:', currentUserId);
                const { data: messages, error } = await supabase
                    .from('messages')
                    .select(`
                        *,
                        sender:profiles!sender_id (
                            username,
                            full_name,
                            avatar_url
                        )
                    `)
                    .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
                    .order('created_at', { ascending: true });
                
                if (error) {
                    console.error('Error fetching messages:', error);
                    return;
                }
                
                console.log('Fetched messages:', messages?.length || 0);
                if (messages) {
                    setAllMessages(messages);
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
            } finally {
                setIsLoadingAllMessages(false);
            }
        };
        fetchAllMessages();
    }, [currentUserId]);

    // Fetch all accepted connections and their profiles on mount
    useEffect(() => {
        const fetchConnections = async () => {
            if (!currentUserId) return;
            const { data: connectionData } = await supabase
                .from('connections')
                .select('sender_id, receiver_id')
                .eq('status', 'accepted')
                .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);
            if (!connectionData) return;
            const connectedUserIds = connectionData.map(conn =>
                conn.sender_id === currentUserId ? conn.receiver_id : conn.sender_id
            );
            if (connectedUserIds.length === 0) return;
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .in('id', connectedUserIds);
            setAllConnections(profiles || []);
        };
        fetchConnections();
    }, [currentUserId]);

    // Modify conversations to use allMessages instead of messages
    const conversations = React.useMemo(() => {
        if (!currentUserId) return [];
        
        const conversationMap = allMessages.reduce((acc, message) => {
            // Determine the other user's info
            const isCurrentUserSender = message.sender_id === currentUserId;
            const otherUserId = isCurrentUserSender ? message.receiver_id : message.sender_id;
            const otherUser = message.sender;
            
            if (!acc[otherUserId]) {
                acc[otherUserId] = {
                    id: otherUserId,
                    name: otherUser.full_name || otherUser.username,
                    avatar: otherUser.avatar_url || undefined,
                    lastMessage: message.content,
                    time: message.created_at,
                    unread: 0,
                    online: false // Will be updated by userStatus
                };
            }
            // Update last message if this one is newer
            if (new Date(message.created_at) > new Date(acc[otherUserId].time)) {
                acc[otherUserId].lastMessage = message.content;
                acc[otherUserId].time = message.created_at;
            }
            // Count unread messages (only those not sent by the current user)
            if (!message.read && message.sender_id === otherUserId) {
                acc[otherUserId].unread = (acc[otherUserId].unread || 0) + 1;
            }
            return acc;
        }, {} as Record<string, Conversation>);
        
        return Object.values(conversationMap).sort((a, b) => 
            new Date(b.time).getTime() - new Date(a.time).getTime()
        );
    }, [allMessages, currentUserId]);

    // Filtering logic for tabs
    const filteredConversations = React.useMemo(() => {
        let filtered = conversations;
        if (currentFilter === 'unread') {
            filtered = conversations.filter(conv => conv.unread > 0);
        } else if (currentFilter === 'read') {
            filtered = conversations.filter(conv => conv.unread === 0);
        }
        if (searchQuery) {
            filtered = filtered.filter(conversation =>
                conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return filtered;
    }, [conversations, currentFilter, searchQuery]);

    const totalUnreadMessages = conversations.reduce((sum, conv) => sum + (conv.unread || 0), 0);
    const activeConversation = React.useMemo(() => {
        if (!selectedUserId) return undefined;
        // Try to find an existing conversation
        const found = conversations.find(conv => conv.id === selectedUserId);
        // If not found, create a placeholder for new conversation
        if (!found) {
            return {
                id: selectedUserId,
                name: 'New Conversation',
                lastMessage: '',
                time: new Date().toISOString(),
                avatar: '',
                unread: 0,
                online: false
            };
        }
        return found;
    }, [conversations, selectedUserId]);

    // Filter messages for the active conversation
    const filteredMessages = React.useMemo(() => {
        if (!selectedUserId || !currentUserId) return [];
        return allMessages.filter(
            (msg) =>
                (msg.sender_id === currentUserId && msg.receiver_id === selectedUserId) ||
                (msg.sender_id === selectedUserId && msg.receiver_id === currentUserId)
        );
    }, [allMessages, selectedUserId, currentUserId]);

    // Fetch selected user profile when selectedUserId changes and not in conversations
    useEffect(() => {
        const fetchProfile = async () => {
            if (!selectedUserId) return;
            const exists = conversations.some(conv => conv.id === selectedUserId);
            if (!exists) {
                const { data } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url')
                    .eq('id', selectedUserId)
                    .single();
                setSelectedUserProfile(data);
            }
        };
        fetchProfile();
    }, [selectedUserId, conversations]);

    // After building conversations
    let allConversations = [...conversations];
    const userIsInList = allConversations.some(conv => conv.id === selectedUserId);
    if (selectedUserId && !userIsInList && selectedUserProfile) {
        allConversations.unshift({
            id: selectedUserId,
            name: selectedUserProfile.full_name || selectedUserProfile.username,
            avatar: selectedUserProfile.avatar_url,
            lastMessage: '',
            time: '',
            unread: 0,
            online: false,
            isPlaceholder: true,
        });
    }

    // Merge allConnections into allConversations (if not already present)
    allConnections.forEach(profile => {
        if (!allConversations.some(conv => conv.id === profile.id)) {
            allConversations.push({
                id: profile.id,
                name: profile.full_name || profile.username,
                avatar: profile.avatar_url,
                lastMessage: '',
                time: '',
                unread: 0,
                online: false,
                isPlaceholder: true,
            });
        }
    });

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedUserId) return;
        
        await sendMessage(messageInput);
        setMessageInput('');
    };

    const handleSelectUser = (userId: string) => {
        setSelectedUserId(userId);
        setNewMessageDialogOpen(false);
    };

    // Modify the loading state to consider both allMessages and the selected conversation
    const isLoadingConversations = isLoading || allMessages.length === 0;

    if (isMobile) {
        return <MobileMessages />;
    }

    return (
        <div className="flex flex-col flex-1 h-full bg-background p-8 pt-6">
            <div className="flex h-full gap-4">
                <Card className="w-1/3 flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div className="relative w-full flex-1 mr-4">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search your messages..." 
                                    className="pl-8 w-full"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button 
                                variant="outline"
                                onClick={() => setNewMessageDialogOpen(true)}
                            >
                                New Message
                            </Button>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <h3 className="font-semibold">All Messages</h3>
                            <span className="text-sm text-primary">{totalUnreadMessages} unread messages</span>
                        </div>
                        <div className="flex space-x-2 mt-2">
                            <Button 
                                variant={currentFilter === 'all' ? 'secondary' : 'ghost'} 
                                size="sm" 
                                onClick={() => setCurrentFilter('all')}
                            >
                                All Messages
                            </Button>
                            <Button 
                                variant={currentFilter === 'unread' ? 'secondary' : 'ghost'} 
                                size="sm" 
                                onClick={() => setCurrentFilter('unread')}
                            >
                                Unread <span className="ml-1 text-xs font-semibold">{totalUnreadMessages}</span>
                            </Button>
                            <Button 
                                variant={currentFilter === 'read' ? 'secondary' : 'ghost'} 
                                size="sm" 
                                onClick={() => setCurrentFilter('read')}
                            >
                                Read
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <ScrollArea className="h-full pr-4">
                            {isLoadingAllMessages ? (
                                <div className="flex items-center justify-center h-32">
                                    <span className="text-muted-foreground">Loading conversations...</span>
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="flex items-center justify-center h-32">
                                    <span className="text-muted-foreground">No conversations yet</span>
                                </div>
                            ) : filteredConversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    className={`flex items-center gap-4 p-4 hover:bg-muted cursor-pointer ${
                                        conversation.id === selectedUserId ? 'bg-muted' : ''
                                    }`}
                                    onClick={() => setSelectedUserId(conversation.id)}
                                >
                                    <div className="relative">
                                        <Avatar>
                                            <AvatarImage src={conversation.avatar} />
                                            <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        {conversation.online && (
                                            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{conversation.name}</p>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {conversation.lastMessage}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs text-muted-foreground">
                                            {conversation.time ? (() => {
                                                try {
                                                    return formatDistanceToNow(new Date(conversation.time), { addSuffix: true });
                                                } catch {
                                                    return '-';
                                                }
                                            })() : '-'}
                                        </span>
                                        {conversation.unread > 0 && (
                                            <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                                {conversation.unread}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card className="flex-1 flex flex-col">
                    {selectedUserId && activeConversation ? (
                        <>
                            <CardHeader className="flex flex-row items-center justify-between space-x-4 pb-2">
                                <div className="flex items-center space-x-4">
                                    <Avatar>
                                        <AvatarImage src={activeConversation.avatar || undefined} alt={activeConversation.name} />
                                        <AvatarFallback>{(activeConversation.name || '?')[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle>{activeConversation.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            {userStatus?.is_online ? 'Online' : userStatus?.last_seen ? 
                                                `Last seen ${formatDistanceToNow(new Date(userStatus.last_seen), { addSuffix: true })}` : 
                                                'Offline'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <Button variant="ghost" size="icon" title="Create group conversation">
                                        <Users className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="View profile">
                                        <User className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col-reverse">
                                <ScrollArea className="h-full w-full">
                                    <div className="flex flex-col gap-4 pr-4">
                                        {filteredMessages.length === 0 ? (
                                            <div className="text-center text-muted-foreground py-8">
                                                No messages yet. Say hello!
                                            </div>
                                        ) : filteredMessages.map((message) => {
                                            const isSent = message.sender_id === currentUserId;
                                            return (
                                                <div
                                                    key={message.id}
                                                    className={`flex items-end gap-2 ${isSent ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    {!isSent && (
                                                        <Avatar>
                                                            <AvatarImage src={message.sender.avatar_url || undefined} alt={message.sender.full_name || message.sender.username} />
                                                            <AvatarFallback>{(message.sender.full_name || message.sender.username || '?')[0]}</AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    <div
                                                        className={`max-w-[70%] rounded-lg p-3 ${
                                                            isSent ? 'bg-blue-500 text-white' : 'bg-muted'
                                                        }`}
                                                    >
                                                        <p className="text-sm">{message.content}</p>
                                                        <p className="text-xs text-muted-foreground text-right mt-1">
                                                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                    {isSent && (
                                                        <Avatar>
                                                            <AvatarImage src={message.sender.avatar_url || undefined} alt={message.sender.full_name || message.sender.username} />
                                                            <AvatarFallback>{(message.sender.full_name || message.sender.username || '?')[0]}</AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                            <div className="p-4 border-t flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" title="Attach file or action">
                                            <Paperclip className="h-4 w-4 text-gray-500" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent side="top" align="start">
                                        <DropdownMenuLabel>Attachment Options</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>
                                            <input id="file-input" type="file" className="hidden" multiple />
                                            <label htmlFor="file-input" className="flex items-center cursor-pointer w-full">
                                                <FileText className="mr-2 h-4 w-4" /> Upload from device
                                            </label>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>Select from My Vault</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>
                                            <CreditCard className="mr-2 h-4 w-4" /> Generate payment link
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Input 
                                    placeholder="Type your message..." 
                                    className="flex-1"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <Button 
                                    size="icon" 
                                    className="bg-blue-500 hover:bg-blue-600"
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim() || !selectedUserId}
                                >
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-1 items-center justify-center text-muted-foreground">
                            Select a conversation or start a new message.
                        </div>
                    )}
                    <NewMessageDialog 
                        open={newMessageDialogOpen} 
                        onOpenChange={setNewMessageDialogOpen} 
                        onSelectUser={handleSelectUser} 
                    />
                </Card>
            </div>
        </div>
    );
} 