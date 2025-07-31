'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { BellRing, Search, Plus, User, PenLine, Trash2, SlidersHorizontal, CalendarIcon, Loader2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useSession } from '@/components/providers/session-provider';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import { toast } from 'sonner';

// Professional roles from profile settings
const PROFESSIONAL_ROLES = [
  // Experts & Operators - Product & Design
  "Product Designer", "UX/UI Designer", "UX/UI Researcher", "Graphic Designer", "Social Media Manager",
  "Brand Designer", "Content Manager", "Digital Designer", "Interaction Designer", "Web Designer",
  
  // Tech & Development
  "CEO (Operational Tech Role)", "CTO", "Backend Developer", "Frontend Developer", "Full-stack Developer",
  "Mobile Developer (iOS, Android)", "No-code Developer", "DevOps Engineer", "QA Tester", "Security Engineer",
  "Cloud Architect", "Blockchain Developer", "AI/ML Engineer", "Performance Engineer", "Database Administrator (DBA)",
  "Systems Architect",
  
  // Growth & Marketing
  "Growth Hacker", "Marketing Specialist", "Performance Marketing Manager", "Customer Acquisition Manager",
  "Growth Manager", "Digital Marketing Specialist", "Event Manager", "Email Marketing Specialist",
  "Influencer Relations Manager", "PR Specialist", "Community Manager", "Content Strategist",
  "SEO/SEM Specialist", "Affiliate Marketing Manager", "Product Marketing Manager", "Brand Marketing Manager",
  "Partnership Manager",
  
  // Operations
  "Customer Support", "Customer Success Manager", "Operations Manager", "Supply Chain Manager",
  "Procurement Manager", "Logistics Manager", "Business Operations Analyst", "Facilities Manager",
  "Data Entry Specialist", "Business Process Analyst",
  
  // Legal, Finance & Operations
  "Legal Counsel", "Business Lawyer", "Tax Lawyer", "IP Lawyer (Intellectual Property)", "Financial Analyst",
  "Accountant", "Bookkeeper", "Tax Consultant", "Fundraiser", "IP Agent (Intellectual Property Agent)",
  "Regulatory Affairs Specialist", "Compliance Officer", "Sustainability Manager", "Risk Manager",
  "Insurance Manager", "Corporate Treasurer", "Investment Analyst", "Investor Relations Manager",
  
  // Human Resources & Recruiting
  "HR Manager", "Recruiter", "Talent Acquisition Specialist", "HR Generalist", "Compensation and Benefits Manager",
  "Training and Development Manager", "Employee Engagement Manager", "HR Business Partner",
  "Learning and Development Specialist", "HR Coordinator",
  
  // Mentorship & Advisory
  "Mentor", "Advisor", "Venture Partner", "Portfolio Manager", "Investment Advisor", "Business Consultant",
  "Startup Mentor", "Growth Advisor",
  
  // Investors
  "Business Angel", "Advisor (Investor + Advisor)", "Crowdfunding Contributor", "Venture Capitalists (VC)",
  "Family Office", "Private Equity Firms", "BPI (Business Public Investment)", "Government-backed Funds",
  "Incubators / Accelerators", "Crowdfunding", "Impact Funds", "Sector-Specific Funds",
  
  // Legacy roles
  "Founder", "Startup Owner", "CEO", "COO", "CFO", "Product Manager", "Software Engineer", "Data Scientist",
  "UI/UX Designer", "Marketing Manager", "Sales Manager", "Business Development", "Investor", "Angel Investor",
  "Venture Capitalist", "Freelancer", "Consultant", "Expert", "Coach", "Other"
];

const SKILLS_CATEGORIES = {
  "Programming Languages": [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin"
  ],
  "Frontend Development": [
    "React", "Vue.js", "Angular", "Svelte", "Next.js", "HTML5", "CSS3", "Tailwind CSS", "Bootstrap"
  ],
  "Backend Development": [
    "Node.js", "Express.js", "Django", "Flask", "Spring Boot", "ASP.NET", "Laravel", "FastAPI"
  ],
  "Database & Storage": [
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Firebase", "Supabase"
  ],
  "DevOps & Cloud": [
    "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud", "Heroku", "Vercel", "Netlify"
  ],
  "Design & UX": [
    "UI/UX Design", "Figma", "Sketch", "Adobe XD", "Prototyping", "User Research", "Design Systems"
  ],
  "Business & Management": [
    "Product Management", "Project Management", "Agile", "Scrum", "Business Strategy", "Leadership"
  ],
  "Marketing & Growth": [
    "Digital Marketing", "SEO", "SEM", "Social Media Marketing", "Content Marketing", "Growth Hacking"
  ]
};

import { COUNTRIES } from '@/components/ui/country-selector';

const LISTING_TYPES_SIMPLIFIED = [
  // What people are looking for (simplified)
  { value: "find-funding", label: "💰 Looking for Funding", category: "Funding" },
  { value: "investment-opportunity", label: "💰 Investment Opportunities", category: "Funding" },
  
  { value: "cofounder", label: "🤝 Co-founder Opportunities", category: "Partnership" },
  { value: "co-investor", label: "🤝 Co-investor Opportunities", category: "Partnership" },
  
  { value: "expert-freelance", label: "💼 Expert/Freelance Work", category: "Work" },
  { value: "mission", label: "💼 Project/Mission Work", category: "Work" },
  { value: "job", label: "💼 Full-time Jobs", category: "Work" },
  { value: "employee", label: "💼 Hiring Employees", category: "Work" },
  
  { value: "mentor", label: "🎓 Mentorship", category: "Learning" },
  
  { value: "sell-startup", label: "🏢 Startup for Sale", category: "Business" },
  { value: "buy-startup", label: "🏢 Looking to Buy Startup", category: "Business" }
];

const SECTORS_SIMPLIFIED = [
  "Technology", "SaaS", "Fintech", "Healthtech", "Edtech", "E-commerce", 
  "AI/ML", "Blockchain", "Gaming", "Media", "Real Estate", "Transportation",
  "Food & Beverage", "Fashion", "Energy", "Sustainability", "Other"
];

// Listing types that require skills
const SKILL_REQUIRED_TYPES = [
  'expert-freelance', 'mission', 'job', 'employee', 'mentor'
];

interface Alert {
  id: string;
  name: string;
  alert_type: 'profile' | 'listing';
  criteria: any;
  frequency: 'instant' | 'daily' | 'weekly';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  alert_matches?: any[];
  alert_notifications?: any[];
}

export default function MyAlertsPage() {
  const { user } = useSession();
  const supabase = createClientComponentClient<Database>();
  
  const [activeTab, setActiveTab] = useState("active");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Create alert dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [alertName, setAlertName] = useState("");
  const [alertType, setAlertType] = useState<'profile' | 'listing'>('profile');
  const [frequency, setFrequency] = useState<'instant' | 'daily' | 'weekly'>('instant');
  
  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<Alert | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Profile criteria
  const [selectedProfessionalRoles, setSelectedProfessionalRoles] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  
  // Listing criteria
  const [selectedListingTypes, setSelectedListingTypes] = useState<string[]>([]);
  const [selectedProfileTypes, setSelectedProfileTypes] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/alerts');
      const data = await response.json();
      
      if (response.ok) {
        setAlerts(data.alerts || []);
      } else {
        toast.error(data.error || 'Failed to fetch alerts');
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to fetch alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const createAlert = async () => {
    if (!alertName.trim()) {
      toast.error('Please enter an alert name');
      return;
    }

    const criteria: any = {};
    
    if (alertType === 'profile') {
      if (selectedProfessionalRoles.length > 0) criteria.professional_roles = selectedProfessionalRoles;
      if (selectedSkills.length > 0) criteria.skills = selectedSkills;
      if (selectedCountries.length > 0) criteria.countries = selectedCountries;
    } else {
      if (selectedListingTypes.length > 0) criteria.listing_types = selectedListingTypes;
      if (selectedSkills.length > 0) criteria.skills = selectedSkills;
      if (selectedCountries.length > 0) criteria.countries = selectedCountries;
      if (selectedSectors.length > 0) criteria.sectors = selectedSectors;
    }

    if (Object.keys(criteria).length === 0) {
      toast.error('Please select at least one criteria');
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: alertName,
          alert_type: alertType,
          criteria,
          frequency
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Alert created successfully');
        resetCreateForm();
        setIsCreateDialogOpen(false);
        fetchAlerts();
      } else {
        toast.error(data.error || 'Failed to create alert');
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create alert');
    } finally {
      setIsCreating(false);
    }
  };

  const resetCreateForm = () => {
    setAlertName("");
    setAlertType('profile');
    setFrequency('instant');
    setSelectedProfessionalRoles([]);
    setSelectedSkills([]);
    setSelectedCountries([]);
    setSelectedListingTypes([]);
    setSelectedProfileTypes([]);
    setSelectedSectors([]);
  };

  const toggleAlertStatus = async (alertId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        toast.success(`Alert ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchAlerts();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update alert');
      }
    } catch (error) {
      console.error('Error updating alert:', error);
      toast.error('Failed to update alert');
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Alert deleted successfully');
        setIsDeleteDialogOpen(false);
        setAlertToDelete(null);
        fetchAlerts();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete alert');
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Failed to delete alert');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (alert: Alert) => {
    setAlertToDelete(alert);
    setIsDeleteDialogOpen(true);
  };

  const viewMatches = async (alertId: string) => {
    // Navigate to matches view - this could be a separate page or modal
    window.open(`/dashboard/my-alerts/${alertId}/matches`, '_blank');
  };

  const formatCriteria = (criteria: any, alertType: string) => {
    const badges = [];
    
    if (alertType === 'profile') {
      if (criteria.professional_roles) {
        badges.push(...criteria.professional_roles.slice(0, 2).map((role: string) => ({ label: role, color: 'bg-blue-100 text-blue-800' })));
      }
    } else {
      if (criteria.listing_types) {
        badges.push(...criteria.listing_types.slice(0, 2).map((type: string) => ({ label: type, color: 'bg-purple-100 text-purple-800' })));
      }
      if (criteria.profile_types) {
        badges.push(...criteria.profile_types.slice(0, 1).map((type: string) => ({ label: type, color: 'bg-green-100 text-green-800' })));
      }
    }
    
    if (criteria.skills) {
      badges.push(...criteria.skills.slice(0, 1).map((skill: string) => ({ label: skill, color: 'bg-yellow-100 text-yellow-800' })));
    }
    
    if (criteria.countries) {
      badges.push(...criteria.countries.slice(0, 1).map((country: string) => ({ label: country, color: 'bg-red-100 text-red-800' })));
    }

    // Calculate remaining count
    const totalCriteria = Object.values(criteria).flat().length;
    const shownCriteria = badges.length;
    const remaining = totalCriteria - shownCriteria;

    if (remaining > 0) {
      badges.push({ label: `+${remaining}`, color: 'bg-gray-100 text-gray-800' });
    }

    return badges;
  };

  const getUnreadMatchesCount = (alert: Alert) => {
    if (!alert.alert_matches) return 0;
    return alert.alert_matches.filter(match => !match.notified).length;
  };

  const getLastNotificationText = (alert: Alert) => {
    if (!alert.alert_notifications || alert.alert_notifications.length === 0) {
      return { text: 'No notifications yet', subtext: 'Waiting for matches' };
    }
    
    const lastNotification = alert.alert_notifications[0];
    const date = new Date(lastNotification.created_at);
    const unreadCount = getUnreadMatchesCount(alert);
    
    return {
      text: format(date, 'MMM dd, yyyy, h:mm a'),
      subtext: unreadCount > 0 ? `${unreadCount} new result${unreadCount > 1 ? 's' : ''}` : 'No new results'
    };
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && alert.is_active) ||
      (statusFilter === 'inactive' && !alert.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const activeAlerts = filteredAlerts.filter(alert => alert.is_active);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

      return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            {/* Header Section */}
            <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <BellRing className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Alerts</h1>
              <p className="text-sm text-muted-foreground">Get notified instantly when new profiles or listings match your criteria</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Delete Alert</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete "{alertToDelete?.name}"? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsDeleteDialogOpen(false);
                      setAlertToDelete(null);
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => alertToDelete && deleteAlert(alertToDelete.id)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Alert'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" /> New Alert
                                </Button>
                            </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Alert</DialogTitle>
                <DialogDescription>
                    Set up criteria to get notified when new profiles or listings match your requirements.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  {/* Alert Name */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="alertName" className="text-right">
                      Alert Name <span className="text-destructive">*</span>
                  </Label>
                    <Input 
                      id="alertName" 
                      placeholder="e.g., Senior Software Engineers in Paris" 
                      className="col-span-3"
                      value={alertName}
                      onChange={(e) => setAlertName(e.target.value)}
                    />
                </div>

                  {/* Alert Type */}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">
                      Alert Type <span className="text-destructive">*</span>
                  </Label>
                    <Select value={alertType} onValueChange={(value: 'profile' | 'listing') => setAlertType(value)}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="profile">Profile Alerts (Get notified of new profiles)</SelectItem>
                        <SelectItem value="listing">Listing Alerts (Get notified of new listings)</SelectItem>
                      </SelectContent>
                    </Select>
                </div>

                  {/* Frequency */}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Frequency</Label>
                    <Select value={frequency} onValueChange={(value: 'instant' | 'daily' | 'weekly') => setFrequency(value)}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="instant">Instant</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Profile Criteria */}
                  {alertType === 'profile' && (
                    <>
                      {/* Professional Roles */}
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Professional Roles</Label>
                        <div className="col-span-3 space-y-2">
                          {selectedProfessionalRoles.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {selectedProfessionalRoles.map((role) => (
                                <Badge key={role} variant="secondary" className="flex items-center gap-1">
                                  {role}
                                  <X 
                                    className="h-3 w-3 cursor-pointer" 
                                    onClick={() => setSelectedProfessionalRoles(prev => prev.filter(r => r !== role))}
                                  />
                                </Badge>
                              ))}
                            </div>
                          )}
                          <Select onValueChange={(value) => {
                            if (!selectedProfessionalRoles.includes(value)) {
                              setSelectedProfessionalRoles(prev => [...prev, value]);
                            }
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select professional roles..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {PROFESSIONAL_ROLES.map((role) => (
                                <SelectItem key={role} value={role} disabled={selectedProfessionalRoles.includes(role)}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Listing Criteria */}
                  {alertType === 'listing' && (
                    <>
                      {/* What are you looking for? */}
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Looking for <span className="text-destructive">*</span></Label>
                        <div className="col-span-3 space-y-3">
                          {selectedListingTypes.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {selectedListingTypes.map((type) => {
                                const typeInfo = LISTING_TYPES_SIMPLIFIED.find(t => t.value === type);
                                return (
                                  <Badge key={type} variant="secondary" className="flex items-center gap-1">
                                    {typeInfo?.label || type}
                                    <X 
                                      className="h-3 w-3 cursor-pointer" 
                                      onClick={() => {
                                        setSelectedListingTypes(prev => prev.filter(t => t !== type));
                                        // Clear skills if no skill-required types are selected
                                        const remainingTypes = selectedListingTypes.filter(t => t !== type);
                                        const hasSkillRequiredTypes = remainingTypes.some(t => SKILL_REQUIRED_TYPES.includes(t));
                                        if (!hasSkillRequiredTypes) {
                                          setSelectedSkills([]);
                                        }
                                      }}
                                    />
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                            {Object.entries(
                              LISTING_TYPES_SIMPLIFIED.reduce((acc, type) => {
                                if (!acc[type.category]) acc[type.category] = [];
                                acc[type.category].push(type);
                                return acc;
                              }, {} as Record<string, typeof LISTING_TYPES_SIMPLIFIED>)
                            ).map(([category, types]) => (
                              <div key={category} className="space-y-2">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  {category}
                                </div>
                                <div className="grid grid-cols-1 gap-1">
                                  {types.map((type) => (
                                    <label key={type.value} className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
                                      <Checkbox
                                        checked={selectedListingTypes.includes(type.value)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedListingTypes(prev => [...prev, type.value]);
                                          } else {
                                            setSelectedListingTypes(prev => prev.filter(t => t !== type.value));
                                            // Clear skills if no skill-required types are selected
                                            const remainingTypes = selectedListingTypes.filter(t => t !== type.value);
                                            const hasSkillRequiredTypes = remainingTypes.some(t => SKILL_REQUIRED_TYPES.includes(t));
                                            if (!hasSkillRequiredTypes) {
                                              setSelectedSkills([]);
                                            }
                                          }
                                        }}
                                      />
                                      <span className="text-sm">{type.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Industry/Sector */}
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Industry</Label>
                        <div className="col-span-3 space-y-2">
                          {selectedSectors.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {selectedSectors.map((sector) => (
                                <Badge key={sector} variant="secondary" className="flex items-center gap-1">
                                  {sector}
                                  <X 
                                    className="h-3 w-3 cursor-pointer" 
                                    onClick={() => setSelectedSectors(prev => prev.filter(s => s !== sector))}
                                  />
                                </Badge>
                              ))}
                            </div>
                          )}
                          <Select onValueChange={(value) => {
                            if (!selectedSectors.includes(value)) {
                              setSelectedSectors(prev => [...prev, value]);
                            }
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select industries you're interested in..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {SECTORS_SIMPLIFIED.map((sector) => (
                                <SelectItem key={sector} value={sector} disabled={selectedSectors.includes(sector)}>
                                  {sector}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Skills - conditional for both profile alerts and skill-required listing types */}
                  {(alertType === 'profile' || 
                    (alertType === 'listing' && selectedListingTypes.some(type => SKILL_REQUIRED_TYPES.includes(type)))
                  ) && (
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">
                        {alertType === 'profile' ? 'Skills' : 'Required Skills'}
                      </Label>
                      <div className="col-span-3 space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {alertType === 'profile' 
                            ? 'What skills should the profiles have?' 
                            : 'What skills should be mentioned in the work/job listings?'
                          }
                        </p>
                        {selectedSkills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedSkills.map((skill) => (
                              <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                                {skill}
                                <X 
                                  className="h-3 w-3 cursor-pointer" 
                                  onClick={() => setSelectedSkills(prev => prev.filter(s => s !== skill))}
                                />
                              </Badge>
                            ))}
                          </div>
                        )}
                        <Select onValueChange={(value) => {
                          if (!selectedSkills.includes(value) && selectedSkills.length < 5) {
                            setSelectedSkills(prev => [...prev, value]);
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder={`Select skills... (${selectedSkills.length}/5)`} />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {Object.entries(SKILLS_CATEGORIES).map(([category, skills]) => (
                              <div key={category}>
                                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                                  {category}
                                </div>
                                {skills.map((skill) => (
                                  <SelectItem key={skill} value={skill} disabled={selectedSkills.includes(skill)}>
                                    {skill}
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Location</Label>
                    <div className="col-span-3 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Where should the {alertType === 'profile' ? 'people' : 'opportunities'} be located?
                      </p>
                      {selectedCountries.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedCountries.map((country) => (
                            <Badge key={country} variant="secondary" className="flex items-center gap-1">
                              {country}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => setSelectedCountries(prev => prev.filter(c => c !== country))}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                      <Select onValueChange={(value) => {
                        if (!selectedCountries.includes(value)) {
                          setSelectedCountries(prev => [...prev, value]);
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select countries..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country} value={country} disabled={selectedCountries.includes(country)}>
                              {country}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                    </div>
                </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createAlert} disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Alert'
                    )}
                  </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>

      <Tabs defaultValue="active" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Alerts ({activeAlerts.length})</TabsTrigger>
          <TabsTrigger value="history">All Alerts ({alerts.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search alerts..." 
                className="pl-8 max-w-sm" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">ALERT NAME</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>CRITERIA</TableHead>
                  <TableHead className="w-[200px]">LAST NOTIFICATION</TableHead>
                  <TableHead className="text-right w-[150px]">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No active alerts found. Create your first alert to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  activeAlerts.map((alert) => {
                    const criteriaFormatted = formatCriteria(alert.criteria, alert.alert_type);
                    const lastNotification = getLastNotificationText(alert);
                    
                    return (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">
                      <div className='flex items-center gap-2'>
                        <BellRing className='h-4 w-4 text-muted-foreground' />
                        {alert.name}
                      </div>
                    </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {alert.alert_type === 'profile' ? 'Profile' : 'Listing'}
                          </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                            {criteriaFormatted.map((c, index) => (
                          <Badge key={index} className={c.color}>
                            {c.label}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                          {lastNotification.text} <br/>
                          <span className="text-muted-foreground text-sm">{lastNotification.subtext}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                            <Switch 
                              checked={alert.is_active} 
                              onCheckedChange={() => toggleAlertStatus(alert.id, alert.is_active)}
                            />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <User className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => viewMatches(alert.id)}>
                                  View Matches
                                </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleDeleteClick(alert)}
                            >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search alerts..." 
                className="pl-8 max-w-sm" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">ALERT NAME</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>CREATED</TableHead>
                  <TableHead className="text-right w-[150px]">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No alerts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {alert.alert_type === 'profile' ? 'Profile' : 'Listing'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={alert.is_active ? "default" : "secondary"}>
                          {alert.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(alert.created_at), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch 
                            checked={alert.is_active} 
                            onCheckedChange={() => toggleAlertStatus(alert.id, alert.is_active)}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleDeleteClick(alert)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}