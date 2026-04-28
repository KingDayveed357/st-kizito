import { useMemo } from 'react';
import { parishService } from '../services/api/parishService';
import { useCachedData } from './useCachedData';
import { STORAGE_KEYS } from '../utils/constants';
import { getContactRoleMeta } from '../utils/contactRoleMeta';

export type ParishContact = {
    id: string;
    role: string;
    name: string;
    detail: string | null;
    phone: string;
    whatsapp_phone: string | null;
    icon: string | null;
    accent: string | null;
    sort_order: number | null;
    active: boolean;
};

const FALLBACK_CONTACTS: ParishContact[] = [
    {
        id: 'secretary',
        role: 'Parish Secretary',
        name: 'Mrs. Adaeze Okonkwo',
        detail: 'Sacramental documents and certificates',
        phone: '+2348012345678',
        whatsapp_phone: '+2348012345678',
        icon: 'document-text-outline',
        accent: '#5E6F8E',
        sort_order: 0,
        active: true,
    },
    {
        id: 'catechist',
        role: 'Catechist',
        name: 'Mr. Chukwuemeka Eze',
        detail: 'RCIA, baptism preparation and faith formation',
        phone: '+2348087654321',
        whatsapp_phone: '+2348087654321',
        icon: 'book-outline',
        accent: '#C9A84C',
        sort_order: 1,
        active: true,
    },
    {
        id: 'counselling',
        role: 'Pastoral Counsellor',
        name: 'Fr. Emmanuel Nwosu',
        detail: 'Private sessions with a priest',
        phone: '+2348023456789',
        whatsapp_phone: '+2348023456789',
        icon: 'heart-circle-outline',
        accent: '#B5303C',
        sort_order: 2,
        active: true,
    },
];

export const useParishContacts = () => {
    const { data, isLoading, isRefreshing, refresh } = useCachedData<ParishContact[]>(
        STORAGE_KEYS.parishContacts,
        async () => {
            const { data: remoteData, error } = await parishService.fetchParishContacts();
            if (error || !remoteData || remoteData.length === 0) {
                throw new Error('Unable to fetch parish contacts');
            }
            return remoteData as ParishContact[];
        }
    );

    const contacts = useMemo(() => {
        const source = data && data.length > 0 ? data : FALLBACK_CONTACTS;
        return [...source]
            .map((contact) => {
                const roleMeta = getContactRoleMeta(contact.role);
                return {
                    ...contact,
                    icon: roleMeta.icon,
                    accent: roleMeta.accent,
                    sort_order: roleMeta.sortOrder,
                };
            })
            .sort((a, b) => {
                const orderA = a.sort_order ?? 999;
                const orderB = b.sort_order ?? 999;
                if (orderA !== orderB) {
                    return orderA - orderB;
                }
                return a.name.localeCompare(b.name);
            });
    }, [data]);

    return { data: contacts, isLoading, isRefreshing, refetch: refresh };
};
