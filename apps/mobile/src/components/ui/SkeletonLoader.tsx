import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface SkeletonLoaderProps {
    width: number | string;
    height: number | string;
    borderRadius?: number;
    lines?: number;
    className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ width, height, borderRadius = 8, lines = 1, className = '' }) => {
    const { colors } = useTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, [opacity]);

    const style: ViewStyle = {
        backgroundColor: colors.surfaceElevated,
        width: width as any,
        height: height as any,
        borderRadius,
        marginBottom: lines > 1 ? 8 : 0,
    };

    if (lines > 1) {
        return (
            <View>
                {Array.from({ length: lines }).map((_, i) => (
                    <Animated.View key={`skel-${i}`} style={[style, { opacity }]} className={className} />
                ))}
            </View>
        );
    }

    return <Animated.View style={[style, { opacity }]} className={className} />;
};