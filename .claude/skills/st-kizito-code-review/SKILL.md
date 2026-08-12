---
name: st-kizito-code-review
description: Project (St. Kizito). The pull-request review checklist for this repo — architecture, liturgical correctness, performance, bundle size, security, accessibility, offline behavior, maintainability, testing, and readability. Read when reviewing a PR/diff, before merging, or when asked to self-review changes. Routes each concern to its owning st-kizito-* skill.
version: 1.0.0
---

# St. Kizito Code Review

Every change is reviewed against these gates. A PR that fails a **must** gate does not merge. For your
own working diff use `/code-review`; this skill is the project-specific rubric it applies.

## Gates (must-pass in bold)

### Architecture & boundaries
- [ ] Screens stay thin; data flows screen → hook → service → data. **No fetch/Supabase in a screen.**
- [ ] Pure logic in `utils/`/`domain/` (no React/I/O); components use tokens + primitives.
- [ ] No new `packages/` shared workspace / no cross-app imports without discussion.
→ `st-kizito-architecture`

### Liturgical correctness (highest trust) — **must**
- [ ] **No liturgical text invented or pasted ad hoc**; changes go through the data pipeline.
- [ ] Endings/Glory Be appended at render layer; psalm assembly uses `selectPsalmBodyVerses` (no `slice(1)`).
- [ ] Layout driven by `type` fields, not array position; color via `getLiturgicalHex`.
- [ ] Liturgical/calendar/psalm logic change ships a **unit test**.
→ `st-kizito-liturgical-domain`, `st-kizito-liturgical-data-pipeline`, `st-kizito-testing`

### Performance
- [ ] No new re-render loops (`onLayout`/scroll → `useRef`, setState on real change only).
- [ ] Growable lists virtualized; rows memoized; animations on UI thread.
→ `st-kizito-mobile-performance`

### Bundle size — **must**
- [ ] **New dependency justified** (size impact + why existing deps won't do). No casual native modules.
- [ ] `data/*.json` not grown into the JS graph; big corpora go to sqlite/on-demand.
- [ ] Bundle analysis run if deps/data changed; APK stays < 60 MB.
→ `st-kizito-bundle-budget`

### Security — **must**
- [ ] RLS on new tables; least privilege; **no service-role key client-side**; no secrets in git.
- [ ] No PII in logs/URLs/analytics; no in-app payment credential capture.
→ `st-kizito-security`

### Premium UI & accessibility
- [ ] Loading + error + empty states present; offline-aware; no dead-ends.
- [ ] Text scales with `textScale`; labels/roles set; AA contrast; light + dark verified.
→ `st-kizito-premium-ui`, `st-kizito-accessibility`

### Offline & data — **must for parishioner flows**
- [ ] No screen dead-ends offline; cache not cleared on failed refresh.
- [ ] Submittables carry/reuse `client_request_id`; status via RPC/allowed reads.
→ `st-kizito-data-and-state`, `st-kizito-sacraments-and-requests`

### Maintainability & readability
- [ ] Matches surrounding style, naming conventions, comment density.
- [ ] No dead code (e.g. don't reintroduce the `useTextSize.ts` STUB); no duplicated liturgical rendering.
- [ ] Types updated in the right `*.types.ts`; no `any` slipping into domain logic.

### Testing
- [ ] Tests added/updated for logic; regression test cites the bug where relevant; `npm test` green.
→ `st-kizito-testing`

### Release awareness
- [ ] Native/config change flagged as needing a new binary (not OTA); `runtimeVersion` considered.
→ `st-kizito-release`

## How to review

1. Read the diff against these gates; open the touched files' owning skill when unsure.
2. Prioritize correctness (liturgy), then security/offline, then perf/bundle, then polish.
3. Concrete findings only — cite `file:line` and the failing invariant, not vibes.
4. Verify claims (run `npm test`, check bundle if deps changed) rather than trusting the description.

## References

All `st-kizito-*` skills above; `docs/ENGINEERING-STANDARDS.md`, `docs/RELEASE-CHECKLIST.md`.
Built-in: `/code-review`, `/security-review`.
