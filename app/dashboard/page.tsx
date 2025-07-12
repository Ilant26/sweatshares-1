"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart } from "@/components/ui/line-chart";
import { CreateListingModal } from './my-listings/create-listing-modal';

import {
  MessageCircle,
  Calendar,
  Users,
  BellRing,
  ArrowRight,
  UserPlus,
  Star,
  Settings,
  Eye,
  Mail,
  Lock,
  Plus,
  FileText,
  CreditCard,
  Lightbulb,
  Loader2,
} from "lucide-react";

import { useUser } from "@/hooks/use-user";
import { useFavorites } from "@/hooks/use-favorites";
import { getFriends } from "@/lib/friends";
import { getMessages } from "@/lib/messages";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useToast } from '@/components/ui/use-toast';

const mockUsers = [
  {
    id: "1",
    name: "Sophia Dubois",
    role: "Expert Digital Marketing",
    avatarUrl: "https://randomuser.me/api/portraits/women/1.jpg",
  },
  {
    id: "2",
    name: "Philippe Laurent",
    role: "Investor, Business Angel",
    avatarUrl: "https://randomuser.me/api/portraits/men/2.jpg",
  },
  {
    id: "3",
    name: "Julien Mercier",
    role: "Developer, Full-stack",
    avatarUrl: "https://randomuser.me/api/portraits/men/3.jpg",
  },
  {
    id: "4",
    name: "Amira Benali",
    role: "UI/UX Designer",
    avatarUrl: "https://randomuser.me/api/portraits/women/4.jpg",
  },
  {
    id: "5",
    name: "Lucas Martin",
    role: "Data Scientist",
    avatarUrl: "https://randomuser.me/api/portraits/men/5.jpg",
  },
];

const recentMessages = [
  {
    id: "1",
    sender: "Sophia Dubois",
    avatar: "https://randomuser.me/api/portraits/women/1.jpg",
    time: "14:23",
    message: "Hi Thomas, I received your proposal regarding the digital marketing project. I would be available to discuss it tomorrow at...",
  },
  {
    id: "2",
    sender: "Philippe Laurent",
    avatar: "https://randomuser.me/api/portraits/men/2.jpg",
    time: "Yesterday",
    message: "Thank you for presenting your startup. Your project is interesting. I would like to know more about your growth strategy and financia...",
  },
  {
    id: "3",
    sender: "Julien Mercier",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    time: "Main",
    message: "I have reviewed the technical specifications you sent. I think we could optimize the architecture using a microservices approach.",
  },
];

const chartData = [
  { date: "Mar 01", views: 300, messages: 150, connections: 80 },
  { date: "Mar 08", views: 320, messages: 160, connections: 85 },
  { date: "Mar 15", views: 350, messages: 170, connections: 90 },
  { date: "Mar 22", views: 380, messages: 180, connections: 95 },
  { date: "Mar 29", views: 400, messages: 190, connections: 100 },
  { date: "Apr 05", views: 420, messages: 200, connections: 105 },
  { date: "Apr 12", views: 450, messages: 210, connections: 110 },
  { date: "Apr 19", views: 480, messages: 220, connections: 115 },
  { date: "Apr 26", views: 500, messages: 230, connections: 120 },
  { date: "May 03", views: 490, messages: 225, connections: 118 },
  { date: "May 10", views: 470, messages: 215, connections: 112 },
  { date: "May 17", views: 460, messages: 210, connections: 108 },
  { date: "May 24", views: 450, messages: 200, connections: 105 },
  { date: "May 31", views: 440, messages: 195, connections: 100 },
];



function renderMessageContent(content: string) {
  try {
    const obj = JSON.parse(content);
    if (obj && obj.type === 'invoice') {
      return (
        <span>
          Invoice <b>{obj.invoice_number}</b>: €{obj.amount} {obj.currency} due {obj.due_date} <span className="italic">({obj.status})</span>{obj.description ? ` - ${obj.description}` : ''}
        </span>
      );
    }
    if (obj && obj.type === 'document_signed') {
      return (
        <span>
          Document <b>"{obj.documentName}"</b> has been signed by <b>{obj.signerName}</b>
        </span>
      );
    }
    if (obj && obj.type === 'signature_request') {
      return (
        <span>
          Signature request for document <b>"{obj.documentName}"</b> from <b>{obj.senderName}</b>
        </span>
      );
    }
  } catch {
    // Not JSON, fall through
  }
  return <span>{content}</span>;
}

export default function Page() {
  const { user, loading: userLoading } = useUser();
  const { savedProfiles, likedListings, loading: favoritesLoading } = useFavorites();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [isCreateListingOpen, setIsCreateListingOpen] = useState(false);

  // New state for alerts, favorites, and suggestions
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<any>({});
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  
  // State for pending items
  const [pendingSignatures, setPendingSignatures] = useState<any[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  // --- Listing Modal State (copied/adapted from my-listings) ---
  const [profileType, setProfileType] = useState("");
  const [listingType, setListingType] = useState("");
  const [fundingStage, setFundingStage] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [locationCountry, setLocationCountry] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [compensationType, setCompensationType] = useState("");
  const [compensationValue, setCompensationValue] = useState("");
  const [amount, setAmount] = useState("");
  const [sector, setSector] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Effects for default values (copied/adapted) ---
  useEffect(() => {
    if (profileType && listingType) {
      if (profileType === "founder" && listingType === "find-funding") {
        setCompensationType("Equity");
      } else if (profileType === "founder" && listingType === "expert-freelance") {
        setCompensationType("Cash");
      } else if (profileType === "investor" && listingType === "expert-freelance") {
        setCompensationType("Cash");
      } else if (profileType === "expert" && listingType === "expert-freelance") {
        setCompensationType("Cash");
      } else if (!compensationType) {
        if (profileType === "founder" && ["employee", "mentor"].includes(listingType)) {
          setCompensationType("Salary");
        } else if (profileType === "founder" && ["cofounder"].includes(listingType)) {
          setCompensationType("Equity");
        } else if (profileType === "expert" && ["mission", "cofounder"].includes(listingType)) {
          setCompensationType("Equity");
        } else if (profileType === "expert" && ["job"].includes(listingType)) {
          setCompensationType("Salary");
        }
      }
    }
  }, [profileType, listingType, compensationType]);

  useEffect(() => {
    if (!sector && profileType) {
      if (profileType === "founder") {
        setSector("Technology");
      } else if (profileType === "investor") {
        setSector("Finance");
      } else if (profileType === "expert") {
        setSector("Professional Services");
      }
    }
  }, [profileType, sector]);

  // --- Handler for creating a listing ---
  const handleCreateOrUpdateListing = async () => {
    if (!user) {
      toast({ title: 'You must be logged in to create a listing.', variant: 'destructive' });
      return;
    }
    if (!profileType || !listingType || !title || !description) {
      toast({ title: 'Please fill in all mandatory fields: I am a, Looking to, Title, and Description.', variant: 'destructive' });
      setIsCreating(false);
      return;
    }
    setIsCreating(true);
    let error;
    try {
      if (editingId) {
        ({ error } = await supabase.from('listings').update({
          user_id: user.id,
          profile_type: profileType,
          listing_type: listingType,
          funding_stage: fundingStage,
          skills: skills.join(', '),
          location_country: locationCountry,
          location_city: locationCity,
          compensation_type: compensationType,
          compensation_value: typeof compensationValue === 'object' ? compensationValue : { value: compensationValue },
          amount,
          sector,
          title,
          description: description || '',
        }).eq('id', editingId));
      } else {
        ({ error } = await supabase.from('listings').insert({
          user_id: user.id,
          profile_type: profileType,
          listing_type: listingType,
          funding_stage: fundingStage,
          skills: skills.join(', '),
          location_country: locationCountry,
          location_city: locationCity,
          compensation_type: compensationType,
          compensation_value: typeof compensationValue === 'object' ? compensationValue : { value: compensationValue },
          amount,
          sector,
          title,
          description: description || '',
        }));
      }
      setIsCreating(false);
      if (error) {
        toast({ title: (editingId ? 'Failed to update' : 'Failed to create') + ' listing: ' + error.message, variant: 'destructive' });
      } else {
        toast({ title: editingId ? 'Listing updated!' : 'Listing created!' });
        setIsCreateListingOpen(false);
        setEditingId(null);
        // Optionally, refresh listings here if needed
      }
    } catch (e) {
      setIsCreating(false);
      toast({ title: 'An error occurred.', variant: 'destructive' });
    }
  };

  // Fetch user profile
  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  // Fetch friends (network connections)
  useEffect(() => {
    if (user) {
      setConnectionsLoading(true);
      (async () => {
        try {
          const { data, error } = await supabase
            .from('connections')
            .select(`*, sender:sender_id(id, username, full_name, avatar_url, professional_role), receiver:receiver_id(id, username, full_name, avatar_url, professional_role)`)
            .eq('status', 'accepted')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
          setConnections(data || []);
        } catch {
          setConnections([]);
        } finally {
          setConnectionsLoading(false);
        }
      })();
    }
  }, [user]);

  // Fetch messages
  useEffect(() => {
    if (user) {
      setMessagesLoading(true);
      (async () => {
        try {
          const data = await getMessages(user.id);
          setMessages(data || []);
        } catch {
          setMessages([]);
        } finally {
          setMessagesLoading(false);
        }
      })();
    }
  }, [user]);

  // Fetch active listings
  useEffect(() => {
    if (user) {
      setListingsLoading(true);
      (async () => {
        try {
          const { data } = await supabase
            .from("listings")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "active");
          setListings(data || []);
        } catch {
          setListings([]);
        } finally {
          setListingsLoading(false);
        }
      })();
    }
  }, [user]);

  // Fetch alerts
  useEffect(() => {
    if (user) {
      setAlertsLoading(true);
      (async () => {
        try {
          const response = await fetch('/api/alerts?status=active');
          if (response.ok) {
            const data = await response.json();
            setAlerts(data.alerts || []);
          }
        } catch (error) {
          console.error('Error fetching alerts:', error);
          setAlerts([]);
        } finally {
          setAlertsLoading(false);
        }
      })();
    }
  }, [user]);

  // Fetch suggestions
  useEffect(() => {
    if (user) {
      setSuggestionsLoading(true);
      (async () => {
        try {
          const response = await fetch('/api/suggestions?type=all&limit=5');
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data.suggestions || {});
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions({});
        } finally {
          setSuggestionsLoading(false);
        }
      })();
    }
  }, [user]);

  // Fetch pending items (signatures and invoices)
  useEffect(() => {
    if (user) {
      setPendingLoading(true);
      (async () => {
        try {
          // Fetch pending signature requests
          const { data: signatures } = await supabase
            .from('signature_requests')
            .select(`
              *,
              document:vault_documents(id, filename, description),
              sender:profiles!signature_requests_sender_id_fkey(id, full_name, username, avatar_url)
            `)
            .eq('receiver_id', user.id)
            .eq('status', 'pending');

          // Fetch pending invoices
          const { data: invoices } = await supabase
            .from('invoices')
            .select(`
              *,
              sender:profiles!invoices_sender_id_fkey(id, full_name, username, avatar_url)
            `)
            .eq('receiver_id', user.id)
            .eq('status', 'pending');

          setPendingSignatures(signatures || []);
          setPendingInvoices(invoices || []);
        } catch (error) {
          console.error('Error fetching pending items:', error);
          setPendingSignatures([]);
          setPendingInvoices([]);
        } finally {
          setPendingLoading(false);
        }
      })();
    }
  }, [user]);

  // Handle alert toggle
  const handleAlertToggle = async (alertId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        // Update local state
        setAlerts(alerts.map(alert => 
          alert.id === alertId 
            ? { ...alert, is_active: !currentStatus }
            : alert
        ));
        toast({
          title: !currentStatus ? 'Alert activated' : 'Alert deactivated',
          description: !currentStatus ? 'You will now receive notifications for this alert.' : 'You will no longer receive notifications for this alert.',
        });
      } else {
        throw new Error('Failed to update alert');
      }
    } catch (error) {
      console.error('Error updating alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to update alert. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Unread messages count
  const unreadMessages = messages.filter(
    (msg) => msg.receiver_id === user?.id && !msg.read
  );

  // Helper to get the other user's profile from a connection
  function getOtherUserProfile(connection: any) {
    if (!user) return null;
    return connection.sender_id === user.id ? connection.receiver : connection.sender;
  }

  // Recent connections (latest 3)
  const recentConnections = [...connections]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)
    .map(getOtherUserProfile)
    .filter(Boolean);

  // Network connections count
  const networkConnectionsCount = connections.length;

  // Recent messages (latest 3)
  const recentMessages = [...messages]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  // My favorites (latest 3 profiles + 2 listings as example)
  const myFavorites = [
    ...savedProfiles.slice(0, 3).map((fav) => ({
      id: fav.profile.id,
      name: fav.profile.full_name,
      role: fav.profile.professional_role,
      avatar: fav.profile.avatar_url ?? undefined,
      starred: true,
      type: 'profile'
    })),
    ...likedListings.slice(0, 2).map((fav) => ({
      id: fav.listing.id,
      name: fav.listing.title,
      role: fav.listing_profile.professional_role,
      avatar: fav.listing_profile.avatar_url ?? undefined,
      starred: true,
      type: 'listing'
    })),
  ];

  // Active alerts count
  const activeAlertsCount = alerts.filter(alert => alert.is_active).length;

  // Loading state
  if (userLoading || favoritesLoading || connectionsLoading || messagesLoading || listingsLoading || pendingLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 md:p-8 md:pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Hello, {profile?.full_name || profile?.username || user?.email}
        </h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsCreateListingOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Listing
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground">
        Here's an overview of your activity on SweatShares
      </p>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadMessages.length}</div>
            <p className="text-xs text-muted-foreground">
              {unreadMessages.length > 0 ? `${unreadMessages.length} new` : "No new messages"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listings.length}</div>
            <p className="text-xs text-muted-foreground">
              {listings.length > 0 ? `${listings.length} active` : "No active listings"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Connections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkConnectionsCount}</div>
            <p className="text-xs text-muted-foreground">
              {networkConnectionsCount > 0 ? `${networkConnectionsCount} connections` : "No connections"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Active Alerts</CardTitle>
            <BellRing className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : activeAlertsCount}</div>
            <p className="text-xs text-muted-foreground">
              {alertsLoading ? "Loading..." : activeAlertsCount > 0 ? `${activeAlertsCount} active` : "No active alerts"}
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Account Activity Card - Full width on small/medium, 4/7 on large */}
        <Card className="col-span-full lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Account Activity</CardTitle>
            <div className="flex items-center space-x-2">
              <Tabs defaultValue="month">
                <TabsList>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="year">Year</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="link" className="px-0 pt-0 justify-start">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] w-full bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground">
              <span>Coming soon</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Connections Card - 3/7 on large */}
        <Card className="col-span-full lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Connections</CardTitle>
            <Link href="/dashboard/my-network" passHref legacyBehavior>
              <a className="px-0 pt-0 justify-start inline-flex items-center text-sm font-medium text-primary hover:underline" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <div className="flex items-center">
                  View all <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </a>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {recentConnections.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={user.avatar_url === null ? undefined : user.avatar_url} alt={user.full_name || user.username} />
                      <AvatarFallback>{(user.full_name || user.username || "?")[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        <Link
                          href={`/dashboard/profile/${user.id}`}
                          className="hover:underline text-primary"
                          legacyBehavior>
                          {user.full_name || user.username}
                        </Link>
                      </p>
                      <p className="text-sm text-muted-foreground">{user.professional_role}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Message
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Items Card - Full width on small/medium, 2/7 on large */}
        <Card className="col-span-full md:col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Pending</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {pendingLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <>
                {/* Pending Signatures */}
                {pendingSignatures.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium leading-none">Signatures in Waiting</p>
                          <p className="text-sm text-muted-foreground">
                            {pendingSignatures.length} document{pendingSignatures.length !== 1 ? 's' : ''} to sign
                          </p>
                        </div>
                      </div>
                      <Link href="/dashboard/signature" passHref legacyBehavior>
                        <Button variant="link" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                    {/* Show first pending signature as preview */}
                    {pendingSignatures[0] && (
                      <div className="ml-6 text-xs text-muted-foreground">
                        <p className="truncate">
                          "{pendingSignatures[0].document?.filename || 'Document'}" from {pendingSignatures[0].sender?.full_name || pendingSignatures[0].sender?.username || 'Unknown'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pending Invoices */}
                {pendingInvoices.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium leading-none">Payments in Waiting</p>
                          <p className="text-sm text-muted-foreground">
                            {pendingInvoices.length} invoice{pendingInvoices.length !== 1 ? 's' : ''} to pay
                          </p>
                        </div>
                      </div>
                      <Link href="/dashboard/my-invoices" passHref legacyBehavior>
                        <Button variant="link" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                    {/* Show first pending invoice as preview */}
                    {pendingInvoices[0] && (
                      <div className="ml-6 text-xs text-muted-foreground">
                        <p className="truncate">
                          Invoice #{pendingInvoices[0].invoice_number} - €{pendingInvoices[0].total} from {pendingInvoices[0].sender?.full_name || pendingInvoices[0].sender?.username || 'Unknown'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* No pending items */}
                {pendingSignatures.length === 0 && pendingInvoices.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No pending items</p>
                    <p className="text-xs">You're all caught up!</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages Card - Full width on small/medium, 5/7 on large */}
        <Card className="col-span-full md:col-span-1 lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Messages</CardTitle>
            <Link href="/dashboard/messages" passHref legacyBehavior>
              <a className="px-0 pt-0 justify-start inline-flex items-center text-sm font-medium text-primary hover:underline" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <div>View all</div>
              </a>
            </Link>
          </CardHeader>
          <CardContent className="grid gap-4">
            {recentMessages.map((message) => (
              <div key={message.id} className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={message.sender.avatar_url === null ? undefined : message.sender.avatar_url} alt={message.sender.full_name || message.sender.username} />
                  <AvatarFallback>{(message.sender.full_name || message.sender.username || "?")[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium leading-none">
                      <Link
                        href={`/dashboard/profile/${message.sender_id}`}
                        className="hover:underline text-primary"
                        legacyBehavior>
                        {message.sender.full_name || message.sender.username}
                      </Link>
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleString()}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {renderMessageContent(message.content)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* My Favorites Card - Full width on small/medium, 4/7 on large */}
        <Card className="col-span-full md:col-span-1 lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Favorites</CardTitle>
            <Link href="/dashboard/my-favorites" passHref legacyBehavior>
              <a className="px-0 pt-0 justify-start inline-flex items-center text-sm font-medium text-primary hover:underline" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <div>View all</div>
              </a>
            </Link>
          </CardHeader>
          <CardContent className="grid gap-4">
            {favoritesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : myFavorites.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No favorites yet</p>
                <p className="text-xs">Start exploring to save your favorites</p>
              </div>
            ) : (
              myFavorites.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={item.avatar ?? undefined} />
                    <AvatarFallback>{item.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    {item.type === 'profile' ? (
                      <p className="text-sm font-medium leading-none">
                        <Link
                          href={`/dashboard/profile/${item.id}`}
                          className="hover:underline text-primary"
                          legacyBehavior>
                          {item.name}
                        </Link>
                      </p>
                    ) : item.type === 'listing' ? (
                      <p className="text-sm font-medium leading-none">
                        <Link
                          href={`/dashboard/listings/${item.id}?source=dashboard`}
                          className="hover:underline text-primary"
                          legacyBehavior>
                          {item.name}
                        </Link>
                      </p>
                    ) : (
                      <p className="text-sm font-medium leading-none">{item.name}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{item.role}</p>
                  </div>
                </div>
                {item.starred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
              </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Active Alerts Card - Full width on small/medium, 3/7 on large */}
        <Card className="col-span-full md:col-span-1 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Active Alerts</CardTitle>
            <Link href="/dashboard/my-alerts" passHref legacyBehavior>
              <a className="px-0 pt-0 justify-start inline-flex items-center text-sm font-medium text-primary hover:underline" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <div>Manage</div>
              </a>
            </Link>
          </CardHeader>
          <CardContent className="grid gap-4">
            {alertsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <BellRing className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No alerts yet</p>
                <p className="text-xs">Create alerts to get notified of new matches</p>
              </div>
            ) : (
              alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <BellRing className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium leading-none">{alert.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.alert_type === 'profile' ? 'Profile Alert' : 'Listing Alert'} • {alert.frequency}
                      </p>
                  </div>
                </div>
                  <Switch 
                    checked={alert.is_active} 
                    onCheckedChange={() => handleAlertToggle(alert.id, alert.is_active)}
                  />
              </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Suggestions for You Card - Full width on small/medium, 4/7 on large */}
        <Card className="col-span-full md:col-span-1 lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Suggestions for You</CardTitle>
            <Button variant="link" className="px-0 pt-0 justify-start">
              Explore <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4">
            {suggestionsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : suggestions.opportunities && suggestions.opportunities.length > 0 ? (
              suggestions.opportunities.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    {item.type === 'profiles' && <UserPlus className="h-4 w-4 text-purple-500" />}
                    {item.type === 'listings' && <Lightbulb className="h-4 w-4 text-orange-500" />}
                    {item.type === 'networking' && <Users className="h-4 w-4 text-blue-500" />}
                  <div>
                    <p className="text-sm font-medium leading-none">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                  <Link href={item.href} passHref legacyBehavior>
                <Button variant="link" size="sm">
                  {item.action}
                </Button>
                  </Link>
              </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No suggestions yet</p>
                <p className="text-xs">Complete your profile to get personalized suggestions</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Settings Card - Full width on small/medium, 3/7 on large */}
        <Card className="col-span-full md:col-span-1 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Account Settings</CardTitle>
            <Link href="/dashboard/profile-settings" passHref legacyBehavior>
              <a className="px-0 pt-0 justify-start inline-flex items-center text-sm font-medium text-primary hover:underline" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                View all
              </a>
            </Link>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium leading-none">Profile Visibility</p>
                  <p className="text-sm text-muted-foreground">Who can view your full profile</p>
                </div>
              </div>
              <Badge variant="secondary">Everyone</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium leading-none">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive emails for activities</p>
                </div>
              </div>
              <Switch checked={true} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium leading-none">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Secure your account with 2FA</p>
                </div>
              </div>
              <Switch checked={false} />
            </div>
          </CardContent>
        </Card>
      </div>
      <CreateListingModal
        open={isCreateListingOpen}
        onOpenChange={setIsCreateListingOpen}
        isCreating={isCreating}
        editingId={editingId}
        profileType={profileType}
        setProfileType={setProfileType}
        listingType={listingType}
        setListingType={setListingType}
        fundingStage={fundingStage}
        setFundingStage={setFundingStage}
        skills={skills}
        setSkills={setSkills}
        locationCountry={locationCountry}
        setLocationCountry={setLocationCountry}
        locationCity={locationCity}
        setLocationCity={setLocationCity}
        compensationType={compensationType}
        setCompensationType={setCompensationType}
        compensationValue={compensationValue}
        setCompensationValue={setCompensationValue}
        amount={amount}
        setAmount={setAmount}
        sector={sector}
        setSector={setSector}
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        onSubmit={handleCreateOrUpdateListing}
      />
    </div>
  );
}
