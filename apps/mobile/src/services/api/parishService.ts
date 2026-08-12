import { supabase } from './supabase'
import { BookingInsert, BookingRow, ParishPaymentDetailsRow } from '../../types/api.types'
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

  submitBooking: async (data: BookingInsert) => {
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

  fetchSacramentTypes: async () => {
    return supabase
      .from('sacrament_request_types')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
  },

  submitSacramentRequest: async (data: any) => {
    const firstAttempt = await supabase
      .from('sacrament_requests')
      .insert(data)

    if (!firstAttempt.error || !isClientRequestIdColumnError(firstAttempt.error)) {
      return firstAttempt
    }

    const { client_request_id, ...fallbackPayload } = data ?? {}
    return supabase
      .from('sacrament_requests')
      .insert(fallbackPayload)
  },

  /**
   * Status polling for sacrament requests.
   *
   * This used to `select` from `sacrament_requests` directly, which only worked because the table
   * carried an anon policy of `USING (true)` — meaning the anon key (which ships inside the APK)
   * could read every parishioner's name, phone number and form payload. That policy is gone; reads
   * now go through a SECURITY DEFINER RPC that returns status fields only, keyed on the
   * unguessable `client_request_id` the device already holds.
   */
  fetchSacramentStatuses: async (requestIds: string[]) => {
    const ids = requestIds.map(normalizeRequestId).filter((v) => v.length > 0)
    if (!ids.length) {
      return { data: [] as any[], error: null as unknown }
    }
    // The RPC caps the id array at 100 server-side; chunk so a long history still resolves.
    const chunks: string[][] = []
    for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100))

    const results = await Promise.all(
      chunks.map((chunk) =>
        supabase.rpc('public_fetch_sacrament_statuses', { request_ids: chunk })
      )
    )

    const rows = results.flatMap((r) => (Array.isArray(r.data) ? r.data : []))
    const firstError = results.find((r) => r.error)?.error ?? null

    // A partial failure still returns what resolved; the caller keeps its cached statuses for the
    // rest rather than showing every request as unknown.
    return { data: rows, error: rows.length > 0 ? null : firstError }
  },

  fetchParishSettings: async () => {
    return supabase.from('parish_settings').select('key, value')
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

    // The `public_fetch_request_statuses` RPC is the ONLY path that can return these rows.
    // A previous version also queried `bookings` and `donations` directly as a "safety net" — but
    // anon holds INSERT-only policies on both tables, so those selects always came back empty and
    // simply cost two extra round-trips per poll. They have been removed.
    const rpcAttempt = await supabase.rpc('public_fetch_request_statuses', {
      request_ids: normalizedRequestIds,
    })

    const rows: RemoteRequestStatusRow[] = (!rpcAttempt.error && Array.isArray(rpcAttempt.data))
      ? (rpcAttempt.data as any[]).map((row) => ({
          client_request_id: normalizeRequestId(row?.client_request_id),
          status: normalizeStatus(row?.status),
          source: row?.source === 'donation' ? 'donation' as const : 'booking' as const,
          updated_at: row?.updated_at ?? null,
        })).filter((row) => row.client_request_id.length > 0)
      : []

    // De-duplicate defensively: a request id is unique per table, but a caller could pass the same
    // id twice.
    const byRequestId = new Map<string, RemoteRequestStatusRow>()
    rows.forEach((row) => byRequestId.set(row.client_request_id, row))
    const finalRows = Array.from(byRequestId.values())

    return {
      data: finalRows,
      error: finalRows.length > 0 ? null : (rpcAttempt.error ?? null),
    }
  },
}
