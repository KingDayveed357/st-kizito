import { supabase } from './supabase'
import { BookingStatus } from '../../types/booking.types'

const isDonationOptionalFieldError = (error: unknown) => {
  const message = String((error as any)?.message ?? error ?? '').toLowerCase()
  return message.includes('column') && (message.includes('purpose') || message.includes('message'))
}

const isClientRequestIdColumnError = (error: unknown) => {
  const message = String((error as any)?.message ?? error ?? '').toLowerCase()
  return message.includes('column') && message.includes('client_request_id')
}

const stripOptionalDonationFields = (payload: any) => {
  const { purpose, message, ...rest } = payload ?? {}
  return rest
}

const stripClientRequestField = (payload: any) => {
  const { client_request_id, ...rest } = payload ?? {}
  return rest
}

export interface RemoteRequestStatusRow {
  client_request_id: string
  status: BookingStatus
  source: 'booking' | 'donation'
  updated_at: string | null
}

const normalizeStatus = (value: unknown): BookingStatus => {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'approved') return 'approved'
  if (normalized === 'rejected') return 'rejected'
  return 'pending'
}

const normalizeRequestId = (value: unknown) => String(value ?? '').trim().toLowerCase()

export const parishService = {
  fetchAnnouncements: async () => {
    return supabase
      .from('announcements')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
  },
  
  fetchEvents: async () => {
    return supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true })
  },

  fetchMassTimes: async () => {
    return supabase
      .from('mass_times')
      .select('*')
  },

  fetchPaymentDetails: async () => {
    return supabase
      .from('parish_payment_details')
      .select('*')
      .limit(1)
      .single()
  },

  fetchParishContacts: async () => {
    return supabase
      .from('parish_contacts')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
  },

  submitBooking: async (data: any) => {
    const firstAttempt = await supabase
      .from('bookings')
      .insert(data)

    if (!firstAttempt.error || !isClientRequestIdColumnError(firstAttempt.error)) {
      return firstAttempt
    }

    const { client_request_id, ...fallbackPayload } = data ?? {}
    return supabase
      .from('bookings')
      .insert(fallbackPayload)
  },

  submitDonation: async (data: any) => {
    const firstAttempt = await supabase
      .from('donations')
      .insert(data)

    if (!firstAttempt.error) {
      return firstAttempt
    }

    const optionalStripped = stripOptionalDonationFields(data)
    const clientRequestStripped = stripClientRequestField(data)
    const fullyStripped = stripClientRequestField(optionalStripped)

    if (isDonationOptionalFieldError(firstAttempt.error) && isClientRequestIdColumnError(firstAttempt.error)) {
      return supabase
        .from('donations')
        .insert(fullyStripped)
    }

    if (isDonationOptionalFieldError(firstAttempt.error)) {
      const secondAttempt = await supabase
        .from('donations')
        .insert(optionalStripped)

      if (!secondAttempt.error) {
        return secondAttempt
      }

      if (isClientRequestIdColumnError(secondAttempt.error)) {
        return supabase
          .from('donations')
          .insert(fullyStripped)
      }

      return secondAttempt
    }

    if (isClientRequestIdColumnError(firstAttempt.error)) {
      const secondAttempt = await supabase
        .from('donations')
        .insert(clientRequestStripped)

      if (!secondAttempt.error) {
        return secondAttempt
      }

      if (isDonationOptionalFieldError(secondAttempt.error)) {
        return supabase
          .from('donations')
          .insert(fullyStripped)
      }

      return secondAttempt
    }

    return firstAttempt
  },

  fetchRequestStatuses: async (requestIds: string[]) => {
    if (!requestIds.length) {
      return { data: [] as RemoteRequestStatusRow[], error: null as unknown }
    }

    const normalizedRequestIds = requestIds
      .map(normalizeRequestId)
      .filter((value) => value.length > 0)

    if (!normalizedRequestIds.length) {
      return { data: [] as RemoteRequestStatusRow[], error: null as unknown }
    }

    // Try RPC first
    const rpcAttempt = await supabase.rpc('public_fetch_request_statuses', {
      request_ids: normalizedRequestIds,
    })

    const rpcRows = (!rpcAttempt.error && Array.isArray(rpcAttempt.data))
      ? (rpcAttempt.data as any[]).map((row) => ({
          client_request_id: normalizeRequestId(row?.client_request_id),
          status: normalizeStatus(row?.status),
          source: row?.source === 'donation' ? 'donation' : 'booking',
          updated_at: row?.updated_at ?? null,
        })).filter((row) => row.client_request_id.length > 0)
      : []

    // Even if RPC succeeds, we check directly if anything is missing
    // This handles cases where RPC might be outdated or only looking at one table
    const [bookingsResult, donationsResult] = await Promise.all([
      supabase
        .from('bookings')
        .select('client_request_id, status, updated_at, created_at')
        .in('client_request_id', normalizedRequestIds),
      supabase
        .from('donations')
        .select('client_request_id, status, updated_at, created_at')
        .in('client_request_id', normalizedRequestIds),
    ])

    const bookingsRows = Array.isArray(bookingsResult.data)
      ? bookingsResult.data.map((row: any) => ({
          client_request_id: normalizeRequestId(row.client_request_id),
          status: normalizeStatus(row.status),
          source: 'booking' as const,
          updated_at: row.updated_at ?? row.created_at ?? null,
        })).filter((row) => row.client_request_id.length > 0)
      : []

    const donationsRows = Array.isArray(donationsResult.data)
      ? donationsResult.data.map((row: any) => ({
          client_request_id: normalizeRequestId(row.client_request_id),
          status: normalizeStatus(row.status),
          source: 'donation' as const,
          updated_at: row.updated_at ?? row.created_at ?? null,
        })).filter((row) => row.client_request_id.length > 0)
      : []

    const resultByRequestId = new Map<string, RemoteRequestStatusRow>()
    
    // Add indirect query rows first
    ;[...bookingsRows, ...donationsRows].forEach(row => {
        resultByRequestId.set(row.client_request_id, row as RemoteRequestStatusRow)
    })
    
    // Add/Overwrite with RPC rows
    rpcRows.forEach(row => {
        resultByRequestId.set(row.client_request_id, row as RemoteRequestStatusRow)
    })

    const finalRows = Array.from(resultByRequestId.values())

    return {
      data: finalRows,
      error: finalRows.length > 0 ? null : (bookingsResult.error ?? donationsResult.error ?? rpcAttempt.error),
    }
  },
}
