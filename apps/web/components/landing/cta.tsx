"use client"

import { FormEvent, useState } from "react"

type FeedbackCategory = "bug" | "feature request" | "general feedback"

export function CTASection() {
  const [category, setCategory] = useState<FeedbackCategory>("general feedback")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  const apkUrl = "https://expo.dev/artifacts/eas/oiEyTWEtwKSze3dVsehmpC.apk"

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!message.trim()) {
      setStatus("error")
      return
    }

    setIsSubmitting(true)
    setStatus("idle")

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          email: email.trim() || null,
          message: message.trim(),
          category,
        }),
      })

      if (!response.ok) {
        throw new Error("Feedback submission failed")
      }

      setName("")
      setEmail("")
      setMessage("")
      setCategory("general feedback")
      setStatus("success")
    } catch (error) {
      setStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative py-24 px-3 lg:px-12 overflow-hidden bg-surface-container-low">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-tertiary/20 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary via-primary/95 to-secondary shadow-2xl p-8 md:p-12 lg:p-16 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <p className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs md:text-sm font-semibold tracking-[0.12em] uppercase mb-6">
              Beta Access
            </p>

            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 leading-tight">
              Help Us Shape the Early Testing Version
            </h2>

            <p className="text-base md:text-lg text-white/85 mb-10 leading-relaxed max-w-3xl mx-auto">
              You are getting early beta access to our Android app. Report bugs, suggest features, and share your feedback so the full release is stronger for everyone.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
              <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4">
                <p className="text-xl font-bold">Report Bugs</p>
                <p className="text-sm text-white/80 mt-1">Tell us what breaks so we can improve stability quickly.</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4">
                <p className="text-xl font-bold">Suggest Features</p>
                <p className="text-sm text-white/80 mt-1">Help prioritize the tools that matter most to parish life.</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4">
                <p className="text-xl font-bold">Share Feedback</p>
                <p className="text-sm text-white/80 mt-1">General thoughts, ideas, and friction points are welcome.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <a
                href={apkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-tertiary text-primary font-semibold rounded-full hover:bg-tertiary/90 transition-all duration-300 hover:-translate-y-0.5"
              >
                Download Android APK (Beta)
              </a>
              <span className="inline-flex items-center justify-center px-8 py-3.5 border border-white/50 bg-white/10 text-white/90 font-semibold rounded-full">
                iOS coming soon
              </span>
            </div>

            <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl rounded-2xl border border-white/20 bg-white/10 p-5 md:p-6 text-left">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/90 mb-4">Send Beta Feedback</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Name (optional)"
                  className="h-11 rounded-lg border border-white/30 bg-white/10 px-3 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/70"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email (optional)"
                  className="h-11 rounded-lg border border-white/30 bg-white/10 px-3 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/70"
                />
              </div>
              <div className="mb-3">
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as FeedbackCategory)}
                  className="h-11 w-full rounded-lg border border-white/30 bg-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/70"
                >
                  <option value="bug" className="text-slate-900">bug</option>
                  <option value="feature request" className="text-slate-900">feature request</option>
                  <option value="general feedback" className="text-slate-900">general feedback</option>
                </select>
              </div>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
                placeholder="Your message"
                rows={4}
                className="w-full rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/70"
              />
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-full bg-white text-primary px-6 py-2.5 text-sm font-semibold hover:bg-white/90 transition disabled:opacity-70"
                >
                  {isSubmitting ? "Sending..." : "Submit Feedback"}
                </button>
                {status === "success" ? <p className="text-sm text-emerald-200">Thank you. Your feedback has been received.</p> : null}
                {status === "error" ? <p className="text-sm text-red-200">Unable to submit right now. Please try again.</p> : null}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
