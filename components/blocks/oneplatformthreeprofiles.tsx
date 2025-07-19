import { Card, CardContent } from '@/components/ui/card'
import { Settings2, Sparkles, Zap, Briefcase, DollarSign, Star } from 'lucide-react'
import { ReactNode } from 'react'

export default function Features() {
    return (
        <section className="bg-background py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="text-center">
                    <h2 className="text-balance text-4xl font-semibold lg:text-5xl">One platform, three profiles, shared success</h2>
                    <p className="mt-4">Whether you're a founder, freelancer, or investor, SweatShares is your go-to platform for finding the right talent and opportunities.</p>
                </div>
                <div className="relative z-10 grid grid-cols-1 gap-6 mt-16 lg:grid-cols-3">
                    {/* Founders Card */}
                    <Card className="group relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                        
                        <CardContent className="relative p-6 text-center">
                            <div className="relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:bg-white/5 dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)] mb-6">
                                <div
                                    aria-hidden
                                    className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px]"
                                />
                                <div
                                    aria-hidden
                                    className="bg-radial to-background absolute inset-0 from-transparent to-75%"
                                />
                                <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">
                                    <Zap className="size-6 text-primary" strokeWidth={1.5} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">Founders</h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Find the talent and funding you need to bring your vision to life. Reward your team with cash, equity, or a mix of both.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Experts & Freelancers Card */}
                    <Card className="group relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                        
                        <CardContent className="relative p-6 text-center">
                            <div className="relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:bg-white/5 dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)] mb-6">
                                <div
                                    aria-hidden
                                    className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px]"
                                />
                                <div
                                    aria-hidden
                                    className="bg-radial to-background absolute inset-0 from-transparent to-75%"
                                />
                                <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">
                                    <Settings2 className="size-6 text-primary" strokeWidth={1.5} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">Experts & Freelancers</h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Collaborate with ambitious startups and build your equity portfolio in the projects you contribute to - through concrete mission, mentoring, or co-founding.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Investors Card */}
                    <Card className="group relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                        
                        <CardContent className="relative p-6 text-center">
                            <div className="relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:bg-white/5 dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)] mb-6">
                                <div
                                    aria-hidden
                                    className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px]"
                                />
                                <div
                                    aria-hidden
                                    className="bg-radial to-background absolute inset-0 from-transparent to-75%"
                                />
                                <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">
                                    <Sparkles className="size-6 text-primary" strokeWidth={1.5} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">Investors</h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Spot future unicorns, invest directly in the projects you believe in, and connect with a community of like-minded investors.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}
