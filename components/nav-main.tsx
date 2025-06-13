"use client"

import { type LucideIcon } from "lucide-react"
import { useUnreadMessages } from '@/components/providers/session-provider';
import { SidebarMenuBadge, useSidebar } from '@/components/ui/sidebar';
import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const { unreadCount } = useUnreadMessages();
  const { state } = useSidebar();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <Link href={item.url} className="relative flex items-center">
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                {item.title === 'Messages' && unreadCount > 0 && state === "expanded" && (
                  <SidebarMenuBadge className="ml-2 bg-destructive text-destructive-foreground">
                    {unreadCount < 10 ? unreadCount : '9+'}
                  </SidebarMenuBadge>
                )}
                {item.title === 'Messages' && unreadCount > 0 && state === "collapsed" && (
                  <span className="absolute right-0.5 top-0.5 block h-2 w-2 rounded-full bg-destructive" />
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
