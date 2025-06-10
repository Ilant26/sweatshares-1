"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, UserPlus, Mail, Send, Settings2, Filter, ArrowUpDown, MessageCircle, UserX, Trash2, ChevronDown } from 'lucide-react';
import Link from "next/link";

export default function MyNetworkPage() {
    const [activeTab, setActiveTab] = useState('connections');

    const connections = [
        { id: '1', name: 'Sophie Dubois', role: 'Directrice Marketing', company: 'MediTech Solutions', tags: ['Marketing', 'Partenaire'], avatar: 'https://github.com/shadcn.png', connectedDate: 'Depuis le 1 mars 2023' },
        { id: '2', name: 'Philippe Laurent', role: 'Investisseur, Business Angel', company: 'Venture Capital Partners', tags: ['Investisseur', 'Mentor'], avatar: 'https://github.com/shadcn.png', connectedDate: 'Depuis le 3 mars 2023' },
        { id: '3', name: 'Lucas Martin', role: 'Développeur full-stack', company: 'TechnoInnovate', tags: ['Co-fondateur', 'Freelancer'], avatar: 'https://github.com/shadcn.png', connectedDate: 'Depuis le 28 avril 2023' },
        { id: '4', name: 'Émilie Rousseau', role: 'CEO & Fondatrice', company: 'EcoSolutions', tags: ['Co-fondateur', 'Mentor'], avatar: 'https://github.com/shadcn.png', connectedDate: 'Depuis le 5 janvier 2023' },
        { id: '5', name: 'Camille Lefevre', role: 'UX/UI Designer', company: 'DesignWorks', tags: ['Marketing', 'Partenaire'], avatar: 'https://github.com/shadcn.png', connectedDate: 'Depuis le 2 mai 2023' },
        { id: '6', name: 'Antoine Bernard', role: 'Directeur Commercial', company: 'GlobalTech', tags: ['Parrainage'], avatar: 'https://github.com/shadcn.png', connectedDate: 'Depuis le 22 fevrier 2023' },
    ];

    const renderConnectionCards = (data: typeof connections) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map(connection => (
                <Card key={connection.id}>
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={connection.avatar} alt={connection.name} />
                            <AvatarFallback>{connection.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg">{connection.name}</CardTitle>
                            <CardDescription>{connection.role}</CardDescription>
                            <p className="text-sm text-muted-foreground">{connection.company}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {connection.tags.map(tag => (
                                <span key={tag} className="text-xs bg-muted px-2 py-1 rounded-full">{tag}</span>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Connected since {connection.connectedDate}</p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm">
                                <MessageCircle className="h-4 w-4 mr-2" /> Message
                            </Button>
                            <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
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
                    <Input placeholder="Search your network..." className="pl-8 w-full" />
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
                        My Connections <span className="ml-2 text-xs font-semibold text-primary">128</span>
                    </TabsTrigger>
                    <TabsTrigger value="received-invitations">
                        Received Invitations <span className="ml-2 text-xs font-semibold text-primary">5</span>
                    </TabsTrigger>
                    <TabsTrigger value="sent-invitations">
                        Sent Invitations <span className="ml-2 text-xs font-semibold text-primary">3</span>
                    </TabsTrigger>
                    <TabsTrigger value="suggestions">
                        Suggestions <span className="ml-2 text-xs font-semibold text-primary">10</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="connections">
                    {renderConnectionCards(connections)}
                </TabsContent>
                <TabsContent value="received-invitations">
                    <p className="text-muted-foreground">No new invitations.</p>
                </TabsContent>
                <TabsContent value="sent-invitations">
                    <p className="text-muted-foreground">No pending sent invitations.</p>
                </TabsContent>
                <TabsContent value="suggestions">
                    <p className="text-muted-foreground">No new suggestions at the moment.</p>
                </TabsContent>
            </Tabs>
        </div>
    );
}