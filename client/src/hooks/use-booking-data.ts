import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BookingData {
  // Basic info
  tvSize?: string;
  serviceType?: string;
  wallType?: string;
  mountType?: string;
  needsWallMount?: boolean;
  wallMountOption?: string;
  
  // Contact info
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    streetAddress?: string;
    town?: string;
    county?: string;
    eircode?: string;
  };
  
  // Photo and AI
  roomPhotoBase64?: string;
  roomAnalysis?: any;
  aiPreviewUrl?: string;
  photoStorageConsent?: boolean;
  
  // Addons and pricing
  addons?: Array<{
    key: string;
    name: string;
    price: number;
  }>;
  
  // Scheduling
  preferredDate?: string;
  preferredTime?: string;
  
  // Referral
  referralCode?: string;
  referralDiscount?: number;
  referralCodeId?: number;
  
  // Notes
  customerNotes?: string;
  
  // Totals
  totalPrice?: number;
  addonTotal?: number;
}

interface BookingStore {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  resetBookingData: () => void;
}

export const useBookingData = create<BookingStore>()(
  persist(
    (set) => ({
      bookingData: {},
      updateBookingData: (data) =>
        set((state) => ({
          bookingData: { ...state.bookingData, ...data },
        })),
      resetBookingData: () => set({ bookingData: {} }),
    }),
    {
      name: 'booking-data',
    }
  )
);