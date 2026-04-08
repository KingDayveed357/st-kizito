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
        .map((item) => item.clientRequestId)
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

    if (requestIds.length === 0) {
        return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    try {
        const { data, error } = await parishService.fetchRequestStatuses(requestIds);
        if (error || !Array.isArray(data) || data.length === 0) {
            return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        }

        const statusById = new Map(
            data
                .filter((entry) => typeof entry.client_request_id === 'string' && entry.client_request_id.trim().length > 0)
                .map((entry) => [
                    entry.client_request_id,
                    { status: normalizeStatus(entry.status), source: entry.source, updatedAt: entry.updated_at },
                ])
        );

        let didChange = false;
        const next = items.map((item) => {
            if (!item.clientRequestId) return item;
            const remote = statusById.get(item.clientRequestId);
            if (!remote) return item;

            if (remote.status !== normalizeStatus(item.status) || (remote.updatedAt && remote.updatedAt !== item.updatedAt)) {
                didChange = true;
                return {
                    ...item,
                    status: normalizeStatus(remote.status),
                    source: remote.source,
                    updatedAt: remote.updatedAt ?? new Date().toISOString(),
                };
            }

            return item;
        });

        if (didChange) {
            await saveItems(next);
        }

        return [...next].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
        return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
};
