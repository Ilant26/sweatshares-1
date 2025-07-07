'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, X, Star, Zap, Crown, Shield, MessageCircle, FileText, Building, Users, Eye, TrendingUp, Lock, Signature, CreditCard, AlertCircle, DollarSign, Briefcase, Heart } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { cn } from '@/lib/utils';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  icon: React.ElementType;
  description: string;
  features: string[];
  popular?: boolean;
  cta: string;
  color: string;
  limitations?: string[];
}

interface UserProfile {
  profile_type?: string;
  current_plan?: string;
}

type PlanType = 'free' | 'starter' | 'pro' | 'premium' | 'investor_access';

interface PlanFeature {
  name: string;
  free: boolean | string;
  starter: boolean | string;
  pro: boolean | string;
  premium: boolean | string;
  investor_access?: boolean | string;
}

const FEATURES_LIST = [
  { id: 'create_missions', name: 'Create Missions/Listings', icon: Building },
  { id: 'view_profiles', name: 'View Profiles', icon: Eye },
  { id: 'messaging', name: 'Messaging', icon: MessageCircle },
  { id: 'invoices_basic', name: 'Basic Invoices', icon: FileText },
  { id: 'invoices_escrow', name: 'Escrow Invoices', icon: Shield },
  { id: 'invoices_payment_links', name: 'Payment Link Invoices', icon: CreditCard },
  { id: 'vault_access', name: 'Document Vault', icon: Lock },
  { id: 'electronic_signature', name: 'Electronic Signatures', icon: Signature },
  { id: 'pitch_deck_access', name: 'Pitch Deck Access', icon: FileText },
  { id: 'mission_boost', name: 'Mission Boost', icon: TrendingUp },
  { id: 'investor_access', name: 'Access to Investors', icon: Users },
  { id: 'priority_support', name: 'VIP Support', icon: Crown },
  { id: 'multi_mission', name: 'Multi-Mission Management', icon: Building },
  { id: 'unlimited_applications', name: 'Unlimited Applications', icon: Zap },
  { id: 'visibility_boost', name: 'Automatic Visibility Boost', icon: Star },
  { id: 'priority_matching', name: 'Priority Matching', icon: TrendingUp },
  { id: 'custom_alerts', name: 'Custom Email Alerts', icon: AlertCircle },
  { id: 'export_dealflow', name: 'Export Dealflow PDF', icon: FileText },
  { id: 'save_projects', name: 'Save Projects/Favorites', icon: Star },
];

const FOUNDER_PLANS: PricingPlan[] = [
  {
    id: 'founder_free',
    name: 'Free',
    price: 0,
    icon: Building,
    description: 'Perfect for getting started',
    features: [
      'Create unlimited missions',
      'View blurred profiles (name, photo, links)',
      'Basic invoices only',
      'No messaging',
      'No pitch deck access',
      'No mission boost'
    ],
    limitations: ['Limited profile visibility', 'No direct communication'],
    cta: 'Current Plan',
    color: 'border-gray-200'
  },
  {
    id: 'founder_starter',
    name: 'Starter',
    price: 29,
    icon: Zap,
    description: 'Essential features for active founders',
    features: [
      'View unblurred expert profiles',
      '15 messages/month',
      'Basic + Payment link invoices',
      'Document vault access',
      'No pitch deck access',
      'No mission boost'
    ],
    limitations: ['Limited messaging', 'No investor access'],
    cta: 'Upgrade to Starter',
    color: 'border-blue-200'
  },
  {
    id: 'founder_pro',
    name: 'Pro',
    price: 59,
    icon: Star,
    description: 'Advanced tools for serious founders',
    features: [
      'Unlimited messaging',
      'All invoice types (Basic, Payment Links, Escrow)',
      'Full vault access',
      'Electronic signatures',
      'No mission boost',
      'No investor access'
    ],
    popular: true,
    cta: 'Upgrade to Pro',
    color: 'border-blue-500'
  },
  {
    id: 'founder_premium',
    name: 'Premium',
    price: 99,
    icon: Crown,
    description: 'Complete platform access',
    features: [
      'Everything in Pro',
      'Mission boost',
      'Access to investors (messaging + alerts)',
      'VIP support',
      'Pitch deck access',
      'Multi-mission management'
    ],
    cta: 'Upgrade to Premium',
    color: 'border-purple-500'
  }
];

const EXPERT_PLANS: PricingPlan[] = [
  {
    id: 'expert_free',
    name: 'Free',
    price: 0,
    icon: Building,
    description: 'Get started finding opportunities',
    features: [
      'View blurred missions (name, photo, links)',
      '1 reply/month',
      'Basic invoices only',
      'No messaging',
      'No pitch deck access'
    ],
    limitations: ['Very limited engagement', 'Minimal visibility'],
    cta: 'Current Plan',
    color: 'border-gray-200'
  },
  {
    id: 'expert_pro',
    name: 'Pro',
    price: 19,
    icon: Star,
    description: 'Essential tools for professionals',
    features: [
      'Unlimited messaging',
      'Unblurred missions',
      '10 applications/month',
      'All invoice types',
      'Secure document vault',
      'No pitch deck access'
    ],
    popular: true,
    cta: 'Upgrade to Pro',
    color: 'border-green-500'
  },
  {
    id: 'expert_premium',
    name: 'Premium',
    price: 35,
    icon: Crown,
    description: 'Maximum visibility and opportunities',
    features: [
      'Everything in Pro',
      'Unlimited applications',
      'Automatic visibility boost',
      'Priority matching',
      'Pitch deck access',
      'Mission/contract/escrow tracking'
    ],
    cta: 'Upgrade to Premium',
    color: 'border-green-600'
  }
];

const INVESTOR_PLANS: PricingPlan[] = [
  {
    id: 'investor_free',
    name: 'Free',
    price: 0,
    icon: Building,
    description: 'Browse startup opportunities',
    features: [
      'View blurred startups (name, photo, links)',
      'Search with filters',
      'Basic invoices only',
      'No messaging',
      'No pitch deck access'
    ],
    limitations: ['Limited startup information', 'No direct contact'],
    cta: 'Current Plan',
    color: 'border-gray-200'
  },
  {
    id: 'investor_access',
    name: 'Investor Access',
    price: 39,
    icon: Eye,
    description: 'Essential dealflow tools',
    features: [
      'Unblurred startup profiles',
      'Custom email alerts',
      'Save projects/favorites',
      'All invoice types',
      'No pitch deck access',
      'Limited messaging'
    ],
    cta: 'Upgrade to Access',
    color: 'border-yellow-400'
  },
  {
    id: 'investor_pro',
    name: 'Pro',
    price: 79,
    icon: Crown,
    description: 'Complete investor toolkit',
    features: [
      'Everything in Access',
      'Unlimited messaging',
      'Export dealflow PDF',
      'Pitch deck access',
      'Favorites management',
      'Dedicated support'
    ],
    popular: true,
    cta: 'Upgrade to Pro',
    color: 'border-yellow-600'
  }
];

export default function PricingPage() {
  const { user } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('profile_type')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, supabase]);

  const getCurrentPlans = () => {
    const profileType = userProfile.profile_type?.toLowerCase();
    switch (profileType) {
      case 'founder':
        return FOUNDER_PLANS;
      case 'expert':
        return EXPERT_PLANS;
      case 'investor':
        return INVESTOR_PLANS;
      default:
        return FOUNDER_PLANS; // Default fallback
    }
  };

  const getCurrentPlanName = () => {
    const profileType = userProfile.profile_type?.toLowerCase();
    
    // This would come from user's subscription data in a real implementation
    // For demo purposes, we'll show different plans based on profile type
    switch (profileType) {
      case 'founder':
        return 'Free';
      case 'expert':
        return 'Free'; 
      case 'investor':
        return 'Free';
      default:
        return 'Free';
    }
  };

  const getDiscountedPrice = (price: number) => {
    return isAnnual ? Math.round(price * 10) : price; // Annual = 10 months price (2 months free)
  };

  const plans = getCurrentPlans();
  const currentPlan = getCurrentPlanName();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          My Current Plan: <span className="text-primary">{getCurrentPlanName()}</span>
          {userProfile.profile_type && (
            <div className="text-2xl text-muted-foreground mt-2">
              {userProfile.profile_type} Plan
            </div>
          )}
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          {userProfile.profile_type ? `Plans designed for ${userProfile.profile_type}s` : 'Select the perfect plan for your needs'}
        </p>
        
        {/* Profile Type Badge */}
        {userProfile.profile_type && (
          <div className="flex justify-center mb-6">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Current Role: {userProfile.profile_type}
            </Badge>
          </div>
        )}

        {/* Annual/Monthly Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Label htmlFor="billing-toggle" className={cn("text-sm", !isAnnual && "font-semibold")}>
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
          />
          <div className="flex items-center gap-2">
            <Label htmlFor="billing-toggle" className={cn("text-sm", isAnnual && "font-semibold")}>
              Annual
            </Label>
            <Badge variant="secondary" className="text-xs">
              2 months free
            </Badge>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const price = getDiscountedPrice(plan.price);
          const isCurrentPlan = plan.name.toLowerCase() === currentPlan.toLowerCase();
          
          return (
            <Card
              key={plan.id}
              className={cn(
                "relative transition-all duration-200 hover:shadow-lg",
                plan.color,
                plan.popular && "ring-2 ring-primary",
                isCurrentPlan && "bg-muted/50"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold">
                      ${price}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      /{isAnnual ? 'year' : 'month'}
                    </span>
                  </div>
                  {isAnnual && plan.price > 0 && (
                    <div className="text-sm text-muted-foreground line-through">
                      ${plan.price * 12}/year
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <Button 
                  className="w-full mb-6" 
                  variant={plan.popular ? "default" : "outline"}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? "Current Plan" : plan.cta}
                </Button>
                
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.limitations && plan.limitations.map((limitation, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Feature Comparison
        </h2>
        
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Feature Names Column */}
              <div className="lg:col-span-1">
                <div className="h-12 flex items-center font-semibold bg-muted rounded-t-lg px-4">
                  Features
                </div>
                {FEATURES_LIST.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.id}
                      className="h-12 flex items-center gap-2 px-4 border-b border-border"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{feature.name}</span>
                    </div>
                  );
                })}
              </div>

              {/* Plan Columns */}
              {plans.map((plan) => (
                <div key={plan.id} className="lg:col-span-1">
                  <div className={cn(
                    "h-12 flex items-center justify-center font-semibold rounded-t-lg px-4",
                    plan.popular ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {plan.name}
                  </div>
                  {FEATURES_LIST.map((feature) => {
                    // Determine if feature is included based on plan logic
                    const isIncluded = getFeatureIncluded(feature.id, plan.id);
                    const isLimited = getFeatureLimited(feature.id, plan.id);
                    
                    return (
                      <div
                        key={feature.id}
                        className="h-12 flex items-center justify-center border-b border-border"
                      >
                        {isLimited ? (
                          <Badge variant="outline" className="text-xs">
                            Limited
                          </Badge>
                        ) : isIncluded ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add-ons Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Add-ons & À la Carte Services
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Mission Boost
              </CardTitle>
              <CardDescription>
                Increase visibility for your mission
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-4">$25</div>
              <p className="text-sm text-muted-foreground mb-4">
                Boost your mission to the top of search results for 7 days
              </p>
              <Button variant="outline" className="w-full">
                Add Boost
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Signature className="h-5 w-5" />
                Electronic Signature
              </CardTitle>
              <CardDescription>
                Per document signing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-4">$9</div>
              <p className="text-sm text-muted-foreground mb-4">
                Secure electronic document signing
              </p>
              <Button variant="outline" className="w-full">
                Use Service
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Escrow Transaction
              </CardTitle>
              <CardDescription>
                Secure payment processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-4">$9</div>
              <p className="text-sm text-muted-foreground mb-4">
                Per transaction escrow service (excluding equity)
              </p>
              <Button variant="outline" className="w-full">
                Use Service
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper functions to determine feature availability
function getFeatureIncluded(featureId: string, planId: string): boolean {
  const featureMatrix: Record<string, string[]> = {
    // Features available in each plan
    'founder_free': ['create_missions', 'invoices_basic'],
    'founder_starter': ['create_missions', 'view_profiles', 'messaging', 'invoices_basic', 'invoices_payment_links', 'vault_access'],
    'founder_pro': ['create_missions', 'view_profiles', 'messaging', 'invoices_basic', 'invoices_payment_links', 'invoices_escrow', 'vault_access', 'electronic_signature'],
    'founder_premium': ['create_missions', 'view_profiles', 'messaging', 'invoices_basic', 'invoices_payment_links', 'invoices_escrow', 'vault_access', 'electronic_signature', 'pitch_deck_access', 'mission_boost', 'investor_access', 'priority_support', 'multi_mission'],
    
    'expert_free': ['invoices_basic'],
    'expert_pro': ['messaging', 'view_profiles', 'invoices_basic', 'invoices_payment_links', 'invoices_escrow', 'vault_access'],
    'expert_premium': ['messaging', 'view_profiles', 'invoices_basic', 'invoices_payment_links', 'invoices_escrow', 'vault_access', 'unlimited_applications', 'visibility_boost', 'priority_matching', 'pitch_deck_access'],
    
    'investor_free': ['view_profiles', 'invoices_basic'],
    'investor_access': ['view_profiles', 'custom_alerts', 'save_projects', 'invoices_basic', 'invoices_payment_links', 'invoices_escrow'],
    'investor_pro': ['view_profiles', 'messaging', 'custom_alerts', 'save_projects', 'invoices_basic', 'invoices_payment_links', 'invoices_escrow', 'export_dealflow', 'pitch_deck_access', 'priority_support'],
  };

  return featureMatrix[planId]?.includes(featureId) || false;
}

function getFeatureLimited(featureId: string, planId: string): boolean {
  const limitedFeatures: Record<string, string[]> = {
    'founder_starter': ['messaging'], // 15 messages/month
    'expert_free': ['messaging'], // 1 reply/month
    'expert_pro': ['unlimited_applications'], // 10 applications/month
    'investor_access': ['messaging'], // Limited messaging
  };

  return limitedFeatures[planId]?.includes(featureId) || false;
} 