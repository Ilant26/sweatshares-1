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
                    company
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
                profile_type: profile?.profile_type || null,
                skills: profile?.skills || [],
                company: profile?.company || null,
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
                        profile_type: userProfile.profile_type,
                        skills: userProfile.skills,
                        company: userProfile.company,
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
                            <Select
                                value={userProfile.professional_role || ''}
                                onValueChange={handleSelectChange('professional_role')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your professional role (e.g., Software Engineer, Founder)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Founder">Founder</SelectItem>
                                    <SelectItem value="Startup Owner">Startup Owner</SelectItem>
                                    <SelectItem value="CEO">CEO</SelectItem>
                                    <SelectItem value="CTO">CTO</SelectItem>
                                    <SelectItem value="COO">COO</SelectItem>
                                    <SelectItem value="CFO">CFO</SelectItem>
                                    <SelectItem value="Product Manager">Product Manager</SelectItem>
                                    <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                                    <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                                    <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                                    <SelectItem value="Full Stack Developer">Full Stack Developer</SelectItem>
                                    <SelectItem value="DevOps Engineer">DevOps Engineer</SelectItem>
                                    <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                                    <SelectItem value="UI/UX Designer">UI/UX Designer</SelectItem>
                                    <SelectItem value="Graphic Designer">Graphic Designer</SelectItem>
                                    <SelectItem value="Marketing Manager">Marketing Manager</SelectItem>
                                    <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                                    <SelectItem value="Business Development">Business Development</SelectItem>
                                    <SelectItem value="Investor">Investor</SelectItem>
                                    <SelectItem value="Angel Investor">Angel Investor</SelectItem>
                                    <SelectItem value="Venture Capitalist">Venture Capitalist</SelectItem>
                                    <SelectItem value="Freelancer">Freelancer</SelectItem>
                                    <SelectItem value="Consultant">Consultant</SelectItem>
                                    <SelectItem value="Expert">Expert</SelectItem>
                                    <SelectItem value="Advisor">Advisor</SelectItem>
                                    <SelectItem value="Mentor">Mentor</SelectItem>
                                    <SelectItem value="Coach">Coach</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
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
                            <div className="space-y-3">
                                {/* Selected Skills Display */}
                                {selectedSkills.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedSkills.map((skill) => (
                                            <Badge
                                                key={skill}
                                                variant="secondary"
                                                className="flex items-center gap-1 px-3 py-1"
                                            >
                                                {skill}
                                                <button
                                                    type="button"
                                                    onClick={() => handleSkillRemove(skill)}
                                                    className="ml-1 hover:text-destructive transition-colors"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Skills Selection */}
                                <div className="relative skills-dropdown">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder="Search and select skills..."
                                            value={skillsSearchTerm}
                                            onChange={(e) => setSkillsSearchTerm(e.target.value)}
                                            onFocus={() => setIsSkillsDropdownOpen(true)}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsSkillsDropdownOpen(!isSkillsDropdownOpen)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Skills Dropdown */}
                                    {isSkillsDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-96 overflow-y-auto">
                                            <div className="p-2">
                                                {Object.entries(SKILLS_CATEGORIES).map(([category, skills]) => (
                                                    <div key={category} className="mb-4">
                                                        <h4 className="font-medium text-sm text-muted-foreground mb-2 px-2">
                                                            {category}
                                                        </h4>
                                                        <div className="grid grid-cols-2 gap-1">
                                                            {skills
                                                                .filter(skill => 
                                                                    skill.toLowerCase().includes(skillsSearchTerm.toLowerCase())
                                                                )
                                                                .map((skill) => (
                                                                    <button
                                                                        key={skill}
                                                                        type="button"
                                                                        onClick={() => handleSkillToggle(skill)}
                                                                        className={`text-left px-2 py-1 rounded text-sm transition-colors ${
                                                                            selectedSkills.includes(skill)
                                                                                ? 'bg-primary text-primary-foreground'
                                                                                : 'hover:bg-muted'
                                                                        }`}
                                                                    >
                                                                        {skill}
                                                                    </button>
                                                                ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
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

                        <div className="space-y-4">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="profile_type">Profile Type</Label>
                                    <Select
                                        value={userProfile.profile_type || ''}
                                        onValueChange={handleSelectChange('profile_type')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your profile type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Founder">Founder</SelectItem>
                                            <SelectItem value="Investor">Investor</SelectItem>
                                            <SelectItem value="Expert">Expert/Freelancer/Consultant</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
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