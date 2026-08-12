import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface LoginAttemptState {
  attempts: number
  windowStartedAt: number
  blockedUntil?: number
}

// Best-effort app-instance throttling. For multi-instance deployments, move this to Redis/Upstash.
const loginAttempts = new Map<string, LoginAttemptState>()
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5
const BLOCK_MS = 15 * 60 * 1000

const getClientIp = (request: NextRequest) => {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim()
    if (firstIp) return firstIp
  }

  return request.headers.get('x-real-ip') ?? 'unknown'
}

const makeRateLimitKey = (request: NextRequest, email: string) => {
  return `${getClientIp(request)}:${email.toLowerCase()}`
}

const getRetrySeconds = (state: LoginAttemptState, now: number) => {
  if (!state.blockedUntil) return 0
  return Math.max(0, Math.ceil((state.blockedUntil - now) / 1000))
}

const isBlocked = (state: LoginAttemptState, now: number) => {
  return Boolean(state.blockedUntil && state.blockedUntil > now)
}

const cleanupIfWindowExpired = (state: LoginAttemptState, now: number) => {
  if (now - state.windowStartedAt > ATTEMPT_WINDOW_MS) {
    state.attempts = 0
    state.windowStartedAt = now
    state.blockedUntil = undefined
  }
}

export async function POST(request: NextRequest) {
  let payload: { email?: string; password?: string; next?: string } | null = null

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
  }

  const email = payload?.email?.trim() ?? ''
  const password = payload?.password ?? ''
  const next = payload?.next

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }

  const now = Date.now()
  const rateLimitKey = makeRateLimitKey(request, email)
  const currentState = loginAttempts.get(rateLimitKey) ?? { attempts: 0, windowStartedAt: now }
  cleanupIfWindowExpired(currentState, now)

  if (isBlocked(currentState, now)) {
    return NextResponse.json(
      {
        error: 'Too many failed sign-in attempts. Please try again later.',
        retryAfterSeconds: getRetrySeconds(currentState, now),
      },
      { status: 429 }
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    currentState.attempts += 1
    if (currentState.attempts >= MAX_ATTEMPTS) {
      currentState.blockedUntil = now + BLOCK_MS
    }
    loginAttempts.set(rateLimitKey, currentState)

    return NextResponse.json(
      { error: 'Invalid email or password.' },
      { status: error.status === 400 ? 401 : 500 }
    )
  }

  // Valid credentials are not the same as authorization. Confirm the account is on the
  // `admin_users` roster before handing back a usable session; otherwise sign it straight back out
  // so no half-authenticated cookie survives. The middleware enforces this on every request too —
  // this check exists so the person gets an accurate message instead of a silent bounce.
  const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin')

  // A missing `is_admin` function is a DEPLOYMENT problem, not a rejected account, and the two must
  // not produce the same message. Reporting "not authorized" when the security migration simply has
  // not been applied sends an administrator hunting for a permissions issue that does not exist.
  // PostgREST answers an unknown function with PGRST202 / a 404.
  if (roleError) {
    await supabase.auth.signOut()
    const functionMissing =
      roleError.code === 'PGRST202' || /function .*is_admin.* does not exist/i.test(roleError.message ?? '')

    console.error('[admin-login] is_admin() check failed', roleError)

    return NextResponse.json(
      {
        error: functionMissing
          ? 'The portal is not finished setting up: the administrator roster has not been installed on the database yet. Run apps/web/db/2026_08_security_hardening.sql, then seed the first owner.'
          : 'We could not verify your access just now. Please try again in a moment.',
      },
      // 503, not 403: nothing is wrong with the credentials, and retrying after the migration
      // lands will succeed.
      { status: 503 }
    )
  }

  if (isAdmin !== true) {
    await supabase.auth.signOut()
    // Counts against the rate limit: probing which addresses are administrators is an attack.
    currentState.attempts += 1
    if (currentState.attempts >= MAX_ATTEMPTS) {
      currentState.blockedUntil = now + BLOCK_MS
    }
    loginAttempts.set(rateLimitKey, currentState)

    return NextResponse.json(
      { error: 'This account is not authorized for the administrative portal.' },
      { status: 403 }
    )
  }

  loginAttempts.delete(rateLimitKey)

  const safeNext = next && next.startsWith('/admin') ? next : '/admin'
  // Keep redirect targets constrained to admin routes to avoid open redirects.
  return NextResponse.json({ success: true, redirectTo: safeNext })
}
