"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/use-user";
import { useFavorites } from "@/hooks/use-favorites";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { Loader2, Star, Eye, User, Tag, Briefcase, MapPin, XCircle, Heart, Share2, Mail, DollarSign, ListFilter } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const getSkillColor = (skill: string) => {
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-purple-100 text-purple-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-orange-100 text-orange-800',
    'bg-indigo-100 text-indigo-800',
    'bg-teal-100 text-teal-800',
  ];
  const index = skill.length % colors.length;
  return colors[index];
};

// Function to format listing type values for display
const formatListingType = (listingType: string): string => {
  const typeMap: { [key: string]: string } = {
    // Founder listing types
    "find-funding": "Find Funding",
    "cofounder": "Co Founder",
    "expert-freelance": "Expert/ Freelance",
    "employee": "Employee",
    "mentor": "Mentor",
    "sell-startup": "Startup Sale",
    
    // Investor listing types
    "investment-opportunity": "Investment Opportunity",
    "buy-startup": "Buy Startup",
    "co-investor": "Co-investor",
    
    // Expert listing types
    "mission": "Mission",
    "job": "Job"
  };
  
  return typeMap[listingType] || listingType;
};

// --- Filter options ---
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

// --- Listing Card Animation Variants (from app/listing/page.tsx) ---
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
const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.8,
      stiffness: 50
    }
  }
};
const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.8,
      stiffness: 50
    }
  }
};
const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.8,
      stiffness: 50
    }
  }
};
const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.8,
      stiffness: 50
    }
  }
};

// --- Listing Section State ---
const LISTING_TYPES = [
  { value: "find-funding", label: "Funding offer" },
  { value: "cofounder", label: "Co-founder offer" },
  { value: "expert-freelance", label: "Consultancy and Freelance offers" },
  { value: "employee", label: "Job offer" },
  { value: "mentor", label: "Mentoring offer" },
  { value: "sell-startup", label: "Buy a startup" },
  { value: "investment-opportunity", label: "Find investment opportunity" },
  { value: "buy-startup", label: "Startup Acquisition" },
  { value: "co-investor", label: "Co-investor offers" },
  { value: "mission", label: "Find a mission" },
  { value: "job", label: "Available for work" },
];
const LISTING_SECTORS = [
  "Fintech", "Healthtech", "Edtech", "SaaS", "Marketplace", "AI", "Blockchain", "GreenTech", "Consumer", "Other"
];

export default function FindPartnerPage() {
  const router = useRouter();
  const { user } = useUser();
  const {
    savedProfiles,
    saveProfile,
    unsaveProfile,
    isProfileSaved,
    loading: favoritesLoading,
  } = useFavorites();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [profileType, setProfileType] = useState("");
  const [skill, setSkill] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Skeleton loader for cards
  const skeletonCards = Array.from({ length: 8 });

  const [listings, setListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [listingError, setListingError] = useState<string | null>(null);
  const [listingType, setListingType] = useState<string>("all");
  const { likeListing, unlikeListing, isListingLiked } = useFavorites();

  const [viewType, setViewType] = useState<'all' | 'profiles' | 'listings'>('all');
  const handleViewTypeChange = (value: string) => setViewType(value as 'all' | 'profiles' | 'listings');

  const [listingSearch, setListingSearch] = useState("");
  const [listingCountry, setListingCountry] = useState("all");
  const [listingSector, setListingSector] = useState("all");

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, bio, professional_role, company, created_at, skills, profile_type, country")
          .order("created_at", { ascending: false });
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

  useEffect(() => {
    const fetchListings = async () => {
      setLoadingListings(true);
      setListingError(null);
      let query = supabase
        .from("listings")
        .select("*, profiles(full_name, professional_role, avatar_url, country)")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (listingType && listingType !== 'all') {
        query = query.eq('listing_type', listingType);
      }
      const { data, error } = await query;
      if (error) setListingError(error.message);
      else setListings(data || []);
      setLoadingListings(false);
    };
    fetchListings();
  }, [listingType]);

  // Filtering logic
  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      // Search: must match at least one of the fields if search is set
      if (search && !(
        (profile.full_name && profile.full_name.toLowerCase().includes(search.toLowerCase())) ||
        (profile.bio && profile.bio.toLowerCase().includes(search.toLowerCase())) ||
        (profile.company && profile.company.toLowerCase().includes(search.toLowerCase()))
      )) {
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
  }, [profiles, search, role, profileType, skill]);

  // Filter listings client-side based on search, country, sector
  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesSearch =
        !listingSearch ||
        (listing.title && listing.title.toLowerCase().includes(listingSearch.toLowerCase())) ||
        (listing.description && listing.description.toLowerCase().includes(listingSearch.toLowerCase())) ||
        (listing.profiles?.full_name && listing.profiles.full_name.toLowerCase().includes(listingSearch.toLowerCase())) ||
        (listing.profiles?.company && listing.profiles.company.toLowerCase().includes(listingSearch.toLowerCase()));
      const matchesCountry = listingCountry === "all" || (listing.location_country && listing.location_country === listingCountry);
      const matchesSector = listingSector === "all" || (listing.sector && listing.sector === listingSector);
      return matchesSearch && matchesCountry && matchesSector;
    });
  }, [listings, listingSearch, listingCountry, listingSector]);

  // Merge and sort
  const mergedItems = useMemo(() => {
    const profileItems = filteredProfiles.map((profile) => ({
      type: 'profile',
      created_at: profile.created_at || '',
      data: profile,
    }));
    const listingItems = filteredListings.map((listing) => ({
      type: 'listing',
      created_at: listing.created_at || '',
      data: listing,
    }));
    let items: any[] = [];
    if (viewType === 'all') {
      items = [...profileItems, ...listingItems];
    } else if (viewType === 'profiles') {
      items = profileItems;
    } else {
      items = listingItems;
    }
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [filteredProfiles, filteredListings, viewType]);

  // Clear filters
  const clearFilters = () => {
    setSearch("");
    setRole("all");
    setProfileType("all");
    setSkill("all");
  };

  const handleProfileClick = (userId: string) => {
    router.push(`/dashboard/profile/${userId}`);
  };
  const handleLikeListing = async (listingId: string) => {
    if (!user) return;
    if (isListingLiked(listingId)) await unlikeListing(listingId);
    else await likeListing(listingId);
  };
  const handleMessage = (userId: string) => {
    if (!user) return;
    router.push(`/dashboard/messages?userId=${userId}`);
  };

  // --- UI ---
  return (
    <div className="flex flex-col flex-1 min-h-screen w-full bg-background">
      <div className="flex flex-col gap-2 px-4 md:px-8 pt-6 pb-2 w-full">
        <div className="flex-1 flex flex-col gap-2 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Find My Partner</h1>
          <p className="text-muted-foreground text-sm">Browse and connect with talented professionals. Use filters to find your perfect match!</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-4 w-full items-end mb-6">
          {/* Profile Filters */}
          <Input
            placeholder="Search by name, company, bio, or listing title..."
            className="w-full md:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search profiles and listings"
          />
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
          {/* Listing Filters */}
          <Select value={listingType} onValueChange={setListingType}>
            <SelectTrigger className="w-36" aria-label="Filter by listing type">
              <ListFilter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Listing Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {LISTING_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{formatListingType(t.value)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={listingCountry} onValueChange={setListingCountry}>
            <SelectTrigger className="w-36" aria-label="Filter by country">
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {[...new Set(listings.map(l => l.location_country).filter(Boolean))].map((country: string) => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={listingSector} onValueChange={setListingSector}>
            <SelectTrigger className="w-36" aria-label="Filter by sector">
              <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              {LISTING_SECTORS.map((sector) => (
                <SelectItem key={sector} value={sector}>{sector}</SelectItem>
              ))}
              {[...new Set(listings.map(l => l.sector).filter(Boolean))].filter(s => !LISTING_SECTORS.includes(s)).map((sector: string) => (
                <SelectItem key={sector} value={sector}>{sector}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={clearFilters} className="ml-2" aria-label="Clear filters">
            <XCircle className="h-4 w-4 mr-1" /> Clear Filters
          </Button>
        </div>
      </div>
      <div className="flex-1 flex flex-col px-4 md:px-8 pb-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full flex-1">
          {loading || loadingListings ? (
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
          ) : (mergedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-muted-foreground">
              <img src="/images/empty-state.svg" alt="No results" className="w-32 h-32 mb-4 opacity-80" />
              <span className="text-lg font-semibold">No results found.</span>
              <span className="text-sm mt-1">Try adjusting your filters or search terms.</span>
            </div>
          ) : (
            mergedItems.map((item, idx) => {
              if (item.type === 'profile') {
                const profile = item.data;
                const skillsArr = Array.isArray(profile.skills)
                  ? profile.skills
                  : typeof profile.skills === "string"
                  ? profile.skills.split(",").map((s: string) => s.trim()).filter((s: string) => Boolean(s))
                  : [];
                const displaySkills = skillsArr.slice(0, 4);
                const moreSkills = skillsArr.length > 4 ? skillsArr.length - 4 : 0;
                return (
                  <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    custom={idx}
                    className="h-full"
                  >
                    <Card
                      key={profile.id}
                      className={cn(
                        "group flex flex-col justify-between h-full bg-white dark:bg-zinc-900/60 border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-primary/40 rounded-2xl overflow-hidden"
                      )}
                      tabIndex={0}
                      aria-label={`Profile card for ${profile.full_name}`}
                    >
                      <CardContent className="p-0 flex flex-col h-full">
                        {/* Header with Avatar, Name, Role, Company, Profile Type, Location */}
                        <div className="p-4 pb-2 flex items-center gap-3 border-b border-border/30 relative">
                          <Avatar className="h-12 w-12 border-2 border-primary/30">
                            <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || undefined} />
                            <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-base truncate cursor-pointer hover:text-primary transition-colors" onClick={() => handleProfileClick(profile.id)}>
                                {profile.full_name}
                              </div>
                              {profile.profile_type && (
                                <Badge variant="secondary" className="ml-1 text-xs px-2 py-0.5 capitalize">
                                  {profile.profile_type}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              {profile.professional_role && <span className="truncate">{profile.professional_role}</span>}
                              {profile.company && <span className="truncate">• {profile.company}</span>}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <MapPin className="h-3 w-3" />
                              <span>{profile.country || "-"}</span>
                              <span className="ml-auto">{profile.created_at ? format(new Date(profile.created_at), "dd MMM yyyy") : "-"}</span>
                            </div>
                          </div>
                        </div>
                        {/* Bio, Skills */}
                        <div className="flex-1 flex flex-col px-4 pt-3 pb-1">
                          {profile.bio && profile.bio.length > 120 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="line-clamp-3 text-sm mb-2 cursor-help" tabIndex={0} aria-label="Profile bio">
                                  {profile.bio}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <span className="max-w-xs block whitespace-pre-line">{profile.bio}</span>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <div className="line-clamp-3 text-sm mb-2" tabIndex={0} aria-label="Profile bio">
                              {profile.bio}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 mt-auto">
                            {displaySkills.map((skill: string) => (
                              <Badge key={skill} className={getSkillColor(skill)}>{skill}</Badge>
                            ))}
                            {moreSkills > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="cursor-pointer">+{moreSkills} more</Badge>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <span>{skillsArr.slice(4).join(", ")}</span>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                        {/* Divider */}
                        <div className="border-t border-border/30" />
                        {/* Actions */}
                        <div className="p-4 flex items-center gap-2">
                          <Button
                            variant="default"
                            className="flex-1 font-semibold"
                            onClick={() => handleProfileClick(profile.id)}
                            aria-label={`See profile of ${profile.full_name}`}
                          >
                            <Eye className="h-4 w-4 mr-1" /> See Profile
                          </Button>
                          {user && profile.id !== user.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "transition-colors rounded-full",
                                isProfileSaved(profile.id)
                                  ? "hover:bg-yellow-50"
                                  : "hover:bg-accent"
                              )}
                              onClick={() => {
                                if (isProfileSaved(profile.id)) unsaveProfile(profile.id);
                                else saveProfile(profile.id);
                              }}
                              disabled={favoritesLoading}
                              aria-label={isProfileSaved(profile.id) ? `Remove ${profile.full_name} from favorites` : `Add ${profile.full_name} to favorites`}
                            >
                              <Star
                                className={cn(
                                  "h-5 w-5",
                                  isProfileSaved(profile.id)
                                    ? "fill-yellow-400 text-yellow-500"
                                    : "text-muted-foreground"
                                )}
                                strokeWidth={isProfileSaved(profile.id) ? 0 : 1.5}
                              />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              } else if (item.type === 'listing') {
                const listing = item.data;
                return (
                  <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    custom={idx}
                    className="h-full"
                  >
                    <Card className="group flex flex-col justify-between h-full bg-white dark:bg-zinc-900/60 border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-primary/40 rounded-2xl overflow-hidden">
                      <CardContent className="p-0 flex flex-col h-full">
                        <motion.div 
                          variants={fadeIn}
                          className="flex flex-col h-full"
                        >
                          {/* Header with Badge and Avatar */}
                          <motion.div variants={slideInLeft} className="p-4 pb-2 flex items-center gap-3 border-b border-border/30">
                            <Avatar className="h-12 w-12 border-2 border-primary/30">
                              <AvatarImage src={listing.profiles?.avatar_url || undefined} alt={listing.profiles?.full_name || 'User'} />
                              <AvatarFallback>{listing.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div 
                                className="font-semibold text-base truncate cursor-pointer hover:text-primary transition-colors"
                                onClick={() => handleProfileClick(listing.profiles?.id)}
                              >
                                {listing.profiles?.full_name || 'Unknown'}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{listing.profiles?.professional_role}</div>
                            </div>
                            <Badge variant="secondary" className="text-xs px-2 py-1 whitespace-nowrap">{formatListingType(listing.listing_type)}</Badge>
                          </motion.div>
                          {/* Title and Publication Date */}
                          <motion.div variants={slideInRight} className="px-4 pt-3 pb-1">
                            <h2 className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors mb-1">{listing.title}</h2>
                            <span className="text-xs text-muted-foreground">{listing.created_at ? new Date(listing.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</span>
                          </motion.div>
                          {/* Description Preview */}
                          <motion.div 
                            variants={fadeIn}
                            className="px-4 text-sm text-muted-foreground line-clamp-3 mb-2 prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:text-muted-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-md prose-img:shadow-md"
                            dangerouslySetInnerHTML={{ __html: listing.description || '' }}
                          />
                          {/* Funding Stage and Compensation */}
                          <motion.div variants={slideInRight} className="px-4 mb-2">
                            <div className="flex flex-wrap gap-2">
                              {listing.funding_stage && (
                                <div className="flex items-center gap-1.5 bg-primary/5 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
                                  <Briefcase className="h-3.5 w-3.5" />
                                  <span>{listing.funding_stage}</span>
                                </div>
                              )}
                              {listing.compensation_type && (
                                <div className="flex items-center gap-1.5 bg-primary/5 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
                                  <DollarSign className="h-3.5 w-3.5" />
                                  <span>{listing.compensation_type}</span>
                                  {listing.compensation_value && (
                                    <span className="text-primary/80">
                                      {typeof listing.compensation_value === 'object' 
                                        ? Object.entries(listing.compensation_value)
                                            .map(([key, value]) => `${value}`)
                                            .join(' + ')
                                        : listing.compensation_value}
                                    </span>
                                  )}
                                </div>
                              )}
                              {listing.amount && (
                                <div className="flex items-center gap-1.5 bg-primary/5 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
                                  <DollarSign className="h-3.5 w-3.5" />
                                  <span>Amount: {listing.amount}</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                          {/* Location and Sector */}
                          <motion.div variants={slideInRight} className="px-4 flex items-center gap-3 text-muted-foreground text-xs mb-2">
                            <MapPin className="h-4 w-4" />
                            <span>{listing.location_city ? `${listing.location_city}, ` : ""}{listing.location_country}</span>
                            {listing.sector && <><span className="mx-2">•</span><Badge variant="outline" className="text-xs">{listing.sector}</Badge></>}
                          </motion.div>
                          {/* Action Buttons */}
                          <motion.div variants={scaleIn} className="mt-auto border-t border-border/30">
                            <div className="p-4 flex items-center gap-2">
                              <Button
                                variant="default"
                                className="flex-1 font-semibold"
                                onClick={() => router.push(`/listing/${listing.id}`)}
                              >
                                View Details
                              </Button>
                              <div className="flex gap-1">
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8" 
                                    aria-label="Favorite"
                                    onClick={() => handleLikeListing(listing.id)}
                                  >
                                    <Star className={`h-4 w-4 ${isListingLiked(listing.id) ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground'}`} strokeWidth={isListingLiked(listing.id) ? 0 : 1.5} />
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Share">
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8" 
                                    aria-label="Contact"
                                    onClick={() => handleMessage(listing.user_id)}
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              }
              return null;
            })
          ))}
        </div>
      </div>
    </div>
  );
}
