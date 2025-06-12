"use client"

import React, { useState, useEffect } from 'react';
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
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

    // State for data
    const [connections, setConnections] = useState<any[]>([]);
    const [receivedInvitations, setReceivedInvitations] = useState<any[]>([]);
    const [sentInvitations, setSentInvitations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch data from backend
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                if (activeTab === 'connections') {
                    const res = await fetch(`${API_BASE}/api/network/connections`, { credentials: 'include' });
                    if (!res.ok) throw new Error('Failed to fetch connections');
                    const data = await res.json();
                    setConnections(data);
                } else if (activeTab === 'received-invitations') {
                    const res = await fetch(`${API_BASE}/api/network/received`, { credentials: 'include' });
                    if (!res.ok) throw new Error('Failed to fetch received invitations');
                    const data = await res.json();
                    setReceivedInvitations(data);
                } else if (activeTab === 'sent-invitations') {
                    const res = await fetch(`${API_BASE}/api/network/sent`, { credentials: 'include' });
                    if (!res.ok) throw new Error('Failed to fetch sent invitations');
                    const data = await res.json();
                    setSentInvitations(data);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);

    // Render connection cards
    const renderConnectionCards = (data: any[]) => {
        if (loading) return <p className="text-muted-foreground">Loading...</p>;
        if (error) return <p className="text-destructive">{error}</p>;
        if (!data || data.length === 0) return <p className="text-muted-foreground">You have no connections yet. Start connecting with professionals!</p>;
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.map(connection => (
                    <Card key={connection.id || connection.connection_id}>
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={connection.avatar || connection.avatar_url} alt={connection.name || connection.full_name || connection.username} />
                                <AvatarFallback>{(connection.name || connection.full_name || connection.username || '').charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-lg">{connection.name || connection.full_name || connection.username}</CardTitle>
                                <CardDescription>{connection.role || connection.professional_role}</CardDescription>
                                {connection.company && <p className="text-sm text-muted-foreground">{connection.company}</p>}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {connection.tags && (
                                <div className="flex flex-wrap gap-2">
                                    {connection.tags.map((tag: string) => (
                                        <span key={tag} className="text-xs bg-muted px-2 py-1 rounded-full">{tag}</span>
                                    ))}
                                </div>
                            )}
                            {connection.connectedDate && <p className="text-xs text-muted-foreground">Connected since {connection.connectedDate}</p>}
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
    };

    // Render invitations
    const renderInvitationCards = (data: any[], type: 'received' | 'sent') => {
        if (loading) return <p className="text-muted-foreground">Loading...</p>;
        if (error) return <p className="text-destructive">{error}</p>;
        if (!data || data.length === 0) {
            return <p className="text-muted-foreground">{type === 'received' ? 'No new invitations.' : 'No pending sent invitations.'}</p>;
        }
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.map(invite => (
                    <Card key={invite.id}>
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={type === 'received' ? invite.sender?.avatar_url : invite.receiver?.avatar_url} alt={type === 'received' ? invite.sender?.full_name : invite.receiver?.full_name} />
                                <AvatarFallback>{(type === 'received' ? invite.sender?.full_name : invite.receiver?.full_name || '').charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-lg">{type === 'received' ? invite.sender?.full_name : invite.receiver?.full_name}</CardTitle>
                                <CardDescription>{type === 'received' ? invite.sender?.professional_role : invite.receiver?.professional_role}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-end gap-2">
                                {type === 'received' ? (
                                    <>
                                        <Button variant="outline" size="sm" onClick={async () => {
                                            setLoading(true);
                                            setError(null);
                                            try {
                                                const res = await fetch(`${API_BASE}/api/network/accept`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ connection_id: invite.id })
                                                });
                                                if (!res.ok) throw new Error('Failed to accept invitation');
                                                setReceivedInvitations(prev => prev.filter(i => i.id !== invite.id));
                                                setConnections(prev => [...prev, invite.sender]);
                                            } catch (err: any) {
                                                setError(err.message);
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}>
                                            Accept
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={async () => {
                                            setLoading(true);
                                            setError(null);
                                            try {
                                                const res = await fetch(`${API_BASE}/api/network/reject`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ connection_id: invite.id })
                                                });
                                                if (!res.ok) throw new Error('Failed to reject invitation');
                                                setReceivedInvitations(prev => prev.filter(i => i.id !== invite.id));
                                            } catch (err: any) {
                                                setError(err.message);
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}>
                                            Reject
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="ghost" size="icon">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

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
                        My Connections <span className="ml-2 text-xs font-semibold text-primary">{connections.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="received-invitations">
                        Received Invitations <span className="ml-2 text-xs font-semibold text-primary">{receivedInvitations.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="sent-invitations">
                        Sent Invitations <span className="ml-2 text-xs font-semibold text-primary">{sentInvitations.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="suggestions">
                        Suggestions <span className="ml-2 text-xs font-semibold text-primary">10</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="connections">
                    {renderConnectionCards(connections)}
                </TabsContent>
                <TabsContent value="received-invitations">
                    {renderInvitationCards(receivedInvitations, 'received')}
                </TabsContent>
                <TabsContent value="sent-invitations">
                    {renderInvitationCards(sentInvitations, 'sent')}
                </TabsContent>
                <TabsContent value="suggestions">
                    <p className="text-muted-foreground">No new suggestions at the moment.</p>
                </TabsContent>
            </Tabs>
        </div>
    );
}