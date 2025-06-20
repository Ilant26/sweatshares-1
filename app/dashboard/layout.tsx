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
import { NavUser } from "@/components/nav-user"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { ChevronsUpDown } from "lucide-react"

const SIDEBAR_COOKIE_NAME = "sidebar_state";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSession();
  const isMobile = useIsMobile();
  
  const segments = pathname.split('/').filter(Boolean);
  const [profileName, setProfileName] = useState<string>("");
  const isProfilePage = segments.includes("profile");
  const isDashboard = pathname === '/dashboard';
  const isFeed = pathname === '/dashboard/news-feed';
  const isFindPartner = pathname === '/dashboard/find-partner';
  const currentSection = isFeed ? 'feed' : isDashboard ? 'dashboard' : null;
  
  const userData = {
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    avatar: user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}`,
  };

  // Function to get the previous page name based on current pathname
  const getPreviousPageName = () => {
    let lastVisitedSection = 'dashboard';
    if (typeof window !== 'undefined') {
      lastVisitedSection = localStorage.getItem('lastVisitedSection') || 'dashboard';
    }
    if (lastVisitedSection === 'feed') {
      return 'News Feed';
    } else if (lastVisitedSection === 'dashboard') {
      return 'Dashboard';
    }
    // Fallback based on current pathname
    if (pathname.includes('/my-listings')) {
      return 'Dashboard';
    } else if (pathname.includes('/my-network')) {
      return 'Dashboard';
    } else if (pathname.includes('/messages')) {
      return 'Dashboard';
    } else if (pathname.includes('/my-favorites')) {
      return 'Dashboard';
    } else if (pathname.includes('/my-alerts')) {
      return 'Dashboard';
    } else if (pathname.includes('/profile-settings')) {
      return 'Dashboard';
    } else if (pathname.includes('/my-invoices')) {
      return 'Dashboard';
    } else if (pathname.includes('/my-vault')) {
      return 'Dashboard';
    } else if (pathname.includes('/connect')) {
      return 'Dashboard';
    } else if (pathname.includes('/profile/')) {
      return 'Dashboard';
    }
    return 'Dashboard';
  };

  // Store last visited section in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastVisitedSection', currentSection || 'dashboard');
    }
  }, [currentSection]);

  const handleGoBack = () => {
    let lastVisitedSection = 'dashboard';
    if (typeof window !== 'undefined') {
      lastVisitedSection = localStorage.getItem('lastVisitedSection') || 'dashboard';
    }
    if (lastVisitedSection === 'feed') {
      router.push('/dashboard/news-feed');
    } else {
      router.push('/dashboard');
    }
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
                  {(pathname !== '/dashboard' && pathname !== '/dashboard/news-feed') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mr-2 h-8 px-2 hover:bg-accent"
                      onClick={handleGoBack}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to {getPreviousPageName()}
                    </Button>
                  )}
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="inline-flex items-center justify-center">
                    <nav className="flex space-x-12">
                      <Link
                        href="/dashboard/news-feed"
                        className={cn(
                          "relative px-2 py-1 text-sm font-medium transition-colors",
                          "hover:text-primary/80",
                          currentSection === 'feed' ? "text-primary" : "text-muted-foreground",
                          "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-200",
                          currentSection === 'feed' && "after:scale-x-100"
                        )}
                      >
                        News Feed
                      </Link>
                      <Link
                        href="/dashboard/find-partner"
                        className={cn(
                          "relative px-2 py-1 text-sm font-medium transition-colors",
                          "hover:text-primary/80",
                          isFindPartner ? "text-primary" : "text-muted-foreground",
                          "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-200",
                          isFindPartner && "after:scale-x-100"
                        )}
                      >
                        Find My Partner
                      </Link>
                    </nav>
                  </div>
                </div>
                <div className={cn(
                  "pr-4 flex items-center gap-2",
                  "ml-auto"
                )}>
                  <ThemeSwitcher />
                  <NotificationsDropdown />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2 hover:bg-accent">
                        <Avatar className="h-6 w-6 rounded-lg">
                          <AvatarImage src={userData.avatar} alt={userData.name} />
                          <AvatarFallback className="rounded-lg text-xs">
                            {userData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="ml-2 text-sm font-medium">{userData.name}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                      <DropdownMenuLabel className="p-0 font-normal">
                        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                          <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage src={userData.avatar} alt={userData.name} />
                            <AvatarFallback className="rounded-lg">
                              {userData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">{userData.name}</span>
                            <span className="truncate text-xs">{userData.email}</span>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard/profile-settings">
                            My Account
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="#">
                            Billing
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={async () => {
                        const { signOut } = useSession();
                        await signOut();
                        router.push('/');
                      }}>
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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