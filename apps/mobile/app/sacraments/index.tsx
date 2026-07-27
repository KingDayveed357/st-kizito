import React, { useCallback, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { useSacramentTypes } from '../../src/hooks/useSacramentTypes';
import {
    getSacramentRequests,
    refreshSacramentRequests,
    SacramentRequestRecord,
} from '../../src/services/requests/sacramentRequestStore';
import type { SacramentRequestStatus } from '../../src/types/sacrament.types';

const STATUS_META: Record<SacramentRequestStatus, { label: string; color: string }> = {
    pending: { label: 'Pending Review', color: '#B4881F' },
    approved: { label: 'Approved', color: '#2E7D46' },
    rejected: { label: 'Declined', color: '#B5303C' },
    needs_info: { label: 'More Info Needed', color: '#5E6F8E' },
};

export default function SacramentsScreen() {
    const { colors, allColors } = useTheme();
    const router = useRouter();
    const { types } = useSacramentTypes();
    const accent = allColors.liturgical.ordinaryTime;

    const [requests, setRequests] = useState<SacramentRequestRecord[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadCached = useCallback(async () => {
        setRequests(await getSacramentRequests());
    }, []);

    const sync = useCallback(async () => {
        setRequests(await refreshSacramentRequests());
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadCached().then(sync);
        }, [loadCached, sync]),
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await sync();
        setRefreshing(false);
    }, [sync]);

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
                {types.map((t) => (
                    <TouchableOpacity
                        key={t.type}
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
                ))}

                {/* My requests */}
                {requests.length > 0 && (
                    <View style={{ marginTop: 22 }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700', fontFamily: 'Georgia', marginBottom: 12 }}>
                            My Requests
                        </Text>
                        {requests.map((r) => {
                            const meta = STATUS_META[r.status];
                            return (
                                <View key={r.id} style={{ borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>{r.typeTitle}</Text>
                                        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: `${meta.color}18` }}>
                                            <Text style={{ color: meta.color, fontSize: 11, fontWeight: '800' }}>{meta.label}</Text>
                                        </View>
                                    </View>
                                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{r.fullName}</Text>
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
                        })}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
