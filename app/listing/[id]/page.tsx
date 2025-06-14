import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, DollarSign, Building2, Briefcase, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Menu } from '@/components/blocks/menu';
import FooterSection from '@/components/blocks/footer';
import { Separator } from '@/components/ui/separator';
import { ProfileCard } from './profile-card';

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerComponentClient({ cookies });

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('*, profiles(*)')
    .eq('id', id)
    .single();

  if (listingError || !listing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <h2 className="text-xl font-semibold mb-2">Listing not found</h2>
        <p className="text-muted-foreground">This listing does not exist or has been removed.</p>
      </div>
    );
  }

  const profile = listing.profiles;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-background">
      <Menu />
      <div className="max-w-4xl mx-auto p-4 space-y-8 flex-1 w-full">
        <div className="pt-20">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link href="/listing" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Listings
            </Link>
          </Button>

          {/* Listing Card */}
          <Card className="mb-8 border-none shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="default" className="text-sm">{listing.profile_type}</Badge>
                <Badge variant="secondary" className="text-sm">{listing.listing_type}</Badge>
                {listing.sector && <Badge variant="outline" className="text-sm">{listing.sector}</Badge>}
              </div>
              <CardTitle className="text-3xl font-bold">{listing.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Key Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Ends: {listing.end_date ? new Date(listing.end_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                {listing.amount && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Amount: <span className="font-medium text-foreground">{listing.amount}</span></span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.location_country} {listing.location_city && `, ${listing.location_city}`}</span>
                </div>
                {listing.funding_stage && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>Stage: <span className="font-medium text-foreground">{listing.funding_stage}</span></span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Description</h4>
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
              </div>

              {/* Skills */}
              {listing.skills && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {listing.skills.split(',').map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {skill.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Compensation */}
              <Separator />
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Compensation:</span>
                <span className="font-medium">{listing.compensation_type} {listing.compensation_value && `- ${listing.compensation_value}`}</span>
              </div>
            </CardContent>
          </Card>

          {/* Profile Card */}
          <ProfileCard profile={profile} />
        </div>
      </div>
      <FooterSection />
    </div>
  );
} 