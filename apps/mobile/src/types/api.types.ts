export type BookingStatus = 'pending' | 'approved' | 'rejected';
export type BookingIntentionType = 'mass_intention' | 'thanksgiving';

export interface BookingRow {
    id: string;
    client_request_id: string | null;
    name: string;
    type: BookingIntentionType;
    intention: string;
    start_date: string;
    end_date: string;
    mass_time_id: string | null;
    amount: number | null;
    preferred_mass_time: string | null;
    payment_name: string | null;
    payment_reference: string | null;
    payment_receipt_url: string | null;
    status: BookingStatus;
    created_at: string;
}

export interface BookingInsert {
    client_request_id?: string | null;
    name: string;
    type: BookingIntentionType;
    intention: string;
    start_date: string;
    end_date: string;
    mass_time_id?: string | null;
    amount: number;
    preferred_mass_time?: string | null;
    payment_name?: string | null;
    payment_reference?: string | null;
    payment_receipt_url?: string | null;
    status?: BookingStatus;
}

export interface ParishPaymentDetailsRow {
    id: string;
    bank_name: string | null;
    account_name: string | null;
    account_number: string | null;
    last_updated: string | null;
}

export interface MassTimeRow {
    id: string;
    day_of_week: string;
    time: string;
    location: string | null;
    type: string | null;
}
