"use client"

import React, { useEffect, useState, Suspense } from 'react';
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route'
import { useSession, UnreadMessagesProvider, UnreadInvitationsProvider } from '@/components/providers/session-provider'
import { NotificationsProvider } from '@/components/providers/notifications-provider'
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

// Component that uses useSearchParams - needs to be wrapped in Suspense
function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut } = useSession();
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

  // Function to get the previous page name and path based on current pathname
  const getPreviousPageInfo = () => {
    const currentPath = pathname;
    
    // Define navigation patterns
    const navigationPatterns = [
      {
        current: '/dashboard/my-listings',
        previous: { name: 'Dashboard', path: '/dashboard' }
      },
      {
        current: '/dashboard/my-network',
        previous: { name: 'Dashboard', path: '/dashboard' }
      },
      {
        current: '/dashboard/messages',
        previous: { name: 'Dashboard', path: '/dashboard' }
      },
      {
        current: '/dashboard/my-favorites',
        previous: { name: 'Dashboard', path: '/dashboard' }
      },
      {
        current: '/dashboard/my-alerts',
        previous: { name: 'Dashboard', path: '/dashboard' }
      },
      {
        current: '/dashboard/profile-settings',
        previous: { name: 'Dashboard', path: '/dashboard' }
      },
      {
        current: '/dashboard/my-invoices',
        previous: { name: 'Dashboard', path: '/dashboard' }
      },
      {
        current: '/dashboard/my-vault',
        previous: { name: 'Dashboard', path: '/dashboard' }
      },
      {
        current: '/dashboard/connect',
        previous: { name: 'Dashboard', path: '/dashboard' }
      },
      {
        current: '/dashboard/listings',
        previous: { name: 'Dashboard', path: '/dashboard' }
      },
      {
        current: '/dashboard/news-feed',
        previous: { name: 'Dashboard', path: '/dashboard' }
      },
      {
        current: '/dashboard/find-partner',
        previous: { name: 'Dashboard', path: '/dashboard' }
      },
      {
        current: '/dashboard/support',
        previous: { name: 'Dashboard', path: '/dashboard' }
      },
      {
        current: '/dashboard/report-a-bug',
        previous: { name: 'Dashboard', path: '/dashboard' }
      }
    ];

    // Check for profile pages
    if (currentPath.startsWith('/dashboard/profile/')) {
      const profileId = currentPath.split('/').pop();
      // Check if we came from find-partner or news-feed by looking at the source parameter
      const source = searchParams.get('source');
      if (source === 'find-partner') {
        return { name: 'Find My Partner', path: '/dashboard/find-partner' };
      }
      if (source === 'news-feed') {
        return { name: 'News Feed', path: '/dashboard/news-feed' };
      }
      return { name: 'Dashboard', path: '/dashboard' };
    }

    // Check for listing detail pages - special handling for find-partner navigation
    if (currentPath.startsWith('/dashboard/listings/')) {
      // Check if we came from find-partner by looking at the source parameter
      const source = searchParams.get('source');
      if (source === 'find-partner') {
        return { name: 'Find My Partner', path: '/dashboard/find-partner' };
      }
      if (source === 'profile') {
        const profileName = searchParams.get('profileName');
        const profileId = searchParams.get('profileId');
        const decodedName = profileName ? decodeURIComponent(profileName) : 'User';
        return { name: `${decodedName}'s Profile`, path: `/dashboard/profile/${profileId || ''}` };
      }
      if (source === 'dashboard') {
        return { name: 'Dashboard', path: '/dashboard' };
      }
      return { name: 'Listings', path: '/dashboard/listings' };
    }

    // Check for specific patterns
    for (const pattern of navigationPatterns) {
      if (currentPath === pattern.current) {
        return pattern.previous;
      }
    }

    // Check for sub-pages of main sections
    if (currentPath.startsWith('/dashboard/my-listings/')) {
      return { name: 'My Listings', path: '/dashboard/my-listings' };
    }
    if (currentPath.startsWith('/dashboard/my-network/')) {
      return { name: 'My Network', path: '/dashboard/my-network' };
    }
    if (currentPath.startsWith('/dashboard/messages/')) {
      return { name: 'Messages', path: '/dashboard/messages' };
    }
    if (currentPath.startsWith('/dashboard/my-favorites/')) {
      return { name: 'My Favorites', path: '/dashboard/my-favorites' };
    }
    if (currentPath.startsWith('/dashboard/my-alerts/')) {
      return { name: 'My Alerts', path: '/dashboard/my-alerts' };
    }
    if (currentPath.startsWith('/dashboard/my-invoices/')) {
      return { name: 'My Invoices', path: '/dashboard/my-invoices' };
    }
    if (currentPath.startsWith('/dashboard/my-vault/')) {
      return { name: 'My Vault', path: '/dashboard/my-vault' };
    }
    if (currentPath.startsWith('/dashboard/connect/')) {
      return { name: 'Connect', path: '/dashboard/connect' };
    }
    if (currentPath.startsWith('/dashboard/support/')) {
      return { name: 'Support', path: '/dashboard/support' };
    }
    if (currentPath.startsWith('/dashboard/report-a-bug/')) {
      return { name: 'Report a Bug', path: '/dashboard/report-a-bug' };
    }

    // Fallback to dashboard
    return { name: 'Dashboard', path: '/dashboard' };
  };

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      // Fallback to dashboard if no history
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
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-2 sm:px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="size-8 flex items-center justify-center p-0 bg-transparent border-0 shadow-none hover:bg-accent/40 transition-colors rounded-md" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4 hidden sm:block"
        />
        {(pathname !== '/dashboard' && pathname !== '/dashboard/news-feed') && (
          <Button
            variant="ghost"
            size="sm"
            className="mr-2 h-8 px-2 hover:bg-accent text-xs sm:text-sm"
            onClick={handleGoBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to previous page</span>
            <span className="sm:hidden">Back</span>
          </Button>
        )}
      </div>
      <div className="absolute left-1/2 transform -translate-x-1/2 hidden sm:flex">
        <div className="inline-flex items-center justify-center">
          <nav className="flex space-x-6 lg:space-x-12">
            <Link
              href="/dashboard/news-feed"
              className={cn(
                "relative px-2 py-1 text-xs lg:text-sm font-bold transition-colors", // font-bold always
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
                "relative px-2 py-1 text-xs lg:text-sm font-bold transition-colors", // font-bold always
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
      <div className="absolute left-1/2 transform -translate-x-1/2 sm:hidden">
        <div className="inline-flex items-center justify-center">
          <nav className="flex space-x-4">
            <Link
              href="/dashboard/news-feed"
              className={cn(
                "relative px-2 py-1 text-xs font-bold transition-colors", // font-bold always
                "hover:text-primary/80",
                currentSection === 'feed' ? "text-primary" : "text-muted-foreground",
                "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-200",
                currentSection === 'feed' && "after:scale-x-100"
              )}
            >
              Feed
            </Link>
            <Link
              href="/dashboard/find-partner"
              className={cn(
                "relative px-2 py-1 text-xs font-bold transition-colors", // font-bold always
                "hover:text-primary/80",
                isFindPartner ? "text-primary" : "text-muted-foreground",
                "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-200",
                isFindPartner && "after:scale-x-100"
              )}
            >
              Find
            </Link>
          </nav>
        </div>
      </div>
      <div className={cn(
        "flex items-center gap-1 sm:gap-2",
        "ml-auto"
      )}>
        <div className="hidden sm:block">
          <button className="size-8 flex items-center justify-center p-0 bg-transparent border-0 shadow-none hover:bg-accent/40 transition-colors rounded-md">
            <ThemeSwitcher />
          </button>
        </div>
        <div className="hidden sm:block">
          <button className="size-8 flex items-center justify-center p-0 bg-transparent border-0 shadow-none hover:bg-accent/40 transition-colors rounded-md">
            <NotificationsDropdown />
          </button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-1 sm:px-2 hover:bg-accent">
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={userData.avatar} alt={userData.name} />
                <AvatarFallback className="rounded-full text-xs">
                  {userData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="ml-2 text-xs sm:text-sm font-medium hidden sm:inline">{userData.name}</span>
              <ChevronsUpDown className="ml-1 sm:ml-2 h-4 w-4" />
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
                <Link href="/dashboard/pricing">
                  My Current Plan
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
              await signOut();
            }}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const isMobile = useIsMobile();

  return (
    <ProtectedRoute>
      <NotificationsProvider>
      <UnreadMessagesProvider>
        <UnreadInvitationsProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <Suspense fallback={
                <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-2 sm:px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger className="size-8 flex items-center justify-center p-0 bg-transparent border-0 shadow-none hover:bg-accent/40 transition-colors rounded-md" />
                    <Separator
                      orientation="vertical"
                      className="mr-2 data-[orientation=vertical]:h-4 hidden sm:block"
                    />
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 hidden sm:flex">
                    <div className="inline-flex items-center justify-center">
                      <nav className="flex space-x-6 lg:space-x-12">
                        <div className="relative px-2 py-1 text-xs lg:text-sm font-bold text-muted-foreground">
                          News Feed
                        </div>
                        <div className="relative px-2 py-1 text-xs lg:text-sm font-bold text-muted-foreground">
                          Find My Partner
                        </div>
                      </nav>
                    </div>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 sm:hidden">
                    <div className="inline-flex items-center justify-center">
                      <nav className="flex space-x-4">
                        <div className="relative px-2 py-1 text-xs font-bold text-muted-foreground">
                          Feed
                        </div>
                        <div className="relative px-2 py-1 text-xs font-bold text-muted-foreground">
                          Find
                        </div>
                      </nav>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                    <div className="hidden sm:block">
                      <button className="size-8 flex items-center justify-center p-0 bg-transparent border-0 shadow-none hover:bg-accent/40 transition-colors rounded-md">
                        <ThemeSwitcher />
                      </button>
                    </div>
                    <div className="hidden sm:block">
                      <button className="size-8 flex items-center justify-center p-0 bg-transparent border-0 shadow-none hover:bg-accent/40 transition-colors rounded-md">
                        <NotificationsDropdown />
                      </button>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 px-1 sm:px-2 hover:bg-accent">
                      <Avatar className="h-8 w-8 rounded-full">
                        <AvatarFallback className="rounded-full text-xs">
                          {user?.user_metadata?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="ml-2 text-xs sm:text-sm font-medium hidden sm:inline">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                      </span>
                      <ChevronsUpDown className="ml-1 sm:ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </header>
              }>
                <DashboardHeader />
              </Suspense>
              <div className="flex-1 overflow-auto">
                {children}
              </div>
              {!isMobile && <ChatInterface />}
            </SidebarInset>
          </SidebarProvider>
        </UnreadInvitationsProvider>
      </UnreadMessagesProvider>
      </NotificationsProvider>
      <Toaster />
    </ProtectedRoute>
  );
} 