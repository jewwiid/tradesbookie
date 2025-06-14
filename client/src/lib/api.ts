import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
}

export interface Service {
  id: number;
  name: string;
  key: string;
  basePrice: string;
  description?: string;
  sizeRange?: string;
}

export interface Addon {
  id: number;
  name: string;
  key: string;
  price: string;
  description?: string;
}

export interface BookingData {
  email: string;
  name: string;
  phone: string;
  address: string;
  tvSize: string;
  serviceType: string;
  wallType: string;
  mountType: string;
  addons: string;
  scheduledDate: string;
  timeSlot: string;
  basePrice: string;
  addonTotal: string;
  totalPrice: string;
  customerNotes?: string;
}

export interface Booking {
  id: number;
  bookingId: string;
  userId: number;
  installerId?: number;
  businessId: number;
  tvSize: string;
  serviceType: string;
  wallType: string;
  mountType: string;
  addons: any[];
  scheduledDate: string;
  timeSlot: string;
  address: string;
  roomPhotoUrl?: string;
  aiPreviewUrl?: string;
  basePrice: string;
  addonTotal: string;
  totalPrice: string;
  appFee: string;
  installerEarning: string;
  status: string;
  customerNotes?: string;
  installerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TVPlacementResponse {
  success: boolean;
  previewImageUrl?: string;
  description?: string;
  error?: string;
}

export const api = {
  // Services and addons
  async getServices(): Promise<Service[]> {
    const response = await apiRequest("GET", "/api/services");
    return response.json();
  },

  async getAddons(): Promise<Addon[]> {
    const response = await apiRequest("GET", "/api/addons");
    return response.json();
  },

  // AI TV placement
  async generateTVPlacement(formData: FormData): Promise<TVPlacementResponse> {
    const response = await fetch("/api/ai/tv-placement", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  // Bookings
  async createBooking(formData: FormData): Promise<{ 
    booking: Booking; 
    qrCode: string; 
    accessToken: string; 
    message: string 
  }> {
    const response = await fetch("/api/bookings", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  async getBookingByToken(token: string): Promise<{ booking: Booking; qrCode: string }> {
    const response = await apiRequest("GET", `/api/bookings/token/${token}`);
    return response.json();
  },

  // Admin
  async getAdminBookings(): Promise<Booking[]> {
    const response = await apiRequest("GET", "/api/admin/bookings");
    return response.json();
  },

  async updateBusinessFees(businessId: number, feeStructure: any): Promise<any> {
    const response = await apiRequest("PUT", `/api/admin/business/${businessId}/fees`, {
      feeStructure
    });
    return response.json();
  },

  // Installer
  async getInstallerJobs(installerId: number): Promise<Booking[]> {
    const response = await apiRequest("GET", `/api/installer/${installerId}/jobs`);
    return response.json();
  },

  async updateBookingStatus(bookingId: number, status: string): Promise<Booking> {
    const response = await apiRequest("PUT", `/api/bookings/${bookingId}/status`, {
      status
    });
    return response.json();
  },
};
