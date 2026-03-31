import React from 'react';
import { View, Text } from 'react-native';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { useTheme } from '../../hooks/useTheme';

export const OfflineBanner: React.FC = () => {
    const { isOffline } = useOfflineStatus();
    const { colors } = useTheme();

    if (!isOffline) return null;

    return (
        <View style={{ backgroundColor: colors.textMuted }} className="py-2 items-center justify-center absolute bottom-0 w-full z-10 flex-row">
            <View style={{ width: 8, height: 12, backgroundColor: '#FFFFFF', borderRadius: 2, marginRight: 6 }} />
            <Text style={{ color: '#FFFFFF' }} className="font-sans text-xs">Offline • Updated Today</Text>
        </View>
    );
};