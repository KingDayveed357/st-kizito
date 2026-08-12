---
name: st-kizito-sacraments-and-requests
description: Project (St. Kizito). The config-driven request system shared by mobile and web — bookings, donations, and sacrament requests (baptismal card first, extensible to confirmation/marriage/etc.). Covers the sacrament_request_types config table, the JSONB required_fields form schema, client_request_id idempotency, anon submit + status polling via RPC, and the mobile submit → admin review → notify loop. Read before touching any request/booking/donation/sacrament flow on mobile or web.
version: 1.0.0
---

# St. Kizito Sacraments & Requests

Parishioners submit requests **without an account**. Bookings, donations, and sacrament requests all
share one pattern: anon `INSERT`, opaque `client_request_id`, and status polling.

## Config-driven sacraments (the key idea)

New sacraments are added by **inserting a config row, not by changing schema or code.**

- **`sacrament_request_types`** (config, `apps/web/db/create_sacrament_requests.sql`): `type` (PK, e.g.
  `baptismal_card`), `title`, `description`, `icon` (Ionicons name), `is_free`, `amount`, `currency`
  (`₦`), payment fields (`account_name/number`, `bank_name`, `payment_instructions/notes`),
  `allow_attachment`, `active`, `sort_order`, and **`required_fields` JSONB** — the form schema:
  ```json
  [{ "key": "...", "label": "...", "type": "text|longtext|date|phone|email|select",
     "required": true, "helperText": "?", "placeholder": "?", "options": ["?"] }]
  ```
- **`sacrament_requests`** (submissions): `type` (FK), `client_request_id` (unique), `status`
  (`pending|approved|rejected|needs_info`), `full_name`, `contact_phone`, `payload` JSONB (the filled
  fields), `attachment_url`, `is_free`, `amount_due`, `admin_note`, timestamps (`updated_at` via trigger).
- Seeded type: **Baptismal Card** (`water-outline`, free) with date/place/father/mother/godparents/notes.

**Mobile** renders a generic form from `required_fields` (driven by `useSacramentTypes` →
`src/services/requests/sacramentRequestStore.ts`, routes `app/sacraments/index.tsx` +
`app/sacraments/[type].tsx`). **Admin** manages config + reviews on `app/admin/sacrament-config` and
`app/admin/sacrament-requests`. To add Confirmation/Marriage/First Communion: insert a config row with
its fields — the mobile form and admin review adapt automatically. Do not fork per-sacrament code.

## The shared submit pattern (bookings, donations, sacraments)

1. **Generate `client_request_id` client-side** (`src/utils/requestId.ts`) before the first submit and
   store it with the pending request in its Zustand/request store, so a retry reuses the same id
   (unique index dedupes → no double bookings). See `st-kizito-data-and-state`.
2. **Submit as anon** — RLS allows `INSERT WITH CHECK (true)` on `bookings`, `donations`,
   `sacrament_requests`. No login.
3. **Poll status offline-safely** via `public_fetch_request_statuses(text[])` (bookings/donations) — a
   `SECURITY DEFINER` RPC granted to anon that returns status by `client_request_id`. Sacrament requests
   allow anon `SELECT` of status directly (RLS). Never fetch other users' rows.
4. **Payment flow:** bookings/donations/sacraments with a fee show parish bank details
   (`parish_payment_details` / per-type payment fields), collect a `payment_name`/`payment_reference`,
   and set status `pending` for admin verification. There is **no in-app payment processor** — it's
   manual bank transfer + admin approval. Never add card/bank credential entry in-app (prohibited).
5. **Admin review:** approve / reject / needs_info, optionally `admin_note`, then notify the parishioner
   (Expo push via the notification service). Status change propagates to the mobile status tracker.

## Booking/donation specifics

- `bookings`: `type` (`mass_intention|thanksgiving`), `intention`, `start_date`/`end_date`,
  `mass_time_id`, status `pending|approved|rejected`. Stores: `useBookingStore`, `useBooking`.
- `donations`: `amount`, `is_anonymous`, `donor_name`, `purpose`, `message`, payment ref, status.
  The donation screen must not dead-end offline (audit §4.1) — see `st-kizito-data-and-state`.

## Engineering rules

1. Add sacraments via config rows, never per-type code or schema changes.
2. The mobile form must render exactly the `required_fields` schema (all types); keep it in sync with the
   admin config editor.
3. Always generate + reuse `client_request_id`; treat submits as idempotent.
4. Anon may insert + read own status (via RPC/allowed SELECT) only.
5. No in-app payment credential capture — manual transfer + admin verification only.
6. Status changes should notify the parishioner.

## References

- `apps/web/db/create_sacrament_requests.sql`, `infra/supabase/schema.sql`
- `src/services/requests/{requestStore,sacramentRequestStore}.ts`, `src/hooks/useSacramentTypes.ts`,
  `useBooking.ts`; `src/types/sacrament.types.ts`, `booking.types.ts`
- `app/sacraments/*`, `app/booking/*`, `app/donation/*`, `app/requests/index.tsx`
- `apps/web/app/admin/{sacrament-config,sacrament-requests,mass-bookings,donations}`
- Related: `st-kizito-data-and-state`, `st-kizito-web-admin`
