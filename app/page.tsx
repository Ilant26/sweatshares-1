"use client";

import { useState } from "react";
import { HeroSection } from "@/components/blocks/hero-section-1";
import { TalentFinder } from "@/components/blocks/talent-finder";

export default function Home() {
  const [userFilter, setUserFilter] = useState("Founder");
  const [lookingForFilter, setLookingForFilter] = useState("Freelancer");

  const handleSearchFilterChange = (filters: { userRole: string; lookingForRole: string }) => {
    setUserFilter(filters.userRole);
    setLookingForFilter(filters.lookingForRole);
  };

  const handleLookingForChange = (role: "Founder" | "Freelancer" | "Investor" | "All") => {
    setLookingForFilter(role);
  };

  return (
    <>
      <HeroSection onSearchFilterChange={handleSearchFilterChange} />
      <TalentFinder userRoleFilter={userFilter} lookingForRoleFilter={lookingForFilter} onLookingForChange={handleLookingForChange} />
    </>
  );
}
