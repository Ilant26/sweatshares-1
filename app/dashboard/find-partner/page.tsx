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
import { Loader2, Star, Eye, User, Tag, Briefcase, MapPin, XCircle, Heart, Share2, Mail, DollarSign, ListFilter, Handshake, Building2, Users, X } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { CountrySelector } from '@/components/ui/country-selector';
import { SkillsSelector, SKILLS_CATEGORIES } from '@/components/ui/skills-selector';
import { IndustrySelector } from '@/components/ui/industry-selector';

// Single skill selector component for filtering
const SingleSkillsSelector = ({ value, onChange, placeholder }: { 
  value: string; 
  onChange: (skill: string) => void; 
  placeholder: string; 
}) => {
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Flatten skills from all categories
  const allSkills = React.useMemo(() => {
    const skills: string[] = [];
    Object.values(SKILLS_CATEGORIES).forEach(categorySkills => {
      skills.push(...categorySkills);
    });
    return [...new Set(skills)].sort(); // Remove duplicates and sort
  }, []);

  const filteredSkills = search
    ? allSkills.filter(skill => skill.toLowerCase().includes(search.toLowerCase()))
    : allSkills;

  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setOpen(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredSkills.length > 0) {
      onChange(filteredSkills[0]);
      setOpen(false);
      setSearch("");
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          value={search !== '' || !value ? search : value}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          className="w-full text-sm pr-8"
          autoComplete="off"
        />
        {(search || value) && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
            onClick={() => {
              setSearch("");
              onChange("");
              inputRef.current?.focus();
            }}
            tabIndex={-1}
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredSkills.length === 0 ? (
            <div className="px-3 py-2 text-muted-foreground text-sm">No skills found.</div>
          ) : (
            filteredSkills.map(skill => (
              <div
                key={skill}
                className={cn(
                  "px-3 py-2 cursor-pointer hover:bg-accent text-sm",
                  value === skill && "bg-primary/10 text-primary font-semibold"
                )}
                onMouseDown={() => {
                  onChange(skill);
                  setOpen(false);
                  setSearch("");
                }}
              >
                {skill}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

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
    "find-funding": "Find Funding",
    "cofounder": "Co Founder",
    "expert-freelance": "Expert/ Freelance",
    "employee": "Employee",
    "mentor": "Mentor",
    "sell-startup": "Startup Sale",
    "investment-opportunity": "Investment Opportunity",
    "buy-startup": "Buy Startup",
    "co-investor": "Co-investor",
    "mission": "Mission",
    "job": "Job"
  };
  
  return typeMap[listingType] || listingType;
};

// Professional Role Categories
const PROFESSIONAL_CATEGORIES = {
  "Product & Design": [
    "Product Designer", "UX/UI Designer", "UX/UI Researcher", "Graphic Designer", "Social Media Manager", 
    "Brand Designer", "Content Manager", "Digital Designer", "Interaction Designer", "Web Designer"
  ],
  "Tech & Development": [
    "CEO (Operational Tech Role)", "CTO", "Backend Developer", "Frontend Developer", "Full-stack Developer",
    "Mobile Developer (iOS, Android)", "No-code Developer", "DevOps Engineer", "QA Tester", "Security Engineer",
    "Cloud Architect", "Blockchain Developer", "AI/ML Engineer", "Performance Engineer", "Database Administrator (DBA)",
    "Systems Architect"
  ],
  "Growth & Marketing": [
    "Growth Hacker", "Marketing Specialist", "Performance Marketing Manager", "Customer Acquisition Manager",
    "Growth Manager", "Digital Marketing Specialist", "Event Manager", "Email Marketing Specialist",
    "Influencer Relations Manager", "PR Specialist", "Community Manager", "Content Strategist",
    "SEO/SEM Specialist", "Affiliate Marketing Manager", "Product Marketing Manager", "Brand Marketing Manager",
    "Partnership Manager"
  ],
  "Operations": [
    "Customer Support", "Customer Success Manager", "Operations Manager", "Supply Chain Manager",
    "Procurement Manager", "Logistics Manager", "Business Operations Analyst", "Facilities Manager",
    "Data Entry Specialist", "Business Process Analyst"
  ],
  "Legal, Finance & Operations": [
    "Legal Counsel", "Business Lawyer", "Tax Lawyer", "IP Lawyer (Intellectual Property)", "Financial Analyst",
    "Accountant", "Bookkeeper", "Tax Consultant", "Fundraiser", "IP Agent (Intellectual Property Agent)",
    "Regulatory Affairs Specialist", "Compliance Officer", "Sustainability Manager", "Risk Manager",
    "Insurance Manager", "Corporate Treasurer", "Investment Analyst", "Investor Relations Manager"
  ],
  "Human Resources & Recruiting": [
    "HR Manager", "Recruiter", "Talent Acquisition Specialist", "HR Generalist", "Compensation and Benefits Manager",
    "Training and Development Manager", "Employee Engagement Manager", "HR Business Partner",
    "Learning and Development Specialist", "HR Coordinator"
  ],
  "Mentorship & Advisory": [
    "Mentor", "Advisor", "Venture Partner", "Portfolio Manager", "Investment Advisor", "Business Consultant",
    "Startup Mentor", "Growth Advisor"
  ],
  "Investment Roles": [
    "Business Angel", "Advisor (Investor + Advisor)", "Crowdfunding Contributor", "Venture Capitalists (VC)",
    "Family Office", "Private Equity Firms", "BPI (Business Public Investment)", "Government-backed Funds",
    "Incubators / Accelerators", "Impact Funds", "Sector-Specific Funds"
  ],
  "Leadership & General": [
    "Founder", "Startup Owner", "CEO", "COO", "CFO", "Product Manager", "Software Engineer", "Data Scientist",
    "Marketing Manager", "Sales Manager", "Business Development", "Investor", "Angel Investor",
    "Venture Capitalist", "Freelancer", "Consultant", "Expert", "Coach"
  ]
};

// Funding Stages from create-listing-modal.tsx
const FUNDING_STAGES = [
  "Pre-seed", "Seed", "Series A", "Series B", "Series C", "Series D", "Growth"
];

// Compensation Types from create-listing-modal.tsx
const COMPENSATION_TYPES = {
  "Standard": ["Cash", "Equity", "Salary", "Hybrid"],
  "Combined": ["Salary & Equity", "Cash & Equity"],
  "Special": ["Volunteer"]
} as const;

// Update LISTING_TYPES to be profile-type specific
const LISTING_TYPES_BY_PROFILE = {
  founder: [
    { value: "find-funding", label: "Find funding" },
    { value: "cofounder", label: "Find a co-founder" },
    { value: "expert-freelance", label: "Find an expert/freelancer" },
    { value: "employee", label: "Find an employee" },
    { value: "mentor", label: "Find a mentor" },
    { value: "sell-startup", label: "Sell my startup" }
  ],
  investor: [
    { value: "investment-opportunity", label: "Find an investment opportunity" },
    { value: "buy-startup", label: "Buy a startup" },
    { value: "co-investor", label: "Find a co-investor" },
    { value: "expert-freelance", label: "Find an expert/freelancer" }
  ],
  expert: [
    { value: "mission", label: "Find a mission" },
    { value: "job", label: "Find a job" },
    { value: "expert-freelance", label: "Find an expert/freelancer" },
    { value: "cofounder", label: "Find a co-founder" }
  ]
};

// Update LISTING_TYPES to match create-listing-modal.tsx exactly
const LISTING_TYPES = {
  founder: [
    { value: "find-funding", label: "Find funding" },
    { value: "cofounder", label: "Find a co-founder" },
    { value: "expert-freelance", label: "Find an expert/freelancer" },
    { value: "employee", label: "Find an employee" },
    { value: "mentor", label: "Find a mentor" },
    { value: "sell-startup", label: "Sell my startup" }
  ],
  investor: [
    { value: "investment-opportunity", label: "Find an investment opportunity" },
    { value: "buy-startup", label: "Buy a startup" },
    { value: "co-investor", label: "Find a co-investor" },
    { value: "expert-freelance", label: "Find an expert/freelancer" }
  ],
  expert: [
    { value: "mission", label: "Find a mission" },
    { value: "job", label: "Find a job" },
    { value: "expert-freelance", label: "Find an expert/freelancer" },
    { value: "cofounder", label: "Find a co-founder" }
  ]
} as const;

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
const LISTING_SECTORS = [
  "Fintech", "Healthtech", "Edtech", "SaaS", "Marketplace", "AI", "Blockchain", "GreenTech", "Consumer", "Other"
];

export default function FindPartnerPage() {
  const router = useRouter();
  const { user } = useUser();
  const { saveProfile, unsaveProfile, isProfileSaved, likeListing, unlikeListing, isListingLiked, loading: favoritesLoading } = useFavorites();

  // Helper functions to get proper labels based on listing type and profile type
  const getAmountLabel = (listingType: string, profileType: string): string => {
    if (profileType === "Founder" && listingType === "sell-startup") {
      return "Sale Price";
    }
    if (profileType === "Investor" && (listingType === "investment-opportunity" || listingType === "buy-startup")) {
      return "Investment Capacity";
    }
    if (profileType === "Investor" && listingType === "co-investor") {
      return "Missing Capital";
    }
    if (profileType === "Founder" && listingType === "find-funding") {
      return "Amount Seeking";
    }
    return "Amount";
  };

  const getCompensationValueLabel = (listingType: string, profileType: string): string => {
    if (profileType === "Founder" && listingType === "sell-startup") {
      return "Percentage for Sale";
    }
    if (profileType === "Investor" && listingType === "co-investor") {
      return "Equity Offered";
    }
    return "Compensation";
  };

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [professionalRole, setProfessionalRole] = useState("");
  const [profileType, setProfileType] = useState("");
  const [skill, setSkill] = useState("all");
  const [country, setCountry] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Skeleton loader for cards
  const skeletonCards = Array.from({ length: 8 });

  const [listings, setListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [listingError, setListingError] = useState<string | null>(null);
  const [listingType, setListingType] = useState<string>("all");

  // Add new state for skill search
  const [skillSearchTerm, setSkillSearchTerm] = useState("");
  const [viewType, setViewType] = useState<'profiles' | 'opportunities'>('profiles');

  // Memoized flat skill list
  const ALL_SKILLS: string[] = useMemo(() => {
    return Array.from(new Set(Object.values(SKILLS_CATEGORIES).flat()));
  }, []);

  const [listingSearch, setListingSearch] = useState("");
  const [listingCountry, setListingCountry] = useState("all");
  const [listingSector, setListingSector] = useState("all");
  const [listingFundingStage, setListingFundingStage] = useState("all");
  const [listingCompensationType, setListingCompensationType] = useState("all");

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
        .select("*, profiles(full_name, professional_role, avatar_url, country, profile_type)")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (listingType && listingType !== 'all') {
        query = query.eq('listing_type', listingType);
      }
      if (listingFundingStage && listingFundingStage !== 'all') {
        query = query.eq('funding_stage', listingFundingStage);
      }
      if (listingCompensationType && listingCompensationType !== 'all') {
        query = query.eq('compensation_type', listingCompensationType);
      }
      if (listingCountry && listingCountry !== 'all') {
        query = query.eq('location_country', listingCountry);
      }
      if (listingSector && listingSector !== 'all') {
        query = query.eq('sector', listingSector);
      }
      if (profileType && profileType !== 'all') {
        query = query.eq('profile_type', profileType);
      }
      const { data, error } = await query;
      if (error) setListingError(error.message);
      else setListings(data || []);
      setLoadingListings(false);
    };
    fetchListings();
  }, [listingType, listingFundingStage, listingCompensationType, listingCountry, listingSector, profileType]);

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
  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      // First, filter out profiles without meaningful information
      if (!hasProfileInformation(profile)) {
        return false;
      }
      
      // Search: must match at least one of the fields if search is set
      if (search && !(
        (profile.full_name && profile.full_name.toLowerCase().includes(search.toLowerCase())) ||
        (profile.bio && profile.bio.toLowerCase().includes(search.toLowerCase())) ||
        (profile.company && profile.company.toLowerCase().includes(search.toLowerCase()))
      )) {
        return false;
      }
      // Professional Role: must match if set and not 'all'
      if (professionalRole && professionalRole !== 'all' && profile.professional_role !== professionalRole) {
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
      // Country: must match if set and not 'all'
      if (country && country !== 'all' && profile.country !== country) {
        return false;
      }
      return true;
    });
  }, [profiles, search, professionalRole, profileType, skill, country]);

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
    if (viewType === 'profiles') {
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
    setProfessionalRole("all");
    setProfileType("all");
    setSkill("all");
    setCountry("all");
    setSkillSearchTerm("");
    setListingType("all");
    setListingCountry("all");
    setListingSector("all");
    setListingFundingStage("all");
    setListingCompensationType("all");
  };

  const handleProfileClick = (userId: string) => {
    router.push(`/dashboard/profile/${userId}?source=find-partner`);
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

  // Get filtered roles based on category
  const getRolesByCategory = (category: string) => {
    return PROFESSIONAL_CATEGORIES[category as keyof typeof PROFESSIONAL_CATEGORIES] || [];
  };

  // Get all roles flattened
  const getAllRoles = useMemo(() => {
    return Object.values(PROFESSIONAL_CATEGORIES).flat();
  }, []);

  // Get filtered listing types based on profile type
  const getFilteredListingTypes = (selectedProfileType: string) => {
    if (!selectedProfileType || selectedProfileType === 'all') {
      // If no profile type is selected, show all listing types
      return Object.values(LISTING_TYPES).flat();
    }
    return LISTING_TYPES[selectedProfileType.toLowerCase() as keyof typeof LISTING_TYPES] || [];
  };

  // --- UI ---
      return (
        <div className="flex flex-col flex-1 min-h-screen w-full bg-background">
            <div className="flex flex-col gap-2 px-4 md:px-8 pt-6 pb-2 w-full">
                {/* Header Section */}
                <div className="flex flex-col space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Find My Partner</h1>
                                <p className="text-sm text-muted-foreground">Browse and connect with talented professionals. Use filters to find your perfect match!</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toggle for Profile/Opportunities */}
                <div className="flex items-center justify-center mt-6">
                  <div className="flex items-center gap-2 bg-background p-1 rounded-lg border border-border shadow-sm">
                    <Button
                      variant={viewType === 'profiles' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewType('profiles')}
                      className="px-4 py-2"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profiles
                    </Button>
                    <Button
                      variant={viewType === 'opportunities' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewType('opportunities')}
                      className="px-4 py-2"
                    >
                      <Handshake className="h-4 w-4 mr-2" />
                      Opportunities
                    </Button>
                  </div>
                </div>

                {/* Filters Section */}
                <div className="flex flex-wrap gap-2 md:gap-3 w-full max-w-5xl mx-auto items-end bg-background p-6 rounded-xl shadow-lg border border-border mt-6">
                  {viewType === 'profiles' ? (
                    <>
                      {/* Profile Type Filter */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-muted-foreground">Profile Type</Label>
                        <Select value={profileType} onValueChange={setProfileType}>
                          <SelectTrigger className="w-36" aria-label="Filter by profile type">
                            <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Profile Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="Founder">Founder</SelectItem>
                            <SelectItem value="Investor">Investor</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Professional Role Filter */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-muted-foreground">Profession</Label>
                        <Select value={professionalRole} onValueChange={setProfessionalRole}>
                          <SelectTrigger className="w-36" aria-label="Filter by professional role">
                            <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            {getAllRoles.map((role) => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Skills Filter */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-muted-foreground">Skills</Label>
                        <div className="w-36">
                          <SingleSkillsSelector
                            value={skill === 'all' ? '' : skill}
                            onChange={(selectedSkill) => setSkill(selectedSkill || 'all')}
                            placeholder="Search skills"
                          />
                        </div>
                      </div>

                      {/* Country Filter */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-muted-foreground">Country</Label>
                        <div className="w-36">
                          <CountrySelector
                            value={country === 'all' ? '' : country}
                            onValueChange={(selectedCountry: string) => setCountry(selectedCountry || 'all')}
                            placeholder="Search country"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Profile Type Filter (for Listings) */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-muted-foreground">Posted By</Label>
                        <Select value={profileType} onValueChange={setProfileType}>
                          <SelectTrigger className="w-32" aria-label="Filter by profile type">
                            <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Profile Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="Founder">Founder</SelectItem>
                            <SelectItem value="Investor">Investor</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Opportunity Type Filter - Dynamic based on profile type */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-muted-foreground">Looking to</Label>
                        <Select 
                          value={listingType} 
                          onValueChange={setListingType}
                          disabled={loadingListings}
                        >
                          <SelectTrigger className="w-[180px]" aria-label="Filter by opportunity type">
                            <Handshake className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="What are you looking for?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {profileType && profileType !== 'all' ? (
                              // Show opportunity types for selected profile type
                              LISTING_TYPES[profileType.toLowerCase() as keyof typeof LISTING_TYPES]?.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))
                            ) : (
                              // Show all opportunity types grouped by profile type
                              Object.entries(LISTING_TYPES).map(([profile, types]) => (
                                <React.Fragment key={profile}>
                                  <SelectItem 
                                    value={`__${profile}__`} 
                                    disabled 
                                    className="font-semibold text-muted-foreground"
                                  >
                                    {profile.charAt(0).toUpperCase() + profile.slice(1)} Opportunities
                                  </SelectItem>
                                  {types.map((type) => (
                                    <SelectItem 
                                      key={type.value} 
                                      value={type.value}
                                      className="pl-6"
                                    >
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </React.Fragment>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Skills Filter */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-muted-foreground">Skills</Label>
                        <div className="w-36">
                          <SingleSkillsSelector
                            value={skill === 'all' ? '' : skill}
                            onChange={(selectedSkill: string) => setSkill(selectedSkill || 'all')}
                            placeholder="Search skills"
                          />
                        </div>
                      </div>

                      {/* Country Filter */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-muted-foreground">Country</Label>
                        <div className="w-36">
                          <CountrySelector
                            value={listingCountry === 'all' ? '' : listingCountry}
                            onValueChange={(selectedCountry: string) => setListingCountry(selectedCountry || 'all')}
                            placeholder="Search country"
                          />
                        </div>
                      </div>

                      {/* Industry Filter */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-muted-foreground">Industry</Label>
                        <div className="w-36">
                          <IndustrySelector
                            value={listingSector === 'all' ? '' : listingSector}
                            onChange={(selectedIndustry: string) => setListingSector(selectedIndustry || 'all')}
                            placeholder="Search industry"
                          />
                        </div>
                      </div>

                      {/* Funding Stage Filter */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-muted-foreground">Stage</Label>
                        <Select value={listingFundingStage} onValueChange={setListingFundingStage}>
                          <SelectTrigger className="w-36" aria-label="Filter by funding stage">
                            <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Stage" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Stages</SelectItem>
                            <SelectItem value="Pre-seed">Pre-seed</SelectItem>
                            <SelectItem value="Seed">Seed</SelectItem>
                            <SelectItem value="Series A">Series A</SelectItem>
                            <SelectItem value="Series B">Series B</SelectItem>
                            <SelectItem value="Series C">Series C</SelectItem>
                            <SelectItem value="Series D">Series D</SelectItem>
                            <SelectItem value="Growth">Growth</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Compensation Type Filter */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-muted-foreground">Compensation</Label>
                        <Select value={listingCompensationType} onValueChange={setListingCompensationType}>
                          <SelectTrigger className="w-36" aria-label="Filter by compensation type">
                            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Compensation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Equity">Equity</SelectItem>
                            <SelectItem value="Salary">Salary</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                            <SelectItem value="Salary & Equity">Salary & Equity</SelectItem>
                            <SelectItem value="Cash & Equity">Cash & Equity</SelectItem>
                            <SelectItem value="Volunteer">Volunteer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* Clear Filters Button */}
                  <Button variant="ghost" onClick={clearFilters} className="ml-2" aria-label="Clear filters">
                    <XCircle className="h-4 w-4 mr-1" /> Clear Filters
                  </Button>
                </div>
            </div>

            {/* Rest of the existing content (cards grid) */}
            <div className="flex-1 flex flex-col px-4 md:px-8 pb-8 pt-12">
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
                                {/* Profile Type Badge */}
                                {profile.profile_type && (
                                  <div className="flex justify-end mb-2">
                                    <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                                      {profile.profile_type === "Founder" && <Briefcase className="h-3.5 w-3.5" />}
                                      {profile.profile_type === "Investor" && <DollarSign className="h-3.5 w-3.5" />}
                                      {profile.profile_type === "Expert" && <Star className="h-3.5 w-3.5" />}
                                      <span>{profile.profile_type}</span>
                                    </div>
                                  </div>
                                )}
                                
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
                                      <h3 
                                      className="font-bold text-base text-gray-900 dark:text-white cursor-pointer hover:text-primary transition-colors mb-1"
                                        onClick={() => handleProfileClick(profile.id)}
                                      >
                                        {profile.full_name}
                                      </h3>
                                    
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
                                    
                                    {/* Location */}
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>{profile.country || "Location not specified"}</span>
                                      </div>
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
                    } else if (item.type === 'listing') {
                      const listing = item.data;
                      return (
                        <motion.div
                          key={listing.id}
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
                                {/* Listing Type Badge */}
                                <div className="flex justify-end mb-2">
                                  <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs px-2 py-1">
                                    {formatListingType(listing.listing_type)}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-start gap-4">
                                  {/* Avatar */}
                                  <Avatar className="h-12 w-12 border-4 border-white/80 dark:border-zinc-800/80 shadow-lg">
                                    <AvatarImage src={listing.profiles?.avatar_url || undefined} alt={listing.profiles?.full_name || 'User'} />
                                    <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary to-primary/80 text-white">
                                      {listing.profiles?.full_name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  
                                  {/* Listing Info */}
                                  <div className="flex-1 min-w-0">
                                      <h3 
                                      className="font-bold text-base text-gray-900 dark:text-white cursor-pointer hover:text-primary transition-colors mb-1"
                                        onClick={() => handleProfileClick(listing.profiles?.id)}
                                      >
                                        {listing.profiles?.full_name || 'Unknown User'}
                                      </h3>
                                    
                                    {listing.profiles?.professional_role && (
                                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {listing.profiles.professional_role}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Title and Description */}
                              <div className="px-4 pb-4">
                                <h4 className="font-bold text-base text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                  {listing.title}
                                </h4>
                                
                                <div 
                                  className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed mb-4"
                                  dangerouslySetInnerHTML={{ __html: listing.description || '' }}
                                />
                              </div>

                              {/* Details Section */}
                              <div className="px-4 pb-4 space-y-3">
                                {/* Skills */}
                                {listing.skills && (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Required Skills</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(Array.isArray(listing.skills) ? listing.skills : listing.skills.split(",").map((s: string) => s.trim())).map((skill: string) => (
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

                                {/* Compensation Information */}
                                {(listing.compensation_type || listing.compensation_value || listing.amount) && (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {listing.profiles?.profile_type === "Founder" && listing.listing_type === "sell-startup" ? "Sale Details" : 
                                       listing.profiles?.profile_type === "Investor" && (listing.listing_type === "investment-opportunity" || listing.listing_type === "buy-startup") ? "Investment Details" :
                                       listing.profiles?.profile_type === "Investor" && listing.listing_type === "co-investor" ? "Co-Investment Details" :
                                       "Compensation"}
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                      {listing.compensation_type && (
                                        <Badge 
                                          variant="secondary"
                                          className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                                   text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                                   hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                                   text-xs px-2 py-0.5 rounded-lg"
                                        >
                                          {listing.compensation_type}
                                        </Badge>
                                      )}
                                      {listing.compensation_value && (
                                        <>
                                          {typeof listing.compensation_value === 'object' ? (
                                            <>
                                              {listing.compensation_value.salary && (
                                        <Badge 
                                          variant="secondary"
                                          className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                                   text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                                   hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                                   text-xs px-2 py-0.5 rounded-lg"
                                        >
                                                  Salary: {listing.compensation_value.salary}
                                        </Badge>
                                              )}
                                              {listing.compensation_value.equity && (
                                                <Badge 
                                                  variant="secondary"
                                                  className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                                           text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                                           hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                                           text-xs px-2 py-0.5 rounded-lg"
                                                >
                                                  Equity: {listing.compensation_value.equity}
                                                </Badge>
                                              )}
                                              {listing.compensation_value.cash && (
                                                <Badge 
                                                  variant="secondary"
                                                  className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                                           text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                                           hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                                           text-xs px-2 py-0.5 rounded-lg"
                                                >
                                                  Cash: {listing.compensation_value.cash}
                                                </Badge>
                                              )}
                                              {listing.compensation_value.value && (
                                                <Badge 
                                                  variant="secondary"
                                                  className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                                           text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                                           hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                                           text-xs px-2 py-0.5 rounded-lg"
                                                >
                                                  {getCompensationValueLabel(listing.listing_type, listing.profiles?.profile_type || '')}: {listing.compensation_value.value}
                                                </Badge>
                                              )}
                                            </>
                                          ) : (
                                            <Badge 
                                              variant="secondary"
                                              className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                                       text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                                       hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                                       text-xs px-2 py-0.5 rounded-lg"
                                            >
                                              {getCompensationValueLabel(listing.listing_type, listing.profiles?.profile_type || '')}: {listing.compensation_value}
                                            </Badge>
                                          )}
                                        </>
                                      )}
                                      {listing.amount && (
                                        <Badge 
                                          variant="secondary"
                                          className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                                   text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                                   hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                                   text-xs px-2 py-0.5 rounded-lg"
                                        >
                                          {getAmountLabel(listing.listing_type, listing.profiles?.profile_type || '')}: {listing.amount}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Key Details Badges */}
                                <div className="flex flex-wrap gap-2">
                                  {listing.funding_stage && (
                                    <div className="flex items-center gap-1.5 bg-purple-500/10 text-purple-600 px-3 py-1.5 rounded-full text-xs font-medium">
                                      <Building2 className="h-3.5 w-3.5" />
                                      <span>Stage: {listing.funding_stage}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Location and Sector */}
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  <MapPin className="h-3 w-3" />
                                  <span>{listing.location_city ? `${listing.location_city}, ` : ""}{listing.location_country}</span>
                                  {listing.sector && (
                                    <>
                                      <span className="mx-1">•</span>
                                      <Badge variant="outline" className="text-xs border-gray-200 dark:border-gray-700">
                                        {listing.sector}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="mt-auto p-4 pt-3">
                                <div className="flex items-center gap-3">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl h-8"
                                    onClick={() => router.push(`/dashboard/listings/${listing.id}?source=find-partner`)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Listing
                                  </Button>
                                  
                                  <div className="flex gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20" 
                                      onClick={() => handleLikeListing(listing.id)}
                                    >
                                      <Star 
                                        className={`h-4 w-4 ${
                                          isListingLiked(listing.id) 
                                            ? "fill-yellow-400 text-yellow-500" 
                                            : "text-gray-400 hover:text-yellow-500"
                                        }`} 
                                        strokeWidth={isListingLiked(listing.id) ? 0 : 1.5} 
                                      />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                      onClick={() => handleMessage(listing.user_id)}
                                    >
                                      <Mail className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
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
