"use client"

import React from 'react';
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route'
import { useSession } from '@/components/providers/session-provider'

const SIDEBAR_COOKIE_NAME = "sidebar_state";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useSession();
  
  const pathSegments = pathname.split('/').filter(segment => segment !== '' && segment !== 'dashboard');

  const formatBreadcrumbSegment = (segment: string) => {
    const mappedName: { [key: string]: string } = {
      'messages': 'Messages',
      'my-listings': 'My Listings',
      'my-network': 'My Network',
      'invite-contacts': 'Invite Contacts',
      'profile-settings': 'Profile Settings',
      'my-alerts': 'My Alerts',
      'my-favorites': 'My Favorites',
      'my-vault': 'My Vault',
      'news-feed': 'News Feed',
    };
    return mappedName[segment] || segment.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {pathSegments.map((segment, index) => {
                    const href = '/dashboard/' + pathSegments.slice(0, index + 1).join('/');
                    const isLast = index === pathSegments.length - 1;
                    const formattedSegment = formatBreadcrumbSegment(segment);

                    return (
                      <React.Fragment key={href}>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage>{formattedSegment}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink href={href}>{formattedSegment}</BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto pr-4">
              <ThemeSwitcher />
            </div>
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
} 