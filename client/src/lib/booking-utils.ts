import { useState } from "react";

export interface TVInstallation {
  id: string; // unique identifier for each TV
  tvSize: string;
  serviceType: string;
  wallType: string;
  mountType: string;
  needsWallMount?: boolean;
  wallMountOption?: string;
  addons: Array<{
    key: string;
    name: string;
    price: number;
  }>;
  basePrice?: number;
  roomPhotoBase64?: string;
  aiPreviewUrl?: string;
  location?: string; // e.g., "Living Room", "Bedroom 1", "Kitchen"
}

export interface BookingData {
  // Step 1: TV Quantity
  tvQuantity: number;
  
  // Step 2: Photo (primary room photo)
  roomPhotoBase64?: string;
  compressedRoomPhoto?: string;
  compressionInfo?: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  };
  roomAnalysis?: {
    recommendations: string[];
    warnings: string[];
    confidence: "high" | "medium" | "low";
    difficultyAssessment?: {
      level: "easy" | "moderate" | "difficult" | "expert";
      factors: string[];
      estimatedTime: string;
      additionalCosts: string[];
      skillsRequired: string[];
      priceImpact: "none" | "low" | "medium" | "high";
    };
  };
  photoStorageConsent?: boolean;
  
  // Step 3-7: TV Installations (for multi-TV support)
  tvInstallations: TVInstallation[];
  currentTvIndex: number; // Track which TV we're currently configuring

  // Legacy fields for backward compatibility (when tvQuantity = 1)
  tvSize: string;
  serviceType: string;
  wallType: string;
  mountType: string;
  needsWallMount?: boolean;
  wallMountOption?: string;
  addons?: Array<{
    key: string;
    name: string;
    price: number;
  }>;
  basePrice?: number;

  // Step 8: Schedule
  preferredDate?: string;
  preferredTime?: string;

  // Step 9: Contact
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

  // Harvey Norman Referral
  referralCode?: string;
  referralDiscount?: number;
  referralCodeId?: number;

  // AI Preview
  aiPreviewUrl?: string;

  // Additional notes
  customerNotes?: string;

  // Direct booking info
  directBooking?: boolean;
  installerInfo?: {
    id: number;
    businessName: string;
    contactName?: string;
    phone?: string;
    profileImageUrl?: string;
    serviceArea?: string;
    rating?: number;
    totalReviews?: number;
  };
}

export function useBookingData() {
  const [bookingData, setBookingData] = useState<BookingData>({
    tvQuantity: 1,
    tvInstallations: [],
    currentTvIndex: 0,
    tvSize: "",
    serviceType: "",
    wallType: "",
    mountType: "",
    addons: [],
    directBooking: false
  });

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  };

  const resetBookingData = () => {
    setBookingData({
      tvQuantity: 1,
      tvInstallations: [],
      currentTvIndex: 0,
      tvSize: "",
      serviceType: "",
      wallType: "",
      mountType: "",
      addons: [],
      directBooking: false
    });
  };

  // Update specific TV installation
  const updateTvInstallation = (index: number, tvData: Partial<TVInstallation>) => {
    setBookingData(prev => {
      const updatedInstallations = [...prev.tvInstallations];
      updatedInstallations[index] = { ...updatedInstallations[index], ...tvData };
      return { ...prev, tvInstallations: updatedInstallations };
    });
  };

  // Add new TV installation
  const addTvInstallation = (tvData?: Partial<TVInstallation>) => {
    const newTv: TVInstallation = {
      id: `tv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tvSize: "",
      serviceType: "",
      wallType: "",
      mountType: "",
      addons: [],
      location: `TV ${bookingData.tvInstallations.length + 1}`,
      ...tvData
    };
    
    setBookingData(prev => ({
      ...prev,
      tvInstallations: [...prev.tvInstallations, newTv]
    }));
  };

  // Remove TV installation
  const removeTvInstallation = (index: number) => {
    setBookingData(prev => ({
      ...prev,
      tvInstallations: prev.tvInstallations.filter((_, i) => i !== index),
      currentTvIndex: Math.max(0, prev.currentTvIndex - 1)
    }));
  };

  // Set direct installer booking
  const setDirectInstaller = (installerId: number, installerInfo: any) => {
    setBookingData(prev => ({
      ...prev,
      directBooking: true,
      installerInfo: {
        id: installerId,
        businessName: installerInfo.businessName || installerInfo.contactName || 'Unknown',
        contactName: installerInfo.contactName,
        phone: installerInfo.phone,
        profileImageUrl: installerInfo.profileImageUrl,
        serviceArea: installerInfo.serviceArea,
        rating: installerInfo.averageRating || installerInfo.rating,
        totalReviews: installerInfo.totalReviews
      }
    }));
  };

  // Check if this is a direct booking
  const isDirectBooking = () => {
    return bookingData.directBooking === true && bookingData.installerInfo;
  };

  return {
    bookingData,
    updateBookingData,
    resetBookingData,
    updateTvInstallation,
    addTvInstallation,
    removeTvInstallation,
    setDirectInstaller,
    isDirectBooking
  };
}

export function calculateTotalPrice(bookingData: BookingData): number {
  // Multi-TV pricing
  if (bookingData.tvQuantity > 1 && bookingData.tvInstallations.length > 0) {
    return bookingData.tvInstallations.reduce((total, tv) => {
      const basePrice = tv.basePrice || 0;
      const addonsPrice = tv.addons.reduce((sum, addon) => sum + addon.price, 0);
      return total + basePrice + addonsPrice;
    }, 0);
  }
  
  // Single TV pricing (legacy)
  const basePrice = bookingData.basePrice || 0;
  const addonsPrice = bookingData.addons?.reduce((sum, addon) => sum + addon.price, 0) || 0;
  return basePrice + addonsPrice;
}

export function getCurrentTvData(bookingData: BookingData): TVInstallation | null {
  if (bookingData.tvQuantity > 1 && bookingData.tvInstallations.length > 0) {
    return bookingData.tvInstallations[bookingData.currentTvIndex] || null;
  }
  return null;
}
