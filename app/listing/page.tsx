"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { MapPin, Heart, Share2, Mail, Briefcase, ArrowRight, ListFilter, Settings2, Filter, DollarSign } from "lucide-react";
import FooterSection from "@/components/blocks/footer";
import { Menu } from "@/components/blocks/menu";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { motion, AnimatePresence } from "framer-motion";
import { Transition } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ContentSection from "@/components/content-listing-bottom";
import { useSession } from '@/components/providers/session-provider';

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: "spring",
                bounce: 0.3,
                duration: 1.5,
            } as Transition,
        },
    },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.3,
      duration: 0.8
    }
  },
  hover: {
    y: -5,
    transition: {
      type: "spring",
      bounce: 0.4,
      duration: 0.3
    }
  }
};

const contentVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      bounce: 0.3
    }
  }
};

type ListingType = "Job" | "Project" | "Investment" | "Partnership";

export default function ListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [listingType, setListingType] = useState<ListingType | "">("");
  const { user } = useSession();

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      let query = supabase
        .from("listings")
        .select("*, profiles(full_name, professional_role, avatar_url, country)")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (listingType) {
        query = query.eq('listing_type', listingType);
      }

      const { data, error } = await query;
      if (error) setError(error.message);
      else setListings(data || []);
      setLoading(false);
    };
    fetchListings();
  }, [listingType]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-background">
      <Menu />
      
      {/* Hero Section */}
      <section className="overflow-hidden">
        <div
          aria-hidden
          className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block">
          <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-[80rem] -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>
        <div className="relative pt-24 md:pt-36">
          <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]" />
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
              <AnimatedGroup variants={transitionVariants}>
                <Link
                  href="#link"
                  className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950">
                  <span className="text-foreground text-sm">Browse all opportunities 🚀</span>
                  <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>
                  <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                    <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                      <span className="flex size-6">
                        <ArrowRight className="m-auto size-3" />
                      </span>
                      <span className="flex size-6">
                        <ArrowRight className="m-auto size-3" />
                      </span>
                    </div>
                  </div>
                </Link>

                <h1 className="mt-8 max-w-4xl mx-auto text-balance text-4xl md:text-5xl lg:mt-16 xl:text-6xl">
                  {!user && 'Find the perfect opportunity to collaborate and grow'}
                </h1>
                <p className="mx-auto mt-8 max-w-2xl text-balance text-lg">
                  Browse through our curated list of opportunities from founders, experts, and investors looking to collaborate on innovative projects.
                </p>
              </AnimatedGroup>

              <AnimatedGroup
                variants={{
                  container: {
                    visible: {
                      transition: {
                        staggerChildren: 0.05,
                        delayChildren: 0.75,
                      },
                    },
                  },
                  ...transitionVariants,
                }}
                className="mt-12 flex flex-col items-center justify-center gap-4 md:flex-row">
                <div className="w-full max-w-2xl bg-background p-4 rounded-xl shadow-lg border border-border">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="listingType" className="text-sm font-medium text-muted-foreground">Filter by Opportunity Type</label>
                    <Select value={listingType} onValueChange={(value: string) => setListingType(value as any)}>
                      <SelectTrigger id="listingType" className="w-full h-12 text-base">
                        <ListFilter className="mr-2 h-5 w-5" />
                        <SelectValue placeholder="Select an opportunity" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Founder Options */}
                        <SelectItem value="find-funding">Funding offer</SelectItem>
                        <SelectItem value="cofounder">Co-founder offer</SelectItem>
                        <SelectItem value="expert-freelance">Consultancy and Freelance offers</SelectItem>
                        <SelectItem value="employee">Job offer</SelectItem>
                        <SelectItem value="mentor">Mentoring offer</SelectItem>
                        <SelectItem value="sell-startup">Buy a startup</SelectItem>
                        
                        {/* Investor Options */}
                        <SelectItem value="investment-opportunity">Find investment opportunity</SelectItem>
                        <SelectItem value="buy-startup">Startup Acquisition</SelectItem>
                        <SelectItem value="co-investor">Co-investor offers</SelectItem>
                        
                        {/* Expert Options */}
                        <SelectItem value="mission">Find a mission</SelectItem>
                        <SelectItem value="job">Available for work</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AnimatedGroup>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading...</div>
        ) : error ? (
          <div className="text-center text-destructive py-12">{error}</div>
        ) : listings.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No listings found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {listings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  custom={index}
                  className="h-full"
                >
                  <Card className="group flex flex-col justify-between h-full bg-white dark:bg-zinc-900/60 border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-primary/40 rounded-2xl overflow-hidden">
                    <CardContent className="p-0 flex flex-col h-full">
                      <motion.div 
                        variants={contentVariants}
                        className="flex flex-col h-full"
                      >
                        {/* Header with Badge and Avatar */}
                        <motion.div variants={itemVariants} className="p-4 pb-2 flex items-center gap-3 border-b border-border/30">
                          <Avatar className="h-12 w-12 border-2 border-primary/30">
                            <AvatarImage src={listing.profiles?.avatar_url || undefined} alt={listing.profiles?.full_name || 'User'} />
                            <AvatarFallback>{listing.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-base truncate">{listing.profiles?.full_name || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground truncate">{listing.profiles?.professional_role}</div>
                          </div>
                          <Badge variant="secondary" className="text-xs px-2 py-1 whitespace-nowrap">{listing.listing_type}</Badge>
                        </motion.div>

                        {/* Title and Publication Date */}
                        <motion.div variants={itemVariants} className="px-4 pt-3 pb-1">
                          <h2 className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors mb-1">{listing.title}</h2>
                          <span className="text-xs text-muted-foreground">{listing.created_at ? new Date(listing.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</span>
                        </motion.div>

                        {/* Description Preview */}
                        <motion.div 
                          variants={itemVariants}
                          className="px-4 text-sm text-muted-foreground line-clamp-3 mb-2 prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:text-muted-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-md prose-img:shadow-md"
                          dangerouslySetInnerHTML={{ __html: listing.description || '' }}
                        />

                        {/* Location and Sector */}
                        <motion.div variants={itemVariants} className="px-4 flex items-center gap-3 text-muted-foreground text-xs mb-2">
                          <MapPin className="h-4 w-4" />
                          <span>{listing.location_city ? `${listing.location_city}, ` : ""}{listing.location_country}</span>
                          {listing.sector && <><span className="mx-2">•</span><Badge variant="outline" className="text-xs">{listing.sector}</Badge></>}
                        </motion.div>

                        {/* Action Buttons */}
                        <motion.div variants={itemVariants} className="mt-auto border-t border-border/30">
                          <div className="p-4 flex items-center gap-2">
                            <Button
                              variant="default"
                              className="flex-1 font-semibold"
                              onClick={() => router.push(`/listing/${listing.id}`)}
                            >
                              View Details
                            </Button>
                            <div className="flex gap-1">
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Favorite">
                                  <Heart className="h-4 w-4" />
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Share">
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Contact">
                                  <Mail className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
      <ContentSection />
      <FooterSection />
    </div>
  );
} 