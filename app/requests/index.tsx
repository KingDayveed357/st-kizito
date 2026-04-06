import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { Header } from '../../src/components/ui/Header';
import { useTheme } from '../../src/hooks/useTheme';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { getRequestHistory, RequestHistoryItem } from '../../src/services/requests/requestStore';
import { useFocusEffect } from 'expo-router';

const formatDate = (value: string) => {
    const date = new Date(value);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 0,
    }).format(amount);
};

const isPendingLong = (item: RequestHistoryItem) => {
    if (item.status !== 'pending') return false;
    const ageMs = Date.now() - new Date(item.createdAt).getTime();
    return ageMs > 48 * 60 * 60 * 1000;
};

const statusLabel = (value: RequestHistoryItem['status']) => value.charAt(0).toUpperCase() + value.slice(1);

export default function MyRequestsScreen() {
    const { colors, allColors } = useTheme();
    const [items, setItems] = useState<RequestHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadRequests = useCallback(async () => {
        const data = await getRequestHistory();
        setItems(data);
    }, []);

    useFocusEffect(
        useCallback(() => {
            let active = true;
            const run = async () => {
                try {
                    const data = await getRequestHistory();
                    if (active) {
                        setItems(data);
                    }
                } finally {
                    if (active) {
                        setIsLoading(false);
                    }
                }
            };

            run();
            return () => {
                active = false;
            };
        }, [])
    );

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await loadRequests();
        } finally {
            setIsRefreshing(false);
        }
    }, [loadRequests]);

    const statusTone = useMemo(() => {
        return {
            pending: { bg: `${allColors.warning}1A`, text: allColors.warning },
            approved: { bg: `${allColors.success}1A`, text: allColors.success },
            rejected: { bg: '#A955551A', text: '#A95555' },
        } as const;
    }, [allColors.success, allColors.warning]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header showBack title="My Requests" />

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 44 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
            >
                <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
                    Track your donation, mass booking, and thanksgiving requests with full transparency.
                </Text>

                {!isLoading && items.length === 0 ? (
                    <EmptyState title="No requests yet" subtitle="Your submitted requests will appear here." />
                ) : null}

                {items.map((item) => {
                    const tone = statusTone[item.status];
                    return (
                        <View
                            key={item.id}
                            style={{
                                borderRadius: 20,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: colors.border,
                                padding: 16,
                                marginBottom: 14,
                                shadowColor: '#000000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.06,
                                shadowRadius: 10,
                                elevation: 2,
                            }}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', textTransform: 'capitalize' }} className="font-serif">
                                    {item.type}
                                </Text>
                                <View style={{ borderRadius: 999, backgroundColor: tone.bg, paddingHorizontal: 10, paddingVertical: 5 }}>
                                    <Text style={{ color: tone.text, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 }}>
                                        {statusLabel(item.status)}
                                    </Text>
                                </View>
                            </View>

                            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4 }}>
                                Date: {formatDate(item.date)}
                            </Text>
                            {typeof item.amount === 'number' ? (
                                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                                    Amount: {formatCurrency(item.amount)}
                                </Text>
                            ) : null}

                            {isPendingLong(item) ? (
                                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 10 }}>
                                    Still pending? Please contact the parish office.
                                </Text>
                            ) : null}
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}
