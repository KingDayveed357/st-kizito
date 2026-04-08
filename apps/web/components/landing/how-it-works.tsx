export function HowItWorksSection() {
  const steps = [
    {
      number: "1",
      title: "Download",
      description: "Available on iOS and Android. Small file size, optional high-feature app for when you're ready.",
    },
    {
      number: "2",
      title: "Explore",
      description: "Browse readings, schedules, and parish information without needing to sign up immediately.",
    },
    {
      number: "3",
      title: "Stay Connected",
      description: "Create notifications for your specific parish initiatives and never miss important community events.",
    },
  ]

  return (
    <section className="py-32 px-6 lg:px-12 bg-surface">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-serif text-4xl lg:text-5xl font-semibold tracking-tight mb-20 text-center leading-tight">
          Your Journey Starts Here
        </h2>

        <p className="text-center text-foreground/70 mb-20 max-w-xl mx-auto">
          Three simple steps to bridge the gap between tradition and modern convenience.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Step number circle */}
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mb-6 font-serif text-2xl font-bold">
                {step.number}
              </div>
              
              <h3 className="font-semibold text-lg mb-3 text-foreground">
                {step.title}
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                {step.description}
              </p>

              {/* Connection line to next step */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-24 right-0 h-px bg-surface-container-low transform -translate-x-8" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
