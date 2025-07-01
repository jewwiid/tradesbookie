import { db } from "./db";
import { pricingConfig, type PricingConfig, type InsertPricingConfig } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface PricingItem {
  id: number;
  category: string;
  itemKey: string;
  name: string;
  description?: string;
  customerPrice: number;
  leadFee: number;
  minTvSize?: number;
  maxTvSize?: number;
  isActive: boolean;
}

export class PricingManagementService {
  /**
   * Get all pricing configurations by category
   */
  async getPricingByCategory(category: 'service' | 'addon' | 'bracket'): Promise<PricingItem[]> {
    try {
      const results = await db
        .select()
        .from(pricingConfig)
        .where(and(
          eq(pricingConfig.category, category),
          eq(pricingConfig.isActive, true)
        ));

      return results.map(item => ({
        id: item.id,
        category: item.category,
        itemKey: item.itemKey,
        name: item.name,
        description: item.description || undefined,
        customerPrice: parseFloat(item.customerPrice),
        leadFee: parseFloat(item.leadFee),
        minTvSize: item.minTvSize || undefined,
        maxTvSize: item.maxTvSize || undefined,
        isActive: item.isActive
      }));
    } catch (error) {
      console.error('Error fetching pricing by category:', error);
      return [];
    }
  }

  /**
   * Get all pricing configurations
   */
  async getAllPricing(): Promise<PricingItem[]> {
    try {
      const results = await db
        .select()
        .from(pricingConfig)
        .where(eq(pricingConfig.isActive, true));

      return results.map(item => ({
        id: item.id,
        category: item.category,
        itemKey: item.itemKey,
        name: item.name,
        description: item.description || undefined,
        customerPrice: parseFloat(item.customerPrice),
        leadFee: parseFloat(item.leadFee),
        minTvSize: item.minTvSize || undefined,
        maxTvSize: item.maxTvSize || undefined,
        isActive: item.isActive
      }));
    } catch (error) {
      console.error('Error fetching all pricing:', error);
      return [];
    }
  }

  /**
   * Get pricing for a specific item by key
   */
  async getPricingByKey(itemKey: string): Promise<PricingItem | null> {
    try {
      const result = await db
        .select()
        .from(pricingConfig)
        .where(and(
          eq(pricingConfig.itemKey, itemKey),
          eq(pricingConfig.isActive, true)
        ))
        .limit(1);

      if (result.length === 0) return null;

      const item = result[0];
      return {
        id: item.id,
        category: item.category,
        itemKey: item.itemKey,
        name: item.name,
        description: item.description || undefined,
        customerPrice: parseFloat(item.customerPrice),
        leadFee: parseFloat(item.leadFee),
        minTvSize: item.minTvSize || undefined,
        maxTvSize: item.maxTvSize || undefined,
        isActive: item.isActive
      };
    } catch (error) {
      console.error('Error fetching pricing by key:', error);
      return null;
    }
  }

  /**
   * Create or update a pricing configuration
   */
  async upsertPricing(pricing: Omit<PricingItem, 'id'> & { id?: number }): Promise<PricingItem> {
    try {
      const pricingData: InsertPricingConfig = {
        category: pricing.category,
        itemKey: pricing.itemKey,
        name: pricing.name,
        description: pricing.description || null,
        customerPrice: pricing.customerPrice.toString(),
        leadFee: pricing.leadFee.toString(),
        minTvSize: pricing.minTvSize || null,
        maxTvSize: pricing.maxTvSize || null,
        isActive: pricing.isActive
      };

      let result;
      if (pricing.id) {
        // Update existing
        const updated = await db
          .update(pricingConfig)
          .set({ ...pricingData, updatedAt: new Date() })
          .where(eq(pricingConfig.id, pricing.id))
          .returning();
        result = updated[0];
      } else {
        // Create new
        const created = await db
          .insert(pricingConfig)
          .values(pricingData)
          .returning();
        result = created[0];
      }

      return {
        id: result.id,
        category: result.category,
        itemKey: result.itemKey,
        name: result.name,
        description: result.description || undefined,
        customerPrice: parseFloat(result.customerPrice),
        leadFee: parseFloat(result.leadFee),
        minTvSize: result.minTvSize || undefined,
        maxTvSize: result.maxTvSize || undefined,
        isActive: result.isActive
      };
    } catch (error) {
      console.error('Error upserting pricing:', error);
      throw new Error('Failed to save pricing configuration');
    }
  }

  /**
   * Delete a pricing configuration (soft delete)
   */
  async deletePricing(id: number): Promise<boolean> {
    try {
      await db
        .update(pricingConfig)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(pricingConfig.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting pricing:', error);
      return false;
    }
  }

  /**
   * Initialize default pricing configurations
   */
  async initializeDefaultPricing(): Promise<void> {
    try {
      // Check if pricing already exists
      const existing = await db.select().from(pricingConfig).limit(1);
      if (existing.length > 0) {
        console.log('Pricing configurations already exist');
        return;
      }

      console.log('Initializing default pricing configurations...');

      // Default service pricing
      const defaultServices = [
        {
          category: 'service',
          itemKey: 'table-top-small',
          name: 'Table Top Installation (Small)',
          description: 'Professional table top setup for TVs 32"-42"',
          customerPrice: 60,
          leadFee: 12,
          minTvSize: 32,
          maxTvSize: 42
        },
        {
          category: 'service',
          itemKey: 'table-top-large',
          name: 'Table Top Installation (Large)',
          description: 'Professional table top setup for TVs 43"+ ',
          customerPrice: 85,
          leadFee: 15,
          minTvSize: 43,
          maxTvSize: null
        },
        {
          category: 'service',
          itemKey: 'bronze',
          name: 'Bronze Wall Mount',
          description: 'Standard wall mount with basic cable management',
          customerPrice: 120,
          leadFee: 20,
          minTvSize: 32,
          maxTvSize: 65
        },
        {
          category: 'service',
          itemKey: 'silver',
          name: 'Silver Premium',
          description: 'Premium wall mount with advanced cable management',
          customerPrice: 180,
          leadFee: 25,
          minTvSize: 32,
          maxTvSize: 65
        },
        {
          category: 'service',
          itemKey: 'silver-large',
          name: 'Silver Premium (Large)',
          description: 'Premium wall mount for large TVs 66"+',
          customerPrice: 280,
          leadFee: 30,
          minTvSize: 66,
          maxTvSize: null
        },
        {
          category: 'service',
          itemKey: 'gold',
          name: 'Gold Premium',
          description: 'Complete installation with full cable concealment',
          customerPrice: 250,
          leadFee: 30,
          minTvSize: 32,
          maxTvSize: 65
        },
        {
          category: 'service',
          itemKey: 'gold-large',
          name: 'Gold Premium (Large)',
          description: 'Complete installation for large TVs with full concealment',
          customerPrice: 380,
          leadFee: 35,
          minTvSize: 66,
          maxTvSize: null
        }
      ];

      // Default addon pricing
      const defaultAddons = [
        {
          category: 'addon',
          itemKey: 'soundbar-mounting',
          name: 'Soundbar Mounting',
          description: 'Professional soundbar installation below TV',
          customerPrice: 45,
          leadFee: 5,
          minTvSize: null,
          maxTvSize: null
        },
        {
          category: 'addon',
          itemKey: 'cable-concealment',
          name: 'Cable Concealment',
          description: 'Hide cables behind wall or in conduit',
          customerPrice: 35,
          leadFee: 5,
          minTvSize: null,
          maxTvSize: null
        },
        {
          category: 'addon',
          itemKey: 'additional-devices',
          name: 'Additional Device Setup',
          description: 'Connect and configure additional devices',
          customerPrice: 25,
          leadFee: 3,
          minTvSize: null,
          maxTvSize: null
        }
      ];

      // Default bracket pricing
      const defaultBrackets = [
        {
          category: 'bracket',
          itemKey: 'fixed-bracket',
          name: 'Fixed Wall Bracket',
          description: 'Basic fixed position bracket',
          customerPrice: 25,
          leadFee: 0,
          minTvSize: null,
          maxTvSize: null
        },
        {
          category: 'bracket',
          itemKey: 'tilt-bracket',
          name: 'Tilt Wall Bracket',
          description: 'Adjustable tilt bracket',
          customerPrice: 45,
          leadFee: 0,
          minTvSize: null,
          maxTvSize: null
        },
        {
          category: 'bracket',
          itemKey: 'full-motion-bracket',
          name: 'Full Motion Bracket',
          description: 'Swivel and tilt bracket with extended arm',
          customerPrice: 85,
          leadFee: 0,
          minTvSize: null,
          maxTvSize: null
        }
      ];

      // Insert all default pricing
      const allDefaultPricing = [...defaultServices, ...defaultAddons, ...defaultBrackets];
      
      for (const pricing of allDefaultPricing) {
        await db.insert(pricingConfig).values({
          category: pricing.category,
          itemKey: pricing.itemKey,
          name: pricing.name,
          description: pricing.description,
          customerPrice: pricing.customerPrice.toString(),
          leadFee: pricing.leadFee.toString(),
          minTvSize: pricing.minTvSize,
          maxTvSize: pricing.maxTvSize,
          isActive: true
        });
      }

      console.log('Default pricing configurations created successfully');
    } catch (error) {
      console.error('Error initializing default pricing:', error);
    }
  }
}

export const pricingManagementService = new PricingManagementService();