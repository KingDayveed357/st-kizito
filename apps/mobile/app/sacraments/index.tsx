import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { SkeletonLoader } from '../../src/components/ui/SkeletonLoader';
import { useSacramentTypes } from '../../src/hooks/useSacramentTypes';
import { useOfflineStatus } from '../../src/hooks/useOfflineStatus';
import {
    getSacramentRequests,
    refreshSacramentRequests,
    SacramentRequestRecord,
} from '../../src/services/requests/sacramentRequestStore';
import type { SacramentRequestStatus } from '../../src/types/sacrament.types';

/**
 * Status labels and colours.
 *
 * These are exactly the four values the database allows (`sacrament_requests.status`); nothing here
 * invents a "processing" or "completed" state the backend cannot produce.
 */
const STATUS_META: Record<SacramentRequestStatus, { label: string; short: string; color: string }> = {
    pending: { label: 'Pending Review', short: 'Pending', color: '#B4881F' },
    approved: { label: 'Approved', short: 'Approved', color: '#2E7D46' },
    rejected: { label: 'Declined', short: 'Declined', color: '#B5303C' },
    needs_info: { label: 'More Info Needed', short: 'Needs info', color: '#5E6F8E' },
};

const STATUS_ORDER: SacramentRequestStatus[] = ['pending', 'needs_info', 'approved', 'rejected'];

/** Date filters, expressed as how far back to include. `null` means no date limit. */
const DATE_FILTERS = [
    { key: 'all', label: 'Any time', days: null },
    { key: '30d', label: 'Last 30 days', days: 30 },
    { key: '90d', label: 'Last 3 months', days: 90 },
    { key: 'year', label: 'Last year', days: 365 },
] as const;

type DateFilterKey = (typeof DATE_FILTERS)[number]['key'];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const formatRequestDate = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function SacramentsScreen() {
    const { colors, allColors } = useTheme();
    const router = useRouter();
    const { types, isLoading: typesLoading, refetch: refetchTypes } = useSacramentTypes();
    const { isOffline } = useOfflineStatus();
    const accent = allColors.liturgical.ordinaryTime;

    const [requests, setRequests] = useState<SacramentRequestRecord[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    // The screen used to jump straight from nothing to content with no indication it was working,
    // so a slow first load looked like an empty account.
    const [isLoadingRequests, setIsLoadingRequests] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);

    const [statusFilters, setStatusFilters] = useState<SacramentRequestStatus[]>([]);
    const [dateFilter, setDateFilter] = useState<DateFilterKey>('all');

    const load = useCallback(async () => {
        try {
            // Cached first so something is on screen immediately, then the server's view of the
            // statuses. A failed sync is not fatal — the cache is still valid and worth showing.
            const cached = await getSacramentRequests();
            setRequests(cached);
            setIsLoadingRequests(false);

            const synced = await refreshSacramentRequests();
            setRequests(synced);
            setLoadFailed(false);
        } catch {
            setLoadFailed(true);
        } finally {
            setIsLoadingRequests(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load]),
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    const toggleStatus = useCallback((status: SacramentRequestStatus) => {
        setStatusFilters((current) =>
            current.includes(status) ? current.filter((s) => s !== status) : [...current, status],
        );
    }, []);

    const hasActiveFilters = statusFilters.length > 0 || dateFilter !== 'all';

    const resetFilters = useCallback(() => {
        setStatusFilters([]);
        setDateFilter('all');
    }, []);

    const visibleRequests = useMemo(() => {
        const cutoffDays = DATE_FILTERS.find((f) => f.key === dateFilter)?.days ?? null;
        const cutoff = cutoffDays === null ? null : Date.now() - cutoffDays * MS_PER_DAY;

        return requests.filter((r) => {
            if (statusFilters.length > 0 && !statusFilters.includes(r.status)) return false;
            if (cutoff !== null) {
                const created = new Date(r.createdAt).getTime();
                // A record with an unreadable date is kept rather than silently hidden — losing a
                // request from the list is worse than showing one outside the window.
                if (!Number.isNaN(created) && created < cutoff) return false;
            }
            return true;
        });
    }, [requests, statusFilters, dateFilter]);

    /** Only offer a status chip the user actually has requests in. */
    const availableStatuses = useMemo(
        () => STATUS_ORDER.filter((s) => requests.some((r) => r.status === s)),
        [requests],
    );

    const renderRequestCard = (r: SacramentRequestRecord) => {
        const meta = STATUS_META[r.status];
        return (
            <View
                key={r.id}
                style={{
                    borderRadius: 18,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 16,
                    marginBottom: 12,
                }}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700', flex: 1 }}>
                        {r.typeTitle}
                    </Text>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: `${meta.color}18` }}>
                        <Text style={{ color: meta.color, fontSize: 11, fontWeight: '800' }}>{meta.label}</Text>
                    </View>
                </View>

                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                    {r.fullName}
                    {r.createdAt ? ` · ${formatRequestDate(r.createdAt)}` : ''}
                </Text>

                {r.queuedOffline && (
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>
                        Saved offline — will submit when you reconnect.
                    </Text>
                )}

                {r.adminNote ? (
                    <View style={{ marginTop: 10, borderLeftWidth: 3, borderLeftColor: meta.color, paddingLeft: 10 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>{r.adminNote}</Text>
                    </View>
                ) : null}
            </View>
        );
    };

    const renderMyRequests = () => {
        if (isLoadingRequests) {
            return (
                <View accessibilityLabel="Loading your requests">
                    {[0, 1, 2].map((i) => (
                        <View
                            key={i}
                            style={{
                                borderRadius: 18,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: colors.border,
                                padding: 16,
                                marginBottom: 12,
                            }}
                        >
                            <SkeletonLoader width="55%" height={16} />
                            <View style={{ height: 8 }} />
                            <SkeletonLoader width="35%" height={12} />
                        </View>
                    ))}
                </View>
            );
        }

        if (loadFailed && requests.length === 0) {
            return (
                <ErrorState
                    compact
                    isOffline={isOffline}
                    title={isOffline ? "You're offline" : "We couldn't load your requests"}
                    subtitle={
                        isOffline
                            ? 'Your requests will appear here once you reconnect. Anything you submit now is saved and sent automatically.'
                            : 'Your requests are safe — this was only a problem fetching their latest status.'
                    }
                    onRetry={onRefresh}
                />
            );
        }

        if (requests.length === 0) {
            return (
                <EmptyState
                    icon={<Ionicons name="document-text-outline" size={38} color={colors.textMuted} />}
                    title="No requests yet"
                    subtitle="When you request a parish record, it will appear here with its status as the parish office reviews it."
                />
            );
        }

        if (visibleRequests.length === 0) {
            return (
                <EmptyState
                    icon={<Ionicons name="funnel-outline" size={38} color={colors.textMuted} />}
                    title="Nothing matches these filters"
                    subtitle={`You have ${requests.length} request${requests.length === 1 ? '' : 's'}, but none in the selected status or time range.`}
                    actionLabel="Clear filters"
                    onAction={resetFilters}
                />
            );
        }

        return <>{visibleRequests.map(renderRequestCard)}</>;
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header showBack title="Sacramental Requests" />
            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
            >
                <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 18 }}>
                    Request parish records and sacramental documents. The parish office will review and update you here.
                </Text>

                {/* Available request types */}
                {typesLoading && types.length === 0 ? (
                    <View accessibilityLabel="Loading available requests">
                        {[0, 1].map((i) => (
                            <View
                                key={i}
                                style={{
                                    borderRadius: 20,
                                    backgroundColor: colors.surface,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    padding: 18,
                                    marginBottom: 14,
                                }}
                            >
                                <SkeletonLoader width="60%" height={18} />
                                <View style={{ height: 8 }} />
                                <SkeletonLoader width="85%" height={12} />
                            </View>
                        ))}
                    </View>
                ) : types.length === 0 ? (
                    <ErrorState
                        compact
                        isOffline={isOffline}
                        title="No requests are available right now"
                        subtitle={
                            isOffline
                                ? 'Connect to the internet to see what the parish office is currently accepting.'
                                : 'The parish office has not published any request types yet. Please try again later, or contact the office directly.'
                        }
                        onRetry={refetchTypes}
                    />
                ) : (
                    types.map((t) => (
                        <TouchableOpacity
                            key={t.type}
                            accessibilityRole="button"
                            accessibilityLabel={`${t.title}. ${t.is_free ? 'Free' : `₦${t.amount.toLocaleString()}`}.`}
                            activeOpacity={0.85}
                            onPress={() => router.push(`/sacraments/${t.type}`)}
                            style={{
                                flexDirection: 'row', alignItems: 'center', gap: 14,
                                borderRadius: 20, backgroundColor: colors.surface,
                                borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 14,
                            }}
                        >
                            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: `${accent}18`, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name={(t.icon as any) ?? 'document-text-outline'} size={22} color={accent} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', fontFamily: 'Georgia' }}>{t.title}</Text>
                                {t.description ? (
                                    <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 2 }} numberOfLines={2}>{t.description}</Text>
                                ) : null}
                            </View>
                            <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: `${accent}14` }}>
                                <Text style={{ color: accent, fontSize: 10, fontWeight: '800' }}>{t.is_free ? 'FREE' : `₦${t.amount.toLocaleString()}`}</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}

                {/* My requests */}
                <View style={{ marginTop: 26 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700', fontFamily: 'Georgia' }}>
                            My Requests
                        </Text>
                        {hasActiveFilters ? (
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Clear all filters"
                                onPress={resetFilters}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Text style={{ color: accent, fontSize: 13, fontWeight: '700' }}>Clear filters</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {/*
                      Filters are only worth the vertical space once there is enough to sift through.
                      Below that threshold the whole list fits on one screen and a filter bar is
                      just noise above it.
                    */}
                    {requests.length >= 4 ? (
                        <View style={{ marginBottom: 16 }}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 8, paddingRight: 8 }}
                            >
                                {availableStatuses.map((status) => {
                                    const active = statusFilters.includes(status);
                                    const meta = STATUS_META[status];
                                    return (
                                        <TouchableOpacity
                                            key={status}
                                            accessibilityRole="button"
                                            accessibilityState={{ selected: active }}
                                            accessibilityLabel={`Filter by ${meta.label}`}
                                            activeOpacity={0.85}
                                            onPress={() => toggleStatus(status)}
                                            style={{
                                                minHeight: 36,
                                                justifyContent: 'center',
                                                paddingHorizontal: 14,
                                                borderRadius: 999,
                                                borderWidth: 1,
                                                borderColor: active ? meta.color : colors.border,
                                                backgroundColor: active ? `${meta.color}18` : colors.surface,
                                            }}
                                        >
                                            <Text style={{ color: active ? meta.color : colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                                                {meta.short}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 8, paddingRight: 8, marginTop: 8 }}
                            >
                                {DATE_FILTERS.map((filter) => {
                                    const active = dateFilter === filter.key;
                                    return (
                                        <TouchableOpacity
                                            key={filter.key}
                                            accessibilityRole="button"
                                            accessibilityState={{ selected: active }}
                                            accessibilityLabel={`Show requests from ${filter.label}`}
                                            activeOpacity={0.85}
                                            onPress={() => setDateFilter(filter.key)}
                                            style={{
                                                minHeight: 36,
                                                justifyContent: 'center',
                                                paddingHorizontal: 14,
                                                borderRadius: 999,
                                                borderWidth: 1,
                                                borderColor: active ? accent : colors.border,
                                                backgroundColor: active ? `${accent}18` : colors.surface,
                                            }}
                                        >
                                            <Text style={{ color: active ? accent : colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                                                {filter.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    ) : null}

                    {renderMyRequests()}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
