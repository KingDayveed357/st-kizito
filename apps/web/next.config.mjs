/** @type {import('next').NextConfig} */
const nextConfig = {
  // `typescript.ignoreBuildErrors` was removed: type errors now FAIL the build. They were previously
  // ignored, which silently shipped bugs (e.g. the async-cookies regression in supabase-server.ts).
  // `tsc --noEmit` is clean — keep it that way. Lint runs in CI (advisory); Next 16 no longer accepts
  // an `eslint` key here, so it is not configured in this file.
  //
  // `turbopack.root` was REMOVED deliberately. Pointing it at the monorepo root broke nested App Router
  // route resolution in `next dev`: `/admin` and `/` resolved, but every nested `/admin/*` page fell
  // through to the built-in not-found (the reported "every admin page 404s except Overview").
  // Verified by A/B test — with the key present `/admin/login` returned 404; with it removed it
  // returns 200. Production (`next start`) was never affected.
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },
}

export default nextConfig
