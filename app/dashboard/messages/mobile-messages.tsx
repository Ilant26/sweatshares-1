"use client"

import React, { useState, useEffect } from 'react';
import { useMessages } from '@/hooks/use-messages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Paperclip, Search, ArrowLeft, User, FileText, CreditCard, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { NewMessageDialog } from '@/components/new-message-dialog';
import { supabase } from '@/lib/supabase';

export function MobileMessages() {
    const [view, setView] = useState<'conversations' | 'chat'>('conversations');
    const [currentFilter, setCurrentFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
    const [messageInput, setMessageInput] = useState('');
    const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);

    const {
        messages,
        sendMessage,
        isLoading,
        error,
        userStatus
    } = useMessages({ userId: selectedUserId });

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
        };
        fetchCurrentUser();
    }, []);

    // Group messages by conversation (one per user pair)
    const conversations = React.useMemo(() => {
        const conversationMap = messages.reduce((acc, message) => {
            // Determine the other user's info
            const isCurrentUserSender = message.sender_id !== selectedUserId;
            const otherUserId = isCurrentUserSender ? message.sender_id : message.receiver_id;
            const otherUser = message.sender;
            if (!acc[otherUserId]) {
                acc[otherUserId] = {
                    id: otherUserId,
                    name: otherUser.full_name || otherUser.username,
                    avatar: otherUser.avatar_url,
                    lastMessage: message.content,
                    time: message.created_at,
                    unread: !message.read && message.sender_id === otherUserId ? 1 : 0,
                    online: false // Will be updated by userStatus
                };
            } else {
                // Update last message if this one is newer
                if (new Date(message.created_at) > new Date(acc[otherUserId].time)) {
                    acc[otherUserId].lastMessage = message.content;
                    acc[otherUserId].time = message.created_at;
                }
                // Update unread count
                if (!message.read && message.sender_id === otherUserId) {
                    acc[otherUserId].unread++;
                }
            }
            return acc;
        }, {} as Record<string, any>);
        return Object.values(conversationMap);
    }, [messages, selectedUserId]);

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

    const filteredConversations = conversations.filter(conversation => {
        // Apply filters
        if (currentFilter === 'unread') {
            return conversation.unread > 0;
        } else if (currentFilter === 'read') {
            return conversation.unread === 0;
        }
        
        // Apply search
        if (searchQuery) {
            return (
        conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );
        }
        
        return true;
    });

    const totalUnreadMessages = conversations.reduce((sum, conv) => sum + conv.unread, 0);
    const activeConversation = React.useMemo(() => {
        if (!selectedUserId) return undefined;
        // Try to find an existing conversation
        const found = conversations.find(conv => conv.id === selectedUserId);
        // If not found, create a placeholder for new conversation
        if (!found) {
            // Try to get the user's name and avatar from the NewMessageDialog or fallback
            // For now, just show 'New Conversation'
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
        return messages.filter(
            (msg) =>
                (msg.sender_id === currentUserId && msg.receiver_id === selectedUserId) ||
                (msg.sender_id === selectedUserId && msg.receiver_id === currentUserId)
        );
    }, [messages, selectedUserId, currentUserId]);

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedUserId) return;
        
        await sendMessage(messageInput);
        setMessageInput('');
    };

    const handleSelectConversation = (userId: string) => {
        setSelectedUserId(userId);
        setView('chat');
    };

    const handleStartNewMessage = () => {
        setShowNewMessageDialog(true);
    };

    const handleSelectUser = (userId: string) => {
        setSelectedUserId(userId);
        setView('chat');
        setShowNewMessageDialog(false);
    };

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

    if (view === 'chat' && selectedUserId && activeConversation) {
        return (
            <div className="flex flex-col h-full bg-background">
                {/* Chat Header */}
                <div className="flex items-center gap-4 p-4 border-b">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                            setView('conversations');
                            setSelectedUserId(undefined);
                        }}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar>
                        <AvatarImage src={activeConversation.avatar || undefined} alt={activeConversation.name} />
                        <AvatarFallback>{(activeConversation.name || '?')[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h2 className="font-semibold">{activeConversation.name}</h2>
                        <p className="text-sm text-muted-foreground">
                            {userStatus?.is_online ? 'Online' : userStatus?.last_seen ? 
                                `Last seen ${formatDistanceToNow(new Date(userStatus.last_seen), { addSuffix: true })}` : 
                                'Offline'}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                    </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                    <div className="flex flex-col gap-4">
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
                                        className={`max-w-[80%] rounded-lg p-3 ${
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

                {/* Message Input */}
                <div className="p-4 border-t flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Paperclip className="h-5 w-5" />
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
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Conversations Header */}
            <div className="p-4 border-b">
                <div className="relative w-full mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search messages..." 
                        className="pl-8 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold">Messages</h2>
                    <span className="text-sm text-primary">{totalUnreadMessages} unread</span>
                </div>
                <div className="flex space-x-2 mt-2 overflow-x-auto pb-2">
                    <Button 
                        variant={currentFilter === 'all' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setCurrentFilter('all')}
                    >
                        All
                    </Button>
                    <Button 
                        variant={currentFilter === 'unread' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setCurrentFilter('unread')}
                    >
                        Unread
                    </Button>
                    <Button 
                        variant={currentFilter === 'read' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setCurrentFilter('read')}
                    >
                        Read
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-auto"
                        onClick={handleStartNewMessage}
                    >
                        + New Message
                    </Button>
                </div>
            </div>

            {/* New Message Dialog */}
            <NewMessageDialog 
                open={showNewMessageDialog} 
                onOpenChange={setShowNewMessageDialog} 
                onSelectUser={handleSelectUser} 
            />

            {/* Conversations List */}
            <ScrollArea className="flex-1">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <span className="text-muted-foreground">Loading conversations...</span>
                    </div>
                ) : allConversations.map((conversation) => (
                    <div
                        key={conversation.id}
                        className="flex items-center gap-4 p-4 hover:bg-muted cursor-pointer border-b"
                        onClick={() => handleSelectConversation(conversation.id)}
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
                            <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(conversation.time), { addSuffix: true })}
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
        </div>
    );
} 