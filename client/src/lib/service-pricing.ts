export interface ServiceTier {
  key: string;
  name: string;
  description: string;
  basePrice: number;
  tvSizeMin?: number;
  tvSizeMax?: number;
  isActive: boolean;
}

export interface Addon {
  key: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
}

export const getApplicableServices = (tvSize: number, serviceTiers: ServiceTier[]): ServiceTier[] => {
  return serviceTiers.filter(tier => {
    if (tier.tvSizeMin && tvSize < tier.tvSizeMin) return false;
    if (tier.tvSizeMax && tvSize > tier.tvSizeMax) return false;
    return tier.isActive;
  });
};

export const calculateTotal = (
  basePrice: number,
  selectedAddons: Addon[],
  feePercentage: number = 0
): {
  subtotal: number;
  addonTotal: number;
  appFee: number;
  total: number;
} => {
  const addonTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const subtotal = basePrice + addonTotal;
  const appFee = (subtotal * feePercentage) / 100;
  const total = subtotal + appFee;

  return {
    subtotal,
    addonTotal,
    appFee,
    total,
  };
};

export const formatPrice = (price: number): string => {
  return `€${price.toFixed(2)}`;
};

export const getTVSizeCategory = (size: number): string => {
  if (size <= 32) return "Small";
  if (size <= 43) return "Medium";
  if (size <= 55) return "Large";
  if (size <= 65) return "X-Large";
  if (size <= 75) return "XX-Large";
  return "Premium";
};

export const getMountTypeIcon = (mountType: string): string => {
  switch (mountType) {
    case "fixed":
      return "square";
    case "tilting":
      return "angle-down";
    case "full-motion":
      return "arrows-alt";
    default:
      return "tv";
  }
};

export const getWallTypeImage = (wallType: string): string => {
  switch (wallType) {
    case "drywall":
      return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&h=200&fit=crop";
    case "concrete":
      return "https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=300&h=200&fit=crop";
    case "brick":
      return "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop";
    default:
      return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&h=200&fit=crop";
  }
};
