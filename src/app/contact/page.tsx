import { AppHeader } from "@/components/nav/AppHeader";
import { ContactSection } from "@/components/landing/ContactSection";
import { PricingPlans } from "@/components/landing/PricingPlans";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white">
      <AppHeader />
      <main className="pb-16">
        <ContactSection />
        <PricingPlans />
      </main>
    </div>
  );
}

