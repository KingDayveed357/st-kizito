import { useMemo } from 'react';
import { getDivineOffice } from '../services/liturgicalData';

export const useDivineOffice = (date: string) => {
    const data = useMemo(() => getDivineOffice(date), [date]);

    return { data, isLoading: false };
};
