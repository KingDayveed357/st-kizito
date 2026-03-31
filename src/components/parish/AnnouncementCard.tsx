import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../ui/Badge';

export interface AnnouncementType {
    id: string;
    title: string;
    excerpt: string;
    date: string;
    pinned?: boolean;
    author: string;
    authorInitials: string;
}

interface AnnouncementCardProps {
    announcement: AnnouncementType;
    onPress?: () => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement, onPress }) => {
    const { colors, allColors } = useTheme();

    return (
        <Card onPress={onPress} className="mb-4">
            <View className="flex-row items-start justify-between mb-2">
                <Ionicons name="megaphone" size={20} color={colors.accent} />
                <View className="flex-row items-center">
                    {announcement.pinned && (
                        <Badge label="PINNED" color={allColors.liturgical.christmasEaster} className="mr-2" />
                    )}
                    <View style={{ backgroundColor: colors.surfaceElevated }} className="rounded-md px-2 py-1">
                        <Text style={{ color: colors.textSecondary }} className="font-sans font-bold text-[10px] tracking-wider uppercase">
                            {announcement.date}
                        </Text>
                    </View>
                </View>
            </View>

            <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-[18px] leading-[22px] mb-2 mt-2">
                {announcement.title}
            </Text>

            <Text style={{ color: colors.textSecondary }} className="font-sans text-[13px] leading-[18px] mb-4" numberOfLines={2}>
                {announcement.excerpt}
            </Text>

            <View className="flex-row items-center">
                <View style={{ backgroundColor: colors.accent }} className="w-6 h-6 rounded-full items-center justify-center mr-2 relative">
                    <Text style={{ color: '#FFFFFF' }} className="font-sans font-bold text-[9px] absolute top-[5px] left-0 right-0 text-center">{announcement.authorInitials}</Text>
                </View>
                <Text style={{ color: colors.textPrimary }} className="font-sans text-[11px] leading-[11px]">{announcement.author}</Text>
            </View>
        </Card>
    );
};