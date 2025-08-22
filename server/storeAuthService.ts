import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import { storeUsers, storeMetrics, storeQrScans, storeReferralUsage, type StoreUser, type InsertStoreUser } from "@shared/schema";
import { retailerDetectionService } from "./retailerDetectionService";
import bcrypt from "bcrypt";

export interface StoreLoginResult {
  success: boolean;
  storeUser?: StoreUser;
  message: string;
  token?: string;
}

export interface StoreRegistrationResult {
  success: boolean;
  storeUser?: StoreUser;
  message: string;
}

export interface StoreDashboardData {
  storeInfo: {
    storeName: string;
    retailerCode: string;
    storeCode?: string;
  };
  metrics: {
    totalQrScans: number;
    qrScansThisMonth: number;
    totalReferralUses: number;
    referralUsesThisMonth: number;
    totalReferralEarnings: string;
    activeStaffCount: number;
  };
  recentActivity: {
    qrScans: Array<{
      qrCodeId: string;
      aiTool?: string;
      scannedAt: Date;
      sessionId: string;
    }>;
    referralUses: Array<{
      referralCode: string;
      staffName?: string;
      discountAmount: string;
      usedAt: Date;
    }>;
  };
}

export class StoreAuthService {
  
  /**
   * Register a new store user with email and store code/name as password
   */
  async registerStore(
    email: string, 
    password: string, // This will be the store code/name
    retailerName: string
  ): Promise<StoreRegistrationResult> {
    try {
      // Normalize retailer name to find retailer code
      const retailerCode = this.getRetailerCodeFromName(retailerName);
      if (!retailerCode) {
        return {
          success: false,
          message: `Retailer "${retailerName}" is not supported. Supported retailers: ${this.getSupportedRetailerNames().join(', ')}`
        };
      }

      // Get retailer info
      const retailer = retailerDetectionService.getRetailer(retailerCode);
      if (!retailer) {
        return {
          success: false,
          message: "Retailer not found in our system"
        };
      }

      // Determine store from password (could be store code or store name)
      const storeInfo = this.determineStoreFromPassword(password, retailer);
      
      // Check if store user already exists
      const existingUser = await db.select()
        .from(storeUsers)
        .where(
          and(
            eq(storeUsers.email, email),
            eq(storeUsers.retailerCode, retailerCode)
          )
        )
        .limit(1);

      if (existingUser.length > 0) {
        return {
          success: false,
          message: "A store account with this email already exists for this retailer"
        };
      }

      // Hash the password (store code/name)
      const passwordHash = await bcrypt.hash(password, 10);

      // Create store user
      const newStoreUser: InsertStoreUser = {
        email,
        passwordHash,
        retailerCode,
        storeCode: storeInfo.storeCode,
        storeName: storeInfo.storeName
      };

      const [createdUser] = await db.insert(storeUsers)
        .values(newStoreUser)
        .returning();

      // Initialize store metrics
      await this.initializeStoreMetrics(retailerCode, storeInfo.storeCode, storeInfo.storeName);

      return {
        success: true,
        storeUser: createdUser,
        message: `Store account created successfully for ${storeInfo.storeName}`
      };

    } catch (error) {
      console.error('Store registration error:', error);
      return {
        success: false,
        message: "Unable to create store account at this time. Please try again later."
      };
    }
  }

  /**
   * Login with email and store code/name as password
   */
  async loginStore(email: string, password: string): Promise<StoreLoginResult> {
    try {
      // Find store user by email
      const storeUser = await db.select()
        .from(storeUsers)
        .where(eq(storeUsers.email, email))
        .limit(1);

      if (storeUser.length === 0) {
        return {
          success: false,
          message: "No store account found with this email address"
        };
      }

      const user = storeUser[0];

      // Verify password (store code/name)
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      
      if (!passwordMatch) {
        return {
          success: false,
          message: "Invalid store code/password"
        };
      }

      // Check if account is active
      if (!user.isActive) {
        return {
          success: false,
          message: "This store account has been deactivated. Please contact support."
        };
      }

      // Update last login time
      await db.update(storeUsers)
        .set({ lastLoginAt: new Date() })
        .where(eq(storeUsers.id, user.id));

      // Generate simple token (in production, use JWT)
      const token = `store_${user.id}_${Date.now()}`;

      return {
        success: true,
        storeUser: user,
        token,
        message: `Welcome back to ${user.storeName} dashboard`
      };

    } catch (error) {
      console.error('Store login error:', error);
      return {
        success: false,
        message: "Unable to process login at this time. Please try again later."
      };
    }
  }

  /**
   * Get store dashboard data with metrics
   */
  async getStoreDashboard(storeUserId: number): Promise<StoreDashboardData | null> {
    try {
      // Get store user info
      const storeUser = await db.select()
        .from(storeUsers)
        .where(eq(storeUsers.id, storeUserId))
        .limit(1);

      if (storeUser.length === 0) {
        return null;
      }

      const user = storeUser[0];

      // Get store metrics
      const metrics = await db.select()
        .from(storeMetrics)
        .where(
          and(
            eq(storeMetrics.retailerCode, user.retailerCode),
            user.storeCode ? eq(storeMetrics.storeCode, user.storeCode) : sql`store_code IS NULL`
          )
        )
        .limit(1);

      const currentMetrics = metrics[0] || {
        totalQrScans: 0,
        qrScansThisMonth: 0,
        totalReferralUses: 0,
        referralUsesThisMonth: 0,
        totalReferralEarnings: "0.00",
        activeStaffCount: 0
      };

      // Get recent QR scans
      const recentQrScans = await db.select({
        qrCodeId: storeQrScans.qrCodeId,
        aiTool: storeQrScans.aiTool,
        scannedAt: storeQrScans.scannedAt,
        sessionId: storeQrScans.sessionId
      })
      .from(storeQrScans)
      .where(
        and(
          eq(storeQrScans.retailerCode, user.retailerCode),
          user.storeCode ? eq(storeQrScans.storeCode, user.storeCode) : sql`store_code IS NULL`
        )
      )
      .orderBy(desc(storeQrScans.scannedAt))
      .limit(10);

      // Get recent referral uses
      const recentReferrals = await db.select({
        referralCode: storeReferralUsage.referralCode,
        staffName: storeReferralUsage.staffName,
        discountAmount: storeReferralUsage.discountAmount,
        usedAt: storeReferralUsage.usedAt
      })
      .from(storeReferralUsage)
      .where(
        and(
          eq(storeReferralUsage.retailerCode, user.retailerCode),
          user.storeCode ? eq(storeReferralUsage.storeCode, user.storeCode) : sql`store_code IS NULL`
        )
      )
      .orderBy(desc(storeReferralUsage.usedAt))
      .limit(10);

      return {
        storeInfo: {
          storeName: user.storeName,
          retailerCode: user.retailerCode,
          storeCode: user.storeCode || undefined
        },
        metrics: {
          totalQrScans: currentMetrics.totalQrScans,
          qrScansThisMonth: currentMetrics.qrScansThisMonth,
          totalReferralUses: currentMetrics.totalReferralUses,
          referralUsesThisMonth: currentMetrics.referralUsesThisMonth,
          totalReferralEarnings: currentMetrics.totalReferralEarnings,
          activeStaffCount: currentMetrics.activeStaffCount
        },
        recentActivity: {
          qrScans: recentQrScans,
          referralUses: recentReferrals
        }
      };

    } catch (error) {
      console.error('Store dashboard error:', error);
      return null;
    }
  }

  /**
   * Track QR code scan for a store
   */
  async trackQrScan(
    qrCodeId: string,
    retailerCode: string,
    storeCode: string | undefined,
    userId: string | null,
    sessionId: string,
    aiTool?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const retailer = retailerDetectionService.getRetailer(retailerCode);
      if (!retailer) return;

      const storeName = storeCode && retailer.storeLocations?.[storeCode] 
        ? `${retailer.fullName} ${retailer.storeLocations[storeCode]}`
        : retailer.fullName;

      // Record the scan
      await db.insert(storeQrScans).values({
        qrCodeId,
        retailerCode,
        storeCode,
        storeName,
        userId,
        sessionId,
        aiTool,
        ipAddress,
        userAgent
      });

      // Update metrics
      await this.updateStoreMetrics(retailerCode, storeCode, storeName, 'qr_scan');

    } catch (error) {
      console.error('Error tracking QR scan:', error);
    }
  }

  /**
   * Track referral code usage for a store
   */
  async trackReferralUsage(
    referralCode: string,
    retailerCode: string,
    storeCode: string | undefined,
    staffName: string | undefined,
    customerId: string,
    bookingId?: number,
    discountAmount?: string,
    rewardAmount?: string
  ): Promise<void> {
    try {
      const retailer = retailerDetectionService.getRetailer(retailerCode);
      if (!retailer) return;

      const storeName = storeCode && retailer.storeLocations?.[storeCode] 
        ? `${retailer.fullName} ${retailer.storeLocations[storeCode]}`
        : retailer.fullName;

      // Record the referral usage
      await db.insert(storeReferralUsage).values({
        referralCode,
        retailerCode,
        storeCode,
        storeName,
        staffName,
        customerId,
        bookingId,
        discountAmount: discountAmount || "0.00",
        rewardAmount: rewardAmount || "0.00"
      });

      // Update metrics
      await this.updateStoreMetrics(retailerCode, storeCode, storeName, 'referral_use');

    } catch (error) {
      console.error('Error tracking referral usage:', error);
    }
  }

  // Private helper methods

  private getRetailerCodeFromName(retailerName: string): string | null {
    const normalizedName = retailerName.toLowerCase().replace(/\s+/g, '');
    
    const nameMap: Record<string, string> = {
      'harveynorman': 'HN',
      'currys': 'CR',
      'curryspcworld': 'CR',
      'didelectrical': 'DD',
      'did': 'DD',
      'powercity': 'PC',
      'argos': 'AR',
      'expert': 'EX',
      'expertelectrical': 'EX',
      'rtv': 'RT',
      'radiotvworld': 'RT'
    };

    return nameMap[normalizedName] || null;
  }

  private getSupportedRetailerNames(): string[] {
    return ['Harvey Norman', 'Currys', 'DID Electrical', 'Power City', 'Argos', 'Expert Electrical', 'Radio TV World'];
  }

  private determineStoreFromPassword(password: string, retailer: any): { storeCode?: string; storeName: string } {
    const upperPassword = password.toUpperCase().trim();
    
    // Check if password matches a store code
    if (retailer.storeLocations && retailer.storeLocations[upperPassword]) {
      return {
        storeCode: upperPassword,
        storeName: `${retailer.fullName} ${retailer.storeLocations[upperPassword]}`
      };
    }

    // Check if password matches a store name
    if (retailer.storeLocations) {
      for (const [code, name] of Object.entries(retailer.storeLocations)) {
        if (name.toLowerCase().includes(password.toLowerCase()) || 
            password.toLowerCase().includes(name.toLowerCase())) {
          return {
            storeCode: code,
            storeName: `${retailer.fullName} ${name}`
          };
        }
      }
    }

    // If no specific store found, use the retailer name (for retailers without specific stores)
    return {
      storeName: retailer.fullName
    };
  }

  private async initializeStoreMetrics(retailerCode: string, storeCode: string | undefined, storeName: string): Promise<void> {
    try {
      // Check if metrics already exist
      const existingMetrics = await db.select()
        .from(storeMetrics)
        .where(
          and(
            eq(storeMetrics.retailerCode, retailerCode),
            storeCode ? eq(storeMetrics.storeCode, storeCode) : sql`store_code IS NULL`
          )
        )
        .limit(1);

      if (existingMetrics.length === 0) {
        await db.insert(storeMetrics).values({
          retailerCode,
          storeCode,
          storeName
        });
      }
    } catch (error) {
      console.error('Error initializing store metrics:', error);
    }
  }

  private async updateStoreMetrics(
    retailerCode: string, 
    storeCode: string | undefined, 
    storeName: string, 
    metricType: 'qr_scan' | 'referral_use'
  ): Promise<void> {
    try {
      // Ensure metrics record exists
      await this.initializeStoreMetrics(retailerCode, storeCode, storeName);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Update the appropriate metric
      if (metricType === 'qr_scan') {
        await db.update(storeMetrics)
          .set({
            totalQrScans: sql`total_qr_scans + 1`,
            qrScansThisMonth: sql`qr_scans_this_month + 1`,
            lastUpdated: new Date()
          })
          .where(
            and(
              eq(storeMetrics.retailerCode, retailerCode),
              storeCode ? eq(storeMetrics.storeCode, storeCode) : sql`store_code IS NULL`
            )
          );
      } else if (metricType === 'referral_use') {
        await db.update(storeMetrics)
          .set({
            totalReferralUses: sql`total_referral_uses + 1`,
            referralUsesThisMonth: sql`referral_uses_this_month + 1`,
            lastUpdated: new Date()
          })
          .where(
            and(
              eq(storeMetrics.retailerCode, retailerCode),
              storeCode ? eq(storeMetrics.storeCode, storeCode) : sql`store_code IS NULL`
            )
          );
      }

    } catch (error) {
      console.error('Error updating store metrics:', error);
    }
  }
}

// Create singleton instance
export const storeAuthService = new StoreAuthService();