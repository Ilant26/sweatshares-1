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
import { Camera, Save, Loader2 } from 'lucide-react';
import { useSession } from '@/components/providers/session-provider';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    email: string;
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
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (!sessionLoading && user) {
            fetchUserProfile();
        }
    }, [user, sessionLoading]);

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
                .eq('id', user?.id)
                .single();

            if (profileError) throw profileError;

            const newProfile = {
                id: user?.id || '',
                username: profile?.username || user?.user_metadata?.username || null,
                full_name: profile?.full_name || user?.user_metadata?.full_name || null,
                avatar_url: profile?.avatar_url || user?.user_metadata?.avatar_url || null,
                website: profile?.website || null,
                bio: profile?.bio || null,
                professional_role: profile?.professional_role || null,
                country: profile?.country || null,
                languages: profile?.languages || null,
                phone_number: profile?.phone_number || null,
                email_notifications: profile?.email_notifications || false,
                two_factor_enabled: profile?.two_factor_enabled || false,
                onboarding_completed: profile?.onboarding_completed || false,
                email: user?.email || '',
            };

            setUserProfile(newProfile);
            setPreviewUrl(profile?.avatar_url || user?.user_metadata?.avatar_url || '/placeholder-user.jpg');
            setHasChanges(false);

        } catch (err: any) {
            setError(err.message || "Failed to load user profile.");
            toast.error(err.message || "Failed to load user profile.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setHasChanges(true);
        }
    };

    const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user || !userProfile) return;

        setIsSaving(true);
        setError(null);

        let newAvatarUrl = userProfile.avatar_url;

        try {
            if (selectedFile) {
                const fileExtension = selectedFile.name.split('.').pop();
                const filePath = `${user.id}/${Date.now()}.${fileExtension}`;

                const { error: uploadError, data: uploadData } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, selectedFile, {
                        cacheControl: '3600',
                        upsert: true,
                    });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                if (publicUrlData) {
                    newAvatarUrl = publicUrlData.publicUrl;
                }
            }

            // Update auth metadata
            const { error: authUpdateError } = await supabase.auth.updateUser({
                data: {
                    full_name: userProfile.full_name,
                    avatar_url: newAvatarUrl,
                },
            });

            if (authUpdateError) throw authUpdateError;

            // Update profile
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
            setHasChanges(false);
            await fetchUserProfile(); // Refresh the profile data

        } catch (err: any) {
            setError(err.message || "Failed to update profile.");
            toast.error(err.message || "Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setUserProfile(prev => prev ? { ...prev, [id]: value } : null);
        setHasChanges(true);
    };

    const handleSelectChange = (field: keyof UserProfile) => (value: string) => {
        setUserProfile(prev => prev ? { ...prev, [field]: value } : null);
        setHasChanges(true);
    };

    const handleSwitchChange = (field: keyof UserProfile) => (checked: boolean) => {
        setUserProfile(prev => prev ? { ...prev, [field]: checked } : null);
        setHasChanges(true);
    };

    if (sessionLoading || isLoading || !userProfile) {
        return (
            <div className="flex-1 space-y-8 p-8 pt-6 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">

            <form onSubmit={handleSave} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Update your personal information and how others see you on the platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={previewUrl || '/placeholder-user.jpg'} alt={userProfile.full_name || 'User'} />
                                    <AvatarFallback>{userProfile.full_name?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="secondary"
                                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Camera className="h-4 w-4" />
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <Input
                                        id="full_name"
                                        value={userProfile.full_name || ''}
                                        onChange={handleInputChange}
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        value={userProfile.username || ''}
                                        onChange={handleInputChange}
                                        placeholder="Enter your username"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={userProfile.bio || ''}
                                onChange={handleInputChange}
                                placeholder="Tell us about yourself"
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="professional_role">Professional Role</Label>
                            <Input
                                id="professional_role"
                                value={userProfile.professional_role || ''}
                                onChange={handleInputChange}
                                placeholder="e.g., Software Engineer, Product Manager"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                type="url"
                                value={userProfile.website || ''}
                                onChange={handleInputChange}
                                placeholder="https://your-website.com"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                        <CardDescription>Update your contact details and preferences.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={userProfile.email}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-sm text-muted-foreground">Your email address cannot be changed.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone_number">Phone Number</Label>
                            <Input
                                id="phone_number"
                                type="tel"
                                value={userProfile.phone_number || ''}
                                onChange={handleInputChange}
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">Receive email notifications about your account activity.</p>
                            </div>
                            <Switch
                                checked={userProfile.email_notifications}
                                onCheckedChange={handleSwitchChange('email_notifications')}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Two-Factor Authentication</Label>
                                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                            </div>
                            <Switch
                                checked={userProfile.two_factor_enabled}
                                onCheckedChange={handleSwitchChange('two_factor_enabled')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving || !hasChanges}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}