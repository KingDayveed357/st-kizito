"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { AdminPage } from "@/components/layout/admin-page"
import { Button } from "@/components/ui/button-custom"
import { Card, CardContent } from "@/components/ui/card-custom"

/**
 * Error boundary for the authenticated admin dashboard.
 *
 * Lives INSIDE the `(dashboard)` route group, so a failed page keeps the sidebar and top bar — the
 * administrator can navigate away instead of being stranded on a blank screen.
 *
 * Raw Supabase/Postgres messages are never rendered: they leak schema details and mean nothing to a
 * parish administrator. The digest is shown instead so a specific report can still be traced.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // No error monitoring is wired yet (see docs/ENGINEERING-AUDIT.md). This is the single place to
    // add Sentry.captureException(error) when it is.
    console.error("[admin] route error:", error)
  }, [error])

  return (
    <AdminPage title="Something went wrong" subtitle="This page could not be loaded">
      <div className="max-w-2xl">
        <Card className="border-error/30">
          <CardContent className="flex flex-col items-start gap-4 py-10">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-error/10 text-error">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-xl font-semibold text-foreground">
                We couldn&apos;t load this page
              </h2>
              <p className="text-sm text-foreground/70">
                The parish database didn&apos;t respond as expected. Your data has not been changed. Try
                again — if it keeps happening, check your connection and then contact whoever maintains
                the parish system.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button onClick={reset}>Try again</Button>
              <Button variant="outline" asChild>
                <a href="/admin">Back to dashboard</a>
              </Button>
            </div>

            {error.digest ? (
              <p className="pt-2 text-xs text-foreground/50">
                Reference code: <span className="font-mono">{error.digest}</span>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  )
}
