import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { Header } from '../../src/components/ui/Header';
import { useTheme } from '../../src/hooks/useTheme';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { getRequestHistory, refreshRequestHistory, RequestHistoryItem } from '../../src/services/requests/requestStore';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

const formatTypeLabel = (value: RequestHistoryItem['type']) => {
    if (value === 'mass booking') return 'Mass Booking';
    if (value === 'thanksgiving') return 'Thanksgiving';
    return 'Donation';
};

export default function MyRequestsScreen() {
    const { colors, allColors } = useTheme();
    const [items, setItems] = useState<RequestHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadRequests = useCallback(async (syncRemote = false) => {
        const data = syncRemote ? await refreshRequestHistory() : await getRequestHistory();
        setItems(data);
    }, []);

    useFocusEffect(
        useCallback(() => {
            let active = true;
            const run = async () => {
                try {
                    const data = await refreshRequestHistory();
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
            await loadRequests(true);
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
                <View
                    style={{
                        borderRadius: 14,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        marginBottom: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="refresh-outline" size={14} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 8, flex: 1 }}>
                        Pull down to refresh request statuses from the parish office.
                    </Text>
                </View>

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
                                padding: 18,
                                marginBottom: 14,
                                shadowColor: '#000000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.06,
                                shadowRadius: 10,
                                elevation: 2,
                            }}
                        >
                            <Text
                                style={{
                                    color: colors.textMuted,
                                    fontSize: 10,
                                    fontWeight: '700',
                                    letterSpacing: 1.4,
                                    textTransform: 'uppercase',
                                    marginBottom: 8,
                                }}
                            >
                                Request
                            </Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700' }} className="font-serif">
                                    {formatTypeLabel(item.type)}
                                </Text>
                                <View style={{ borderRadius: 999, backgroundColor: tone.bg, paddingHorizontal: 10, paddingVertical: 5 }}>
                                    <Text style={{ color: tone.text, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 }}>
                                        {statusLabel(item.status)}
                                    </Text>
                                </View>
                            </View>

                            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 5 }}>
                                Date requested: {formatDate(item.date)}
                            </Text>
                            {typeof item.amount === 'number' ? (
                                <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 5 }}>
                                    Amount: {formatCurrency(item.amount)}
                                </Text>
                            ) : null}
                            {item.details?.paymentName ? (
                                <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 5 }}>
                                    Payment name: {item.details.paymentName}
                                </Text>
                            ) : null}
                            {item.details?.paymentReference ? (
                                <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 5 }}>
                                    Reference: {item.details.paymentReference}
                                </Text>
                            ) : null}
                            {item.details?.note ? (
                                <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 5 }} numberOfLines={2}>
                                    Intention: {item.details.note}
                                </Text>
                            ) : null}
                            {item.details?.purpose ? (
                                <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 5 }} numberOfLines={2}>
                                    Purpose: {item.details.purpose}
                                </Text>
                            ) : null}
                            {item.clientRequestId ? (
                                <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                                    Tracking ID: {item.clientRequestId.toUpperCase()}
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
