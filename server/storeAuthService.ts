import { eq, and, desc, sql, gte } from "drizzle-orm";
import { db } from "./db";
import { storeUsers, storeMetrics, storeQrScans, storeReferralUsage, aiInteractionAnalytics, type StoreUser, type InsertStoreUser } from "@shared/schema";
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
    totalAiInteractions: number;
    aiInteractionsThisMonth: number;
    topAiTool: string;
    avgProcessingTime: number;
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
    aiInteractions: Array<{
      aiTool: string;
      interactionType: string;
      productQuery?: string;
      userPrompt?: string;
      recommendedProducts?: any[];
      processingTimeMs?: number;
      createdAt: Date;
      sessionId: string;
    }>;
  };
  analytics: {
    topProductQueries: Array<{
      query: string;
      count: number;
    }>;
    aiToolUsage: Array<{
      aiTool: string;
      count: number;
      avgProcessingTime: number;
      errorRate: number;
    }>;
    popularProducts: Array<{
      productName: string;
      queryCount: number;
      recommendationCount: number;
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
   * Map technical AI tool names to user-friendly display names
   */
  private mapAiToolName(toolName: string): string {
    const toolMapping: Record<string, string> = {
      'ai-chat': 'AI Chat Helper',
      'product-finder': 'Product Finder',
      'electronics-comparison': 'Product Comparison',
      'tv-preview': 'TV Preview',
      'product-info': 'Product Information',
      'product-care': 'Product Care Guide',
      'faq': 'FAQ Assistant',
      'ai-helper': 'AI Helper'
    };
    
    return toolMapping[toolName] || toolName.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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

      // Get recent QR scans with linked AI interaction details
      const recentQrScans = await db.select({
        qrCodeId: storeQrScans.qrCodeId,
        aiTool: storeQrScans.aiTool,
        scannedAt: storeQrScans.scannedAt,
        sessionId: storeQrScans.sessionId,
        // Include AI interaction details
        userPrompt: aiInteractionAnalytics.userPrompt,
        aiResponse: aiInteractionAnalytics.aiResponse,
        productQuery: aiInteractionAnalytics.productQuery,
        interactionType: aiInteractionAnalytics.interactionType,
        processingTimeMs: aiInteractionAnalytics.processingTimeMs,
        recommendedProducts: aiInteractionAnalytics.recommendedProducts,
        comparisonResult: aiInteractionAnalytics.comparisonResult,
        errorOccurred: aiInteractionAnalytics.errorOccurred
      })
      .from(storeQrScans)
      .leftJoin(
        aiInteractionAnalytics,
        eq(storeQrScans.sessionId, aiInteractionAnalytics.sessionId)
      )
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

      // Get AI interaction analytics for this store
      const storeLocationFilter = user.storeCode 
        ? `${user.retailerCode} ${user.storeCode}`
        : user.retailerCode;

      // First, get all QR codes that belong to this store from store_qr_scans
      const storeQrCodes = await db.select({
        qrCodeId: storeQrScans.qrCodeId
      })
      .from(storeQrScans)
      .where(
        and(
          eq(storeQrScans.retailerCode, user.retailerCode),
          user.storeCode ? eq(storeQrScans.storeCode, user.storeCode) : sql`1=1`
        )
      );

      const storeQrCodeIds = storeQrCodes.map(qr => qr.qrCodeId);

      // Only get AI interactions that came from QR codes assigned to this store
      let recentAiInteractions: any[] = [];
      if (storeQrCodeIds.length > 0) {
        const rawAiInteractions = await db.select({
          aiTool: aiInteractionAnalytics.aiTool,
          interactionType: aiInteractionAnalytics.interactionType,
          productQuery: aiInteractionAnalytics.productQuery,
          userPrompt: aiInteractionAnalytics.userPrompt,
          recommendedProducts: aiInteractionAnalytics.recommendedProducts,
          processingTimeMs: aiInteractionAnalytics.processingTimeMs,
          createdAt: aiInteractionAnalytics.createdAt,
          sessionId: aiInteractionAnalytics.sessionId
        })
        .from(aiInteractionAnalytics)
        .where(sql`qr_code_id = ANY(ARRAY[${storeQrCodeIds.map(id => `'${id}'`).join(',')}])`)
        .orderBy(desc(aiInteractionAnalytics.createdAt))
        .limit(10);

        // Map the AI tool names to user-friendly names
        recentAiInteractions = rawAiInteractions.map(interaction => ({
          ...interaction,
          aiTool: this.mapAiToolName(interaction.aiTool)
        }));
      }

      // AI metrics - only from store's QR codes
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      let aiMetrics: any[] = [];
      if (storeQrCodeIds.length > 0) {
        aiMetrics = await db.select({
          totalInteractions: sql<number>`count(*)`,
          thisMonthInteractions: sql<number>`count(*) filter (where ${aiInteractionAnalytics.createdAt} >= ${currentMonth})`,
          avgProcessingTime: sql<number>`avg(${aiInteractionAnalytics.processingTimeMs})`
        })
        .from(aiInteractionAnalytics)
        .where(sql`qr_code_id = ANY(ARRAY[${storeQrCodeIds.map(id => `'${id}'`).join(',')}])`);
      }

      // Top AI tool used - only from store's QR codes
      let topAiTool: any[] = [];
      if (storeQrCodeIds.length > 0) {
        topAiTool = await db.select({
          aiTool: aiInteractionAnalytics.aiTool,
          count: sql<number>`count(*)`
        })
        .from(aiInteractionAnalytics)
        .where(sql`qr_code_id = ANY(ARRAY[${storeQrCodeIds.map(id => `'${id}'`).join(',')}])`)
        .groupBy(aiInteractionAnalytics.aiTool)
        .orderBy(desc(sql`count(*)`))
        .limit(1);
      }

      // Top product queries - only from store's QR codes
      let topProductQueries: any[] = [];
      if (storeQrCodeIds.length > 0) {
        topProductQueries = await db.select({
          query: aiInteractionAnalytics.productQuery,
          count: sql<number>`count(*)`
        })
        .from(aiInteractionAnalytics)
        .where(
          and(
            sql`qr_code_id = ANY(ARRAY[${storeQrCodeIds.map(id => `'${id}'`).join(',')}])`,
            sql`${aiInteractionAnalytics.productQuery} is not null`
          )
        )
        .groupBy(aiInteractionAnalytics.productQuery)
        .orderBy(desc(sql`count(*)`))
        .limit(10);
      }

      // AI tool usage statistics - only from store's QR codes
      let aiToolUsage: any[] = [];
      if (storeQrCodeIds.length > 0) {
        aiToolUsage = await db.select({
          aiTool: aiInteractionAnalytics.aiTool,
          count: sql<number>`count(*)`,
          avgProcessingTime: sql<number>`avg(${aiInteractionAnalytics.processingTimeMs})`,
          errorRate: sql<number>`(count(*) filter (where ${aiInteractionAnalytics.errorOccurred} = true)::float / count(*)) * 100`
        })
        .from(aiInteractionAnalytics)
        .where(sql`qr_code_id = ANY(ARRAY[${storeQrCodeIds.map(id => `'${id}'`).join(',')}])`)
        .groupBy(aiInteractionAnalytics.aiTool)
        .orderBy(desc(sql`count(*)`));
      }

      // Extract popular products from recommendations - only from store's QR codes
      const popularProducts: Array<{ productName: string; queryCount: number; recommendationCount: number }> = [];
      
      if (storeQrCodeIds.length > 0) {
        try {
          const productData = await db.select({
            recommendedProducts: aiInteractionAnalytics.recommendedProducts,
            productQuery: aiInteractionAnalytics.productQuery
          })
          .from(aiInteractionAnalytics)
          .where(
            and(
              sql`qr_code_id = ANY(ARRAY[${storeQrCodeIds.map(id => `'${id}'`).join(',')}])`,
              sql`${aiInteractionAnalytics.recommendedProducts} != '[]'::jsonb`
            )
          );

          const productCounts: Record<string, { queryCount: number; recommendationCount: number }> = {};

          productData.forEach(row => {
            // Count product queries
            if (row.productQuery) {
              const queryKey = row.productQuery.toLowerCase();
              if (!productCounts[queryKey]) {
                productCounts[queryKey] = { queryCount: 0, recommendationCount: 0 };
              }
              productCounts[queryKey].queryCount++;
            }

            // Count product recommendations
            if (row.recommendedProducts && Array.isArray(row.recommendedProducts)) {
              row.recommendedProducts.forEach((product: any) => {
                const productName = product.name || product.title || product.model || 'Unknown Product';
                const productKey = productName.toLowerCase();
                if (!productCounts[productKey]) {
                  productCounts[productKey] = { queryCount: 0, recommendationCount: 0 };
                }
                productCounts[productKey].recommendationCount++;
              });
            }
          });

          // Convert to array and sort by total activity
          popularProducts.push(...Object.entries(productCounts)
            .map(([name, counts]) => ({
              productName: name,
              queryCount: counts.queryCount,
              recommendationCount: counts.recommendationCount
            }))
            .sort((a, b) => (b.queryCount + b.recommendationCount) - (a.queryCount + a.recommendationCount))
            .slice(0, 10));
        } catch (error) {
          console.error('Error extracting popular products:', error);
        }
      }

      const aiMetricsResult = aiMetrics[0] || {
        totalInteractions: 0,
        thisMonthInteractions: 0,
        avgProcessingTime: 0
      };

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
          activeStaffCount: currentMetrics.activeStaffCount,
          totalAiInteractions: aiMetricsResult.totalInteractions,
          aiInteractionsThisMonth: aiMetricsResult.thisMonthInteractions,
          topAiTool: topAiTool[0]?.aiTool ? this.mapAiToolName(topAiTool[0].aiTool) : 'None',
          avgProcessingTime: Math.round(aiMetricsResult.avgProcessingTime || 0)
        },
        recentActivity: {
          qrScans: recentQrScans,
          referralUses: recentReferrals,
          aiInteractions: recentAiInteractions
        },
        analytics: {
          topProductQueries: topProductQueries.map(q => ({
            query: q.query || 'Unknown',
            count: q.count
          })),
          aiToolUsage: aiToolUsage.map(tool => ({
            aiTool: this.mapAiToolName(tool.aiTool),
            count: tool.count,
            avgProcessingTime: Math.round(tool.avgProcessingTime || 0),
            errorRate: Math.round((tool.errorRate || 0) * 100) / 100
          })),
          popularProducts
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

  /**
   * Get detailed analytics for a specific AI tool
   */
  async getAiToolDetails(storeUserId: number, toolName: string): Promise<any> {
    try {
      // Get store user info
      const storeUser = await db.select()
        .from(storeUsers)
        .where(eq(storeUsers.id, storeUserId))
        .limit(1);

      if (!storeUser.length) {
        return null;
      }

      // Get QR codes for this store
      const storeQrCodes = await db.select({ id: qrCodeGeneration.id })
        .from(qrCodeGeneration)
        .where(eq(qrCodeGeneration.storeId, storeUserId));

      const storeQrCodeIds = storeQrCodes.map(qr => qr.id);

      if (storeQrCodeIds.length === 0) {
        return {
          toolName: this.mapAiToolName(toolName),
          totalInteractions: 0,
          interactions: [],
          summaryStats: {
            avgProcessingTime: 0,
            totalPrompts: 0,
            successfulResponses: 0,
            errorRate: 0
          }
        };
      }

      // Get all interactions for this specific tool
      const interactions = await db.select({
        id: aiInteractionAnalytics.id,
        aiTool: aiInteractionAnalytics.aiTool,
        interactionType: aiInteractionAnalytics.interactionType,
        productQuery: aiInteractionAnalytics.productQuery,
        userPrompt: aiInteractionAnalytics.userPrompt,
        aiResponse: aiInteractionAnalytics.aiResponse,
        recommendedProducts: aiInteractionAnalytics.recommendedProducts,
        modelUsed: aiInteractionAnalytics.modelUsed,
        processingTimeMs: aiInteractionAnalytics.processingTimeMs,
        creditsUsed: aiInteractionAnalytics.creditsUsed,
        sessionId: aiInteractionAnalytics.sessionId,
        userEmail: aiInteractionAnalytics.userEmail,
        createdAt: aiInteractionAnalytics.createdAt,
        qrCodeId: aiInteractionAnalytics.qrCodeId
      })
      .from(aiInteractionAnalytics)
      .where(
        sql`qr_code_id = ANY(ARRAY[${storeQrCodeIds.map(id => `'${id}'`).join(',')}]) AND ai_tool = ${toolName}`
      )
      .orderBy(desc(aiInteractionAnalytics.createdAt));

      // Calculate summary statistics
      const totalInteractions = interactions.length;
      const avgProcessingTime = totalInteractions > 0 
        ? Math.round(interactions.reduce((sum, i) => sum + (i.processingTimeMs || 0), 0) / totalInteractions)
        : 0;
      
      const successfulResponses = interactions.filter(i => i.aiResponse && i.aiResponse.trim().length > 0).length;
      const errorRate = totalInteractions > 0 ? ((totalInteractions - successfulResponses) / totalInteractions) * 100 : 0;

      return {
        toolName: this.mapAiToolName(toolName),
        totalInteractions,
        interactions: interactions.map(interaction => ({
          ...interaction,
          aiTool: this.mapAiToolName(interaction.aiTool)
        })),
        summaryStats: {
          avgProcessingTime,
          totalPrompts: totalInteractions,
          successfulResponses,
          errorRate: Math.round(errorRate * 100) / 100
        }
      };

    } catch (error) {
      console.error('Error getting AI tool details:', error);
      return null;
    }
  }
}

// Create singleton instance
export const storeAuthService = new StoreAuthService();