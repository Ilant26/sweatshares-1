"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { MapPin, Heart, Share2, Mail, Briefcase } from "lucide-react";
import FooterSection from "@/components/blocks/footer";
import { Menu } from "@/components/blocks/menu";

export default function ListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("listings")
        .select("*, profiles(full_name, professional_role, avatar_url, country)")
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      else setListings(data || []);
      setLoading(false);
    };
    fetchListings();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-background">
      <Menu />
      {/* Main Content */}
      <br />
      <br />
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
                className="flex flex-col justify-between h-full bg-background border border-muted/30 shadow-sm hover:shadow-lg transition-shadow duration-200"
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