"use client"

import * as React from 'react'
import { createClient } from '@/lib/supabase'
import { DashboardMetrics, fetchDashboardActivity, fetchDashboardMetrics, ActivityItem } from '@/lib/admin-dashboard'

const EMPTY_METRICS: DashboardMetrics = {
  totalAnnouncements: 0,
  upcomingEvents: 0,
  pendingBookings: 0,
  approvedBookings: 0,
  totalDonations: 0,
  pendingDonations: 0,
}

export function useDashboardMetrics() {
  const [data, setData] = React.useState<DashboardMetrics>(EMPTY_METRICS)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    setError(null)
    try {
      const supabase = createClient()
      const next = await fetchDashboardMetrics(supabase)
      setData(next)
    } catch {
      setError('Unable to load dashboard metrics.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  return { data, isLoading, error, refresh }
}

export function useDashboardActivity(pageSize = 12) {
  const [items, setItems] = React.useState<ActivityItem[]>([])
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadPage = React.useCallback(async (nextPage: number, append: boolean) => {
    const supabase = createClient()
    const payload = await fetchDashboardActivity(supabase, nextPage, pageSize)

    setItems((current) => (append ? [...current, ...payload.items] : payload.items))
    setHasMore(payload.hasMore)
    setPage(nextPage)
  }, [pageSize])

  const refresh = React.useCallback(async () => {
    setError(null)
    setIsLoading(true)
    try {
      await loadPage(1, false)
    } catch {
      setError('Unable to load recent activity right now.')
    } finally {
      setIsLoading(false)
    }
  }, [loadPage])

  const loadMore = React.useCallback(async () => {
    if (!hasMore || isLoadingMore) return

    setIsLoadingMore(true)
    try {
      await loadPage(page + 1, true)
    } catch {
      setError('Unable to load more activity.')
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, loadPage, page])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  return {
    items,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    refresh,
    loadMore,
  }
}
