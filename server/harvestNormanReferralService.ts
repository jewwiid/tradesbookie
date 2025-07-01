import { db } from './db.js';
import { referralCodes, referralUsage, bookings } from '@shared/schema.js';
import { eq, and } from 'drizzle-orm';

export interface SalesStaffReferralCode {
  id: number;
  referralCode: string;
  salesStaffName: string;
  salesStaffStore: string;
  discountPercentage: number;
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
  /**
   * Create a new sales staff referral code for Harvey Norman
   */
  async createSalesStaffCode(
    salesStaffName: string,
    salesStaffStore: string,
    customCode?: string
  ): Promise<SalesStaffReferralCode> {
    // Generate unique code if not provided
    const referralCode = customCode || this.generateSalesStaffCode(salesStaffName);
    
    const [newCode] = await db.insert(referralCodes).values({
      referralCode,
      referralType: 'sales_staff',
      salesStaffName,
      salesStaffStore,
      discountPercentage: '10.00', // 10% discount for sales staff codes
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
      discountPercentage: parseFloat(newCode.discountPercentage),
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

      // Calculate discount
      const discountPercentage = parseFloat(code.discountPercentage);
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
          ? `10% discount applied (subsidized by installer)`
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
      discountPercentage: parseFloat(code.discountPercentage),
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
   * Generate a unique sales staff referral code
   */
  private generateSalesStaffCode(salesStaffName: string): string {
    const nameCode = salesStaffName
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 4)
      .toUpperCase();
    
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `HN${nameCode}${randomNum}`;
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