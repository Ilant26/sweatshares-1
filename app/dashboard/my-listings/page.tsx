"use client"

import React, { useState } from 'react';
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

export default function MyListingsPage() {
    const [selectedListings, setSelectedListings] = useState<string[]>([]);
    const [isNewListingModalOpen, setIsNewListingModalOpen] = useState(false);
    const [listingEndDate, setListingEndDate] = useState<Date | undefined>(undefined);
    const [compensationType, setCompensationType] = useState<string>('');
    const [profileType, setProfileType] = useState<string>('');
    const [listingType, setListingType] = useState<string>("");

    const listings = [
        { id: '1', type: 'Fundraising', role: 'Seed Investor', country: 'France', endDate: 'June 30, 2025', compensation: 'Equity', status: true },
        { id: '2', type: 'Partnership', role: 'Co-founder', country: 'France', endDate: 'July 15, 2025', compensation: 'Equity', status: true },
        { id: '3', type: 'Job Offer', role: 'Full-Stack Developer', country: 'France', endDate: 'August 31, 2025', compensation: 'Salary', status: true },
        { id: '4', type: 'Mentor Search', role: 'Growth Mentor', country: 'Remote', endDate: 'September 15, 2025', compensation: 'Volunteer', status: false },
        { id: '5', type: 'Fundraising', role: 'Series A Investor', country: 'Europe', endDate: 'May 10, 2026', compensation: 'Equity', status: true },
        { id: '6', type: 'Partnership', role: 'Marketing Manager', country: 'France', endDate: 'April 10, 2026', compensation: 'Fixed', status: false },
    ];

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

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Manage Your Listings</h2>
                <Button onClick={() => setIsNewListingModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Listing
                </Button>
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedListings.length === listings.length}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            <TableHead>Listing Type</TableHead>
                            <TableHead>Role Needed</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>End Date</TableHead>
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
                                <TableCell>{listing.type}</TableCell>
                                <TableCell>{listing.role}</TableCell>
                                <TableCell>{listing.country}</TableCell>
                                <TableCell>{listing.endDate}</TableCell>
                                <TableCell>{listing.compensation}</TableCell>
                                <TableCell>
                                    <Switch checked={listing.status} onCheckedChange={() => { /* Handle status change */ }} />
                                </TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-2">
                                    <Button variant="ghost" size="icon">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
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
      <Label htmlFor="profileType" className="text-right">Profile</Label>
      <Select onValueChange={setProfileType}>
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
        <Label htmlFor="listingType" className="text-right">Listing Type</Label>
        <Select value={listingType} onValueChange={setListingType}>
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
    {(profileType === "founder" && listingType === "find-funding") || 
     (profileType === "investor" && listingType === "investment-opportunity") && (
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="fundingStage" className="text-right">Funding Stage</Label>
        <Select>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select funding stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pre-seed">Pre-seed</SelectItem>
            <SelectItem value="seed">Seed</SelectItem>
            <SelectItem value="series-a">Series A</SelectItem>
            <SelectItem value="series-b">Series B</SelectItem>
            <SelectItem value="series-c">Series C</SelectItem>
            <SelectItem value="series-d">Series D</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
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
        <Textarea id="skills" placeholder="Ex: React, Node.js, Digital Marketing..." className="col-span-3" />
      </div>
    )}
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="locationCountry" className="text-right">Location</Label>
      <div className="col-span-3 flex gap-2">
        <Select>
          <SelectTrigger className="w-1/2">
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="france">France</SelectItem>
            <SelectItem value="usa">USA</SelectItem>
            <SelectItem value="uk">UK</SelectItem>
          </SelectContent>
        </Select>
        <Input id="locationCity" placeholder="City (optional)" className="w-1/2" />
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
                  <SelectItem value="equity">Equity</SelectItem>
                </>
              )}
              {profileType === "founder" && (["cofounder", "expert-freelance"].includes(listingType)) && (
                <>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </>
              )}
              {profileType === "founder" && (["employee", "mentor"].includes(listingType)) && (
                <>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="salary-equity">Salary & Equity</SelectItem>
                  <SelectItem value="cash-equity">Cash & Equity</SelectItem>
                </>
              )}
              {/* Expert-specific compensation options */}
              {profileType === "expert" && ["mission", "cofounder", "job", "expert-freelance"].includes(listingType) ? (
                <>
                  {listingType === "mission" && (
                    <>
                      <SelectItem value="equity">Equity</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </>
                  )}
                  {listingType === "cofounder" && (
                    <>
                      <SelectItem value="equity">Equity</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </>
                  )}
                  {listingType === "job" && (
                    <>
                      <SelectItem value="salary">Annual Salary</SelectItem>
                      <SelectItem value="equity">Equity</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </>
                  )}
                  {listingType === "expert-freelance" && (
                    <SelectItem value="cash">Cash</SelectItem>
                  )}
                </>
              ) :
                ((profileType !== "founder" && profileType !== "expert") || (profileType === "founder" && !["find-funding", "cofounder", "expert-freelance", "employee", "mentor"].includes(listingType))) ? (
                  <>
                    {profileType === "investor" && listingType === "expert-freelance" ? (
                      <SelectItem value="cash">Cash</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="equity">Equity</SelectItem>
                        <SelectItem value="salary">Annual Salary</SelectItem>
                        <SelectItem value="volunteer">Volunteer</SelectItem>
                      </>
                    )}
                  </>
                ) : null
              }
            </SelectContent>
          </Select>
          {compensationType === 'cash' && (
            <Input placeholder="Cash bonus (ex: 5000€)" />
          )}
          {compensationType === 'equity' && (
            <Input placeholder="Equity (ex: 5-10%)" />
          )}
          {compensationType === 'salary' && (
            <Input placeholder="Annual salary (ex: 40-50K)" />
          )}
          {compensationType === 'hybrid' && (
            <div className="flex flex-col gap-2">
              <Input placeholder="Equity (ex: 5-10%)" />
              <Input placeholder="Cash bonus (ex: 5000€)" />
            </div>
          )}
          {compensationType === 'salary-equity' && (
            <div className="flex flex-col gap-2">
              <Input placeholder="Annual salary (ex: 40-50K)" />
              <Input placeholder="Equity (ex: 5-10%)" />
            </div>
          )}
          {compensationType === 'cash-equity' && (
            <div className="flex flex-col gap-2">
              <Input placeholder="Cash amount (ex: 5000€)" />
              <Input placeholder="Equity (ex: 5-10%)" />
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
        <Label htmlFor="amount" className="text-right">Amount</Label>
        <Input id="amount" placeholder="Ex: 10000€" className="col-span-3" />
      </div>
    )}
    {/* Secteur */}
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="secteur" className="text-right">Company Sector</Label>
      <Input id="secteur" placeholder="Ex: Tech, Health, Finance..." className="col-span-3" />
    </div>
    {/* Listing End Date */}
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="listingEndDate" className="text-right">Listing End Date</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "col-span-3 justify-start text-left font-normal",
              !listingEndDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {listingEndDate ? format(listingEndDate, "PPP") : <span>j/mm/aaaa</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={listingEndDate}
            onSelect={setListingEndDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
    {/* Required Skills */}
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="title" className="text-right">Title</Label>
      <Input id="title" placeholder="Input your title" className="col-span-3" />
    </div>
    {/* Description */}
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="description" className="text-right">Description</Label>
      <Textarea id="description" placeholder="Describe your needs in detail..." className="col-span-3" />
    </div>
  </div>
  <DialogFooter>
    <Button variant="outline" onClick={() => setIsNewListingModalOpen(false)}>Cancel</Button>
    <Button>Create Listing</Button>
  </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 