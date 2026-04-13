export function CTASection() {
  return (
    <section className="relative py-24 px-6 lg:px-12 overflow-hidden bg-surface-container-low">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-tertiary/20 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary via-primary/95 to-secondary shadow-2xl p-8 md:p-12 lg:p-16 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <p className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs md:text-sm font-semibold tracking-[0.12em] uppercase mb-6">
              St. Kizito Parish Community
            </p>

            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 leading-tight">
              Keep Faith, Prayer, and Parish Life in Your Hands
            </h2>

            <p className="text-base md:text-lg text-white/85 mb-10 leading-relaxed max-w-3xl mx-auto">
              The St. Kizito Parish App helps every parishioner stay close to God and connected to our church family through daily readings, prayer resources, Mass updates, and parish announcements.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
              <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4">
                <p className="text-xl font-bold">Daily Spiritual Nourishment</p>
                <p className="text-sm text-white/80 mt-1">Receive scripture, reflections, and prayer content each day.</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4">
                <p className="text-xl font-bold">Never Miss Parish Moments</p>
                <p className="text-sm text-white/80 mt-1">Stay informed about Mass times, events, and important notices.</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4">
                <p className="text-xl font-bold">One Parish Family</p>
                <p className="text-sm text-white/80 mt-1">Grow in communion with fellow parishioners wherever you are.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <a
                href="#"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-tertiary text-primary font-semibold rounded-full hover:bg-tertiary/90 transition-all duration-300 hover:-translate-y-0.5"
              >
                Download the Parish App
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center px-8 py-3.5 border border-white/50 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-colors"
              >
                Contact Parish Office
              </a>
            </div>

            <p className="text-sm text-white/75">
              Join St. Kizito Parish online and carry your faith journey with you every day.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
