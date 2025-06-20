import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

interface CreateListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCreating: boolean;
  editingId: string | null;
  profileType: string;
  setProfileType: (v: string) => void;
  listingType: string;
  setListingType: (v: string) => void;
  fundingStage: string;
  setFundingStage: (v: string) => void;
  skills: string;
  setSkills: (v: string) => void;
  locationCountry: string;
  setLocationCountry: (v: string) => void;
  locationCity: string;
  setLocationCity: (v: string) => void;
  compensationType: string;
  setCompensationType: (v: string) => void;
  compensationValue: any;
  setCompensationValue: (v: any) => void;
  amount: string;
  setAmount: (v: string) => void;
  sector: string;
  setSector: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  onSubmit: () => void;
}

export function CreateListingModal({
  open,
  onOpenChange,
  isCreating,
  editingId,
  profileType,
  setProfileType,
  listingType,
  setListingType,
  fundingStage,
  setFundingStage,
  skills,
  setSkills,
  locationCountry,
  setLocationCountry,
  locationCity,
  setLocationCity,
  compensationType,
  setCompensationType,
  compensationValue,
  setCompensationValue,
  amount,
  setAmount,
  sector,
  setSector,
  title,
  setTitle,
  description,
  setDescription,
  onSubmit,
}: CreateListingModalProps) {
  // ...copy the dialog/modal and form UI from page.tsx here, replacing state/handlers with props...
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? 'Edit Listing' : 'Create New Listing'}</DialogTitle>
          <DialogDescription>
            Fill in the details for your {editingId ? 'listing' : 'new listing'}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Profile Selector */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="profileType" className="text-right">I am a <span className="text-destructive">*</span></Label>
            <Select onValueChange={setProfileType} value={profileType} disabled={editingId !== null}>
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
          {/* Listing Type Selector (dynamic options) */}
          {profileType && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="listingType" className="text-right">Looking to <span className="text-destructive">*</span></Label>
              <Select onValueChange={setListingType} value={listingType}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select what you're looking for" />
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
                      <SelectItem value="investment-opportunity">Find an investment opportunity</SelectItem>
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
          {/* Funding Stage */}
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
            !(profileType === "investor" && (["investment-opportunity", "buy-startup", "co-investor"].includes(listingType))) && 
            (profileType === "founder" || profileType === "investor" || profileType === "expert") && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="skills" className="text-right">Skills</Label>
              <Textarea id="skills" placeholder="Ex: React, Node.js, Digital Marketing..." className="col-span-3" value={skills} onChange={e => setSkills(e.target.value)} />
            </div>
          )}
          {/* Location */}
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
                    <SelectValue placeholder="Select compensation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Founder-specific compensation options */}
                    {profileType === "founder" && listingType === "find-funding" && (
                      <SelectItem value="Equity">Equity</SelectItem>
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
            (profileType === "investor" && !["investment-opportunity", "buy-startup", "co-investor"].includes(listingType)) ||
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
                <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                <SelectItem value="Hospitality">Hospitality</SelectItem>
                <SelectItem value="Agriculture">Agriculture</SelectItem>
                <SelectItem value="Automotive">Automotive</SelectItem>
                <SelectItem value="Construction">Construction</SelectItem>
                <SelectItem value="Aerospace">Aerospace</SelectItem>
                <SelectItem value="Pharmaceuticals">Pharmaceuticals</SelectItem>
                <SelectItem value="Chemicals">Chemicals</SelectItem>
                <SelectItem value="Mining">Mining</SelectItem>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>Cancel</Button>
          <Button onClick={onSubmit} disabled={isCreating}>{isCreating ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Listing' : 'Create Listing')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 