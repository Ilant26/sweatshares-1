import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function ContentSection() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="grid gap-6 md:grid-cols-2 md:gap-12">
                    <h2 className="text-4xl font-medium">Join a thriving community of founders, experts, and investors</h2>
                    <div className="space-y-6">
                        <p>SweatShares is more than just listings—it's a collaborative ecosystem where entrepreneurs, professionals, and backers connect to build, invest, and grow together.</p>
                        <p>
                            Discover new opportunities, find the right partners, and accelerate your journey. Whether you're looking to launch a project, offer your expertise, or invest in the next big thing, SweatShares is your gateway to meaningful connections and success.
                        </p>
                        <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="gap-1 pr-1.5">
                            <Link href="/auth/sign-up" legacyBehavior>
                                <div className="flex items-center gap-1">
                                    <span>Start Now</span>
                                    <ChevronRight className="size-2" />
                                </div>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
