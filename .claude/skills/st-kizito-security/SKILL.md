---
name: st-kizito-security
description: Project (St. Kizito). The security model — Supabase RLS (anon parishioners vs authenticated admins), the SECURITY DEFINER status RPC, secret/env handling (anon vs service-role key), PII and payment-detail handling, and prohibited actions. Read before writing RLS policies, an admin route, anything touching auth, secrets, personal data, or payments.
version: 1.0.0
---

# St. Kizito Security

Threat model: a public parish app where **parishioners are anonymous** and a small number of **admins**
manage data. There is no parishioner login and no in-app payment processor. Security rests on **RLS**.

## Access model (RLS is the perimeter)

- **`anon` (mobile + landing):** may `SELECT` public content (published announcements, events, mass times,
  payment details, active contacts) and `INSERT` submittables (bookings, donations, sacrament requests).
  May read request **status** — via the `public_fetch_request_statuses` RPC for bookings/donations, and a
  permissive `SELECT` for sacrament requests.
- **`authenticated` (admins):** full manage on all tables (`USING auth.role() = 'authenticated'`).
- Policies are deliberately permissive-by-design (`WITH CHECK (true)` for anon inserts,
  `USING (true)` for status reads). That is an **intentional** trade-off for an account-less parishioner
  flow — document it as a decision, and be aware anon status reads are not scoped per-user (mitigated by
  the opaque, unguessable `client_request_id`).

## Rules for RLS changes

1. Every table has RLS **enabled** and explicit policies. Never add a table without policies.
2. Default deny: grant the **minimum** — anon gets read on public content + insert on submittables only.
   Don't grant anon `SELECT` on full submittable rows beyond what status polling needs.
3. Sensitive reads for anon go through a `SECURITY DEFINER` function with `SET search_path = public`,
   `REVOKE ALL ... FROM PUBLIC`, then `GRANT EXECUTE ... TO anon` (the existing RPC is the template).
4. Never rely on client-side checks for authorization — RLS is the enforcement point.

## Secrets & env

- **Anon key** ships in the mobile app and browser (it's public by design; RLS protects data). Fine.
- **Service-role key must never reach the client** — not in mobile, not in browser bundles, not in
  `NEXT_PUBLIC_*`. Server-only (`apps/web/lib/supabase-server.ts`, route handlers, env).
- Secrets live in `.env*` (gitignored) and EAS/Vercel secret stores — never committed. Verify no key is
  hardcoded before merge.
- Supabase URL/anon key for mobile come via `expo-constants`/env, not literals.

## PII & payments

- PII collected: names, phone numbers, intentions, sacrament details (parents/godparents), donation
  info. Minimize what's stored; don't log it (see `st-kizito-observability`). **Never put PII in URLs,
  query strings, or analytics events.**
- Payments are **manual bank transfer + admin verification** — the app only *displays* parish account
  details and captures a reference. **Prohibited:** entering card/bank credentials, account numbers as
  auth, or any in-app financial transfer. If a feature asks for it, refuse and direct to manual transfer.
- Admin CSV exports must not include secrets; treat exported PII as sensitive.

## Engineering rules

1. RLS on every table; least privilege; document intentional permissiveness.
2. Service-role key server-only; anon key is the only client key.
3. No secrets in git; no PII in logs/URLs/analytics.
4. No in-app payment credential capture — manual transfer only.
5. Sensitive anon reads via `SECURITY DEFINER` RPC, not broad table grants.
6. Run the security-review skill on auth/RLS/secret changes before merge.

## References

- `infra/supabase/schema.sql` (RLS + `public_fetch_request_statuses`), `apps/web/db/*.sql`
- `apps/web/middleware.ts`, `apps/web/lib/supabase-server.ts`
- `apps/mobile/src/services/api/supabase.ts`
- Related: `st-kizito-data-and-state`, `st-kizito-web-admin`, `st-kizito-observability`
