import dynamic from "next/dynamic"
import { HeroSection } from "@/components/landing/hero"

const FeaturesSection = dynamic(() =>
  import("@/components/landing/features").then((module) => module.FeaturesSection),
  { loading: () => <LandingSectionSkeleton /> },
)

const HowItWorksSection = dynamic(() =>
  import("@/components/landing/how-it-works").then((module) => module.HowItWorksSection),
  { loading: () => <LandingSectionSkeleton /> },
)

const MissionSection = dynamic(() =>
  import("@/components/landing/mission").then((module) => module.MissionSection),
  { loading: () => <LandingSectionSkeleton /> },
)

const CTASection = dynamic(() =>
  import("@/components/landing/cta").then((module) => module.CTASection),
  { loading: () => <LandingSectionSkeleton compact /> },
)

const Footer = dynamic(() =>
  import("@/components/landing/footer").then((module) => module.Footer),
  { loading: () => <LandingSectionSkeleton compact /> },
)

function LandingSectionSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`px-6 lg:px-12 ${compact ? "py-14" : "py-20"}`}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-8 w-64 mx-auto bg-muted/70 rounded-lg animate-pulse" />
        <div className="h-4 w-full max-w-2xl mx-auto bg-muted/60 rounded animate-pulse" />
        <div className="h-4 w-full max-w-xl mx-auto bg-muted/50 rounded animate-pulse" />
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <div className="defer-render">
        <FeaturesSection />
      </div>
      <div className="defer-render">
        <HowItWorksSection />
      </div>
      <div className="defer-render">
        <MissionSection />
      </div>
      <div className="defer-render">
        <CTASection />
      </div>
      <div className="defer-render">
        <Footer />
      </div>
    </div>
  )
}
