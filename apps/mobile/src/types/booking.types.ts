export type BookingStatus = 'pending' | 'approved' | 'rejected';
export type BookingIntentionType = 'mass_intention' | 'thanksgiving';

export interface BookingDraft {
    fullName: string;
    intentionType: BookingIntentionType;
    date: string; // YYYY-MM-DD
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
