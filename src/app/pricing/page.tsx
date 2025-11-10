import { AppHeader } from "@/components/nav/AppHeader";
import { PricingPlans } from "@/components/landing/PricingPlans";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white">
      <AppHeader />
      <main className="pb-16">
        <PricingPlans />
        <FeaturesGrid />
      </main>
    </div>
  );
}

