// Lead pricing service - what installers pay to access customer requests
import { leadPricing, type LeadPricing, type InsertLeadPricing } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface EstimatedPrice {
  customerEstimate: number; // What customer sees as estimated price
  addonsEstimate: number;   // Estimated addon costs
  totalEstimate: number;    // Total estimated cost to customer
}

// Lead fees - what installers pay to access jobs by category
export const LEAD_FEES: Record<string, number> = {
  'table-top-small': 12.00,      // Small TV table mount (32-43")
  'table-top-medium': 15.00,     // Medium TV table mount (44-55")
  'table-top-large': 18.00,      // Large TV table mount (56-65")
  'bronze': 20.00,               // Standard wall mount
  'silver': 25.00,               // Premium wall mount with cable management
  'gold': 30.00,                 // Full-service with concealment
  'platinum': 35.00,             // Complex installation with soundbar
  'emergency': 40.00,            // Emergency/urgent requests
  'weekend': 30.00,              // Weekend installations
};

// What customers pay installers directly (for estimation purposes)
export const CUSTOMER_PRICING: Record<string, number> = {
  'table-top-small': 60,         // €60 for small table mount
  'table-top-medium': 75,        // €75 for medium table mount  
  'table-top-large': 95,         // €95 for large table mount
  'bronze': 120,                 // €120 for standard wall mount
  'silver': 180,                 // €180 for premium with cables
  'gold': 250,                   // €250 for full service
  'platinum': 320,               // €320 for complex with soundbar
  'emergency': 400,              // €400 for emergency service
  'weekend': 200,                // €200 for weekend service
};

export function getLeadFee(serviceType: string): number {
  return LEAD_FEES[serviceType] || 15.00; // Default €15 fee
}

export function getCustomerEstimate(serviceType: string): number {
  return CUSTOMER_PRICING[serviceType] || 120; // Default €120 estimate
}

export function calculateEstimatedPricing(
  serviceType: string,
  addons: Array<{ key: string; name: string; price: number }> = []
): EstimatedPrice {
  const baseEstimate = getCustomerEstimate(serviceType);
  const addonsEstimate = addons.reduce((sum, addon) => sum + addon.price, 0);
  const totalEstimate = baseEstimate + addonsEstimate;

  return {
    customerEstimate: baseEstimate,
    addonsEstimate,
    totalEstimate
  };
}

// Initialize default lead pricing in database
export async function initializeLeadPricing(): Promise<void> {
  try {
    // Check if lead pricing already exists
    const existing = await db.select().from(leadPricing).limit(1);
    if (existing.length > 0) {
      return; // Already initialized
    }

    // Insert default lead pricing for all service types
    const pricingData: InsertLeadPricing[] = Object.entries(LEAD_FEES).map(([serviceType, fee], index) => ({
      serviceType,
      leadFee: fee.toString(),
      priority: serviceType === 'emergency' ? 10 : index,
      isActive: true
    }));

    await db.insert(leadPricing).values(pricingData);
    console.log('Lead pricing initialized successfully');
  } catch (error) {
    console.error('Error initializing lead pricing:', error);
  }
}

export async function getLeadPricingFromDB(serviceType: string): Promise<LeadPricing | null> {
  try {
    const [pricing] = await db.select()
      .from(leadPricing)
      .where(eq(leadPricing.serviceType, serviceType))
      .limit(1);
    
    return pricing || null;
  } catch (error) {
    console.error('Error fetching lead pricing:', error);
    return null;
  }
}

export async function getAllLeadPricing(): Promise<LeadPricing[]> {
  try {
    return await db.select().from(leadPricing).where(eq(leadPricing.isActive, true));
  } catch (error) {
    console.error('Error fetching all lead pricing:', error);
    return [];
  }
}