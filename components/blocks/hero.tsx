import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { Transition } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ThemeSwitcher } from "@/components/theme-switcher"
import Image from "next/image"
import { Menu } from '@/components/blocks/menu'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: "spring",
                bounce: 0.3,
                duration: 1.5,
            } as Transition,
        },
    },
}

export function HeroSection({
    onSearchFilterChange,
}: { 
    onSearchFilterChange: (filters: { userRole: "Founder" | "Freelancer" | "Investor" | "All"; lookingForRole: "Founder" | "Freelancer" | "Investor" | "All" }) => void;
}) {
    const [userRole, setUserRole] = React.useState<"Founder" | "Freelancer" | "Investor">("Founder")
    const [lookingForRole, setLookingForRole] = React.useState<"Founder" | "Freelancer" | "Investor" | "All">("Freelancer")

    React.useEffect(() => {
        onSearchFilterChange({ userRole, lookingForRole })
    }, [userRole, lookingForRole, onSearchFilterChange])

    const roles = ["Founder", "Freelancer", "Investor", "All"]
    const userRolesOptions = ["Founder", "Freelancer", "Investor"]

    return (
        <>
            <Menu />
            <main className="overflow-hidden">
                <div
                    aria-hidden
                    className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block">
                    <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
                    <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
                    <div className="h-[80rem] -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
                </div>
                <section>
                    <div className="relative pt-24 md:pt-36">
                        <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]" />
                        <div className="mx-auto max-w-7xl px-6">
                            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                                <AnimatedGroup variants={transitionVariants}>
                                    <Link
                                        href="#link"
                                        className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center justify-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
                                        legacyBehavior>
                                        <div className="flex items-center justify-center gap-4">
                                            <span className="text-foreground text-sm">SweatShares is now live! 🎉</span>
                                            <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

                                            <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                                                <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                                                    <span className="flex size-6">
                                                        <ArrowRight className="m-auto size-3" />
                                                    </span>
                                                    <span className="flex size-6">
                                                        <ArrowRight className="m-auto size-3" />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                        
                                    <h1
                                        className="mt-8 max-w-4xl mx-auto text-balance text-4xl md:text-5xl lg:mt-16 xl:text-6xl">
                                        We connect founders, experts and investors to collaborate on innovative projects.
                                    </h1>
                                    <p
                                        className="mx-auto mt-8 max-w-2xl text-balance text-lg">
                                        Whether you're a founder, expert, or investor, you're in the right place. SweatShares is your go-to platform for finding opportunities. 
                                    </p>
                                </AnimatedGroup>

                                <AnimatedGroup
                                    variants={{
                                        container: {
                                            visible: {
                                                transition: {
                                                    staggerChildren: 0.05,
                                                    delayChildren: 0.75,
                                                },
                                            },
                                        },
                                        ...transitionVariants,
                                    }}
                                    className="mt-12 flex flex-col items-center justify-center gap-4 md:flex-row">
                                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl bg-background p-4 rounded-xl shadow-lg border border-border">
                                        <div className="flex-1">
                                            <label htmlFor="userRole" className="sr-only">I am a...</label>
                                            <Select value={userRole} onValueChange={(value: "Founder" | "Freelancer" | "Investor" | "All") => setUserRole(value as "Founder" | "Freelancer" | "Investor")}>
                                                <SelectTrigger id="userRole" className="w-full">
                                                    <SelectValue placeholder="I am a..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {userRolesOptions.map((role) => (
                                                        <SelectItem key={role} value={role}>{`I am a ${role}`}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex-1">
                                            <label htmlFor="lookingFor" className="sr-only">Looking for...</label>
                                            <Select value={lookingForRole} onValueChange={(value: "Founder" | "Freelancer" | "Investor" | "All") => setLookingForRole(value)}>
                                                <SelectTrigger id="lookingFor" className="w-full">
                                                    <SelectValue placeholder="Looking for..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role} value={role}>{`Looking for ${role}`}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </AnimatedGroup>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}