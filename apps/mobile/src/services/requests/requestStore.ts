import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/constants';
import { BookingStatus } from '../../types/booking.types';
import { parishService } from '../api/parishService';

export type RequestType = 'donation' | 'mass booking' | 'thanksgiving';

export interface RequestDetails {
    submittedBy?: string;
    paymentName?: string;
    paymentReference?: string | null;
    note?: string;
    purpose?: string | null;
    message?: string | null;
}

export interface RequestHistoryItem {
    id: string;
    type: RequestType;
    date: string;
    amount?: number;
    status: BookingStatus;
    clientRequestId?: string;
    source?: 'booking' | 'donation';
    details?: RequestDetails;
    createdAt: string;
    updatedAt: string;
}

const parseItems = (raw: string | null): RequestHistoryItem[] => {
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw) as RequestHistoryItem[];
        if (!Array.isArray(parsed)) return [];
        return parsed.map((item) => ({
            ...item,
            status: normalizeStatus(item.status),
            createdAt: item.createdAt ?? new Date().toISOString(),
            updatedAt: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
        }));
    } catch {
        return [];
    }
};

const normalizeStatus = (value: unknown): BookingStatus => {
    const normalized = String(value ?? '')
        .trim()
        .toLowerCase();
    if (normalized === 'approved') return 'approved';
    if (normalized === 'rejected') return 'rejected';
    return 'pending';
};

const normalizeRequestId = (value: unknown) =>
    String(value ?? '')
        .trim()
        .toLowerCase();

const loadItems = async () => parseItems(await AsyncStorage.getItem(STORAGE_KEYS.requestHistory));

const saveItems = async (items: RequestHistoryItem[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.requestHistory, JSON.stringify(items));
};

export const getRequestHistory = async (): Promise<RequestHistoryItem[]> => {
    const items = await loadItems();
    return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const addRequestHistoryItem = async (input: Omit<RequestHistoryItem, 'createdAt' | 'updatedAt'>) => {
    const items = await loadItems();
    const now = new Date().toISOString();

    const next: RequestHistoryItem = {
        ...input,
        createdAt: now,
        updatedAt: now,
    };

    await saveItems([next, ...items]);
    return next;
};

export const updateRequestStatus = async (id: string, status: BookingStatus) => {
    const items = await loadItems();
    const now = new Date().toISOString();
    const next = items.map((item) => (item.id === id ? { ...item, status, updatedAt: now } : item));
    await saveItems(next);
};

export const refreshRequestHistory = async (): Promise<RequestHistoryItem[]> => {
    const items = await loadItems();
    const requestIds = items
        .map((item) => normalizeRequestId(item.clientRequestId))
        .filter((value): value is string => value.length > 0);

    if (requestIds.length === 0) {
        return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    try {
        const { data: remoteRows, error } = await parishService.fetchRequestStatuses(requestIds);
        if (error || !Array.isArray(remoteRows)) {
            return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        }

        const remoteMap = new Map(
            remoteRows.map((row) => [normalizeRequestId(row.client_request_id), row])
        );

        let didChange = false;
        const next = items.map((local) => {
            if (!local.clientRequestId) return local;
            const remote = remoteMap.get(normalizeRequestId(local.clientRequestId));
            if (!remote) return local;

            const normalizedRemoteStatus = normalizeStatus(remote.status);
            if (local.status !== normalizedRemoteStatus) {
                didChange = true;
                return {
                    ...local,
                    status: normalizedRemoteStatus,
                    updatedAt: remote.updated_at || new Date().toISOString(),
                    source: remote.source || local.source,
                };
            }
            return local;
        });

        if (didChange) {
            await saveItems(next);
        }

        return [...next].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (e) {
        console.warn('[RequestStore] Auto-refresh failed:', e);
        return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
};
