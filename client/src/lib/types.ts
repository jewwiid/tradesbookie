// Frontend-specific types that extend the shared schema types

export interface BookingFormData {
  // Step 1: Photo upload
  roomPhoto?: File;
  roomPhotoBase64?: string;
  roomAnalysis?: {
    wallSuitability: string;
    recommendedTVSize: string;
    potentialChallenges: string[];
    installationNotes: string;
  };
  
  // Step 2: TV selection
  tvSize: number;
  
  // Step 3: Service selection
  serviceTierId: number;
  basePrice: number;
  
  // Step 4: Wall type
  wallType: 'drywall' | 'concrete' | 'brick' | 'other';
  
  // Step 5: Mount type
  mountType: 'fixed' | 'tilting' | 'full-motion';
  
  // Step 6: Add-ons
  selectedAddOns: Array<{
    id: number;
    name: string;
    price: number;
  }>;
  addOnTotal: number;
  
  // Step 7: Product Assistance
  productAssistance?: string;
  productNotes?: string;
  
  // Step 8: Scheduling
  preferredDate?: string;
  preferredTime?: string;
  
  // Step 9: Contact & address
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  customerNotes?: string;
  
  // Calculated fields
  totalPrice: number;
  
  // AI Preview
  aiPreviewUrl?: string;
  aiPreviewDescription?: string;
}

export interface AIPreviewResult {
  success: boolean;
  imageUrl?: string;
  description?: string;
  error?: string;
}

export interface RoomAnalysisResult {
  success: boolean;
  analysis?: {
    wallSuitability: string;
    recommendedTVSize: string;
    potentialChallenges: string[];
    installationNotes: string;
  };
  imageBase64?: string;
  error?: string;
}

export interface ServiceTierOption {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  tvSizeMin?: number;
  tvSizeMax?: number;
  isActive: boolean;
}

export interface AddOnServiceOption {
  id: number;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
}

export interface AddOnOption {
  id: number;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
}

export interface PreviewResponse {
  success: boolean;
  previewImageUrl?: string;
  description?: string;
  error?: string;
}

export interface BookingWithDetails {
  id: number;
  customerId: number;
  installerId?: number;
  serviceTierId: number;
  tvSize: number;
  wallType: string;
  mountType: string;
  scheduledDate?: string;
  scheduledTime?: string;
  address: string;
  customerNotes?: string;
  roomPhotoUrl?: string;
  aiPreviewUrl?: string;
  status: string;
  basePrice: number;
  addOnTotal: number;
  totalPrice: number;
  appFee: number;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
  addOns?: Array<{
    id: number;
    bookingId: number;
    addOnServiceId: number;
    price: number;
    addOnService?: AddOnServiceOption;
  }>;
  customer?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  installer?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  serviceTier?: ServiceTierOption;
}

export interface CustomerAccessRequest {
  bookingId: string;
  email: string;
}

export interface CustomerAccessResponse {
  booking: BookingWithDetails;
  customer: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface AdminStats {
  totalBookings: number;
  monthlyBookings: number;
  revenue: number;
  appFees: number;
}

export interface FeeStructureItem {
  id: number;
  serviceTierId: number;
  feePercentage: number;
  isActive: boolean;
  updatedAt: string;
  serviceTier?: ServiceTierOption;
}

export interface InstallerJob extends BookingWithDetails {
  distance?: number;
  estimatedDuration?: number;
}

export interface QRCodeResponse {
  qrCode: string; // Data URL of the QR code image
}

// Form step types
export type BookingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface StepProps {
  formData: BookingFormData;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
  isValid: boolean;
}

// Navigation types
export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  requiresAuth?: boolean;
  roles?: string[];
}

// Error types
export interface APIError {
  message: string;
  status?: number;
  code?: string;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// Modal types
export interface ModalState {
  isOpen: boolean;
  type?: 'customer-login' | 'admin-login' | 'success' | 'error';
  data?: any;
}

// Dashboard types
export interface DashboardCard {
  title: string;
  value: string | number;
  change?: string;
  icon: string;
  color: string;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

// Filter types
export interface BookingFilter {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  installerId?: number;
  customerId?: number;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}
