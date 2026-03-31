import { create } from 'zustand';

export interface BookingSummary {
    serviceId: string;
    serviceTitle: string;
    serviceCategory: string;
    dateLabel: string;
    timeLabel: string;
    amountLabel: string;
    notes?: string;
    confirmationId: string;
}

interface BookingState {
    currentBooking: BookingSummary | null;
    setBooking: (booking: BookingSummary) => void;
    clearBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
    currentBooking: null,
    setBooking: (currentBooking) => set({ currentBooking }),
    clearBooking: () => set({ currentBooking: null }),
}));
