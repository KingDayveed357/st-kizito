import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Ensure auth endpoints remain accessible.
  if (pathname === '/admin/logout' || pathname === '/api/admin/login') {
    return supabaseResponse
  }

  const isAdminRoute = pathname.startsWith('/admin')
  if (!isAdminRoute) {
    return supabaseResponse
  }

  // Being signed in is NOT the same as being an administrator. `is_admin()` checks membership in
  // the `admin_users` roster (see apps/web/db/2026_08_security_hardening.sql); the same function
  // backs every RLS policy, so the portal and the database agree on who is an admin. Without this
  // check any Supabase Auth user could load the dashboard shell — RLS would block their queries,
  // but they would still see the admin UI.
  let isAdmin = false
  if (user) {
    const { data, error } = await supabase.rpc('is_admin')
    isAdmin = !error && data === true
  }

  if (pathname === '/admin/login') {
    // Only bounce authenticated *admins* away from the login page; a signed-in non-admin would
    // otherwise ping-pong between /admin/login and /admin forever.
    if (user && isAdmin) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return supabaseResponse
  }

  if (!user) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!isAdmin) {
    // Signed in, but not on the roster. Clear the session so the browser does not sit on a
    // half-authenticated state, and say why.
    await supabase.auth.signOut()
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('error', 'not_authorized')
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
