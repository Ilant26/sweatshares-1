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
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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

// Sample data for teams and navigation
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
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
      title: "Listings",
      url: "/dashboard/my-listings",
      icon: List,
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
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link href="/" className="flex items-center justify-start p-2">
          {/* Light mode logo */}
          <Image
            src="/logo/logo-svg-dark-text.svg"
            alt="SweatShares Logo"
            width={150}
            height={50}
            priority
            className="block dark:hidden"
          />
          {/* Dark mode logo */}
          <Image
            src="/logo/logo-svg-white-text.svg"
            alt="SweatShares Logo (White)"
            width={150}
            height={50}
            priority
            className="hidden dark:block"
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Support">
              <Link href="/support" className="relative flex items-center">
                <HelpCircle className="size-4" />
                <span>Support</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Make a Feedback">
              <Link href="/feedback" className="relative flex items-center">
                <MessageSquarePlus className="size-4" />
                <span>Make a Feedback</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
