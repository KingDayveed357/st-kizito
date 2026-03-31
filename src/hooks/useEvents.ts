import { useState, useEffect } from 'react';

export const useEvents = () => {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setData([
                {
                    id: '1',
                    title: 'Rosary Month Evening Prayer',
                    day: '15',
                    month: 'OCT',
                    time: '6:30 PM',
                    location: 'Lady Chapel',
                    description: '"The Rosary is the most beautiful and...'
                },
                {
                    id: '2',
                    title: 'Marriage Encounter Workshop',
                    day: '22',
                    month: 'OCT',
                    time: '9:00 AM - 4:00 PM',
                    location: 'Parish Hall',
                    description: 'A transformative day for couples to...'
                }
            ]);
            setIsLoading(false);
        }, 300);
    }, []);

    return { data, isLoading };
};