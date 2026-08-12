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

/** One true stanza of a responsorial psalm. Refrain repetitions are boundaries, never stanzas. */
export interface PsalmStanzaBlock {
	lines: string[];
}

export interface LiturgicalBlock {
	id: string;
	type: LiturgicalBlockType;
	label: string;
	reference?: string | null;
	text?: string | null;
	response?: string | null;
	/**
	 * Structured stanzas — the preferred shape for rendering a responsorial psalm. Built in the data
	 * layer by `parsePsalmText`, so the renderer never has to infer structure from raw text (which
	 * produced 8–9 fragments for a 3–4 stanza psalm). `verses` is retained for the Divine Office path
	 * and any data that still supplies a flat list.
	 */
	stanzas?: PsalmStanzaBlock[];
	/** Verse citation carried by the refrain, e.g. "2a". */
	responseCitation?: string | null;
	/** Alternative refrain offered by the source after an "or:" line. */
	alternateResponse?: string | null;
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
	/**
	 * The day's inspiration, from the 366-entry bank (src/utils/dailyInspiration.ts).
	 *
	 * Replaces `saintQuote`, which rotated six quotations on a six-day cycle. It is Scripture with a
	 * verified citation rather than an attributed quotation — see
	 * scripts/generate-inspirations.mjs for why.
	 */
	dailyVerse: {
		text: string;
		reference: string;
		translation: string;
		/** Stable across devices and years, so a bookmark keeps pointing at the same words. */
		id: string;
	};
	sourceReadings: LiturgicalBlock[];
}