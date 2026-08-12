export const STORAGE_KEYS = {
    parishContacts: 'parish_contacts_cache_v1',
    parishPaymentDetails: 'parish_payment_details_cache_v1',
    requestHistory: 'parish_request_history_v1',
    sacramentRequests: 'parish_sacrament_requests_v1',
    sacramentTypesCache: 'parish_sacrament_types_cache_v1',
    notificationPreferences: 'notification_preferences_v1',
    prayerReminders: 'prayer_reminders_v1',
    devotionReminders: 'devotion_reminders_v1',
    liturgyCalendarData: 'liturgy_calendar_data_v1',
    liturgyEventReminders: 'liturgy_event_reminders_v1',
    parishSettings: 'parish_settings_cache_v1',
    gallery: 'parish_gallery_cache_v1',
} as const;

export const DEFAULT_CACHE_STALE_TIME_MS = 24 * 60 * 60 * 1000;
