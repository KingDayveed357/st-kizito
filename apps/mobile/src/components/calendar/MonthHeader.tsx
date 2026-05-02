import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MonthHeaderProps {
    title: string;
    backgroundColor: string;
    textColor: string;
}

export const MonthHeader = memo(({ title, backgroundColor, textColor }: MonthHeaderProps) => (
    <View style={[styles.monthHeaderContainer, { backgroundColor }]}>
        <Text style={[styles.monthHeaderText, { color: textColor }]}>{title}</Text>
    </View>
));

const styles = StyleSheet.create({
    monthHeaderContainer: {
        height: 80,
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    monthHeaderText: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
});
