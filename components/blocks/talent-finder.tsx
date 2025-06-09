import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, HTMLMotionProps } from "framer-motion";
import { ArrowRight, UserPlus, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  role: "Founder" | "Freelancer" | "Investor";
  avatarUrl: string;
  bio: string;
  skills: string[];
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "Alice Johnson",
    role: "Founder",
    avatarUrl: "https://randomuser.me/api/portraits/women/1.jpg",
    bio: "Building the next big thing in fintech.",
    skills: ["Fintech", "Leadership", "Fundraising"],
  },
  {
    id: "2",
    name: "Bob Smith",
    role: "Freelancer",
    avatarUrl: "https://randomuser.me/api/portraits/men/2.jpg",
    bio: "Full-stack developer and designer.",
    skills: ["React", "Node.js", "UI/UX"],
  },
  {
    id: "3",
    name: "Carla Gomez",
    role: "Investor",
    avatarUrl: "https://randomuser.me/api/portraits/women/3.jpg",
    bio: "Angel investor in SaaS startups.",
    skills: ["SaaS", "Angel Investing", "Mentoring"],
  },
  {
    id: "4",
    name: "David Lee",
    role: "Founder",
    avatarUrl: "https://randomuser.me/api/portraits/men/4.jpg",
    bio: "Serial entrepreneur in health tech.",
    skills: ["Health Tech", "Startups", "Growth"],
  },
  {
    id: "5",
    name: "Eva Müller",
    role: "Freelancer",
    avatarUrl: "https://randomuser.me/api/portraits/women/5.jpg",
    bio: "UX/UI specialist for web apps.",
    skills: ["UX", "UI", "Figma"],
  },
  {
    id: "6",
    name: "Frank Zhang",
    role: "Investor",
    avatarUrl: "https://randomuser.me/api/portraits/men/6.jpg",
    bio: "VC partner focused on AI.",
    skills: ["AI", "Venture Capital", "Strategy"],
  },
  {
    id: "7",
    name: "Grace Kim",
    role: "Founder",
    avatarUrl: "https://randomuser.me/api/portraits/women/7.jpg",
    bio: "Edtech founder passionate about learning innovation.",
    skills: ["Edtech", "Innovation", "Team Building"],
  },
  {
    id: "8",
    name: "Hassan Ali",
    role: "Freelancer",
    avatarUrl: "https://randomuser.me/api/portraits/men/8.jpg",
    bio: "Mobile app developer and React Native expert.",
    skills: ["React Native", "iOS", "Android"],
  },
  {
    id: "9",
    name: "Isabelle Laurent",
    role: "Investor",
    avatarUrl: "https://randomuser.me/api/portraits/women/9.jpg",
    bio: "Seed investor in climate tech and sustainability.",
    skills: ["Climate Tech", "Sustainability", "Seed Funding"],
  },
  {
    id: "10",
    name: "Jack O'Neill",
    role: "Founder",
    avatarUrl: "https://randomuser.me/api/portraits/men/10.jpg",
    bio: "Founder of a SaaS platform for remote teams.",
    skills: ["SaaS", "Remote Work", "Product"],
  },
  {
    id: "11",
    name: "Kira Patel",
    role: "Freelancer",
    avatarUrl: "https://randomuser.me/api/portraits/women/11.jpg",
    bio: "Freelance product manager and agile coach.",
    skills: ["Product Management", "Agile", "Scrum"],
  },
  {
    id: "12",
    name: "Liam Murphy",
    role: "Investor",
    avatarUrl: "https://randomuser.me/api/portraits/men/12.jpg",
    bio: "Angel investor in B2B SaaS and marketplaces.",
    skills: ["B2B SaaS", "Marketplaces", "Angel Investing"],
  },
  {
    id: "13",
    name: "Maya Singh",
    role: "Founder",
    avatarUrl: "https://randomuser.me/api/portraits/women/13.jpg",
    bio: "Healthtech founder focused on digital wellness.",
    skills: ["Healthtech", "Digital Wellness", "Leadership"],
  },
  {
    id: "14",
    name: "Noah Becker",
    role: "Freelancer",
    avatarUrl: "https://randomuser.me/api/portraits/men/14.jpg",
    bio: "UI/UX designer for SaaS and mobile apps.",
    skills: ["UI/UX", "Web Design", "Mobile Design"],
  },
  {
    id: "15",
    name: "Olivia Rossi",
    role: "Investor",
    avatarUrl: "https://randomuser.me/api/portraits/women/15.jpg",
    bio: "VC focused on early-stage European startups.",
    skills: ["Venture Capital", "Europe", "Startups"],
  },
];

const roles = ["Founder", "Freelancer", "Investor"] as const;
type Role = typeof roles[number];

interface InteractiveButtonProps extends HTMLMotionProps<"button"> {
  text: string;
  icon: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary";
}

const InteractiveButton = React.forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  ({ text, icon, variant = "primary", className, ...props }, ref) => {
    const baseStyles = "group relative overflow-hidden rounded-full font-medium transition-all duration-300 flex items-center justify-center";
    const variantStyles = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
      tertiary: "bg-background text-foreground border border-input hover:bg-accent hover:text-accent-foreground"
    };
    return (
      <motion.button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          "px-3 py-1.5 text-sm",
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        <span className="flex items-center gap-1.5">
          <span className="relative z-10">{text}</span>
          <motion.span
            className="relative z-10"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.span>
        </span>
      </motion.button>
    );
  }
);
InteractiveButton.displayName = "InteractiveButton";

export function TalentFinder({
  userRoleFilter,
  lookingForRoleFilter,
  onLookingForChange,
}: { 
  userRoleFilter: "Founder" | "Freelancer" | "Investor" | "All";
  lookingForRoleFilter: "Founder" | "Freelancer" | "Investor" | "All";
  onLookingForChange: (role: Role | "All") => void;
}) {
  const filteredUsers = mockUsers.filter((user) => {
    // If user is a 'Founder' looking for a 'Freelancer', show Freelancers.
    // If user is a 'Freelancer' looking for a 'Founder', show Founders.
    // If user is an 'Investor' looking for a 'Founder' or 'Freelancer', show them accordingly.
    // If 'All' is selected for lookingForRoleFilter, show all users.
    
    if (lookingForRoleFilter === "All") {
      return true; // Show all users if looking for 'All'
    } else {
      // Only show users whose role matches the lookingForRoleFilter
      return user.role === lookingForRoleFilter;
    }
  });
  
  return (
    <section className="w-full max-w-5xl mx-auto py-12 px-4">
      <motion.div 
        className="flex justify-center gap-2 mb-8 flex-wrap"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          variant={lookingForRoleFilter === "All" ? "default" : "outline"}
          onClick={() => onLookingForChange("All")}
          className="rounded-full"
        >
          All
        </Button>
        {roles.map((role) => (
          <Button
            key={role}
            variant={lookingForRoleFilter === role ? "default" : "outline"}
            onClick={() => onLookingForChange(role)}
            className="rounded-full"
          >
            {role}
          </Button>
        ))}
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground">
            No users found for this role.
          </div>
        ) : (
          filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              className="flex flex-col items-center p-6 bg-card rounded-xl shadow-md border border-border dark:bg-card dark:border-border hover:shadow-lg transition-shadow"
              role="listitem"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <motion.div 
                className="flex flex-col items-center w-full mb-4"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <motion.img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-20 h-20 rounded-full mb-3 object-cover border-2 border-border"
                  whileHover={{ scale: 1.1, borderColor: "var(--primary)" }}
                  transition={{ duration: 0.2 }}
                />
                <div className="text-lg font-semibold">{user.name}</div>
                <span className="text-xs text-muted-foreground font-medium mt-1 bg-muted px-2 py-0.5 rounded-full">
                  {user.role}
                </span>
              </motion.div>
              <div className="text-center text-sm text-muted-foreground w-full mb-4">
                {user.bio}
              </div>
              {/* Skills */}
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {user.skills.map((skill, idx) => (
                  <motion.span
                    key={skill}
                    className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + idx * 0.1 }}
                    whileHover={{ scale: 1.1, backgroundColor: "var(--primary)", color: "white" }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-auto w-full justify-center">
                <InteractiveButton 
                  text="Connect" 
                  icon={<UserPlus size={14} />} 
                  variant="primary"
                />
                <InteractiveButton 
                  text="Profile" 
                  icon={<User size={14} />} 
                  variant="secondary"
                />
                <InteractiveButton 
                  text="Message" 
                  icon={<MessageCircle size={14} />} 
                  variant="tertiary"
                />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
} 