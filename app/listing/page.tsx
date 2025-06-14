"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { MapPin, Heart, Share2, Mail, Briefcase, ArrowRight } from "lucide-react";
import FooterSection from "@/components/blocks/footer";
import { Menu } from "@/components/blocks/menu";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { Transition } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

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

type ListingType = "Job" | "Project" | "Investment" | "Partnership";
type Sector = "Technology" | "Healthcare" | "Finance" | "Education" | "Other";

export default function ListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [listingType, setListingType] = useState<ListingType | "">("");
  const [sector, setSector] = useState<Sector | "">("");

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      let query = supabase
        .from("listings")
        .select("*, profiles(full_name, professional_role, avatar_url, country)")
        .order("created_at", { ascending: false });

      if (listingType) {
        query = query.eq('listing_type', listingType);
      }
      if (sector) {
        query = query.eq('sector', sector);
      }

      const { data, error } = await query;
      if (error) setError(error.message);
      else setListings(data || []);
      setLoading(false);
    };
    fetchListings();
  }, [listingType, sector]);

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
                  Find the perfect opportunity to collaborate and grow
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
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl bg-background p-4 rounded-xl shadow-lg border border-border">
                  <div className="flex-1">
                    <label htmlFor="listingType" className="sr-only">Listing Type</label>
                    <Select value={listingType} onValueChange={(value: string) => setListingType(value as any)}>
                      <SelectTrigger id="listingType" className="w-full">
                        <SelectValue placeholder="Listing Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Job", "Project", "Investment", "Partnership"].map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="sector" className="sr-only">Sector</label>
                    <Select value={sector} onValueChange={(value: string) => setSector(value as any)}>
                      <SelectTrigger id="sector" className="w-full">
                        <SelectValue placeholder="Sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Technology", "Healthcare", "Finance", "Education", "Other"].map((sector) => (
                          <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                        ))}
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
      <section className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading...</div>
        ) : error ? (
          <div className="text-center text-destructive py-12">{error}</div>
        ) : listings.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No listings found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {listings.map((listing) => (
              <Card
                key={listing.id}
                className="flex flex-col justify-between h-full bg-muted/50 border border-border/50 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Briefcase className="h-5 w-5" />
                    <span className="text-xs">
                      Added {listing.created_at ? new Date(listing.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold mb-1 line-clamp-2">{listing.title}</h2>
                  <div className="mb-2 text-sm text-muted-foreground">
                    {listing.profiles?.full_name || "Unknown"}
                    {listing.profiles?.country && (
                      <>
                        {" "}
                        &bull; {listing.profiles.country}
                      </>
                    )}
                  </div>
                  <div 
                    className="mb-4 text-sm text-muted-foreground line-clamp-3 prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:text-muted-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-md prose-img:shadow-md"
                    dangerouslySetInnerHTML={{ __html: listing.description || '' }}
                  />
                  <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{listing.location_city ? `${listing.location_city}, ` : ""}{listing.location_country}</span>
                  </div>
                  <div className="mt-auto flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/listing/${listing.id}`)}
                    >
                      View Listing
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Favorite">
                      <Heart className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Share">
                      <Share2 className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Contact">
                      <Mail className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
      <FooterSection />
    </div>
  );
} 