# Contributing — St. Kizito

## Golden rules

1. **`npm install` from the repo ROOT only.** Installing from `apps/mobile` crashes npm 11 (arborist
   null-location bug).
2. **Run eas/expo from `apps/mobile`**, never the repo root (a stray root `app.json` builds the wrong project).
3. **Branch per feature.** Never commit to `main`. Small, focused PRs.
4. **Read the owning skill before you touch a subsystem** (see `CLAUDE.md` → `st-kizito-architecture`).

## Setup

```bash
# from repo root
npm install
npm run web:dev        # Next.js admin + landing
npm run mobile:start   # Expo (Metro)
```

- Mobile local Android build currently fails (Gradle 9 / IBM_SEMERU). Use **EAS Build** for a dev client
  (`docs/ENGINEERING-AUDIT.md §1`). Web runs normally.
- Env: Supabase URL + **anon** key for both apps (never the service-role key client-side). See
  `st-kizito-security`.

## Workflow

1. Branch: `git checkout -b feat/<thing>` (or `fix/…`).
2. Build the feature following the relevant skills. Keep screens thin; logic in hooks/services; styling
   from theme tokens.
3. Ship all four screen states (loading/error/empty/content), a11y, light+dark.
4. Add/adjust tests — **any liturgical/calendar/psalm change needs a unit test**. `npm test` (from `apps/mobile`) green.
5. Self-review with `/code-review` (rubric: `st-kizito-code-review`); `/security-review` for auth/RLS/secrets.
6. If deps/data changed, run a bundle analysis (`st-kizito-bundle-budget`).
7. Open a PR describing the change, OTA-vs-binary impact, and any bundle delta.

## Conventions (short form)

- Files: `PascalCase.tsx` components · `useX.ts` hooks · `x.api.ts` services · `x.types.ts` types · `useXStore.ts` stores.
- No hardcoded colors/sizes (theme tokens); liturgical color via `getLiturgicalHex`.
- No fetch/Supabase in screens; pure logic stays in `utils/`/`domain/`.
- Liturgical data is **generated**, never hand-edited (`st-kizito-liturgical-data-pipeline`).
- No new dependency without a justification (bundle budget).

## Definition of done

Tests green · no TS errors · screen states + a11y + light/dark · offline-safe · bundle within budget ·
release impact noted · matches surrounding style. Full gate list: `docs/ENGINEERING-STANDARDS.md`.
