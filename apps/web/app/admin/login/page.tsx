"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card-custom"
import { Button } from "@/components/ui/button-custom"
import { Input } from "@/components/ui/input-custom"
import { createClient } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()
  const loggedOut = searchParams.get("loggedOut") === "1"

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email || !password) {
      setError("Please enter both email and password")
      setIsLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      setIsLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("Invalid email or password.")
      setIsLoading(false)
    } else {
      router.push("/admin")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-4xl mb-4">⛪</div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight mb-2">
            St. Kizito Parish
          </h1>
          <p className="text-sm font-semibold uppercase tracking-widest text-tertiary">
            ADMINISTRATIVE PORTAL
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-lg">
          <h2 className="font-serif text-2xl font-semibold mb-2">
            Secure Sign In
          </h2>
          <p className="text-foreground/70 mb-8">
            Please enter your credentials to access the sanctuary management system.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {loggedOut && !error && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                <p className="font-semibold">You have been signed out securely.</p>
              </div>
            )}
            {error && (
              <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                <p className="font-semibold mb-1">Authentication Error</p>
                <p>{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-foreground/70 mb-3">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40">✉️</span>
                <input
                  type="email"
                  placeholder="admin@stkizito.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-low rounded-lg outline-none focus:ring-2 focus:ring-tertiary transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-semibold uppercase tracking-widest text-foreground/70">
                  Password
                </label>
                <a href="#" className="text-xs font-semibold text-tertiary hover:text-tertiary/80">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40">🔒</span>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-low rounded-lg outline-none focus:ring-2 focus:ring-tertiary transition-all"
                />
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                disabled={isLoading}
                className="w-4 h-4 rounded border-outline/30 accent-tertiary cursor-pointer"
              />
              <span className="text-sm text-foreground/70">Trust this device for 30 days</span>
            </label>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? "Signing in..." : "Enter the Sanctuary"}
            </button>

            {/* Demo Credentials */}
            <div className="mt-8 pt-8 border-t border-surface-container-low">
              <p className="text-xs font-semibold uppercase tracking-widest text-foreground/50 mb-4">
                Demo Access
              </p>
              <div className="space-y-2 text-xs text-foreground/60">
                <div className="flex justify-between items-center">
                  <span>Email:</span>
                  <code className="font-mono text-foreground/80 bg-surface-container-low px-2 py-1 rounded">admin@stkizito.com</code>
                </div>
                <div className="flex justify-between items-center">
                  <span>Password:</span>
                  <code className="font-mono text-foreground/80 bg-surface-container-low px-2 py-1 rounded">demo123</code>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-8 border-t border-surface-container-low text-center text-xs text-foreground/60 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span>✓</span>
              <span>SECURE SESSION ACTIVE</span>
            </div>
            <div className="space-y-2">
              <Link href="/privacy-policy" className="block hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link href="/" className="block hover:text-primary transition-colors">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
