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
  addonsConfirmed?: boolean; // Track if user has confirmed add-on selection
  basePrice?: number;
  roomPhotoBase64?: string;
  aiPreviewUrl?: string;
  location?: string; // e.g., "Living Room", "Bedroom 1", "Kitchen"
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

  // Contact fields (for backward compatibility)
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  address?: string;
  streetAddress?: string;
  town?: string;
  county?: string;
  eircode?: string;

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

// Service pricing mapping (mirrors backend pricing)
const SERVICE_PRICING: Record<string, number> = {
  'table-top-small': 99,
  'table-top-large': 119,
  'bronze': 119,
  'silver': 169,
  'silver-large': 269,
  'gold': 269,
  'gold-large': 369
};

// Calculate price for a single TV installation
function calculateTvPrice(tv: TVInstallation): number {
  const basePrice = tv.basePrice || SERVICE_PRICING[tv.serviceType] || 0;
  const addonsPrice = tv.addons.reduce((sum, addon) => sum + addon.price, 0);
  return basePrice + addonsPrice;
}

export function calculateTotalPrice(bookingData: BookingData): number {
  // Multi-TV pricing
  if (bookingData.tvQuantity > 1 && bookingData.tvInstallations && bookingData.tvInstallations.length > 0) {
    let total = bookingData.tvInstallations.reduce((sum, tv) => {
      return sum + calculateTvPrice(tv);
    }, 0);
    
    // Apply referral discount if available
    if (bookingData.referralDiscount && bookingData.referralDiscount > 0) {
      total = Math.max(0, total - bookingData.referralDiscount);
    }
    
    return total;
  }
  
  // Single TV pricing (legacy)
  const basePrice = bookingData.basePrice || SERVICE_PRICING[bookingData.serviceType || ''] || 0;
  const addonsPrice = bookingData.addons?.reduce((sum, addon) => sum + addon.price, 0) || 0;
  let total = basePrice + addonsPrice;
  
  // Apply referral discount if available
  if (bookingData.referralDiscount && bookingData.referralDiscount > 0) {
    total = Math.max(0, total - bookingData.referralDiscount);
  }
  
  return total;
}

// Helper function to get detailed price breakdown
export function getDetailedPricing(bookingData: BookingData) {
  const breakdown: Array<{ label: string; amount: number; isDiscount?: boolean }> = [];
  let subtotal = 0;
  
  if (bookingData.tvQuantity > 1 && bookingData.tvInstallations && bookingData.tvInstallations.length > 0) {
    // Multi-TV breakdown
    bookingData.tvInstallations.forEach((tv, index) => {
      const basePrice = tv.basePrice || SERVICE_PRICING[tv.serviceType] || 0;
      const location = tv.location || `TV ${index + 1}`;
      
      breakdown.push({
        label: `${location} (${tv.tvSize}" ${tv.serviceType})`,
        amount: basePrice
      });
      subtotal += basePrice;
      
      tv.addons.forEach(addon => {
        breakdown.push({
          label: `  + ${addon.name}`,
          amount: addon.price
        });
        subtotal += addon.price;
      });
    });
  } else {
    // Single TV breakdown
    const basePrice = bookingData.basePrice || SERVICE_PRICING[bookingData.serviceType || ''] || 0;
    breakdown.push({
      label: `${bookingData.tvSize}" ${bookingData.serviceType} Installation`,
      amount: basePrice
    });
    subtotal += basePrice;
    
    if (bookingData.addons) {
      bookingData.addons.forEach(addon => {
        breakdown.push({
          label: addon.name,
          amount: addon.price
        });
        subtotal += addon.price;
      });
    }
  }
  
  // Add referral discount
  if (bookingData.referralDiscount && bookingData.referralDiscount > 0) {
    breakdown.push({
      label: 'Harvey Norman Discount (10%)',
      amount: -bookingData.referralDiscount,
      isDiscount: true
    });
  }
  
  const total = Math.max(0, subtotal - (bookingData.referralDiscount || 0));
  
  return {
    breakdown,
    subtotal,
    total
  };
}

export function getCurrentTvData(bookingData: BookingData): TVInstallation | null {
  if (bookingData.tvQuantity > 1 && bookingData.tvInstallations.length > 0) {
    return bookingData.tvInstallations[bookingData.currentTvIndex] || null;
  }
  return null;
}
