import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BookingData {
  step: number;
  photo?: string;
  tvSize?: number;
  serviceTierId?: number;
  wallType?: string;
  mountType?: string;
  needsWallMount?: boolean;
  addons: Array<{ key: string; name: string; price: number }>;
  date?: string;
  time?: string;
  contact: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  basePrice: number;
  addonsPrice: number;
  totalPrice: number;
  aiPreviewUrl?: string;
  analysisResult?: any;
}

interface BookingStore {
  data: BookingData;
  updateData: (updates: Partial<BookingData>) => void;
  setStep: (step: number) => void;
  addAddon: (addon: { key: string; name: string; price: number }) => void;
  removeAddon: (key: string) => void;
  calculateTotals: () => void;
  reset: () => void;
}

const initialData: BookingData = {
  step: 1,
  addons: [],
  contact: {},
  basePrice: 0,
  addonsPrice: 0,
  totalPrice: 0,
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      data: initialData,

      updateData: (updates) => {
        set((state) => {
          const newData = { ...state.data, ...updates };
          return { data: newData };
        });
        get().calculateTotals();
      },

      setStep: (step) => {
        set((state) => ({
          data: { ...state.data, step }
        }));
      },

      addAddon: (addon) => {
        set((state) => {
          const addons = [...state.data.addons];
          const existingIndex = addons.findIndex(a => a.key === addon.key);
          
          if (existingIndex === -1) {
            addons.push(addon);
          }
          
          return {
            data: { ...state.data, addons }
          };
        });
        get().calculateTotals();
      },

      removeAddon: (key) => {
        set((state) => ({
          data: {
            ...state.data,
            addons: state.data.addons.filter(addon => addon.key !== key)
          }
        }));
        get().calculateTotals();
      },

      calculateTotals: () => {
        set((state) => {
          const addonsPrice = state.data.addons.reduce((sum, addon) => sum + addon.price, 0);
          const totalPrice = state.data.basePrice + addonsPrice;
          
          return {
            data: {
              ...state.data,
              addonsPrice,
              totalPrice
            }
          };
        });
      },

      reset: () => {
        set({ data: initialData });
      },
    }),
    {
      name: 'booking-data',
      partialize: (state) => ({ data: state.data }),
    }
  )
);
