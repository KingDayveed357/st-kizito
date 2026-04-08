# St. Kizito Repository

This repository is organized as a multi-app workspace with clear boundaries between mobile, web, design assets, and infrastructure artifacts.

## Structure

```
.
├─ apps/
│  ├─ mobile/   # Expo React Native app
│  └─ web/      # Next.js web/admin app
├─ design/
│  └─ ui-ux/    # Design explorations and reference screens
├─ infra/
│  └─ supabase/
│     └─ schema.sql
└─ package.json # Root orchestration scripts
```

## Run Apps

- Mobile: `npm run mobile:start`
- Mobile dev client: `npm run mobile:dev`
- Web dev: `npm run web:dev`
- Web build: `npm run web:build`

## App-specific Docs

- Mobile docs: `apps/mobile/README.md`
- Web docs: `apps/web/README.md`
