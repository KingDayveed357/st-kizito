import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { LiturgicalCelebration } from '../../services/calendarEngine';

interface CelebrationSelectorProps {
    variants: NonNullable<LiturgicalCelebration['variants']>;
    activeVariantId: string | null;
    onSelectVariant: (id: string) => void;
    accentColor: string;
}

export const CelebrationSelector: React.FC<CelebrationSelectorProps> = ({
    variants,
    activeVariantId,
    onSelectVariant,
    accentColor
}) => {
    const { colors } = useTheme();

    if (!variants || variants.length <= 1) return null;

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>SELECT MASS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.pillContainer, { backgroundColor: colors.surfaceElevated }]}>
                    {variants.map((v) => {
                        const isActive = (activeVariantId || variants[0].id) === v.id;
                        return (
                            <Pressable
                                key={v.id}
                                onPress={() => onSelectVariant(v.id)}
                                style={[
                                    styles.pill,
                                    { backgroundColor: isActive ? accentColor : 'transparent' }
                                ]}
                            >
                                <Text style={[
                                    styles.pillText,
                                    { color: isActive ? '#FFFFFF' : colors.textPrimary }
                                ]}>
                                    {v.title}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    label: {
        fontSize: 10,
        fontFamily: 'sans',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 8,
        paddingHorizontal: 24,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    pillContainer: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 4,
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        minWidth: 100,
    },
    pillText: {
        fontSize: 13,
        fontWeight: '700',
    }
});
