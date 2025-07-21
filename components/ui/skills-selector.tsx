import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { Badge } from './badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SKILLS_CATEGORIES = {
  "Programming Languages": [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Scala", "R", "MATLAB", "Dart", "Elixir", "Clojure", "Haskell", "Perl"
  ],
  "Frontend Development": [
    "Frontend", "Frontend Engineer", "Frontend Developer", "UI Engineer", "Web Developer",
    "React", "Vue.js", "Angular", "Svelte", "Next.js", "Nuxt.js", "HTML5", "CSS3", "Sass", "Less", "Tailwind CSS", "Bootstrap", "Material-UI", "Ant Design", "Webpack", "Vite", "Babel", "Redux", "Zustand", "GraphQL"
  ],
  "Backend Development": [
    "Backend", "Backend Engineer", "Backend Developer", "API Development", "Server-side Development",
    "Node.js", "Express.js", "Django", "Flask", "Spring Boot", "ASP.NET", "Laravel", "FastAPI", "Gin", "Echo", "Rails", "Phoenix", "Koa", "Hapi", "Strapi", "NestJS", "AdonisJS", "Meteor", "Sails.js"
  ],
  "Full Stack Development": [
    "Full Stack", "Full Stack Engineer", "Full Stack Developer", "MERN Stack", "MEAN Stack", "JAMstack", "Web Application Architecture", "End-to-End Development", "Cross-Stack Integration"
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
    "Business Analysis", "Business Planning", "Fundraising", "Pitching", "Negotiation", "Leadership", "Team Management", "Strategic Partnerships", "Go-to-Market Strategy", "Product-Market Fit", "Customer Development", "Financial Modeling", "Due Diligence", "Mergers & Acquisitions (M&A)", "Exit Strategy", "Board Management", "Legal Compliance", "Investor Relations", "Market Research", "Growth Strategy", "Operations", "Supply Chain Management", "Procurement", "Human Resources (HR)", "Recruiting", "Sales", "B2B Sales", "B2C Sales", "SaaS", "Pricing Strategy", "Customer Success", "Retention", "Churn Management", "OKRs", "KPIs", "Data Analysis", "Business Intelligence", "International Expansion", "Scaling", "Change Management", "Risk Management", "Product Management", "Project Management", "Agile", "Scrum", "Kanban", "Lean", "Six Sigma", "Business Strategy", "Competitive Analysis", "Business Development", "Marketing", "Customer Success", "Operations Management", "Budgeting",
    // Additional business/innovation/leadership skills
    "Business Model Innovation", "Lean Startup", "Customer Journey Mapping", "Value Proposition Design", "Stakeholder Management", "Corporate Governance", "Business Process Optimization", "Digital Transformation", "Organizational Design", "Employee Engagement", "Remote Team Management", "Diversity & Inclusion", "Fund Management", "Angel Investing", "Venture Capital", "Private Equity", "IPO Preparation", "Cap Table Management", "Financial Reporting", "Tax Strategy", "Grant Writing", "Government Relations", "Public Speaking", "Media Relations", "Brand Strategy", "Community Building", "Networking", "Event Planning", "Partnership Development", "Franchise Management", "Licensing", "Intellectual Property Strategy", "Patent Filing", "Trademark Management", "Crisis Management", "Turnaround Management", "Interim Management", "Business Coaching", "Mentoring", "Executive Search", "Talent Development", "Employee Onboarding", "Compensation Strategy", "Benefits Administration", "Workforce Planning", "Labor Relations", "Workplace Safety", "Sustainability Strategy", "ESG (Environmental, Social, Governance)", "Social Impact", "Nonprofit Management", "Philanthropy", "Volunteer Management"
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

const CATEGORY_COLORS: Record<string, string> = {
  "Programming Languages": "text-blue-700 bg-blue-100",
  "Frontend Development": "text-pink-700 bg-pink-100",
  "Backend Development": "text-green-700 bg-green-100",
  "Database & Storage": "text-yellow-700 bg-yellow-100",
  "DevOps & Cloud": "text-purple-700 bg-purple-100",
  "Mobile Development": "text-orange-700 bg-orange-100",
  "Data Science & AI": "text-cyan-700 bg-cyan-100",
  "Design & UX": "text-fuchsia-700 bg-fuchsia-100",
  "Business & Management": "text-amber-700 bg-amber-100",
  "Marketing & Growth": "text-lime-700 bg-lime-100",
  "Finance & Investment": "text-rose-700 bg-rose-100",
  "Industry Expertise": "text-teal-700 bg-teal-100",
  "Soft Skills": "text-gray-700 bg-gray-100",
  "Tools & Platforms": "text-indigo-700 bg-indigo-100",
};

export function SkillsSelector({
  value,
  onChange,
  categories = SKILLS_CATEGORIES,
  placeholder = "Search and select skills...",
  disabled = false,
  label = "Skills",
  showCount = true,
}: {
  value: string[];
  onChange: (skills: string[]) => void;
  categories?: typeof SKILLS_CATEGORIES;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  showCount?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const MAX_SKILLS = 5;

  // Flatten skills to [{ skill, category }], but allow duplicate skill names in different categories
  const allSkills: { skill: string; category: string }[] = React.useMemo(() => {
    const seen = new Set<string>();
    const result: { skill: string; category: string }[] = [];
    Object.entries(categories).forEach(([category, skills]) => {
      skills.forEach((skill) => {
        const key = `${skill}__${category}`;
        if (!seen.has(key)) {
          result.push({ skill, category });
          seen.add(key);
        }
      });
    });
    return result;
  }, [categories]);

  // Filtered skills for search
  const filteredSkills = search
    ? allSkills.filter(
        ({ skill }) =>
          skill.toLowerCase().includes(search.toLowerCase()) &&
          !value.includes(skill)
      )
    : [];

  // Add skill
  const addSkill = (skill: string) => {
    if (!value.includes(skill) && value.length < MAX_SKILLS) {
      onChange([...value, skill]);
      setSearch("");
      setOpen(false);
      inputRef.current?.focus();
    }
  };

  // Remove skill
  const removeSkill = (skill: string) => {
    onChange(value.filter((s) => s !== skill));
  };

  // Focus input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Allow typing in the field to search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setOpen(true);
  };

  // When user presses Enter, select the first filtered skill
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredSkills.length > 0) {
      addSkill(filteredSkills[0].skill);
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
    if (e.key === 'Backspace' && !search && value.length > 0) {
      // Remove last skill if input is empty
      removeSkill(value[value.length - 1]);
    }
  };

  const isAtLimit = value.length >= MAX_SKILLS;
  const countText = `${value.length}/${MAX_SKILLS}`;
  const inputPlaceholder = showCount
    ? (isAtLimit ? countText : `${placeholder} (${countText})`)
    : (isAtLimit ? "" : placeholder);

  return (
    <div className="relative w-full">
      <div className={cn("flex flex-wrap items-center gap-2 border rounded-md px-2 py-1 bg-background focus-within:ring-2 focus-within:ring-primary", disabled && "bg-muted")}
        onClick={() => inputRef.current?.focus()}
        tabIndex={-1}
      >
        {value.map((skill) => {
          const skillObj = allSkills.find((s) => s.skill === skill);
          const category = skillObj?.category;
          const key = category ? `${skill}-${category}` : skill;
          return (
            <Badge key={key} className="flex items-center gap-1 px-3 py-1 text-sm">
              {skill}
              {category && (
                <span className={cn("ml-2 rounded px-2 py-0.5 text-xs font-semibold", CATEGORY_COLORS[category] || "bg-gray-200 text-gray-700")}>{category}</span>
              )}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); removeSkill(skill); }}
                className="ml-1 hover:text-destructive transition-colors"
                aria-label={`Remove ${skill}`}
                tabIndex={-1}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
        <input
          ref={inputRef}
          value={search}
          onChange={handleInputChange}
          onFocus={() => !isAtLimit && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleInputKeyDown}
          placeholder={inputPlaceholder}
          disabled={disabled || isAtLimit}
          className="flex-1 min-w-[120px] border-0 bg-transparent outline-none text-sm py-1 px-2"
          autoComplete="off"
        />
        {(search || value.length > 0) && !disabled && (
          <button
            type="button"
            className="ml-1 text-muted-foreground hover:text-destructive"
            onClick={() => {
              setSearch("");
              onChange([]);
              inputRef.current?.focus();
            }}
            tabIndex={-1}
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && search && filteredSkills.length > 0 && !isAtLimit && (
        <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredSkills.map(({ skill, category }) => {
            const key = `${skill}-${category}`;
            return (
              <div
                key={key}
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                onMouseDown={() => addSkill(skill)}
              >
                <span>{skill}</span>
                <span className={cn("ml-2 rounded px-2 py-0.5 text-xs font-semibold", CATEGORY_COLORS[category] || "bg-gray-200 text-gray-700")}>{category}</span>
              </div>
            );
          })}
        </div>
      )}
      {open && search && filteredSkills.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-md shadow-lg p-3 text-center text-sm text-muted-foreground">
          No skills found.
        </div>
      )}
    </div>
  );
} 