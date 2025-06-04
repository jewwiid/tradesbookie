import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `€${numPrice.toFixed(2)}`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function getMinDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

export function generateBookingId(): string {
  return `BK-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
}

export function getServiceTiersForTvSize(tvSize: number, serviceTiers: any[]) {
  return serviceTiers.filter(tier => {
    const minSize = tier.minTvSize || 0;
    const maxSize = tier.maxTvSize || 999;
    return tvSize >= minSize && tvSize <= maxSize;
  });
}

export function calculateBookingTotal(
  basePrice: number, 
  selectedAddons: Array<{ price: number }>
): number {
  const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  return basePrice + addonsTotal;
}
