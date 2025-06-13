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
import { Message, subscribeToMessages, getProfileById, markMessageAsRead } from '@/lib/messages';
import { useUser } from '@/hooks/use-user';

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

// Utility to deduplicate messages by id
function dedupeMessages(messages: Message[]): Message[] {
    const map = new Map();
    for (const msg of messages) {
        map.set(msg.id, msg);
    }
    return Array.from(map.values());
}

export default function MessagesPage() {
    const { user } = useUser();
    const currentUserId = user?.id;
    const [selectedConversation, setSelectedConversation] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState('');
    const isMobile = useIsMobile();
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const [allMessages, setAllMessages] = useState<Message[]>([]);
    const [isLoadingAllMessages, setIsLoadingAllMessages] = useState(true);
    const [allConnections, setAllConnections] = useState<any[]>([]);
    const subscriptionRef = React.useRef<{ unsubscribe: () => void } | null>(null);
    const [currentFilter, setCurrentFilter] = useState('all');
    const [messageInput, setMessageInput] = useState('');
    const [newMessageDialogOpen, setNewMessageDialogOpen] = useState(false);
    const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);

    const {
        messages,
        isLoading,
        sendMessage,
        error,
        userStatus
    } = useMessages({ userId: selectedConversation || undefined });

    // Add subscription for all messages
    useEffect(() => {
        if (!currentUserId) return;

        try {
            // Cleanup previous subscription if it exists
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }

            // Set up new subscription
            subscriptionRef.current = subscribeToMessages(async (newMessage: Message) => {
                // Fetch sender profile if not present
                if (!newMessage.sender) {
                    try {
                        const senderProfile = await getProfileById(newMessage.sender_id);
                        newMessage.sender = senderProfile;
                    } catch (err) {
                        console.error('Failed to fetch sender profile:', err);
                    }
                }
                setAllMessages(prev => dedupeMessages([...prev, newMessage]));
            });
        } catch (err) {
            console.error('Error setting up all messages subscription:', err);
        }

        return () => {
            if (subscriptionRef.current) {
                try {
                    subscriptionRef.current.unsubscribe();
                    subscriptionRef.current = null;
                } catch (err) {
                    console.error('Error unsubscribing from all messages:', err);
                }
            }
        };
    }, [currentUserId]);

    // Add new effect to fetch all messages on mount
    useEffect(() => {
        const fetchAllMessages = async () => {
            if (!currentUserId) return;
            try {
                setIsLoadingAllMessages(true);
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
                
                if (messages) {
                    setAllMessages(prev => dedupeMessages([...prev, ...messages]));
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
            
            // Get the other user's profile from the message
            const otherUser = isCurrentUserSender 
                ? allConnections.find(conn => conn.id === otherUserId)
                : message.sender;
            
            if (!acc[otherUserId]) {
                acc[otherUserId] = {
                    id: otherUserId,
                    name: otherUser?.full_name || otherUser?.username || 'Unknown User',
                    avatar: otherUser?.avatar_url || undefined,
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
    }, [allMessages, currentUserId, allConnections]);

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
        if (!selectedConversation) return undefined;
        // Try to find an existing conversation
        const found = conversations.find(conv => conv.id === selectedConversation);
        // If not found, create a placeholder for new conversation
        if (!found) {
            return {
                id: selectedConversation,
                name: 'New Conversation',
                lastMessage: '',
                time: new Date().toISOString(),
                avatar: '',
                unread: 0,
                online: false
            };
        }
        return found;
    }, [conversations, selectedConversation]);

    // Filter messages for the active conversation
    const filteredMessages = React.useMemo(() => {
        if (!selectedConversation || !currentUserId) return [];
        return allMessages.filter(
            (msg) =>
                (msg.sender_id === currentUserId && msg.receiver_id === selectedConversation) ||
                (msg.sender_id === selectedConversation && msg.receiver_id === currentUserId)
        );
    }, [allMessages, selectedConversation, currentUserId]);

    // Fetch selected user profile when selectedConversation changes and not in conversations
    useEffect(() => {
        const fetchProfile = async () => {
            if (!selectedConversation) return;
            const exists = conversations.some(conv => conv.id === selectedConversation);
            if (!exists) {
                const { data } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url')
                    .eq('id', selectedConversation)
                    .single();
                setSelectedUserProfile(data);
            }
        };
        fetchProfile();
    }, [selectedConversation, conversations]);

    // After building conversations
    let allConversations = [...conversations];
    const userIsInList = allConversations.some(conv => conv.id === selectedConversation);
    if (selectedConversation && !userIsInList && selectedUserProfile) {
        allConversations.unshift({
            id: selectedConversation,
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
        if (!messageInput.trim() || !selectedConversation || !currentUserId) return;
        
        try {
            const { data: newMessage, error } = await supabase
                .from('messages')
                .insert({
                    sender_id: currentUserId,
                    receiver_id: selectedConversation,
                    content: messageInput,
                    read: false
                })
                .select(`
                    *,
                    sender:profiles!sender_id (
                        username,
                        full_name,
                        avatar_url
                    )
                `)
                .single();

            if (error) throw error;
            
            if (newMessage) {
                setAllMessages(prev => dedupeMessages([...prev, newMessage]));
                setMessageInput('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleSelectUser = (userId: string) => {
        setSelectedConversation(userId);
        setNewMessageDialogOpen(false);
    };

    // Modify the loading state to consider both allMessages and the selected conversation
    const isLoadingConversations = isLoading || allMessages.length === 0;

    // Add scroll to bottom function
    const scrollToBottom = React.useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Add effect to scroll when messages change
    React.useEffect(() => {
        scrollToBottom();
    }, [filteredMessages, scrollToBottom]);

    // Mark messages as read when a conversation is selected
    useEffect(() => {
        const markMessagesAsRead = async () => {
            if (!currentUserId || !selectedConversation) return;

            // Find unread messages in this conversation sent to the current user
            const unreadMessages = allMessages.filter(
                msg =>
                    !msg.read &&
                    msg.sender_id === selectedConversation &&
                    msg.receiver_id === currentUserId
            );

            // Mark each as read in the DB and update local state
            await Promise.all(unreadMessages.map(async (msg) => {
                try {
                    await markMessageAsRead(msg.id);
                    setAllMessages(prev =>
                        prev.map(m =>
                            m.id === msg.id ? { ...m, read: true } : m
                        )
                    );
                } catch (err) {
                    console.error('Error marking message as read:', err);
                }
            }));
        };

        markMessagesAsRead();
    }, [selectedConversation, currentUserId, allMessages]);

    if (isMobile) {
        return <MobileMessages />;
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            <div className="flex h-full gap-4 p-4">
                <Card className="w-1/3 flex flex-col">
                    <CardHeader className="flex-none">
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
                    <CardContent className="flex-1 p-0 overflow-hidden">
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
                                        conversation.id === selectedConversation ? 'bg-muted' : ''
                                    }`}
                                    onClick={() => setSelectedConversation(conversation.id)}
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
                    {selectedConversation && activeConversation ? (
                        <>
                            <CardHeader className="flex-none">
                                <div className="flex items-center justify-between space-x-4">
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
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-4 overflow-hidden">
                                <ScrollArea className="h-full">
                                    <div className="flex flex-col gap-4 pr-4">
                                        {filteredMessages.length === 0 ? (
                                            <div className="text-center text-muted-foreground py-8">
                                                No messages yet. Say hello!
                                            </div>
                                        ) : filteredMessages.map((message) => {
                                            const isSent = message.sender_id === currentUserId;
                                            const senderName = message.sender?.full_name || message.sender?.username || 'Unknown User';
                                            const senderAvatar = message.sender?.avatar_url || undefined;
                                            
                                            return (
                                                <div
                                                    key={message.id}
                                                    className={`flex items-end gap-2 ${isSent ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    {!isSent && (
                                                        <Avatar>
                                                            <AvatarImage src={senderAvatar} alt={senderName} />
                                                            <AvatarFallback>{senderName.charAt(0)}</AvatarFallback>
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
                                                            <AvatarImage src={senderAvatar} alt={senderName} />
                                                            <AvatarFallback>{senderName.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </ScrollArea>
                            </CardContent>
                            <div className="p-4 border-t flex-none">
                                <div className="flex items-center gap-2">
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
                                        disabled={!messageInput.trim() || !selectedConversation}
                                    >
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </div>
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