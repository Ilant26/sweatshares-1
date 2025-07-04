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

// Sample data for teams and navigation
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Listings",
      url: "/dashboard/my-listings",
      icon: List,
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
          )}
        >
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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Support">
              <Link href="/dashboard/support" className="relative flex items-center">
                <HelpCircle className="size-4" />
                <span>Support</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Report a Bug">
              <Link href="/dashboard/report-a-bug" className="relative flex items-center">
                <MessageSquarePlus className="size-4" />
                <span>Report a Bug</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
