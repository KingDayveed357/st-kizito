import { Ionicons } from '@expo/vector-icons';

export type ContactRoleMeta = {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    accent: string;
    sortOrder: number;
};

const DEFAULT_META: ContactRoleMeta = {
    icon: 'call-outline',
    accent: '#4A7C59',
    sortOrder: 90,
};

const ROLE_RULES: Array<{ pattern: RegExp; meta: ContactRoleMeta }> = [
    {
        pattern: /secretary|office|administrator|admin/i,
        meta: { icon: 'document-text-outline', accent: '#5E6F8E', sortOrder: 10 },
    },
    {
        pattern: /catechist|catechesis|faith formation|rcia|teacher|education/i,
        meta: { icon: 'book-outline', accent: '#C9A84C', sortOrder: 20 },
    },
    {
        pattern: /counsellor|counselor|pastoral|counselling|counseling/i,
        meta: { icon: 'heart-circle-outline', accent: '#B5303C', sortOrder: 30 },
    },
    {
        pattern: /priest|father|fr\.?/i,
        meta: { icon: 'person-outline', accent: '#4A7C59', sortOrder: 40 },
    },
    {
        pattern: /choir|youth|group|team|ministry|committee/i,
        meta: { icon: 'people-outline', accent: '#7A6B4A', sortOrder: 50 },
    },
];

export const getContactRoleMeta = (role: string | null | undefined): ContactRoleMeta => {
    const value = String(role ?? '').trim();
    if (!value) {
        return DEFAULT_META;
    }

    const matched = ROLE_RULES.find((rule) => rule.pattern.test(value));
    return matched?.meta ?? DEFAULT_META;
};
