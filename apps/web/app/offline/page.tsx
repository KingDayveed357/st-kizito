import Link from 'next/link'

export const metadata = {
  title: 'Offline · St. Kizito Admin',
}

/**
 * Offline fallback, cached by the service worker and shown when a navigation fails with no network.
 * Static (no data) so it always renders.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M12 12h.01M8.111 15.889a5.5 5.5 0 017.778 0"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">You&apos;re offline</h1>
        <p className="mt-3 text-sm text-foreground/60">
          The admin portal needs a connection to load live parish data. Reconnect and try again — your
          place is saved.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90"
        >
          Retry
        </Link>
      </div>
    </main>
  )
}
