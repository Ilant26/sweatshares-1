"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Users,
  BellRing,
  Star,
  Lock,
  LayoutDashboard,
  MessageCircle,
  List,
  ReceiptText,
  HelpCircle,
  MessageSquarePlus,
  Handshake,
  MessageSquare,
  X,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { useSession } from "@/components/providers/session-provider"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useUser } from '@/hooks/use-user';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

// Sample data for teams and navigation
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Opportunities",
      url: "/dashboard/my-listings",
      icon: Handshake,
    },
    {
      title: "Messages",
      url: "/dashboard/messages",
      icon: MessageCircle,
    },
    {
      title: "Network",
      url: "/dashboard/my-network",
      icon: Users,
    },
    {
      title: "Alerts",
      url: "/dashboard/my-alerts",
      icon: BellRing,
    },
    {
      title: "Favorites",
      url: "/dashboard/my-favorites",
      icon: Star,
    },
    {
      title: "Vault",
      url: "/dashboard/my-vault",
      icon: Lock,
    },
    {
      title: "Invoices",
      url: "/dashboard/my-invoices",
      icon: ReceiptText,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const { user, loading: userLoading } = useUser();
  const [docCount, setDocCount] = React.useState<number | null>(null);
  const [convCount, setConvCount] = React.useState<number | null>(null);
  const [loadingCounts, setLoadingCounts] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    setLoadingCounts(true);
    // Fetch document count
    const fetchCounts = async () => {
      const [{ count: docCountRes }, { data: messagesData, error: msgErr }] = await Promise.all([
        supabase
          .from('vault_documents')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', user.id),
        supabase
          .from('messages')
          .select('sender_id,receiver_id')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      ]);
      setDocCount(docCountRes ?? 0);
      // Count unique conversation partners
      if (msgErr || !messagesData) {
        setConvCount(0);
      } else {
        const partners = new Set<string>();
        messagesData.forEach((msg: any) => {
          if (msg.sender_id !== user.id) partners.add(msg.sender_id);
          if (msg.receiver_id !== user.id) partners.add(msg.receiver_id);
        });
        setConvCount(partners.size);
      }
      setLoadingCounts(false);
    };
    fetchCounts();
  }, [user]);

  const [showProCard, setShowProCard] = React.useState(true);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className={cn(
        "px-3 transition-all duration-200 ease-out",
        state === "collapsed" ? "py-4" : "py-6"
      )}>
        <Link
          href="/"
          className={cn(
            "flex items-center transition-all duration-200 ease-out",
            state === "collapsed" ? "justify-center" : "justify-start"
          )}>
          <div className="relative flex items-center">
            {/* Icon - always present but fades in/out */}
            <div className={cn(
              "w-6 h-6 transition-all duration-200 ease-out",
              state === "collapsed" 
                ? "opacity-100 scale-100" 
                : "opacity-0 scale-75 absolute"
            )}>
              <Image
                src="/logo/icon svg file.svg"
                alt="SweatShares Icon"
                width={24}
                height={24}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            {/* Full logo - always present but fades in/out */}
            <div className={cn(
              "flex items-center transition-all duration-200 ease-out",
              state === "collapsed" 
                ? "opacity-0 scale-75 absolute" 
                : "opacity-100 scale-100"
            )}>
              {/* Light mode logo */}
              <Image
                src="/logo/logo-svg-dark-text.svg"
                alt="SweatShares Logo"
                width={100}
                height={24}
                priority
                className="block dark:hidden h-6 w-auto"
              />
              {/* Dark mode logo */}
              <Image
                src="/logo/logo-svg-white-text.svg"
                alt="SweatShares Logo (White)"
                width={100}
                height={24}
                priority
                className="hidden dark:block h-6 w-auto"
              />
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className={cn(
        state === "collapsed" ? "pt-0" : "pt-2"
      )}>
        <NavMain items={data.navMain} />
      </SidebarContent>
      {/* --- SweatShares Pro Card (above footer) --- */}
      {state !== "collapsed" && showProCard && (
        <div className="px-3 pb-2 relative">
          <Card className="border border-border bg-card shadow-sm rounded-xl p-3">
            <CardHeader className="p-0 mb-1 flex flex-row items-center justify-between">
              <CardTitle className="text-[15px] font-semibold leading-tight">✨SweatShares Pro✨</CardTitle>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowProCard(false)}
                className="ml-2 p-1 rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                style={{ lineHeight: 0 }}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </CardHeader>
            <CardContent className="p-0 mb-2">
              <CardDescription className="text-sm leading-snug mb-3 text-foreground">
                Upgrade to unlock advanced listings, network connection, escrow payments and much more!
              </CardDescription>
              <Button className="w-full h-8 text-sm font-medium" variant="default" asChild>
                <Link href="/dashboard/pricing">Upgrade</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {/* --- Usage Stats (above footer menu, no card) --- */}
      {state !== "collapsed" && (
        <div className="px-3 pb-2">
          <div className="flex flex-col gap-2">
            <div className="w-full">
              <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                <span>
                  {loadingCounts || userLoading ? <Skeleton className="h-3 w-20 rounded" /> : `${docCount ?? 0} / 50 documents`}
                </span>
              </div>
              <Progress value={docCount !== null ? Math.min((docCount / 50) * 100, 100) : 0} className="h-1" />
            </div>
            <div className="w-full">
              <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                <span>
                  {loadingCounts || userLoading ? <Skeleton className="h-3 w-24 rounded" /> : `${convCount ?? 0} / 10 conversations`}
                </span>
              </div>
              <Progress value={convCount !== null ? Math.min((convCount / 10) * 100, 100) : 0} className="h-1" />
            </div>
            <Link
              href="/dashboard/pricing"
              className="mt-1 text-xs text-muted-foreground hover:underline transition-colors w-fit"
            >
              Change plan to increase usage limits
            </Link>
          </div>
        </div>
      )}
      {/* --- End Usage Stats --- */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Support">
              <Link
                href="/dashboard/support"
                className="relative flex items-center">
                <div className="flex items-center">
                  <HelpCircle className="size-4" />
                  <span className={cn("ml-2", state === "collapsed" ? "hidden" : "")}>Support</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Report a Bug">
              <Link
                href="/dashboard/report-a-bug"
                className="relative flex items-center">
                <div className="flex items-center">
                  <MessageSquarePlus className="size-4" />
                  <span className={cn("ml-2", state === "collapsed" ? "hidden" : "")}>Report a Bug</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
