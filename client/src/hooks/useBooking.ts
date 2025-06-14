import { useState, useCallback } from 'react';

export interface BookingState {
  step: number;
  photo: File | null;
  photoPreview: string | null;
  aiPreview: string | null;
  tvSize: string;
  service: string;
  wallType: string;
  mountType: string;
  addons: Array<{ key: string; price: number }>;
  date: string;
  time: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  notes: string;
  basePrice: number;
  total: number;
}

const initialState: BookingState = {
  step: 1,
  photo: null,
  photoPreview: null,
  aiPreview: null,
  tvSize: '',
  service: '',
  wallType: '',
  mountType: '',
  addons: [],
  date: '',
  time: '',
  contact: {
    name: '',
    email: '',
    phone: '',
    address: ''
  },
  notes: '',
  basePrice: 0,
  total: 0
};

export function useBooking() {
  const [bookingState, setBookingState] = useState<BookingState>(initialState);

  const updateBooking = useCallback((updates: Partial<BookingState>) => {
    setBookingState(prev => {
      const newState = { ...prev, ...updates };
      
      // Recalculate total when addons or base price changes
      if (updates.addons || updates.basePrice !== undefined) {
        const addonTotal = newState.addons.reduce((sum, addon) => sum + addon.price, 0);
        newState.total = newState.basePrice + addonTotal;
      }
      
      return newState;
    });
  }, []);

  const setStep = useCallback((step: number) => {
    updateBooking({ step });
  }, [updateBooking]);

  const nextStep = useCallback(() => {
    setBookingState(prev => ({ ...prev, step: prev.step + 1 }));
  }, []);

  const prevStep = useCallback(() => {
    setBookingState(prev => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  }, []);

  const resetBooking = useCallback(() => {
    setBookingState(initialState);
  }, []);

  const setPhoto = useCallback((file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateBooking({ 
          photo: file, 
          photoPreview: e.target?.result as string 
        });
      };
      reader.readAsDataURL(file);
    } else {
      updateBooking({ photo: null, photoPreview: null, aiPreview: null });
    }
  }, [updateBooking]);

  const setAIPreview = useCallback((previewUrl: string) => {
    updateBooking({ aiPreview: previewUrl });
  }, [updateBooking]);

  const setTVSize = useCallback((size: string) => {
    updateBooking({ tvSize: size });
  }, [updateBooking]);

  const setService = useCallback((service: string, price: number) => {
    updateBooking({ service, basePrice: price });
  }, [updateBooking]);

  const setWallType = useCallback((wallType: string) => {
    updateBooking({ wallType });
  }, [updateBooking]);

  const setMountType = useCallback((mountType: string) => {
    updateBooking({ mountType });
  }, [updateBooking]);

  const toggleAddon = useCallback((key: string, price: number, name: string) => {
    setBookingState(prev => {
      const existingIndex = prev.addons.findIndex(addon => addon.key === key);
      let newAddons;
      
      if (existingIndex >= 0) {
        // Remove addon
        newAddons = prev.addons.filter(addon => addon.key !== key);
      } else {
        // Add addon
        newAddons = [...prev.addons, { key, price }];
      }
      
      const addonTotal = newAddons.reduce((sum, addon) => sum + addon.price, 0);
      const total = prev.basePrice + addonTotal;
      
      return {
        ...prev,
        addons: newAddons,
        total
      };
    });
  }, []);

  const setSchedule = useCallback((date: string, time: string) => {
    updateBooking({ date, time });
  }, [updateBooking]);

  const setContact = useCallback((contact: Partial<BookingState['contact']>) => {
    updateBooking({ 
      contact: { ...bookingState.contact, ...contact } 
    });
  }, [updateBooking, bookingState.contact]);

  const setNotes = useCallback((notes: string) => {
    updateBooking({ notes });
  }, [updateBooking]);

  const isStepValid = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        return true; // Photo is optional
      case 2:
        return bookingState.tvSize !== '';
      case 3:
        return bookingState.service !== '';
      case 4:
        return bookingState.wallType !== '';
      case 5:
        return bookingState.mountType !== '';
      case 6:
        return true; // Addons are optional
      case 7:
        return bookingState.date !== '' && bookingState.time !== '';
      case 8:
        return (
          bookingState.contact.name !== '' &&
          bookingState.contact.email !== '' &&
          bookingState.contact.phone !== '' &&
          bookingState.contact.address !== ''
        );
      default:
        return false;
    }
  }, [bookingState]);

  return {
    bookingState,
    updateBooking,
    setStep,
    nextStep,
    prevStep,
    resetBooking,
    setPhoto,
    setAIPreview,
    setTVSize,
    setService,
    setWallType,
    setMountType,
    toggleAddon,
    setSchedule,
    setContact,
    setNotes,
    isStepValid
  };
}
