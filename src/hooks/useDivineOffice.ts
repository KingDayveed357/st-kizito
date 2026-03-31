import { useState, useEffect } from 'react';

export const useDivineOffice = (prayerKey?: string) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Mocking return
        setTimeout(() => {
            setData([
                { id: '1', key: 'morning', title: 'Morning Prayer (Lauds)', timeLength: '~8 MIN', isCurrent: true, icon: 'sun' },
                { id: '2', key: 'midday', title: 'Midday Prayer (Terce)', timeLength: '~8 MIN', isCurrent: false, icon: 'partly-sunny' },
                { id: '3', key: 'evening', title: 'Evening Prayer (Vespers)', timeLength: '~8 MIN', isCurrent: false, icon: 'partly-sunny-outline' },
                { id: '4', key: 'night', title: 'Night Prayer (Compline)', timeLength: '~8 MIN', isCurrent: false, icon: 'moon' },
                { id: '5', key: 'creed', title: "The Apostles' Creed", timeLength: '~8 MIN', isCurrent: false, icon: 'book' },
                { id: '6', key: 'litany', title: 'Litany of the B.V.M', timeLength: '~8 MIN', isCurrent: false, icon: 'flower' },
            ]);
            setIsLoading(false);
        }, 300);
    }, [prayerKey]);

    return { data, isLoading };
};