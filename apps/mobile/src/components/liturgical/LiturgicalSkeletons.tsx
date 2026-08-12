import React from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { useTheme } from '../../hooks/useTheme';

const HORIZONTAL_PADDING = 24;

/**
 * Loading skeletons that mirror the real screen layout, replacing the previous bare blank views
 * (premium-UI standard: a skeleton matching the final layout, never an empty flash). Purely
 * presentational; animation lives in SkeletonLoader.
 */

export const ReadingsSkeleton: React.FC = () => {
    const { colors } = useTheme();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header: date title + controls */}
            <View style={{ paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <SkeletonLoader width={200} height={26} borderRadius={8} />
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <SkeletonLoader width={44} height={44} borderRadius={22} />
                        <SkeletonLoader width={44} height={44} borderRadius={22} />
                    </View>
                </View>
                {/* Meta row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
                    <SkeletonLoader width={7} height={7} borderRadius={999} />
                    <SkeletonLoader width={180} height={12} borderRadius={6} />
                </View>
            </View>

            {/* Tab pills */}
            <View
                style={{
                    flexDirection: 'row',
                    gap: 12,
                    paddingHorizontal: HORIZONTAL_PADDING,
                    paddingTop: 20,
                    paddingBottom: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.surfaceElevated,
                }}
            >
                <SkeletonLoader width={96} height={38} borderRadius={999} />
                <SkeletonLoader width={80} height={38} borderRadius={999} />
                <SkeletonLoader width={72} height={38} borderRadius={999} />
            </View>

            {/* Reading body */}
            <View style={{ paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 28 }}>
                <SkeletonLoader width={130} height={12} borderRadius={6} />
                <View style={{ height: 10 }} />
                <SkeletonLoader width={90} height={10} borderRadius={6} />
                <View style={{ height: 22 }} />
                <SkeletonLoader width="100%" height={14} borderRadius={6} lines={6} />

                {/* Psalm card */}
                <View
                    style={{
                        backgroundColor: colors.surfaceElevated,
                        borderRadius: 30,
                        paddingHorizontal: 24,
                        paddingVertical: 28,
                        marginTop: 32,
                        alignItems: 'center',
                    }}
                >
                    <SkeletonLoader width={120} height={12} borderRadius={6} />
                    <View style={{ height: 16 }} />
                    <SkeletonLoader width="80%" height={14} borderRadius={6} lines={3} />
                </View>
            </View>
        </SafeAreaView>
    );
};

export const DivineOfficeSkeleton: React.FC = () => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header bar */}
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <SkeletonLoader width={150} height={22} borderRadius={8} />
            </View>

            <View style={{ paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 8 }}>
                <SkeletonLoader width={140} height={10} borderRadius={6} />
                <View style={{ height: 10 }} />
                <SkeletonLoader width={220} height={30} borderRadius={8} />

                {/* Featured card */}
                <View
                    style={{
                        backgroundColor: colors.surfaceElevated,
                        borderRadius: 18,
                        padding: 16,
                        marginTop: 24,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 16,
                    }}
                >
                    <SkeletonLoader width={48} height={48} borderRadius={24} />
                    <View style={{ flex: 1 }}>
                        <SkeletonLoader width="60%" height={16} borderRadius={6} />
                        <View style={{ height: 8 }} />
                        <SkeletonLoader width="90%" height={12} borderRadius={6} />
                    </View>
                </View>

                {/* Hour rows */}
                <View style={{ marginTop: 24, gap: 16, paddingBottom: insets.bottom + 24 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <View
                            key={`office-skel-${i}`}
                            style={{
                                backgroundColor: colors.surface,
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: colors.surfaceElevated,
                                padding: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 16,
                            }}
                        >
                            <SkeletonLoader width={40} height={40} borderRadius={10} />
                            <View style={{ flex: 1 }}>
                                <SkeletonLoader width="50%" height={14} borderRadius={6} />
                                <View style={{ height: 8 }} />
                                <SkeletonLoader width={70} height={9} borderRadius={6} />
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </SafeAreaView>
    );
};
