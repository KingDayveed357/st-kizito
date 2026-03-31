import { useState, useEffect } from 'react';

// Simplified for now, real implementation would use @react-native-community/netinfo
export const useOfflineStatus = () => {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        // Stub: in reality add NetInfo listener
        // NetInfo.addEventListener(state => setIsOffline(!state.isConnected));
    }, []);

    return { isOffline };
};