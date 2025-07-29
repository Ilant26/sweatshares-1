"use client";
import React from 'react';
import Link from 'next/link';
import { Menu as MenuIcon, X, Home, List, DollarSign, Mail, LayoutDashboard, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/components/providers/session-provider';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

const menuItems = [
    { name: 'For Independants', href: '/for-independants', icon: Home },
    { name: 'For Companies', href: '/for-companies', icon: List },
    { name: 'For Investors', href: '/for-investors', icon: DollarSign },
];

export const Menu = () => {
    const [menuState, setMenuState] = React.useState(false);
    const [headerHeight, setHeaderHeight] = React.useState(80); // Default fallback height
    const { user } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const headerRef = React.useRef<HTMLElement>(null);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    // Calculate header height dynamically with better timing and fallbacks
    React.useEffect(() => {
        const updateHeaderHeight = () => {
            if (headerRef.current) {
                const height = headerRef.current.offsetHeight;
                // Use measured height if valid, otherwise use fallback
                const finalHeight = height > 0 ? height : (user ? 80 : 100); // Reduced banner height for mobile
                setHeaderHeight(finalHeight);
            }
        };

        // Initial calculation
        updateHeaderHeight();
        
        // Use multiple timing strategies for reliability
        const timeoutId = setTimeout(updateHeaderHeight, 100); // Delayed calculation
        const rafId = requestAnimationFrame(updateHeaderHeight); // Next frame calculation
        
        // Resize listener
        window.addEventListener('resize', updateHeaderHeight);
        
        return () => {
            clearTimeout(timeoutId);
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', updateHeaderHeight);
        };
    }, [user]); // Recalculate when user state changes (banner appears/disappears)

    // Additional effect to recalculate when menu opens
    React.useEffect(() => {
        if (menuState && headerRef.current) {
            const height = headerRef.current.offsetHeight;
            if (height > 0) {
                setHeaderHeight(height);
            }
        }
    }, [menuState]);

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (menuState && !target.closest('nav')) {
                setMenuState(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [menuState]);

    // Close menu on route change
    React.useEffect(() => {
        setMenuState(false);
    }, [pathname]);

    // Prevent body scroll when menu is open
    React.useEffect(() => {
        if (menuState) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [menuState]);

    // Calculate safe top position with minimum offset
    const safeTopPosition = Math.max(headerHeight, user ? 80 : 100); // Reduced banner height for mobile

    return (
        <header ref={headerRef} className="sticky top-0 z-50 w-full">
            {/* Disclaimer Banner - Only show when user is not logged in */}
            {!user && (
                <div className="w-full bg-blue-600 text-white py-1.5 sm:py-2 px-3 sm:px-4 text-center text-xs sm:text-sm font-medium">
                    <span className="flex items-center justify-center gap-1 sm:gap-2">
                        <span className="inline-block w-1.5 sm:w-2 h-1.5 sm:h-2 bg-green-500 rounded-full animate-pulse"></span>
                        SweatShares is now live,{' '}
                        <Link href="/auth/login" className="underline hover:text-blue-200 transition-colors">
                            start now
                        </Link>
                        {' '}→
                    </span>
                </div>
            )}
            
            {/* Main Menu */}
            <nav
                data-state={menuState && 'active'}
                className="relative w-full bg-background/95 backdrop-blur-md border-b border-border/40">
                <div className="flex items-center py-2 sm:py-3 lg:py-4 px-3 sm:px-6 lg:px-12">
                    {/* Left Group: Logo + Navigation */}
                    <div className="flex items-center">
                        {/* Logo */}
                        <Link
                            href="/"
                            aria-label="home"
                            className="flex items-center space-x-2 relative z-50">
                            {/* Light mode logo */}
                            <Image
                              src="/logo/logo-svg-dark-text.svg"
                              alt="SweatShares Logo"
                              width={120}
                              height={40}
                              priority
                              className="block dark:hidden sm:w-[160px] sm:h-[50px]"
                            />
                            {/* Dark mode logo */}
                            <Image
                              src="/logo/logo-svg-white-text.svg"
                              alt="SweatShares Logo (White)"
                              width={120}
                              height={40}
                              priority
                              className="hidden dark:block sm:w-[160px] sm:h-[50px]"
                            />
                        </Link>

                        {/* Navigation Menu - Immediately after logo */}
                        <div className="hidden lg:flex items-center ml-8">
                            <ul className="flex gap-8 text-base">
                                {menuItems.map((item, index) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "block relative text-black dark:text-white font-medium transition-colors duration-200",
                                                    isActive 
                                                        ? "text-primary" 
                                                        : "hover:text-primary/80"
                                                )}>
                                                <div className="relative">
                                                    {item.name}
                                                    {isActive && (
                                                        <motion.div 
                                                            layoutId="navbar-indicator"
                                                            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                        />
                                                    )}
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>

                    {/* Right Side - Auth Buttons & Theme Toggle */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 ml-auto">
                        {/* Theme Switcher */}
                        <div className="hidden lg:block">
                            <ThemeSwitcher />
                        </div>
                        
                        {/* Auth Buttons */}
                        <div className="hidden lg:flex items-center gap-3">
                            {user ? (
                                <>
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm">
                                        <Link href="/dashboard" className="flex items-center gap-2">
                                            <LayoutDashboard className="h-4 w-4" />
                                            Dashboard
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSignOut}>
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Sign Out
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm">
                                        <Link href="/auth/login">
                                            Login
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="sm">
                                        <Link href="/auth/sign-up">
                                            Sign Up
                                        </Link>
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMenuState(!menuState)}
                            aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                            className="relative z-50 -m-2 block cursor-pointer p-2 lg:hidden transition-colors duration-200 hover:bg-accent rounded-md">
                            <motion.div
                                animate={{ rotate: menuState ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                            <MenuIcon className={cn(
                                    "m-auto size-6 transition-opacity duration-200",
                                    menuState ? "opacity-0" : "opacity-100"
                            )} />
                            <X className={cn(
                                    "m-auto size-6 absolute inset-0 transition-opacity duration-200",
                                    menuState ? "opacity-100" : "opacity-0"
                            )} />
                            </motion.div>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Backdrop */}
                <AnimatePresence>
                    {menuState && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                            onClick={() => setMenuState(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Mobile Menu */}
                <AnimatePresence>
                {menuState && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-x-0 bg-background/95 backdrop-blur-xl border-b border-border/40 shadow-lg lg:hidden"
                            style={{
                                top: `${safeTopPosition}px`,
                                maxHeight: `calc(100vh - ${safeTopPosition}px)`,
                                overflowY: 'auto',
                                zIndex: 45
                            }}
                        >
                            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
                            <div className="space-y-6">
                                    <ul className="space-y-1">
                                    {menuItems.map((item, index) => {
                                        const isActive = pathname === item.href;
                                        return (
                                                <motion.li 
                                                    key={index}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setMenuState(false)}
                                                    className={cn(
                                                            "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200",
                                                        isActive 
                                                                ? "text-primary bg-primary/10 border border-primary/20" 
                                                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                    )}>
                                                        <item.icon className={cn(
                                                            "size-5 transition-colors duration-200",
                                                            isActive ? "text-primary" : "text-muted-foreground"
                                                        )} />
                                                        {item.name}
                                                </Link>
                                                </motion.li>
                                        );
                                    })}
                                </ul>

                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="space-y-4 pt-4 border-t border-border/60"
                                    >
                                        <div className="flex items-center justify-between px-4">
                                            <span className="text-sm font-medium text-muted-foreground">Theme</span>
                                        <ThemeSwitcher />
                                    </div>
                                        
                                        <div className="px-4">
                                    {user ? (
                                                <div className="flex flex-col gap-3">
                                            <Button
                                                asChild
                                                variant="outline"
                                                        size="lg"
                                                        className="w-full h-12 text-base">
                                                        <Link href="/dashboard" className="flex items-center justify-center gap-2">
                                                            <LayoutDashboard className="h-5 w-5" />
                                                    Dashboard
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                        size="lg"
                                                        className="w-full h-12 text-base"
                                                onClick={handleSignOut}>
                                                        <LogOut className="h-5 w-5 mr-2" />
                                                Sign Out
                                            </Button>
                                        </div>
                                    ) : (
                                                <div className="flex flex-col gap-3">
                                            <Button
                                                asChild
                                                variant="outline"
                                                        size="lg"
                                                        className="w-full h-12 text-base">
                                                <Link href="/auth/login">
                                                    Login
                                                </Link>
                                            </Button>
                                            <Button
                                                asChild
                                                        size="lg"
                                                        className="w-full h-12 text-base">
                                                <Link href="/auth/sign-up">
                                                    Sign Up
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                )}
                </AnimatePresence>
            </nav>
        </header>
    );
}; 