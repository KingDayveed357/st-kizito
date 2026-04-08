import { useState, useEffect } from 'react';

export const useJobs = () => {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setData([
                { id: '1', title: 'Youth Minister', company: 'St. Kizito Parish' }
            ]);
            setIsLoading(false);
        }, 300);
    }, []);

    return { data, isLoading };
};