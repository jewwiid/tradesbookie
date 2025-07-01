// Dynamic pricing service to replace hardcoded constants
import { apiRequest } from './queryClient';

export interface ServiceTier {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  customerPrice: number;
  leadFee: number;
  installerEarnings: number;
  minTvSize: number;
  maxTvSize: number | null;
  icon?: string;
  gradient?: string;
}

export interface PricingItem {
  id: number;
  category: string;
  itemKey: string;
  name: string;
  description: string;
  customerPrice: number;
  leadFee: number;
  minTvSize?: number;
  maxTvSize?: number;
  isActive: boolean;
}

// Icon mapping for service tiers
const getServiceIcon = (key: string): string => {
  const iconMap: Record<string, string> = {
    'table-top-small': 'desktop',
    'table-top-large': 'desktop',
    'bronze': 'medal',
    'silver': 'award',
    'silver-large': 'award',
    'gold': 'crown',
    'gold-large': 'crown'
  };
  return iconMap[key] || 'wrench';
};

// Gradient mapping for service tiers
const getServiceGradient = (key: string): string => {
  const gradientMap: Record<string, string> = {
    'table-top-small': 'table-top',
    'table-top-large': 'table-top',
    'bronze': 'bronze',
    'silver': 'silver',
    'silver-large': 'silver',
    'gold': 'gold',
    'gold-large': 'gold'
  };
  return gradientMap[key] || 'default';
};

// Fetch service tiers from API with dynamic pricing
export async function getServiceTiers(tvSize?: number): Promise<ServiceTier[]> {
  try {
    const url = tvSize ? `/api/service-tiers?tvSize=${tvSize}` : '/api/service-tiers';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch service tiers');
    }
    
    const data = await response.json();
    
    // Transform API response to ServiceTier format
    return data.map((tier: any) => ({
      id: tier.id || tier.key,
      key: tier.key,
      name: tier.name,
      description: tier.description,
      category: tier.category,
      basePrice: tier.basePrice || tier.customerPrice,
      customerPrice: tier.customerPrice,
      leadFee: tier.leadFee,
      installerEarnings: tier.installerEarnings || (tier.customerPrice - tier.leadFee),
      minTvSize: tier.minTvSize,
      maxTvSize: tier.maxTvSize,
      icon: getServiceIcon(tier.key),
      gradient: getServiceGradient(tier.key)
    }));
  } catch (error) {
    console.error('Error fetching service tiers:', error);
    
    // Fallback to basic service tiers in case of API failure
    return getFallbackServiceTiers(tvSize);
  }
}

// Filter service tiers by TV size
export function getServiceTiersForTvSize(tvSize: number, serviceTiers: ServiceTier[]): ServiceTier[] {
  return serviceTiers.filter(tier => {
    return tvSize >= tier.minTvSize && (tier.maxTvSize === null || tvSize <= tier.maxTvSize);
  });
}

// Fallback service tiers (basic hardcoded data)
function getFallbackServiceTiers(tvSize?: number): ServiceTier[] {
  const fallbackTiers: ServiceTier[] = [
    {
      id: '1',
      key: 'table-top-small',
      name: 'Table Top Installation (Small)',
      description: 'Professional table top setup for smaller TVs',
      category: 'table-top',
      basePrice: 60,
      customerPrice: 60,
      leadFee: 12,
      installerEarnings: 48,
      minTvSize: 32,
      maxTvSize: 42,
      icon: 'desktop',
      gradient: 'table-top'
    },
    {
      id: '2',
      key: 'bronze',
      name: 'Bronze Wall Mount',
      description: 'Standard wall mount with basic cable management',
      category: 'wall-mount',
      basePrice: 120,
      customerPrice: 120,
      leadFee: 20,
      installerEarnings: 100,
      minTvSize: 32,
      maxTvSize: 65,
      icon: 'medal',
      gradient: 'bronze'
    },
    {
      id: '3',
      key: 'silver',
      name: 'Silver Premium',
      description: 'Premium wall mount with advanced cable management',
      category: 'premium',
      basePrice: 180,
      customerPrice: 180,
      leadFee: 25,
      installerEarnings: 155,
      minTvSize: 32,
      maxTvSize: 85,
      icon: 'award',
      gradient: 'silver'
    }
  ];

  if (tvSize) {
    return getServiceTiersForTvSize(tvSize, fallbackTiers);
  }

  return fallbackTiers;
}

// Get available services based on TV size (backward compatibility)
export function getAvailableServices(tvSize?: number): ServiceTier[] {
  if (!tvSize) return [];
  
  // This function should now fetch from API
  // For now, return empty array to force components to use the new async pattern
  console.warn('getAvailableServices is deprecated, use getServiceTiers instead');
  return [];
}

// Fetch add-on pricing from API
export async function getAddonPricing(): Promise<PricingItem[]> {
  try {
    const response = await fetch('/api/admin/pricing?category=addon');
    
    if (!response.ok) {
      throw new Error('Failed to fetch addon pricing');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching addon pricing:', error);
    return getFallbackAddonPricing();
  }
}

// Fallback addon pricing
function getFallbackAddonPricing(): PricingItem[] {
  return [
    {
      id: 1,
      category: 'addon',
      itemKey: 'cable-concealment',
      name: 'Cable Concealment',
      description: 'Hide cables in wall for clean look',
      customerPrice: 25,
      leadFee: 5,
      isActive: true
    },
    {
      id: 2,
      category: 'addon',
      itemKey: 'soundbar-mounting',
      name: 'Soundbar Mounting',
      description: 'Mount soundbar below TV',
      customerPrice: 35,
      leadFee: 7,
      isActive: true
    }
  ];
}