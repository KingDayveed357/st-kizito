import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { SkeletonLoader } from './SkeletonLoader';

interface SectionStateProps {
    isLoading: boolean;
    /** True when loading has finished and there is genuinely nothing to show. */
    isEmpty: boolean;
    /** What is absent — "No announcements yet". */
    emptyTitle: string;
    /** Why that is, and what happens next. Never a bare "Nothing here". */
    emptySubtitle: string;
    emptyIcon?: keyof typeof Ionicons.glyphMap;
    /** Offered on the offline variant, and on the empty state when a retry makes sense. */
    onRetry?: () => void;
    /** How many placeholder cards to show while loading. */
    skeletonCount?: number;
    skeletonHeight?: number;
    children: React.ReactNode;
}

/**
 * Loading / empty / offline wrapper for a section of a screen.
 *
 * The parish tab rendered `loadingX ? <View className="h-40" /> : items.map(...)` for all four of
 * its sections: an untextured blank box while loading, and — if the list came back empty — nothing
 * at all. A parishioner could not tell whether the parish had published no events, the fetch had
 * failed, or the app was still working.
 *
 * The offline case is called out separately because it is an expected state in this app rather than
 * a fault, and the advice differs: "reconnect to see this" versus "the parish has not posted any".
 */
export const SectionState: React.FC<SectionStateProps> = ({
    isLoading,
    isEmpty,
    emptyTitle,
    emptySubtitle,
    emptyIcon = 'document-text-outline',
    onRetry,
    skeletonCount = 3,
    skeletonHeight = 96,
    children,
}) => {
    const { colors } = useTheme();
    const { isOffline } = useOfflineStatus();

    if (isLoading) {
        return (
            <View accessibilityLabel="Loading">
                {Array.from({ length: skeletonCount }).map((_, index) => (
                    <View
                        key={`section-skeleton-${index}`}
                        style={{
                            borderRadius: 18,
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            padding: 16,
                            marginBottom: 14,
                        }}
                    >
                        <SkeletonLoader width="55%" height={16} />
                        <View style={{ height: 10 }} />
                        <SkeletonLoader width="100%" height={12} />
                        <View style={{ height: 6 }} />
                        <SkeletonLoader width="80%" height={12} />
                        <View style={{ height: Math.max(0, skeletonHeight - 82) }} />
                    </View>
                ))}
            </View>
        );
    }

    if (isEmpty) {
        // Nothing cached AND no connection: the list being empty says nothing about what the parish
        // has published, so do not imply that it has published nothing.
        if (isOffline) {
            return (
                <ErrorState
                    compact
                    isOffline
                    title="Not available offline"
                    subtitle="This hasn't been downloaded yet. Reconnect and it will appear here, then stay available offline."
                    onRetry={onRetry}
                />
            );
        }

        return (
            <EmptyState
                icon={<Ionicons name={emptyIcon} size={38} color={colors.textMuted} />}
                title={emptyTitle}
                subtitle={emptySubtitle}
                actionLabel={onRetry ? 'Refresh' : undefined}
                onAction={onRetry}
            />
        );
    }

    return <>{children}</>;
};
