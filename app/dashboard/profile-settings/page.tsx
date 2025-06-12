"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Save } from 'lucide-react';
import { useSession } from '@/components/providers/session-provider';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

// Define the UserProfile interface based on your database schema
interface UserProfile {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    website: string | null;
    bio: string | null;
    professional_role: string | null;
    country: string | null;
    languages: string | null;
    phone_number: string | null;
    email_notifications: boolean;
    two_factor_enabled: boolean;
    onboarding_completed: boolean;
    email: string; // From auth.user
}

export default function ProfileSettingsPage() {
    const { user, loading: sessionLoading } = useSession();
    const supabase = createClientComponentClient<Database>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState('personal');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionLoading && user) {
            const fetchUserProfile = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select(`
                            id,
                            username,
                            full_name,
                            avatar_url,
                            website,
                            bio,
                            professional_role,
                            country,
                            languages,
                            phone_number,
                            email_notifications,
                            two_factor_enabled,
                            onboarding_completed
                        `)
                        .eq('id', user.id)
                        .single();

                    if (profileError) throw profileError;

                    setUserProfile({
                        id: user.id,
                        username: profile?.username || user.user_metadata?.username || null,
                        full_name: profile?.full_name || user.user_metadata?.full_name || null,
                        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
                        website: profile?.website || null,
                        bio: profile?.bio || null,
                        professional_role: profile?.professional_role || null,
                        country: profile?.country || null,
                        languages: profile?.languages || null,
                        phone_number: profile?.phone_number || null,
                        email_notifications: profile?.email_notifications || false,
                        two_factor_enabled: profile?.two_factor_enabled || false,
                        onboarding_completed: profile?.onboarding_completed || false,
                        email: user.email || '',
                    });
                    setPreviewUrl(profile?.avatar_url || user.user_metadata?.avatar_url || '/placeholder-user.jpg');

                } catch (err: any) {
                    setError(err.message || "Failed to load user profile.");
                    toast.error(err.message || "Failed to load user profile.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchUserProfile();
        }
    }, [user, sessionLoading, supabase]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setSelectedFile(null);
            setPreviewUrl(userProfile?.avatar_url || '/placeholder-user.jpg');
        }
    };

    const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user || !userProfile) return;

        setIsLoading(true);
        setError(null);

        let newAvatarUrl = userProfile.avatar_url;

        try {
            if (selectedFile) {
                // Check if file is an image
                if (!selectedFile.type.startsWith('image/')) {
                    throw new Error('Please upload an image file');
                }

                // Check file size (max 5MB)
                if (selectedFile.size > 5 * 1024 * 1024) {
                    throw new Error('Image size should be less than 5MB');
                }

                const fileExtension = selectedFile.name.split('.').pop();
                const filePath = `${user.id}/${Date.now()}.${fileExtension}`;

                try {
                    const { error: uploadError, data: uploadData } = await supabase.storage
                        .from('avatars')
                        .upload(filePath, selectedFile, {
                            cacheControl: '3600',
                            upsert: true,
                        });

                    if (uploadError) {
                        if (uploadError.message.includes('bucket')) {
                            throw new Error('Storage bucket not found. Please contact support.');
                        }
                        throw uploadError;
                    }

                    const { data: publicUrlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath);

                    if (publicUrlData) {
                        newAvatarUrl = publicUrlData.publicUrl;
                    }
                } catch (storageError: any) {
                    console.error('Storage error:', storageError);
                    throw new Error(storageError.message || 'Failed to upload image. Please try again.');
                }
            }

            const { error: authUpdateError } = await supabase.auth.updateUser({
                data: {
                    full_name: userProfile.full_name,
                    avatar_url: newAvatarUrl,
                },
            });

            if (authUpdateError) throw authUpdateError;

            const { error: profileUpdateError } = await supabase
                .from('profiles')
                .upsert(
                    {
                        id: user.id,
                        username: userProfile.username,
                        full_name: userProfile.full_name,
                        avatar_url: newAvatarUrl,
                        website: userProfile.website,
                        bio: userProfile.bio,
                        professional_role: userProfile.professional_role,
                        country: userProfile.country,
                        languages: userProfile.languages,
                        phone_number: userProfile.phone_number,
                        email_notifications: userProfile.email_notifications,
                        two_factor_enabled: userProfile.two_factor_enabled,
                        onboarding_completed: userProfile.onboarding_completed,
                    },
                    { onConflict: 'id' }
                );

            if (profileUpdateError) throw profileUpdateError;

            toast.success('Profile updated successfully!');
            setSelectedFile(null);
            if (userProfile) {
                setUserProfile(prev => ({ ...prev!, avatar_url: newAvatarUrl }));
            }

        } catch (err: any) {
            setError(err.message || "Failed to update profile.");
            toast.error(err.message || "Failed to update profile.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setUserProfile(prev => prev ? { ...prev, [id]: value } : null);
    };

    const handleSelectChange = (field: keyof UserProfile) => (value: string) => {
        setUserProfile(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleSwitchChange = (field: keyof UserProfile) => (checked: boolean) => {
        setUserProfile(prev => prev ? { ...prev, [field]: checked } : null);
    };

    if (sessionLoading || isLoading || !userProfile) {
        return (
            <div className="flex-1 space-y-8 p-8 pt-6 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <form onSubmit={handleSave}>
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Save className="mr-2 h-4 w-4 animate-spin" /> Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Save Changes
                            </>
                        )}
                    </Button>
                </div>
                {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive mt-4">
                        {error}
                    </div>
                )}
                <div className="flex flex-col md:flex-row gap-8 mt-8">
                    <div className="w-full md:w-1/4">
                        <Card className="h-full">
                            <CardContent className="flex flex-col items-center gap-4 py-6">
                                <Avatar className="h-32 w-32">
                                    <AvatarImage src={previewUrl || userProfile.avatar_url || "/placeholder-user.jpg"} alt={userProfile.full_name || userProfile.username || "User Avatar"} />
                                    <AvatarFallback>{userProfile.full_name?.charAt(0) || userProfile.username?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <Button variant="outline" className="relative">
                                    <Camera className="mr-2 h-4 w-4" /> Edit Photo
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept="image/*"
                                    />
                                </Button>
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
                                            <Label htmlFor="full_name">Full Name</Label>
                                            <Input id="full_name" value={userProfile.full_name || ''} onChange={handleInputChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="username">Username</Label>
                                            <Input id="username" value={userProfile.username || ''} onChange={handleInputChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="professional_role">Professional Role</Label>
                                            <Select
                                                value={userProfile.professional_role || ''}
                                                onValueChange={handleSelectChange('professional_role')}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Product Manager">Product Manager</SelectItem>
                                                    <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                                                    <SelectItem value="Designer">Designer</SelectItem>
                                                    <SelectItem value="Founder">Founder</SelectItem>
                                                    <SelectItem value="Freelancer">Freelancer</SelectItem>
                                                    <SelectItem value="Investor">Investor</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Select
                                                value={userProfile.country || ''}
                                                onValueChange={handleSelectChange('country')}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a country" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="France">France</SelectItem>
                                                    <SelectItem value="USA">USA</SelectItem>
                                                    <SelectItem value="Canada">Canada</SelectItem>
                                                    <SelectItem value="UK">UK</SelectItem>
                                                    <SelectItem value="Germany">Germany</SelectItem>
                                                    <SelectItem value="Spain">Spain</SelectItem>
                                                    <SelectItem value="Italy">Italy</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="languages">Languages (comma-separated)</Label>
                                            <Input id="languages" value={userProfile.languages || ''} onChange={handleInputChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="website">Website</Label>
                                            <Input id="website" value={userProfile.website || ''} onChange={handleInputChange} placeholder="https://your-website.com" />
                                        </div>
                                        <div className="space-y-2 col-span-full">
                                            <Label htmlFor="bio">Bio</Label>
                                            <Textarea id="bio" value={userProfile.bio || ''} onChange={handleInputChange} placeholder="Tell us a little about yourself..." rows={4} />
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
                                            <Input id="phone_number" value={userProfile.phone_number || ''} onChange={handleInputChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input id="email" value={userProfile.email || ''} disabled />
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
                                            <Label htmlFor="email_notifications">Enable Email Notifications</Label>
                                            <Switch
                                                id="email_notifications"
                                                checked={userProfile.email_notifications}
                                                onCheckedChange={handleSwitchChange('email_notifications')}
                                            />
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
                                            <Label htmlFor="two_factor_enabled">Enable 2FA</Label>
                                            <Switch
                                                id="two_factor_enabled"
                                                checked={userProfile.two_factor_enabled}
                                                onCheckedChange={handleSwitchChange('two_factor_enabled')}
                                                disabled // 2FA setup is typically more complex, leaving disabled for now
                                            />
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
            </form>
        </div>
    );
}