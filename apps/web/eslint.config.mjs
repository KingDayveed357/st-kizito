import next from 'eslint-config-next'

/**
 * ESLint (flat config) for the Next.js admin. eslint-config-next 16 ships a NATIVE flat config array
 * (core-web-vitals + typescript rules), so it's spread directly — FlatCompat is unnecessary and, on
 * this version combo, throws a circular-config error.
 *
 * Lint runs in CI as ADVISORY (non-blocking) and is NOT run during `next build` (see next.config.mjs),
 * so pre-existing lint debt can't block a deploy while it's paid down. Promote to a blocking gate once
 * `npm run lint` is clean.
 */
const eslintConfig = [
  ...next,
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
]

export default eslintConfig
