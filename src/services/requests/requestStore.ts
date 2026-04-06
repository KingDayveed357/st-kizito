import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/constants';
import { BookingStatus } from '../../types/booking.types';

export type RequestType = 'donation' | 'mass booking' | 'thanksgiving';

export interface RequestHistoryItem {
    id: string;
    type: RequestType;
    date: string;
    amount?: number;
    status: BookingStatus;
    createdAt: string;
    updatedAt: string;
}

const parseItems = (raw: string | null): RequestHistoryItem[] => {
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw) as RequestHistoryItem[];
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch {
        return [];
    }
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
