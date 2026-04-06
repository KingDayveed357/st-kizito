import { useState, useEffect, useCallback } from 'react';

export const useGallery = () => {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 300));
        setData([
            { id: '1', uri: 'https://images.unsplash.com/photo-1548625361-ec853f65e4ff?q=80&w=600&auto=format&fit=crop' },
            { id: '2', uri: 'https://images.unsplash.com/photo-1519690889869-e705e59f72d1?q=80&w=600&auto=format&fit=crop' },
            { id: '3', uri: 'https://images.unsplash.com/photo-1582035900593-dbabbdbf3780?q=80&w=600&auto=format&fit=crop' },
            { id: '4', uri: 'https://images.unsplash.com/photo-1544027738-f14dce123bc6?q=80&w=600&auto=format&fit=crop' },
        ]);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, refetch };
};
