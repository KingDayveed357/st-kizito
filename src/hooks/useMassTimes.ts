import { useState, useEffect } from 'react';
import { MassTime } from '../components/parish/MassTimeRow';

export const useMassTimes = () => {
    const [data, setData] = useState<(MassTime & { id: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            const today = new Date().getDay(); // 0 = Sun, 6 = Sat

            setData([
                {
                    id: '1',
                    day: 'Mon – Fri',
                    morning: '6:30 AM',
                    evening: '6:00 PM',
                    isHighlighted: today >= 1 && today <= 5,
                },
                {
                    id: '2',
                    day: 'Saturday',
                    morning: '7:00 AM',
                    evening: '5:30 PM\nVigil Mass',
                    hasSubscript: true,
                    isHighlighted: today === 6,
                },
                {
                    id: '3',
                    day: 'Sunday',
                    morning: '7:30 AM\nEnglish\n9:30 AM\nSwahili',
                    evening: '11:30 AM\nYouth Mass',
                    isHighlighted: today === 0,
                },
            ]);
            setIsLoading(false);
        }, 300);
    }, []);

    return { data, isLoading };
};