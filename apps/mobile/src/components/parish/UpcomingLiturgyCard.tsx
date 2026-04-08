import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NextLiturgicalEvent } from '../../services/liturgyEvents';
import { useTheme } from '../../hooks/useTheme';
import { formatPremiumDate } from '../../utils/formatters';
import { SkeletonLoader } from '../ui/SkeletonLoader';

interface UpcomingLiturgyCardProps {
    event: NextLiturgicalEvent | null;
    isLoading: boolean;
    reminderEnabled: boolean;
    isTogglingReminder: boolean;
    onPressDetails: () => void;
    onToggleReminder: () => void;
}

const toTypeLabel = (type: NextLiturgicalEvent['type']) => {
    if (type === 'solemnity') return 'Solemnity';
    if (type === 'feast') return 'Feast';
    if (type === 'memorial') return 'Memorial';
    if (type === 'optional') return 'Optional Memorial';
    return 'Weekday';
};

const typeColor = (type: NextLiturgicalEvent['type'], colors: ReturnType<typeof useTheme>['allColors']) => {
    if (type === 'solemnity') return colors.liturgical.christmasEaster;
    if (type === 'feast') return colors.liturgical.marian;
    if (type === 'memorial') return colors.liturgical.adventLent;
    if (type === 'optional') return colors.warning;
    return colors.liturgical.ordinaryTime;
};

export const UpcomingLiturgyCard: React.FC<UpcomingLiturgyCardProps> = ({
    event,
    isLoading,
    reminderEnabled,
    isTogglingReminder,
    onPressDetails,
    onToggleReminder,
}) => {
    const { colors, allColors } = useTheme();

    if (isLoading) {
        return (
            <View
                style={{
                    borderRadius: 18,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 16,
                    marginBottom: 20,
                }}
            >
                <SkeletonLoader width={120} height={12} borderRadius={8} />
                <View style={{ height: 10 }} />
                <SkeletonLoader width="85%" height={22} borderRadius={8} />
                <View style={{ height: 8 }} />
                <SkeletonLoader width={110} height={14} borderRadius={8} />
                <View style={{ height: 18 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <SkeletonLoader width={90} height={36} borderRadius={18} />
                    <SkeletonLoader width={36} height={36} borderRadius={18} />
                </View>
            </View>
        );
    }

    if (!event) {
        return null;
    }

    const accent = typeColor(event.type, allColors);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const [year, month, day] = event.date.split('-').map(Number);
    const eventStart = new Date((year ?? today.getFullYear()), (month ?? 1) - 1, day ?? 1).getTime();
    const daysAway = Math.max(0, Math.round((eventStart - todayStart) / (24 * 60 * 60 * 1000)));

    return (
        <View
            style={{
                borderRadius: 22,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: `${accent}26`,
                padding: 18,
                marginBottom: 20,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 10,
                elevation: 2,
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' }}>
                        Upcoming Liturgy
                    </Text>
                    <Text style={{ color: accent, fontSize: 11, marginTop: 4, fontWeight: '700' }}>
                        {toTypeLabel(event.type)}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={onToggleReminder}
                    disabled={isTogglingReminder}
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: reminderEnabled ? `${accent}18` : colors.surfaceElevated,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: reminderEnabled ? `${accent}35` : colors.border,
                    }}
                >
                    <Ionicons
                        name={reminderEnabled ? 'notifications' : 'notifications-outline'}
                        size={18}
                        color={reminderEnabled ? accent : colors.textSecondary}
                    />
                </TouchableOpacity>
            </View>

            <View
                style={{
                    borderRadius: 14,
                    backgroundColor: `${accent}0D`,
                    borderWidth: 1,
                    borderColor: `${accent}22`,
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    alignSelf: 'flex-start',
                    marginBottom: 12,
                }}
            >
                <Text style={{ color: accent, fontSize: 11, fontWeight: '700' }}>
                    {daysAway <= 1 ? 'Tomorrow' : `In ${daysAway} days`}
                </Text>
            </View>

            <Text style={{ color: colors.textPrimary, fontSize: 21, fontWeight: '700', lineHeight: 29 }} className="font-serif">
                {event.title}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 7 }} className="font-sans">
                {formatPremiumDate(event.date)}
            </Text>

            <View
                style={{
                    marginTop: 14,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    paddingTop: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <TouchableOpacity
                    onPress={onPressDetails}
                    style={{
                        minHeight: 36,
                        borderRadius: 18,
                        paddingHorizontal: 14,
                        backgroundColor: `${accent}15`,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                    }}
                >
                    <Text style={{ color: accent, fontSize: 12, fontWeight: '700' }}>View Details</Text>
                    <Ionicons name="chevron-forward" size={14} color={accent} style={{ marginLeft: 4 }} />
                </TouchableOpacity>

                <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: `${accent}12` }}>
                    <Text style={{ color: accent, fontSize: 10, fontWeight: '700' }}>{toTypeLabel(event.type)}</Text>
                </View>
            </View>
        </View>
    );
};
