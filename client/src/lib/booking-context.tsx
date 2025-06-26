import { createContext, useContext, useReducer, ReactNode } from 'react';

export interface BookingData {
  step: number;
  photo?: File | null;
  originalImageUrl?: string;
  aiPreviewImageUrl?: string;
  tvSize?: number;
  serviceKey?: string;
  wallType?: string;
  mountType?: string;
  addons: Array<{ key: string; name: string; price: number }>;
  scheduledDate?: string;
  timeSlot?: string;
  contact: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  customerNotes?: string;
  referralCode?: string;
  referralDiscount?: number;
  basePrice: number;
  addonTotal: number;
  totalPrice: number;
}

type BookingAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_PHOTO'; photo: File | null; originalImageUrl?: string }
  | { type: 'SET_AI_PREVIEW'; aiPreviewImageUrl: string }
  | { type: 'SET_TV_SIZE'; tvSize: number }
  | { type: 'SET_SERVICE'; serviceKey: string; basePrice: number }
  | { type: 'SET_WALL_TYPE'; wallType: string }
  | { type: 'SET_MOUNT_TYPE'; mountType: string }
  | { type: 'ADD_ADDON'; addon: { key: string; name: string; price: number } }
  | { type: 'REMOVE_ADDON'; addonKey: string }
  | { type: 'SET_SCHEDULE'; scheduledDate: string; timeSlot: string }
  | { type: 'SET_CONTACT'; contact: Partial<BookingData['contact']> }
  | { type: 'SET_NOTES'; customerNotes: string }
  | { type: 'SET_REFERRAL'; referralCode: string; discount: number }
  | { type: 'RESET' };

const initialState: BookingData = {
  step: 1,
  photo: null,
  addons: [],
  contact: {},
  basePrice: 0,
  addonTotal: 0,
  totalPrice: 0,
};

function bookingReducer(state: BookingData, action: BookingAction): BookingData {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    
    case 'SET_PHOTO':
      return { 
        ...state, 
        photo: action.photo,
        originalImageUrl: action.originalImageUrl 
      };
    
    case 'SET_AI_PREVIEW':
      return { ...state, aiPreviewImageUrl: action.aiPreviewImageUrl };
    
    case 'SET_TV_SIZE':
      return { ...state, tvSize: action.tvSize };
    
    case 'SET_SERVICE':
      const newTotalPrice = action.basePrice + state.addonTotal;
      return { 
        ...state, 
        serviceKey: action.serviceKey,
        basePrice: action.basePrice,
        totalPrice: newTotalPrice
      };
    
    case 'SET_WALL_TYPE':
      return { ...state, wallType: action.wallType };
    
    case 'SET_MOUNT_TYPE':
      return { ...state, mountType: action.mountType };
    
    case 'ADD_ADDON':
      const newAddons = [...state.addons, action.addon];
      const newAddonTotal = newAddons.reduce((sum, addon) => sum + addon.price, 0);
      return {
        ...state,
        addons: newAddons,
        addonTotal: newAddonTotal,
        totalPrice: state.basePrice + newAddonTotal,
      };
    
    case 'REMOVE_ADDON':
      const filteredAddons = state.addons.filter(addon => addon.key !== action.addonKey);
      const filteredAddonTotal = filteredAddons.reduce((sum, addon) => sum + addon.price, 0);
      return {
        ...state,
        addons: filteredAddons,
        addonTotal: filteredAddonTotal,
        totalPrice: state.basePrice + filteredAddonTotal,
      };
    
    case 'SET_SCHEDULE':
      return {
        ...state,
        scheduledDate: action.scheduledDate,
        timeSlot: action.timeSlot,
      };
    
    case 'SET_CONTACT':
      return {
        ...state,
        contact: { ...state.contact, ...action.contact },
      };
    
    case 'SET_NOTES':
      return { ...state, customerNotes: action.customerNotes };
    
    case 'SET_REFERRAL':
      const discountAmount = (state.totalPrice * action.discount) / 100;
      return { 
        ...state, 
        referralCode: action.referralCode,
        referralDiscount: action.discount,
        totalPrice: state.totalPrice - discountAmount
      };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

const BookingContext = createContext<{
  state: BookingData;
  dispatch: React.Dispatch<BookingAction>;
} | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  return (
    <BookingContext.Provider value={{ state, dispatch }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
