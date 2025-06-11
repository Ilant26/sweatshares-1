"use client"

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Paperclip, Search, ArrowLeft, User, FileText, CreditCard, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Conversation {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    avatar: string;
    unread: number;
    online: boolean;
}

interface Message {
    id: string;
    sender: string;
    content: string;
    time: string;
}

export function MobileMessages() {
    const [view, setView] = useState<'conversations' | 'chat'>('conversations');
    const [currentFilter, setCurrentFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Sample data for conversations
    const conversations = [
        { id: '1', name: 'Sophie Dubois', lastMessage: `Excellent! Let's discuss this next week.`, time: '10:30 AM', avatar: 'https://randomuser.me/api/portraits/women/1.jpg', unread: 0, online: true },
        { id: '2', name: 'Philippe Laurent', lastMessage: 'See you at 2 PM', time: 'Yesterday', avatar: 'https://randomuser.me/api/portraits/men/2.jpg', unread: 1, online: false },
        { id: '3', name: 'Lucas Martin', lastMessage: 'Thanks for the help!', time: 'Monday', avatar: 'https://randomuser.me/api/portraits/men/3.jpg', unread: 0, online: true },
        { id: '4', name: 'Émilie Rousseau', lastMessage: `Okay, I'll send the details soon.`, time: '05/01/2024', avatar: 'https://randomuser.me/api/portraits/women/4.jpg', unread: 2, online: false },
        { id: '5', name: 'Camille Lefevre', lastMessage: `Great! Let's start working on it.`, time: '04/28/2024', avatar: 'https://randomuser.me/api/portraits/women/5.jpg', unread: 0, online: true },
    ];

    // Sample data for messages in a conversation
    const messages = [
        { id: '1', sender: 'Sophie Dubois', content: 'Hello Thomas, I hope you are doing well.', time: '01 May 2023' },
        { id: '2', sender: 'You', content: 'I have received your proposal for the marketing campaign and I find it very interesting.', time: '01 May 2023' },
        { id: '3', sender: 'Sophie Dubois', content: 'Hello Sophie, thanks for your return! I am sure that the proposed solution will please you.', time: '01 May 2023' },
        { id: '4', sender: 'You', content: 'I have a few questions regarding the budget allocated to the SEO part. Could you give me more details on the breakdown you envision?', time: '01 May 2023' },
        { id: '5', sender: 'Sophie Dubois', content: `And also, concerning the calendar of deployment, is this what the launch date is firm or can we help you adjust it?`, time: '01 May 2023' },
        { id: '6', sender: 'You', content: 'For the SEO budget, we envision about 30% of the total budget, i.e., €15,000.', time: '10:18 AM' },
    ];

    const activeConversation = conversations[0];
    const totalUnreadMessages = conversations.reduce((sum, conv) => sum + conv.unread, 0);

    const filteredConversations = conversations.filter(conversation => {
        if (currentFilter === 'unread') {
            return conversation.unread > 0;
        } else if (currentFilter === 'read') {
            return conversation.unread === 0;
        }
        return true;
    }).filter(conversation => 
        conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (view === 'chat') {
        return (
            <div className="flex flex-col h-full bg-background">
                {/* Chat Header */}
                <div className="flex items-center gap-4 p-4 border-b">
                    <Button variant="ghost" size="icon" onClick={() => setView('conversations')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar>
                        <AvatarImage src={activeConversation.avatar} />
                        <AvatarFallback>{activeConversation.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h2 className="font-semibold">{activeConversation.name}</h2>
                        <p className="text-sm text-muted-foreground">
                            {activeConversation.online ? 'Online' : 'Offline'}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                    </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                    <div className="flex flex-col gap-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg p-3 ${
                                        message.sender === 'You'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-muted'
                                    }`}
                                >
                                    <p className="text-sm">{message.content}</p>
                                    <p className="text-xs text-muted-foreground text-right mt-1">{message.time}</p>
                                </div>
                            </div>
                        ))}
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
                    <Input placeholder="Type your message..." className="flex-1" />
                    <Button size="icon" className="bg-blue-500 hover:bg-blue-600">
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
                    <Button variant={currentFilter === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentFilter('all')}>
                        All
                    </Button>
                    <Button variant={currentFilter === 'unread' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentFilter('unread')}>
                        Unread
                    </Button>
                    <Button variant={currentFilter === 'read' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentFilter('read')}>
                        Read
                    </Button>
                </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
                {filteredConversations.map((conversation) => (
                    <div
                        key={conversation.id}
                        className="flex items-center gap-4 p-4 hover:bg-muted cursor-pointer border-b"
                        onClick={() => setView('chat')}
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
                            <span className="text-xs text-muted-foreground">{conversation.time}</span>
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