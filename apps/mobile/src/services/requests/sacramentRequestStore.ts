import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/constants';
import { parishService } from '../api/parishService';
import type { SacramentRequestStatus } from '../../types/sacrament.types';

export interface SacramentRequestRecord {
    id: string;                    // local id
    clientRequestId: string;       // matches Supabase row for status polling
    type: string;                  // e.g. 'baptismal_card'
    typeTitle: string;
    fullName: string;
    status: SacramentRequestStatus;
    adminNote?: string | null;     // reason on reject / what's needed on needs_info
    amountDue: number;
    isFree: boolean;
    queuedOffline: boolean;        // still waiting to sync
    createdAt: string;
    updatedAt: string;
}

const normalizeStatus = (value: unknown): SacramentRequestStatus => {
    const v = String(value ?? '').trim().toLowerCase();
    if (v === 'approved') return 'approved';
    if (v === 'rejected') return 'rejected';
    if (v === 'needs_info') return 'needs_info';
    return 'pending';
};

const normalizeId = (value: unknown) => String(value ?? '').trim().toLowerCase();

const load = async (): Promise<SacramentRequestRecord[]> => {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.sacramentRequests);
        const parsed = raw ? (JSON.parse(raw) as SacramentRequestRecord[]) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const save = async (items: SacramentRequestRecord[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.sacramentRequests, JSON.stringify(items));
};

export const getSacramentRequests = async (): Promise<SacramentRequestRecord[]> => {
    const items = await load();
    return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const addSacramentRequest = async (
    input: Omit<SacramentRequestRecord, 'createdAt' | 'updatedAt'>,
): Promise<SacramentRequestRecord> => {
    const items = await load();
    const now = new Date().toISOString();
    const record: SacramentRequestRecord = { ...input, createdAt: now, updatedAt: now };
    await save([record, ...items]);
    return record;
};

/**
 * Poll Supabase for the latest status of tracked requests and merge locally.
 * Best-effort: on any failure it returns the cached list unchanged (offline-safe).
 */
export const refreshSacramentRequests = async (): Promise<SacramentRequestRecord[]> => {
    const items = await load();
    const ids = items.map((i) => normalizeId(i.clientRequestId)).filter((v) => v.length > 0);
    if (ids.length === 0) {
        return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    try {
        const { data, error } = await parishService.fetchSacramentStatuses(ids);
        if (error || !Array.isArray(data)) {
            return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        }

        const remote = new Map(data.map((row: any) => [normalizeId(row.client_request_id), row]));
        let changed = false;
        const next = items.map((local) => {
            const row = remote.get(normalizeId(local.clientRequestId));
            if (!row) return local;
            const status = normalizeStatus(row.status);
            const adminNote = row.admin_note ?? local.adminNote ?? null;
            // Reaching the server confirms it is no longer only-queued-offline.
            if (status !== local.status || adminNote !== local.adminNote || local.queuedOffline) {
                changed = true;
                return {
                    ...local,
                    status,
                    adminNote,
                    queuedOffline: false,
                    updatedAt: row.updated_at || new Date().toISOString(),
                };
            }
            return local;
        });

        if (changed) await save(next);
        return [...next].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
        return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
};
