export type BookingStatus = 'pending' | 'approved' | 'rejected';
export type BookingIntentionType = 'mass_intention' | 'thanksgiving';

export interface BookingDraft {
    fullName: string;
    intentionType: BookingIntentionType;
    /** Inclusive start of the Mass range (YYYY-MM-DD). */
    startDate: string;
    /** Inclusive end of the Mass range (YYYY-MM-DD). Equals startDate for a single day. */
    endDate: string;
    /** Number of days (Masses) in the range. */
    days: number;
    /** Minimum offering (₦) for the range = days × ₦500. The user may offer more at payment. */
    amount: number;
    /** Selected parish Mass time (schema `bookings.mass_time_id`), if chosen. */
    massTimeId?: string | null;
    /** Human-readable Mass time label for display/summary. */
    massTimeLabel?: string | null;
    /** Individual Mass time labels selected in the booking form. */
    massTimeLabels?: string[];
    note: string;
}

export interface DonationDraft {
    fullName: string;
    amount: number;
    purpose?: string;
    message?: string;
}

export interface PaymentConfirmationInput {
    paymentName: string;
    paymentReference?: string;
}
