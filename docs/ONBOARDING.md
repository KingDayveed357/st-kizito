# Onboarding — St. Kizito

Get productive in this parish monorepo in an hour. Read in order.

## 1. What this is (10 min)

A Catholic parish platform: an **offline-first Expo/React Native** app for parishioners + a **Next.js**
admin portal, backed by **Supabase**. Start with `README.md`, then `CLAUDE.md` (the ground-truth context —
note: backend is **Supabase, not Laravel**; there is **no Turborepo, no `packages/`**).

## 2. The architecture (15 min)

Read skill **`st-kizito-architecture`** — it's the map: where every kind of code lives, dependency rules,
naming, and how mobile/web/Supabase communicate (anon parishioners, authenticated admins, `client_request_id`
idempotency, status RPC). Skim `infra/supabase/schema.sql` — the DB is the contract.

## 3. The domain (15 min) — this is what makes the app different

Read skill **`st-kizito-liturgical-domain`**. You cannot build correctly here without understanding Daily
Readings, the Divine Office, the liturgical calendar/seasons/colors, psalm formatting, reading endings, and
the Nigerian-calendar caveats. Then skim `st-kizito-liturgical-data-pipeline` to see how the data is made.

## 4. How we work (15 min)

- `docs/ENGINEERING-STANDARDS.md` — the charter.
- `docs/CONTRIBUTING.md` — setup + workflow (**install from root**, **eas from `apps/mobile`**, branch per feature).
- Skills you'll use constantly: `st-kizito-data-and-state`, `st-kizito-mobile-conventions`,
  `st-kizito-premium-ui`, `st-kizito-design-system`, `st-kizito-bundle-budget`.
- Prior deep audit + known bugs/roadmap: `docs/ENGINEERING-AUDIT.md` (+ `ENGINEERING-AUDIT-ADDENDUM.md`).

## 5. Run it (5 min)

```bash
npm install          # ROOT only
npm run web:dev      # admin + landing
npm run mobile:start # Expo Metro
cd apps/mobile && npm test   # the liturgical logic tests
```

Local Android build is currently blocked (Gradle 9) — use EAS Build for a dev client. Web runs fine.

## 6. Make your first change

Pick a small screen fix. Follow the owning skill. Ship the four states + a11y + light/dark. Add a test if
it's liturgical/calendar logic. `/code-review` yourself. Branch → PR. Note OTA-vs-binary and any bundle delta.

## Map of skills

`st-kizito-architecture` (start here) → domain (`liturgical-domain`, `liturgical-data-pipeline`,
`sacraments-and-requests`) → mobile (`mobile-conventions`, `mobile-performance`, `bundle-budget`,
`premium-ui`, `design-system`) → data/backend (`data-and-state`, `web-admin`, `security`) → quality
(`testing`, `accessibility`, `observability`, `code-review`, `release`).
