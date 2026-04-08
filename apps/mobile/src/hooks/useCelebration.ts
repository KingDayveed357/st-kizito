import { useMemo, useState } from 'react';
import { getReadings } from '../services/liturgicalData';
import { LiturgicalCelebration, resolveCelebration } from '../services/calendarEngine';

export const useCelebration = (date: string) => {
    const missalDay = useMemo(() => getReadings(date), [date]);

    // Construct the "Celebrations" array for the Engine
    const celebrations = useMemo<LiturgicalCelebration[]>(() => {
        if (!missalDay) return [];
        
        // If usccbData gave us multiple masses, we convert them to variants
        // Let's assume the base missalDay represents the Primary celebration.
        const c: LiturgicalCelebration = {
            id: missalDay.id,
            title: missalDay.celebration,
            rank: missalDay.celebrationType?.toLowerCase() as any ?? 'weekday',
            variants: missalDay.variants,
            readings: missalDay.readings,
            liturgicalColor: missalDay.liturgicalColor,
        };
        
        // Currently St. Kizito database returns one compiled MissalDay but may include variants
        // To strictly follow the "Multiple Equal Celebrations at Once" fix, if the data API
        // returned multiple optional memorials, we would add them here.
        return [c];
    }, [missalDay]);

    const resolved = useMemo(() => resolveCelebration(celebrations), [celebrations]);

    const [activeVariantId, setActiveVariantId] = useState<string | null>(null);
    const [activeAlternativeId, setActiveAlternativeId] = useState<string | null>(null);

    const activeCelebration = useMemo(() => {
        if (activeAlternativeId) {
            return resolved.alternatives.find(a => a.id === activeAlternativeId) || resolved.primary;
        }
        return resolved.primary;
    }, [resolved, activeAlternativeId]);

    const blocksToRender = useMemo(() => {
        const c = activeCelebration;
        if (!c) return [];

        if (c.variants && c.variants.length > 0) {
            const variant = c.variants.find(v => v.id === activeVariantId) || c.variants[0];
            return variant.readings || [];
        }

        return c.readings || [];
    }, [activeCelebration, activeVariantId]);

    return {
        resolved,
        activeCelebration,
        activeVariantId,
        setActiveVariantId,
        activeAlternativeId,
        setActiveAlternativeId,
        blocksToRender,
        missalDay
    };
};
