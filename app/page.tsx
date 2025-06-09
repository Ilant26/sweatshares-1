"use client";

import { useState } from "react";
import { HeroSection } from "@/components/blocks/hero-section-1";
import { TalentFinder } from "@/components/blocks/talent-finder";

type RoleFilter = "Founder" | "Freelancer" | "Investor" | "All";

export default function Home() {
  const [userFilter, setUserFilter] = useState<RoleFilter>("All");
  const [lookingForFilter, setLookingForFilter] = useState<RoleFilter>("Freelancer");

  const handleSearchFilterChange = (filters: { userRole: RoleFilter; lookingForRole: RoleFilter }) => {
    setUserFilter(filters.userRole);
    setLookingForFilter(filters.lookingForRole);
  };

  return (
    <>
      <HeroSection onSearchFilterChange={handleSearchFilterChange} />
      <TalentFinder userRoleFilter={userFilter} lookingForRoleFilter={lookingForFilter} />
    </>
  );
}
