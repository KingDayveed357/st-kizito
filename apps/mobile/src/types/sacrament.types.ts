export type SacramentFieldType = 'text' | 'longtext' | 'date' | 'phone' | 'email' | 'select';

export interface SacramentField {
    key: string;
    label: string;
    type: SacramentFieldType;
    required: boolean;
    helperText?: string | null;
    placeholder?: string | null;
    options?: string[]; // for 'select'
}

export interface SacramentType {
    type: string;                 // e.g. 'baptismal_card'
    title: string;
    description: string | null;
    icon: string | null;
    is_free: boolean;
    amount: number;
    // Payment configuration (used when is_free === false)
    currency: string;             // e.g. '₦'
    payment_instructions: string | null;
    account_name: string | null;
    account_number: string | null;
    bank_name: string | null;
    payment_notes: string | null;
    required_fields: SacramentField[];
    allow_attachment: boolean;
    active: boolean;
    sort_order: number;
}

export type SacramentRequestStatus = 'pending' | 'approved' | 'rejected' | 'needs_info';

export interface SacramentRequestPayload {
    type: string;
    client_request_id: string;
    full_name: string;
    contact_phone: string | null;
    payload: Record<string, string>;
    attachment_url: string | null;
    is_free: boolean;
    amount_due: number;
    status: 'pending';
}

/**
 * Bundled fallback config so the Baptismal Card form works even on a first run with no network
 * and no cached config (offline edge case). Kept in sync with the DB seed in
 * apps/web/db/create_sacrament_requests.sql.
 */
export const DEFAULT_SACRAMENT_TYPES: SacramentType[] = [
    {
        type: 'baptismal_card',
        title: 'Baptismal Card',
        description: 'Request an official record of your baptism at the parish.',
        icon: 'water-outline',
        is_free: true,
        amount: 0,
        currency: '₦',
        payment_instructions: null,
        account_name: null,
        account_number: null,
        bank_name: null,
        payment_notes: null,
        allow_attachment: true,
        active: true,
        sort_order: 10,
        required_fields: [
            { key: 'baptism_date', label: 'Date of Baptism', type: 'date', required: true },
            { key: 'place_of_baptism', label: 'Place / Church of Baptism', type: 'text', required: true },
            { key: 'father_name', label: "Father's Full Name", type: 'text', required: true },
            { key: 'mother_name', label: "Mother's Maiden Name", type: 'text', required: true },
            { key: 'godparents', label: 'Godparent(s)', type: 'text', required: false },
            { key: 'notes', label: 'Additional Notes', type: 'longtext', required: false },
        ],
    },
];
