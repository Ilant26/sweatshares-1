import React, { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Input } from './input';
import { Label } from './label';

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
  value,
  onChange,
  disabled = false,
  placeholder = "Select your profession"
}: {
  value: string;
  onChange: (role: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [search, setSearch] = useState("");
  // Deduplicate roles
  const roles = useMemo(() => Array.from(new Set(PROFESSIONAL_ROLES)), []);
  const filteredRoles = search
    ? roles.filter(r => r.toLowerCase().includes(search.toLowerCase()))
    : roles;

  // Handler to support clear option
  const handleValueChange = (role: string) => {
    if (role === '__clear__') {
      onChange("");
    } else {
      onChange(role);
    }
  };

  return (
    <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-60 w-full">
        <SelectItem value="__clear__">Clear</SelectItem>
        <div className="px-2 py-1">
          <Input
            placeholder="Search profession..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs"
          />
        </div>
        <div className="max-h-48 overflow-y-auto">
          {filteredRoles.map(role => (
            <SelectItem key={role} value={role}>{role}</SelectItem>
          ))}
        </div>
      </SelectContent>
    </Select>
  );
} 