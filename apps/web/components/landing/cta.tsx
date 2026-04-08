import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-32 px-6 lg:px-12 bg-surface-container-low">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-serif text-4xl lg:text-5xl font-semibold tracking-tight mb-6 leading-tight">
          Start Your Digital Journey
        </h2>
        <p className="text-lg text-foreground/70 mb-12 leading-relaxed">
          Whether you&apos;re a parishioner seeking spiritual resources or an administrator managing your community, St. Kizito Parish App brings everything together.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <a 
            href="#"
            className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors"
          >
            Download App
          </a>
          <Link 
            href="/admin/login"
            className="inline-flex items-center justify-center px-8 py-3 bg-secondary text-white font-semibold rounded-full hover:bg-secondary/90 transition-colors"
          >
            Enter the Sanctuary
          </Link>
        </div>
      </div>
    </section>
  )
}
