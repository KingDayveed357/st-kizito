import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface SegmentedControlProps {
    options: string[];
    selected: string;
    onChange: (value: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, selected, onChange }) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
            {options.map((option) => {
                const isSelected = selected === option;
                return (
                    <TouchableOpacity
                        key={option}
                        style={[
                            styles.tab,
                            isSelected && { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }
                        ]}
                        onPress={() => onChange(option)}
                    >
                        <Text style={[
                            styles.label,
                            { color: isSelected ? colors.textPrimary : colors.textSecondary },
                            isSelected && { fontWeight: 'bold' }
                        ]}>
                            {option}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    label: {
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});
