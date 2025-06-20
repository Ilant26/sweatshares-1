"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart } from "@/components/ui/line-chart";

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
} from "lucide-react";

import { useUser } from "@/hooks/use-user";
import { useFavorites } from "@/hooks/use-favorites";
import { getFriends } from "@/lib/friends";
import { getMessages } from "@/lib/messages";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

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

const myFavorites = [
  {
    id: "1",
    name: "Sophia Dubois",
    role: "Expert Digital Marketing",
    avatar: "https://randomuser.me/api/portraits/women/1.jpg",
    starred: true,
  },
  {
    id: "2",
    name: "Developer React.js Senior",
    role: "Freelancer - TechInnov",
    avatar: "/avatars/01.png", // Placeholder for a listing image
    starred: true,
  },
  {
    id: "3",
    name: "GreenTech Solutions",
    role: "Startup - Renewable Energy",
    avatar: "/avatars/02.png", // Placeholder for a listing image
    starred: true,
  },
  {
    id: "4",
    name: "Philippe Laurent",
    role: "Investor, Business Angel",
    avatar: "https://randomuser.me/api/portraits/men/2.jpg",
    starred: true,
  },
];

const activeAlertsData = [
  {
    id: "1",
    name: "Expert Digital Marketing",
    criteria: "Paris - Template, 3 criteria",
    status: true,
  },
  {
    id: "2",
    name: "Investor Seed",
    criteria: "France - Fintech, 5 criteria",
    status: true,
  },
  {
    id: "3",
    name: "Full-stack Developer",
    criteria: "Remote - Equity, 4 criteria",
    status: false,
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

const pendingItems = [
  {
    id: "1",
    type: "signature",
    title: "Signatures in Waiting",
    description: "3 documents to sign",
    action: "View",
    icon: <FileText className="h-4 w-4 text-blue-500" />,
  },
  {
    id: "2",
    type: "payment",
    title: "Payments in Waiting",
    description: "2 invoices to pay",
    action: "Register",
    icon: <CreditCard className="h-4 w-4 text-green-500" />,
  },
];

const suggestions = [
  {
    id: "1",
    type: "recommendedProfiles",
    title: "Recommended Profiles",
    description: "9 new profiles matching your criteria",
    action: "Explore",
    icon: <UserPlus className="h-4 w-4 text-purple-500" />,
  },
  {
    id: "2",
    type: "opportunities",
    title: "Opportunities",
    description: "2 new opportunities correspond to your criteria",
    action: "Discover",
    icon: <Lightbulb className="h-4 w-4 text-orange-500" />,
  },
];

export default function Page() {
  const { user, loading: userLoading } = useUser();
  const { savedProfiles, likedListings, loading: favoritesLoading } = useFavorites();

  const [profile, setProfile] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);

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
      avatar: fav.profile.avatar_url === null ? undefined : fav.profile.avatar_url,
      starred: true,
    })),
    ...likedListings.slice(0, 2).map((fav) => ({
      id: fav.listing.id,
      name: fav.listing.title,
      role: fav.listing_profile.professional_role,
      avatar: fav.listing_profile.avatar_url === null ? undefined : fav.listing_profile.avatar_url,
      starred: true,
    })),
  ];

  // Loading state
  if (userLoading || favoritesLoading || connectionsLoading || messagesLoading || listingsLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 md:p-8 md:pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Hello, {profile?.full_name || profile?.username || user?.email}
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">Manage Widgets</Button>
          <Button>
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
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <BellRing className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
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
            <Button variant="link" className="px-0 pt-0 justify-start">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
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
                      <p className="text-sm font-medium leading-none">{user.full_name || user.username}</p>
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
            {pendingItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {item.icon}
                  <div>
                    <p className="text-sm font-medium leading-none">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Button variant="link" size="sm">
                  {item.action}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Messages Card - Full width on small/medium, 5/7 on large */}
        <Card className="col-span-full md:col-span-1 lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Messages</CardTitle>
            <Button variant="link" className="px-0 pt-0 justify-start">
              View all
            </Button>
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
                    <p className="text-sm font-medium leading-none">{message.sender.full_name || message.sender.username}</p>
                    <p className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleString()}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {message.content}
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
            <Button variant="link" className="px-0 pt-0 justify-start">
              View all
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4">
            {myFavorites.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={item.avatar === null ? undefined : item.avatar} alt={item.name} />
                    <AvatarFallback>{item.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.role}</p>
                  </div>
                </div>
                {item.starred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active Alerts Card - Full width on small/medium, 3/7 on large */}
        <Card className="col-span-full md:col-span-1 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Button variant="link" className="px-0 pt-0 justify-start">
              Manage
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4">
            {activeAlertsData.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <BellRing className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium leading-none">{alert.name}</p>
                    <p className="text-sm text-muted-foreground">{alert.criteria}</p>
                  </div>
                </div>
                <Switch checked={alert.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Suggestions for You Card - Full width on small/medium, 4/7 on large */}
        <Card className="col-span-full md:col-span-1 lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suggestions for You</CardTitle>
            <Button variant="link" className="px-0 pt-0 justify-start">
              Explore <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4">
            {suggestions.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {item.icon}
                  <div>
                    <p className="text-sm font-medium leading-none">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Button variant="link" size="sm">
                  {item.action}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Account Settings Card - Full width on small/medium, 3/7 on large */}
        <Card className="col-span-full md:col-span-1 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Settings</CardTitle>
            <Button variant="link" className="px-0 pt-0 justify-start">
              View all
            </Button>
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
    </div>
  );
}
