// Calculate customer price including commission (15% default)
const calculateCustomerPrice = (installerPrice: number, feePercentage: number = 15) => {
  const appFee = installerPrice * (feePercentage / 100);
  return Math.round((installerPrice + appFee) * 100); // Convert to cents
};

export const SERVICE_TIERS = {
  'table-top-small': {
    key: 'table-top-small',
    name: 'Table Top Installation (Up to 43")',
    description: 'Perfect for smaller TVs and simple setups',
    basePrice: calculateCustomerPrice(89), // Customer pays €102 (€89 + 15% commission)
    installerEarnings: 8900, // Installer earns €89
    minTvSize: 32,
    maxTvSize: 43,
    icon: 'desktop',
    gradient: 'table-top'
  },
  'table-top-large': {
    key: 'table-top-large',
    name: 'Table Top Installation (43" and above)',
    description: 'Basic home table setup. WiFi setup included. You must have WiFi credentials ready. No cables included.',
    basePrice: calculateCustomerPrice(109), // Customer pays €125 (€109 + 15% commission)
    installerEarnings: 10900, // Installer earns €109
    minTvSize: 43,
    maxTvSize: null,
    icon: 'desktop',
    gradient: 'table-top'
  },
  'bronze': {
    key: 'bronze',
    name: 'Bronze TV Mounting (up to 42")',
    description: 'Wall mounting with cable concealment up to 2m. Connect to power socket and 3 sources including Wi-Fi. Basic feature demo. No cables or brackets included. Private homes only.',
    basePrice: calculateCustomerPrice(109), // Customer pays €125 (€109 + 15% commission)
    installerEarnings: 10900, // Installer earns €109
    minTvSize: 32,
    maxTvSize: 42,
    icon: 'medal',
    gradient: 'bronze'
  },
  'silver': {
    key: 'silver',
    name: 'Silver TV Mounting (43-85")',
    description: 'Wall mounting for 43" & up. Cable concealment up to 2m. Connect to power socket and 3 sources including Wi-Fi. Basic feature demo. No cables or brackets included. Private homes only.',
    basePrice: calculateCustomerPrice(159), // Customer pays €183 (€159 + 15% commission)
    installerEarnings: 15900, // Installer earns €159
    minTvSize: 43,
    maxTvSize: 85,
    icon: 'award',
    gradient: 'silver'
  },
  'silver-large': {
    key: 'silver-large',
    name: 'Silver TV Mounting (85"+)',
    description: 'Premium wall mounting for large TVs 85"+. Professional cable concealment and full feature demonstration.',
    basePrice: calculateCustomerPrice(259), // Customer pays €298 (€259 + 15% commission)
    installerEarnings: 25900, // Installer earns €259
    minTvSize: 85,
    maxTvSize: null,
    icon: 'award',
    gradient: 'silver'
  },
  'gold': {
    key: 'gold',
    name: 'Gold TV Mounting (32" & 85")',
    description: 'Premium wall mounting from 32" & 85". Wall bracket installation with professional cable management. No cables or brackets included. Private homes only.',
    basePrice: calculateCustomerPrice(259), // Customer pays €298 (€259 + 15% commission)
    installerEarnings: 25900, // Installer earns €259
    minTvSize: 32,
    maxTvSize: 85,
    icon: 'crown',
    gradient: 'gold'
  },
  'gold-large': {
    key: 'gold-large',
    name: 'Gold TV Mounting (85"+)',
    description: 'Premium wall mounting for large TVs 85"+. Professional installation with full motion mount capabilities.',
    basePrice: 35900,
    minTvSize: 85,
    maxTvSize: null,
    icon: 'crown',
    gradient: 'gold'
  }
} as const;

export const ADDONS = {
  'cable-concealment': {
    key: 'cable-concealment',
    name: 'Cable Concealment',
    description: 'Hide cables inside the wall for a clean look',
    price: 4900
  },
  'multi-device-setup': {
    key: 'multi-device-setup',
    name: 'Multi-Device Setup',
    description: 'Connect and configure multiple devices (soundbar, gaming console, etc.)',
    price: 7900
  },
  'smart-tv-config': {
    key: 'smart-tv-config',
    name: 'Smart TV Configuration',
    description: 'Complete setup of smart TV features and apps',
    price: 3900
  },
  'same-day-service': {
    key: 'same-day-service',
    name: 'Same-Day Service',
    description: 'Priority booking for same-day installation',
    price: 9900
  },
  'weekend-installation': {
    key: 'weekend-installation',
    name: 'Weekend Installation',
    description: 'Saturday and Sunday installation availability',
    price: 4900
  },
  'evening-installation': {
    key: 'evening-installation',
    name: 'Evening Installation',
    description: 'After 6 PM installation service',
    price: 3900
  }
} as const;

export const WALL_TYPES = [
  {
    key: 'drywall',
    name: 'Drywall',
    description: 'Most common interior wall type',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200'
  },
  {
    key: 'concrete',
    name: 'Concrete',
    description: 'Solid masonry wall',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200'
  },
  {
    key: 'brick',
    name: 'Brick',
    description: 'Traditional brick construction',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200'
  },
  {
    key: 'other',
    name: 'Other',
    description: "We'll assess on-site",
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200'
  }
];

export const MOUNT_TYPES = [
  {
    key: 'fixed',
    name: 'Fixed Mount',
    description: 'TV sits flat against the wall (most secure)',
    icon: 'square'
  },
  {
    key: 'tilting',
    name: 'Tilting Mount',
    description: 'TV can tilt up and down for better viewing angles',
    icon: 'angle-down'
  },
  {
    key: 'full-motion',
    name: 'Full Motion Mount',
    description: 'TV can swivel, tilt, and extend from wall',
    icon: 'arrows-alt'
  }
];

export const TV_SIZES = [32, 43, 55, 65, 75, 85];

export const TIME_SLOTS = [
  { value: '09:00', label: '9:00 AM - 11:00 AM' },
  { value: '11:00', label: '11:00 AM - 1:00 PM' },
  { value: '13:00', label: '1:00 PM - 3:00 PM' },
  { value: '15:00', label: '3:00 PM - 5:00 PM' },
  { value: '17:00', label: '5:00 PM - 7:00 PM' }
];

export function formatPrice(priceInCents: number): string {
  return `€${(priceInCents / 100).toFixed(0)}`;
}

export function getServiceTiersForTvSize(tvSize: number) {
  return Object.values(SERVICE_TIERS).filter(tier => {
    if (tier.maxTvSize === null) {
      return tvSize >= tier.minTvSize;
    }
    return tvSize >= tier.minTvSize && tvSize <= tier.maxTvSize;
  });
}
