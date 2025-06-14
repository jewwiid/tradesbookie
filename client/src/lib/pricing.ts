interface ServiceOption {
  key: string;
  name: string;
  description: string;
  price: number;
}

export const SERVICE_PRICING: Record<string, ServiceOption> = {
  'table-top-small': {
    key: 'table-top-small',
    name: 'Table Top Installation (Up to 43")',
    description: 'Professional table top setup and configuration',
    price: 89
  },
  'table-top-large': {
    key: 'table-top-large',
    name: 'Table Top Installation (43" and above)',
    description: 'Professional table top setup for larger TVs',
    price: 109
  },
  'bronze': {
    key: 'bronze',
    name: 'Bronze TV Mounting (up to 42")',
    description: 'Fixed wall mount installation',
    price: 109
  },
  'silver': {
    key: 'silver',
    name: 'Silver TV Mounting (43-85")',
    description: 'Tilting wall mount with cable management',
    price: 159
  },
  'silver-large': {
    key: 'silver-large',
    name: 'Silver TV Mounting (85"+)',
    description: 'Large TV tilting mount installation',
    price: 259
  },
  'gold': {
    key: 'gold',
    name: 'Gold TV Mounting',
    description: 'Full motion mount with premium features',
    price: 259
  },
  'gold-large': {
    key: 'gold-large',
    name: 'Gold TV Mounting (85"+)',
    description: 'Premium large TV full motion installation',
    price: 359
  }
};

export function getAvailableServices(tvSize: string): ServiceOption[] {
  const size = parseInt(tvSize);
  
  if (!size) return [];
  
  const services: ServiceOption[] = [];
  
  if (size <= 43) {
    services.push(
      SERVICE_PRICING['table-top-small'],
      SERVICE_PRICING['table-top-large'],
      SERVICE_PRICING['bronze'],
      SERVICE_PRICING['silver']
    );
  } else if (size <= 85) {
    services.push(
      SERVICE_PRICING['table-top-large'],
      SERVICE_PRICING['silver'],
      SERVICE_PRICING['gold']
    );
  } else {
    services.push(
      SERVICE_PRICING['silver-large'],
      SERVICE_PRICING['gold-large']
    );
  }
  
  return services;
}

export function calculatePricing(
  serviceType: string,
  addons: Array<{ key: string; name: string; price: number }> = [],
  feePercentage: number = 15
) {
  const basePrice = SERVICE_PRICING[serviceType]?.price || 0;
  const addonsPrice = addons.reduce((sum, addon) => sum + addon.price, 0);
  const totalPrice = basePrice + addonsPrice;
  const appFee = totalPrice * (feePercentage / 100);
  const installerEarnings = totalPrice - appFee;

  return {
    basePrice,
    addonsPrice,
    totalPrice,
    appFee,
    installerEarnings
  };
}
