export type PrayerBlock =
    | { type: 'heading'; text: string }
    | { type: 'psalm'; title: string; content: string[]; antiphon?: string; secondaryAntiphons?: string[] }
    | { type: 'hymn'; verses: string[] }
    | { type: 'reading'; text: string; reference?: string }
    | { type: 'responsory'; lines: { leader: boolean; text: string }[] }
    | { type: 'prayer'; text: string }
    | { type: 'intercessions'; items: { text: string; response?: string }[] }
    | { type: 'rubric'; text: string };

export interface DivineOfficeParts {
    invitatory?: { heading?: string; text: string };
    introduction?: string;
    hymn?: { text: string };
    psalmody: { heading?: string; antiphon?: string; text: string; antiphon2?: string }[];
    reading?: { reference?: string; text: string };
    responsory?: { text: string };
    gospelCanticle?: { heading?: string; antiphon?: string; text: string; antiphon2?: string };
    intercessions?: { text: string };
    lordsPrayer?: { text: string };
    concludingPrayer?: { text: string };
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
