import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';

export interface EventType {
    id: string;
    title: string;
    day: string;
    month: string;
    time: string;
    location: string;
    description: string;
}

interface EventCardProps {
    event: EventType;
    onPress?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
    const { colors } = useTheme();

    return (
        <Card onPress={onPress} className="mb-4">
            <View className="flex-row items-start">
                <View style={{ backgroundColor: colors.surfaceElevated }} className="rounded-xl p-3 items-center justify-center w-14 mr-4">
                    <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-xl leading-none mb-1">
                        {event.day}
                    </Text>
                    <Text style={{ color: colors.textSecondary }} className="font-sans font-bold text-[10px] uppercase tracking-wider leading-none">
                        {event.month}
                    </Text>
                </View>
                <View className="flex-1 justify-center">
                    <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-[16px] leading-[20px] mb-1">
                        {event.title}
                    </Text>
                    <Text style={{ color: colors.textSecondary }} className="font-sans text-[12px] mb-2">
                        {event.time} • {event.location}
                    </Text>
                    <Text style={{ color: colors.textMuted }} className="font-serif italic text-[12px] leading-[16px]" numberOfLines={1}>
                        {event.description}
                    </Text>
                </View>
            </View>
        </Card>
    );
};