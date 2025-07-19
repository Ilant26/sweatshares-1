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
    { name: 'Accueil', href: '/', icon: Home },
    { name: 'Listing', href: '/listing', icon: List },
    { name: 'Pricing', href: '#link', icon: DollarSign },
    { name: 'Contact', href: '#link', icon: Mail },
];

export const Menu = () => {
    const [menuState, setMenuState] = React.useState(false);
    const { user } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

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

    return (
        <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
            <nav
                data-state={menuState && 'active'}
                className="relative w-full px-2 group">
                <div className="mx-auto max-w-6xl px-6 lg:px-12">
                    <div className="relative flex items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        {/* Logo - Left Side */}
                        <Link
                            href="/"
                            aria-label="home"
                            className="flex items-center space-x-2">
                            {/* Light mode logo */}
                            <Image
                              src="/logo/logo-svg-dark-text.svg"
                              alt="SweatShares Logo"
                              width={160}
                              height={50}
                              priority
                              className="block dark:hidden"
                            />
                            {/* Dark mode logo */}
                            <Image
                              src="/logo/logo-svg-white-text.svg"
                              alt="SweatShares Logo (White)"
                              width={160}
                              height={50}
                              priority
                              className="hidden dark:block"
                            />
                        </Link>

                        {/* Navigation Menu - Center (Desktop) */}
                        <div className="hidden lg:flex items-center">
                            <ul className="flex gap-10 text-base">
                                {menuItems.map((item, index) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "block relative",
                                                    isActive 
                                                        ? "text-primary font-medium" 
                                                        : "text-muted-foreground hover:text-accent-foreground"
                                                )}>
                                                <div className="relative">
                                                    {item.name}
                                                    {isActive && (
                                                        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
                                                    )}
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {/* Right Side - Auth Buttons & Theme Toggle */}
                        <div className="flex items-center gap-4">
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
                                className="relative z-20 -m-2.5 block cursor-pointer p-2.5 lg:hidden">
                                <MenuIcon className={cn(
                                    "m-auto size-6",
                                    menuState ? "hidden" : "block"
                                )} />
                                <X className={cn(
                                    "m-auto size-6",
                                    menuState ? "block" : "hidden"
                                )} />
                            </button>
                        </div>

                        {menuState && (
                            <div className="fixed inset-x-0 top-[72px] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 lg:hidden">
                                <div className="mx-auto max-w-4xl px-6 py-6">
                                    <div className="space-y-6">
                                        <ul className="space-y-4">
                                            {menuItems.map((item, index) => {
                                                const isActive = pathname === item.href;
                                                return (
                                                    <li key={index}>
                                                        <Link
                                                            href={item.href}
                                                            onClick={() => setMenuState(false)}
                                                            className={cn(
                                                                "flex items-center gap-3 text-base",
                                                                isActive 
                                                                    ? "text-primary font-medium" 
                                                                    : "text-muted-foreground hover:text-accent-foreground"
                                                            )}>
                                                            <div className="flex items-center gap-3">
                                                                <item.icon className={cn(
                                                                    "size-5",
                                                                    isActive ? "text-primary" : ""
                                                                )} />
                                                                {item.name}
                                                            </div>
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>

                                        <div className="flex flex-col gap-4 pt-4 border-t">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Theme</span>
                                                <ThemeSwitcher />
                                            </div>
                                            {user ? (
                                                <div className="flex flex-col gap-2">
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        className="w-full">
                                                        <Link href="/dashboard" className="flex items-center gap-2">
                                                            Dashboard
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full"
                                                        onClick={handleSignOut}>
                                                        <LogOut className="h-4 w-4 mr-2" />
                                                        Sign Out
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2">
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        className="w-full">
                                                        <Link href="/auth/login">
                                                            Login
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        asChild
                                                        className="w-full">
                                                        <Link href="/auth/sign-up">
                                                            Sign Up
                                                        </Link>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                    </div>
                </div>
            </nav>
        </header>
    );
}; 