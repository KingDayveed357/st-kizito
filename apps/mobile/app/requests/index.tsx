import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { Header } from '../../src/components/ui/Header';
import { useTheme } from '../../src/hooks/useTheme';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { getRequestHistory, refreshRequestHistory, RequestHistoryItem, RequestType } from '../../src/services/requests/requestStore';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SkeletonLoader } from '../../src/components/ui/SkeletonLoader';

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

const RequestCardSkeleton = ({ colors }: { colors: any }) => (
    <View
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
        <SkeletonLoader width={60} height={12} borderRadius={4} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 16 }}>
            <SkeletonLoader width={140} height={20} borderRadius={6} />
            <SkeletonLoader width={70} height={24} borderRadius={12} />
        </View>

        <SkeletonLoader width="70%" height={14} borderRadius={4} />
        <View style={{ height: 8 }} />
        <SkeletonLoader width="50%" height={14} borderRadius={4} />
        <View style={{ height: 8 }} />
        <SkeletonLoader width="85%" height={14} borderRadius={4} />

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: colors.border, marginTop: 16, marginBottom: 16 }} />

        {/* Tracking ID Skeleton */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
                <SkeletonLoader width={80} height={10} borderRadius={3} />
                <View style={{ height: 6 }} />
                <SkeletonLoader width={160} height={16} borderRadius={4} />
            </View>
            <SkeletonLoader width={64} height={28} borderRadius={10} />
        </View>
    </View>
);

export default function MyRequestsScreen() {
    const { colors, allColors } = useTheme();
    const [items, setItems] = useState<RequestHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    /** Tracks which tracking ID was most recently copied for the flash feedback. */
    const [copiedId, setCopiedId] = useState<string | null>(null);

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

    const [filterType, setFilterType] = useState<RequestType | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<RequestHistoryItem['status'] | 'all'>('all');

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            if (filterType !== 'all' && item.type !== filterType) return false;
            if (filterStatus !== 'all' && item.status !== filterStatus) return false;
            return true;
        });
    }, [items, filterType, filterStatus]);

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await loadRequests(true);
        } finally {
            setIsRefreshing(false);
        }
    }, [loadRequests]);

    const copyTrackingId = useCallback(async (id: string) => {
        try {
            // Lazy-load expo-clipboard so a build without it degrades gracefully.
            const Clipboard = require('expo-clipboard');
            await Clipboard.setStringAsync(id.toUpperCase());
            setCopiedId(id);
            setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
        } catch {
            // If clipboard is unavailable (e.g. old Expo Go), fail silently.
        }
    }, []);

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

                {/* Filters */}
                <View style={{ marginBottom: 16 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
                        {(['all', 'mass booking', 'donation', 'thanksgiving'] as const).map(type => (
                            <View 
                                key={type}
                                style={{
                                    backgroundColor: filterType === type ? colors.accent : colors.surfaceElevated,
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    borderRadius: 999,
                                    borderWidth: 1,
                                    borderColor: filterType === type ? colors.accent : colors.border,
                                }}
                                // @ts-ignore
                                onStartShouldSetResponder={() => true}
                                onResponderRelease={() => setFilterType(type)}
                            >
                                <Text style={{ 
                                    color: filterType === type ? '#FFFFFF' : colors.textPrimary,
                                    fontSize: 13,
                                    fontWeight: '600'
                                }}>
                                    {type === 'all' ? 'All Types' : formatTypeLabel(type)}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
                            <View 
                                key={status}
                                style={{
                                    backgroundColor: filterStatus === status ? colors.textPrimary : colors.surfaceElevated,
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    borderRadius: 999,
                                    borderWidth: 1,
                                    borderColor: filterStatus === status ? colors.textPrimary : colors.border,
                                }}
                                // @ts-ignore
                                onStartShouldSetResponder={() => true}
                                onResponderRelease={() => setFilterStatus(status)}
                            >
                                <Text style={{ 
                                    color: filterStatus === status ? colors.background : colors.textPrimary,
                                    fontSize: 13,
                                    fontWeight: '600'
                                }}>
                                    {status === 'all' ? 'All Status' : statusLabel(status)}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {isLoading ? (
                    <>
                        <RequestCardSkeleton colors={colors} />
                        <RequestCardSkeleton colors={colors} />
                        <RequestCardSkeleton colors={colors} />
                    </>
                ) : filteredItems.length === 0 ? (
                    <EmptyState title="No requests found" subtitle="Try adjusting your filters or pull to refresh." />
                ) : (
                    filteredItems.map((item) => {
                        const tone = statusTone[item.status];
                        const isCopied = copiedId === item.clientRequestId;
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
                                <>
                                    {/* Divider */}
                                    <View style={{ height: 1, backgroundColor: colors.border, marginTop: 10, marginBottom: 10 }} />
                                    {/*
                                     * Tracking ID — visible and copyable.
                                     * Parishioners share this with the parish office to resolve queries
                                     * or check on delayed approvals. The "Copied!" flash confirms the
                                     * tap registered without needing an external toast.
                                     */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 3 }}>
                                                Tracking ID
                                            </Text>
                                            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600', fontFamily: 'monospace', letterSpacing: 0.5 }}>
                                                {item.clientRequestId.toUpperCase()}
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                borderRadius: 10,
                                                borderWidth: 1,
                                                borderColor: isCopied ? `${allColors.success}55` : colors.border,
                                                backgroundColor: isCopied ? `${allColors.success}12` : '#00000005',
                                                paddingHorizontal: 10,
                                                paddingVertical: 6,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 5,
                                            }}
                                            // @ts-ignore — pressable via onStartShouldSetResponder for React Native compatibility
                                            onStartShouldSetResponder={() => true}
                                            onResponderRelease={() => void copyTrackingId(item.clientRequestId!)}
                                        >
                                            <Ionicons
                                                name={isCopied ? 'checkmark' : 'copy-outline'}
                                                size={14}
                                                color={isCopied ? allColors.success : colors.textSecondary}
                                            />
                                            <Text style={{ color: isCopied ? allColors.success : colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
                                                {isCopied ? 'Copied!' : 'Copy'}
                                            </Text>
                                        </View>
                                    </View>
                                </>
                            ) : null}

                            {isPendingLong(item) ? (
                                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 10 }}>
                                    Still pending? Please contact the parish office.
                                </Text>
                            ) : null}
                        </View>
                    );
                }))}
            </ScrollView>
        </SafeAreaView>
    );
}
