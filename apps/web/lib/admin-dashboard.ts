import type { SupabaseClient } from '@supabase/supabase-js'

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

  const [announcements, upcomingEvents, pendingBookings, approvedBookings, donations] = await Promise.all([
    supabase.from('announcements').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }).gte('start_date', today),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('donations').select('amount,status'),
  ])

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

  const [announcements, events, bookings, donations] = await Promise.all([
    supabase
      .from('announcements')
      .select('id,title,created_at,author')
      .order('created_at', { ascending: false })
      .limit(baseLimit),
    supabase
      .from('events')
      .select('id,title,created_at,start_date')
      .order('created_at', { ascending: false })
      .limit(baseLimit),
    supabase
      .from('bookings')
      .select('id,name,type,status,intention,created_at')
      .order('created_at', { ascending: false })
      .limit(baseLimit),
    supabase
      .from('donations')
      .select('id,donor_name,amount,status,created_at')
      .order('created_at', { ascending: false })
      .limit(baseLimit),
  ])

  const activity: ActivityItem[] = [
    ...((announcements.data ?? []) as Array<{ id: string; title: string | null; created_at: string | null; author?: string | null }>).map((item) => ({
      id: `ann-${item.id}`,
      type: 'announcement' as const,
      action: 'Published announcement',
      subject: item.title ?? 'Untitled announcement',
      actor: item.author ?? 'Parish Office',
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
