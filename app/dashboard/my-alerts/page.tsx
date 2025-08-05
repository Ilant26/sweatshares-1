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



import { CountrySelector } from '@/components/ui/country-selector';
import { SkillsSelector } from '@/components/ui/skills-selector';
import { ProfessionalRoleSelector } from '@/components/ui/professional-role-selector';
import { IndustrySelector } from '@/components/ui/industry-selector';

// Profile types from create-listing-modal
const PROFILE_TYPES = [
  { value: "founder", label: "Founder" },
  { value: "investor", label: "Investor" },
  { value: "expert", label: "Expert" }
];

// Listing types based on profile type (from create-listing-modal)
const getListingTypesForProfile = (profileType: string) => {
  switch (profileType) {
    case "founder":
      return [
        { value: "find-funding", label: "💰 Find funding", category: "Funding" },
        { value: "cofounder", label: "🤝 Find a co-founder", category: "Partnership" },
        { value: "expert-freelance", label: "💼 Find an expert/freelancer", category: "Work" },
        { value: "employee", label: "💼 Find an employee", category: "Work" },
        { value: "mentor", label: "🎓 Find a mentor", category: "Learning" },
        { value: "sell-startup", label: "🏢 Sell a startup", category: "Business" }
      ];
    case "investor":
      return [
        { value: "investment-opportunity", label: "💰 Find an investment opportunity", category: "Funding" },
        { value: "buy-startup", label: "🏢 Buy a startup", category: "Business" },
        { value: "co-investor", label: "🤝 Find a co-investor", category: "Partnership" },
        { value: "expert-freelance", label: "💼 Find an expert/freelancer", category: "Work" }
      ];
    case "expert":
      return [
        { value: "mission", label: "💼 Find a mission", category: "Work" },
        { value: "job", label: "💼 Find a job", category: "Work" },
        { value: "expert-freelance", label: "💼 Find an expert/freelancer", category: "Work" },
        { value: "cofounder", label: "🤝 Find a co-founder", category: "Partnership" }
      ];
    default:
      return [];
  }
};

// All listing types for filtering (when no profile type selected)
const ALL_LISTING_TYPES = [
  ...getListingTypesForProfile("founder"),
  ...getListingTypesForProfile("investor"),
  ...getListingTypesForProfile("expert")
].filter((type, index, self) => 
  index === self.findIndex(t => t.value === type.value)
);

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
  
  // Single values for cleaner UX
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');
  
  // Additional conditional fields from create-listing-modal
  const [fundingStage, setFundingStage] = useState<string>('');
  const [compensationType, setCompensationType] = useState<string>('');
  const [compensationValue, setCompensationValue] = useState<any>({});
  const [amount, setAmount] = useState<string>('');
  const [locationCity, setLocationCity] = useState<string>('');

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
      if (selectedCountry) criteria.countries = [selectedCountry];
    } else {
       if (selectedListingTypes.length === 0) {
         toast.error('Please select what type of opportunity you\'re looking for');
         return;
       }
      if (selectedListingTypes.length > 0) criteria.listing_types = selectedListingTypes;
       if (selectedProfileTypes.length > 0) criteria.profile_types = selectedProfileTypes;
      if (selectedSkills.length > 0) criteria.skills = selectedSkills;
       if (selectedCountry) criteria.countries = [selectedCountry];
       if (selectedSector) criteria.sectors = [selectedSector];
       if (fundingStage) criteria.funding_stage = fundingStage;
       if (compensationType) criteria.compensation_type = compensationType;
       if (Object.keys(compensationValue).length > 0) criteria.compensation_value = compensationValue;
       if (amount) criteria.amount = amount;
       if (locationCity) criteria.location_city = locationCity;
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
    setSelectedCountry('');
    setSelectedSector('');
    setFundingStage('');
    setCompensationType('');
    setCompensationValue({});
    setAmount('');
    setLocationCity('');
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
                      I want to be notified about <span className="text-destructive">*</span>
                  </Label>
                    <Select value={alertType} onValueChange={(value: 'profile' | 'listing') => setAlertType(value)}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="What do you want to be alerted about?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="profile">New People (profiles joining the platform)</SelectItem>
                        <SelectItem value="listing">New Opportunities (people posting what they need)</SelectItem>
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
                          <div className="relative">
                            <ProfessionalRoleSelector
                              value=""
                              onChange={(role) => {
                                if (role && !selectedProfessionalRoles.includes(role)) {
                                  setSelectedProfessionalRoles(prev => [...prev, role]);
                                }
                              }}
                              placeholder="Search and select professional roles..."
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Listing Criteria */}
                  {alertType === 'listing' && (
                    <>
                      {/* What I'm looking for */}
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">When user is looking to <span className="text-destructive">*</span></Label>
                        <div className="col-span-3 space-y-3">
                                                    <p className="text-xs text-muted-foreground">
                            Select one type of opportunity you want to be notified about
                          </p>
                          
                          <Select value={selectedListingTypes[0] || ""} onValueChange={(value) => {
                            if (value) {
                              // Clear previous selection and set new one (single selection)
                              setSelectedListingTypes([value]);
                              
                              // Clear previous conditional fields
                              setFundingStage('');
                              setCompensationType('');
                              setCompensationValue({});
                              setAmount('');
                              
                              // Auto-select appropriate profile types based on listing type
                              const profileTypesForListing: string[] = [];
                              if (getListingTypesForProfile("founder").some(t => t.value === value)) {
                                profileTypesForListing.push("founder");
                              }
                              if (getListingTypesForProfile("investor").some(t => t.value === value)) {
                                profileTypesForListing.push("investor");
                              }
                              if (getListingTypesForProfile("expert").some(t => t.value === value)) {
                                profileTypesForListing.push("expert");
                              }
                              setSelectedProfileTypes(profileTypesForListing);
                              
                              // Clear skills if this type doesn't require them
                              if (!SKILL_REQUIRED_TYPES.includes(value)) {
                                setSelectedSkills([]);
                              }
                            } else {
                              // If clearing, clear everything
                              setSelectedListingTypes([]);
                              setSelectedSkills([]);
                              setSelectedProfileTypes([]);
                              setFundingStage('');
                              setCompensationType('');
                              setCompensationValue({});
                              setAmount('');
                            }
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select what you're looking for..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="find-funding">Find funding</SelectItem>
                              <SelectItem value="investment-opportunity">Find an investment opportunity</SelectItem>
                              <SelectItem value="cofounder">Find a co-founder</SelectItem>
                              <SelectItem value="co-investor">Find a co-investor</SelectItem>
                              <SelectItem value="expert-freelance">Find an expert/freelancer</SelectItem>
                              <SelectItem value="employee">Find an employee</SelectItem>
                              <SelectItem value="mission">Find a mission</SelectItem>
                              <SelectItem value="job">Find a job</SelectItem>
                              <SelectItem value="mentor">Find a mentor</SelectItem>
                              <SelectItem value="sell-startup">Sell a startup</SelectItem>
                              <SelectItem value="buy-startup">Buy a startup</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Industry/Sector */}
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Industry</Label>
                        <div className="col-span-3 space-y-2">
                          <IndustrySelector
                            value={selectedSector}
                            onChange={setSelectedSector}
                            placeholder="Select an industry you're interested in..."
                          />
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
                        <SkillsSelector
                          value={selectedSkills}
                          onChange={setSelectedSkills}
                          placeholder={alertType === 'profile' 
                            ? 'Search and select skills profiles should have...' 
                            : 'Search and select required skills...'
                          }
                        />
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
                      <div className="flex gap-2">
                        <CountrySelector
                          value={selectedCountry}
                          onValueChange={setSelectedCountry}
                          placeholder="Select a country..."
                          className="flex-1"
                        />
                        <Input 
                          placeholder="City (optional)" 
                          className="flex-1" 
                          value={locationCity} 
                          onChange={e => setLocationCity(e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Conditional Fields for Listing Alerts */}
                  {alertType === 'listing' && selectedListingTypes.length > 0 && (
                    <>
                      {/* Funding Stage */}
                      {(selectedListingTypes.includes("find-funding") || selectedListingTypes.includes("investment-opportunity")) && (
                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label className="text-right pt-2">Funding Stage</Label>
                          <div className="col-span-3">
                            <Select value={fundingStage} onValueChange={setFundingStage}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select funding stage" />
                              </SelectTrigger>
                              <SelectContent>
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
                        </div>
                      )}

                      {/* Compensation Type / Equity Offered */}
                      {!["sell-startup", "investment-opportunity", "buy-startup"].some(type => selectedListingTypes.includes(type)) && (
                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label className="text-right pt-2">
                            {selectedListingTypes.includes("find-funding") ? "Equity Offered" : "Compensation Type"}
                          </Label>
                          <div className="col-span-3 space-y-2">
                            <Select value={compensationType} onValueChange={setCompensationType}>
                        <SelectTrigger>
                                <SelectValue placeholder="Select compensation type" />
                        </SelectTrigger>
                              <SelectContent>
                                {/* Find funding - Equity only */}
                                {selectedListingTypes.includes("find-funding") && (
                                  <SelectItem value="Equity">Equity</SelectItem>
                                )}
                                
                                {/* Expert/Freelance work - Cash */}
                                {selectedListingTypes.includes("expert-freelance") && (
                                  <SelectItem value="Cash">Cash</SelectItem>
                                )}
                                
                                {/* Co-founder - Cash, Equity, Hybrid */}
                                {selectedListingTypes.includes("cofounder") && (
                                  <>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="Equity">Equity</SelectItem>
                                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                                  </>
                                )}
                                
                                {/* Employee/Job/Mentor - Full range */}
                                {(selectedListingTypes.includes("employee") || selectedListingTypes.includes("job") || selectedListingTypes.includes("mentor")) && (
                                  <>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="Salary">Salary</SelectItem>
                                    <SelectItem value="Equity">Equity</SelectItem>
                                    <SelectItem value="Salary & Equity">Salary & Equity</SelectItem>
                                    <SelectItem value="Cash & Equity">Cash & Equity</SelectItem>
                                  </>
                                )}

                                {/* Mission - Equity, Cash, Hybrid */}
                                {selectedListingTypes.includes("mission") && (
                                  <>
                                    <SelectItem value="Equity">Equity</SelectItem>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                                  </>
                                )}
                    </SelectContent>
                  </Select>
                            
                            {/* Compensation Value Inputs */}
                            {compensationType === 'Cash' && (
                              <Input placeholder="Cash amount (ex: $5000)" value={compensationValue.value || ''} onChange={e => setCompensationValue({ value: e.target.value })} />
                            )}
                            {compensationType === 'Equity' && (
                              <Input placeholder="Equity (ex: 5-10%)" value={compensationValue.value || ''} onChange={e => setCompensationValue({ value: e.target.value })} />
                            )}
                            {compensationType === 'Salary' && (
                              <Input placeholder="Salary (ex: $40-50K)" value={compensationValue.value || ''} onChange={e => setCompensationValue({ value: e.target.value })} />
                            )}
                            {compensationType === 'Hybrid' && (
                              <div className="flex flex-col gap-2">
                                <Input placeholder="Equity (ex: 5-10%)" value={compensationValue.equity || ''} onChange={e => setCompensationValue((prev: any) => ({ ...prev, equity: e.target.value }))} />
                                <Input placeholder="Cash amount (ex: $5000)" value={compensationValue.cash || ''} onChange={e => setCompensationValue((prev: any) => ({ ...prev, cash: e.target.value }))} />
                    </div>
                            )}
                            {compensationType === 'Salary & Equity' && (
                              <div className="flex flex-col gap-2">
                                <Input placeholder="Salary (ex: $40-50K)" value={compensationValue.salary || ''} onChange={e => setCompensationValue((prev: any) => ({ ...prev, salary: e.target.value }))} />
                                <Input placeholder="Equity (ex: 5-10%)" value={compensationValue.equity || ''} onChange={e => setCompensationValue((prev: any) => ({ ...prev, equity: e.target.value }))} />
                </div>
                            )}
                            {compensationType === 'Cash & Equity' && (
                              <div className="flex flex-col gap-2">
                                <Input placeholder="Cash amount (ex: $5000)" value={compensationValue.cash || ''} onChange={e => setCompensationValue((prev: any) => ({ ...prev, cash: e.target.value }))} />
                                <Input placeholder="Equity (ex: 5-10%)" value={compensationValue.equity || ''} onChange={e => setCompensationValue((prev: any) => ({ ...prev, equity: e.target.value }))} />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Amount Seeking */}
                      {selectedListingTypes.includes("find-funding") && (
                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label className="text-right pt-2">Amount Seeking</Label>
                          <div className="col-span-3">
                            <Input 
                              placeholder="Ex: $1M - $5M" 
                              value={amount} 
                              onChange={e => setAmount(e.target.value)} 
                            />
                          </div>
                        </div>
                      )}

                      {/* Investment Capacity */}
                      {(selectedListingTypes.includes("investment-opportunity") || selectedListingTypes.includes("buy-startup")) && (
                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label className="text-right pt-2">Investment Capacity</Label>
                          <div className="col-span-3">
                            <Input 
                              placeholder={selectedListingTypes.includes("buy-startup") ? "Ex: $1M - $5M for acquisition" : "Ex: $100K - $500K per deal"}
                              value={amount} 
                              onChange={e => setAmount(e.target.value)} 
                            />
                          </div>
                        </div>
                      )}

                      {/* Missing Capital and Equity Offered for co-investor search */}
                      {selectedListingTypes.includes("co-investor") && (
                        <>
                          <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">Missing Capital</Label>
                            <div className="col-span-3">
                              <Input 
                                placeholder="Ex: $500K needed to complete the round"
                                value={amount} 
                                onChange={e => setAmount(e.target.value)} 
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">Equity Offered</Label>
                            <div className="col-span-3">
                              <Input 
                                placeholder="Ex: 15-20% for co-investor"
                                value={compensationValue.value || ''} 
                                onChange={e => setCompensationValue({ value: e.target.value })} 
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Sale Price and Percentage for startup sales */}
                      {selectedListingTypes.includes("sell-startup") && (
                        <>
                          <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">Sale Price</Label>
                            <div className="col-span-3">
                              <Input 
                                placeholder="Ex: $500K - $1M"
                                value={amount} 
                                onChange={e => setAmount(e.target.value)} 
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">Percentage for Sale</Label>
                            <div className="col-span-3">
                              <Input 
                                placeholder="Ex: 100% for full sale, or 20-40% for partial"
                                value={compensationValue.value || ''} 
                                onChange={e => setCompensationValue({ value: e.target.value })} 
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
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