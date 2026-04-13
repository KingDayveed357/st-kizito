export function MissionSection() {
  return (
    <section
      className="relative py-32 px-6 lg:px-12 text-white overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, rgba(5, 33, 66, 0.9), rgba(5, 33, 66, 0.82), rgba(5, 33, 66, 0.76)), url('/background-image.jpg')",
      }}
    >
      {/* Background texture/image */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(201, 168, 76, 0.3) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-tertiary mb-6">
          GRACE IN THE MODERN AGE
        </p>

        <blockquote className="font-serif text-4xl lg:text-5xl font-bold leading-tight mb-8">
          &quot;Where two or three are gathered in my name, there am I among them.&quot;
        </blockquote>

        <p className="text-lg text-white/80 leading-relaxed mb-16 max-w-2xl mx-auto">
          The St. Kizito Parish App is more than just code; it&apos;s a digital extension of our sacred space. It is designed to foster communion, facilitate prayer, and keep the fire of faith burning bright in the hearts of our parishioners, no matter where they are in the world.
        </p>

        <a 
          href="#"
          className="inline-flex items-center justify-center px-8 py-3 bg-tertiary text-primary font-semibold rounded-full hover:bg-tertiary/90 transition-colors"
        >
          Join Our Community
        </a>
      </div>
    </section>
  )
}
