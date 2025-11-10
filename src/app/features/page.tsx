import { AppHeader } from "@/components/nav/AppHeader";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { LogosRow } from "@/components/landing/LogosRow";
import { Hero } from "@/components/landing/Hero";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white">
      <AppHeader />
      <Hero />
      <LogosRow />
      <FeaturesGrid />
    </div>
  );
}

