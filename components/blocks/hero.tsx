import React from 'react'
import Link from 'next/link'
import { ArrowRight, User, Tag, Briefcase, MapPin, XCircle, Eye, Star, Mail, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { Transition } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { motion, Variants } from 'framer-motion'
import { ThemeSwitcher } from "@/components/theme-switcher"
import Image from "next/image"
import { Menu } from '@/components/blocks/menu'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'
import { useFavorites } from '@/hooks/use-favorites'
import { format } from 'date-fns'
import { Glow } from '@/components/ui/glow'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: "spring",
                bounce: 0.3,
                duration: 1.5,
            } as Transition,
        },
    },
}

// Card animation variants
const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            bounce: 0.2,
            duration: 0.8,
            stiffness: 50
        }
    },
    hover: {
        y: -5,
        transition: {
            type: "spring",
            bounce: 0.2,
            duration: 0.3
        }
    }
};

// Filter options from find-partner page
const PROFILE_TYPES = [
  "Founder",
  "Investor",
  "Expert",
];
const ROLES = [
  "Founder", "Startup Owner", "CEO", "CTO", "COO", "CFO", "Product Manager", "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "DevOps Engineer", "Data Scientist", "UI/UX Designer", "Graphic Designer", "Marketing Manager", "Sales Manager", "Business Development", "Investor", "Angel Investor", "Venture Capitalist", "Freelancer", "Consultant", "Expert", "Advisor", "Mentor", "Coach", "Other"
];
const SKILLS = [
  "UI/UX Design", "Figma", "Sketch", "Adobe XD", "InVision", "Framer", "Adobe Photoshop", "Adobe Illustrator", "Adobe InDesign", "Prototyping", "Wireframing", "User Research", "Usability Testing", "Design Systems", "Brand Identity", "Visual Design", "Interaction Design", "Information Architecture", "Accessibility Design", "JavaScript", "TypeScript", "Python", "React", "Vue.js", "Angular", "Node.js", "Django", "Machine Learning", "Leadership", "Communication", "Team Building"
];

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  professional_role: string | null;
  company: string | null;
  created_at: string | null;
  skills: string[] | string | null;
  profile_type: string | null;
  country: string | null;
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function HeroSection({
    onSearchFilterChange,
}: { 
    onSearchFilterChange: (filters: { 
        role: string;
        profileType: string;
        skill: string;
    }) => void;
}) {
    const { user } = useUser();
    const {
        savedProfiles,
        saveProfile,
        unsaveProfile,
        isProfileSaved,
        loading: favoritesLoading,
    } = useFavorites();

    const [role, setRole] = React.useState("all");
    const [profileType, setProfileType] = React.useState("all");
    const [skill, setSkill] = React.useState("all");

    // Profile data state
    const [profiles, setProfiles] = React.useState<Profile[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);

    // Skeleton loader for cards
    const skeletonCards = Array.from({ length: 6 });

    React.useEffect(() => {
        onSearchFilterChange({ role, profileType, skill })
    }, [role, profileType, skill, onSearchFilterChange])

    // Fetch profiles
    React.useEffect(() => {
        const fetchProfiles = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("id, full_name, avatar_url, bio, professional_role, company, created_at, skills, profile_type, country")
                    .order("created_at", { ascending: false })
                    .limit(12); // Limit to 12 profiles for hero section
                if (error) throw error;
                setProfiles(data || []);
            } catch (err) {
                setError("Failed to load profiles.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfiles();
    }, []);

    // Helper function to check if a profile has meaningful information
    const hasProfileInformation = (profile: Profile): boolean => {
        const hasName = profile.full_name && profile.full_name.trim().length > 0;
        const hasBio = profile.bio && profile.bio.trim().length > 0;
        const hasRole = profile.professional_role && profile.professional_role.trim().length > 0;
        const hasCompany = profile.company && profile.company.trim().length > 0;
        const hasSkills = profile.skills && (
            Array.isArray(profile.skills) ? profile.skills.length > 0 : 
            typeof profile.skills === 'string' ? profile.skills.trim().length > 0 : false
        );
        const hasProfileType = profile.profile_type && profile.profile_type.trim().length > 0;
        
        // Profile must have at least 2 meaningful pieces of information
        const infoCount = [hasName, hasBio, hasRole, hasCompany, hasSkills, hasProfileType].filter(Boolean).length;
        return infoCount >= 2;
    };

    // Filtering logic
    const filteredProfiles = React.useMemo(() => {
        return profiles.filter((profile) => {
            // First, filter out profiles without meaningful information
            if (!hasProfileInformation(profile)) {
                return false;
            }
            
            // Role: must match if role is set and not 'all'
            if (role && role !== 'all' && profile.professional_role !== role) {
                return false;
            }
            // Profile type: must match if set and not 'all'
            if (profileType && profileType !== 'all' && profile.profile_type !== profileType) {
                return false;
            }
            // Skill: must match if set and not 'all'
            if (skill && skill !== 'all') {
                if (Array.isArray(profile.skills)) {
                    if (!profile.skills.includes(skill)) return false;
                } else if (typeof profile.skills === 'string') {
                    if (!profile.skills.split(',').map((s: string) => s.trim()).includes(skill)) return false;
                } else {
                    return false;
                }
            }
            return true;
        });
    }, [profiles, role, profileType, skill]);

    const clearFilters = () => {
        setRole("all");
        setProfileType("all");
        setSkill("all");
    };

    const handleProfileClick = (userId: string) => {
        window.location.href = `/dashboard/profile/${userId}?source=hero`;
    };

    const handleMessage = (userId: string) => {
        if (!user) return;
        window.location.href = `/dashboard/messages?userId=${userId}`;
    };

    return (
        <>
            <Menu />
            <main className="overflow-hidden relative z-10">
                <div
                    aria-hidden
                    className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block">
                    <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
                    <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
                    <div className="h-[80rem] -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
                </div>
                
                {/* Glow Background - Fixed */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <Glow 
                        variant="center" 
                        className={cn(
                            "opacity-30",
                            "scale-150",
                            "blur-3xl"
                        )} 
                    />
                </div>
                
                {/* Hero Section */}
                <section>
                    <div className="relative pt-12 md:pt-20">
                        <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]" />
                        <div className="mx-auto max-w-7xl px-6">
                            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                                <AnimatedGroup variants={transitionVariants}>
                                    <h1
                                        className="mt-0 max-w-4xl mx-auto text-balance text-4xl md:text-5xl lg:mt-8 xl:text-6xl">
                                        We connect founders, experts and investors to collaborate on innovative projects.
                                    </h1>
                                    <p
                                        className="mx-auto mt-8 max-w-2xl text-balance text-lg">
                                        Whether you're a founder, expert, or investor, you're in the right place. SweatShares is your go-to platform for finding opportunities. 
                                    </p>
                                </AnimatedGroup>

                                <AnimatedGroup
                                    variants={{
                                        container: {
                                            visible: {
                                                transition: {
                                                    staggerChildren: 0.05,
                                                    delayChildren: 0.75,
                                                },
                                            },
                                        },
                                        ...transitionVariants,
                                    }}
                                    className="mt-12 flex flex-col items-center justify-center gap-4">
                                    <div className="flex flex-wrap gap-2 md:gap-4 w-full max-w-4xl items-end bg-background p-6 rounded-xl shadow-lg border border-border">
                                        {/* Role Filter */}
                                        <Select value={role} onValueChange={setRole}>
                                            <SelectTrigger className="w-36" aria-label="Filter by role">
                                                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <SelectValue placeholder="Role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Roles</SelectItem>
                                                {ROLES.map((r) => (
                                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        
                                        {/* Profile Type Filter */}
                                        <Select value={profileType} onValueChange={setProfileType}>
                                            <SelectTrigger className="w-36" aria-label="Filter by profile type">
                                                <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <SelectValue placeholder="Profile Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                {PROFILE_TYPES.map((t) => (
                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        
                                        {/* Skill Filter */}
                                        <Select value={skill} onValueChange={setSkill}>
                                            <SelectTrigger className="w-36" aria-label="Filter by skill">
                                                <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <SelectValue placeholder="Skill" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                <SelectItem value="all">All Skills</SelectItem>
                                                {SKILLS.map((s) => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        
                                        {/* Clear Filters Button */}
                                        <Button variant="ghost" onClick={clearFilters} className="ml-2" aria-label="Clear filters">
                                            <XCircle className="h-4 w-4 mr-1" /> Clear Filters
                                        </Button>
                                    </div>
                                </AnimatedGroup>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Profile Cards Section */}
                <section className="mt-16 pb-8">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full">
                            {loading ? (
                                skeletonCards.map((_, i) => (
                                    <Card key={i} className="flex flex-col h-full p-4">
                                        <div className="flex items-center gap-4 mb-2">
                                            <Skeleton className="h-14 w-14 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-3 w-16" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-3 w-20 mb-2" />
                                        <Skeleton className="h-4 w-full mb-2" />
                                        <div className="flex gap-2 mt-auto">
                                            <Skeleton className="h-6 w-16 rounded" />
                                            <Skeleton className="h-6 w-16 rounded" />
                                        </div>
                                    </Card>
                                ))
                            ) : filteredProfiles.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center min-h-[40vh] text-muted-foreground">
                                    <span className="text-lg font-semibold">No profiles found.</span>
                                    <span className="text-sm mt-1">Try adjusting your filters or search terms.</span>
                                </div>
                            ) : (
                                filteredProfiles.slice(0, 8).map((profile, idx) => {
                                    const skillsArr = Array.isArray(profile.skills)
                                        ? profile.skills
                                        : typeof profile.skills === "string"
                                        ? profile.skills.split(",").map((s: string) => s.trim()).filter((s: string) => Boolean(s))
                                        : [];
                                    return (
                                        <motion.div
                                            key={profile.id}
                                            variants={cardVariants}
                                            initial="hidden"
                                            animate="visible"
                                            whileHover="hover"
                                            transition={{ delay: idx * 0.1 }}
                                            className="h-full"
                                        >
                                            <Card className="group relative h-full bg-gradient-to-br from-white to-gray-50/50 dark:from-zinc-900/80 dark:to-zinc-800/60 border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-3xl overflow-hidden backdrop-blur-sm">
                                                {/* Gradient overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                
                                                <CardContent className="relative p-0 flex flex-col h-full">
                                                    {/* Header Section */}
                                                    <div className="p-4 pb-3">
                                                        <div className="flex items-start gap-4">
                                                            {/* Avatar with status indicator */}
                                                            <div className="relative">
                                                                <Avatar className="h-12 w-12 border-4 border-white/80 dark:border-zinc-800/80 shadow-lg">
                                                                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || undefined} />
                                                                    <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary to-primary/80 text-white">
                                                                        {getInitials(profile.full_name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                {/* Online status indicator */}
                                                                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white dark:border-zinc-800 rounded-full" />
                                                            </div>
                                                            
                                                            {/* Profile Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                                    <h3 
                                                                        className="font-bold text-base text-gray-900 dark:text-white truncate cursor-pointer hover:text-primary transition-colors"
                                                                        onClick={() => handleProfileClick(profile.id)}
                                                                    >
                                                                        {profile.full_name}
                                                                    </h3>
                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                        {profile.profile_type && (
                                                                            <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                                                                                {profile.profile_type === "Founder" && <Briefcase className="h-3.5 w-3.5" />}
                                                                                {profile.profile_type === "Investor" && <DollarSign className="h-3.5 w-3.5" />}
                                                                                {profile.profile_type === "Expert" && <Star className="h-3.5 w-3.5" />}
                                                                                <span>{profile.profile_type}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                
                                                                {profile.professional_role && (
                                                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                        {profile.professional_role}
                                                                        {profile.company && (
                                                                            <>
                                                                                <span className="mx-1">•</span>
                                                                                <span className="text-gray-600">{profile.company}</span>
                                                                            </>
                                                                        )}
                                                                    </p>
                                                                )}
                                                                
                                                                {/* Date and Location */}
                                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                                    <div className="flex items-center gap-1">
                                                                        <MapPin className="h-3 w-3" />
                                                                        <span>{profile.country || "Location not specified"}</span>
                                                                    </div>
                                                                    <span className="mx-1">•</span>
                                                                    <span>{profile.created_at ? format(new Date(profile.created_at), "MMM dd, yyyy") : "Recently joined"}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Bio Section */}
                                                    {profile.bio && (
                                                        <div className="px-4 pb-4">
                                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">About</h4>
                                                            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                                                                {profile.bio}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Details Section */}
                                                    <div className="px-4 pb-4 space-y-3">
                                                        {/* Skills */}
                                                        {skillsArr.length > 0 && (
                                                            <div className="space-y-2">
                                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Skills & Expertise</h4>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {skillsArr.map((skill: string) => (
                                                                        <Badge 
                                                                            key={skill} 
                                                                            variant="secondary"
                                                                            className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 
                                                                                     text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-700/50 
                                                                                     hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors
                                                                                     text-xs px-2 py-0.5 rounded-lg"
                                                                        >
                                                                            {skill}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="mt-auto p-4 pt-3">
                                                        <div className="flex items-center gap-3">
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl h-8"
                                                                onClick={() => handleProfileClick(profile.id)}
                                                            >
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View Profile
                                                            </Button>
                                                            
                                                            <div className="flex gap-1">
                                                                {user && profile.id !== user.id && (
                                                                    <>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-8 w-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                                                                            onClick={() => {
                                                                                if (isProfileSaved(profile.id)) unsaveProfile(profile.id);
                                                                                else saveProfile(profile.id);
                                                                            }}
                                                                            disabled={favoritesLoading}
                                                                        >
                                                                            <Star
                                                                                className={`h-4 w-4 ${
                                                                                    isProfileSaved(profile.id)
                                                                                        ? "fill-yellow-400 text-yellow-500"
                                                                                        : "text-gray-400 hover:text-yellow-500"
                                                                                }`}
                                                                                strokeWidth={isProfileSaved(profile.id) ? 0 : 1.5}
                                                                            />
                                                                        </Button>
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="sm"
                                                                            className="h-8 w-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                                            onClick={() => handleMessage(profile.id)}
                                                                        >
                                                                            <Mail className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                        
                        {/* View More Button */}
                        {filteredProfiles.length > 8 && (
                            <div className="text-center mt-8">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="rounded-xl"
                                    onClick={() => window.location.href = '/dashboard/find-partner'}
                                >
                                    View More Profiles
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </>
    );
}