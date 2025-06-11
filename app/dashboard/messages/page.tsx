"use client"

import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileMessages } from './mobile-messages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Paperclip, Search, Plus, User, FileText, CreditCard, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function MessagesPage() {
    const isMobile = useIsMobile();
    const [currentFilter, setCurrentFilter] = React.useState('all');

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

    const activeConversation = conversations[0]; // For demonstration, display the first conversation
    const totalUnreadMessages = conversations.reduce((sum, conv) => sum + conv.unread, 0);

    const filteredConversations = conversations.filter(conversation => {
        if (currentFilter === 'unread') {
            return conversation.unread > 0;
        } else if (currentFilter === 'read') {
            return conversation.unread === 0; // Assuming read messages have 0 unread count
        } else if (currentFilter === 'important') {
            // TODO: Implement logic for important messages (e.g., a flag in conversation data)
            return true; // For now, show all
        }
        return true; // 'all' filter
    });

    if (isMobile) {
        return <MobileMessages />;
    }

    return (
        <div className="flex flex-col flex-1 h-full bg-background p-8 pt-6">
            <div className="flex h-full gap-4">
                <Card className="w-1/3 flex flex-col">
                    <CardHeader>
                        <div className="relative w-full">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search your messages..." className="pl-8 w-full" />
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <h3 className="font-semibold">All Messages</h3>
                            <span className="text-sm text-primary">{totalUnreadMessages} unread messages</span>
                        </div>
                        <div className="flex space-x-2 mt-2">
                            <Button variant={currentFilter === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentFilter('all')}>All Messages</Button>
                            <Button variant={currentFilter === 'unread' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentFilter('unread')}>Unread <span className="ml-1 text-xs font-semibold">{totalUnreadMessages}</span></Button>
                            <Button variant={currentFilter === 'read' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentFilter('read')}>Read</Button>
                            <Button variant={currentFilter === 'important' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentFilter('important')}>Important</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <ScrollArea className="h-full pr-4">
                            {filteredConversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    className={`flex items-center gap-4 p-4 hover:bg-muted cursor-pointer ${conversation.id === activeConversation.id ? 'bg-muted' : ''}`}
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
                    </CardContent>
                </Card>

                <Card className="flex-1 flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between space-x-4 pb-2">
                        <div className="flex items-center space-x-4">
                            <Avatar>
                                <AvatarImage src={activeConversation.avatar} />
                                <AvatarFallback>{activeConversation.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle>{activeConversation.name}</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {activeConversation.online ? 'Online' : 'Offline'}
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
                                {messages.slice().reverse().map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-lg p-3 ${message.sender === 'You'
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
                                    <CreditCard className="mr-2 h-4 w-4" /> Generate payment link (escrow protected)
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Plus className="mr-2 h-4 w-4" /> Create a new invoice
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Input placeholder="Type your message..." className="flex-1" />
                        <Button size="icon" className="bg-blue-500 hover:bg-blue-600">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
} 