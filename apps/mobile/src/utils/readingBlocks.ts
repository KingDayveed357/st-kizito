import type { LiturgicalBlockType } from '../types/readings.types';

/**
 * Normalizes a reading block's type coming from raw datasets.
 *
 * The USCCB dataset mistypes the Lenten "Verse Before the Gospel" acclamation as `gospel`
 * (only the label distinguishes it from the real Gospel). Left as `gospel`, it renders as a full
 * Gospel reading AND receives the Gospel closing ("The Gospel of the Lord. / Praise to you…"),
 * which is liturgically wrong — an acclamation has no such closing. We retype it to
 * `gospel_acclamation` based on its label so it renders as an acclamation and never gets a closing.
 *
 * The real Gospel (label "Gospel") is left untouched.
 */
export const normalizeBlockType = (
    type: string,
    label?: string | null,
): LiturgicalBlockType => {
    if (type === 'gospel' && /verse\s+before\s+the\s+gospel/i.test(label ?? '')) {
        return 'gospel_acclamation';
    }
    return type as LiturgicalBlockType;
};
