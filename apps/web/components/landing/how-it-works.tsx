export function HowItWorksSection() {
  const steps = [
    {
      number: "1",
      title: "Download the Parish App",
      description: "Install the St. Kizito Parish App on your phone and open your daily doorway to prayer, scripture, and parish life.",
    },
    {
      number: "2",
      title: "Begin with What You Need",
      description: "Read daily readings, check Mass times, and follow parish announcements in a calm, sacred interface.",
    },
    {
      number: "3",
      title: "Stay Rooted in Community",
      description: "Turn on gentle reminders and remain connected to St. Kizito events, devotions, and moments of grace.",
    },
  ]

  return (
    <section className="relative py-28 px-6 lg:px-12 overflow-hidden bg-surface">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-44 w-[70%] bg-primary/5 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 h-56 w-56 bg-tertiary/10 blur-3xl rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold tracking-[0.12em] uppercase mb-5">
            How It Works
          </p>

          <h2 className="font-serif text-4xl lg:text-5xl font-semibold tracking-tight mb-6 text-center leading-tight text-foreground">
            A Simple Path to Daily Faith
          </h2>

          <p className="text-center text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            In three clear steps, every parishioner can pray, stay informed, and remain spiritually connected to St. Kizito Parish.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative rounded-3xl border border-primary/15 bg-white/80 backdrop-blur-sm p-7 lg:p-8 shadow-[0_14px_30px_-18px_rgba(15,23,42,0.35)]"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mb-6 font-serif text-xl font-bold shadow-md shadow-primary/20">
                <span>{step.number}</span>
              </div>
              
              <h3 className="font-semibold text-xl mb-3 text-foreground leading-snug">
                {step.title}
              </h3>
              <p className="text-foreground/70 leading-relaxed text-[15px]">
                {step.description}
              </p>

              {/* Connection line to next step */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[92%] w-[22%] h-px bg-gradient-to-r from-primary/30 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
