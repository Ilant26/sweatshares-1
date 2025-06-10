"use client";

import { useState } from "react";
import { HeroSection } from "@/components/blocks/hero";
import { TalentFinder } from "@/components/blocks/talent-finder";
import FeaturesSection from "@/components/blocks/oneplatformthreeprofiles";
import FeaturesSection2 from "@/components/blocks/techmatch";
import BuildBySection from "@/components/blocks/buildby";
import EcosystemSection from "@/components/blocks/ecosystem";
import FooterSection from "@/components/blocks/footer"

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
      <FeaturesSection />
      <FeaturesSection2 />
      <BuildBySection />
      <EcosystemSection />
      <FooterSection />
    </>
  );
}
