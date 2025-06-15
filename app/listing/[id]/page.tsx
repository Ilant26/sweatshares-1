import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ListingContent } from '@/app/listing/[id]/listing-content';

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

  return <ListingContent listing={listing} profile={listing.profiles} />;
} 