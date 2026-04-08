import { Clock3, Megaphone, CalendarDays, FileText, HandCoins, AlertCircle, RefreshCcw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card-custom"
import { Badge } from "@/components/ui/badge-custom"
import { Button } from "@/components/ui/button-custom"
import { Skeleton } from "@/components/ui/skeleton"
import type { ActivityItem } from "@/lib/admin-dashboard"

interface RecentActivityProps {
  items: ActivityItem[]
  isLoading: boolean
  isLoadingMore?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onRefresh?: () => void
  error?: string | null
}

const typeMeta = {
  announcement: { icon: Megaphone, label: 'Announcement' },
  event: { icon: CalendarDays, label: 'Event' },
  booking: { icon: FileText, label: 'Booking' },
  donation: { icon: HandCoins, label: 'Donation' },
} as const

const statusTone = (status?: string) => {
  const normalized = (status ?? '').toLowerCase()
  if (normalized === 'approved') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (normalized === 'rejected') return 'bg-rose-100 text-rose-700 border-rose-200'
  if (normalized === 'pending') return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-surface-container-low text-foreground/70 border-outline/20'
}

const formatRelativeTime = (isoString: string) => {
  const now = Date.now()
  const at = new Date(isoString).getTime()
  const diffMin = Math.max(1, Math.floor((now - at) / 60000))

  if (diffMin < 60) return `${diffMin}m ago`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`
  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay}d ago`
}

export function RecentActivity({
  items,
  isLoading,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  onRefresh,
  error,
}: RecentActivityProps) {
  return (
    <Card className="border-outline/20 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Live updates from announcements, events, bookings and donations</CardDescription>
        </div>
        {onRefresh ? (
          <Button variant="ghost" size="icon-sm" onClick={onRefresh} aria-label="Refresh activity">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {isLoading ? <RecentActivitySkeleton /> : null}

        {!isLoading && error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
            <p className="mt-1 text-amber-700/85">Please try again in a moment.</p>
          </div>
        ) : null}

        {!isLoading && !error && items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline/30 p-8 text-center">
            <Clock3 className="mx-auto h-5 w-5 text-foreground/45" />
            <p className="mt-3 text-sm font-medium text-foreground">No activity yet</p>
            <p className="mt-1 text-sm text-foreground/60">Actions will appear here as your team publishes content and reviews requests.</p>
          </div>
        ) : null}

        {!isLoading && !error && items.length > 0 ? (
          <div className="space-y-1">
            {items.map((item) => {
              const meta = typeMeta[item.type]
              const Icon = meta.icon

              return (
                <article
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-surface-container-low"
                >
                  <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface-container-low text-foreground/70">
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{item.action}</p>
                      <Badge className="h-6 border-outline/30 bg-surface-container-low px-2 text-[10px] uppercase tracking-[0.08em] text-foreground/70">
                        {meta.label}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-foreground/70">{item.subject}</p>
                    <p className="mt-1 text-xs text-foreground/55">By {item.actor}</p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-foreground/55">{formatRelativeTime(item.timestamp)}</p>
                    {item.status ? (
                      <span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[10px] font-medium capitalize ${statusTone(item.status)}`}>
                        {item.status}
                      </span>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}

        {!isLoading && !error && hasMore && onLoadMore ? (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={onLoadMore} isLoading={isLoadingMore}>
              Load more activity
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function RecentActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="flex items-start gap-3 rounded-xl px-3 py-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-2 h-3 w-56" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
          <div className="w-20 text-right">
            <Skeleton className="ml-auto h-3 w-14" />
            <Skeleton className="ml-auto mt-2 h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
