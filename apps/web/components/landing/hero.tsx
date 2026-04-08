import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative bg-surface overflow-hidden">
      {/* Grid layout: stacks on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen lg:gap-12">
        {/* Left Content */}
        <div className="flex flex-col justify-center px-6 sm:px-8 py-16 sm:py-20 lg:px-12 lg:py-32">
          <div className="relative z-10 max-w-xl">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-tertiary mb-3 sm:mb-4">
              Your Parish Companion
            </p>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-3 sm:mb-4 leading-tight text-balance">
              Your Parish Companion,
              <br />
              <em className="block text-foreground/60 not-italic mt-1 sm:mt-2">Everywhere You Go</em>
            </h1>

            <p className="text-base sm:text-lg text-foreground/70 leading-relaxed mb-6 sm:mb-8">
              Access the richness of your Catholic faith even without an internet connection. St. Kizito Parish brings liturgy, community updates, and spiritual resources to your pocket.
            </p>

            <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12">
              <a 
                href="#"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-on-primary font-semibold rounded-full hover:bg-primary/90 active:scale-95 transition-all shadow-sm hover:shadow-md"
              >
                App Store
              </a>
              <a 
                href="#"
                className="inline-flex items-center justify-center px-6 py-3 bg-secondary text-on-secondary font-semibold rounded-full hover:bg-secondary/90 active:scale-95 transition-all shadow-sm hover:shadow-md"
              >
                Play Store
              </a>
            </div>

            <div className="flex flex-col xs:flex-row xs:items-center gap-2 text-xs sm:text-sm text-foreground/60">
              <span>or</span>
              <Link
                href="/admin/login"
                className="font-semibold text-tertiary hover:text-tertiary/80 underline underline-offset-2"
              >
                Enter the Sanctuary
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Phone Mockup */}
        <div className="hidden lg:flex flex-col justify-center items-center px-12 py-32">
          <div className="relative w-64 h-80 xl:w-80 xl:h-96">
            {/* Phone frame */}
            <div className="absolute inset-0 bg-black rounded-3xl shadow-2xl flex items-center justify-center border-8 border-gray-900">
              <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-tertiary/10 rounded-2xl flex items-center justify-center p-6">
                <div className="text-center text-white/60">
                  <div className="text-5xl mb-3">✓</div>
                  <p className="text-sm font-medium">Mobile App</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
