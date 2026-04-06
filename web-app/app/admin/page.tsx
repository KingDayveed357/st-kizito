"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { SummaryCard } from "@/components/dashboard/summary-card"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { Button } from "@/components/ui/button-custom"
import { createClient } from "@/lib/supabase"

export default function DashboardPage() {
  const [totalAnnouncements, setTotalAnnouncements] = useState(0)
  const [upcomingEvents, setUpcomingEvents] = useState(0)
  const [pendingBookings, setPendingBookings] = useState(0)
  const [approvedBookings, setApprovedBookings] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      // Get announcements count
      const { count: announcementsCount } = await supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true })
      if (announcementsCount !== null) setTotalAnnouncements(announcementsCount)

      // Get upcoming events count (events with date >= today)
      const today = new Date().toISOString()
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('start_date', today)
      if (eventsCount !== null) setUpcomingEvents(eventsCount)

      // Get pending bookings count
      const { count: pendingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      if (pendingCount !== null) setPendingBookings(pendingCount)

      // Get approved bookings count
      const { count: approvedCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
      if (approvedCount !== null) setApprovedBookings(approvedCount)
    }

    fetchStats()
  }, [])

  const navbarActions = (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      </Button>
      <Button variant="ghost" size="sm">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </Button>
    </div>
  )

  return (
    <AdminLayout title="Dashboard" subtitle="Welcome back, Fr. Joseph" navbarActions={navbarActions}>
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <SummaryCard
          title="Total Announcements"
          value={totalAnnouncements}
          description="Active announcements"
          icon="📢"
          trend={{ value: 12, direction: "up" }}
        />
        <SummaryCard
          title="Upcoming Events"
          value={upcomingEvents}
          description="Events in next 30 days"
          icon="📅"
          trend={{ value: 8, direction: "up" }}
        />
        <SummaryCard
          title="Mass Bookings"
          value={pendingBookings}
          description="Pending approval"
          icon="✝️"
          trend={{ value: 5, direction: "up" }}
        />
        <SummaryCard
          title="Approved Intentions"
          value={approvedBookings}
          description="This month"
          icon="✨"
          trend={{ value: 23, direction: "up" }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity - spans 2 columns on large screens */}
        <div className="lg:col-span-2 min-w-0">
          <RecentActivity />
        </div>

        {/* Quick Actions */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 p-6 shadow-xs">
          <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {}}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Announcement
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {}}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Schedule Event
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {}}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Review Bookings
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {}}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Update Mass Times
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
