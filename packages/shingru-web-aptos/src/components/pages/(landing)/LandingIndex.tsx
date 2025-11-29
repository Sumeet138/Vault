"use client";

import HeroSection from "./sections/HeroSection";
import SolutionSection from "./sections/SolutionSection";
import LenisInit from "@/components/utils/LenisInit";
import FeaturesSection from "./sections/FeaturesSection";
import MarketSection from "./sections/MarketSection";
import FaqSection from "./sections/FaqSection";
import CtaSection from "./sections/CtaSection";
import LandingLayout from "@/components/layouts/LandingLayout";

export default function LandingIndex() {
  return (
    <LandingLayout>
      <LenisInit />
      <div className="w-full flex flex-col items-center">
        <HeroSection />

        <SolutionSection />

        <FeaturesSection />

        <MarketSection />

        <CtaSection />

        <FaqSection />
      </div>
    </LandingLayout>
  );
}
