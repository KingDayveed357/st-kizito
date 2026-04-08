export type LiturgicalBlockType =
	| 'entrance_antiphon'
	| 'first_reading'
	| 'psalm'
	| 'second_reading'
	| 'gospel_acclamation'
	| 'gospel'
	| 'procession_gospel'
	| 'vigil_reading'
	| 'supplemental_reading'
	| 'communion_antiphon'
	| 'reading';

export interface PsalmVerse {
	type: 'response' | 'verse';
	text: string;
}

export interface LiturgicalBlock {
	id: string;
	type: LiturgicalBlockType;
	label: string;
	reference?: string | null;
	text?: string | null;
	response?: string | null;
	verses?: PsalmVerse[];
	context?: string | null;
	optional?: boolean;
}

export interface MissalAntiphons {
	entrance: string | null;
	communion: string | null;
}

export interface MissalDay {
	id: string;
	date: string;
	liturgicalYear: string;
	feastName: string;
	celebration: string;
	liturgicalSeason: string;
	liturgicalColor: string;
	liturgicalDay: string;
	celebrationType?: string;
	antiphons: MissalAntiphons;
	readings: LiturgicalBlock[];
	variants?: { id: string; title: string; readings: LiturgicalBlock[] }[];
}

export interface DailyInspirationCard {
	title: string;
	body: string;
	heroVerse: {
		text: string;
		reference: string;
	};
	reflections: Array<{
		id: string;
		verse: string;
		reference: string;
		reflection: string;
		theme: 'peace' | 'strength' | 'faith' | 'hope' | 'love';
	}>;
	saintQuote: {
		quote: string;
		saint: string;
		initials: string;
	};
	sourceReadings: LiturgicalBlock[];
}