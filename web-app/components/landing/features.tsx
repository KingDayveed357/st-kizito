import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card-custom"

interface Feature {
  title: string
  description: string
  icon: React.ReactNode
}

const features: Feature[] = [
  {
    title: "Announcement Management",
    description: "Keep your parish informed with timely announcements about liturgical celebrations, parish news, and community updates.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882m7.832 6.882a4.5 4.5 0 01-7.664 0m7.664 0a4.5 4.5 0 00-7.664 0m7.664 0l3.828-3.828a6 6 0 00-8.485 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Event Planning",
    description: "Organize parish events, retreats, and celebrations. Share details, manage attendance, and keep everyone connected.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Mass Schedule",
    description: "Display daily and weekly mass times. Let parishioners plan their spiritual practice with accurate, always-current schedules.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Mass Bookings",
    description: "Manage mass intentions and bookings. Process requests for masses, track intentions, and maintain a reverent record.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7 20H5a2 2 0 01-2-2V5a2 2 0 012-2h6.414a2 2 0 011.414.586l7 7A2 2 0 0121 9.414V19a2 2 0 01-2 2h-12a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: "Community Management",
    description: "Manage parishioners and admin users. Define roles, permissions, and keep your parish hierarchy organized.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 8.048M12 9v.75m6.154-.75H18m0 0a6 6 0 01-12 0m12 0H6" />
      </svg>
    ),
  },
  {
    title: "Secure & Reliable",
    description: "Enterprise-grade security with role-based access control. Your parish data is protected with modern encryption and backups.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 sm:py-24 lg:py-32 px-6 sm:px-8 lg:px-12 bg-surface">
      <div className="max-w-7xl mx-auto">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-tertiary mb-3 sm:mb-4">
          THE DIGITAL SANCTUARY
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mb-3 sm:mb-4 leading-tight text-balance">
          Faith, Integrated.
        </h2>
        <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mb-12 sm:mb-16 lg:mb-20">
          A complete platform designed to bring your parish closer together.
        </p>

        {/* Featured Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-12 sm:mb-16 lg:mb-16">
          {/* Daily Readings Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 lg:p-12 flex flex-col justify-between h-full border border-outline/10 shadow-xs hover:shadow-sm transition-all">
            <div>
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📖</div>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Daily Readings & Liturgy</h3>
              <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                Carry the Word of God wherever you go. Fully accessible offline with liturgical calendars and reflection guides.
              </p>
            </div>
            <a href="#" className="text-tertiary font-semibold inline-flex items-center gap-2 mt-4 sm:mt-6 hover:gap-3 transition-all text-sm sm:text-base">
              Explore Scripture <span>→</span>
            </a>
          </div>

          {/* Mass Times Card - Dark */}
          <div className="bg-primary text-on-primary rounded-2xl p-6 sm:p-8 lg:p-12 flex flex-col justify-between h-full shadow-xs hover:shadow-sm transition-all">
            <div>
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🕯️</div>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Mass Times</h3>
              <p className="text-sm sm:text-base text-on-primary/80 leading-relaxed">
                Never miss a celebration. Real-time updates for weekday, weekend, and holy day services.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            { icon: '📅', title: 'Parish Events', desc: 'Upcoming groups, bible meetings, and parish celebrations registered.' },
            { icon: '🙏', title: 'Mass Intentions', desc: 'Request private masses with precise details and options for personalization.' },
            { icon: '📢', title: 'Announcements', desc: 'Stay informed on ministry news and important parish notifications.' },
          ].map((feature) => (
            <div key={feature.title} className="bg-surface-container-low rounded-2xl p-6 border border-outline/10 hover:border-outline/20 shadow-xs hover:shadow-sm transition-all">
              <div className="text-3xl sm:text-4xl mb-4">{feature.icon}</div>
              <h4 className="font-semibold text-base sm:text-lg mb-2 text-foreground">{feature.title}</h4>
              <p className="text-sm text-foreground/70 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
