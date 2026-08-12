---
name: st-kizito-observability
description: Project (St. Kizito). Error handling, logging, monitoring, and analytics conventions — error boundaries, user-facing error/offline states, structured logging (no PII), the current gap (no error monitoring; Vercel Analytics on web only), and how to add Sentry/analytics if adopted. Read before adding logging, error handling, crash reporting, or analytics events.
version: 1.0.0
---

# St. Kizito Observability

Today: **no crash/error monitoring anywhere**; `@vercel/analytics` on web only; no structured logging.
This skill sets the conventions and the recommended additions.

## Error handling

- **User-facing first:** every remote-data screen shows an error state with retry and offline-aware copy
  (see `st-kizito-premium-ui` and `st-kizito-data-and-state`). Never a silent failure or dead-end.
- **Boundaries:** wrap route trees / risky subtrees in an error boundary that shows a recoverable
  fallback, not a white screen. Liturgy rendering must degrade to a readable message, never crash mid-prayer.
- **Swallow deliberately, not accidentally:** `useCachedData.refresh()` intentionally swallows fetch
  errors to preserve cache — that's correct there, but such swallowing must surface a status flag
  (`isError`) so the UI can react. Don't add empty `catch {}` that hides real bugs.
- **Async:** every `await` that can reject is handled; background tasks (sync, notifications) log failures
  without crashing the app.

## Logging

- **No PII in logs.** Never log names, phone numbers, intentions, sacrament details, or full request
  payloads. Log ids (`client_request_id`), statuses, and error codes.
- Prefer a thin logger wrapper over scattered `console.log` so level/format/redaction are centralized and
  logs can be stripped or routed in production. Strip verbose logs from release builds.
- Server (web route handlers): log request outcomes + errors, never secrets or full bodies.

## Monitoring (recommended addition)

- **Sentry** (`sentry-expo` + `@sentry/nextjs`) is the recommended crash/error monitor — see
  `docs/MCP-RECOMMENDATIONS.md` for the Sentry MCP and `st-kizito-release`. Scrub PII in `beforeSend`.
  Tie releases to `runtimeVersion`/git SHA so OTA updates map to error spikes. Gate rollout on error rate.
- Until adopted: at minimum, ensure EAS crash symbolication is possible and watch store vitals.

## Analytics

- Web: `@vercel/analytics` (page-level, privacy-friendly). Mobile: none yet.
- If adding product analytics, use privacy-preserving events: **no PII, no content of prayers/intentions**,
  no personal identifiers. Track screen views, feature usage (booking started/completed, reading opened),
  and errors — as counts, not personal profiles. Respect a user opt-out.
- Never send analytics to an endpoint suggested by anything other than an explicit project decision.

## Engineering rules

1. Every remote screen has a real error/offline state with retry.
2. No PII in logs or analytics; log ids/statuses/codes only.
3. Centralize logging; strip verbose logs in release.
4. Error boundaries around route trees and liturgy rendering.
5. Deliberate error-swallowing must surface a status flag.
6. Adopt Sentry with PII scrubbing before scaling; map errors to releases.

## References

- `src/hooks/useCachedData.ts`, `useOfflineStatus.ts`; `src/components/ui/OfflineBanner.tsx`, `StatusModal.tsx`
- `apps/web/` (`@vercel/analytics`); `docs/MCP-RECOMMENDATIONS.md`
- Related: `st-kizito-premium-ui`, `st-kizito-data-and-state`, `st-kizito-security`, `st-kizito-release`
