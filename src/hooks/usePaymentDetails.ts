import { parishService } from '../services/api/parishService';
import { useCachedData } from './useCachedData';
import { STORAGE_KEYS } from '../utils/constants';

type PaymentDetails = {
    id: string;
    bank_name: string | null;
    account_name: string | null;
    account_number: string | null;
};

export const usePaymentDetails = () => {
    const { data, isLoading, isRefreshing, refresh } = useCachedData<PaymentDetails>(
        STORAGE_KEYS.parishPaymentDetails,
        async () => {
            const { data: remote, error } = await parishService.fetchPaymentDetails();
            if (error || !remote) {
                throw new Error('Unable to load parish payment details');
            }
            return remote as PaymentDetails;
        }
    );

    return { data, isLoading, isRefreshing, refetch: refresh };
};
