---
name: st-kizito-web-admin
description: Project (St. Kizito). Conventions for the Next.js 16 admin portal (apps/web) — App Router structure, Supabase SSR auth + middleware gating, shadcn/Radix components, dashboard data hooks, and the patterns for admin tables, forms, charts (recharts), filtering, and CSV export. Read before adding an admin page, an API route, an auth-gated view, a table/chart, or anything in apps/web.
version: 1.0.0
---

# St. Kizito Web Admin

`apps/web` is a **Next.js 16 (App Router, React 19)** app: a public landing page plus an authenticated
**admin dashboard** over the same Supabase database the mobile app uses.

## Structure

- `app/page.tsx` + `components/landing/*` — public landing.
- `app/admin/*` — dashboard pages: `announcements`, `events`, `mass-bookings`, `mass-times`, `donations`,
  `payment-details`, `contact-details`, `users`, `feedback`, `sacrament-config`, `sacrament-requests`,
  `settings`, plus `login`, `logout/route.ts`, `loading.tsx`, and the dashboard home `page.tsx`.
- `app/api/*` — route handlers (`admin/login`, `feedback`).
- `components/{ui,admin,dashboard,layout}` — `ui/` is shadcn/Radix primitives; the rest compose them.
- `lib/` — `supabase.ts` (browser client), `supabase-server.ts` (SSR/server client), `admin-dashboard.ts`
  (data access), `utils.ts` (`cn`). `hooks/` — `use-admin-dashboard`, `use-logout`, `use-toast`, `use-mobile`.

## Auth & access

- Admins are Supabase **`authenticated`** users (created via Supabase dashboard invite — parishioners have
  no login). RLS grants authenticated users management on all tables.
- **`middleware.ts`** gates `/admin/*` — it must verify the Supabase session before rendering admin pages.
  Never render admin data in a client component without a server-side session check; use
  `supabase-server.ts` in Server Components / route handlers, `supabase.ts` only in client components.
- Login flow: `app/admin/login` → `app/api/admin/login` → session cookie; logout via `app/admin/logout`.
- **Never expose the service-role key to the browser.** Server-only secrets stay in server files/env.

## UI conventions

- Components are **shadcn/ui over Radix** (accordion, dialog, dropdown, select, tabs, toast, etc. — all
  in `package.json`). Compose these; don't hand-roll primitives. Styling is **Tailwind v4** with
  `tailwind-merge` + `class-variance-authority`; combine classes via `cn()` from `lib/utils.ts`.
- Theme via `next-themes` + `theme-provider.tsx` (light/dark).
- Toasts via `sonner` / `use-toast`. Forms via `react-hook-form` + `zod` (`@hookform/resolvers`) — define
  a zod schema per form, validate, show field errors, disable submit while pending.

## Data patterns

- **Tables:** server-fetch the rows (Server Component or hook), render with the shadcn table primitives;
  add client-side filtering/sorting/search (`cmdk` for command palettes). Paginate large sets.
- **Charts:** `recharts` (already a dep) for donation/booking analytics — keep them accessible (labels,
  legends) and theme-aware.
- **Filtering:** derive from URL search params where it should be shareable/bookmarkable; keep filter
  state predictable. Never put PII in query strings.
- **Export:** CSV export of admin lists (donations, bookings, requests) is a common need — generate
  client-side from already-fetched rows; include a header row; name files with an ISO date.
- **Realtime/refresh:** the dashboard reflects the same DB the mobile app writes to; refetch on focus or
  use Supabase realtime where live status matters (e.g. new bookings/requests).

## Config-driven sacraments (shared contract)

The `sacrament-config` and `sacrament-requests` pages are the admin side of the config-driven request
system — see `st-kizito-sacraments-and-requests`. The admin defines per-type fee/free, required fields
(JSONB), and reviews submissions (approve/reject/needs_info). Keep the field schema in sync with what the
mobile `RequestForm` renders.

## Engineering rules

1. Server-side session check for every `/admin/*` view; service-role key never reaches the browser.
2. `supabase-server.ts` on the server, `supabase.ts` on the client — don't mix.
3. Compose shadcn/Radix + `cn()`; forms use react-hook-form + zod.
4. No PII in URLs; export files exclude secrets.
5. Keep the sacrament field schema consistent with the mobile form.
6. Web has no tests yet — add at least route/auth and critical-form tests when you touch this (see
   `st-kizito-testing`).

## References

- `apps/web/middleware.ts`, `apps/web/lib/supabase-server.ts`, `lib/supabase.ts`, `lib/admin-dashboard.ts`
- `apps/web/app/admin/*`, `apps/web/components/*`, `apps/web/db/*.sql`
- `apps/web/ARCHITECTURE.md`, `COMPONENTS.md`, `DEPLOYMENT.md`
