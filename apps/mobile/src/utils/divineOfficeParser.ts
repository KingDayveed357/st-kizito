import { DivineOfficeParts, PrayerBlock } from '../types/divineOffice.types';

/**
 * Removes liturgical instructions, disclaimers, navigation, and noise
 * that don't belong in the actual prayer content.
 */
export function cleanDivineOfficeText(rawText: string | undefined): string {
    if (!rawText) return '';

    let cleaned = rawText;

    const patternsToRemove = [
        /At(?:\s+the)?\s+day\s*time\s+hours?\s*\(Terce,\s*Sext,\s*None\).+?(?:complementary\s+psalms?\s+instead\.?)?/gi,
        /The psalms and canticles here are our own translation.+?Universalis apps and programs do contain the Grail translation/gi,
        /You can also view this page in Latin and English/gi,
        /Dates\s+Today\s+Sun/gi,
        /Continue\s*$/gi,
        /Psalms of the day/gi,
        /Complementary psalms/gi,
        /\(repeat antiphon\*?\)/gi,
        /The final part of the hymn may be omitted:/gi,
        /Africa: .+?United States/gs,
        /\(\d+ minutes\) Episode notes\./gi,
    ];

    patternsToRemove.forEach((pattern) => {
        cleaned = cleaned.replace(pattern, '');
    });

    cleaned = cleaned
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join('\n');

    return cleaned.trim();
}

const looksLikeInstructionalNoise = (value?: string | null): boolean => {
    if (!value) return true;
    const cleaned = cleanDivineOfficeText(value);
    if (!cleaned) return true;

    return /day\s*time\s+hours?.*terce.*sext.*none|complementary\s+psalms?|you\s+can\s+also\s+view\s+this\s+page|psalms?\s+and\s+canticles\s+here\s+are\s+our\s+own\s+translation|episode\s+notes|africa:|latin\s+america:|middle\s+east:/i.test(
        cleaned
    );
};

/**
 * Splits a block of text into individual verses or lines for prayer.
 */
export function parseVerses(text: string): string[] {
    return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

/**
 * Transforms raw DivineOfficeParts into clean, structured PrayerBlocks.
 */
export function parseDivineOffice(parts: DivineOfficeParts): PrayerBlock[] {
    const blocks: PrayerBlock[] = [];

    const normalizeAntiphon = (value?: string | null): string | undefined => {
        const cleaned = cleanDivineOfficeText(value ?? '');
        if (!cleaned || looksLikeInstructionalNoise(cleaned)) return undefined;
        return cleaned;
    };

    const normalizePsalmTitle = (heading?: string, fallbackIndex = 0) => {
        const cleaned = cleanDivineOfficeText(heading ?? '');
        return cleaned || `Psalm ${fallbackIndex + 1}`;
    };

    const removeEmbeddedAntiphon = (lines: string[], antiphon?: string) => {
        if (!antiphon || lines.length === 0) return lines;

        const simplified = (value: string) =>
            value
                .toLowerCase()
                .replace(/alleluia\.?/g, '')
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

        const antiphonKey = simplified(antiphon);
        if (!antiphonKey) return lines;

        let next = lines;
        const firstKey = simplified(next[0] ?? '');
        if (firstKey && (firstKey === antiphonKey || firstKey.includes(antiphonKey) || antiphonKey.includes(firstKey))) {
            next = next.slice(1);
        }

        if (next.length > 0) {
            const lastKey = simplified(next[next.length - 1]);
            if (lastKey && (lastKey === antiphonKey || lastKey.includes(antiphonKey) || antiphonKey.includes(lastKey))) {
                next = next.slice(0, -1);
            }
        }

        return next;
    };

    const parseResponsoryLines = (text: string) =>
        text
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => ({
                leader: !/^(?:R\.|V\.|℟\.|℣\.|â„Ÿ\.|â„£\.|[—–-])/.test(line),
                text: line,
            }));

    if (parts.invitatory?.text) {
        blocks.push({ type: 'heading', text: parts.invitatory.heading ?? 'Invitatory' });
        blocks.push({ type: 'prayer', text: cleanDivineOfficeText(parts.invitatory.text) });
    } else if (parts.introduction) {
        blocks.push({ type: 'prayer', text: cleanDivineOfficeText(parts.introduction) });
    }

    if (parts.hymn?.text) {
        const text = cleanDivineOfficeText(parts.hymn.text);
        if (text) {
            blocks.push({ type: 'heading', text: 'Hymn' });
            blocks.push({ type: 'hymn', verses: parseVerses(text) });
        }
    }

    if (parts.psalmody && parts.psalmody.length > 0) {
        parts.psalmody.forEach((p, idx) => {
            const cleanBody = cleanDivineOfficeText(p.text);
            if (!cleanBody) return;

            const explicitAntiphon = normalizeAntiphon(p.antiphon);
            const explicitSecondary = normalizeAntiphon(p.antiphon2);

            let antiphon = explicitAntiphon;
            let content = parseVerses(cleanBody);

            if (!antiphon && content.length > 2) {
                const first = content[0];
                const last = content[content.length - 1];
                const firstKey = first.toLowerCase().replace(/alleluia\.?/g, '').trim();
                const lastKey = last.toLowerCase().replace(/alleluia\.?/g, '').trim();
                if (firstKey && lastKey && (firstKey === lastKey || firstKey.includes(lastKey) || lastKey.includes(firstKey))) {
                    antiphon = cleanDivineOfficeText(first);
                    content = content.slice(1, -1);
                }
            } else if (antiphon) {
                content = removeEmbeddedAntiphon(content, antiphon);
            }

            const cleanedContent = content.map(cleanDivineOfficeText).filter(Boolean);
            if (cleanedContent.length === 0) return;

            const secondaryAntiphons = [explicitSecondary].filter(
                (item): item is string => !!item && item !== antiphon
            );

            blocks.push({
                type: 'psalm',
                title: normalizePsalmTitle(p.heading, idx),
                antiphon,
                content: cleanedContent,
                ...(secondaryAntiphons.length ? { secondaryAntiphons } : {}),
            });
        });
    }

    if (parts.reading?.text) {
        const text = cleanDivineOfficeText(parts.reading.text);
        if (text && !looksLikeInstructionalNoise(text)) {
            blocks.push({
                type: 'reading',
                text,
                reference: parts.reading.reference ? cleanDivineOfficeText(parts.reading.reference) : undefined,
            });
        }
    }

    if (parts.responsory?.text) {
        const text = cleanDivineOfficeText(parts.responsory.text);
        if (text && !looksLikeInstructionalNoise(text)) {
            const lines = parseResponsoryLines(text);
            if (lines.length > 0) {
                blocks.push({ type: 'responsory', lines });
            }
        }
    }

    const supplementalReadings = [
        { label: 'First Reading', part: (parts as any).firstReading },
        { label: 'Second Reading', part: (parts as any).secondReading },
        { label: 'Scripture Reading', part: (parts as any).scriptureReading },
        { label: 'Reading', part: (parts as any).reading2 },
    ] as const;

    supplementalReadings.forEach(({ label, part }) => {
        const text = cleanDivineOfficeText(part?.text);
        if (!text || looksLikeInstructionalNoise(text)) return;

        blocks.push({ type: 'heading', text: label });
        blocks.push({
            type: 'reading',
            text,
            reference: part?.reference ? cleanDivineOfficeText(part.reference) : undefined,
        });

        const responsoryText = cleanDivineOfficeText(
            part?.responsory?.text ?? part?.shortResponsory?.text ?? part?.response?.text ?? null
        );
        if (responsoryText && !looksLikeInstructionalNoise(responsoryText)) {
            const lines = parseResponsoryLines(responsoryText);
            if (lines.length > 0) {
                blocks.push({ type: 'responsory', lines });
            }
        }
    });

    if (parts.gospelCanticle?.text) {
        const gc = parts.gospelCanticle;
        const antiphon = normalizeAntiphon(gc.antiphon);
        const secondary = normalizeAntiphon(gc.antiphon2);
        const bodyText = cleanDivineOfficeText(gc.text);
        let content = parseVerses(bodyText);
        if (antiphon) {
            content = removeEmbeddedAntiphon(content, antiphon);
        }

        const cleanedContent = content.map(cleanDivineOfficeText).filter(Boolean);
        if (cleanedContent.length > 0) {
            const secondaryAntiphons = [secondary].filter(
                (item): item is string => !!item && item !== antiphon
            );

            blocks.push({
                type: 'psalm',
                title: normalizePsalmTitle(gc.heading, blocks.length),
                antiphon,
                content: cleanedContent,
                ...(secondaryAntiphons.length ? { secondaryAntiphons } : {}),
            });
        }
    }

    if (parts.intercessions?.text) {
        const text = cleanDivineOfficeText(parts.intercessions.text);
        if (text && !looksLikeInstructionalNoise(text)) {
            const lines = text.split('\n');
            const items: { text: string; response?: string }[] = [];
            let currentItem: { text: string; response?: string } | null = null;

            lines.forEach((line) => {
                const trimmed = line.trim();
                if (/^[–—-]/.test(trimmed)) {
                    if (currentItem) {
                        currentItem.response = trimmed.replace(/^[–—-]\s*/, '');
                        items.push(currentItem);
                        currentItem = null;
                    }
                } else {
                    if (currentItem) items.push(currentItem);
                    currentItem = { text: trimmed };
                }
            });

            if (currentItem) items.push(currentItem);
            blocks.push({ type: 'intercessions', items });
        }
    }

    if (parts.lordsPrayer?.text) {
        const text = cleanDivineOfficeText(parts.lordsPrayer.text);
        if (text) {
            blocks.push({ type: 'heading', text: "The Lord's Prayer" });
            blocks.push({ type: 'prayer', text });
        }
    }

    if (parts.concludingPrayer?.text) {
        const text = cleanDivineOfficeText(parts.concludingPrayer.text);
        if (text) {
            blocks.push({ type: 'heading', text: 'Concluding Prayer' });
            blocks.push({ type: 'prayer', text });
        }
    }

    return blocks;
}
