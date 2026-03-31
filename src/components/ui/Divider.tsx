import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface DividerProps {
    thickness?: number;
    className?: string;
    marginVertical?: number;
}

export const Divider: React.FC<DividerProps> = ({ thickness = 1, className = '', marginVertical = 16 }) => {
    const { colors } = useTheme();

    const style: ViewStyle = {
        height: thickness,
        backgroundColor: colors.surfaceElevated,
        marginVertical,
        width: '100%',
    };

    return <View style={style} className={className} />;
};