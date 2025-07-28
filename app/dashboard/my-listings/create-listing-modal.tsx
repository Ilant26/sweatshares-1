import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { CountrySelector } from '@/components/ui/country-selector';
import { SkillsSelector } from '@/components/ui/skills-selector';
import { IndustrySelector } from '@/components/ui/industry-selector';

// Comprehensive skills list organized by categories
const SKILLS_CATEGORIES = {
    "Programming Languages": [
        "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Scala", "R", "MATLAB", "Dart", "Elixir", "Clojure", "Haskell", "Perl"
    ],
    "Frontend Development": [
        "React", "Vue.js", "Angular", "Svelte", "Next.js", "Nuxt.js", "HTML5", "CSS3", "Sass", "Less", "Tailwind CSS", "Bootstrap", "Material-UI", "Ant Design", "Webpack", "Vite", "Babel", "Redux", "Zustand", "GraphQL"
    ],
    "Backend Development": [
        "Node.js", "Express.js", "Django", "Flask", "Spring Boot", "ASP.NET", "Laravel", "FastAPI", "Gin", "Echo", "Rails", "Phoenix", "Koa", "Hapi", "Strapi", "NestJS", "AdonisJS", "Meteor", "Sails.js"
    ],
    "Database & Storage": [
        "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Oracle", "SQL Server", "Cassandra", "DynamoDB", "Firebase", "Supabase", "Elasticsearch", "InfluxDB", "Neo4j", "ArangoDB", "CouchDB", "RethinkDB"
    ],
    "DevOps & Cloud": [
        "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud", "Heroku", "DigitalOcean", "Vercel", "Netlify", "Terraform", "Ansible", "Jenkins", "GitLab CI", "GitHub Actions", "CircleCI", "Travis CI", "Prometheus", "Grafana", "ELK Stack"
    ],
    "Mobile Development": [
        "React Native", "Flutter", "Ionic", "Xamarin", "Native iOS", "Native Android", "Cordova", "PhoneGap", "Expo", "Kotlin Multiplatform", "SwiftUI", "Jetpack Compose"
    ],
    "Data Science & AI": [
        "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy", "Matplotlib", "Seaborn", "Jupyter", "Apache Spark", "Hadoop", "Data Analysis", "Statistical Modeling", "Natural Language Processing", "Computer Vision", "Reinforcement Learning", "Neural Networks", "Big Data", "Data Visualization"
    ],
    "Design & UX": [
        "UI/UX Design", "Figma", "Sketch", "Adobe XD", "InVision", "Framer", "Adobe Photoshop", "Adobe Illustrator", "Adobe InDesign", "Prototyping", "Wireframing", "User Research", "Usability Testing", "Design Systems", "Brand Identity", "Visual Design", "Interaction Design", "Information Architecture", "Accessibility Design"
    ],
    "Business & Management": [
        "Product Management", "Project Management", "Agile", "Scrum", "Kanban", "Lean", "Six Sigma", "Business Strategy", "Market Research", "Competitive Analysis", "Business Development", "Sales", "Marketing", "Customer Success", "Operations Management", "Financial Modeling", "Budgeting", "Risk Management", "Change Management", "Leadership"
    ],
    "Marketing & Growth": [
        "Digital Marketing", "SEO", "SEM", "Social Media Marketing", "Content Marketing", "Email Marketing", "Influencer Marketing", "Affiliate Marketing", "Growth Hacking", "Conversion Optimization", "Analytics", "Google Analytics", "Facebook Ads", "Google Ads", "Marketing Automation", "Brand Management", "Public Relations", "Event Marketing", "Video Marketing"
    ],
    "Finance & Investment": [
        "Financial Analysis", "Venture Capital", "Angel Investing", "Private Equity", "Investment Banking", "Financial Modeling", "Due Diligence", "Portfolio Management", "Risk Assessment", "Mergers & Acquisitions", "IPO", "Fundraising", "Pitch Decks", "Valuation", "Accounting", "Tax Planning", "Compliance", "Regulatory Affairs"
    ],
    "Industry Expertise": [
        "SaaS", "Fintech", "Healthtech", "Edtech", "E-commerce", "Marketplace", "B2B", "B2C", "Enterprise Software", "Consumer Apps", "Gaming", "Media & Entertainment", "Real Estate", "Transportation", "Logistics", "Manufacturing", "Retail", "Food & Beverage", "Fashion", "Sports", "Travel", "Energy", "Sustainability", "Blockchain", "Cryptocurrency", "NFTs", "Web3", "DeFi", "IoT", "Robotics", "Space Technology", "Biotechnology", "Pharmaceuticals", "Clean Energy", "Cybersecurity", "Data Privacy", "Compliance"
    ],
    "Soft Skills": [
        "Leadership", "Communication", "Team Building", "Problem Solving", "Critical Thinking", "Creativity", "Adaptability", "Time Management", "Negotiation", "Conflict Resolution", "Mentoring", "Coaching", "Public Speaking", "Presentation Skills", "Strategic Thinking", "Decision Making", "Innovation", "Collaboration", "Networking", "Cultural Intelligence"
    ],
    "Tools & Platforms": [
        "Git", "GitHub", "GitLab", "Bitbucket", "Slack", "Discord", "Microsoft Teams", "Zoom", "Notion", "Airtable", "Trello", "Asana", "Monday.com", "Jira", "Confluence", "Miro", "Loom", "Canva", "Zapier", "Make", "HubSpot", "Salesforce", "Stripe", "PayPal", "Shopify", "WooCommerce", "WordPress", "Webflow", "Squarespace", "Wix"
    ]
};

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
  skills: string[];
  setSkills: (v: string[]) => void;
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
  // Skills state management

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? 'Edit Opportunity' : 'Create New Opportunity'}</DialogTitle>
          <DialogDescription>
            Fill in the details for your {editingId ? 'opportunity' : 'new opportunity'}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Profile Selector */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="profileType" className="text-right">I am a <span className="text-destructive">*</span></Label>
            <Select onValueChange={v => {
              setProfileType(v);
              if (!v) setSector("");
            }} value={profileType} disabled={editingId !== null}>
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
          {/* Industry */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sector" className="text-right">Industry</Label>
            <div className="col-span-3">
              <IndustrySelector
                value={sector}
                onChange={setSector}
                disabled={isCreating}
                placeholder="Select an industry"
              />
            </div>
          </div>
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
              <Label className="text-right">Skills</Label>
              <div className="col-span-3">
                <SkillsSelector
                  value={skills}
                  onChange={setSkills}
                  disabled={isCreating}
                />
              </div>
            </div>
          )}
          {/* Location */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="locationCountry" className="text-right">Location</Label>
            <div className="col-span-3 flex gap-2">
              <CountrySelector
                value={locationCountry}
                onValueChange={setLocationCountry}
                placeholder="Select a country"
                className="w-1/2"
              />
              <Input id="locationCity" placeholder="City (optional)" className="w-1/2" value={locationCity} onChange={e => setLocationCity(e.target.value)} />
            </div>
          </div>
          {/* Compensation Type / Equity Offered */}
          {(profileType === "founder" || profileType === "investor" || profileType === "expert") && 
            !(profileType === "founder" && listingType === "sell-startup") &&
            !(profileType === "investor" && ["investment-opportunity", "buy-startup", "co-investor"].includes(listingType)) && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="compensationType" className="text-right">
                {(profileType === "founder" && listingType === "find-funding") ? "Equity Offered" : "Compensation Type"}
              </Label>
              <div className="col-span-3 flex flex-col gap-2">
                <Select value={compensationType} onValueChange={setCompensationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select compensation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Always show these options for founder + expert-freelance for debugging */}
                    {profileType === "founder" && listingType === "expert-freelance" && (
                      <>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Equity">Equity</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                      </>
                    )}
                    
                    {/* Other founder options */}
                    {profileType === "founder" && listingType === "find-funding" && (
                      <SelectItem value="Equity">Equity</SelectItem>
                    )}
                    
                    {profileType === "founder" && listingType === "cofounder" && (
                      <>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Equity">Equity</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                      </>
                    )}
                    
                    {profileType === "founder" && (listingType === "employee" || listingType === "mentor") && (
                      <>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Salary">Salary</SelectItem>
                        <SelectItem value="Equity">Equity</SelectItem>
                        <SelectItem value="Salary & Equity">Salary & Equity</SelectItem>
                        <SelectItem value="Cash & Equity">Cash & Equity</SelectItem>
                      </>
                    )}

                    {/* Expert options */}
                    {profileType === "expert" && listingType === "mission" && (
                      <>
                        <SelectItem value="Equity">Equity</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                      </>
                    )}
                    
                    {profileType === "expert" && listingType === "cofounder" && (
                      <>
                        <SelectItem value="Equity">Equity</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                      </>
                    )}
                    
                    {profileType === "expert" && listingType === "job" && (
                      <>
                        <SelectItem value="Salary">Salary</SelectItem>
                        <SelectItem value="Equity">Equity</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                      </>
                    )}
                    
                    {profileType === "expert" && listingType === "expert-freelance" && (
                      <SelectItem value="Cash">Cash</SelectItem>
                    )}

                    {/* Investor options */}
                    {profileType === "investor" && listingType === "expert-freelance" && (
                      <SelectItem value="Cash">Cash</SelectItem>
                    )}
                    
                    {profileType === "investor" && listingType !== "expert-freelance" && !["investment-opportunity", "buy-startup", "co-investor"].includes(listingType) && (
                      <>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Equity">Equity</SelectItem>
                        <SelectItem value="Salary">Annual Salary</SelectItem>
                        <SelectItem value="Volunteer">Volunteer</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {compensationType === 'Cash' && (
                  <Input placeholder="Cash amount (ex: $5000)" value={compensationValue.value || compensationValue || ''} onChange={e => setCompensationValue({ value: e.target.value })} />
                )}
                {compensationType === 'Equity' && (
                  <Input placeholder="Equity (ex: 5-10%)" value={compensationValue.value || compensationValue || ''} onChange={e => setCompensationValue({ value: e.target.value })} />
                )}
                {compensationType === 'Salary' && (
                  <Input placeholder="Salary (ex: $40-50K)" value={compensationValue.value || compensationValue || ''} onChange={e => setCompensationValue({ value: e.target.value })} />
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
          {/* Amount (Founder & Investor only) */}
          {((profileType === "founder" && listingType === "find-funding") ||
            (profileType === "investor" && !["investment-opportunity", "buy-startup", "co-investor"].includes(listingType)) ||
            (profileType === "expert" && !["mission", "job", "expert-freelance", "cofounder"].includes(listingType))) && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                {(profileType === "founder" && listingType === "find-funding") ? "Amount Seeking" : "Investment Amount"}
              </Label>
              <Input 
                id="amount" 
                placeholder={(profileType === "founder" && listingType === "find-funding") ? "Ex: $1M - $5M" : "Ex: $10000"} 
                className="col-span-3" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
              />
            </div>
          )}

          {/* Investment Capacity for investors looking for opportunities or buying startups */}
          {(profileType === "investor" && (listingType === "investment-opportunity" || listingType === "buy-startup")) && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="investmentCapacity" className="text-right">
                Investment Capacity <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="investmentCapacity" 
                placeholder={listingType === "buy-startup" ? "Ex: $1M - $5M for acquisition" : "Ex: $100K - $500K per deal"}
                className="col-span-3" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
              />
            </div>
          )}

          {/* Missing Capital and Equity Offered for co-investor search */}
          {(profileType === "investor" && listingType === "co-investor") && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="missingCapital" className="text-right">
                  Missing Capital <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="missingCapital" 
                  placeholder="Ex: $500K needed to complete the round"
                  className="col-span-3" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="equityOffered" className="text-right">
                  Equity Offered <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="equityOffered" 
                  placeholder="Ex: 15-20% for co-investor"
                  className="col-span-3" 
                  value={compensationValue.value || compensationValue || ''} 
                  onChange={e => setCompensationValue({ value: e.target.value })} 
                />
              </div>
            </>
          )}

          {/* Sale Price and Percentage for founders selling startup */}
          {profileType === "founder" && listingType === "sell-startup" && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="salePrice" className="text-right">
                  Sale Price <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="salePrice" 
                  placeholder="Ex: $500K - $1M"
                  className="col-span-3" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="salePercentage" className="text-right">
                  Percentage for Sale <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="salePercentage" 
                  placeholder="Ex: 100% for full sale, or 20-40% for partial"
                  className="col-span-3" 
                  value={compensationValue.value || compensationValue || ''} 
                  onChange={e => setCompensationValue({ value: e.target.value })} 
                />
              </div>
            </>
          )}

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
          <Button onClick={onSubmit} disabled={isCreating}>{isCreating ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Opportunity' : 'Create Opportunity')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 