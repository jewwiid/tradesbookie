import { useState } from "react";

export interface BookingData {
  // Step 1: Photo
  roomPhotoBase64?: string;
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

  // Step 2: TV Size
  tvSize: string;

  // Step 3: Service
  serviceType: string;
  basePrice?: number;

  // Step 4: Wall Type
  wallType: string;

  // Step 5: Mount Type
  mountType: string;
  needsWallMount?: boolean;
  wallMountOption?: string;

  // Step 6: Add-ons
  addons?: Array<{
    key: string;
    name: string;
    price: number;
  }>;

  // Step 7: Schedule
  preferredDate?: string;
  preferredTime?: string;

  // Step 8: Contact
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
}

export function useBookingData() {
  const [bookingData, setBookingData] = useState<BookingData>({
    tvSize: "",
    serviceType: "",
    wallType: "",
    mountType: "",
    addons: []
  });

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  };

  const resetBookingData = () => {
    setBookingData({
      tvSize: "",
      serviceType: "",
      wallType: "",
      mountType: "",
      addons: []
    });
  };

  return {
    bookingData,
    updateBookingData,
    resetBookingData
  };
}

export function calculateTotalPrice(bookingData: BookingData): number {
  const basePrice = bookingData.basePrice || 0;
  const addonsPrice = bookingData.addons?.reduce((sum, addon) => sum + addon.price, 0) || 0;
  return basePrice + addonsPrice;
}
