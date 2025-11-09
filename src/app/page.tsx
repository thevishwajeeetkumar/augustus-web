import { AppHeader } from "@/components/nav/AppHeader";
import { Hero } from "@/components/landing/Hero";
import { LogosRow } from "@/components/landing/LogosRow";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white">
      <AppHeader />
      <Hero />
      <LogosRow />
      <FeaturesGrid />
    </div>
  );
}
