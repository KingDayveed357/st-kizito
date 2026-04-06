import { HeroSection } from "@/components/landing/hero"
import { FeaturesSection } from "@/components/landing/features"
import { HowItWorksSection } from "@/components/landing/how-it-works"
import { MissionSection } from "@/components/landing/mission"
import { CTASection } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <MissionSection />
      <CTASection />
      <Footer />
    </div>
  )
}
