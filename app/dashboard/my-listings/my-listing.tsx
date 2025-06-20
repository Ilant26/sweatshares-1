import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';

interface MyListingTableProps {
  listings: any[];
  selectedListings: string[];
  isLoadingListings: boolean;
  listingsError: string | null;
  onSelectAll: (checked: boolean) => void;
  onSelectListing: (id: string, checked: boolean) => void;
  onEditListing: (listing: any) => void;
  onDeleteListing: (id: string) => void;
  onToggleStatus: (listing: any) => void;
  deletingId: string | null;
}

const formatListingType = (listingType: string): string => {
  const typeMap: { [key: string]: string } = {
    'find-funding': 'Find Funding',
    'cofounder': 'Co Founder',
    'expert-freelance': 'Expert/ Freelance',
    'employee': 'Employee',
    'mentor': 'Mentor',
    'sell-startup': 'Startup Sale',
    'investment-opportunity': 'Investment Opportunity',
    'buy-startup': 'Buy Startup',
    'co-investor': 'Co-investor',
    'mission': 'Mission',
    'job': 'Job',
  };
  return typeMap[listingType] || listingType;
};

const formatProfileType = (profileType: string): string => {
  if (!profileType) return profileType;
  return profileType.charAt(0).toUpperCase() + profileType.slice(1);
};

export function MyListingTable({
  listings,
  selectedListings,
  isLoadingListings,
  listingsError,
  onSelectAll,
  onSelectListing,
  onEditListing,
  onDeleteListing,
  onToggleStatus,
  deletingId,
}: MyListingTableProps) {
  if (isLoadingListings) {
    return <div className="p-8 text-center text-muted-foreground">Loading listings...</div>;
  }
  if (listingsError) {
    return <div className="p-8 text-center text-destructive">{listingsError}</div>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">
            <Checkbox
              checked={selectedListings.length === listings.length && listings.length > 0}
              onCheckedChange={onSelectAll}
              aria-label="Select all"
            />
          </TableHead>
          <TableHead>Looking for</TableHead>
          <TableHead>As an</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Publication Date</TableHead>
          <TableHead>Compensation</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {listings.map((listing) => (
          <TableRow key={listing.id}>
            <TableCell>
              <Checkbox
                checked={selectedListings.includes(listing.id)}
                onCheckedChange={(checked: boolean) => onSelectListing(listing.id, checked)}
                aria-label="Select row"
              />
            </TableCell>
            <TableCell>{formatListingType(listing.listing_type)}</TableCell>
            <TableCell>{formatProfileType(listing.profile_type)}</TableCell>
            <TableCell>{listing.location_country}</TableCell>
            <TableCell>{listing.title}</TableCell>
            <TableCell>{format(new Date(listing.created_at), 'yyyy-MM-dd')}</TableCell>
            <TableCell>{listing.compensation_type}</TableCell>
            <TableCell>
              <Switch
                checked={listing.status === 'active'}
                onCheckedChange={() => onToggleStatus(listing)}
              />
            </TableCell>
            <TableCell className="text-right flex items-center justify-end gap-2">
              <Button variant="ghost" size="icon" onClick={() => onEditListing(listing)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDeleteListing(listing.id)} disabled={deletingId === listing.id}>
                {deletingId === listing.id ? <span className="animate-spin"><Trash2 className="h-4 w-4" /></span> : <Trash2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon">
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 