export interface InspirationItem {
    id: string;
    verse: string;
    reference: string;
    reflection: string;
    palette: {
        background: string;
        accent: string;
        border: string;
    };
}

export interface DonationTier {
    id: string;
    label: string;
    amount: number;
    note: string;
}

export interface ServiceOption {
    id: string;
    title: string;
    category: string;
    description: string;
    duration: string;
    amountLabel: string;
    accentColor: string;
    availableDates: string[];
    timeSlots: string[];
}

export interface HistorySection {
    id: string;
    eyebrow: string;
    title: string;
    body: string;
}

export const dailyInspirations: InspirationItem[] = [
    {
        id: 'psalm-23-1',
        verse: 'The Lord is my shepherd; I shall not want.',
        reference: 'Psalm 23:1',
        reflection: 'Let today begin from trust, not strain. You do not need to carry every outcome alone.',
        palette: { background: '#F9F6EF', accent: '#2F6A46', border: '#D7C79B' },
    },
    {
        id: 'psalm-46-10',
        verse: 'Be still, and know that I am God.',
        reference: 'Psalm 46:10',
        reflection: 'A quiet pause can become a prayer. Make space for stillness before the day fills up.',
        palette: { background: '#EFE4F7', accent: '#6E4D93', border: '#C9B0E6' },
    },
    {
        id: 'philippians-4-13',
        verse: 'I can do all things through Christ who strengthens me.',
        reference: 'Philippians 4:13',
        reflection: 'Strength in faith is not noise or force. It is the steady grace to keep going with hope.',
        palette: { background: '#E6F0E2', accent: '#3D7A4F', border: '#B5D0B8' },
    },
    {
        id: 'hebrews-11-1',
        verse: 'Faith is the substance of things hoped for.',
        reference: 'Hebrews 11:1',
        reflection: 'Faith holds onto what is promised before it is visible. Let that hope shape your decisions today.',
        palette: { background: '#F6EDD3', accent: '#A27B1D', border: '#E1C86A' },
    },
];

export const donationTiers: DonationTier[] = [
    { id: 'tier-1', label: 'Support a Family', amount: 500, note: 'Helps provide food parcels and outreach visits.' },
    { id: 'tier-2', label: 'Community Giving', amount: 1000, note: 'Supports youth formation, choirs, and parish programs.' },
    { id: 'tier-3', label: 'Sunday Offering', amount: 2000, note: 'Contributes to parish operations and liturgical preparation.' },
    { id: 'tier-4', label: 'Special Intention', amount: 5000, note: 'A generous gift for mission projects and urgent needs.' },
];

export const bookingServices: ServiceOption[] = [
    {
        id: 'mass-intention',
        title: 'Mass Intention',
        category: 'Liturgy',
        description: 'Offer a Mass for thanksgiving, healing, repose, or a special family intention.',
        duration: '15 min request',
        amountLabel: 'Suggested offering ₦5,000',
        accentColor: '#2F6A46',
        availableDates: ['Sun, Apr 6', 'Tue, Apr 8', 'Thu, Apr 10', 'Sun, Apr 13'],
        timeSlots: ['6:30 AM', '9:00 AM', '5:30 PM'],
    },
    {
        id: 'counselling',
        title: 'Pastoral Counselling',
        category: 'Care',
        description: 'Book a calm, private session with a priest or parish counsellor.',
        duration: '30 min session',
        amountLabel: 'No fee',
        accentColor: '#6B4E8A',
        availableDates: ['Mon, Apr 7', 'Wed, Apr 9', 'Fri, Apr 11'],
        timeSlots: ['10:00 AM', '1:00 PM', '4:00 PM'],
    },
    {
        id: 'document-request',
        title: 'Sacramental Documents',
        category: 'Administration',
        description: 'Request baptism, confirmation, or marriage record processing.',
        duration: '10 min request',
        amountLabel: 'Processing ₦2,500',
        accentColor: '#A27B1D',
        availableDates: ['Tue, Apr 8', 'Thu, Apr 10', 'Sat, Apr 12'],
        timeSlots: ['11:00 AM', '2:00 PM'],
    },
];

export const parishHistorySections: HistorySection[] = [
    {
        id: 'founding',
        eyebrow: 'FOUNDING YEARS',
        title: 'A parish rooted in witness and neighbourhood life',
        body: 'St. Kizito Parish began as a modest worshipping community gathering for prayer, catechesis, and mutual care. What started with a small number of families gradually grew into a stable parish home shaped by hospitality, disciplined liturgy, and everyday service.',
    },
    {
        id: 'growth',
        eyebrow: 'GROWTH',
        title: 'Built through prayer, formation, and shared responsibility',
        body: 'As the parish expanded, ministries for youth, women, men, families, and charitable outreach became central to parish life. Choirs, small Christian communities, and catechetical programs helped make faith formation part of ordinary weekly life instead of a Sunday-only experience.',
    },
    {
        id: 'today',
        eyebrow: 'TODAY',
        title: 'A living parish for worship, accompaniment, and mission',
        body: 'Today, St. Kizito Parish continues to serve as a spiritual home for worship, reconciliation, pastoral care, and community solidarity. The parish remains committed to reverent liturgy, accessible support, and forming parishioners who carry faith into homes, schools, and public life.',
    },
];
