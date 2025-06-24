import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

const formatListingType = (listingType: string): string => {
  const typeMap: { [key: string]: string } = {
    'find-funding': 'Funding',
    'cofounder': 'Co-Founder',
    'expert-freelance': 'Expert',
    'employee': 'Employee',
    'mentor': 'Mentor',
    'sell-startup': 'Startup Sale',
    'investment-opportunity': 'Investment',
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
  const router = useRouter();

  if (isLoadingListings) {
    return <div className="p-4 text-center text-muted-foreground">Loading listings...</div>;
  }
  if (listingsError) {
    return <div className="p-4 text-center text-destructive">{listingsError}</div>;
  }

  // Mobile card layout - more compact
  const renderMobileCards = () => (
    <div className="space-y-3 sm:hidden">
      {listings.map((listing) => (
        <Card key={listing.id} className="p-3">
          <CardHeader className="p-0 pb-2">
            <div className="flex items-center justify-between">
              <Checkbox
                checked={selectedListings.includes(listing.id)}
                onCheckedChange={(checked: boolean) => onSelectListing(listing.id, checked)}
                aria-label="Select row"
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={listing.status === 'active'}
                  onCheckedChange={() => onToggleStatus(listing)}
                />
                <span className="text-xs text-muted-foreground">
                  {listing.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-2">
            <div>
              <CardTitle className="text-sm font-semibold">{listing.title || 'Untitled'}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {formatListingType(listing.listing_type)} • {formatProfileType(listing.profile_type)}
              </p>
            </div>
            
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{listing.location_country || 'No location'}</span>
              <span className="text-muted-foreground">{format(new Date(listing.created_at), 'MMM dd')}</span>
            </div>

            {listing.skills && (
              <div className="flex flex-wrap gap-1">
                {listing.skills.split(', ').filter((skill: string) => skill.trim()).slice(0, 2).map((skill: string) => (
                  <Badge key={skill} className={`text-xs ${getSkillColor(skill.trim())}`}>
                    {skill.trim()}
                  </Badge>
                ))}
                {listing.skills.split(', ').filter((skill: string) => skill.trim()).length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{listing.skills.split(', ').filter((skill: string) => skill.trim()).length - 2}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-1 pt-1 border-t">
              <Button variant="ghost" size="sm" onClick={() => onEditListing(listing)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDeleteListing(listing.id)} disabled={deletingId === listing.id}>
                {deletingId === listing.id ? <span className="animate-spin"><Trash2 className="h-3 w-3" /></span> : <Trash2 className="h-3 w-3" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/listings/${listing.id}`)}>
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile cards */}
      {renderMobileCards()}
      
      {/* Desktop table - optimized for screen fit */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedListings.length === listings.length && listings.length > 0}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[120px]">Type</TableHead>
              <TableHead className="w-[100px]">Profile</TableHead>
              <TableHead className="w-[120px]">Title</TableHead>
              <TableHead className="w-[150px]">Skills</TableHead>
              <TableHead className="w-[80px]">Date</TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
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
                <TableCell className="text-sm">{formatListingType(listing.listing_type)}</TableCell>
                <TableCell className="text-sm">{formatProfileType(listing.profile_type)}</TableCell>
                <TableCell className="text-sm max-w-[120px] truncate" title={listing.title}>
                  {listing.title || 'Untitled'}
                </TableCell>
                <TableCell>
                  {listing.skills ? (
                    <div className="flex flex-wrap gap-1">
                      {listing.skills.split(', ').filter((skill: string) => skill.trim()).slice(0, 2).map((skill: string) => (
                        <Badge key={skill} className={`text-xs ${getSkillColor(skill.trim())}`}>
                          {skill.trim()}
                        </Badge>
                      ))}
                      {listing.skills.split(', ').filter((skill: string) => skill.trim()).length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{listing.skills.split(', ').filter((skill: string) => skill.trim()).length - 2}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">{format(new Date(listing.created_at), 'MMM dd')}</TableCell>
                <TableCell>
                  <Switch
                    checked={listing.status === 'active'}
                    onCheckedChange={() => onToggleStatus(listing)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEditListing(listing)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDeleteListing(listing.id)} disabled={deletingId === listing.id}>
                      {deletingId === listing.id ? <span className="animate-spin"><Trash2 className="h-4 w-4" /></span> : <Trash2 className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/listings/${listing.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
} 