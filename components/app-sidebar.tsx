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
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useSession } from "@/components/providers/session-provider"

// Sample data for teams and navigation
const data = {
  navMain: [
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
      title: "My Alerts",
      url: "/dashboard/my-alerts",
      icon: BellRing,
    },
    {
      title: "My Favorites",
      url: "/dashboard/my-favorites",
      icon: Star,
    },
    {
      title: "Listings",
      url: "/dashboard/my-listings",
      icon: List,
    },
    {
      title: "My Vault",
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
  const { user } = useSession();

  const userData = {
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    avatar: user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}`,
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
