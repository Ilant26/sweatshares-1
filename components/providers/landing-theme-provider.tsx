"use client";

import { usePathname } from 'next/navigation';
import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

interface LandingPageThemeProviderProps {
  children: ReactNode;
}

export function LandingPageThemeProvider({ children }: LandingPageThemeProviderProps) {
  const pathname = usePathname();
  
  // Check if we're on the landing page (root path) or auth pages
  const isLandingPage = pathname === '/' || 
                       pathname === '/listing' || 
                       pathname.startsWith('/listing/') ||
                       pathname === '/onboarding';
  
  // Check if we're on auth pages
  const isAuthPage = pathname.startsWith('/auth/');
  
  // Force light mode for landing page and auth pages
  if (isLandingPage || isAuthPage) {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
        storageKey="sweatshares-theme"
        forcedTheme="light"
      >
        {children}
      </ThemeProvider>
    );
  }
  
  // Use normal theme system for dashboard and other authenticated pages
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="sweatshares-theme"
    >
      {children}
    </ThemeProvider>
  );
}

export default LandingPageThemeProvider;