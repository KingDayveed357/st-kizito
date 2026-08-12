"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"

interface LoginFormProps {
  /** Path to return to after a successful sign-in (from the middleware's `?next=`). */
  nextPath: string
  /** Whether the user arrived here from an explicit sign-out. */
  loggedOut: boolean
  /**
   * The credentials were valid but the account is not on the `admin_users` roster, so the
   * middleware signed the session back out. Distinct from a wrong password — the person needs an
   * existing administrator to grant access, not another attempt.
   */
  notAuthorized?: boolean
}

/**
 * The sign-in form. Search params are passed in as PROPS from the server component rather than read
 * with `useSearchParams()`: that hook opts the route into a client-side-rendering bailout, which
 * required a Suspense boundary and meant the form was absent from the server HTML (users saw a
 * spinner first). Taking them as props keeps the form server-rendered and prerenderable.
 */
export function LoginForm({ nextPath, loggedOut, notAuthorized = false }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email || !password) {
      setError("Please enter both email and password.")
      setIsLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, next: nextPath }),
      })

      const payload = (await response.json()) as {
        error?: string
        redirectTo?: string
      }

      if (!response.ok) {
        setError(payload.error ?? "Sign in failed. Please try again.")
        setIsLoading(false)
        return
      }

      router.replace(payload.redirectTo ?? "/admin")
      router.refresh()
    } catch {
      setError("Unable to reach sign-in service. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="text-4xl mb-4" aria-hidden="true">
            ✝
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight mb-2">St. Kizito Parish</h1>
          <p className="text-sm font-semibold uppercase tracking-widest text-tertiary">Administrative Portal</p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-lg">
          <h2 className="font-serif text-2xl font-semibold mb-2">Secure Sign In</h2>
          <p className="text-foreground/70 mb-8">
            Authorized staff only. Sign-in attempts are monitored and rate-limited.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {notAuthorized && !error ? (
              <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm" role="alert">
                <p className="font-semibold mb-1">This account is not authorized</p>
                <p>
                  Your sign-in was valid, but the account has not been granted administrator access.
                  Ask an existing parish administrator to add you.
                </p>
              </div>
            ) : null}

            {loggedOut && !error && !notAuthorized ? (
              <div
                className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"
                role="status"
                aria-live="polite"
              >
                <p className="font-semibold">You have been signed out securely.</p>
              </div>
            ) : null}

            {error ? (
              <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm" role="alert">
                <p className="font-semibold mb-1">Authentication Error</p>
                <p>{error}</p>
              </div>
            ) : null}

            <div>
              <label htmlFor="admin-email" className="block text-xs font-semibold uppercase tracking-widest text-foreground/70 mb-3">
                Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                placeholder="admin@stkizito.org"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                className="w-full px-4 py-3 bg-surface-container-low rounded-lg outline-none focus:ring-2 focus:ring-tertiary transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="admin-password" className="block text-xs font-semibold uppercase tracking-widest text-foreground/70">
                  Password
                </label>
                <span className="text-xs text-foreground/55">Recovery requires super-admin assistance</span>
              </div>
              <input
                id="admin-password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-surface-container-low rounded-lg outline-none focus:ring-2 focus:ring-tertiary transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Spinner className="size-4" />
                  Signing in...
                </>
              ) : (
                "Enter the Sanctuary"
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-surface-container-low text-center text-xs text-foreground/60 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span aria-hidden="true">✓</span>
              <span>Secure Session Controls Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
