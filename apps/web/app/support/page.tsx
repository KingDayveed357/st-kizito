import type { Metadata } from "next"
import Link from "next/link"

/** Public support page — the App Store "Support URL" and Play Console contact website point here. */

const CONTACT_EMAIL = "davidaniago@gmail.com"

export const metadata: Metadata = {
  title: "Support · St. Kizito Parish Eligbolo",
  description: "Get help with the St. Kizito Parish Eligbolo app: report a problem, ask a question, or make a privacy request.",
  alternates: { canonical: "https://stkizitoparisheligbolo.org/support" },
}

const FAQ = [
  {
    q: "Do I need an account?",
    a: "No. Readings, the Divine Office, prayers and parish information work without signing in, and most of them work offline.",
  },
  {
    q: "I booked a Mass or made an offering. What happens next?",
    a: "Your request goes to the parish office, who check your bank transfer and confirm it. You can follow its status in the app under History.",
  },
  {
    q: "My reminders are not showing.",
    a: "Check that notifications are allowed for the app in your phone's settings, and that the reminder is switched on in Prayer Reminders.",
  },
  {
    q: "How do I have my information deleted?",
    a: "Email us with the subject \"Data deletion request\". The privacy policy explains what we keep and for how long.",
  },
]

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-outline/20 bg-surface-container-low">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-serif text-lg font-semibold text-foreground hover:text-secondary">
            St. Kizito Parish Eligbolo
          </Link>
          <Link href="/" className="text-sm text-foreground/70 hover:text-secondary underline-offset-4 hover:underline">
            Back to home
          </Link>
        </div>
      </header>

      <main id="main" className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-12">
        <div>
          <p className="text-xs uppercase tracking-widest text-secondary font-semibold mb-3">Help</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-4">App support</h1>
          <p className="text-lg text-foreground/85 leading-relaxed">
            Found a problem, or have a question about the St. Kizito Parish Eligbolo app? We are glad to help.
          </p>
        </div>

        <section aria-labelledby="contact-heading" className="rounded-xl bg-surface-container-low p-6">
          <h2 id="contact-heading" className="font-serif text-2xl font-semibold text-foreground mb-3">
            Contact us
          </h2>
          <p className="text-foreground/85 leading-relaxed">
            Email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-secondary underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
            . Please tell us your phone model, what you were doing, and what went wrong. We usually reply within a few
            days.
          </p>
          <p className="mt-3 text-foreground/85 leading-relaxed">
            St. Kizito Parish, Brainfield Avenue, along East&ndash;West Road, Eligbolo, Port Harcourt, Rivers State,
            Nigeria.
          </p>
        </section>

        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="font-serif text-2xl font-semibold text-foreground mb-6">
            Common questions
          </h2>
          <dl className="space-y-6">
            {FAQ.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold text-foreground">{item.q}</dt>
                <dd className="mt-1 text-foreground/85 leading-relaxed">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="text-foreground/70">
          Read our{" "}
          <Link href="/privacy-policy" className="text-secondary underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
    </div>
  )
}
