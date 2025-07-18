"use client"

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, Users, Star, Globe, Mail, Search, UserCheck, PartyPopper } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { Confetti } from '@/components/ui/confetti';
import { CountrySelector } from '@/components/ui/country-selector';

const PROFILE_TYPES = [
  { value: 'Founder', label: 'Founder', icon: Briefcase, desc: 'Build and grow your own startup.' },
  { value: 'Investor', label: 'Investor', icon: Users, desc: 'Find and fund promising opportunities.' },
  { value: 'Expert', label: 'Expert/Freelance', icon: Star, desc: 'Offer your skills and expertise.' },
];

const FOUND_US_OPTIONS = [
  { value: 'social', label: 'Social Media', icon: Globe },
  { value: 'friend', label: 'Friend/Referral', icon: UserCheck },
  { value: 'search', label: 'Search Engine', icon: Search },
  { value: 'other', label: 'Other', icon: Mail },
];

// Import COUNTRIES from country-selector component (removed local COUNTRIES array)

// Professional role options grouped by type (extracted from profile-settings)
const ROLE_OPTIONS = {
  Investor: [
    { group: 'Individual Investors', options: [
      'Business Angel', 'Advisor (Investor + Advisor)', 'Crowdfunding Contributor',
    ] },
    { group: 'Private Investment Structures', options: [
      'Venture Capitalists (VC)', 'Family Office', 'Private Equity Firms',
    ] },
    { group: 'Public Structures', options: [
      'BPI (Business Public Investment)', 'Government-backed Funds', 'Incubators / Accelerators',
    ] },
    { group: 'Specialized Investment Funds', options: [
      'Crowdfunding', 'Impact Funds', 'Sector-Specific Funds',
    ] },
    { group: 'Other', options: [
      'Investor', 'Angel Investor', 'Venture Capitalist',
    ] },
  ],
  Founder: [
    { group: 'Founder Roles', options: [
      'Founder', 'Startup Owner', 'CEO', 'COO', 'CFO', 'Product Manager',
    ] },
    { group: 'Other', options: [
      'Business Development', 'Marketing Manager', 'Sales Manager',
    ] },
  ],
  Expert: [
    { group: 'Product & Design', options: [
      'Product Designer', 'UX/UI Designer', 'UX/UI Researcher', 'Graphic Designer', 'Social Media Manager', 'Brand Designer', 'Content Manager', 'Digital Designer', 'Interaction Designer', 'Web Designer',
    ] },
    { group: 'Tech & Development', options: [
      'CEO (Operational Tech Role)', 'CTO', 'Backend Developer', 'Frontend Developer', 'Full-stack Developer', 'Mobile Developer (iOS, Android)', 'No-code Developer', 'DevOps Engineer', 'QA Tester', 'Security Engineer', 'Cloud Architect', 'Blockchain Developer', 'AI/ML Engineer', 'Performance Engineer', 'Database Administrator (DBA)', 'Systems Architect',
    ] },
    { group: 'Growth & Marketing', options: [
      'Growth Hacker', 'Marketing Specialist', 'Performance Marketing Manager',
    ] },
    { group: 'Legal, Finance & Operations', options: [
      'Legal Counsel', 'Business Lawyer', 'Tax Lawyer', 'IP Lawyer (Intellectual Property)', 'Financial Analyst', 'Accountant', 'Bookkeeper', 'Tax Consultant', 'Fundraiser', 'IP Agent (Intellectual Property Agent)', 'Regulatory Affairs Specialist', 'Compliance Officer',
    ] },
    { group: 'HR & Training', options: [
      'Training and Development Manager', 'Employee Engagement Manager', 'HR Business Partner', 'Learning and Development Specialist', 'HR Coordinator',
    ] },
    { group: 'Mentorship & Advisory', options: [
      'Mentor', 'Advisor', 'Venture Partner', 'Portfolio Manager', 'Investment Advisor', 'Business Consultant', 'Startup Mentor', 'Growth Advisor',
    ] },
    { group: 'Other', options: [
      'Freelancer', 'Consultant', 'Expert', 'Coach', 'Other',
    ] },
  ],
};

const SKILLS_CATEGORIES = {
  "Programming Languages": [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Scala", "R", "MATLAB", "Dart", "Elixir", "Clojure", "Haskell", "Perl"
  ],
  "Frameworks": [
    "React", "Next.js", "Node.js", "Django", "Flask", "Express", "Spring Boot", "Laravel", "Ruby on Rails", "Vue.js", "Angular", "Svelte", "Nuxt.js", "Gatsby", "SvelteKit"
  ],
  "Databases": [
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra", "SQLite", "Firebase", "Neo4j", "CockroachDB"
  ],
  "Cloud Services": [
    "AWS", "Google Cloud", "Azure", "DigitalOcean", "Vercel", "Netlify", "Heroku", "Railway", "VPS", "Dedicated Servers"
  ],
  "DevOps": [
    "Docker", "Kubernetes", "Terraform", "Ansible", "Puppet", "Chef", "Jenkins", "GitLab CI", "GitHub Actions", "CircleCI"
  ],
  "Testing": [
    "JUnit", "Mocha", "Chai", "Cypress", "Playwright", "Selenium", "Jest", "Puppeteer", "WebdriverIO"
  ],
  "Version Control": [
    "Git", "GitHub", "GitLab", "Bitbucket", "SVN", "Mercurial"
  ],
  "Project Management": [
    "Jira", "Trello", "Asana", "Notion", "Toggl", "Clockify", "Harvest", "FreshBooks", "QuickBooks"
  ],
  "Communication": [
    "Slack", "Discord", "Zoom", "Microsoft Teams", "Google Meet", "Hangouts", "WhatsApp", "Telegram", "Signal"
  ],
  "Design": [
    "Figma", "Adobe XD", "Sketch", "InVision", "Zeplin", "Abstract", "Miro", "Mural", "Lucidchart"
  ],
  "Marketing": [
    "SEO", "SEM", "Content Marketing", "Social Media", "Email Marketing", "Paid Advertising", "Affiliate Marketing", "Influencer Marketing"
  ],
  "Business": [
    "Sales", "Customer Service", "Accounting", "HR", "Legal", "Operations", "Strategy", "UX/UI", "Product Management", "Data Science"
  ],
  "Other": [
    "Project Management", "Communication", "Design", "Marketing", "Business", "Other"
  ]
};

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    profile_type: '',
    full_name: '',
    professional_role: '',
    country: '',
    languages: '',
    found_us: '',
    found_us_other: '',
    company: '', // Added for Founder
  });
  const [completed, setCompleted] = useState(false);

  const [skillsSearchTerm, setSkillsSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isSkillsDropdownOpen, setIsSkillsDropdownOpen] = useState(false);
  const skillsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSkillsDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!skillsDropdownRef.current?.contains(target)) {
        setIsSkillsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSkillsDropdownOpen]);

  // Step 1: Welcome
  const WelcomeStep = (
    <motion.div key="welcome" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.5 }} className="relative flex flex-col items-center justify-center min-h-[60vh] text-center overflow-visible">
      <Confetti className="absolute inset-0 z-0 pointer-events-none" />
      <PartyPopper className="w-16 h-16 mb-6 text-primary z-10" />
      <h1 className="text-4xl font-bold mb-4 z-10">Welcome to SweatShares</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto z-10">
        SweatShares gives you the power to find opportunities, connect with like-minded individuals, securely share your important documents, and securely pay parties if you have a deal.
      </p>
      <Button size="lg" onClick={() => setStep(1)} className="mt-2 z-10">Get Started</Button>
    </motion.div>
  );

  // Step 2: Profile Type
  const ProfileTypeStep = (
    <motion.div key="profile-type" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.5 }} className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h2 className="text-2xl font-bold mb-4">Select your type of profile</h2>
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        {PROFILE_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            className={`flex flex-col items-center border rounded-xl px-8 py-6 shadow-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 ${formData.profile_type === type.value ? 'border-primary ring-2 ring-primary' : 'border-muted bg-muted/30 hover:border-primary/60'}`}
            onClick={() => setFormData({ ...formData, profile_type: type.value })}
          >
            <type.icon className="w-8 h-8 mb-2 text-primary" />
            <span className="font-semibold text-lg mb-1">{type.label}</span>
            <span className="text-sm text-muted-foreground">{type.desc}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" size="lg" onClick={() => setStep(0)} type="button">Back</Button>
        <Button size="lg" onClick={() => setStep(2)} disabled={!formData.profile_type}>Next</Button>
      </div>
    </motion.div>
  );

  const getFilteredSkills = () => {
    const allSkills = Object.values(SKILLS_CATEGORIES).flat();
    if (!skillsSearchTerm) return allSkills;
    return allSkills.filter(skill => skill.toLowerCase().includes(skillsSearchTerm.toLowerCase()));
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) return prev.filter(s => s !== skill);
      if (prev.length >= 5) return prev;
      return [...prev, skill];
    });
  };

  const handleSkillRemove = (skillToRemove: string) => {
    setSelectedSkills(prev => prev.filter(skill => skill !== skillToRemove));
  };

  // Step 3: User Info
  const getRoleLabel = (profileType: string) => {
    if (profileType === 'Investor') return 'What type of investor are you?';
    if (profileType === 'Expert') return 'What is your field of expertise?';
    if (profileType === 'Founder') return 'What is your role as a founder?';
    return 'Professional Role';
  };

  const UserInfoStep = (
    <motion.div key="user-info" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.5 }} className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h2 className="text-2xl font-bold mb-4">Tell us about yourself</h2>
      <form className="w-full max-w-md mx-auto space-y-5 text-left" onSubmit={e => { e.preventDefault(); setStep(3); }}>
        <div>
          <Label htmlFor="full_name" className="flex items-center gap-2"><User className="w-4 h-4 text-primary" /> What's your name?</Label>
          <Input id="full_name" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="professional_role" className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" /> {getRoleLabel(formData.profile_type)}</Label>
          <Select value={formData.professional_role} onValueChange={value => setFormData({ ...formData, professional_role: value })} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent className="max-h-[400px] w-[400px]">
              {ROLE_OPTIONS[formData.profile_type as keyof typeof ROLE_OPTIONS]?.map(group => (
                <div key={group.group}>
                  <div className="px-3 py-2 bg-muted/30">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{group.group}</div>
                  </div>
                  {group.options.map(option => (
                    <SelectItem key={option} value={option} className="pl-6">{option}</SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Founder: show company field */}
        {formData.profile_type === 'Founder' && (
          <div>
            <Label htmlFor="company" className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" /> Company</Label>
            <Input id="company" value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} placeholder="Enter your company or organization name" required className="mt-1" />
          </div>
        )}
        {/* Expert: show skills field */}
        {formData.profile_type === 'Expert' && (
          <div>
            <Label className="flex items-center gap-2">Skills</Label>
            <div className="space-y-3">
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map(skill => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="relative skills-dropdown" ref={skillsDropdownRef}>
                <div className="flex items-center gap-2">
                  <Input placeholder="Search and select skills..." value={skillsSearchTerm} onChange={e => setSkillsSearchTerm(e.target.value)} onFocus={() => setIsSkillsDropdownOpen(true)} className="flex-1" />
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsSkillsDropdownOpen(!isSkillsDropdownOpen)} disabled={selectedSkills.length >= 5}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {isSkillsDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-96 overflow-y-auto">
                    <div className="p-2">
                      {Object.entries(SKILLS_CATEGORIES).map(([category, skills]) => (
                        <div key={category} className="mb-4">
                          <h4 className="font-medium text-sm text-muted-foreground mb-2 px-2">{category}</h4>
                          <div className="grid grid-cols-2 gap-1">
                            {skills.filter(skill => skill.toLowerCase().includes(skillsSearchTerm.toLowerCase())).map(skill => (
                              <button key={skill} type="button" onClick={() => handleSkillToggle(skill)} className={`text-left px-2 py-1 rounded text-sm transition-colors ${selectedSkills.includes(skill) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`} disabled={selectedSkills.length >= 5 && !selectedSkills.includes(skill)}>{skill}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div>
          <Label htmlFor="country" className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Where are you located?</Label>
          <CountrySelector
            value={formData.country}
            onValueChange={value => setFormData({ ...formData, country: value })}
            placeholder="Select your country"
          />
        </div>
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" size="lg" onClick={() => setStep(1)} type="button">Back</Button>
          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!(formData.full_name && formData.professional_role && formData.country && (formData.profile_type !== 'Founder' || formData.company) && (formData.profile_type !== 'Expert' || selectedSkills.length > 0))}>Next</Button>
        </div>
      </form>
    </motion.div>
  );

  // Step 4: Where did you find us?
  const FoundUsStep = (
    <motion.div key="found-us" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.5 }} className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h2 className="text-2xl font-bold mb-4">Where did you find us?</h2>
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        {FOUND_US_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`flex flex-col items-center border rounded-xl px-8 py-6 shadow-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 ${formData.found_us === opt.value ? 'border-primary ring-2 ring-primary' : 'border-muted bg-muted/30 hover:border-primary/60'}`}
            onClick={() => setFormData({ ...formData, found_us: opt.value })}
          >
            <opt.icon className="w-8 h-8 mb-2 text-primary" />
            <span className="font-semibold text-lg mb-1">{opt.label}</span>
          </button>
        ))}
      </div>
      {formData.found_us === 'other' && (
        <div className="w-full max-w-xs mx-auto mb-4">
          <Input
            placeholder="Please specify..."
            value={formData.found_us_other}
            onChange={e => setFormData({ ...formData, found_us_other: e.target.value })}
          />
        </div>
      )}
      <div className="flex gap-3 justify-center">
        <Button variant="outline" size="lg" onClick={() => setStep(2)} type="button">Back</Button>
        <Button size="lg" onClick={async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
            await supabase.from('profiles').update({
              profile_type: formData.profile_type,
              full_name: formData.full_name,
          professional_role: formData.professional_role,
          country: formData.country,
              languages: formData.languages,
          onboarding_completed: true,
              found_us: formData.found_us === 'other' ? formData.found_us_other : formData.found_us,
          updated_at: new Date().toISOString(),
            }).eq('id', user.id);
            setCompleted(true);
            setTimeout(() => router.push('/dashboard/find-partner'), 1800);
    } catch (error) {
            toast({ title: 'Error saving profile', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
        }} disabled={!formData.found_us || (formData.found_us === 'other' && !formData.found_us_other) || loading}>
          {loading ? 'Saving...' : 'Finish'}
        </Button>
      </div>
    </motion.div>
  );

  // Step 5: Completion
  const CompletionStep = (
    <motion.div key="completion" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }} className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <PartyPopper className="w-16 h-16 mb-6 text-primary animate-bounce" />
      <h2 className="text-3xl font-bold mb-4">Welcome to SweatShares!</h2>
      <p className="text-lg text-muted-foreground mb-8">Your profile is ready. Let the journey begin!</p>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardContent>
          <AnimatePresence mode="wait">
            {completed ? CompletionStep :
              step === 0 ? WelcomeStep :
              step === 1 ? ProfileTypeStep :
              step === 2 ? UserInfoStep :
              step === 3 ? FoundUsStep : null}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
} 