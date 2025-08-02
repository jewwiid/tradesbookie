import { db } from './db.js';
import { referralCodes, referralUsage, bookings, referralSettings } from '@shared/schema.js';
import { eq, and } from 'drizzle-orm';

export interface SalesStaffReferralCode {
  id: number;
  referralCode: string;
  salesStaffName: string;
  salesStaffStore: string;
  isActive: boolean;
}

export interface ReferralDiscountResult {
  success: boolean;
  discountAmount: number;
  discountPercentage: number;
  subsidyAmount: number; // Amount installer will pay
  referralCodeId?: number;
  salesStaffName?: string;
  salesStaffStore?: string;
  message?: string;
}

export class HarveyNormanReferralService {
  // Harvey Norman store code mapping
  private readonly storeAbbreviations: { [key: string]: string } = {
    'Blanchardstown': 'BLA',
    'Carrickmines': 'CKM',
    'Cork': 'CRK',
    'Castlebar': 'CAS',
    'Drogheda': 'DRO',
    'Fonthill': 'FON',
    'Galway': 'GAL',
    'Kinsale Road': 'KIN',
    'Limerick': 'LIM',
    'Little Island': 'LIT',
    'Naas': 'NAA',
    'Rathfarnham': 'RAT',
    'Sligo': 'SLI',
    'Swords': 'SWO',
    'Tallaght': 'TAL',
    'Tralee': 'TRA',
    'Waterford': 'WAT'
  };

  /**
   * Create a new sales staff referral code for Harvey Norman
   */
  async createSalesStaffCode(
    salesStaffName: string,
    salesStaffStore: string,
    customCode?: string
  ): Promise<SalesStaffReferralCode> {
    // Generate unique code if not provided
    const referralCode = customCode || this.generateSalesStaffCode(salesStaffName, salesStaffStore);
    
    const [newCode] = await db.insert(referralCodes).values({
      referralCode,
      referralType: 'sales_staff',
      salesStaffName,
      salesStaffStore,
      userId: null, // Sales staff codes don't have user IDs
      totalReferrals: 0,
      totalEarnings: '0.00',
      isActive: true,
    }).returning();

    return {
      id: newCode.id,
      referralCode: newCode.referralCode,
      salesStaffName: newCode.salesStaffName!,
      salesStaffStore: newCode.salesStaffStore!,
      isActive: newCode.isActive,
    };
  }

  /**
   * Validate and calculate discount for a referral code
   */
  async validateAndCalculateDiscount(
    referralCode: string,
    bookingAmount: number
  ): Promise<ReferralDiscountResult> {
    try {
      // Find the referral code
      const [code] = await db.select()
        .from(referralCodes)
        .where(and(
          eq(referralCodes.referralCode, referralCode),
          eq(referralCodes.isActive, true)
        ));

      if (!code) {
        return {
          success: false,
          discountAmount: 0,
          discountPercentage: 0,
          subsidyAmount: 0,
          message: 'Invalid or inactive referral code'
        };
      }

      // Get global discount percentage from settings
      const [settings] = await db.select()
        .from(referralSettings)
        .limit(1);

      const discountPercentage = settings ? parseFloat(settings.globalDiscountPercentage) : 10;
      const discountAmount = Math.round((bookingAmount * discountPercentage / 100) * 100) / 100;
      
      // For sales staff codes, the installer subsidizes the full discount
      const subsidyAmount = code.referralType === 'sales_staff' ? discountAmount : 0;

      return {
        success: true,
        discountAmount,
        discountPercentage,
        subsidyAmount,
        referralCodeId: code.id,
        salesStaffName: code.salesStaffName || undefined,
        salesStaffStore: code.salesStaffStore || undefined,
        message: code.referralType === 'sales_staff' 
          ? `${discountPercentage}% discount applied (subsidized by installer)`
          : `${discountPercentage}% discount applied`
      };
    } catch (error) {
      console.error('Error validating referral code:', error);
      return {
        success: false,
        discountAmount: 0,
        discountPercentage: 0,
        subsidyAmount: 0,
        message: 'Error validating referral code'
      };
    }
  }

  /**
   * Apply referral discount to a booking
   */
  async applyReferralToBooking(
    bookingId: number,
    referralCodeId: number,
    discountAmount: number,
    subsidyAmount: number,
    customerUserId?: string
  ): Promise<boolean> {
    try {
      // Get referral code details
      const [code] = await db.select()
        .from(referralCodes)
        .where(eq(referralCodes.id, referralCodeId));

      if (!code) return false;

      // Create referral usage record
      await db.insert(referralUsage).values({
        referralCodeId,
        bookingId,
        referrerUserId: code.userId, // Null for sales staff codes
        refereeUserId: customerUserId || null,
        discountAmount: discountAmount.toString(),
        rewardAmount: '0.00', // No reward for sales staff referrals
        subsidizedByInstaller: code.referralType === 'sales_staff',
        installerSubsidyAmount: subsidyAmount.toString(),
        status: 'pending',
        paidOut: false,
      });

      // Update referral code statistics
      await db.update(referralCodes)
        .set({
          totalReferrals: code.totalReferrals + 1,
          totalEarnings: (parseFloat(code.totalEarnings) + subsidyAmount).toString(),
        })
        .where(eq(referralCodes.id, referralCodeId));

      return true;
    } catch (error) {
      console.error('Error applying referral to booking:', error);
      return false;
    }
  }

  /**
   * Get all active sales staff referral codes
   */
  async getAllSalesStaffCodes(): Promise<SalesStaffReferralCode[]> {
    const codes = await db.select()
      .from(referralCodes)
      .where(and(
        eq(referralCodes.referralType, 'sales_staff'),
        eq(referralCodes.isActive, true)
      ));

    return codes.map(code => ({
      id: code.id,
      referralCode: code.referralCode,
      salesStaffName: code.salesStaffName!,
      salesStaffStore: code.salesStaffStore!,
      isActive: code.isActive,
    }));
  }

  /**
   * Calculate additional lead fee for installer (includes subsidy)
   */
  calculateInstallerLeadFeeWithSubsidy(
    baseFee: number,
    subsidyAmount: number
  ): number {
    return baseFee + subsidyAmount;
  }

  /**
   * Generate a unique sales staff referral code in format HNSTORESTAFF
   */
  private generateSalesStaffCode(salesStaffName: string, salesStaffStore?: string): string {
    // Get store abbreviation if store is provided
    const storeCode = salesStaffStore ? this.storeAbbreviations[salesStaffStore] || 'UNK' : 'UNK';
    
    const nameCode = salesStaffName
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 4)
      .toUpperCase();
    
    return `HN${storeCode}${nameCode}`;
  }

  /**
   * Parse referral code to extract components (supports both old and new formats)
   */
  private parseReferralCode(code: string): { isValid: boolean; name?: string; store?: string } {
    // New format: HNSTORESTAFF (store first, then staff name)
    const newFormatMatch = code.match(/^HN([A-Z]{3})([A-Z]{2,4})$/);
    if (newFormatMatch) {
      return {
        isValid: true,
        store: newFormatMatch[1],
        name: newFormatMatch[2]
      };
    }

    // Legacy format: HNNAMESTORE (name first, then store)
    const legacyFormatMatch = code.match(/^HN([A-Z]{2,4})([A-Z]{3})$/);
    if (legacyFormatMatch) {
      return {
        isValid: true,
        name: legacyFormatMatch[1],
        store: legacyFormatMatch[2]
      };
    }

    // Legacy format with hyphens: HN-NAME-STORE (for backward compatibility)
    const legacyHyphenFormatMatch = code.match(/^HN-([A-Z]{2,4})-([A-Z]{3})$/);
    if (legacyHyphenFormatMatch) {
      return {
        isValid: true,
        name: legacyHyphenFormatMatch[1],
        store: legacyHyphenFormatMatch[2]
      };
    }

    return { isValid: false };
  }

  /**
   * Deactivate a sales staff referral code
   */
  async deactivateSalesStaffCode(referralCodeId: number): Promise<boolean> {
    try {
      await db.update(referralCodes)
        .set({ isActive: false })
        .where(eq(referralCodes.id, referralCodeId));
      return true;
    } catch (error) {
      console.error('Error deactivating sales staff code:', error);
      return false;
    }
  }
}

export const harveyNormanReferralService = new HarveyNormanReferralService();