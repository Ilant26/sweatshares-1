
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, DollarSign, Building2, Briefcase, ArrowLeft, Clock, Users, Target, Award, Heart, Share2, Star } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { DashboardProfileCard } from './profile-card';
import { motion, Variants } from 'framer-motion';
import { useSession } from '@/components/providers/session-provider';

import { useFavorites } from '@/hooks/use-favorites';
import { useToast } from '@/components/ui/use-toast';

// Function to format listing type values for display
const formatListingType = (listingType: string): string => {
  const typeMap: { [key: string]: string } = {
    // Founder listing types
    "find-funding": "Find Funding",
    "cofounder": "Co Founder",
    "expert-freelance": "Expert/ Freelance",
    "employee": "Employee",
    "mentor": "Mentor",
    "sell-startup": "Startup Sale",

    // Investor listing types
    "investment-opportunity": "Investment Opportunity",
    "buy-startup": "Buy Startup",
    "co-investor": "Co-investor",

    // Expert listing types
    "mission": "Mission",
    "job": "Job"
  };

  return typeMap[listingType] || listingType;
};

const getSkillColor = (skill: string) => {
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-purple-100 text-purple-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-orange-100 text-orange-800',
    'bg-indigo-100 text-indigo-800',
    'bg-teal-100 text-teal-800',
  ];
  const index = skill.length % colors.length;
  return colors[index];
};

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      duration: 0.8
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      type: "spring",
      bounce: 0.2,
      stiffness: 50
    }
  }
};

interface DashboardListingContentProps {
  listing: any;
  profile: any;
}

export function DashboardListingContent({ listing, profile }: DashboardListingContentProps) {
  const { user } = useSession();
  const { likeListing, unlikeListing, isListingLiked } = useFavorites();
  const { toast } = useToast();
  const isOwnListing = user?.id === listing.user_id;

  const handleLikeListing = async () => {
    if (!user) return;

    if (isListingLiked(listing.id)) {
      await unlikeListing(listing.id);
      toast({
        title: "Retiré des favoris",
        description: "Cette annonce a été retirée de vos favoris",
      });
    } else {
      await likeListing(listing.id);
      toast({
        title: "Ajouté aux favoris",
        description: "Cette annonce a été ajoutée à vos favoris",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: listing.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié",
        description: "Le lien de l'annonce a été copié dans le presse-papiers",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <motion.div 
        className="max-w-5xl mx-auto p-6 space-y-8 flex-1 w-full"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="pt-6">
          {/* Back Button */}
          <motion.div variants={itemVariants} className="mb-6">
            <Link href="/dashboard/listings">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour aux annonces
              </Button>
            </Link>
          </motion.div>

          {/* Profile Card */}
          <motion.div variants={itemVariants} className="mb-8">
            <DashboardProfileCard profile={profile} />
          </motion.div>

          {/* Listing Card */}
          <motion.div variants={itemVariants}>
            <Card className="mb-8 border-none shadow-lg bg-white dark:bg-zinc-900/50">
              <CardHeader className="pb-4">
                <motion.div 
                  className="flex flex-wrap gap-2 mb-4"
                  variants={itemVariants}
                >
                  <Badge variant="default" className="text-sm px-3 py-1">{listing.profile_type}</Badge>
                  <Badge variant="secondary" className="text-sm px-3 py-1">{formatListingType(listing.listing_type)}</Badge>
                  {listing.sector && <Badge variant="outline" className="text-sm px-3 py-1">{listing.sector}</Badge>}
                </motion.div>
                <motion.div variants={itemVariants}>
                  <CardTitle className="text-3xl font-bold tracking-tight">{listing.title}</CardTitle>
                </motion.div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Key Information */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                  variants={containerVariants}
                >
                  <motion.div variants={itemVariants} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date de publication</p>
                      <p className="font-medium">{listing.created_at ? new Date(listing.created_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </motion.div>
                  {listing.amount && (
                    <motion.div variants={itemVariants} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Montant d'investissement</p>
                        <p className="font-medium">{listing.amount}</p>
                      </div>
                    </motion.div>
                  )}
                  <motion.div variants={itemVariants} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Localisation</p>
                      <p className="font-medium">{listing.location_country} {listing.location_city && `, ${listing.location_city}`}</p>
                    </div>
                  </motion.div>
                  {listing.funding_stage && (
                    <motion.div variants={itemVariants} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Étape</p>
                        <p className="font-medium">{listing.funding_stage}</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Description */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <h4 className="text-xl font-semibold">Description</h4>
                  </div>
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:text-muted-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-md prose-img:shadow-md
                    [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1
                    [&_p]:my-2 [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_h4]:text-base
                    [&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic
                    [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:overflow-x-auto
                    [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
                    [&_hr]:my-4 [&_hr]:border-muted"
                    dangerouslySetInnerHTML={{ __html: listing.description || '' }}
                  />
                </motion.div>

                {/* Skills */}
                {listing.skills && (
                  <motion.div variants={itemVariants}>
                    <Separator className="my-8" />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        <h4 className="text-xl font-semibold">Compétences</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {listing.skills.split(',').map((skill: string, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Badge className={`text-sm px-3 py-1 ${getSkillColor(skill.trim())}`}>
                              {skill.trim()}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Compensation */}
                {listing.compensation_value && (
                  <motion.div variants={itemVariants}>
                    {(() => {
                      const entries = Object.entries(listing.compensation_value).filter(([_, v]) => v && v !== '');
                      if (entries.length === 0) return null;
                      return (
                        <>
                          <Separator className="my-8" />
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-5 w-5 text-primary" />
                              <h4 className="text-xl font-semibold">Rémunération</h4>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                              <p className="font-medium">
                                {listing.compensation_type}
                                {listing.compensation_value && (
                                  (() => {
                                    if (typeof listing.compensation_value === 'object') {
                                      const val = listing.compensation_value;
                                      return ' - ' + Object.entries(val).map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`).join(' | ');
                                    } else {
                                      try {
                                        const parsed = JSON.parse(listing.compensation_value);
                                        if (typeof parsed === 'object') {
                                          return ' - ' + Object.entries(parsed).map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`).join(' | ');
                                        }
                                      } catch {
                                        return ` - ${listing.compensation_value}`;
                                      }
                                      return ` - ${listing.compensation_value}`;
                                    }
                                  })()
                                )}
                              </p>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div variants={itemVariants}>
                  <Separator className="my-8" />
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex gap-3">







                      <div className="flex gap-1">
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20" 
                            onClick={handleLikeListing}
                          >
                            <Star 
                              className={`h-4 w-4 ${
                                isListingLiked(listing.id) 
                                  ? "fill-yellow-400 text-yellow-500" 
                                  : "text-gray-400 hover:text-yellow-500"
                              }`} 
                              strokeWidth={isListingLiked(listing.id) ? 0 : 1.5} 
                            />
                          </Button>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20" 
                            onClick={handleShare}
                          >
                            <Share2 className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          </Button>
                        </motion.div>
                      </div>
                    </div>

                    {isOwnListing && (
                      <div className="flex gap-2">
                        <Link href={`/dashboard/my-listings/edit/${listing.id}`}>
                          <Button variant="outline" className="gap-2">

                            Gérer les réponses
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}