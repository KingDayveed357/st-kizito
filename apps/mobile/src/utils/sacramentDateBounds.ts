import type { SacramentField } from '../types/sacrament.types';
import { fromIsoDate } from './dateFormat';

/**
 * Turn a `date` field's config into the props `DatePickerField` needs.
 *
 * Kept out of the screen so both the form and any future admin preview resolve bounds identically,
 * and so "today" is evaluated when the form opens rather than baked into config.
 */

export interface ResolvedDateBounds {
    minimumDate?: Date;
    maximumDate?: Date;
    /** True when the plausible range spans many years, so the year should lead the picker. */
    preferYearFirst: boolean;
}

/** Local end-of-day, so "on or before today" includes today itself in every timezone. */
const endOfToday = (): Date => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
};

/** Local start-of-day, so "on or after today" does not exclude the current day mid-afternoon. */
const startOfToday = (): Date => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

export const resolveDateBounds = (field: SacramentField): ResolvedDateBounds => {
    const preset = field.datePreset ?? 'any';

    let minimumDate: Date | undefined;
    let maximumDate: Date | undefined;

    if (preset === 'past') maximumDate = endOfToday();
    if (preset === 'future') minimumDate = startOfToday();

    // An explicit bound is applied on top of the preset, tightening it rather than replacing it —
    // a config that says both `past` and `maxDate: 2020-01-01` means "past, and no later than 2020".
    const explicitMin = field.minDate ? fromIsoDate(field.minDate) : null;
    const explicitMax = field.maxDate ? fromIsoDate(field.maxDate) : null;

    if (explicitMin) {
        minimumDate = minimumDate && minimumDate > explicitMin ? minimumDate : explicitMin;
    }
    if (explicitMax) {
        maximumDate = maximumDate && maximumDate < explicitMax ? maximumDate : explicitMax;
    }

    // Only offer the year-first picker when scrolling months would genuinely be tedious. For a
    // date being scheduled a few weeks out, the month calendar is the better control.
    const spanMs =
        minimumDate && maximumDate
            ? maximumDate.getTime() - minimumDate.getTime()
            : preset === 'past'
              ? Number.POSITIVE_INFINITY
              : 0;

    return { minimumDate, maximumDate, preferYearFirst: spanMs > 2 * MS_PER_YEAR };
};
