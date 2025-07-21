import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const INDUSTRY_LIST: string[] = [
  "Technology", "Information Technology", "Software", "Hardware", "SaaS", "Cloud Computing", "Artificial Intelligence", "Machine Learning", "Big Data", "Data Science", "Cybersecurity", "Blockchain", "Web3", "Fintech", "Edtech", "Healthtech", "Cleantech", "Greentech", "Agtech", "Proptech", "Insurtech", "Martech", "Legaltech", "Govtech", "IoT", "Internet of Things", "Mobile Apps", "E-commerce", "Marketplace", "Gaming", "Virtual Reality", "Augmented Reality", "Wearable Technology", "Robotics", "Space Technology", "3D Printing", "Quantum Computing",
  "Consulting", "Management Consulting", "Business Services", "Accounting", "Legal", "Recruitment", "HR", "Marketing", "Advertising", "PR", "Design", "Creative Services", "Translation", "Event Services", "Research", "Analytics", "Outsourcing", "Call Center", "Customer Support",
  "Finance", "Banking", "Investment Banking", "Private Equity", "Venture Capital", "Angel Investing", "Insurance", "Wealth Management", "Asset Management", "Financial Services", "Payments", "Lending", "Crowdfunding", "Cryptocurrency", "Trading", "Accounting & Auditing",
  "Healthcare", "Healthtech", "Biotechnology", "Pharmaceuticals", "Medical Devices", "Diagnostics", "Hospitals", "Clinics", "Telemedicine", "Fitness & Wellness", "Mental Health", "Elder Care", "Veterinary", "Healthcare Services",
  "Education", "Edtech", "E-learning", "Schools", "Universities", "Tutoring", "Corporate Training", "Test Preparation",
  "Energy", "Oil & Gas", "Renewable Energy", "Solar", "Wind", "Hydro", "Nuclear", "Utilities", "Cleantech", "Sustainability", "Environmental Services", "Waste Management", "Recycling", "Water Treatment", "Mining", "Forestry",
  "Manufacturing", "Industrial Automation", "Machinery", "Automotive", "Aerospace", "Aviation", "Defense", "Construction", "Building Materials", "Chemicals", "Metals", "Textiles", "Printing", "Packaging", "Logistics", "Supply Chain", "Warehousing", "Transportation", "Shipping", "Rail", "Trucking", "Maritime", "Distribution",
  "Real Estate", "Property Management", "Commercial Real Estate", "Residential Real Estate", "Construction", "Architecture", "Urban Planning", "Facility Management", "Infrastructure", "Smart Cities",
  "Retail", "E-commerce", "Fashion", "Apparel", "Luxury Goods", "Jewelry", "Cosmetics", "Beauty", "Consumer Electronics", "Home Goods", "Furniture", "Toys", "Sporting Goods", "Grocery", "Food & Beverage", "Restaurants", "Cafes", "Bars", "Hospitality", "Travel", "Tourism", "Leisure", "Entertainment", "Media", "Publishing", "Film", "Television", "Music", "Radio", "Photography", "Events", "Nightlife",
  "Agriculture", "Agtech", "Farming", "Livestock", "Dairy", "Fisheries", "Food Processing", "Beverages", "Organic Food", "Food Delivery", "Catering",
  "Science", "Research", "R&D", "Laboratories", "Space Exploration", "Nanotechnology", "Genomics", "Life Sciences",
  "Government", "Public Administration", "Nonprofit", "NGO", "Charity", "Philanthropy", "International Development", "Defense", "Security", "Law Enforcement", "Emergency Services", "Fire & Rescue", "Military",
  "Telecommunications", "Utilities", "Personal Services", "Cleaning Services", "Pet Services", "Funeral Services", "Other"
];

export function IndustrySelector({
  value = '',
  onChange,
  disabled = false,
  placeholder = "Select an industry",
  className
}: {
  value?: string;
  onChange: (industry: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const industries = useMemo(() => Array.from(new Set(INDUSTRY_LIST)), []);
  const filteredIndustries = search
    ? industries.filter(i => i.toLowerCase().includes(search.toLowerCase()))
    : industries;

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setOpen(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search && filteredIndustries.length > 0) {
      onChange(filteredIndustries[0]);
      setOpen(false);
      setSearch("");
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={search !== '' || !value ? search : value}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full text-sm pr-8"
          autoComplete="off"
        />
        {(search || value) && !disabled && (
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
          {filteredIndustries.length === 0 ? (
            <div className="px-3 py-2 text-muted-foreground text-sm">No industries found.</div>
          ) : (
            filteredIndustries.map(industry => (
              <div
                key={industry}
                className={cn(
                  "px-3 py-2 cursor-pointer hover:bg-accent text-sm",
                  value === industry && "bg-primary/10 text-primary font-semibold"
                )}
                onMouseDown={() => {
                  onChange(industry);
                  setOpen(false);
                  setSearch("");
                }}
              >
                {industry}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}