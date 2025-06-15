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
import { Plus, Search, ChevronDown, Edit, Trash2, Eye, Settings2, Calendar as CalendarIcon, DollarSign, Filter, ListFilter, SlidersHorizontal, ArrowUpDown, AlignLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/components/providers/session-provider';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

export default function MyListingsPage() {
    const [selectedListings, setSelectedListings] = useState<string[]>([]);
    const [isNewListingModalOpen, setIsNewListingModalOpen] = useState(false);
    const [compensationType, setCompensationType] = useState<string>('');
    const [profileType, setProfileType] = useState<string>('');
    const [listingType, setListingType] = useState<string>("");
    const { user } = useSession();
    const [fundingStage, setFundingStage] = useState('');
    const [skills, setSkills] = useState('');
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

    // Add useEffect to handle automatic compensation type selection
    useEffect(() => {
        if (profileType && listingType) {
            // Founder looking for funding
            if (profileType === "founder" && listingType === "find-funding") {
                setCompensationType("Equity");
            }
            // Founder looking for expert/freelancer
            else if (profileType === "founder" && listingType === "expert-freelance") {
                setCompensationType("Cash");
            }
            // Investor looking for expert/freelancer
            else if (profileType === "investor" && listingType === "expert-freelance") {
                setCompensationType("Cash");
            }
            // Expert looking for expert/freelancer
            else if (profileType === "expert" && listingType === "expert-freelance") {
                setCompensationType("Cash");
            }
            // Set default compensation type for other cases
            else if (!compensationType) {
                if (profileType === "founder" && ["employee", "mentor"].includes(listingType)) {
                    setCompensationType("Salary");
                } else if (profileType === "founder" && ["cofounder"].includes(listingType)) {
                    setCompensationType("Equity");
                } else if (profileType === "expert" && ["mission", "cofounder"].includes(listingType)) {
                    setCompensationType("Equity");
                } else if (profileType === "expert" && ["job"].includes(listingType)) {
                    setCompensationType("Salary");
                }
            }
        }
    }, [profileType, listingType, compensationType]);

    // Add useEffect to set default sector
    useEffect(() => {
        if (!sector && profileType) {
            if (profileType === "founder") {
                setSector("Technology");
            } else if (profileType === "investor") {
                setSector("Finance");
            } else if (profileType === "expert") {
                setSector("Professional Services");
            }
        }
    }, [profileType, sector]);

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
            toast.error('Failed to delete listing: ' + error.message);
        } else {
            toast.success('Listing deleted!');
            fetchListings();
        }
    };

    const handleEditListing = (listing: any) => {
        setEditingId(listing.id);
        setIsNewListingModalOpen(true);
        setProfileType(listing.profile_type || '');
        setListingType(listing.listing_type || '');
        setFundingStage(listing.funding_stage || '');
        setSkills(listing.skills || '');
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
            toast.error('You must be logged in to create a listing.');
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
                skills,
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
                skills,
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
            toast.error((editingId ? 'Failed to update' : 'Failed to create') + ' listing: ' + error.message);
        } else {
            toast.success(editingId ? 'Listing updated!' : 'Listing created!');
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
            setSkills('');
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
            toast.success('Listing status updated!');
        }
    };

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Manage Your Listings</h2>
                <div className="flex gap-2">
                    <Button onClick={() => router.push('/listing')} variant="outline">
                        View Listings
                    </Button>
                    <Button onClick={() => setIsNewListingModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> New Listing
                    </Button>
                </div>
            </div>
            <p className="text-muted-foreground">Create and manage your professional opportunity listings</p>

            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
                <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search your listings..." className="pl-8 w-full" />
                </div>
                <div className="flex flex-wrap items-center space-x-2 w-full md:w-2/3 justify-end">
                    <Select>
                        <SelectTrigger className="w-[150px]">
                            <ListFilter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Listing Type" />
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
                {isLoadingListings ? (
                    <div className="p-8 text-center text-muted-foreground">Loading listings...</div>
                ) : listingsError ? (
                    <div className="p-8 text-center text-destructive">{listingsError}</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={selectedListings.length === listings.length && listings.length > 0}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead>Looking for</TableHead>
                                <TableHead>As an</TableHead>
                                <TableHead>Country</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Publication Date</TableHead>
                                <TableHead>Compensation</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {listings.map((listing) => (
                                <TableRow key={listing.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedListings.includes(listing.id)}
                                            onCheckedChange={(checked: boolean) => handleSelectListing(listing.id, checked)}
                                            aria-label="Select row"
                                        />
                                    </TableCell>
                                    <TableCell>{listing.listing_type}</TableCell>
                                    <TableCell>{listing.profile_type}</TableCell>
                                    <TableCell>{listing.location_country}</TableCell>
                                    <TableCell>{listing.title}</TableCell>
                                    <TableCell>{new Date(listing.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>{listing.compensation_type}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={listing.status === 'active'}
                                            onCheckedChange={() => handleToggleStatus(listing)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => router.push(`/listing/${listing.id}`)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleEditListing(listing)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteListing(listing.id)} disabled={deletingId === listing.id}>
                                            {deletingId === listing.id ? <span className="animate-spin"><Trash2 className="h-4 w-4" /></span> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
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

            <Dialog open={isNewListingModalOpen} onOpenChange={setIsNewListingModalOpen}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
  <DialogHeader>
    <DialogTitle>Create New Listing</DialogTitle>
    <DialogDescription>
      Fill in the details for your new listing.
    </DialogDescription>
  </DialogHeader>
  <div className="grid gap-4 py-4">
    {/* Profile Selector */}
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="profileType" className="text-right">I am a <span className="text-destructive">*</span></Label>
      <Select onValueChange={setProfileType} disabled={editingId !== null}>
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Select your profile" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="founder">Founder</SelectItem>
          <SelectItem value="investor">Investor</SelectItem>
          <SelectItem value="expert">Expert</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Listing Type - dynamic options */}
    {profileType && (
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="listingType" className="text-right">Looking to <span className="text-destructive">*</span></Label>
        <Select value={listingType} onValueChange={setListingType} disabled={editingId !== null}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select listing type" />
          </SelectTrigger>
          <SelectContent>
            {profileType === "founder" && (
              <>
                <SelectItem value="find-funding">Find funding</SelectItem>
                <SelectItem value="cofounder">Find a co-founder</SelectItem>
                <SelectItem value="expert-freelance">Find an expert/freelancer</SelectItem>
                <SelectItem value="employee">Find an employee</SelectItem>
                <SelectItem value="mentor">Find a mentor</SelectItem>
                <SelectItem value="sell-startup">Sell my startup</SelectItem>
              </>
            )}
            {profileType === "investor" && (
              <>
                <SelectItem value="investment-opportunity">Find investment opportunity</SelectItem>
                <SelectItem value="buy-startup">Buy a startup</SelectItem>
                <SelectItem value="co-investor">Find a co-investor</SelectItem>
                <SelectItem value="expert-freelance">Find an expert/freelancer</SelectItem>
              </>
            )}
            {profileType === "expert" && (
              <>
                <SelectItem value="mission">Find a mission</SelectItem>
                <SelectItem value="job">Find a job</SelectItem>
                <SelectItem value="expert-freelance">Find an expert/freelancer</SelectItem>
                <SelectItem value="cofounder">Find a co-founder</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>
    )}

    {/* Funding Stage - Show when founder is looking for funding or investor is looking for investment opportunity */}
    {((profileType === "founder" && listingType === "find-funding") || 
     (profileType === "investor" && listingType === "investment-opportunity")) && (
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="fundingStage" className="text-right">Funding Stage</Label>
        <Select value={fundingStage} onValueChange={setFundingStage}>
          <SelectTrigger className="col-span-3">
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
    )}

    {/* Skills */}
    {!(profileType === "founder" && (["find-funding", "sell-startup"].includes(listingType))) && 
     !(profileType === "investor" && ["investment-opportunity", "buy-startup", "co-investor"].includes(listingType)) && 
     (profileType === "founder" || profileType === "investor" || profileType === "expert") && (
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="skills" className="text-right">Skills</Label>
        <Textarea id="skills" placeholder="Ex: React, Node.js, Digital Marketing..." className="col-span-3" value={skills} onChange={e => setSkills(e.target.value)} />
      </div>
    )}
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="locationCountry" className="text-right">Location</Label>
      <div className="col-span-3 flex gap-2">
        <Select value={locationCountry} onValueChange={setLocationCountry}>
          <SelectTrigger className="w-1/2">
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="France">France</SelectItem>
            <SelectItem value="USA">USA</SelectItem>
            <SelectItem value="UK">UK</SelectItem>
            <SelectItem value="Germany">Germany</SelectItem>
            <SelectItem value="Spain">Spain</SelectItem>
            <SelectItem value="Italy">Italy</SelectItem>
            <SelectItem value="Portugal">Portugal</SelectItem>
            <SelectItem value="Belgium">Belgium</SelectItem>
            <SelectItem value="Netherlands">Netherlands</SelectItem>
            <SelectItem value="Sweden">Sweden</SelectItem>
            <SelectItem value="Norway">Norway</SelectItem>
            <SelectItem value="Denmark">Denmark</SelectItem>
            <SelectItem value="Finland">Finland</SelectItem>
            <SelectItem value="Ireland">Ireland</SelectItem>
            <SelectItem value="Poland">Poland</SelectItem>
            <SelectItem value="Czech Republic">Czech Republic</SelectItem>
            <SelectItem value="Hungary">Hungary</SelectItem>
            <SelectItem value="Greece">Greece</SelectItem>
            <SelectItem value="Austria">Austria</SelectItem>
            <SelectItem value="Switzerland">Switzerland</SelectItem>
            <SelectItem value="Turkey">Turkey</SelectItem>
            <SelectItem value="Russia">Russia</SelectItem>
            <SelectItem value="Ukraine">Ukraine</SelectItem>
            <SelectItem value="Belarus">Belarus</SelectItem>
            <SelectItem value="Moldova">Moldova</SelectItem>
            <SelectItem value="Albania">Albania</SelectItem>

          </SelectContent>
        </Select>
        <Input id="locationCity" placeholder="City (optional)" className="w-1/2" value={locationCity} onChange={e => setLocationCity(e.target.value)} />
      </div>
    </div>
    {/* Compensation Type */}
    {(profileType === "founder" || profileType === "investor" || profileType === "expert") && 
     !(profileType === "founder" && listingType === "sell-startup") &&
     !(profileType === "investor" && ["investment-opportunity", "buy-startup", "co-investor"].includes(listingType)) && (
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="compensationType" className="text-right">Compensation Type</Label>
        <div className="col-span-3 flex flex-col gap-2">
          <Select value={compensationType} onValueChange={setCompensationType}>
            <SelectTrigger>
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              {/* Founder-specific compensation options */}
              {profileType === "founder" && listingType === "find-funding" && (
                <>
                  <SelectItem value="Equity">Equity</SelectItem>
                </>
              )}
              {profileType === "founder" && (["cofounder", "expert-freelance"].includes(listingType)) && (
                <>
                  <SelectItem value="Equity">Equity</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </>
              )}
              {profileType === "founder" && (["employee", "mentor"].includes(listingType)) && (
                <>
                  <SelectItem value="Salary">Salary</SelectItem>
                  <SelectItem value="Equity">Equity</SelectItem>
                  <SelectItem value="Salary & Equity">Salary & Equity</SelectItem>
                  <SelectItem value="Cash & Equity">Cash & Equity</SelectItem>
                </>
              )}
              {/* Expert-specific compensation options */}
              {profileType === "expert" && ["mission", "cofounder", "job", "expert-freelance"].includes(listingType) ? (
                <>
                  {listingType === "mission" && (
                    <>
                      <SelectItem value="Equity">Equity</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </>
                  )}
                  {listingType === "cofounder" && (
                    <>
                      <SelectItem value="Equity">Equity</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </>
                  )}
                  {listingType === "job" && (
                    <>
                      <SelectItem value="Salary">Annual Salary</SelectItem>
                      <SelectItem value="Equity">Equity</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </>
                  )}
                  {listingType === "expert-freelance" && (
                    <SelectItem value="Cash">Cash</SelectItem>
                  )}
                </>
              ) :
                ((profileType !== "founder" && profileType !== "expert") || (profileType === "founder" && !["find-funding", "cofounder", "expert-freelance", "employee", "mentor"].includes(listingType))) ? (
                  <>
                    {profileType === "investor" && listingType === "expert-freelance" ? (
                      <SelectItem value="Cash">Cash</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Equity">Equity</SelectItem>
                        <SelectItem value="Salary">Annual Salary</SelectItem>
                        <SelectItem value="Volunteer">Volunteer</SelectItem>
                      </>
                    )}
                  </>
                ) : null
              }
            </SelectContent>
          </Select>
          {compensationType === 'Cash' && (
            <Input placeholder="Cash bonus (ex: 5000€)" value={compensationValue.value || compensationValue || ''} onChange={e => setCompensationValue({ value: e.target.value })} />
          )}
          {compensationType === 'Equity' && (
            <Input placeholder="Equity (ex: 5-10%)" value={compensationValue.value || compensationValue || ''} onChange={e => setCompensationValue({ value: e.target.value })} />
          )}
          {compensationType === 'Salary' && (
            <Input placeholder="Annual salary (ex: 40-50K€)" value={compensationValue.value || compensationValue || ''} onChange={e => setCompensationValue({ value: e.target.value })} />
          )}
          {compensationType === 'Hybrid' && (
            <div className="flex flex-col gap-2">
              <Input placeholder="Equity (ex: 5-10%)" value={compensationValue.equity || ''} onChange={e => setCompensationValue((prev: any) => ({ ...prev, equity: e.target.value }))} />
              <Input placeholder="Cash bonus (ex: 5000€)" value={compensationValue.cash || ''} onChange={e => setCompensationValue((prev: any) => ({ ...prev, cash: e.target.value }))} />
            </div>
          )}
          {compensationType === 'Salary & Equity' && (
            <div className="flex flex-col gap-2">
              <Input placeholder="Annual salary (ex: 40-50K€)" value={compensationValue.salary || ''} onChange={e => setCompensationValue((prev: any) => ({ ...prev, salary: e.target.value }))} />
              <Input placeholder="Equity (ex: 5-10%)" value={compensationValue.equity || ''} onChange={e => setCompensationValue((prev: any) => ({ ...prev, equity: e.target.value }))} />
            </div>
          )}
          {compensationType === 'Cash & Equity' && (
            <div className="flex flex-col gap-2">
              <Input placeholder="Cash amount (ex: 5000€)" value={compensationValue.cash || ''} onChange={e => setCompensationValue((prev: any) => ({ ...prev, cash: e.target.value }))} />
              <Input placeholder="Equity (ex: 5-10%)" value={compensationValue.equity || ''} onChange={e => setCompensationValue((prev: any) => ({ ...prev, equity: e.target.value }))} />
            </div>
          )}
        </div>
      </div>
    )}
    {/* Amount (Founder & Investor only) */}
    {((profileType === "founder" && !["cofounder", "expert-freelance", "employee", "mentor"].includes(listingType)) ||
      (profileType === "investor" && !["expert-freelance"].includes(listingType)) ||
      (profileType === "expert" && !["mission", "job", "expert-freelance", "cofounder"].includes(listingType))) && (
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="amount" className="text-right">Investment Amount</Label>
        <Input id="amount" placeholder="Ex: 10000€" className="col-span-3" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
    )}
    {/* Secteur */}
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="secteur" className="text-right">Company Sector</Label>
      <Select value={sector} onValueChange={setSector}>
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Select a sector" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Technology">Technology</SelectItem>
          <SelectItem value="Healthcare">Healthcare</SelectItem>
          <SelectItem value="Finance">Finance</SelectItem>
          <SelectItem value="Education">Education</SelectItem>
          <SelectItem value="Retail">Retail</SelectItem>
          <SelectItem value="Manufacturing">Manufacturing</SelectItem>
          <SelectItem value="Real Estate">Real Estate</SelectItem>
          <SelectItem value="Energy">Energy</SelectItem>
          <SelectItem value="Transportation">Transportation</SelectItem>
          <SelectItem value="Media & Entertainment">Media & Entertainment</SelectItem>
          <SelectItem value="Telecommunications">Telecommunications</SelectItem>
          <SelectItem value="Agriculture">Agriculture</SelectItem>
          <SelectItem value="Construction">Construction</SelectItem>
          <SelectItem value="Hospitality">Hospitality</SelectItem>
          <SelectItem value="Professional Services">Professional Services</SelectItem>
          <SelectItem value="Biotechnology">Biotechnology</SelectItem>
          <SelectItem value="Artificial Intelligence">Artificial Intelligence</SelectItem>
          <SelectItem value="Blockchain">Blockchain</SelectItem>
          <SelectItem value="Clean Energy">Clean Energy</SelectItem>
          <SelectItem value="E-commerce">E-commerce</SelectItem>
          <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
          <SelectItem value="Fashion">Fashion</SelectItem>
          <SelectItem value="Sports">Sports</SelectItem>
          <SelectItem value="Travel">Travel</SelectItem>
          <SelectItem value="Insurance">Insurance</SelectItem>
          <SelectItem value="Legal Services">Legal Services</SelectItem>
          <SelectItem value="Marketing & Advertising">Marketing & Advertising</SelectItem>
          <SelectItem value="Pharmaceuticals">Pharmaceuticals</SelectItem>
          <SelectItem value="Renewable Energy">Renewable Energy</SelectItem>
          <SelectItem value="Software Development">Software Development</SelectItem>
          <SelectItem value="Cybersecurity">Cybersecurity</SelectItem>
          <SelectItem value="Data Analytics">Data Analytics</SelectItem>
          <SelectItem value="Digital Media">Digital Media</SelectItem>
          <SelectItem value="Environmental Services">Environmental Services</SelectItem>
          <SelectItem value="Fitness & Wellness">Fitness & Wellness</SelectItem>
          <SelectItem value="Gaming">Gaming</SelectItem>
          <SelectItem value="Hardware">Hardware</SelectItem>
          <SelectItem value="Internet of Things">Internet of Things</SelectItem>
          <SelectItem value="Logistics">Logistics</SelectItem>
          <SelectItem value="Mobile Apps">Mobile Apps</SelectItem>
          <SelectItem value="Robotics">Robotics</SelectItem>
          <SelectItem value="SaaS">SaaS</SelectItem>
          <SelectItem value="Social Impact">Social Impact</SelectItem>
          <SelectItem value="Space Technology">Space Technology</SelectItem>
          <SelectItem value="Virtual Reality">Virtual Reality</SelectItem>
          <SelectItem value="Wearable Technology">Wearable Technology</SelectItem>
        </SelectContent>
      </Select>
    </div>
    {/* Title */}
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="title" className="text-right">Title <span className="text-destructive">*</span></Label>
      <Input id="title" placeholder="Input your title" className="col-span-3" value={title} onChange={e => setTitle(e.target.value)} />
    </div>
    {/* Description */}
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="description" className="text-right">Description <span className="text-destructive">*</span></Label>
      <div className="col-span-3">
        <RichTextEditor
          content={description}
          onChange={setDescription}
          placeholder="Describe your needs in detail..."
        />
      </div>
    </div>
  </div>
  <DialogFooter>
    <Button variant="outline" onClick={() => setIsNewListingModalOpen(false)} disabled={isCreating}>Cancel</Button>
    <Button onClick={handleCreateOrUpdateListing} disabled={isCreating}>{isCreating ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Listing' : 'Create Listing')}</Button>
  </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 