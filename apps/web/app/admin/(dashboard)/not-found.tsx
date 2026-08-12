import Link from "next/link"
import { FileQuestion } from "lucide-react"
import { AdminPage } from "@/components/layout/admin-page"
import { Button } from "@/components/ui/button-custom"
import { Card, CardContent } from "@/components/ui/card-custom"

/**
 * Rendered when an admin page calls `notFound()` — e.g. a booking or event id that no longer exists.
 *
 * A genuinely unmatched URL (`/admin/typo`) does not reach here: App Router falls through to the root
 * `app/not-found.tsx`, because no segment matched to own the error. That file is branded for both
 * audiences for exactly this reason.
 */
export default function AdminNotFound() {
  return (
    <AdminPage title="Not found" subtitle="This record no longer exists">
      <div className="max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-start gap-4 py-10">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-low text-foreground/60">
              <FileQuestion className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-xl font-semibold text-foreground">
                We couldn&apos;t find that record
              </h2>
              <p className="text-sm text-foreground/70">
                It may have been deleted, or the link you followed is out of date.
              </p>
            </div>

            <Button asChild className="mt-1">
              <Link href="/admin">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  )
}
