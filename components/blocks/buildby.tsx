import Link from 'next/link'
import { motion } from 'framer-motion'

// Generate placeholder profiles for the carousel
const generatePlaceholderProfiles = () => {
    const names = [
        "Sarah Chen", "Maria Rodriguez", "Niels Patel", "Marion Duville", "Kering Thompson",
        "Alexa Johnson", "Mario Garcia", "Jamia Wilson", "Eirc Anderson", "Robert Taylor",
        "Jules Leonard", "Olivia Brown", "James Davis", "Christiane Miller", "Bastian White",
        "Daniela Martinez", "Corio Johnson", "Collin Garcia", "Nicole Rodriguez", "Kevin Lee",
        "Stephanie Clark", "Andrew Hall", "Rachel Lewis", "Joshua Young", "Megan Allen",
        "Ryan King", "Lauren Scott", "Brandon Green", "Hannah Baker", "Tyler Adams"
    ];
    
    const roles = [
        "Full Stack Developer", "UI/UX Designer", "Product Manager", "Data Scientist",
        "DevOps Engineer", "Frontend Developer", "Backend Developer", "Mobile Developer",
        "QA Engineer", "System Architect", "Cloud Engineer", "Security Specialist",
        "Business Analyst", "Project Manager", "Technical Lead", "Software Engineer",
        "Designer", "Analyst", "Consultant", "Architect"
    ];

    return names.map((name, index) => ({
        id: index + 1,
        name,
        role: roles[index % roles.length],
        avatar: `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${(index % 70) + 1}.jpg`,
        github: `https://github.com/${name.toLowerCase().replace(' ', '')}`
    }));
};

const profiles = generatePlaceholderProfiles();

export default function CommunitySection() {
    return (
        <section className="py-8 md:py-16 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20">
            {/* Header Section with Container */}
            <div className="mx-auto max-w-7xl px-6 mb-16">
                <div className="text-center">
                    <h2 className="text-balance text-4xl font-semibold lg:text-5xl mb-6">
                        Built by the Community <br /> for the Community
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Join thousands of developers, designers, and innovators who are building the future together.
                    </p>
                </div>
            </div>

            {/* Full Width Carousel Section */}
            <div className="w-full">
                {/* Infinite Profile Carousel - Row 1 */}
                <div className="relative overflow-hidden mb-2 py-5">
                    <div className="flex animate-scroll-left">
                        {[...profiles, ...profiles].map((profile, index) => (
                            <motion.div
                                key={`${profile.id}-${index}`}
                                className="flex-shrink-0 mx-4 group"
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex flex-col items-center p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300 backdrop-blur-sm min-w-[200px]">
                                    <div className="relative mb-3">
                                        <img 
                                            src={profile.avatar} 
                                            alt={profile.name}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-zinc-800 shadow-lg group-hover:scale-110 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-zinc-800"></div>
                                    </div>
                                    <h3 className="font-semibold text-sm text-center mb-1 group-hover:text-primary transition-colors">
                                        {profile.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground text-center">
                                        {profile.role}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Infinite Profile Carousel - Row 2 */}
                <div className="relative overflow-hidden py-5">
                    <div className="flex animate-scroll-right">
                        {[...profiles.slice(10), ...profiles.slice(0, 10), ...profiles.slice(10), ...profiles.slice(0, 10)].map((profile, index) => (
                            <motion.div
                                key={`row2-${profile.id}-${index}`}
                                className="flex-shrink-0 mx-4 group"
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex flex-col items-center p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300 backdrop-blur-sm min-w-[200px]">
                                    <div className="relative mb-3">
                                        <img 
                                            src={profile.avatar} 
                                            alt={profile.name}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-zinc-800 shadow-lg group-hover:scale-110 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-zinc-800"></div>
                                    </div>
                                    <h3 className="font-semibold text-sm text-center mb-1 group-hover:text-primary transition-colors">
                                        {profile.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground text-center">
                                        {profile.role}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes scroll-left {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                
                @keyframes scroll-right {
                    0% { transform: translateX(-50%); }
                    100% { transform: translateX(0); }
                }
                
                .animate-scroll-left {
                    animation: scroll-left 60s linear infinite;
                }
                
                .animate-scroll-right {
                    animation: scroll-right 60s linear infinite;
                }
                
                .animate-scroll-left:hover,
                .animate-scroll-right:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    )
}
