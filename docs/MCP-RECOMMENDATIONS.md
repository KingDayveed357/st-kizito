# MCP Server Recommendations — St. Kizito

_Phase 6 deliverable. Recommends only MCP servers that bring real value to THIS repo, and explicitly
rejects the ones that don't. Verify current package names/commands before installing._

## TL;DR

| MCP | Verdict | Scope |
|---|---|---|
| **Supabase** | ✅ Adopt (highest value) | Project-local |
| **Sentry** | ✅ Adopt *if/when* Sentry is added | Project-local |
| GitHub | ➖ Optional | Global |
| Android Emulator | ➖ Optional (low priority) | Project-local |
| Filesystem | ❌ Reject — built-in tools cover it | — |
| Browser automation | ❌ Reject — built-in browser already present | — |
| Raw Postgres/MySQL | ❌ Reject — use Supabase MCP instead | — |
| On-device SQLite | ❌ Reject — not a dev-accessible DB | — |

---

## ✅ Supabase MCP — adopt (highest value)

**Why:** Supabase is the entire backend (schema, RLS, RPC, data). An MCP lets Claude inspect the live
schema, run read-only queries, check RLS policies, and assist with migrations directly — instead of
guessing from `schema.sql`. This is the single biggest correctness multiplier here.

**Benefits:** live schema/type truth; verify RLS behaves as intended; draft/validate idempotent
migrations against the real DB; debug data issues (booking/donation/request status) without a detour
through the dashboard.

**Trade-offs:** grants DB access to the agent — scope it to a **read-only** or limited role, never the
service-role key in a shared context; a misconfigured token is a real risk. Keep it project-local and
prefer read-only for day-to-day; require explicit approval for writes/migrations.

**Install (verify current name):** the official Supabase MCP server, e.g.
```bash
claude mcp add supabase --scope project -- npx -y @supabase/mcp-server-supabase@latest --read-only
```
**Config:** project `.mcp.json`; provide `SUPABASE_ACCESS_TOKEN`/project ref via env (never commit).
Start **read-only**; elevate deliberately. **Scope: project-local.**

---

## ✅ Sentry MCP — adopt if Sentry is adopted

**Why:** there is no error monitoring today (`st-kizito-observability`). If/when Sentry is added, its MCP
lets Claude pull real crash/issue data to triage and map errors to a `runtimeVersion`/release.

**Benefits:** triage top crashes, correlate an OTA update with an error spike, close the loop from
release → monitoring.

**Trade-offs:** only useful once Sentry is instrumented; ensure PII scrubbing in `beforeSend` first so
the agent never sees personal data.

**Install:** the official Sentry MCP (hosted or local) with a project-scoped auth token. **Project-local.**

---

## ➖ GitHub MCP — optional

**Why:** PR/issue/review automation. **But** the `gh` CLI is already available in this environment and
covers most needs, so the MCP is a convenience, not a necessity.

**Trade-offs:** another token to manage; overlaps with `gh`. Adopt only if you want richer PR-review
workflows than `gh` gives. **Global** (spans repos) if adopted.

## ➖ Android Emulator MCP — optional, low priority

**Why:** driving/screenshotting an emulator could help UI verification. **But** local Android builds
currently fail (Gradle 9), and the installed `eas-simulator` skill + EAS dev client already provide a
remote device path. Revisit once a green dev build exists. **Project-local** if adopted.

---

## ❌ Rejected (with reasons)

- **Filesystem MCP** — the built-in Read/Write/Edit/Glob/Grep tools already provide scoped filesystem
  access. Adds nothing.
- **Browser automation MCP** — a built-in browser (`mcp__Claude_Browser__*`) and Claude-in-Chrome are
  already available. Redundant.
- **Raw Postgres/MySQL MCP** — the DB *is* Supabase Postgres; the Supabase MCP understands RLS/RPC/auth
  and is strictly better than a raw SQL connection. Don't add a second, dumber path to the same DB.
- **On-device SQLite MCP** — `expo-sqlite` is a per-device cache seeded at runtime, not a server DB an MCP
  can usefully reach. Test it on-device instead.

## Principle

Add an MCP only when it gives the agent a capability the built-in tools/CLIs/skills don't. Every MCP is a
new credential and attack surface — fewer, well-scoped servers beat a long list. Start read-only; elevate
deliberately.
