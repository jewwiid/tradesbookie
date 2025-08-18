import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TvInstallation {
  tvSize: string;
  serviceType: string;
  wallType: string;
  mountType: string;
  needsWallMount: boolean;
  wallMountOption?: string;
  location?: string; // e.g., "Living Room", "Bedroom", "Kitchen"
  addons: Array<{
    key: string;
    name: string;
    price: number;
  }>;
  estimatedPrice: number;
  estimatedAddonsPrice: number;
  estimatedTotal: number;
  // Photo and AI analysis fields for individual TVs
  roomPhotoBase64?: string;
  roomAnalysis?: any;
  aiPreviewUrl?: string;
}

interface BookingData {
  // Multi-TV support
  tvQuantity?: number;
  tvInstallations?: TvInstallation[];
  currentTvIndex?: number;
  
  // Direct installer booking support
  directBooking?: boolean;
  preselectedInstallerId?: number;
  installerInfo?: {
    id: number;
    businessName: string;
    contactName: string;
    serviceArea: string;
    profileImageUrl?: string;
    isAvailable?: boolean;
  };
  
  // Legacy single TV fields (for backward compatibility)
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
  
  // Legacy addons (for backward compatibility)
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
  // Multi-TV specific methods
  initializeMultiTvBooking: (tvQuantity: number) => void;
  updateTvInstallation: (index: number, data: Partial<TvInstallation>) => void;
  updateCurrentTvInstallation: (data: Partial<TvInstallation>) => void;
  calculateTotalPrice: () => number;
  getCurrentTv: () => TvInstallation | undefined;
  isMultiTvBooking: () => boolean;
  // Direct installer booking methods
  setDirectInstaller: (installerId: number, installerInfo: any) => void;
  isDirectBooking: () => boolean;
}

export const useBookingData = create<BookingStore>()(
  persist(
    (set, get) => ({
      bookingData: {},
      updateBookingData: (data) =>
        set((state) => ({
          bookingData: { ...state.bookingData, ...data },
        })),
      resetBookingData: () => set({ bookingData: {} }),
      
      // Multi-TV specific methods
      initializeMultiTvBooking: (tvQuantity: number) =>
        set((state) => {
          const tvInstallations: TvInstallation[] = Array.from({ length: tvQuantity }, (_, index) => ({
            tvSize: '',
            serviceType: '',
            wallType: '',
            mountType: '',
            needsWallMount: false,
            wallMountOption: undefined,
            location: `TV ${index + 1}`,
            addons: [],
            estimatedPrice: 0,
            estimatedAddonsPrice: 0,
            estimatedTotal: 0,
          }));
          
          return {
            bookingData: {
              ...state.bookingData,
              tvQuantity,
              tvInstallations,
              currentTvIndex: 0,
            },
          };
        }),
      
      updateTvInstallation: (index: number, data: Partial<TvInstallation>) =>
        set((state) => {
          if (!state.bookingData.tvInstallations || index < 0 || index >= state.bookingData.tvInstallations.length) {
            return state;
          }
          
          const updatedInstallations = [...state.bookingData.tvInstallations];
          updatedInstallations[index] = {
            ...updatedInstallations[index],
            ...data,
          };
          
          return {
            bookingData: {
              ...state.bookingData,
              tvInstallations: updatedInstallations,
            },
          };
        }),
      
      updateCurrentTvInstallation: (data: Partial<TvInstallation>) => {
        const { bookingData } = get();
        const currentIndex = bookingData.currentTvIndex || 0;
        get().updateTvInstallation(currentIndex, data);
      },
      
      calculateTotalPrice: () => {
        const { bookingData } = get();
        
        if (bookingData.tvInstallations && bookingData.tvInstallations.length > 0) {
          // Multi-TV booking: sum up all TV installations
          return bookingData.tvInstallations.reduce((total, tv) => total + tv.estimatedTotal, 0);
        } else {
          // Legacy single TV booking
          return (bookingData.totalPrice || 0) + (bookingData.addonTotal || 0);
        }
      },
      
      getCurrentTv: () => {
        const { bookingData } = get();
        if (!bookingData.tvInstallations || bookingData.currentTvIndex === undefined) {
          return undefined;
        }
        return bookingData.tvInstallations[bookingData.currentTvIndex];
      },
      
      isMultiTvBooking: () => {
        const { bookingData } = get();
        return !!(bookingData.tvQuantity && bookingData.tvQuantity > 1 && bookingData.tvInstallations);
      },
      
      // Direct installer booking methods
      setDirectInstaller: (installerId: number, installerInfo: any) =>
        set((state) => ({
          bookingData: {
            ...state.bookingData,
            directBooking: true,
            preselectedInstallerId: installerId,
            installerInfo,
          },
        })),
      
      isDirectBooking: () => {
        const { bookingData } = get();
        return !!bookingData.directBooking;
      },
    }),
    {
      name: 'booking-data',
    }
  )
);