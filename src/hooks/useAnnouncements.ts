import { useState, useEffect } from 'react';

export const useAnnouncements = () => {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setData([
                {
                    id: '1',
                    title: 'Annual Harvest Thanksgiving & Bazaar',
                    excerpt: 'Join us for our biggest community celebration of the year. We are currently...',
                    date: '12 OCT',
                    pinned: true,
                    author: 'Parish Office',
                    authorInitials: 'SR'
                },
                {
                    id: '2',
                    title: 'Youth Ministry Outreach Program',
                    excerpt: 'Registration is now open for the winter outreach trip to the local shelter. Limited...',
                    date: '10 OCT',
                    pinned: false,
                    author: 'Youth Coordinator',
                    authorInitials: 'YM'
                }
            ]);
            setIsLoading(false);
        }, 300);
    }, []);

    return { data, isLoading };
};