import Link from "next/link"

/**
 * Root 404. Catches any URL that matched no route — including mistyped admin URLs such as
 * `/admin/donatons`, which previously fell through to Next's unbranded default page with no way back.
 *
 * It serves two audiences (parishioner and administrator), so it offers both destinations rather than
 * guessing from the path — `not-found.tsx` is statically rendered and cannot read the pathname.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="text-4xl mb-5" aria-hidden="true">
          ✝
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-tertiary mb-3">
          Page not found
        </p>

        <h1 className="font-serif text-3xl font-semibold tracking-tight mb-3">
          We couldn&apos;t find that page
        </h1>

        <p className="text-foreground/70 mb-9">
          The address may be mistyped, or the page may have moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Go to the parish site
          </Link>
          <Link
            href="/admin"
            className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-outline/40 text-foreground font-semibold text-sm hover:bg-surface-container-low transition-colors"
          >
            Go to the admin console
          </Link>
        </div>
      </div>
    </main>
  )
}
