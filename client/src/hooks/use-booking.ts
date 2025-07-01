import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface BookingData {
  step: number;
  userId?: number;
  serviceTierId?: number;
  tvSize: number;
  wallType: string;
  mountType: string;
  needsWallMount?: boolean;
  wallMountOption?: string;
  wallMountPrice?: number;
  selectedAddons: Array<{
    key: string;
    name: string;
    price: number;
  }>;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
  roomPhotoFile?: File;
  roomPhotoUrl?: string;
  aiPreviewUrl?: string;
  roomAnalysis?: string;
  photoStorageConsent?: boolean;
  subtotal: number;
  addonTotal: number;
  total: number;
  appFee: number;
}

const initialBookingData: BookingData = {
  step: 1,
  tvSize: 0,
  wallType: '',
  mountType: '',
  selectedAddons: [],
  scheduledDate: '',
  scheduledTime: '',
  address: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  subtotal: 0,
  addonTotal: 0,
  total: 0,
  appFee: 0,
};

export const useBooking = () => {
  const [bookingData, setBookingData] = useState<BookingData>(initialBookingData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateBookingData = useCallback((updates: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    setBookingData(prev => ({ ...prev, step: prev.step + 1 }));
  }, []);

  const prevStep = useCallback(() => {
    setBookingData(prev => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  }, []);

  const resetBooking = useCallback(() => {
    setBookingData(initialBookingData);
  }, []);

  const submitBooking = useCallback(async (): Promise<{
    success: boolean;
    booking?: any;
    qrCodeData?: string;
    error?: string;
  }> => {
    setIsSubmitting(true);
    try {
      // First, create the user if needed
      let userId = bookingData.userId;
      if (!userId) {
        const userResponse = await apiRequest('POST', '/api/users', {
          name: bookingData.customerName,
          email: bookingData.customerEmail,
          phone: bookingData.customerPhone,
          role: 'customer',
        });
        const userData = await userResponse.json();
        userId = userData.id;
      }

      // Prepare booking data
      const bookingPayload = {
        userId,
        serviceTierId: bookingData.serviceTierId,
        tvSize: bookingData.tvSize,
        wallType: bookingData.wallType,
        mountType: bookingData.mountType,
        needsWallMount: bookingData.needsWallMount,
        wallMountOption: bookingData.wallMountOption,
        selectedAddons: bookingData.selectedAddons,
        scheduledDate: new Date(bookingData.scheduledDate).toISOString(),
        scheduledTime: bookingData.scheduledTime,
        address: bookingData.address,
        customerNotes: bookingData.customerNotes || '',
        roomPhotoUrl: bookingData.roomPhotoUrl || '',
        aiPreviewUrl: bookingData.aiPreviewUrl || '',
        roomAnalysis: bookingData.roomAnalysis || '',
        photoStorageConsent: bookingData.photoStorageConsent || false,
        subtotal: bookingData.subtotal.toFixed(2),
        addonTotal: bookingData.addonTotal.toFixed(2),
        total: bookingData.total.toFixed(2),
        status: 'pending',
      };

      const response = await apiRequest('POST', '/api/bookings', bookingPayload);
      const result = await response.json();

      return {
        success: true,
        booking: result,
        qrCodeData: result.qrCodeData,
      };
    } catch (error) {
      console.error('Booking submission failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit booking',
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [bookingData]);

  const uploadRoomPhoto = useCallback(async (file: File): Promise<{
    success: boolean;
    photoUrl?: string;
    error?: string;
  }> => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/ai/analyze-room', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload and analyze room photo');
      }

      const analysis = await response.json();
      
      // Store the file for later preview generation
      updateBookingData({ 
        roomPhotoFile: file,
        roomPhotoUrl: URL.createObjectURL(file)
      });

      return {
        success: true,
        photoUrl: URL.createObjectURL(file),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload photo',
      };
    }
  }, [updateBookingData]);

  const generateAIPreview = useCallback(async (): Promise<{
    success: boolean;
    previewUrl?: string;
    error?: string;
  }> => {
    if (!bookingData.roomPhotoFile) {
      return {
        success: false,
        error: 'No room photo available for preview generation',
      };
    }

    try {
      const formData = new FormData();
      formData.append('image', bookingData.roomPhotoFile);
      formData.append('tvSize', bookingData.tvSize.toString());
      formData.append('mountType', bookingData.mountType);
      formData.append('wallType', bookingData.wallType);

      const response = await fetch('/api/ai/generate-preview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI preview');
      }

      const result = await response.json();

      if (result.success) {
        updateBookingData({ aiPreviewUrl: result.previewImageUrl });
        return {
          success: true,
          previewUrl: result.previewImageUrl,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to generate preview',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate preview',
      };
    }
  }, [bookingData.roomPhotoFile, bookingData.tvSize, bookingData.mountType, bookingData.wallType, updateBookingData]);

  return {
    bookingData,
    updateBookingData,
    nextStep,
    prevStep,
    resetBooking,
    submitBooking,
    uploadRoomPhoto,
    generateAIPreview,
    isSubmitting,
  };
};
