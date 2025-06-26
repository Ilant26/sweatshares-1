"use client"

import { type LucideIcon } from "lucide-react"
import { useUnreadMessages, useUnreadInvitations } from '@/components/providers/session-provider';
import { SidebarMenuBadge, useSidebar } from '@/components/ui/sidebar';
import Link from "next/link"
import { usePathname } from "next/navigation"

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
  const { unreadInvitations } = useUnreadInvitations();
  const { state } = useSidebar();
  const pathname = usePathname();
  return (
    <SidebarGroup className="pt-0">
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          let isActive = false;
          if (item.url === "/dashboard") {
            isActive = pathname === "/dashboard";
          } else {
            isActive = pathname === item.url || pathname.startsWith(item.url + "/");
          }
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
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
                  {item.title === 'Network' && unreadInvitations > 0 && state === "expanded" && (
                    <SidebarMenuBadge className="ml-2 bg-destructive text-destructive-foreground">
                      {unreadInvitations < 10 ? unreadInvitations : '9+'}
                    </SidebarMenuBadge>
                  )}
                  {item.title === 'Network' && unreadInvitations > 0 && state === "collapsed" && (
                    <span className="absolute right-0.5 top-0.5 block h-2 w-2 rounded-full bg-destructive" />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
