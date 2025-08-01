import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SidePanel } from '@/components/ui/side-panel'
import { ProfileDetailView } from '@/components/profile-detail-view'

// Interface for real profile data
interface Profile {
    id: string
    full_name: string | null
    avatar_url: string | null
    bio: string | null
    professional_role: string | null
    company: string | null
    created_at: string | null
    skills: string[] | string | null
    profile_type: string | null
    country: string | null
}

export default function CommunitySection() {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    
    // Side panel state
    const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false)
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)

    // Fetch real profiles from the platform
    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, bio, professional_role, company, created_at, skills, profile_type, country')
                    .not('full_name', 'is', null)
                    .not('professional_role', 'is', null)
                    .limit(30)
                    .order('created_at', { ascending: false })

                if (error) {
                    console.error('Error fetching profiles:', error)
                    return
                }

                if (data) {
                    setProfiles(data)
                }
            } catch (error) {
                console.error('Error fetching profiles:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchProfiles()
    }, [])

    const handleProfileClick = (profile: Profile) => {
        setSelectedProfile(profile)
        setIsProfilePanelOpen(true)
    }

    // Fallback to placeholder profiles if no real data or loading
    const displayProfiles = profiles.length > 0 ? profiles : [
        { id: '1', full_name: 'Sarah Chen', avatar_url: 'https://randomuser.me/api/portraits/women/1.jpg', bio: 'Passionate developer with 5+ years of experience', professional_role: 'Full Stack Developer', company: 'TechCorp', created_at: '2024-01-01', skills: ['React', 'Node.js', 'TypeScript'], profile_type: 'Expert', country: 'United States' },
        { id: '2', full_name: 'Maria Rodriguez', avatar_url: 'https://randomuser.me/api/portraits/women/2.jpg', bio: 'Creative designer focused on user experience', professional_role: 'UI/UX Designer', company: 'DesignStudio', created_at: '2024-01-02', skills: ['Figma', 'Adobe XD', 'Prototyping'], profile_type: 'Expert', country: 'Spain' },
        { id: '3', full_name: 'Niels Patel', avatar_url: 'https://randomuser.me/api/portraits/men/3.jpg', bio: 'Strategic product leader with startup experience', professional_role: 'Product Manager', company: 'StartupXYZ', created_at: '2024-01-03', skills: ['Product Strategy', 'Agile', 'User Research'], profile_type: 'Founder', country: 'Netherlands' },
        { id: '4', full_name: 'Marion Duville', avatar_url: 'https://randomuser.me/api/portraits/women/4.jpg', bio: 'Data-driven professional with ML expertise', professional_role: 'Data Scientist', company: 'DataLab', created_at: '2024-01-04', skills: ['Python', 'Machine Learning', 'SQL'], profile_type: 'Expert', country: 'France' },
        { id: '5', full_name: 'Kering Thompson', avatar_url: 'https://randomuser.me/api/portraits/men/5.jpg', bio: 'Infrastructure specialist and automation expert', professional_role: 'DevOps Engineer', company: 'CloudTech', created_at: '2024-01-05', skills: ['Docker', 'Kubernetes', 'AWS'], profile_type: 'Expert', country: 'Canada' },
        { id: '6', full_name: 'Alexa Johnson', avatar_url: 'https://randomuser.me/api/portraits/women/6.jpg', bio: 'Frontend specialist with modern web technologies', professional_role: 'Frontend Developer', company: 'WebSolutions', created_at: '2024-01-06', skills: ['Vue.js', 'CSS', 'JavaScript'], profile_type: 'Expert', country: 'United Kingdom' },
        { id: '7', full_name: 'Mario Garcia', avatar_url: 'https://randomuser.me/api/portraits/men/7.jpg', bio: 'Backend architect with scalable solutions', professional_role: 'Backend Developer', company: 'BackendPro', created_at: '2024-01-07', skills: ['Java', 'Spring Boot', 'PostgreSQL'], profile_type: 'Expert', country: 'Mexico' },
        { id: '8', full_name: 'Jamia Wilson', avatar_url: 'https://randomuser.me/api/portraits/women/8.jpg', bio: 'Mobile app developer for iOS and Android', professional_role: 'Mobile Developer', company: 'MobileFirst', created_at: '2024-01-08', skills: ['React Native', 'Swift', 'Kotlin'], profile_type: 'Expert', country: 'Australia' },
        { id: '9', full_name: 'Eric Anderson', avatar_url: 'https://randomuser.me/api/portraits/men/9.jpg', bio: 'Quality assurance expert with automation skills', professional_role: 'QA Engineer', company: 'QualityAssurance', created_at: '2024-01-09', skills: ['Selenium', 'Jest', 'Cypress'], profile_type: 'Expert', country: 'Sweden' },
        { id: '10', full_name: 'Rafaela Taylor', avatar_url: 'https://randomuser.me/api/portraits/women/10.jpg', bio: 'Enterprise architecture and system design expert', professional_role: 'System Architect', company: 'EnterpriseArch', created_at: '2024-01-10', skills: ['Microservices', 'Cloud Architecture', 'Design Patterns'], profile_type: 'Expert', country: 'Brazil' },
        { id: '11', full_name: 'Jules Leonard', avatar_url: 'https://randomuser.me/api/portraits/men/11.jpg', bio: 'Cloud infrastructure and deployment specialist', professional_role: 'Cloud Engineer', company: 'CloudOps', created_at: '2024-01-11', skills: ['Azure', 'Terraform', 'CI/CD'], profile_type: 'Expert', country: 'Germany' },
        { id: '12', full_name: 'Olivia Brown', avatar_url: 'https://randomuser.me/api/portraits/women/12.jpg', bio: 'Cybersecurity expert with penetration testing skills', professional_role: 'Security Specialist', company: 'SecureNet', created_at: '2024-01-12', skills: ['Penetration Testing', 'Security Auditing', 'Incident Response'], profile_type: 'Expert', country: 'Ireland' },
        { id: '13', full_name: 'James Davis', avatar_url: 'https://randomuser.me/api/portraits/men/13.jpg', bio: 'Business process optimization and requirements expert', professional_role: 'Business Analyst', company: 'BusinessIntel', created_at: '2024-01-13', skills: ['Requirements Gathering', 'Process Modeling', 'Data Analysis'], profile_type: 'Expert', country: 'New Zealand' },
        { id: '14', full_name: 'Christiane Miller', avatar_url: 'https://randomuser.me/api/portraits/women/14.jpg', bio: 'Agile project management and team leadership', professional_role: 'Project Manager', company: 'ProjectPro', created_at: '2024-01-14', skills: ['Scrum', 'Jira', 'Team Leadership'], profile_type: 'Expert', country: 'Switzerland' },
        { id: '15', full_name: 'Bastian White', avatar_url: 'https://randomuser.me/api/portraits/men/15.jpg', bio: 'Technical leadership and architecture guidance', professional_role: 'Technical Lead', company: 'TechLead', created_at: '2024-01-15', skills: ['Technical Leadership', 'Code Review', 'Architecture'], profile_type: 'Expert', country: 'Denmark' }
    ]

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
                        {[...displayProfiles, ...displayProfiles].map((profile, index) => (
                            <motion.div
                                key={`${profile.id}-${index}`}
                                className="flex-shrink-0 mx-4 group cursor-pointer"
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => handleProfileClick(profile)}
                            >
                                <div className="flex flex-col items-center p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300 backdrop-blur-sm min-w-[200px]">
                                    <div className="relative mb-3">
                                        <img 
                                            src={profile.avatar_url || `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${(index % 70) + 1}.jpg`} 
                                            alt={profile.full_name || 'User'}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-zinc-800 shadow-lg group-hover:scale-110 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-zinc-800"></div>
                                    </div>
                                    <h3 className="font-semibold text-sm text-center mb-1 group-hover:text-primary transition-colors">
                                        {profile.full_name || 'Anonymous User'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground text-center">
                                        {profile.professional_role || 'Professional'}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Infinite Profile Carousel - Row 2 */}
                <div className="relative overflow-hidden py-5">
                    <div className="flex animate-scroll-right">
                        {[...displayProfiles.slice(10), ...displayProfiles.slice(0, 10), ...displayProfiles.slice(10), ...displayProfiles.slice(0, 10)].map((profile, index) => (
                            <motion.div
                                key={`row2-${profile.id}-${index}`}
                                className="flex-shrink-0 mx-4 group cursor-pointer"
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => handleProfileClick(profile)}
                            >
                                <div className="flex flex-col items-center p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300 backdrop-blur-sm min-w-[200px]">
                                    <div className="relative mb-3">
                                        <img 
                                            src={profile.avatar_url || `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${(index % 70) + 1}.jpg`} 
                                            alt={profile.full_name || 'User'}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-zinc-800 shadow-lg group-hover:scale-110 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-zinc-800"></div>
                                    </div>
                                    <h3 className="font-semibold text-sm text-center mb-1 group-hover:text-primary transition-colors">
                                        {profile.full_name || 'Anonymous User'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground text-center">
                                        {profile.professional_role || 'Professional'}
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
            
            {/* Side Panel for Profile Details */}
            <SidePanel
                isOpen={isProfilePanelOpen}
                onClose={() => {
                    setIsProfilePanelOpen(false);
                    setSelectedProfile(null);
                }}
                title="Profile Details"
            >
                {selectedProfile && (
                    <ProfileDetailView 
                        profile={selectedProfile} 
                        onClose={() => {
                            setIsProfilePanelOpen(false);
                            setSelectedProfile(null);
                        }} 
                    />
                )}
            </SidePanel>
        </section>
    )
}
