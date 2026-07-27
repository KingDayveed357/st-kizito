import { useCachedData } from './useCachedData';
import { parishService } from '../services/api/parishService';
import { STORAGE_KEYS } from '../utils/constants';
import { DEFAULT_SACRAMENT_TYPES, SacramentField, SacramentType } from '../types/sacrament.types';

const coerceFields = (raw: unknown): SacramentField[] => {
    if (!Array.isArray(raw)) return [];
    return raw
        .filter((f) => f && typeof f.key === 'string' && typeof f.label === 'string')
        .map((f) => ({
            key: f.key,
            label: f.label,
            type: ['text', 'longtext', 'date', 'phone'].includes(f.type) ? f.type : 'text',
            required: !!f.required,
        }));
};

const mapRow = (row: any): SacramentType => ({
    type: row.type,
    title: row.title ?? row.type,
    description: row.description ?? null,
    icon: row.icon ?? null,
    is_free: row.is_free ?? true,
    amount: Number(row.amount ?? 0),
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

    const types = data && data.length > 0 ? data : DEFAULT_SACRAMENT_TYPES;
    return { types, isLoading, isRefreshing, refetch: refresh };
};
