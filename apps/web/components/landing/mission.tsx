import Image from "next/image"

export function MissionSection() {
  return (
    <section className="relative py-32 px-1 lg:px-12 text-white overflow-hidden">
      <Image
        src="/background-image.jpg"
        alt="St. Kizito Parish congregation"
        fill
        sizes="100vw"
        className="object-cover"
        quality={65}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/80 to-primary/75" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(201, 168, 76, 0.3) 0%, transparent 50%)",
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
