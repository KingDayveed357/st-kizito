"use client"

import { useEffect } from "react"

/**
 * Root error boundary — catches failures outside the admin dashboard (landing page, login).
 * Admin routes have their own boundary that preserves the sidebar; see
 * `app/admin/(dashboard)/error.tsx`.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[app] route error:", error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="text-4xl mb-5" aria-hidden="true">
          ✝
        </div>

        <h1 className="font-serif text-3xl font-semibold tracking-tight mb-3">
          Something went wrong
        </h1>

        <p className="text-foreground/70 mb-9">
          This page couldn&apos;t be loaded. Please try again in a moment.
        </p>

        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>

        {error.digest ? (
          <p className="mt-6 text-xs text-foreground/50">
            Reference code: <span className="font-mono">{error.digest}</span>
          </p>
        ) : null}
      </div>
    </main>
  )
}
