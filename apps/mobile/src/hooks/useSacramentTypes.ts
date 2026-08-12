import { useMemo } from 'react';
import { useCachedData } from './useCachedData';
import { parishService } from '../services/api/parishService';
import { STORAGE_KEYS } from '../utils/constants';
import { DEFAULT_SACRAMENT_TYPES, SacramentField, SacramentType } from '../types/sacrament.types';

const FIELD_TYPES: SacramentField['type'][] = ['text', 'longtext', 'date', 'phone', 'email', 'select'];
const DATE_PRESETS = ['past', 'future', 'any'] as const;

/**
 * Map the `required_fields` JSONB into typed fields.
 *
 * This previously kept only `key`, `label`, `type` and `required`, and allowed just four of the six
 * field types. Everything else the admin could configure was discarded on the way in:
 *
 *   - `select` and `email` fell back to `text`, so a configured dropdown rendered as a free-text
 *     box and its `options` were never even read;
 *   - `helperText` and `placeholder` — the guidance a parishioner needs to answer correctly —
 *     were dropped;
 *   - `datePreset` / `minDate` / `maxDate` were dropped, so date bounds configured in the database
 *     had no effect on the form at all.
 *
 * Unknown values still degrade to a safe default rather than throwing: bad config should produce a
 * plain text box, never a broken screen.
 */
const coerceFields = (raw: unknown): SacramentField[] => {
    if (!Array.isArray(raw)) return [];
    return raw
        .filter((f) => f && typeof f.key === 'string' && typeof f.label === 'string')
        .map((f): SacramentField => {
            const type: SacramentField['type'] = FIELD_TYPES.includes(f.type) ? f.type : 'text';
            const field: SacramentField = {
                key: f.key,
                label: f.label,
                type,
                required: !!f.required,
                helperText: typeof f.helperText === 'string' ? f.helperText : null,
                placeholder: typeof f.placeholder === 'string' ? f.placeholder : null,
            };

            if (type === 'select' && Array.isArray(f.options)) {
                field.options = f.options.filter((o: unknown) => typeof o === 'string' && o.length > 0);
            }

            if (type === 'date') {
                if (DATE_PRESETS.includes(f.datePreset)) field.datePreset = f.datePreset;
                if (typeof f.minDate === 'string') field.minDate = f.minDate;
                if (typeof f.maxDate === 'string') field.maxDate = f.maxDate;
            }

            return field;
        });
};

const mapRow = (row: any): SacramentType => ({
    type: row.type,
    title: row.title ?? row.type,
    description: row.description ?? null,
    icon: row.icon ?? null,
    is_free: row.is_free ?? true,
    amount: Number(row.amount ?? 0),
    currency: row.currency ?? '₦',
    payment_instructions: row.payment_instructions ?? null,
    account_name: row.account_name ?? null,
    account_number: row.account_number ?? null,
    bank_name: row.bank_name ?? null,
    payment_notes: row.payment_notes ?? null,
    required_fields: coerceFields(row.required_fields),
    allow_attachment: row.allow_attachment ?? true,
    active: row.active ?? true,
    sort_order: Number(row.sort_order ?? 100),
});

/**
 * Sacrament request config, cache-first for offline use. If nothing has ever been fetched (first
 * run offline), falls back to the bundled DEFAULT so the Baptismal Card form still works.
 */
export const useSacramentTypes = () => {
    const { data, isLoading, isRefreshing, refresh } = useCachedData<SacramentType[]>(
        STORAGE_KEYS.sacramentTypesCache,
        async () => {
            const { data: rows, error } = await parishService.fetchSacramentTypes();
            if (error || !Array.isArray(rows)) {
                throw new Error('Unable to load sacrament types');
            }
            return rows.map(mapRow);
        },
    );

    /**
     * Merge the bundled field defaults into whatever the database returned.
     *
     * The remote config wins for everything it actually specifies, but a deployment that has not yet
     * run the migration adding `datePreset`/`minDate` returns a `baptism_date` field with no bounds
     * — and the app would then render an unbounded picker, accepting a baptism date in the future.
     * Filling only the gaps means the app is correct before the migration lands and defers to the
     * parish's configuration afterwards.
     */
    const types = useMemo(() => {
        const remote = data && data.length > 0 ? data : null;
        if (!remote) return DEFAULT_SACRAMENT_TYPES;

        return remote.map((type) => {
            const fallback = DEFAULT_SACRAMENT_TYPES.find((d) => d.type === type.type);
            if (!fallback) return type;

            return {
                ...type,
                required_fields: type.required_fields.map((field) => {
                    const defaults = fallback.required_fields.find((f) => f.key === field.key);
                    if (!defaults || field.type !== 'date') return field;

                    return {
                        ...field,
                        datePreset: field.datePreset ?? defaults.datePreset,
                        minDate: field.minDate ?? defaults.minDate,
                        maxDate: field.maxDate ?? defaults.maxDate,
                        helperText: field.helperText ?? defaults.helperText,
                    };
                }),
            };
        });
    }, [data]);

    return { types, isLoading, isRefreshing, refetch: refresh };
};
