"use client"

import { useState } from 'react';
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
  });
  const [completed, setCompleted] = useState(false);

  // Step 1: Welcome
  const WelcomeStep = (
    <motion.div key="welcome" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.5 }} className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <PartyPopper className="w-16 h-16 mb-6 text-primary" />
      <h1 className="text-4xl font-bold mb-4">Welcome to SweatShares</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
        SweatShares gives you the power to find opportunities, connect with like-minded individuals, securely share your important documents, and securely pay parties if you have a deal.
      </p>
      <Button size="lg" onClick={() => setStep(1)} className="mt-2">Get Started</Button>
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

  // Step 3: User Info
  const UserInfoStep = (
    <motion.div key="user-info" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.5 }} className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h2 className="text-2xl font-bold mb-4">Tell us about yourself</h2>
      <form className="w-full max-w-md mx-auto space-y-5 text-left" onSubmit={e => { e.preventDefault(); setStep(3); }}>
        <div>
          <Label htmlFor="full_name" className="flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Full Name</Label>
          <Input id="full_name" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="professional_role" className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" /> Professional Role</Label>
          <Input id="professional_role" value={formData.professional_role} onChange={e => setFormData({ ...formData, professional_role: e.target.value })} required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="country" className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Country</Label>
          <Input id="country" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="languages" className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> Languages (comma-separated)</Label>
          <Input id="languages" value={formData.languages} onChange={e => setFormData({ ...formData, languages: e.target.value })} required className="mt-1" />
        </div>
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" size="lg" onClick={() => setStep(1)} type="button">Back</Button>
          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!(formData.full_name && formData.professional_role && formData.country && formData.languages)}>Next</Button>
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