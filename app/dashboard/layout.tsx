"use client"

import React, { useEffect, useState } from 'react';
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
import { useSession, UnreadMessagesProvider, UnreadInvitationsProvider } from '@/components/providers/session-provider'
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

const SIDEBAR_COOKIE_NAME = "sidebar_state";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useSession();
  
  const segments = pathname.split('/').filter(Boolean);
  const [profileName, setProfileName] = useState<string>("");
  const isProfilePage = segments.includes("profile");

  useEffect(() => {
    const fetchProfileName = async () => {
      if (isProfilePage && segments.length > 2) {
        const userId = segments[segments.length - 1];
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .single();

        if (!error && data) {
          setProfileName(data.full_name);
        }
      }
    };

    fetchProfileName();
  }, [segments, isProfilePage]);

  const getBreadcrumbItems = () => {
    if (isProfilePage) {
      return [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Feed", href: "/dashboard/news-feed" },
        { label: profileName || "User Profile", href: pathname }
      ];
    }

    return segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      const label = segment === "dashboard" ? "Dashboard" :
                   segment === "news-feed" ? "Feed" :
                   segment.charAt(0).toUpperCase() + segment.slice(1);
      return { label, href };
    });
  };

  return (
    <ProtectedRoute>
      <UnreadMessagesProvider>
        <UnreadInvitationsProvider>
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
                      {getBreadcrumbItems().map((item, index) => {
                        const isLast = index === getBreadcrumbItems().length - 1;
                        return (
                          <React.Fragment key={item.href}>
                            <BreadcrumbItem>
                              {isLast ? (
                                <BreadcrumbPage>{item.label}</BreadcrumbPage>
                              ) : (
                                <BreadcrumbLink asChild>
                                  <Link href={item.href}>{item.label}</Link>
                                </BreadcrumbLink>
                              )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
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
        </UnreadInvitationsProvider>
      </UnreadMessagesProvider>
      <Toaster />
    </ProtectedRoute>
  );
} 