import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

/**
 * Public privacy policy for the St. Kizito Parish Eligbolo mobile app (Android + iOS) and website.
 *
 * Every statement here is derived from the implementation, not a template:
 *   - no parishioner accounts (the mobile app has no sign-in; only administrators sign in on the web)
 *   - bookings / donations / sacrament_requests tables (infra/supabase/schema.sql, apps/web/db/*)
 *   - private `payment-receipts` bucket (apps/mobile/src/services/api/receipts.ts)
 *   - reminders scheduled locally, no push token sent anywhere (apps/mobile/src/services/notifications)
 *   - Vercel Analytics on the website only (app/layout.tsx)
 * If any of those change, this page must change in the same pull request. Update the dates below.
 */

const CONTACT_EMAIL = "davidaniago@gmail.com"
const EFFECTIVE_DATE = "14 October 2026"
const CANONICAL_URL = "https://stkizitoparisheligbolo.org/privacy-policy"

export const metadata: Metadata = {
  title: "Privacy Policy · St. Kizito Parish Eligbolo",
  description:
    "How the St. Kizito Parish Eligbolo app and website collect, use, store and delete the information you share with the parish.",
  alternates: { canonical: CANONICAL_URL },
  robots: { index: true, follow: true },
}

const SECTIONS = [
  { id: "who-we-are", title: "Who we are" },
  { id: "scope", title: "What this policy covers" },
  { id: "no-account", title: "You do not need an account" },
  { id: "what-we-collect", title: "Information you give us" },
  { id: "on-your-device", title: "Information that stays on your phone" },
  { id: "technical", title: "Technical information" },
  { id: "permissions", title: "Phone permissions" },
  { id: "how-we-use", title: "How we use your information" },
  { id: "sharing", title: "Who can see it, and service providers" },
  { id: "security", title: "How we protect it" },
  { id: "retention", title: "How long we keep it" },
  { id: "your-rights", title: "Your rights and how to delete your data" },
  { id: "children", title: "Children" },
  { id: "changes", title: "Changes to this policy" },
  { id: "contact", title: "Contact us" },
] as const

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24">
      <h2 id={`${id}-heading`} className="font-serif text-2xl font-semibold text-foreground mb-4">
        {title}
      </h2>
      <div className="space-y-4 text-foreground/85 leading-relaxed">{children}</div>
    </section>
  )
}

const mail = (
  <a href={`mailto:${CONTACT_EMAIL}`} className="text-secondary underline underline-offset-4">
    {CONTACT_EMAIL}
  </a>
)

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-outline/20 bg-surface-container-low">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-serif text-lg font-semibold text-foreground hover:text-secondary">
            St. Kizito Parish Eligbolo
          </Link>
          <Link href="/" className="text-sm text-foreground/70 hover:text-secondary underline-offset-4 hover:underline">
            Back to home
          </Link>
        </div>
      </header>

      <main id="main" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-secondary font-semibold mb-3">Legal</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-foreground/70">
            Effective and last updated: <time dateTime="2026-10-14">{EFFECTIVE_DATE}</time>
          </p>
          <p className="mt-6 max-w-3xl text-lg text-foreground/85 leading-relaxed">
            The St. Kizito Parish Eligbolo app helps parishioners pray, read the daily readings, book Masses, make
            offerings and request parish records. This policy explains, in plain language, what information that
            involves and what happens to it.
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-12">
          <nav aria-label="Table of contents" className="mb-10 lg:mb-0">
            <div className="lg:sticky lg:top-8 rounded-xl bg-surface-container-low p-5">
              <h2 className="text-xs uppercase tracking-widest font-semibold text-foreground/70 mb-3">On this page</h2>
              <ol className="space-y-2 text-sm list-decimal list-inside marker:text-foreground/50">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-foreground/80 hover:text-secondary hover:underline underline-offset-4">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <article className="space-y-12 max-w-3xl">
            <Section id="who-we-are" title="Who we are">
              <p>
                The app and this website are operated by <strong>Aniago, Uche Camminus</strong> on behalf of St. Kizito
                Parish, Eligbolo (&ldquo;the parish&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). We decide how the
                information described here is used and are responsible for protecting it.
              </p>
              <p>Privacy questions and requests: {mail}.</p>
            </Section>

            <Section id="scope" title="What this policy covers">
              <p>
                This policy covers the St. Kizito Parish Eligbolo app on Android and iOS, and the website at
                stkizitoparisheligbolo.org, including its administration portal. The app behaves the same way on
                Android and iOS; where there is a difference, we say so.
              </p>
            </Section>

            <Section id="no-account" title="You do not need an account">
              <p>
                Parishioners do not sign up or sign in. You can read, pray and browse parish information without
                giving us anything about yourself. We only receive personal information when you choose to submit
                one of the forms described below.
              </p>
              <p>
                Only parish administrators have accounts. They sign in on the website with an email address and
                password to review requests.
              </p>
            </Section>

            <Section id="what-we-collect" title="Information you give us">
              <h3 className="font-semibold text-foreground">Mass bookings</h3>
              <p>
                Your name, the Mass intention, the type of Mass, the dates and preferred Mass time, the amount of the
                offering, and the name and reference you used for your bank transfer.
              </p>
              <h3 className="font-semibold text-foreground">Offerings and donations</h3>
              <p>
                The amount, the purpose, any message you add, the name and reference used for your bank transfer, and
                your name.
              </p>
              <h3 className="font-semibold text-foreground">Payment receipts</h3>
              <p>
                If you choose to attach one, a photograph or PDF of your bank-transfer receipt. The app does{" "}
                <strong>not</strong> take payments and never asks for card numbers, PINs or bank passwords. You pay by
                bank transfer outside the app; the receipt only helps the parish office match your transfer to your
                request. A receipt may show details your bank prints on it, such as part of an account number, so
                please check it before attaching.
              </p>
              <h3 className="font-semibold text-foreground">Sacrament and parish record requests</h3>
              <p>
                The details asked for on that form, for example a contact phone number, email address, the name of the
                person the record is for, and dates and places of baptism or other sacraments. Some of this may be
                about another person, such as your child; please only submit it if you are entitled to.
              </p>
              <h3 className="font-semibold text-foreground">Administrators</h3>
              <p>The email address and sign-in details of parish administrators.</p>
            </Section>

            <Section id="on-your-device" title="Information that stays on your phone">
              <p>
                Your saved readings and prayers, favourites, reminder times, text-size and display preferences, and the
                readings and prayers stored for offline use are kept only on your phone. They are never sent to us.
                Uninstalling the app removes them.
              </p>
              <p>
                The app also keeps a local copy of requests you submitted so it can show their status and send them
                once you are back online.
              </p>
            </Section>

            <Section id="technical" title="Technical information">
              <p>
                The app contains no advertising, analytics or crash-reporting software, and it does not collect your
                location, contacts or advertising identifier.
              </p>
              <p>
                Like any internet service, our hosting providers receive basic connection data, such as IP address,
                device type and app version, when your phone loads parish information, sends a form or checks for an
                app update. The website uses Vercel Web Analytics to count page visits; it gives us aggregated
                statistics and does not use cookies to identify you.
              </p>
            </Section>

            <Section id="permissions" title="Phone permissions">
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Notifications</strong>: used for prayer and reading reminders that you turn on. They are
                  scheduled on your phone, not sent from a server, and no notification token is collected.
                </li>
                <li>
                  <strong>Photos</strong>: requested only when you choose to attach a receipt; the app reads only the
                  single image you pick.
                </li>
              </ul>
              <p>You can withdraw either permission at any time in your phone&rsquo;s settings.</p>
            </Section>

            <Section id="how-we-use" title="How we use your information">
              <p>We use what you submit only to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>arrange the Masses you book and include your intentions;</li>
                <li>record and acknowledge offerings and match them with bank transfers;</li>
                <li>prepare the parish records you ask for and contact you about them;</li>
                <li>keep the parish&rsquo;s financial and pastoral records accurate; and</li>
                <li>keep the service secure and working.</li>
              </ul>
              <p>
                We process this information because you asked us to carry out your request, with your consent, and in
                the parish&rsquo;s legitimate interest of keeping proper records. We never sell your information or use
                it for advertising.
              </p>
            </Section>

            <Section id="sharing" title="Who can see it, and service providers">
              <p>
                Only parish administrators can see the requests you submit. Other parishioners cannot see them. Mass
                intentions may be read aloud at Mass, as is customary.
              </p>
              <p>We use these providers to run the service. They handle data only to provide that service to us:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Supabase</strong>: database, file storage for receipts, and administrator sign-in.</li>
                <li><strong>Vercel</strong>: hosting for this website and its visit statistics.</li>
                <li><strong>Expo (EAS)</strong>: delivery of app updates.</li>
                <li><strong>Google Play and Apple App Store</strong>: app distribution, under their own privacy policies.</li>
              </ul>
              <p>
                These providers may store or process data on servers outside Nigeria. We disclose information to anyone
                else only if the law requires it.
              </p>
            </Section>

            <Section id="security" title="How we protect it">
              <p>
                All connections between the app, the website and our database use HTTPS. Database access rules allow
                parishioners to submit requests but not to read anyone&rsquo;s records, and only accounts on the
                parish&rsquo;s administrator list can read them. Receipts are kept in private storage and are viewed by
                administrators through short-lived links. No system is perfectly secure, but we review these controls
                and act quickly on any problem.
              </p>
            </Section>

            <Section id="retention" title="How long we keep it">
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Receipt images</strong>: deleted 12 months after the booking or offering is confirmed. The
                  written record of the payment is kept as below.
                </li>
                <li>
                  <strong>Mass bookings and offerings</strong>: kept for 6 years after the year they were made, so the
                  parish can keep proper financial records, then deleted.
                </li>
                <li>
                  <strong>Sacrament and record requests</strong>: deleted 12 months after the request is completed.
                  The parish&rsquo;s official sacramental registers are kept permanently, as Church law requires; they
                  are separate from the app.
                </li>
                <li>
                  <strong>Rejected or incomplete submissions</strong>: deleted within 90 days.
                </li>
                <li>
                  <strong>Administrator accounts</strong>: removed when the person no longer serves in that role.
                </li>
              </ul>
              <p>The parish office reviews records against these periods at least every three months.</p>
            </Section>

            <Section id="your-rights" title="Your rights and how to delete your data">
              <p>
                Under the Nigeria Data Protection Act 2023, and similar laws where you live, you can ask us to give you a
                copy of your information, correct it, delete it, restrict or object to how we use it, or withdraw your
                consent.
              </p>
              <p>
                Because there are no parishioner accounts, there is no account to delete. To have your information
                deleted, email {mail} with the subject &ldquo;Data deletion request&rdquo;, and include the name and
                the approximate date or transfer reference you used so we can find your records. We may ask you to
                confirm your identity. We will respond within 30 days. We may keep a record of a payment where it is
                needed for the parish&rsquo;s financial records, and we will tell you if so.
              </p>
              <p>
                If you are unhappy with how we handled your request, you may complain to the Nigeria Data Protection
                Commission (ndpc.gov.ng) or the data protection authority where you live.
              </p>
            </Section>

            <Section id="children" title="Children">
              <p>
                The app is meant for the whole parish family but is not directed at children, and we do not knowingly
                collect information from children under 13. Requests about a child, such as for a baptismal record,
                should be made by a parent or guardian. If you believe a child has sent us information, contact us and
                we will delete it.
              </p>
            </Section>

            <Section id="changes" title="Changes to this policy">
              <p>
                If we change how we handle information, we will update this page and the date at the top. Significant
                changes will also be announced in the app or at the parish.
              </p>
            </Section>

            <Section id="contact" title="Contact us">
              <p>
                Aniago, Uche Camminus, for St. Kizito Parish, Eligbolo
                <br />
                Email: {mail}
              </p>
            </Section>
          </article>
        </div>
      </main>

      <footer className="border-t border-outline/20 bg-surface-container-highest">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row justify-between gap-3 text-sm text-foreground/70">
          <p>&copy; {new Date().getFullYear()} St. Kizito Parish Eligbolo</p>
          <Link href="/" className="hover:text-secondary hover:underline underline-offset-4">
            Home
          </Link>
        </div>
      </footer>
    </div>
  )
}
