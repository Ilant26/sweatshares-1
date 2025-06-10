"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Save } from 'lucide-react';

export default function ProfileSettingsPage() {
    const [activeTab, setActiveTab] = useState('personal');

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
                <Button>
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/4">
                    <Card className="h-full">
                        <CardContent className="flex flex-col items-center gap-4 py-6">
                            <Avatar className="h-32 w-32">
                                <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                            <Button variant="outline" className="relative">
                                <Camera className="mr-2 h-4 w-4" /> Edit Photo
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                            </Button>
                            <div className="text-sm text-center">
                                <span className="text-orange-500">KYC Not Verified</span> <a href="#" className="text-blue-500 hover:underline">Complete KYC</a>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="w-full md:w-3/4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="personal">Personal Information</TabsTrigger>
                            <TabsTrigger value="subscription">Subscription</TabsTrigger>
                        </TabsList>
                        <TabsContent value="personal" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                    <CardDescription>Update your personal details here.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input id="firstName" defaultValue="Thomas" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input id="lastName" defaultValue="Moreau" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="professionalRole">Professional Role</Label>
                                        <Select defaultValue="Product Manager">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Product Manager">Product Manager</SelectItem>
                                                <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                                                <SelectItem value="Designer">Designer</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="country">Country</Label>
                                        <Select defaultValue="France">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a country" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="France">France</SelectItem>
                                                <SelectItem value="USA">USA</SelectItem>
                                                <SelectItem value="Canada">Canada</SelectItem>
                                                <SelectItem value="UK">UK</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="languages">Languages</Label>
                                        <Input id="languages" defaultValue="French, English" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Private Contact Information</CardTitle>
                                    <CardDescription>This information will not be publicly visible to other users.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="phoneNumber">Phone Number</Label>
                                        <Input id="phoneNumber" defaultValue="+33 6 12 34 56 78" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="emailAddress">Email Address</Label>
                                        <Input id="emailAddress" defaultValue="thomas.moreau@example.com" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Email Notifications</CardTitle>
                                    <CardDescription>Receive updates and alerts via email</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="emailNotifications">Enable Email Notifications</Label>
                                        <Switch id="emailNotifications" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
                                    <CardDescription>Add an extra layer of security to your account</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="twoFactorAuth">Enable 2FA</Label>
                                        <Button variant="outline" size="sm">Setup 2FA</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="subscription">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Subscription Details</CardTitle>
                                    <CardDescription>Manage your subscription plan.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p>Subscription details will go here.</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}