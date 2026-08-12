import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * A slow, paused (free-tier auto-pause), or misconfigured Supabase must never freeze the admin UI on
 * skeletons forever (DASH-1). Every dashboard read is bounded by this timeout via an AbortController,
 * so the loading state always resolves to either data or an error+retry.
 */
const DASHBOARD_TIMEOUT_MS = 10_000

/**
 * Runs `run(signal)` with an AbortSignal that fires after `ms`, then cancels the timer. The Supabase
 * queries are wired to this signal (`.abortSignal(...)`) so a hung request rejects instead of pending
 * forever, and the caller's loading state always resolves.
 */
async function withAbortTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  ms = DASHBOARD_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await run(controller.signal)
  } finally {
    clearTimeout(timer)
  }
}

export interface DashboardMetrics {
  totalAnnouncements: number
  upcomingEvents: number
  pendingBookings: number
  approvedBookings: number
  totalDonations: number
  pendingDonations: number
}

export type ActivityType = 'announcement' | 'event' | 'booking' | 'donation'

export interface ActivityItem {
  id: string
  type: ActivityType
  action: string
  subject: string
  actor: string
  status?: string
  timestamp: string
}

const toIsoDate = (value: unknown) => {
  const date = value ? new Date(String(value)) : new Date()
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString()
  }
  return date.toISOString()
}

export async function fetchDashboardMetrics(supabase: SupabaseClient): Promise<DashboardMetrics> {
  const today = new Date().toISOString()

  const [announcements, upcomingEvents, pendingBookings, approvedBookings, donations] = await withAbortTimeout(
    (signal) =>
      Promise.all([
        supabase.from('announcements').select('*', { count: 'exact', head: true }).abortSignal(signal),
        supabase.from('events').select('*', { count: 'exact', head: true }).gte('start_date', today).abortSignal(signal),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending').abortSignal(signal),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'approved').abortSignal(signal),
        supabase.from('donations').select('amount,status').abortSignal(signal),
      ]),
  )

  // Surface a real failure instead of silently reporting zeros (DASH-2). These tables share one auth
  // context, so an error on any of them signals a connectivity/auth/config problem worth showing.
  const firstError = [announcements, upcomingEvents, pendingBookings, approvedBookings, donations].find((r) => r.error)?.error
  if (firstError) throw new Error(firstError.message || 'Failed to load dashboard metrics.')

  const donationRows = (donations.data ?? []) as Array<{ amount: number | null; status: string | null }>
  const totalDonations = donationRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const pendingDonations = donationRows.filter((row) => (row.status ?? '').toLowerCase() === 'pending').length

  return {
    totalAnnouncements: announcements.count ?? 0,
    upcomingEvents: upcomingEvents.count ?? 0,
    pendingBookings: pendingBookings.count ?? 0,
    approvedBookings: approvedBookings.count ?? 0,
    totalDonations,
    pendingDonations,
  }
}

export async function fetchDashboardActivity(
  supabase: SupabaseClient,
  page = 1,
  pageSize = 12
): Promise<{ items: ActivityItem[]; hasMore: boolean }> {
  const baseLimit = Math.max(pageSize * 2, 20)

  const [announcements, events, bookings, donations] = await withAbortTimeout((signal) =>
    Promise.all([
      supabase
        .from('announcements')
        // NB: `announcements` has no `author` column — selecting it errored and silently dropped all
        // announcements from the feed (DASH-2). The actor is the parish office by definition.
        .select('id,title,created_at')
        .order('created_at', { ascending: false })
        .limit(baseLimit)
        .abortSignal(signal),
      supabase
        .from('events')
        .select('id,title,created_at,start_date')
        .order('created_at', { ascending: false })
        .limit(baseLimit)
        .abortSignal(signal),
      supabase
        .from('bookings')
        .select('id,name,type,status,intention,created_at')
        .order('created_at', { ascending: false })
        .limit(baseLimit)
        .abortSignal(signal),
      supabase
        .from('donations')
        .select('id,donor_name,amount,status,created_at')
        .order('created_at', { ascending: false })
        .limit(baseLimit)
        .abortSignal(signal),
    ]),
  )

  const firstError = [announcements, events, bookings, donations].find((r) => r.error)?.error
  if (firstError) throw new Error(firstError.message || 'Failed to load recent activity.')

  const activity: ActivityItem[] = [
    ...((announcements.data ?? []) as Array<{ id: string; title: string | null; created_at: string | null }>).map((item) => ({
      id: `ann-${item.id}`,
      type: 'announcement' as const,
      action: 'Published announcement',
      subject: item.title ?? 'Untitled announcement',
      actor: 'Parish Office',
      timestamp: toIsoDate(item.created_at),
    })),
    ...((events.data ?? []) as Array<{ id: string; title: string | null; created_at: string | null; start_date: string | null }>).map((item) => ({
      id: `evt-${item.id}`,
      type: 'event' as const,
      action: 'Scheduled event',
      subject: item.title ?? 'Untitled event',
      actor: 'Parish Office',
      timestamp: toIsoDate(item.created_at ?? item.start_date),
    })),
    ...((bookings.data ?? []) as Array<{ id: string; name: string | null; type: string | null; status: string | null; intention: string | null; created_at: string | null }>).map((item) => ({
      id: `book-${item.id}`,
      type: 'booking' as const,
      action: 'Mass booking updated',
      subject: item.intention ?? item.type ?? 'Mass intention',
      actor: item.name ?? 'Parishioner',
      status: item.status ?? 'pending',
      timestamp: toIsoDate(item.created_at),
    })),
    ...((donations.data ?? []) as Array<{ id: string; donor_name: string | null; amount: number | null; status: string | null; created_at: string | null }>).map((item) => ({
      id: `don-${item.id}`,
      type: 'donation' as const,
      action: 'Donation received',
      subject: `NGN ${Number(item.amount ?? 0).toLocaleString()}`,
      actor: item.donor_name ?? 'Anonymous donor',
      status: item.status ?? 'pending',
      timestamp: toIsoDate(item.created_at),
    })),
  ]

  activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const start = (page - 1) * pageSize
  const pageItems = activity.slice(start, start + pageSize)

  return {
    items: pageItems,
    hasMore: activity.length > start + pageSize,
  }
}
