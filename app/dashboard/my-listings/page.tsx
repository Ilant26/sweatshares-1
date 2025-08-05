"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Plus, Search, ChevronDown, Edit, Trash2, Eye, Settings2, Calendar as CalendarIcon, DollarSign, Filter, ListFilter, SlidersHorizontal, ArrowUpDown, AlignLeft, Handshake } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/components/providers/session-provider';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { MyListingTable } from './my-listing';
import { CreateListingModal } from './create-listing-modal';

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

// Function to format profile type values for display
const formatProfileType = (profileType: string): string => {
  if (!profileType) return profileType;
  return profileType.charAt(0).toUpperCase() + profileType.slice(1);
};

export default function MyListingsPage() {
    const [selectedListings, setSelectedListings] = useState<string[]>([]);
    const [isNewListingModalOpen, setIsNewListingModalOpen] = useState(false);
    const [compensationType, setCompensationType] = useState<string>('');
    const [profileType, setProfileType] = useState<string>('');
    const [listingType, setListingType] = useState<string>("");
    const { user } = useSession();
    const [fundingStage, setFundingStage] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [locationCountry, setLocationCountry] = useState('');
    const [locationCity, setLocationCity] = useState('');
    const [compensationValue, setCompensationValue] = useState<any>("");
    const [amount, setAmount] = useState('');
    const [sector, setSector] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [listings, setListings] = useState<any[]>([]);
    const [isLoadingListings, setIsLoadingListings] = useState(false);
    const [listingsError, setListingsError] = useState<string | null>(null);
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Add useEffect to handle automatic compensation type selection (only when compensation type is empty)
    useEffect(() => {
        if (profileType && listingType && !compensationType) {
            // Founder looking for funding
            if (profileType === "founder" && listingType === "find-funding") {
                setCompensationType("Equity");
            }
            // Founder looking for expert/freelancer - don't auto-set, let user choose
            // else if (profileType === "founder" && listingType === "expert-freelance") {
            //     setCompensationType("Cash");
            // }
            // Investor looking for expert/freelancer
            else if (profileType === "investor" && listingType === "expert-freelance") {
                setCompensationType("Cash");
            }
            // Expert looking for expert/freelancer
            else if (profileType === "expert" && listingType === "expert-freelance") {
                setCompensationType("Cash");
            }
            // Set default compensation type for other cases
            else if (profileType === "founder" && ["employee", "mentor"].includes(listingType)) {
                setCompensationType("Salary");
            } else if (profileType === "founder" && ["cofounder"].includes(listingType)) {
                setCompensationType("Equity");
            } else if (profileType === "expert" && ["mission", "cofounder"].includes(listingType)) {
                setCompensationType("Equity");
            } else if (profileType === "expert" && ["job"].includes(listingType)) {
                setCompensationType("Salary");
            }
        }
    }, [profileType, listingType]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedListings(listings.map(listing => listing.id));
        } else {
            setSelectedListings([]);
        }
    };

    const handleSelectListing = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedListings([...selectedListings, id]);
        } else {
            setSelectedListings(selectedListings.filter(listingId => listingId !== id));
        }
    };

    const fetchListings = async () => {
        if (!user) return;
        setIsLoadingListings(true);
        setListingsError(null);
        const { data, error } = await supabase
            .from('listings')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (error) {
            setListingsError(error.message);
        } else {
            setListings(data || []);
        }
        setIsLoadingListings(false);
    };

    useEffect(() => {
        if (user) fetchListings();
    }, [user]);

    const handleDeleteListing = async (id: string) => {
        setDeletingId(id);
        const { error } = await supabase.from('listings').delete().eq('id', id);
        setDeletingId(null);
        if (error) {
            toast.error('Failed to delete opportunity: ' + error.message);
        } else {
            toast.success('Opportunity deleted!');
            fetchListings();
        }
    };

    const handleEditListing = (listing: any) => {
        setEditingId(listing.id);
        setIsNewListingModalOpen(true);
        setProfileType(listing.profile_type || '');
        setListingType(listing.listing_type || '');
        setFundingStage(listing.funding_stage || '');
        setSkills(listing.skills ? listing.skills.split(', ').filter((s: string) => s.trim()) : []);
        setLocationCountry(listing.location_country || '');
        setLocationCity(listing.location_city || '');
        setCompensationType(listing.compensation_type || '');
        setCompensationValue(
            (() => {
                if (!listing.compensation_value) return "";
                if (typeof listing.compensation_value === "object") return listing.compensation_value;
                try {
                    const parsed = JSON.parse(listing.compensation_value);
                    return parsed;
                } catch {
                    return { value: listing.compensation_value };
                }
            })()
        );
        setAmount(listing.amount || '');
        setSector(listing.sector || '');
        setTitle(listing.title || '');
        setDescription(listing.description || '');
    };

    const handleCreateOrUpdateListing = async () => {
        if (!user) {
            toast.error('You must be logged in to create an opportunity.');
            return;
        }
        if (!profileType || !listingType || !title || !description) {
            toast.error('Please fill in all mandatory fields: I am a, Looking to, Title, and Description.');
            setIsCreating(false);
            return;
        }
        setIsCreating(true);
        let error;
        if (editingId) {
            ({ error } = await supabase.from('listings').update({
                user_id: user.id,
                profile_type: profileType,
                listing_type: listingType,
                funding_stage: fundingStage,
                skills: skills.join(', '),
                location_country: locationCountry,
                location_city: locationCity,
                compensation_type: compensationType,
                compensation_value: typeof compensationValue === 'object' ? compensationValue : { value: compensationValue },
                amount,
                sector,
                title,
                description: description || '',
            }).eq('id', editingId));
        } else {
            ({ error } = await supabase.from('listings').insert({
                user_id: user.id,
                profile_type: profileType,
                listing_type: listingType,
                funding_stage: fundingStage,
                skills: skills.join(', '),
                location_country: locationCountry,
                location_city: locationCity,
                compensation_type: compensationType,
                compensation_value: typeof compensationValue === 'object' ? compensationValue : { value: compensationValue },
                amount,
                sector,
                title,
                description: description || '',
            }));
        }
        setIsCreating(false);
        if (error) {
            toast.error((editingId ? 'Failed to update' : 'Failed to create') + ' opportunity: ' + error.message);
        } else {
            toast.success(editingId ? 'Opportunity updated!' : 'Opportunity created!');
            setIsNewListingModalOpen(false);
            setEditingId(null);
            fetchListings();
        }
    };

    useEffect(() => {
        if (!isNewListingModalOpen) {
            setEditingId(null);
            setProfileType('');
            setListingType('');
            setFundingStage('');
            setSkills([]);
            setLocationCountry('');
            setLocationCity('');
            setCompensationType('');
            setCompensationValue("");
            setAmount('');
            setSector('');
            setTitle('');
            setDescription('');
        }
    }, [isNewListingModalOpen]);

    const handleToggleStatus = async (listing: any) => {
        const newStatus = listing.status === 'active' ? 'inactive' : 'active';
        const { error } = await supabase
            .from('listings')
            .update({ status: newStatus })
            .eq('id', listing.id);
        if (error) {
            toast.error('Failed to update status: ' + error.message);
        } else {
            fetchListings();
            toast.success('Opportunity status updated!');
        }
    };

    return (
        <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
            {/* Header Section */}
            <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Handshake className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Manage Your Opportunities</h1>
                            <p className="text-sm text-muted-foreground">Create and manage your professional opportunities</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button onClick={() => setIsNewListingModalOpen(true)} className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" /> New Opportunity
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
                <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search your opportunities..." className="pl-8 w-full" />
                </div>
                <div className="flex flex-wrap items-center space-x-2 w-full md:w-2/3 justify-end">
                    <Select>
                        <SelectTrigger className="w-[150px]">
                            <ListFilter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Opportunity Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="fundraising">Fundraising</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                            <SelectItem value="job-offer">Job Offer</SelectItem>
                            <SelectItem value="mentor-search">Mentor Search</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select>
                        <SelectTrigger className="w-[150px]">
                            <Settings2 className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Role Needed" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="seed-investor">Seed Investor</SelectItem>
                            <SelectItem value="co-founder">Co-founder</SelectItem>
                            <SelectItem value="full-stack-developer">Full-Stack Developer</SelectItem>
                            <SelectItem value="growth-mentor">Growth Mentor</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select>
                        <SelectTrigger className="w-[150px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                    </Select>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto md:ml-0">
                                <ArrowUpDown className="mr-2 h-4 w-4" /> Sort by <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Date</DropdownMenuItem>
                            <DropdownMenuItem>Type</DropdownMenuItem>
                            <DropdownMenuItem>Status</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="rounded-md border">
                <MyListingTable
                  listings={listings}
                  selectedListings={selectedListings}
                  isLoadingListings={isLoadingListings}
                  listingsError={listingsError}
                  onSelectAll={handleSelectAll}
                  onSelectListing={handleSelectListing}
                  onEditListing={handleEditListing}
                  onDeleteListing={handleDeleteListing}
                  onToggleStatus={handleToggleStatus}
                  deletingId={deletingId}
                />
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Showing {selectedListings.length} of {listings.length} listings selected.</span>
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious href="#" />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationLink href="#">1</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationLink href="#">2</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationLink href="#">3</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext href="#" />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>

            <CreateListingModal
              open={isNewListingModalOpen}
              onOpenChange={setIsNewListingModalOpen}
              isCreating={isCreating}
              editingId={editingId}
              profileType={profileType}
              setProfileType={setProfileType}
              listingType={listingType}
              setListingType={setListingType}
              fundingStage={fundingStage}
              setFundingStage={setFundingStage}
              skills={skills}
              setSkills={setSkills}
              locationCountry={locationCountry}
              setLocationCountry={setLocationCountry}
              locationCity={locationCity}
              setLocationCity={setLocationCity}
              compensationType={compensationType}
              setCompensationType={setCompensationType}
              compensationValue={compensationValue}
              setCompensationValue={setCompensationValue}
              amount={amount}
              setAmount={setAmount}
              sector={sector}
              setSector={setSector}
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              onSubmit={handleCreateOrUpdateListing}
            />
        </div>
    );
} 