// Dynamic pricing calculation with commission included
export interface PricingResult {
  basePrice: number;
  addonsPrice: number;
  installerEarnings: number;
  appFee: number;
  totalPrice: number; // What customer pays
  feePercentage: number;
}

export interface ServiceTier {
  key: string;
  name: string;
  description: string;
  category: string;
  minTvSize: number;
  maxTvSize: number | null;
  installerEarnings: number; // What installer receives
  customerPrice: number; // What customer pays (with commission)
}

// Base installer earnings (what installers receive)
const BASE_INSTALLER_EARNINGS: Record<string, number> = {
  'table-top-small': 89,
  'table-top-large': 109,
  'bronze': 109,
  'silver': 159,
  'silver-large': 259,
  'gold': 259,
  'gold-large': 359
};

// Commission rate (15%)
const COMMISSION_RATE = 0.15;

// Calculate customer price (installer earnings + commission)
function calculateCustomerPrice(installerEarnings: number): number {
  return Math.round(installerEarnings / (1 - COMMISSION_RATE));
}

// Service tiers with dynamic pricing
export const SERVICE_TIERS: Record<string, ServiceTier> = {
  'table-top-small': {
    key: 'table-top-small',
    name: 'Table Top Installation',
    description: 'Professional table top setup for smaller TVs',
    category: 'table-top',
    minTvSize: 32,
    maxTvSize: 42,
    installerEarnings: BASE_INSTALLER_EARNINGS['table-top-small'],
    customerPrice: calculateCustomerPrice(BASE_INSTALLER_EARNINGS['table-top-small'])
  },
  'table-top-large': {
    key: 'table-top-large',
    name: 'Table Top Installation',
    description: 'Professional table top setup for larger TVs',
    category: 'table-top',
    minTvSize: 43,
    maxTvSize: null,
    installerEarnings: BASE_INSTALLER_EARNINGS['table-top-large'],
    customerPrice: calculateCustomerPrice(BASE_INSTALLER_EARNINGS['table-top-large'])
  },
  'bronze': {
    key: 'bronze',
    name: 'Bronze TV Mounting',
    description: 'Fixed wall mount installation',
    category: 'bronze',
    minTvSize: 32,
    maxTvSize: 42,
    installerEarnings: BASE_INSTALLER_EARNINGS['bronze'],
    customerPrice: calculateCustomerPrice(BASE_INSTALLER_EARNINGS['bronze'])
  },
  'silver': {
    key: 'silver',
    name: 'Silver TV Mounting',
    description: 'Tilting wall mount with cable management',
    category: 'silver',
    minTvSize: 43,
    maxTvSize: 85,
    installerEarnings: BASE_INSTALLER_EARNINGS['silver'],
    customerPrice: calculateCustomerPrice(BASE_INSTALLER_EARNINGS['silver'])
  },
  'silver-large': {
    key: 'silver-large',
    name: 'Silver TV Mounting',
    description: 'Tilting wall mount for large TVs',
    category: 'silver',
    minTvSize: 86,
    maxTvSize: null,
    installerEarnings: BASE_INSTALLER_EARNINGS['silver-large'],
    customerPrice: calculateCustomerPrice(BASE_INSTALLER_EARNINGS['silver-large'])
  },
  'gold': {
    key: 'gold',
    name: 'Gold TV Mounting',
    description: 'Full motion mount with premium features',
    category: 'gold',
    minTvSize: 43,
    maxTvSize: 85,
    installerEarnings: BASE_INSTALLER_EARNINGS['gold'],
    customerPrice: calculateCustomerPrice(BASE_INSTALLER_EARNINGS['gold'])
  },
  'gold-large': {
    key: 'gold-large',
    name: 'Gold TV Mounting',
    description: 'Premium large TV full motion installation',
    category: 'gold',
    minTvSize: 86,
    maxTvSize: null,
    installerEarnings: BASE_INSTALLER_EARNINGS['gold-large'],
    customerPrice: calculateCustomerPrice(BASE_INSTALLER_EARNINGS['gold-large'])
  }
};

export function getServiceTiersForTvSize(tvSize: number): ServiceTier[] {
  return Object.values(SERVICE_TIERS).filter(tier => {
    if (tier.maxTvSize === null) {
      return tvSize >= tier.minTvSize;
    }
    return tvSize >= tier.minTvSize && tvSize <= tier.maxTvSize;
  });
}

export function calculateBookingPricing(
  serviceType: string,
  addons: Array<{ key: string; name: string; price: number }> = [],
  installerId: number | null = null
): PricingResult {
  const serviceTier = SERVICE_TIERS[serviceType];
  if (!serviceTier) {
    throw new Error(`Unknown service type: ${serviceType}`);
  }

  const basePrice = serviceTier.installerEarnings;
  const addonsPrice = addons.reduce((sum, addon) => sum + addon.price, 0);
  const installerEarnings = basePrice + addonsPrice;
  
  // Calculate commission
  const appFee = installerEarnings * COMMISSION_RATE;
  const totalPrice = installerEarnings + appFee;

  return {
    basePrice,
    addonsPrice,
    installerEarnings,
    appFee,
    totalPrice,
    feePercentage: COMMISSION_RATE * 100
  };
}