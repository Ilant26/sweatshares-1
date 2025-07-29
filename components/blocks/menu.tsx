"use client";
import React from 'react';
import Link from 'next/link';
import { Menu as MenuIcon, X, Home, List, DollarSign, Mail, LayoutDashboard, LogOut, User, Building2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/components/providers/session-provider';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

const menuItems = [
    { name: 'For Independants', href: '/for-independants', icon: User },
    { name: 'For Companies', href: '/for-companies', icon: Building2 },
    { name: 'For Investors', href: '/for-investors', icon: TrendingUp },
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
                className="relative w-full bg-white dark:bg-gray-900 border-b border-border/40">
                <div className="flex items-center py-3 lg:py-4 px-3 sm:px-6 lg:px-12">
                    {/* Left Group: Logo + Navigation */}
                    <div className="flex items-center">
                        {/* Logo - Hidden when menu is open */}
                        <Link
                            href="/"
                            aria-label="home"
                            className={cn(
                                "flex items-center space-x-2 relative z-50 transition-opacity duration-300",
                                menuState ? "opacity-0 lg:opacity-100" : "opacity-100"
                            )}>
                            {/* Light mode logo */}
                            <Image
                              src="/logo/logo-svg-dark-text.svg"
                              alt="SweatShares Logo"
                              width={160}
                              height={50}
                              priority
                              className="block dark:hidden w-[160px] h-[50px] sm:w-[180px] sm:h-[56px]"
                            />
                            {/* Dark mode logo */}
                            <Image
                              src="/logo/logo-svg-white-text.svg"
                              alt="SweatShares Logo (White)"
                              width={160}
                              height={50}
                              priority
                              className="hidden dark:block w-[160px] h-[50px] sm:w-[180px] sm:h-[56px]"
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
                                        <Link href="/dashboard">
                                            Dashboard
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSignOut}>
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
                        <div
                            onClick={() => setMenuState(!menuState)}
                            className={cn(
                                "fixed right-4 z-50 w-10 h-10 flex items-center justify-center cursor-pointer lg:hidden transition-all duration-300",
                                user ? "top-4" : "top-12" // Account for banner when user is not logged in
                            )}
                        >
                            {!menuState ? (
                                // Hamburger lines
                                <div className="relative w-5 h-4 flex flex-col justify-between items-center">
                                    <span className="block h-0.5 w-5 bg-black dark:bg-white transition-transform duration-300"></span>
                                    <span className="block h-0.5 w-5 bg-black dark:bg-white transition-opacity duration-300"></span>
                                    <span className="block h-0.5 w-5 bg-black dark:bg-white transition-transform duration-300"></span>
                                </div>
                            ) : (
                                // Clean X icon
                                <X className="w-5 h-5 text-black dark:text-white" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Backdrop */}
                <AnimatePresence>
                    {menuState && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                            onClick={() => setMenuState(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Curved Mobile Menu */}
                <AnimatePresence mode="wait">
                {menuState && (
                        <motion.div
                            initial={{ x: "calc(100% + 100px)" }}
                            animate={{ 
                                x: "0", 
                                transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
                            }}
                            exit={{
                                x: "calc(100% + 100px)",
                                transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
                            }}
                            className="h-screen w-screen max-w-sm fixed right-0 top-0 z-40 bg-white dark:bg-gray-900 lg:hidden"
                        >
                            {/* Curved SVG */}
                            <svg
                                className="absolute top-0 -left-[99px] w-[100px] stroke-none h-full"
                                style={{ fill: "currentColor" }}
                            >
                                <motion.path
                                    initial={{
                                        d: `M100 0 L200 0 L200 ${typeof window !== 'undefined' ? window.innerHeight : 800} L100 ${typeof window !== 'undefined' ? window.innerHeight : 800} Q-100 ${typeof window !== 'undefined' ? window.innerHeight / 2 : 400} 100 0`
                                    }}
                                    animate={{
                                        d: `M100 0 L200 0 L200 ${typeof window !== 'undefined' ? window.innerHeight : 800} L100 ${typeof window !== 'undefined' ? window.innerHeight : 800} Q100 ${typeof window !== 'undefined' ? window.innerHeight / 2 : 400} 100 0`,
                                        transition: { duration: 1, ease: [0.76, 0, 0.24, 1] }
                                    }}
                                    exit={{
                                        d: `M100 0 L200 0 L200 ${typeof window !== 'undefined' ? window.innerHeight : 800} L100 ${typeof window !== 'undefined' ? window.innerHeight : 800} Q-100 ${typeof window !== 'undefined' ? window.innerHeight / 2 : 400} 100 0`,
                                        transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
                                    }}
                                    className="text-white dark:text-gray-900"
                                />
                            </svg>

                            <div className="h-full pt-16 flex flex-col justify-between">
                                {/* Navigation Section */}
                                <div className="flex flex-col gap-3 px-10">
                                    <div className="text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 uppercase text-xs font-medium tracking-wider mb-6 pb-2">
                                        <p>Navigation</p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                    {menuItems.map((item, index) => {
                                        const isActive = pathname === item.href;
                                        return (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ 
                                                        opacity: 1, 
                                                        x: 0,
                                                        transition: { 
                                                            delay: index * 0.1 + 0.2,
                                                            duration: 0.3
                                                        }
                                                    }}
                                                    className="group"
                                                >
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setMenuState(false)}
                                                    className={cn(
                                                            "flex items-center gap-4 px-4 py-4 rounded-xl font-medium text-lg transition-all duration-200",
                                                        isActive 
                                                                ? "bg-primary text-primary-foreground" 
                                                                : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                        )}
                                                    >
                                                        <item.icon className={cn(
                                                            "size-5 transition-colors duration-200",
                                                            isActive 
                                                                ? "text-primary-foreground" 
                                                                : "text-gray-600 dark:text-gray-400"
                                                        )} />
                                                        <span className="font-medium">{item.name}</span>
                                                </Link>
                                                </motion.div>
                                        );
                                    })}
                                    </div>
                                </div>

                                {/* Footer Section */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ 
                                        opacity: 1, 
                                        y: 0,
                                        transition: { 
                                            delay: 0.5,
                                            duration: 0.3
                                        }
                                    }}
                                    className="px-10 pb-8 space-y-6"
                                >
                                    {/* Theme Toggle */}
                                    <div className="flex items-center justify-between py-4 border-t border-gray-200 dark:border-gray-700">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Theme
                                        </span>
                                        <ThemeSwitcher />
                                    </div>

                                    {/* Auth Buttons */}
                                    <div className="space-y-3">
                                    {user ? (
                                            <>
                                            <Button
                                                asChild
                                                variant="outline"
                                                    className="w-full h-12 text-base font-medium border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                >
                                                    <Link 
                                                        href="/dashboard"
                                                        onClick={() => setMenuState(false)}
                                                        className="flex items-center justify-center gap-2"
                                                    >
                                                        <LayoutDashboard className="h-4 w-4" />
                                                        <span>Dashboard</span>
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                    className="w-full h-12 text-base font-medium border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    onClick={() => {
                                                        handleSignOut();
                                                        setMenuState(false);
                                                    }}
                                                >
                                                <LogOut className="h-4 w-4 mr-2" />
                                                    <span>Sign Out</span>
                                            </Button>
                                            </>
                                    ) : (
                                            <>
                                            <Button
                                                asChild
                                                variant="outline"
                                                    className="w-full h-12 text-base font-medium border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                >
                                                    <Link 
                                                        href="/auth/login"
                                                        onClick={() => setMenuState(false)}
                                                    >
                                                    Login
                                                </Link>
                                            </Button>
                                            <Button
                                                asChild
                                                    className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90"
                                                >
                                                    <Link 
                                                        href="/auth/sign-up"
                                                        onClick={() => setMenuState(false)}
                                                    >
                                                    Sign Up
                                                </Link>
                                            </Button>
                                            </>
                                    )}
                                </div>
                                </motion.div>
                            </div>
                        </motion.div>
                )}
                </AnimatePresence>
            </nav>
        </header>
    );
}; 