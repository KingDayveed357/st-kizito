"use client"

import { Activity, CalendarClock, CheckCircle2, HandCoins, Hourglass, Megaphone } from "lucide-react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { SummaryCard, SummaryCardSkeleton } from "@/components/dashboard/summary-card"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { Button } from "@/components/ui/button-custom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card-custom"
import { useDashboardActivity, useDashboardMetrics } from "@/hooks/use-admin-dashboard"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function DashboardPage() {
  const metrics = useDashboardMetrics()
  const activity = useDashboardActivity(10)

  const navbarActions = (
    <Button variant="outline" size="sm" onClick={() => {
      metrics.refresh()
      activity.refresh()
    }}>
      Refresh Data
    </Button>
  )

  const metricCards = [
    {
      title: 'Announcements',
      value: metrics.data.totalAnnouncements,
      description: 'Published updates',
      icon: <Megaphone className="h-5 w-5" />,
      deltaLabel: 'Content heartbeat of the parish',
    },
    {
      title: 'Upcoming Events',
      value: metrics.data.upcomingEvents,
      description: 'Scheduled ahead',
      icon: <CalendarClock className="h-5 w-5" />,
      deltaLabel: 'Events with future start dates',
    },
    {
      title: 'Pending Bookings',
      value: metrics.data.pendingBookings,
      description: 'Awaiting review',
      icon: <Hourglass className="h-5 w-5" />,
      deltaLabel: 'Requires parish office action',
    },
    {
      title: 'Approved Bookings',
      value: metrics.data.approvedBookings,
      description: 'Pastoral confirmations',
      icon: <CheckCircle2 className="h-5 w-5" />,
      deltaLabel: 'Successfully approved requests',
    },
    {
      title: 'Total Donations',
      value: formatCurrency(metrics.data.totalDonations),
      description: 'Giving captured in system',
      icon: <HandCoins className="h-5 w-5" />,
      deltaLabel: `${metrics.data.pendingDonations} still pending verification`,
    },
    {
      title: 'Activity Throughput',
      value: activity.items.length,
      description: 'Recent timeline records',
      icon: <Activity className="h-5 w-5" />,
      deltaLabel: activity.hasMore ? 'More activity available' : 'Timeline up to date',
    },
  ]

  return (
    <AdminLayout title="Dashboard" subtitle="Operational overview and live parish activity" navbarActions={navbarActions}>
      <section className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.isLoading
            ? Array.from({ length: 6 }).map((_, idx) => <SummaryCardSkeleton key={idx} />)
            : metricCards.map((card) => (
                <SummaryCard
                  key={card.title}
                  title={card.title}
                  value={card.value}
                  description={card.description}
                  icon={card.icon}
                  deltaLabel={card.deltaLabel}
                />
              ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr,1fr]">
          <RecentActivity
            items={activity.items}
            isLoading={activity.isLoading}
            error={activity.error}
            hasMore={activity.hasMore}
            isLoadingMore={activity.isLoadingMore}
            onLoadMore={activity.loadMore}
            onRefresh={activity.refresh}
          />

          <Card className="border-outline/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Operational Pulse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-xl border border-outline/20 bg-surface-container-low p-4">
                <p className="text-foreground/65">Booking queue pressure</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{metrics.data.pendingBookings}</p>
                <p className="mt-1 text-xs text-foreground/55">Prioritize follow-up for pending intentions and payment checks.</p>
              </div>

              <div className="rounded-xl border border-outline/20 bg-surface-container-low p-4">
                <p className="text-foreground/65">Donation verification backlog</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{metrics.data.pendingDonations}</p>
                <p className="mt-1 text-xs text-foreground/55">Review pending records to keep donor trust and transparency high.</p>
              </div>

              <div className="rounded-xl border border-outline/20 bg-surface-container-low p-4">
                <p className="text-foreground/65">Upcoming liturgical workload</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{metrics.data.upcomingEvents}</p>
                <p className="mt-1 text-xs text-foreground/55">Event planning and announcements should stay synchronized.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </AdminLayout>
  )
}
