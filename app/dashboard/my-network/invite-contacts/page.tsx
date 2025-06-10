"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, MessageCircle } from 'lucide-react';

export default function InviteContactsPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const allUsers = [
        { id: '1', name: 'John Doe', role: 'Software Engineer', company: 'Tech Solutions', avatar: 'https://github.com/shadcn.png' },
        { id: '2', name: 'Jane Smith', role: 'Product Manager', company: 'Innovate Co.', avatar: 'https://github.com/shadcn.png' },
        { id: '3', name: 'Peter Jones', role: 'Data Scientist', company: 'Data Insights', avatar: 'https://github.com/shadcn.png' },
        { id: '4', name: 'Alice Brown', role: 'Marketing Specialist', company: 'Global Brands', avatar: 'https://github.com/shadcn.png' },
        { id: '5', name: 'Michael Green', role: 'HR Manager', company: 'People First', avatar: 'https://github.com/shadcn.png' },
    ];

    const filteredUsers = allUsers.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Invite new contacts</h2>
            </div>
            <p className="text-muted-foreground">Discover and connect with professionals.</p>

            <div className="relative w-full md:w-1/2 lg:w-1/3 mb-6">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search for people, roles, or companies..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground">No users found matching your search.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map(user => (
                        <Card key={user.id}>
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-lg">{user.name}</CardTitle>
                                    <CardDescription>{user.role}</CardDescription>
                                    <p className="text-sm text-muted-foreground">{user.company}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm">
                                        <MessageCircle className="h-4 w-4 mr-2" /> Message
                                    </Button>
                                    <Button size="sm">
                                        <UserPlus className="h-4 w-4 mr-2" /> Connect
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
} 