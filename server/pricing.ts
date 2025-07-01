// New business model pricing - installers pay for leads, customers pay installers directly

export interface PricingResult {
  estimatedPrice: number;    // Base estimate for customer
  addonsPrice: number;       // Addon estimates
  totalEstimate: number;     // Total customer estimate
  leadFee: number;          // What installer pays to access this lead
}

export interface ServiceTier {
  key: string;
  name: string;
  description: string;
  category: string;
  minTvSize: number;
  maxTvSize: number | null;
  customerEstimate: number; // Estimated price for customer
  leadFee: number; // What installer pays to access this lead
}

// Customer price estimates (what customers expect to pay installers directly)
const CUSTOMER_ESTIMATES: Record<string, number> = {
  'table-top-small': 60,
  'table-top-large': 85,
  'bronze': 120,
  'silver': 180,
  'silver-large': 280,
  'gold': 250,
  'gold-large': 380
};

// Lead fees (what installers pay platform to access jobs)
const LEAD_FEES: Record<string, number> = {
  'table-top-small': 12,
  'table-top-large': 15,
  'bronze': 20,
  'silver': 25,
  'silver-large': 30,
  'gold': 30,
  'gold-large': 35
};

// Service tiers with new pricing model
export const SERVICE_TIERS: Record<string, ServiceTier> = {
  'table-top-small': {
    key: 'table-top-small',
    name: 'Table Top Installation',
    description: 'Professional table top setup for smaller TVs',
    category: 'table-top',
    minTvSize: 32,
    maxTvSize: 42,
    customerEstimate: CUSTOMER_ESTIMATES['table-top-small'],
    leadFee: LEAD_FEES['table-top-small']
  },
  'table-top-large': {
    key: 'table-top-large',
    name: 'Table Top Installation',
    description: 'Professional table top setup for larger TVs',
    category: 'table-top',
    minTvSize: 43,
    maxTvSize: null,
    customerEstimate: CUSTOMER_ESTIMATES['table-top-large'],
    leadFee: LEAD_FEES['table-top-large']
  },
  'bronze': {
    key: 'bronze',
    name: 'Bronze Installation',
    description: 'Professional wall mount with basic cable management',
    category: 'wall-mount',
    minTvSize: 32,
    maxTvSize: 65,
    customerEstimate: CUSTOMER_ESTIMATES['bronze'],
    leadFee: LEAD_FEES['bronze']
  },
  'silver': {
    key: 'silver',
    name: 'Silver Installation',
    description: 'Premium wall mount with advanced cable management',
    category: 'wall-mount',
    minTvSize: 32,
    maxTvSize: 65,
    customerEstimate: CUSTOMER_ESTIMATES['silver'],
    leadFee: LEAD_FEES['silver']
  },
  'silver-large': {
    key: 'silver-large',
    name: 'Silver Installation (Large)',
    description: 'Premium wall mount for large TVs with advanced cable management',
    category: 'wall-mount',
    minTvSize: 66,
    maxTvSize: null,
    customerEstimate: CUSTOMER_ESTIMATES['silver-large'],
    leadFee: LEAD_FEES['silver-large']
  },
  'gold': {
    key: 'gold',
    name: 'Gold Installation',
    description: 'Complete installation with full cable concealment',
    category: 'premium',
    minTvSize: 32,
    maxTvSize: 65,
    customerEstimate: CUSTOMER_ESTIMATES['gold'],
    leadFee: LEAD_FEES['gold']
  },
  'gold-large': {
    key: 'gold-large',
    name: 'Gold Installation (Large)',
    description: 'Complete installation for large TVs with full cable concealment',
    category: 'premium',
    minTvSize: 66,
    maxTvSize: null,
    customerEstimate: CUSTOMER_ESTIMATES['gold-large'],
    leadFee: LEAD_FEES['gold-large']
  }
};

export function getServiceTiersForTvSize(tvSize: number): ServiceTier[] {
  return Object.values(SERVICE_TIERS).filter((tier) => {
    return tvSize >= tier.minTvSize && (tier.maxTvSize === null || tvSize <= tier.maxTvSize);
  });
}

export function calculateBookingPricing(
  serviceType: string,
  addons: Array<{ key: string; name: string; price: number }> = []
): PricingResult {
  const serviceTier = SERVICE_TIERS[serviceType];
  if (!serviceTier) {
    throw new Error(`Unknown service type: ${serviceType}`);
  }

  const estimatedPrice = serviceTier.customerEstimate;
  const addonsPrice = addons.reduce((sum, addon) => sum + addon.price, 0);
  const totalEstimate = estimatedPrice + addonsPrice;
  const leadFee = serviceTier.leadFee;

  return {
    estimatedPrice,
    addonsPrice,
    totalEstimate,
    leadFee
  };
}

export function getLeadFee(serviceType: string): number {
  const serviceTier = SERVICE_TIERS[serviceType];
  return serviceTier ? serviceTier.leadFee : 15; // Default €15 lead fee
}

export function getCustomerEstimate(serviceType: string): number {
  const serviceTier = SERVICE_TIERS[serviceType];
  return serviceTier ? serviceTier.customerEstimate : 120; // Default €120 estimate
}