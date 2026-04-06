import { supabase } from './supabase'

const isDonationOptionalFieldError = (error: unknown) => {
  const message = String((error as any)?.message ?? error ?? '').toLowerCase()
  return message.includes('column') && (message.includes('purpose') || message.includes('message'))
}

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
    return supabase
      .from('bookings')
      .insert(data)
  },

  submitDonation: async (data: any) => {
    const firstAttempt = await supabase
      .from('donations')
      .insert(data)

    if (!firstAttempt.error || !isDonationOptionalFieldError(firstAttempt.error)) {
      return firstAttempt
    }

    const { purpose, message, ...fallbackPayload } = data ?? {}
    return supabase
      .from('donations')
      .insert(fallbackPayload)
  }
}
