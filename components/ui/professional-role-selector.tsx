import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Flat, deduplicated list of all roles from the old professional_role select
export const PROFESSIONAL_ROLES: string[] = [
  // Product & Design
  "Product Designer", "UX/UI Designer", "UX/UI Researcher", "Graphic Designer", "Social Media Manager", "Brand Designer", "Content Manager", "Digital Designer", "Interaction Designer", "Web Designer",
  // Tech & Development
  "CEO (Operational Tech Role)", "CTO", "Backend Developer", "Frontend Developer", "Full-stack Developer", "Mobile Developer (iOS, Android)", "No-code Developer", "DevOps Engineer", "QA Tester", "Security Engineer", "Cloud Architect", "Blockchain Developer", "AI/ML Engineer", "Performance Engineer", "Database Administrator (DBA)", "Systems Architect",
  // Growth & Marketing
  "Growth Hacker", "Marketing Specialist", "Performance Marketing Manager", "Customer Acquisition Manager", "Growth Manager", "Digital Marketing Specialist", "Event Manager", "Email Marketing Specialist", "Influencer Relations Manager", "PR Specialist", "Community Manager", "Content Strategist", "SEO/SEM Specialist", "Affiliate Marketing Manager", "Product Marketing Manager", "Brand Marketing Manager", "Partnership Manager",
  // Operations
  "Customer Support", "Customer Success Manager", "Operations Manager", "Supply Chain Manager", "Procurement Manager", "Logistics Manager", "Business Operations Analyst", "Facilities Manager", "Data Entry Specialist", "Business Process Analyst",
  // Legal, Finance & Operations
  "Legal Counsel", "Business Lawyer", "Tax Lawyer", "IP Lawyer (Intellectual Property)", "Financial Analyst", "Accountant", "Bookkeeper", "Tax Consultant", "Fundraiser", "IP Agent (Intellectual Property Agent)", "Regulatory Affairs Specialist", "Compliance Officer", "Sustainability Manager", "Risk Manager", "Insurance Manager", "Corporate Treasurer", "Investment Analyst", "Investor Relations Manager",
  // Human Resources & Recruiting
  "HR Manager", "Recruiter", "Talent Acquisition Specialist", "HR Generalist", "Compensation and Benefits Manager", "Training and Development Manager", "Employee Engagement Manager", "HR Business Partner", "Learning and Development Specialist", "HR Coordinator",
  // Mentorship & Advisory
  "Mentor", "Advisor", "Venture Partner", "Portfolio Manager", "Investment Advisor", "Business Consultant", "Startup Mentor", "Growth Advisor",
  // Individual Investors
  "Business Angel", "Advisor (Investor + Advisor)", "Crowdfunding Contributor",
  // Private Investment Structures
  "Venture Capitalists (VC)", "Family Office", "Private Equity Firms",
  // Public Structures
  "BPI (Business Public Investment)", "Government-backed Funds", "Incubators / Accelerators",
  // Specialized Investment Funds
  "Crowdfunding", "Impact Funds", "Sector-Specific Funds",
  // General
  "Founder", "Startup Owner", "CEO", "COO", "CFO", "Product Manager", "Software Engineer", "Data Scientist", "UI/UX Designer", "Marketing Manager", "Sales Manager", "Business Development", "Investor", "Angel Investor", "Venture Capitalist", "Freelancer", "Consultant", "Expert", "Coach", "Other"
];

export function ProfessionalRoleSelector({
  value = '',
  onChange,
  disabled = false,
  placeholder = "Select your profession",
  className
}: {
  value?: string;
  onChange: (role: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const roles = useMemo(() => Array.from(new Set(PROFESSIONAL_ROLES)), []);
  const filteredRoles = search
    ? roles.filter(r => r.toLowerCase().includes(search.toLowerCase()))
    : roles;

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
    if (e.key === 'Enter' && search && filteredRoles.length > 0) {
      onChange(filteredRoles[0]);
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
          {filteredRoles.length === 0 ? (
            <div className="px-3 py-2 text-muted-foreground text-sm">No profession found.</div>
          ) : (
            filteredRoles.map(role => (
              <div
                key={role}
                className={cn(
                  "px-3 py-2 cursor-pointer hover:bg-accent text-sm",
                  value === role && "bg-primary/10 text-primary font-semibold"
                )}
                onMouseDown={() => {
                  onChange(role);
                  setOpen(false);
                  setSearch("");
                }}
              >
                {role}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 