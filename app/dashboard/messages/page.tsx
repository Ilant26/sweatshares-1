"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMessages } from '@/hooks/use-messages';
import { MobileMessages } from './mobile-messages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Paperclip, Search, Plus, User, FileText, CreditCard, Users, Lock, X, Receipt } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { NewMessageDialog } from '@/components/new-message-dialog'
import { supabase } from '@/lib/supabase';
import { Message, subscribeToMessages, getProfileById, markMessageAsRead, MessageAttachment } from '@/lib/messages';
import { useUser } from '@/hooks/use-user';
import { useUnreadMessages } from '@/components/providers/session-provider';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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

// Add a helper to parse invoice messages
function parseInvoiceMessage(content: string) {
    try {
        const obj = JSON.parse(content);
        if (obj && obj.type === 'invoice') return obj;
    } catch {}
    return null;
}

// Add a helper to parse signature messages
function parseSignatureMessage(content: string) {
    try {
        const obj = JSON.parse(content);
        if (obj && (obj.type === 'signature_request' || obj.type === 'document_signed')) return obj;
    } catch {}
    return null;
}

export default function MessagesPage() {
    const { user } = useUser();
    const currentUserId = user?.id;
    const searchParams = useSearchParams();
    const userIdFromUrl = searchParams.get('userId');
    const messageFromUrl = searchParams.get('message');
    const [selectedConversation, setSelectedConversation] = React.useState<string | null>(userIdFromUrl);
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
    const { refreshUnread } = useUnreadMessages();
    const router = useRouter();

    const supabase = createClientComponentClient();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [userProfileCache, setUserProfileCache] = useState<Record<string, any>>({});

    const {
        messages,
        isLoading,
        sendMessage,
        error,
        userStatus
    } = useMessages({ userId: selectedConversation || undefined });

    // Set pre-filled message when conversation is selected and message parameter exists
    React.useEffect(() => {
        if (selectedConversation && messageFromUrl) {
            setMessageInput(decodeURIComponent(messageFromUrl));
            // Clear the message parameter from URL to avoid re-filling on subsequent visits
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('message');
            router.replace(newUrl.pathname + newUrl.search, { scroll: false });
        }
    }, [selectedConversation, messageFromUrl, router]);

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
                        // Error handling without console.error
                    }
                }
                setAllMessages(prev => dedupeMessages([...prev, newMessage]));
            });
        } catch (err) {
            // Error handling without console.error
        }

        return () => {
            if (subscriptionRef.current) {
                try {
                    subscriptionRef.current.unsubscribe();
                    subscriptionRef.current = null;
                } catch (err) {
                    // Error handling without console.error
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
                        ),
                        attachments:message_attachments(*)
                    `)
                    .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
                    .order('created_at', { ascending: true });
                
                if (error) {
                    return;
                }
                
                if (messages) {
                    setAllMessages(prev => dedupeMessages([...prev, ...messages]));
                }
            } catch (error) {
                // Error handling without console.error
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



    // Helper to fetch and cache a profile by userId
    async function fetchAndCacheProfile(userId: string) {
        if (!userId || userProfileCache[userId]) return;
        const { data } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', userId)
            .single();
        if (data) {
            setUserProfileCache(prev => ({ ...prev, [userId]: data }));
        }
    }

    // Whenever allMessages change, ensure all user profiles are cached
    useEffect(() => {
        const userIds = new Set<string>();
        allMessages.forEach(msg => {
            userIds.add(msg.sender_id);
            userIds.add(msg.receiver_id);
        });
        userIds.forEach(id => {
            if (id && !userProfileCache[id]) fetchAndCacheProfile(id);
        });
        // eslint-disable-next-line
    }, [allMessages]);

    // Helper to get a user's profile (from allConnections, userProfileCache, or fallback)
    function getUserProfile(userId: string) {
        return (
            allConnections.find(conn => conn.id === userId) ||
            userProfileCache[userId] ||
            null
        );
    }

    // Update conversations logic to use getUserProfile
    const conversations = React.useMemo(() => {
        if (!currentUserId) return [];
        const conversationMap = allMessages.reduce((acc, message) => {
            const isCurrentUserSender = message.sender_id === currentUserId;
            const otherUserId = isCurrentUserSender ? message.receiver_id : message.sender_id;
            const otherUser = getUserProfile(otherUserId);
            if (!acc[otherUserId]) {
                acc[otherUserId] = {
                    id: otherUserId,
                    name: otherUser?.full_name || otherUser?.username || 'Unknown User',
                    avatar: otherUser?.avatar_url || undefined,
                    lastMessage: message.content,
                    time: message.created_at,
                    unread: 0,
                    online: false
                };
            }
            if (new Date(message.created_at) > new Date(acc[otherUserId].time)) {
                acc[otherUserId].lastMessage = message.content;
                acc[otherUserId].time = message.created_at;
            }
            if (!message.read && message.sender_id === otherUserId) {
                acc[otherUserId].unread = (acc[otherUserId].unread || 0) + 1;
            }
            return acc;
        }, {} as Record<string, Conversation>);
        return Object.values(conversationMap).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    }, [allMessages, currentUserId, allConnections, userProfileCache]);

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
        const found = conversations.find(conv => conv.id === selectedConversation);
        if (found) return found;
        const profile = getUserProfile(selectedConversation);
        if (profile) {
            return {
                id: selectedConversation,
                name: profile.full_name || profile.username || 'Unknown User',
                avatar: profile.avatar_url,
                lastMessage: '',
                time: '',
                unread: 0,
                online: false,
                isPlaceholder: true,
            };
        }
        return {
            id: selectedConversation,
            name: 'Unknown User',
            avatar: '',
            lastMessage: '',
            time: '',
            unread: 0,
            online: false,
            isPlaceholder: true,
        };
    }, [conversations, selectedConversation, userProfileCache, allConnections]);

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
            } else {
                setSelectedUserProfile(null);
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

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log('File select triggered');
        const files = Array.from(event.target.files || []);
        console.log('Selected files:', files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSendMessage = async () => {
        if ((!messageInput.trim() && selectedFiles.length === 0) || !selectedConversation || !currentUserId) return;
        
        try {
            console.log('Sending message with files:', selectedFiles);
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

            if (error) {
                console.error('Error creating message:', error);
                throw error;
            }
            
            if (newMessage) {
                console.log('Message created:', newMessage);
                // Upload attachments if any
                if (selectedFiles.length > 0) {
                    console.log('Uploading attachments...');
                    const attachmentPromises = selectedFiles.map(async (file) => {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                        const filePath = `message-attachments/${newMessage.id}/${fileName}`;

                        console.log('Uploading file:', { fileName, filePath, type: file.type });

                        const { error: uploadError } = await supabase.storage
                            .from('message-attachments')
                            .upload(filePath, file);

                        if (uploadError) {
                            console.error('Error uploading file:', uploadError);
                            throw uploadError;
                        }

                        console.log('File uploaded successfully, creating attachment record');

                        const { error: attachmentError } = await supabase
                            .from('message_attachments')
                            .insert({
                                message_id: newMessage.id,
                                filename: file.name,
                                filepath: filePath,
                                type: file.type,
                                size: file.size
                            });

                        if (attachmentError) {
                            console.error('Error creating attachment record:', attachmentError);
                            throw attachmentError;
                        }
                    });

                    await Promise.all(attachmentPromises);
                    console.log('All attachments uploaded successfully');
                }

                // Fetch complete message with attachments
                console.log('Fetching complete message with attachments');
                const { data: completeMessage, error: fetchError } = await supabase
                    .from('messages')
                    .select(`
                        *,
                        sender:profiles!sender_id (
                            username,
                            full_name,
                            avatar_url
                        ),
                        attachments:message_attachments(*)
                    `)
                    .eq('id', newMessage.id)
                    .single();

                if (fetchError) {
                    console.error('Error fetching complete message:', fetchError);
                    throw fetchError;
                }

                console.log('Complete message with attachments:', completeMessage);
                setAllMessages(prev => dedupeMessages([...prev, completeMessage]));
                setMessageInput('');
                setSelectedFiles([]);
            }
        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            toast.error('Failed to send message');
        }
    };

    // Add a function to get file preview URL
    const getFilePreviewUrl = async (filepath: string) => {
        const { data } = await supabase.storage
            .from('message-attachments')
            .createSignedUrl(filepath, 3600); // URL valid for 1 hour
        return data?.signedUrl;
    };

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
            refreshUnread();
        };

        markMessagesAsRead();
    }, [selectedConversation, currentUserId, allMessages]);

    const handleViewProfile = (userId: string) => {
        router.push(`/dashboard/profile/${userId}`);
    };





    // Add a function to handle file download
    const handleFileDownload = async (filepath: string, filename: string) => {
        try {
            const { data, error } = await supabase.storage
                .from('message-attachments')
                .download(filepath);
            
            if (error) throw error;
            
            const url = window.URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading file:', error);
            toast.error('Failed to download file');
        }
    };

    const handleSelectUser = (userId: string) => {
        setSelectedConversation(userId);
        setNewMessageDialogOpen(false);
    };

    // Update FilePreview to accept onAttachmentLoad and call it on image/video load
    const FilePreview = ({ attachment, onAttachmentLoad }: { attachment: MessageAttachment, onAttachmentLoad?: () => void }) => {
        const [previewUrl, setPreviewUrl] = useState<string | null>(null);
        const isImage = attachment.type?.startsWith('image/');
        const isVideo = attachment.type?.startsWith('video/');

        useEffect(() => {
            const loadPreviewUrl = async () => {
                if (attachment.filepath) {
                    const url = await getFilePreviewUrl(attachment.filepath);
                    setPreviewUrl(url || null);
                }
            };
            loadPreviewUrl();
        }, [attachment.filepath]);

        if (isImage && previewUrl) {
            return (
                <img
                    src={previewUrl}
                    alt={attachment.filename}
                    className="max-w-full rounded-md"
                    loading="lazy"
                    onLoad={onAttachmentLoad}
                />
            );
        }

        if (isVideo && previewUrl) {
            return (
                <video
                    src={previewUrl}
                    controls
                    className="max-w-full rounded-md"
                    onLoadedData={onAttachmentLoad}
                />
            );
        }

        return (
            <div className="flex items-center gap-2 bg-background/50 p-2 rounded-md">
                <FileText className="h-4 w-4" />
                <span className="text-sm truncate">{attachment.filename}</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => attachment.filepath && handleFileDownload(attachment.filepath, attachment.filename)}
                >
                    Download
                </Button>
            </div>
        );
    };

    const handleSendInvoice = () => {
        if (selectedConversation) {
            router.push(`/dashboard/my-invoices?create=true&userId=${selectedConversation}`);
        }
    };

    const handleSendSignatureRequest = () => {
        if (selectedConversation) {
            router.push(`/dashboard/my-vault?signature=true&userId=${selectedConversation}`);
        }
    };

    if (isMobile) {
        return <MobileMessages />;
    }

    return (
        <div className="flex flex-col h-[90vh] bg-background">
            <div className="flex flex-1 min-h-0 gap-4 p-4">
                <Card className="w-1/3 flex flex-col flex-1 min-h-0 h-full">
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
                    <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
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
                                        <p className="text-sm text-muted-foreground truncate max-w-[120px]">
                                            {(() => {
                                                const invoice = parseInvoiceMessage(conversation.lastMessage);
                                                if (invoice) return 'Invoice Sent';
                                                const signature = parseSignatureMessage(conversation.lastMessage);
                                                if (signature) {
                                                    if (signature.type === 'signature_request') return 'Signature Request';
                                                    if (signature.type === 'document_signed') return 'Document Signed';
                                                }
                                                return conversation.lastMessage;
                                            })()}
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

                <Card className="flex-1 flex flex-col min-h-0 h-full">
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
                                            <CardTitle 
                                                className="cursor-pointer hover:text-primary transition-colors"
                                                onClick={() => handleViewProfile(selectedConversation)}
                                            >
                                                {activeConversation.name}
                                            </CardTitle>
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
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            title="View profile"
                                            onClick={() => handleViewProfile(selectedConversation)}
                                        >
                                            <User className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 min-h-0 p-4 overflow-hidden">
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
                                            const invoiceMsg = parseInvoiceMessage(message.content);
                                            const signatureMsg = parseSignatureMessage(message.content);
                                            
                                            if (invoiceMsg) {
                                                // Render invoice chat bubble
                                                return (
                                                    <div key={message.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'} w-full`}>
                                                        <div className="flex items-end gap-2 max-w-[80%]">
                                                            {!isSent && (
                                                                <Avatar>
                                                                    <AvatarImage src={senderAvatar} alt={senderName} />
                                                                    <AvatarFallback>{senderName.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                            )}
                                                            <div className="rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-900/20 p-4 shadow-md flex flex-col w-full">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Receipt className="h-5 w-5 text-green-600" />
                                                                    <span className="font-semibold text-green-700 dark:text-green-300">Invoice Sent</span>
                                                                </div>
                                                                <div className="text-sm mb-1">
                                                                    <span className="font-medium">Invoice #{invoiceMsg.invoice_number}</span>
                                                                </div>
                                                                <div className="text-sm mb-1">
                                                                    <span className="font-medium">Amount:</span> €{invoiceMsg.amount?.toFixed(2)} {invoiceMsg.currency}
                                                                </div>
                                                                <div className="text-sm mb-1">
                                                                    <span className="font-medium">Due Date:</span> {invoiceMsg.due_date ? new Date(invoiceMsg.due_date).toLocaleDateString() : '-'}
                                                                </div>
                                                                {invoiceMsg.description && (
                                                                    <div className="text-xs text-muted-foreground mb-2">{invoiceMsg.description}</div>
                                                                )}
                                                                <a
                                                                    href={`/dashboard/my-invoices?tab=${isSent ? 'sent' : 'received'}&invoiceId=${invoiceMsg.invoice_id}`}
                                                                    className="inline-block mt-2 px-4 py-2 rounded bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    View Invoice
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            
                                            if (signatureMsg) {
                                                // Render signature chat bubble
                                                return (
                                                    <div key={message.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'} w-full`}>
                                                        <div className="flex items-end gap-2 max-w-[80%]">
                                                            {!isSent && (
                                                                <Avatar>
                                                                    <AvatarImage src={senderAvatar} alt={senderName} />
                                                                    <AvatarFallback>{senderName.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                            )}
                                                            <div className={`rounded-lg border-2 p-4 shadow-md flex flex-col w-full ${
                                                                signatureMsg.type === 'signature_request' 
                                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                                                    : 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                            }`}>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <FileText className={`h-5 w-5 ${
                                                                        signatureMsg.type === 'signature_request' 
                                                                            ? 'text-blue-600' 
                                                                            : 'text-purple-600'
                                                                    }`} />
                                                                    <span className={`font-semibold ${
                                                                        signatureMsg.type === 'signature_request' 
                                                                            ? 'text-blue-700 dark:text-blue-300' 
                                                                            : 'text-purple-700 dark:text-purple-300'
                                                                    }`}>
                                                                        {signatureMsg.type === 'signature_request' ? 'Signature Request' : 'Document Signed'}
                                                                    </span>
                                                                </div>
                                                                <div className="text-sm mb-1">
                                                                    <span className="font-medium">Document:</span> {signatureMsg.documentName}
                                                                </div>
                                                                {signatureMsg.type === 'signature_request' && (
                                                                    <>
                                                                        <div className="text-sm mb-1">
                                                                            <span className="font-medium">From:</span> {signatureMsg.senderName}
                                                                        </div>
                                                                        {signatureMsg.message && (
                                                                            <div className="text-xs text-muted-foreground mb-2">{signatureMsg.message}</div>
                                                                        )}
                                                                    </>
                                                                )}
                                                                {signatureMsg.type === 'document_signed' && (
                                                                    <div className="text-sm mb-1">
                                                                        <span className="font-medium">Signed by:</span> {signatureMsg.signerName}
                                                                    </div>
                                                                )}
                                                                <a
                                                                    href={`/dashboard/signature/${signatureMsg.signatureRequestId}`}
                                                                    className={`inline-block mt-2 px-4 py-2 rounded text-white text-xs font-semibold transition ${
                                                                        signatureMsg.type === 'signature_request' 
                                                                            ? 'bg-blue-600 hover:bg-blue-700' 
                                                                            : 'bg-purple-600 hover:bg-purple-700'
                                                                    }`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {signatureMsg.type === 'signature_request' ? 'Sign Document' : 'View Signature'}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
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
                                                        className={`max-w-[70%] rounded-lg p-3 break-all whitespace-pre-line overflow-x-auto ${
                                                            isSent ? 'bg-blue-500 text-white' : 'bg-muted'
                                                        }`}
                                                    >
                                                        <p className="text-sm">{message.content}</p>
                                                        {message.attachments && message.attachments.length > 0 && (
                                                            <div className="mt-2 space-y-2">
                                                                {message.attachments.map((attachment) => (
                                                                    <div key={attachment.id} className="relative">
                                                                        <FilePreview attachment={attachment} onAttachmentLoad={scrollToBottom} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
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
                                {selectedFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {selectedFiles.map((file, index) => (
                                            <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                                                <FileText className="h-4 w-4" />
                                                <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-4 w-4"
                                                    onClick={() => handleRemoveFile(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                            <DropdownMenuItem onSelect={(e) => {
                                                e.preventDefault();
                                                console.log('File upload menu item clicked');
                                                fileInputRef.current?.click();
                                            }}>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    className="hidden"
                                                    multiple
                                                    onChange={handleFileSelect}
                                                    onClick={(e) => {
                                                        // Reset the value so the same file can be selected again
                                                        e.currentTarget.value = '';
                                                    }}
                                                />
                                                <div className="flex items-center cursor-pointer w-full">
                                                    <FileText className="mr-2 h-4 w-4" /> Upload from device
                                                </div>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem onClick={handleSendInvoice} disabled={!selectedConversation}>
                                                <Receipt className="mr-2 h-4 w-4" /> Send an invoice
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleSendSignatureRequest} disabled={!selectedConversation}>
                                                <FileText className="mr-2 h-4 w-4" /> Send Signature Request
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
                                        disabled={(!messageInput.trim() && selectedFiles.length === 0) || !selectedConversation}
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