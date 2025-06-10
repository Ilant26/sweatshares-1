"use client"

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Paperclip } from 'lucide-react';
import Link from "next/link";

export default function MessagesPage() {
    // Sample data for conversations
    const conversations = [
        { id: '1', name: 'Alice Smith', lastMessage: 'Hey, how are you?', time: '10:30 AM', avatar: 'https://github.com/shadcn.png' },
        { id: '2', name: 'Bob Johnson', lastMessage: 'Meeting at 2 PM', time: 'Yesterday', avatar: 'https://github.com/shadcn.png' },
        { id: '3', name: 'Charlie Brown', lastMessage: 'Thanks for the help!', time: 'Monday', avatar: 'https://github.com/shadcn.png' },
        { id: '4', name: 'Diana Prince', lastMessage: 'See you soon', time: '05/01/2024', avatar: 'https://github.com/shadcn.png' },
    ];

    // Sample data for messages in a conversation
    const messages = [
        { id: '1', sender: 'Alice Smith', content: 'Hi Thomas! How are you doing today?', time: '10:30 AM' },
        { id: '2', sender: 'You', content: `I'm doing great, thanks for asking! How about you?`, time: '10:35 AM' },
        { id: '3', sender: 'Alice Smith', content: `I'm good too! Just working on a new project.`, time: '10:40 AM' },
        { id: '4', sender: 'You', content: 'Sounds interesting! What kind of project is it?', time: '10:45 AM' },
    ];

    const activeConversation = conversations[0]; // For demonstration, display the first conversation

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 h-full">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
            </div>
            <div className="flex h-[calc(100vh-200px)] gap-4">
                <Card className="w-1/3 flex flex-col">
                    <CardHeader>
                        <CardTitle>Conversations</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <ScrollArea className="h-full pr-4">
                            {conversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    className="flex items-center gap-4 p-4 hover:bg-muted cursor-pointer"
                                >
                                    <Avatar>
                                        <AvatarImage src={conversation.avatar} />
                                        <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-medium">{conversation.name}</p>
                                        <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{conversation.time}</span>
                                </div>
                            ))}
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card className="flex-1 flex flex-col">
                    <CardHeader className="flex flex-row items-center space-x-4">
                        <Avatar>
                            <AvatarImage src={activeConversation.avatar} />
                            <AvatarFallback>{activeConversation.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle>{activeConversation.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">Active now</p>
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
                                                ? 'bg-primary text-primary-foreground'
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
                        <label htmlFor="file-input" className="cursor-pointer p-2 rounded-md hover:bg-muted-foreground/10 transition-colors">
                            <Paperclip className="h-4 w-4" />
                            <input id="file-input" type="file" className="hidden" multiple />
                        </label>
                        <Input placeholder="Type your message..." className="flex-1" />
                        <Button size="icon">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
} 