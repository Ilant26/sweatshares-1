"use client";

import { HeroSection } from "@/components/blocks/hero";
import FeaturesSection from "@/components/blocks/oneplatformthreeprofiles";
import FeaturesSection2 from "@/components/blocks/techmatch";
import BuildBySection from "@/components/blocks/buildby";
import EcosystemSection from "@/components/blocks/ecosystem";
import FooterSection from "@/components/blocks/footer"

export default function Home() {
  const handleSearchFilterChange = (filters: { role: string; profileType: string; skill: string }) => {
    // This function is now just a placeholder since we removed TalentFinder
    // The HeroSection handles its own filtering internally
  };

  return (
    <>
      <HeroSection onSearchFilterChange={handleSearchFilterChange} />
      <FeaturesSection />
      <FeaturesSection2 />
      <BuildBySection />
      <EcosystemSection />
      <FooterSection />
    </>
  );
}
