import { AppHeader } from "@/components/nav/AppHeader";
import { Hero } from "@/components/landing/Hero";
import { LogosRow } from "@/components/landing/LogosRow";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { PricingPlans } from "@/components/landing/PricingPlans";
import { Testimonials } from "@/components/landing/Testimonials";
import { ContactSection } from "@/components/landing/ContactSection";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(120deg,#040916_0%,#07112b_55%,#0d1a3c_100%)] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute -top-36 left-1/2 h-[680px] w-[680px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(95,139,255,0.24),transparent_72%)] blur-[140px]" />
        <div className="absolute bottom-[-28%] right-[-10%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(122,93,255,0.24),transparent_72%)] blur-[130px]" />
      </div>
      <div className="relative z-10">
        <AppHeader />
        <Hero />
        <LogosRow />
        <FeaturesGrid />
        <Testimonials />
        <PricingPlans />
        <ContactSection />
      </div>
    </div>
  );
}
