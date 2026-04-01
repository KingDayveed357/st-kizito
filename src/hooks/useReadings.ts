import { useMemo } from 'react';
import { getReadings } from '../services/liturgicalData';

export const useReadings = (date: string) => {
    const data = useMemo(() => getReadings(date), [date]);

    return { data, isLoading: false, isOffline: true, lastSynced: null };
};
