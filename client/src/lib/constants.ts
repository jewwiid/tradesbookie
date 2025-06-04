// Service pricing configuration
export const SERVICE_TIERS = {
  'table-top-small': {
    id: 'table-top-small',
    name: 'Table Top Installation (Up to 43")',
    description: 'Perfect for smaller TVs and simple setups',
    basePrice: 89,
    category: 'table-top',
    tvSizeMin: 32,
    tvSizeMax: 43,
    features: ['Professional setup', 'Cable organization', 'Basic calibration']
  },
  'table-top-large': {
    id: 'table-top-large',
    name: 'Table Top Installation (43" and above)',
    description: 'Professional setup for larger table-mounted TVs',
    basePrice: 109,
    category: 'table-top',
    tvSizeMin: 43,
    tvSizeMax: null,
    features: ['Professional setup', 'Cable organization', 'Basic calibration', 'Safety checks']
  },
  'bronze': {
    id: 'bronze',
    name: 'Bronze TV Mounting (up to 42")',
    description: 'Fixed wall mounting for medium TVs',
    basePrice: 109,
    category: 'bronze',
    tvSizeMin: 32,
    tvSizeMax: 42,
    features: ['Fixed wall mount', 'Stud finder mounting', 'Cable management', 'Level installation']
  },
  'silver': {
    id: 'silver',
    name: 'Silver TV Mounting (43-85")',
    description: 'Tilting mount with cable management',
    basePrice: 159,
    category: 'silver',
    tvSizeMin: 43,
    tvSizeMax: 85,
    features: ['Tilting wall mount', 'Premium cable concealment', 'Optimal viewing angle', 'Professional calibration']
  },
  'silver-large': {
    id: 'silver-large',
    name: 'Silver TV Mounting (85"+)',
    description: 'Professional mounting for extra large TVs',
    basePrice: 259,
    category: 'silver',
    tvSizeMin: 85,
    tvSizeMax: null,
    features: ['Heavy-duty tilting mount', 'Reinforced wall anchoring', 'Premium cable management', 'Safety certification']
  },
  'gold': {
    id: 'gold',
    name: 'Gold TV Mounting',
    description: 'Full motion mount with premium features',
    basePrice: 259,
    category: 'gold',
    tvSizeMin: 43,
    tvSizeMax: 85,
    features: ['Full-motion articulating mount', 'Premium cable concealment', 'Professional calibration', 'Extended warranty']
  },
  'gold-large': {
    id: 'gold-large',
    name: 'Gold TV Mounting (85"+)',
    description: 'Premium full-motion mounting for large TVs',
    basePrice: 359,
    category: 'gold',
    tvSizeMin: 85,
    tvSizeMax: null,
    features: ['Heavy-duty full-motion mount', 'Professional cable management', 'Premium calibration', 'White-glove service']
  }
} as const;

// Add-on services
export const ADD_ON_SERVICES = {
  'cable-concealment': {
    id: 'cable-concealment',
    name: 'Cable Concealment',
    description: 'Hide cables inside the wall for a clean look',
    price: 49,
    icon: 'fas fa-eye-slash'
  },
  'soundbar-install': {
    id: 'soundbar-install',
    name: 'Soundbar Installation',
    description: 'Mount your soundbar below the TV',
    price: 39,
    icon: 'fas fa-volume-up'
  },
  'calibration': {
    id: 'calibration',
    name: 'TV Calibration',
    description: 'Professional picture and sound optimization',
    price: 29,
    icon: 'fas fa-sliders-h'
  }
} as const;

// TV sizes available
export const TV_SIZES = [
  { size: 32, label: '32"', category: 'Small' },
  { size: 43, label: '43"', category: 'Medium' },
  { size: 55, label: '55"', category: 'Large' },
  { size: 65, label: '65"', category: 'X-Large' },
  { size: 75, label: '75"', category: 'XX-Large' },
  { size: 85, label: '85"', category: 'Premium' }
] as const;

// Wall types
export const WALL_TYPES = [
  {
    id: 'drywall',
    name: 'Drywall',
    description: 'Most common interior wall type',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200'
  },
  {
    id: 'concrete',
    name: 'Concrete',
    description: 'Solid masonry wall',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200'
  },
  {
    id: 'brick',
    name: 'Brick',
    description: 'Traditional brick construction',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200'
  },
  {
    id: 'other',
    name: 'Other',
    description: "We'll assess on-site",
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200'
  }
] as const;

// Mount types
export const MOUNT_TYPES = [
  {
    id: 'fixed',
    name: 'Fixed Mount',
    description: 'TV sits flat against the wall (most secure)',
    icon: 'fas fa-square'
  },
  {
    id: 'tilting',
    name: 'Tilting Mount',
    description: 'TV can tilt up and down for better viewing angles',
    icon: 'fas fa-angle-down'
  },
  {
    id: 'full-motion',
    name: 'Full Motion Mount',
    description: 'TV can swivel, tilt, and extend from wall',
    icon: 'fas fa-arrows-alt'
  }
] as const;

// Time slots for scheduling
export const TIME_SLOTS = [
  { value: '09:00', label: '9:00 AM - 11:00 AM' },
  { value: '11:00', label: '11:00 AM - 1:00 PM' },
  { value: '13:00', label: '1:00 PM - 3:00 PM' },
  { value: '15:00', label: '3:00 PM - 5:00 PM' },
  { value: '17:00', label: '5:00 PM - 7:00 PM' }
] as const;

// Booking statuses
export const BOOKING_STATUSES = {
  pending: { label: 'Pending', color: 'yellow', icon: 'fas fa-clock' },
  confirmed: { label: 'Confirmed', color: 'blue', icon: 'fas fa-check-circle' },
  assigned: { label: 'Assigned', color: 'purple', icon: 'fas fa-user-cog' },
  'in-progress': { label: 'In Progress', color: 'orange', icon: 'fas fa-tools' },
  completed: { label: 'Completed', color: 'green', icon: 'fas fa-check-double' },
  cancelled: { label: 'Cancelled', color: 'red', icon: 'fas fa-times-circle' }
} as const;

// API endpoints
export const API_ENDPOINTS = {
  SERVICE_TIERS: '/api/service-tiers',
  ADD_ON_SERVICES: '/api/add-on-services',
  ANALYZE_ROOM: '/api/analyze-room',
  GENERATE_TV_PREVIEW: '/api/generate-tv-preview',
  BOOKINGS: '/api/bookings',
  CUSTOMER_ACCESS: '/api/customer-access',
  QR_CODE: '/api/qr-code',
  ADMIN: {
    BOOKINGS: '/api/admin/bookings',
    STATS: '/api/admin/stats',
    FEE_STRUCTURE: '/api/admin/fee-structure'
  },
  INSTALLER: {
    JOBS: '/api/installer/jobs',
    ACCEPT_JOB: '/api/installer/accept-job',
    COMPLETE_JOB: '/api/installer/complete-job'
  }
} as const;

// Default fee percentage
export const DEFAULT_FEE_PERCENTAGE = 15;

// Image upload constraints
export const IMAGE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MIME_TYPES: 'image/jpeg,image/jpg,image/png,image/webp'
} as const;
