import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function ContentSection() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-12">

            <div className="grid gap-4 md:grid-cols-2 md:gap-8">
                    <h2 className="text-4xl font-medium -mt-4">The SweatShares ecosystem doesn't just connect people </h2>
                    <div className="space-y-4">
                        <p>It brings projects to life, attract like-minded people to unify their skillset to ensure a better tomorrow </p>

                        <Link href="/auth/sign-up">
                            <Button
                                size="lg"
                                className="gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                                <span>Get Started</span>
                                <ChevronRight className="size-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
                <img
                    className="rounded-(--radius) grayscale"
                    src="https://images.unsplash.com/photo-1530099486328-e021101a494a?q=80&w=2747&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="team image"
                    height=""
                    width=""
                    loading="lazy"
                />


            </div>
        </section>
    );
}
