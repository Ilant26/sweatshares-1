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
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { CountrySelector } from '@/components/ui/country-selector';
import { SkillsSelector } from '@/components/ui/skills-selector';
import { ProfessionalRoleSelector } from '@/components/ui/professional-role-selector';

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
    profile_type: string | null;
    skills: string[];
    company: string | null;
    theme: 'light' | 'dark';
}

// Comprehensive skills list organized by categories
const SKILLS_CATEGORIES = {
    "Programming Languages": [
        "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Scala", "R", "MATLAB", "Dart", "Elixir", "Clojure", "Haskell", "Perl"
    ],
    "Frontend Development": [
        "React", "Vue.js", "Angular", "Svelte", "Next.js", "Nuxt.js", "HTML5", "CSS3", "Sass", "Less", "Tailwind CSS", "Bootstrap", "Material-UI", "Ant Design", "Webpack", "Vite", "Babel", "Redux", "Zustand", "GraphQL"
    ],
    "Backend Development": [
        "Node.js", "Express.js", "Django", "Flask", "Spring Boot", "ASP.NET", "Laravel", "FastAPI", "Gin", "Echo", "Rails", "Phoenix", "Koa", "Hapi", "Strapi", "NestJS", "AdonisJS", "Meteor", "Sails.js"
    ],
    "Database & Storage": [
        "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Oracle", "SQL Server", "Cassandra", "DynamoDB", "Firebase", "Supabase", "Elasticsearch", "InfluxDB", "Neo4j", "ArangoDB", "CouchDB", "RethinkDB"
    ],
    "DevOps & Cloud": [
        "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud", "Heroku", "DigitalOcean", "Vercel", "Netlify", "Terraform", "Ansible", "Jenkins", "GitLab CI", "GitHub Actions", "CircleCI", "Travis CI", "Prometheus", "Grafana", "ELK Stack"
    ],
    "Mobile Development": [
        "React Native", "Flutter", "Ionic", "Xamarin", "Native iOS", "Native Android", "Cordova", "PhoneGap", "Expo", "Kotlin Multiplatform", "SwiftUI", "Jetpack Compose"
    ],
    "Data Science & AI": [
        "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy", "Matplotlib", "Seaborn", "Jupyter", "Apache Spark", "Hadoop", "Data Analysis", "Statistical Modeling", "Natural Language Processing", "Computer Vision", "Reinforcement Learning", "Neural Networks", "Big Data", "Data Visualization"
    ],
    "Design & UX": [
        "UI/UX Design", "Figma", "Sketch", "Adobe XD", "InVision", "Framer", "Adobe Photoshop", "Adobe Illustrator", "Adobe InDesign", "Prototyping", "Wireframing", "User Research", "Usability Testing", "Design Systems", "Brand Identity", "Visual Design", "Interaction Design", "Information Architecture", "Accessibility Design"
    ],
    "Business & Management": [
        "Product Management", "Project Management", "Agile", "Scrum", "Kanban", "Lean", "Six Sigma", "Business Strategy", "Market Research", "Competitive Analysis", "Business Development", "Sales", "Marketing", "Customer Success", "Operations Management", "Financial Modeling", "Budgeting", "Risk Management", "Change Management", "Leadership"
    ],
    "Marketing & Growth": [
        "Digital Marketing", "SEO", "SEM", "Social Media Marketing", "Content Marketing", "Email Marketing", "Influencer Marketing", "Affiliate Marketing", "Growth Hacking", "Conversion Optimization", "Analytics", "Google Analytics", "Facebook Ads", "Google Ads", "Marketing Automation", "Brand Management", "Public Relations", "Event Marketing", "Video Marketing"
    ],
    "Finance & Investment": [
        "Financial Analysis", "Venture Capital", "Angel Investing", "Private Equity", "Investment Banking", "Financial Modeling", "Due Diligence", "Portfolio Management", "Risk Assessment", "Mergers & Acquisitions", "IPO", "Fundraising", "Pitch Decks", "Valuation", "Accounting", "Tax Planning", "Compliance", "Regulatory Affairs"
    ],
    "Industry Expertise": [
        "SaaS", "Fintech", "Healthtech", "Edtech", "E-commerce", "Marketplace", "B2B", "B2C", "Enterprise Software", "Consumer Apps", "Gaming", "Media & Entertainment", "Real Estate", "Transportation", "Logistics", "Manufacturing", "Retail", "Food & Beverage", "Fashion", "Sports", "Travel", "Energy", "Sustainability", "Blockchain", "Cryptocurrency", "NFTs", "Web3", "DeFi", "IoT", "Robotics", "Space Technology", "Biotechnology", "Pharmaceuticals", "Clean Energy", "Cybersecurity", "Data Privacy", "Compliance"
    ],
    "Soft Skills": [
        "Leadership", "Communication", "Team Building", "Problem Solving", "Critical Thinking", "Creativity", "Adaptability", "Time Management", "Negotiation", "Conflict Resolution", "Mentoring", "Coaching", "Public Speaking", "Presentation Skills", "Strategic Thinking", "Decision Making", "Innovation", "Collaboration", "Networking", "Cultural Intelligence"
    ],
    "Tools & Platforms": [
        "Git", "GitHub", "GitLab", "Bitbucket", "Slack", "Discord", "Microsoft Teams", "Zoom", "Notion", "Airtable", "Trello", "Asana", "Monday.com", "Jira", "Confluence", "Miro", "Loom", "Canva", "Zapier", "Make", "HubSpot", "Salesforce", "Stripe", "PayPal", "Shopify", "WooCommerce", "WordPress", "Webflow", "Squarespace", "Wix"
    ]
};

export default function ProfileSettingsPage() {
    const { user, loading: sessionLoading } = useSession();
    const supabase = createClientComponentClient<Database>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { setTheme } = useTheme();

    const [activeTab, setActiveTab] = useState('personal');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [skillsSearchTerm, setSkillsSearchTerm] = useState('');
    const [isSkillsDropdownOpen, setIsSkillsDropdownOpen] = useState(false);

    // Form persistence key
    const FORM_STORAGE_KEY = `profile-settings-${user?.id}`;

    // Save form data to localStorage
    const saveFormData = (profileData: UserProfile) => {
        if (typeof window !== 'undefined' && profileData) {
            try {
                const formData = {
                    ...profileData,
                    lastSaved: Date.now()
                };
                localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
            } catch (error) {
                console.warn('Failed to save form data to localStorage:', error);
            }
        }
    };

    // Load form data from localStorage
    const loadFormData = (): UserProfile | null => {
        if (typeof window !== 'undefined') {
            try {
                const savedData = localStorage.getItem(FORM_STORAGE_KEY);
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    // Check if data is not too old (24 hours)
                    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                    if (parsed.lastSaved && (Date.now() - parsed.lastSaved) < maxAge) {
                        delete parsed.lastSaved;
                        return parsed;
                    }
                }
            } catch (error) {
                console.warn('Failed to load form data from localStorage:', error);
            }
        }
        return null;
    };

    // Clear saved form data
    const clearSavedFormData = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(FORM_STORAGE_KEY);
        }
    };

    useEffect(() => {
        if (!sessionLoading && user) {
            fetchUserProfile();
        }
    }, [user, sessionLoading]);

    useEffect(() => {
        if (userProfile?.skills) {
            setSelectedSkills(userProfile.skills);
        }
    }, [userProfile?.skills]);

    // Auto-save form data when userProfile changes
    useEffect(() => {
        if (userProfile && hasChanges) {
            const saveTimeout = setTimeout(() => {
                saveFormData(userProfile);
            }, 1000); // Save after 1 second of inactivity

            return () => clearTimeout(saveTimeout);
        }
    }, [userProfile, hasChanges]);

    // Save form data before page unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (userProfile && hasChanges) {
                saveFormData(userProfile);
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && userProfile && hasChanges) {
                saveFormData(userProfile);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [userProfile, hasChanges]);

    // Handle clicking outside skills dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.skills-dropdown')) {
                setIsSkillsDropdownOpen(false);
            }
        };

        if (isSkillsDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSkillsDropdownOpen]);

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
                    onboarding_completed,
                    profile_type,
                    skills,
                    company,
                    theme
                `)
                .eq('id', user?.id)
                .single();

            if (profileError) throw profileError;

            const fetchedProfile = {
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
                profile_type: profile?.profile_type || null,
                skills: profile?.skills || [],
                company: profile?.company || null,
                theme: profile?.theme || 'light',
            };

            // Check for saved form data and merge with fetched profile
            const savedFormData = loadFormData();
            let finalProfile = fetchedProfile;
            let hasUnsavedChanges = false;

            if (savedFormData) {
                // Merge saved data with fetched profile, giving priority to saved data
                finalProfile = { ...fetchedProfile, ...savedFormData };
                hasUnsavedChanges = true;
                
                // Show a toast to inform user about restored data
                toast.info('Unsaved changes have been restored!', {
                    description: 'Your previous edits were automatically saved.',
                    duration: 5000
                });
            }

            setUserProfile(finalProfile);
            setPreviewUrl(finalProfile.avatar_url || '/placeholder-user.jpg');
            setHasChanges(hasUnsavedChanges);

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
                        profile_type: userProfile.profile_type,
                        skills: userProfile.skills,
                        company: userProfile.company,
                        theme: userProfile.theme,
                    },
                    { onConflict: 'id' }
                );

            if (profileUpdateError) throw profileUpdateError;

            toast.success('Profile updated successfully!');
            setSelectedFile(null);
            setHasChanges(false);
            clearSavedFormData(); // Clear any saved form data since we successfully saved
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

    const handleSkillToggle = (skill: string) => {
        setSelectedSkills(prev => {
            const newSkills = prev.includes(skill) 
                ? prev.filter(s => s !== skill)
                : [...prev, skill];
            setUserProfile(prevProfile => prevProfile ? { ...prevProfile, skills: newSkills } : null);
            setHasChanges(true);
            return newSkills;
        });
    };

    const handleSkillRemove = (skillToRemove: string) => {
        setSelectedSkills(prev => {
            const newSkills = prev.filter(skill => skill !== skillToRemove);
            setUserProfile(prevProfile => prevProfile ? { ...prevProfile, skills: newSkills } : null);
            setHasChanges(true);
            return newSkills;
        });
    };

    const getFilteredSkills = () => {
        const allSkills = Object.values(SKILLS_CATEGORIES).flat();
        if (!skillsSearchTerm) return allSkills;
        return allSkills.filter(skill => 
            skill.toLowerCase().includes(skillsSearchTerm.toLowerCase())
        );
    };

    if (sessionLoading || isLoading || !userProfile) {
        return (
            <div className="flex-1 space-y-8 p-8 pt-6 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 pt-6">
            <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left column: Profile Information */}
                    <Card className="w-full max-w-xl">
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
                                    <div className="grid gap-2">
                                        <Label htmlFor="profile_type">Profile Type</Label>
                                        <Select
                                            value={userProfile.profile_type || ''}
                                            onValueChange={handleSelectChange('profile_type')}
                                            required
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select your profile type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Founder">Founder</SelectItem>
                                                <SelectItem value="Investor">Investor</SelectItem>
                                                <SelectItem value="Expert">Expert</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <span className="text-xs text-muted-foreground">Choose the type that best describes your main activity on the platform.</span>
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
                                <Label htmlFor="professional_role">My Profession</Label>
                                <ProfessionalRoleSelector
                                    value={userProfile.professional_role || ''}
                                    onChange={handleSelectChange('professional_role')}
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="company">Company</Label>
                                <Input
                                    id="company"
                                    value={userProfile.company || ''}
                                    onChange={handleInputChange}
                                    placeholder="Enter your company or organization name"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Skills</Label>
                                <SkillsSelector
                                    value={selectedSkills}
                                    onChange={(skills) => {
                                        setSelectedSkills(skills);
                                        setUserProfile(prev => prev ? { ...prev, skills } : null);
                                        setHasChanges(true);
                                    }}
                                    disabled={isSaving}
                                />
                                        </div>
                            <div className="grid gap-2">
                                <Label htmlFor="country">Country</Label>
                                <CountrySelector
                                    value={userProfile.country || ''}
                                    onValueChange={handleSelectChange('country')}
                                    placeholder="Select your country"
                                    disabled={isSaving}
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

                            {/* 1. Remove Profile Type field from the form UI and logic */}
                            {/* 2. Make theme selection functional */}
                            {/* Theme Card - improved layout */}
                        </CardContent>
                    </Card>
                    {/* Right column: Contact Information + Theme */}
                    <div className="flex flex-col gap-8">
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
                        {/* Theme Card - improved layout */}
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Theme Preferences</CardTitle>
                                <CardDescription>Customize your dashboard appearance and choose your preferred theme.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Current Theme</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Your selected theme: <span className="font-medium capitalize">{userProfile.theme}</span>
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <Label>Choose Theme</Label>
                                        <div className="flex flex-col gap-4">
                                    {/* Theme Option: Light */}
                                    <button
                                        type="button"
                                                className={`group flex items-center gap-4 p-4 rounded-lg border-2 transition-all hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                                                    userProfile.theme === 'light' 
                                                        ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' 
                                                        : 'border-border hover:border-primary/50'
                                                }`}
                                                onClick={async () => {
                                                    try {
                                            setUserProfile(prev => prev ? { ...prev, theme: 'light' } : null);
                                            setTheme('light');
                                                        setHasChanges(true);
                                                        
                                                        const { error } = await supabase
                                                            .from('profiles')
                                                            .update({ theme: 'light' })
                                                            .eq('id', userProfile.id);
                                                        
                                                        if (error) throw error;
                                                        
                                                        toast.success('Theme updated to Light mode');
                                                    } catch (error) {
                                                        console.error('Error updating theme:', error);
                                                        toast.error('Failed to update theme');
                                                        // Revert on error
                                                        setUserProfile(prev => prev ? { ...prev, theme: 'dark' } : null);
                                                        setTheme('dark');
                                                    }
                                        }}
                                        aria-label="Select light theme"
                                    >
                                                <div className="w-20 h-14 rounded-md bg-gray-100 border border-gray-200 flex flex-col gap-1 p-2 shrink-0">
                                                    <div className="h-2 w-3/4 bg-gray-300 rounded" />
                                                    <div className="h-2 w-1/2 bg-gray-200 rounded" />
                                                    <div className="flex gap-1 mt-1">
                                                        <div className="h-2 w-2 bg-gray-400 rounded-full" />
                                                        <div className="h-2 w-1/3 bg-gray-200 rounded" />
                                            </div>
                                            </div>
                                                <div className="flex-1 text-left">
                                                    <div className="font-medium">Light Theme</div>
                                                    <div className="text-sm text-muted-foreground">Clean and bright interface with light backgrounds</div>
                                        </div>
                                                {userProfile.theme === 'light' && (
                                                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                                                        <div className="h-2 w-2 rounded-full bg-white"></div>
                                                    </div>
                                                )}
                                    </button>
                                            
                                    {/* Theme Option: Dark */}
                                    <button
                                        type="button"
                                                className={`group flex items-center gap-4 p-4 rounded-lg border-2 transition-all hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                                                    userProfile.theme === 'dark' 
                                                        ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' 
                                                        : 'border-border hover:border-primary/50'
                                                }`}
                                                onClick={async () => {
                                                    try {
                                            setUserProfile(prev => prev ? { ...prev, theme: 'dark' } : null);
                                            setTheme('dark');
                                                        setHasChanges(true);
                                                        
                                                        const { error } = await supabase
                                                            .from('profiles')
                                                            .update({ theme: 'dark' })
                                                            .eq('id', userProfile.id);
                                                        
                                                        if (error) throw error;
                                                        
                                                        toast.success('Theme updated to Dark mode');
                                                    } catch (error) {
                                                        console.error('Error updating theme:', error);
                                                        toast.error('Failed to update theme');
                                                        // Revert on error
                                                        setUserProfile(prev => prev ? { ...prev, theme: 'light' } : null);
                                                        setTheme('light');
                                                    }
                                        }}
                                        aria-label="Select dark theme"
                                    >
                                                <div className="w-20 h-14 rounded-md bg-[#151a23] border border-[#232b3b] flex flex-col gap-1 p-2 shrink-0">
                                                    <div className="h-2 w-3/4 bg-[#232b3b] rounded" />
                                                    <div className="h-2 w-1/2 bg-[#2a3441] rounded" />
                                                    <div className="flex gap-1 mt-1">
                                                        <div className="h-2 w-2 bg-[#3b4660] rounded-full" />
                                                        <div className="h-2 w-1/3 bg-[#232b3b] rounded" />
                                            </div>
                                            </div>
                                                <div className="flex-1 text-left">
                                                    <div className="font-medium">Dark Theme</div>
                                                    <div className="text-sm text-muted-foreground">Sleek and modern interface with dark backgrounds</div>
                                        </div>
                                                {userProfile.theme === 'dark' && (
                                                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                                                        <div className="h-2 w-2 rounded-full bg-white"></div>
                                                    </div>
                                                )}
                                    </button>
                                        </div>
                                    </div>
                                    
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <div className="flex items-center justify-between">
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