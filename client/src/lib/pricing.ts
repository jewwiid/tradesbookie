interface ServiceOption {
  key: string;
  name: string;
  description: string;
  customerPrice: number; // What customer pays (with commission)
  installerEarnings: number; // What installer receives
}

// Base installer earnings
const INSTALLER_EARNINGS: Record<string, number> = {
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

export const SERVICE_PRICING: Record<string, ServiceOption> = {
  'table-top-small': {
    key: 'table-top-small',
    name: 'Table Top Installation',
    description: 'Professional table top setup and configuration',
    installerEarnings: INSTALLER_EARNINGS['table-top-small'],
    customerPrice: calculateCustomerPrice(INSTALLER_EARNINGS['table-top-small'])
  },
  'table-top-large': {
    key: 'table-top-large',
    name: 'Table Top Installation',
    description: 'Professional table top setup for larger TVs',
    installerEarnings: INSTALLER_EARNINGS['table-top-large'],
    customerPrice: calculateCustomerPrice(INSTALLER_EARNINGS['table-top-large'])
  },
  'bronze': {
    key: 'bronze',
    name: 'Bronze TV Mounting',
    description: 'Fixed wall mount installation',
    installerEarnings: INSTALLER_EARNINGS['bronze'],
    customerPrice: calculateCustomerPrice(INSTALLER_EARNINGS['bronze'])
  },
  'silver': {
    key: 'silver',
    name: 'Silver TV Mounting',
    description: 'Tilting wall mount with cable management',
    installerEarnings: INSTALLER_EARNINGS['silver'],
    customerPrice: calculateCustomerPrice(INSTALLER_EARNINGS['silver'])
  },
  'silver-large': {
    key: 'silver-large',
    name: 'Silver TV Mounting',
    description: 'Large TV tilting mount installation',
    installerEarnings: INSTALLER_EARNINGS['silver-large'],
    customerPrice: calculateCustomerPrice(INSTALLER_EARNINGS['silver-large'])
  },
  'gold': {
    key: 'gold',
    name: 'Gold TV Mounting',
    description: 'Full motion mount with premium features',
    installerEarnings: INSTALLER_EARNINGS['gold'],
    customerPrice: calculateCustomerPrice(INSTALLER_EARNINGS['gold'])
  },
  'gold-large': {
    key: 'gold-large',
    name: 'Gold TV Mounting',
    description: 'Premium large TV full motion installation',
    installerEarnings: INSTALLER_EARNINGS['gold-large'],
    customerPrice: calculateCustomerPrice(INSTALLER_EARNINGS['gold-large'])
  }
};

export function getAvailableServices(tvSize: string): ServiceOption[] {
  const size = parseInt(tvSize);
  
  if (!size) return [];
  
  const services: ServiceOption[] = [];
  
  if (size <= 42) {
    services.push(
      SERVICE_PRICING['table-top-small'],
      SERVICE_PRICING['bronze']
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
  addons: Array<{ key: string; name: string; price: number }> = []
) {
  const service = SERVICE_PRICING[serviceType];
  if (!service) {
    throw new Error(`Unknown service type: ${serviceType}`);
  }

  const baseInstallerEarnings = service.installerEarnings;
  const addonsPrice = addons.reduce((sum, addon) => sum + addon.price, 0);
  const totalInstallerEarnings = baseInstallerEarnings + addonsPrice;
  
  // Calculate customer price with commission
  const appFee = totalInstallerEarnings * COMMISSION_RATE;
  const totalPrice = totalInstallerEarnings + appFee;

  return {
    basePrice: baseInstallerEarnings,
    addonsPrice,
    totalPrice,
    appFee,
    installerEarnings: totalInstallerEarnings
  };
}
