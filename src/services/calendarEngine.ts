import { LiturgicalBlock } from '../types/readings.types';

export type CelebrationRank = "solemnity" | "feast" | "memorial" | "optional_memorial" | "weekday";

export interface LiturgicalCelebration {
    id: string;
    rank: CelebrationRank;
    title: string;
    variants?: { id: string; title: string; readings: LiturgicalBlock[] }[];
    readings?: LiturgicalBlock[];
    // Include other optional fields from MissalDay as well to pass through
    liturgicalColor?: string;
    liturgicalSeason?: string;
    [key: string]: any;
}

export function resolveCelebration(celebrations: LiturgicalCelebration[]) {
    const priority = ["solemnity", "feast", "memorial", "optional_memorial", "weekday"];

    const sorted = [...celebrations].sort((a, b) => {
        const rankA = priority.indexOf(a.rank) !== -1 ? priority.indexOf(a.rank) : 99;
        const rankB = priority.indexOf(b.rank) !== -1 ? priority.indexOf(b.rank) : 99;
        return rankA - rankB;
    });

    const primary = sorted[0] || null;

    // Optional Memorials that are not the primary celebration
    const alternatives = sorted.filter(c => c.rank === "optional_memorial" && c.id !== primary?.id);

    return {
        primary: primary,
        alternatives: alternatives.length > 0 ? alternatives : [],
        variants: primary?.variants || [] // e.g. vigil/day
    };
}
