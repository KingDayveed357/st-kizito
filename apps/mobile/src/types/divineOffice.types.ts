export type BlockType =
    | "heading"
    | "invitatory"
    | "opening"
    | "hymn"
    | "antiphon"
    | "psalm_title"
    | "psalm_summary"
    | "psalm_body"
    | "glory_be"
    | "reading_1"
    | "responsory_1"
    | "reading_2"
    | "responsory_2"
    | "gospel_canticle"
    | "intercessions"
    | "our_father"
    | "concluding_prayer"
    | "dismissal"
    | "rubric"
    | "reading" // generic fallback for unknown
    | "psalm" // generic fallback for unknown
    | "responsory" // generic fallback for unknown
    | "prayer";

export interface PrayerBlock {
    type: BlockType;
    text?: string;
    verses?: string[];
    title?: string;
    content?: string[];
    antiphon?: string; 
    secondaryAntiphons?: string[];
    psalmPrayer?: string;
    reference?: string;
    lines?: { leader: boolean; text: string }[];
    items?: { text: string; response?: string }[];
}

export interface DivineOfficeParts {
    invitatory?: { heading?: string; text: string };
    introduction?: string;
    hymn?: { text: string };
    psalmody: { heading?: string; antiphon?: string; text: string; antiphon2?: string; psalmPrayer?: string }[];
    reading?: { reference?: string; text: string };
    responsory?: { text: string };
    gospelCanticle?: { heading?: string; antiphon?: string; text: string; antiphon2?: string; reference?: string };
    intercessions?: { text: string };
    lordsPrayer?: { text: string };
    concludingPrayer?: { text: string };
    dismissal?: { text: string };
    blocks?: { type: string; text?: string; reference?: string; items?: any[] }[];
}

export interface DivineOfficePrayer {
    key: string;
    title: string;
    icon?: string;
    date: string;
    office: string;
    celebration: string;
    parts: DivineOfficeParts;
}

export interface DivineOfficeHour {
    id: string;
    key: string;
    title: string;
    timeLength: string;
    isCurrent: boolean;
    icon: string;
    detail: DivineOfficePrayer | null;
}
