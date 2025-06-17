"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '@/hooks/use-messages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Paperclip, Search, ArrowLeft, User, FileText, CreditCard, Users, Lock, X, ChevronLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { NewMessageDialog } from '@/components/new-message-dialog';
import { supabase } from '@/lib/supabase';
import { Message, subscribeToMessages, getProfileById, markMessageAsRead, MessageAttachment } from '@/lib/messages';
import { useUser } from '@/hooks/use-user';
import { useUnreadMessages } from '@/components/providers/session-provider';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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

interface VaultDocument {
    id: string;
    filename: string;
    filepath: string;
    type?: string;
    size?: number;
    owner_id: string;
    created_at: string;
}

// Utility to deduplicate messages by id
function dedupeMessages(messages: Message[]): Message[] {
    const map = new Map();
    for (const msg of messages) {
        map.set(msg.id, msg);
    }
    return Array.from(map.values());
}

export function MobileMessages() {
    const { user } = useUser();
    const currentUserId = user?.id;
    const searchParams = useSearchParams();
    const userIdFromUrl = searchParams.get('userId');
    const [view, setView] = useState<'conversations' | 'chat'>(userIdFromUrl ? 'chat' : 'conversations');
    const [currentFilter, setCurrentFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(userIdFromUrl);
    const [messageInput, setMessageInput] = useState('');
    const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
    const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
    const [allMessages, setAllMessages] = useState<Message[]>([]);
    const [isLoadingAllMessages, setIsLoadingAllMessages] = useState(true);
    const [allConnections, setAllConnections] = useState<any[]>([]);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const subscriptionRef = React.useRef<{ unsubscribe: () => void } | null>(null);
    const { refreshUnread } = useUnreadMessages();
    const router = useRouter();
    const [vaultDocuments, setVaultDocuments] = useState<VaultDocument[]>([]);
    const [showVaultDialog, setShowVaultDialog] = useState(false);
    const supabase = createClientComponentClient();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedConnection, setSelectedConnection] = useState<any>(null);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Update the useEffect that fetches all messages
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

    // Update the subscription to include attachments
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

                // Fetch attachments for the new message
                const { data: attachments, error: attachmentsError } = await supabase
                    .from('message_attachments')
                    .select('*')
                    .eq('message_id', newMessage.id);

                if (!attachmentsError) {
                    newMessage.attachments = attachments;
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

    const {
        messages,
        isLoading,
        sendMessage,
        error,
        userStatus
    } = useMessages({ userId: selectedUserId || undefined });

    // Add scroll to bottom function
    const scrollToBottom = React.useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Add effect to scroll when messages change
    React.useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

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

    // Group messages by conversation (one per user pair)
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
            } else {
                setSelectedUserProfile(null);
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

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log('Mobile: File select triggered');
        const files = Array.from(event.target.files || []);
        console.log('Mobile: Selected files:', files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSendMessage = async () => {
        if ((!messageInput.trim() && selectedFiles.length === 0) || !selectedUserId || !currentUserId) return;
        
        try {
            const { data: newMessage, error } = await supabase
                .from('messages')
                .insert({
                    sender_id: currentUserId,
                    receiver_id: selectedUserId,
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
                throw error;
            }
            
            if (newMessage) {
                // Upload attachments if any
                if (selectedFiles.length > 0) {
                    const attachmentPromises = selectedFiles.map(async (file) => {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                        const filePath = `message-attachments/${newMessage.id}/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                            .from('message-attachments')
                            .upload(filePath, file);

                        if (uploadError) {
                            throw uploadError;
                        }

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
                            throw attachmentError;
                        }
                    });

                    await Promise.all(attachmentPromises);
                }

                // Fetch complete message with attachments
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
                    throw fetchError;
                }

                setAllMessages(prev => dedupeMessages([...prev, completeMessage]));
                setMessageInput('');
                setSelectedFiles([]);
            }
        } catch (error) {
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
            toast.error('Failed to download file');
        }
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

    // Mark messages as read when a conversation is selected
    useEffect(() => {
        const markMessagesAsRead = async () => {
            if (!currentUserId || !selectedUserId) return;

            // Find unread messages in this conversation sent to the current user
            const unreadMessages = allMessages.filter(
                msg =>
                    !msg.read &&
                    msg.sender_id === selectedUserId &&
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
                    // Error handling without console.error
                }
            }));
            refreshUnread();
        };

        markMessagesAsRead();
    }, [selectedUserId, currentUserId, allMessages]);

    const handleViewProfile = (userId: string) => {
        router.push(`/dashboard/profile/${userId}`);
    };

    // Fetch vault documents
    useEffect(() => {
        if (!user) return;
        const fetchVaultDocs = async () => {
            const { data, error } = await supabase
                .from('vault_documents')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });
            if (error) console.error('Failed to fetch vault documents:', error);
            else setVaultDocuments(data || []);
        };
        fetchVaultDocs();
    }, [user]);

    const handleVaultDocumentSelect = async (doc: VaultDocument) => {
        try {
            const { data, error } = await supabase.storage
                .from('vault')
                .download(doc.filepath);
            
            if (error) throw error;
            
            // Create a File object from the downloaded data
            const file = new File([data], doc.filename, { type: data.type });
            
            // Here you would typically handle the file attachment
            // For now, we'll just show a success message
            toast.success(`Selected ${doc.filename} from vault`);
            setShowVaultDialog(false);
        } catch (error) {
            console.error('Error selecting vault document:', error);
            toast.error('Failed to select document from vault');
        }
    };

    const getFileIcon = (filename: string) => {
        const extension = filename.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return <FileText className="h-4 w-4 text-red-500" />;
            case 'doc':
            case 'docx':
                return <FileText className="h-4 w-4 text-blue-500" />;
            case 'xls':
            case 'xlsx':
                return <FileText className="h-4 w-4 text-green-500" />;
            case 'jpg':
            case 'jpeg':
            case 'png':
                return <FileText className="h-4 w-4 text-yellow-500" />;
            default:
                return <FileText className="h-4 w-4 text-gray-500" />;
        }
    };

    if (view === 'chat' && selectedUserId && activeConversation) {
        return (
            <div className="flex flex-col h-full bg-background">
                {/* Chat Header */}
                <div className="sticky top-0 z-10 bg-background flex items-center gap-4 p-4 border-b">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                            setView('conversations');
                            setSelectedUserId(null);
                        }}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar>
                        <AvatarImage src={activeConversation.avatar || undefined} alt={activeConversation.name} />
                        <AvatarFallback>{(activeConversation.name || '?')[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h2 
                            className="font-semibold cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleViewProfile(selectedUserId)}
                        >
                            {activeConversation.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {userStatus?.is_online ? 'Online' : userStatus?.last_seen ? 
                                `Last seen ${formatDistanceToNow(new Date(userStatus.last_seen), { addSuffix: true })}` : 
                                'Offline'}
                        </p>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleViewProfile(selectedUserId)}
                    >
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

                {/* Message Input */}
                <div className="p-4 border-t flex items-center gap-2">
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Paperclip className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="start">
                            <DropdownMenuLabel>Attachment Options</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={(e) => {
                                e.preventDefault();
                                console.log('Mobile: File upload menu item clicked');
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
                            <DropdownMenuItem onClick={() => setShowVaultDialog(true)}>
                                <Lock className="mr-2 h-4 w-4" /> Select from My Vault
                            </DropdownMenuItem>
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
                        disabled={(!messageInput.trim() && selectedFiles.length === 0) || !selectedUserId}
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
                            <p className="text-sm text-muted-foreground truncate max-w-[120px]">
                                {conversation.lastMessage}
                            </p>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-muted-foreground">
                                {conversation.time ? formatDistanceToNow(new Date(conversation.time), { addSuffix: true }) : '-'}
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

            {/* Vault Document Selection Dialog */}
            <Dialog open={showVaultDialog} onOpenChange={setShowVaultDialog}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Select from My Vault</DialogTitle>
                        <DialogDescription>
                            Choose a document from your secure vault to attach
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[400px] pr-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>NAME</TableHead>
                                    <TableHead>TYPE</TableHead>
                                    <TableHead>ADDED</TableHead>
                                    <TableHead className="text-right">ACTIONS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vaultDocuments.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            {getFileIcon(doc.filename)} {doc.filename}
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{doc.type || 'N/A'}</Badge></TableCell>
                                        <TableCell>{new Date(doc.created_at).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleVaultDocumentSelect(doc)}
                                            >
                                                Select
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}