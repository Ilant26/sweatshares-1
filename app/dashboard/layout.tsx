"use client"

import React, { useEffect, useState } from 'react';
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { usePathname, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route'
import { useSession, UnreadMessagesProvider, UnreadInvitationsProvider } from '@/components/providers/session-provider'
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { ChatInterface } from "@/components/chat-interface"
import { useIsMobile } from "@/hooks/use-mobile"

const SIDEBAR_COOKIE_NAME = "sidebar_state";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSession();
  const isMobile = useIsMobile();
  
  const segments = pathname.split('/').filter(Boolean);
  const [profileName, setProfileName] = useState<string>("");
  const isProfilePage = segments.includes("profile");
  const currentSection = pathname.includes('news-feed') ? 'feed' : 'dashboard';
  
  // Check if we're on either the dashboard home or feed page
  const showSelector = pathname === '/dashboard' || pathname === '/dashboard/news-feed';

  const handleGoBack = () => {
    router.back();
  };

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
                  {!showSelector && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mr-2 h-8 px-2 hover:bg-accent"
                      onClick={handleGoBack}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Go Back
                    </Button>
                  )}
                </div>
                {showSelector && (
                  <div className="flex-1 flex justify-center">
                    <div className="inline-flex items-center justify-center">
                      <nav className="flex space-x-12">
                        <Link
                          href="/dashboard"
                          className={cn(
                            "relative px-2 py-1 text-sm font-medium transition-colors",
                            "hover:text-foreground/80",
                            currentSection === 'dashboard' ? "text-foreground" : "text-foreground/60",
                            "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-200",
                            currentSection === 'dashboard' && "after:scale-x-100"
                          )}
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/dashboard/news-feed"
                          className={cn(
                            "relative px-2 py-1 text-sm font-medium transition-colors",
                            "hover:text-foreground/80",
                            currentSection === 'feed' ? "text-foreground" : "text-foreground/60",
                            "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-200",
                            currentSection === 'feed' && "after:scale-x-100"
                          )}
                        >
                          Feed
                        </Link>
                      </nav>
                    </div>
                  </div>
                )}
                <div className={cn(
                  "pr-4 flex items-center gap-2",
                  showSelector ? "ml-auto" : "flex-1 flex justify-end"
                )}>
                  <NotificationsDropdown />
                  <ThemeSwitcher />
                </div>
              </header>
              {children}
              {!isMobile && <ChatInterface />}
            </SidebarInset>
          </SidebarProvider>
        </UnreadInvitationsProvider>
      </UnreadMessagesProvider>
      <Toaster />
    </ProtectedRoute>
  );
} 