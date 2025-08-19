import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BookingData as BaseBookingData, TVInstallation } from '@/lib/booking-utils';

interface ExtendedBookingData {
  // Multi-TV support
  tvQuantity?: number;
  tvInstallations?: TVInstallation[];
  currentTvIndex?: number;
  
  // Step completion tracking
  completedSteps?: Set<number>;
  stepCompletionMap?: { [tvIndex: number]: Set<number> }; // For multi-TV step tracking
  
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
  bookingData: ExtendedBookingData;
  updateBookingData: (data: Partial<ExtendedBookingData>) => void;
  resetBookingData: () => void;
  // Multi-TV specific methods
  initializeMultiTvBooking: (tvQuantity: number) => void;
  addTvInstallation: () => void;
  removeTvInstallation: (index: number) => void;
  updateTvInstallation: (index: number, data: Partial<TVInstallation>) => void;
  updateCurrentTvInstallation: (data: Partial<TVInstallation>) => void;
  calculateTotalPrice: () => number;
  getCurrentTv: () => TVInstallation | undefined;
  isMultiTvBooking: () => boolean;
  // Direct installer booking methods
  setDirectInstaller: (installerId: number, installerInfo: any) => void;
  isDirectBooking: () => boolean;
  // Step completion tracking methods
  markStepCompleted: (step: number, tvIndex?: number) => void;
  isStepCompleted: (step: number, tvIndex?: number) => boolean;
  getCompletedStepsCount: (tvIndex?: number) => number;
  resetStepCompletion: () => void;
}

// Custom storage with Set serialization
const customStorage = {
  getItem: (name: string) => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    
    try {
      const parsed = JSON.parse(str);
      // Convert completedSteps array back to Set
      if (parsed.state?.bookingData?.completedSteps && Array.isArray(parsed.state.bookingData.completedSteps)) {
        parsed.state.bookingData.completedSteps = new Set(parsed.state.bookingData.completedSteps);
      }
      // Convert stepCompletionMap arrays back to Sets
      if (parsed.state?.bookingData?.stepCompletionMap) {
        const map = parsed.state.bookingData.stepCompletionMap;
        Object.keys(map).forEach(key => {
          if (Array.isArray(map[key])) {
            map[key] = new Set(map[key]);
          }
        });
      }
      return parsed;
    } catch (e) {
      return null;
    }
  },
  setItem: (name: string, value: any) => {
    try {
      // Convert Sets to arrays for serialization
      const serializable = JSON.parse(JSON.stringify(value, (key, val) => {
        if (val instanceof Set) {
          return Array.from(val);
        }
        return val;
      }));
      localStorage.setItem(name, JSON.stringify(serializable));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  },
  removeItem: (name: string) => localStorage.removeItem(name),
};

export const useBookingData = create<BookingStore>()(
  persist(
    (set, get) => ({
      bookingData: {
        tvQuantity: 1,
        tvInstallations: [],
        currentTvIndex: 0,
      },
      updateBookingData: (data) =>
        set((state) => ({
          bookingData: { ...state.bookingData, ...data },
        })),
      resetBookingData: () => set({ bookingData: {} }),
      
      // Multi-TV specific methods
      initializeMultiTvBooking: (tvQuantity: number) =>
        set((state) => {
          const tvInstallations: TVInstallation[] = Array.from({ length: tvQuantity }, (_, index) => ({
            id: `tv-${index + 1}`,
            tvSize: '',
            serviceType: '',
            wallType: '',
            mountType: '',
            needsWallMount: false,
            wallMountOption: undefined,
            location: `TV ${index + 1}`,
            addons: [],
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

      addTvInstallation: () =>
        set((state) => {
          const currentInstallations = state.bookingData.tvInstallations || [];
          const newIndex = currentInstallations.length + 1;
          
          const newInstallation: TVInstallation = {
            id: `tv-${newIndex}`,
            tvSize: '',
            serviceType: '',
            wallType: '',
            mountType: '',
            needsWallMount: false,
            wallMountOption: undefined,
            location: `TV ${newIndex}`,
            addons: [],
          };

          return {
            bookingData: {
              ...state.bookingData,
              tvQuantity: (state.bookingData.tvQuantity || 0) + 1,
              tvInstallations: [...currentInstallations, newInstallation],
            },
          };
        }),

      removeTvInstallation: (index: number) =>
        set((state) => {
          const currentInstallations = state.bookingData.tvInstallations || [];
          if (index < 0 || index >= currentInstallations.length) {
            return state;
          }

          const newInstallations = currentInstallations.filter((_, i) => i !== index);
          
          return {
            bookingData: {
              ...state.bookingData,
              tvQuantity: Math.max(1, newInstallations.length),
              tvInstallations: newInstallations,
              currentTvIndex: Math.min(state.bookingData.currentTvIndex || 0, newInstallations.length - 1),
            },
          };
        }),
      
      updateTvInstallation: (index: number, data: Partial<TVInstallation>) =>
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
      
      updateCurrentTvInstallation: (data: Partial<TVInstallation>) => {
        const { bookingData } = get();
        const currentIndex = bookingData.currentTvIndex || 0;
        get().updateTvInstallation(currentIndex, data);
      },
      
      calculateTotalPrice: () => {
        const { bookingData } = get();
        
        if (bookingData.tvInstallations && bookingData.tvInstallations.length > 0) {
          // Multi-TV booking: sum up all TV installations
          return bookingData.tvInstallations.reduce((total, tv) => {
            const basePrice = tv.basePrice || 0;
            const addonsPrice = tv.addons.reduce((sum, addon) => sum + addon.price, 0);
            return total + basePrice + addonsPrice;
          }, 0);
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
      
      // Step completion tracking methods
      markStepCompleted: (step: number, tvIndex?: number) =>
        set((state) => {
          const isMultiTv = !!(state.bookingData.tvQuantity && state.bookingData.tvQuantity > 1);
          
          if (isMultiTv && tvIndex !== undefined) {
            // Multi-TV: track per TV
            const stepCompletionMap = state.bookingData.stepCompletionMap || {};
            const tvSteps = stepCompletionMap[tvIndex] || new Set<number>();
            tvSteps.add(step);
            stepCompletionMap[tvIndex] = tvSteps;
            
            return {
              bookingData: {
                ...state.bookingData,
                stepCompletionMap,
              },
            };
          } else {
            // Single TV or global steps: track globally
            const completedSteps = state.bookingData.completedSteps || new Set<number>();
            completedSteps.add(step);
            
            return {
              bookingData: {
                ...state.bookingData,
                completedSteps,
              },
            };
          }
        }),
      
      isStepCompleted: (step: number, tvIndex?: number) => {
        const { bookingData } = get();
        const isMultiTv = !!(bookingData.tvQuantity && bookingData.tvQuantity > 1);
        
        if (isMultiTv && tvIndex !== undefined) {
          // Multi-TV: check per TV
          const stepCompletionMap = bookingData.stepCompletionMap || {};
          const tvSteps = stepCompletionMap[tvIndex];
          return tvSteps ? tvSteps.has(step) : false;
        } else {
          // Single TV or global steps: check globally
          const completedSteps = bookingData.completedSteps;
          return completedSteps ? completedSteps.has(step) : false;
        }
      },
      
      getCompletedStepsCount: (tvIndex?: number) => {
        const { bookingData } = get();
        const isMultiTv = !!(bookingData.tvQuantity && bookingData.tvQuantity > 1);
        
        if (isMultiTv && tvIndex !== undefined) {
          // Multi-TV: count per TV
          const stepCompletionMap = bookingData.stepCompletionMap || {};
          const tvSteps = stepCompletionMap[tvIndex];
          return tvSteps ? tvSteps.size : 0;
        } else {
          // Single TV or global steps: count globally
          const completedSteps = bookingData.completedSteps;
          return completedSteps ? completedSteps.size : 0;
        }
      },
      
      resetStepCompletion: () =>
        set((state) => ({
          bookingData: {
            ...state.bookingData,
            completedSteps: new Set<number>(),
            stepCompletionMap: {},
          },
        })),
    }),
    {
      name: 'booking-data',
      storage: customStorage,
    }
  )
);