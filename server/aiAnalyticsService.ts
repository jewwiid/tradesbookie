import { db } from "./db";
import { aiInteractionAnalytics, aiToolQrCodes } from "@shared/schema";
import type { InsertAiInteractionAnalytics } from "@shared/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";

/**
 * AI Analytics Service for tracking detailed AI interactions and generating business insights
 */
export class AIAnalyticsService {
  
  /**
   * Track a comprehensive AI interaction for business analytics
   */
  static async trackInteraction(data: {
    // Core tracking
    userId?: string;
    sessionId: string;
    qrCodeId?: string;
    storeLocation?: string;
    
    // AI interaction details
    aiTool: string;
    interactionType: 'query' | 'comparison' | 'analysis' | 'recommendation';
    
    // User input
    userPrompt?: string;
    productQuery?: string;
    productModel1?: string;
    productModel2?: string;
    category?: string;
    priceRange?: string;
    
    // AI response
    aiResponse: string;
    responseTokens?: number;
    processingTimeMs?: number;
    confidenceScore?: number;
    
    // Structured data
    recommendedProducts?: any[];
    comparisonResult?: any;
    analysisData?: any;
    
    // Technical metadata
    userAgent?: string;
    ipAddress?: string;
    deviceType?: string;
    creditUsed?: boolean;
    errorOccurred?: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      const analyticsRecord: InsertAiInteractionAnalytics = {
        userId: data.userId || null,
        sessionId: data.sessionId,
        qrCodeId: data.qrCodeId || null,
        storeLocation: data.storeLocation || null,
        
        aiTool: data.aiTool,
        interactionType: data.interactionType,
        
        userPrompt: data.userPrompt || null,
        productQuery: data.productQuery || null,
        productModel1: data.productModel1 || null,
        productModel2: data.productModel2 || null,
        category: data.category || null,
        priceRange: data.priceRange || null,
        
        aiResponse: data.aiResponse,
        responseTokens: data.responseTokens || null,
        processingTimeMs: data.processingTimeMs || null,
        confidenceScore: data.confidenceScore ? data.confidenceScore.toString() : null,
        
        recommendedProducts: data.recommendedProducts || [],
        comparisonResult: data.comparisonResult || {},
        analysisData: data.analysisData || {},
        
        userAgent: data.userAgent || null,
        ipAddress: data.ipAddress || null,
        deviceType: data.deviceType || null,
        creditUsed: data.creditUsed || false,
        errorOccurred: data.errorOccurred || false,
        errorMessage: data.errorMessage || null,
        
        // Initialize engagement fields
        userSatisfaction: null,
        followUpQuestions: 0,
        sessionDurationMinutes: null,
        actionTaken: null,
      };

      await db.insert(aiInteractionAnalytics).values(analyticsRecord);
      
      // Update QR code scan count if this came from a QR code
      if (data.qrCodeId) {
        await db
          .update(aiToolQrCodes)
          .set({ 
            scanCount: sql`${aiToolQrCodes.scanCount} + 1`,
            lastScannedAt: new Date()
          })
          .where(eq(aiToolQrCodes.qrCodeId, data.qrCodeId));
      }
    } catch (error) {
      console.error('Failed to track AI interaction:', error);
      // Don't throw error to avoid breaking the main AI functionality
    }
  }

  /**
   * Update engagement metrics for an interaction (follow-up actions)
   */
  static async updateEngagement(sessionId: string, updates: {
    userSatisfaction?: number;
    followUpQuestions?: number;
    sessionDurationMinutes?: number;
    actionTaken?: string;
  }): Promise<void> {
    try {
      // Update the most recent interaction in this session
      const recentInteraction = await db
        .select({ id: aiInteractionAnalytics.id })
        .from(aiInteractionAnalytics)
        .where(eq(aiInteractionAnalytics.sessionId, sessionId))
        .orderBy(desc(aiInteractionAnalytics.createdAt))
        .limit(1);

      if (recentInteraction.length > 0) {
        await db
          .update(aiInteractionAnalytics)
          .set(updates)
          .where(eq(aiInteractionAnalytics.id, recentInteraction[0].id));
      }
    } catch (error) {
      console.error('Failed to update engagement metrics:', error);
    }
  }

  /**
   * Get analytics summary for admin dashboard
   */
  static async getAnalyticsSummary(filters?: {
    storeLocation?: string;
    aiTool?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    try {
      let whereConditions = [];
      
      if (filters?.storeLocation) {
        whereConditions.push(eq(aiInteractionAnalytics.storeLocation, filters.storeLocation));
      }
      
      if (filters?.aiTool) {
        whereConditions.push(eq(aiInteractionAnalytics.aiTool, filters.aiTool));
      }
      
      if (filters?.dateFrom) {
        whereConditions.push(gte(aiInteractionAnalytics.createdAt, filters.dateFrom));
      }
      
      if (filters?.dateTo) {
        whereConditions.push(lte(aiInteractionAnalytics.createdAt, filters.dateTo));
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get total interactions
      const totalInteractions = await db
        .select({ count: sql<number>`count(*)` })
        .from(aiInteractionAnalytics)
        .where(whereClause);

      // Get interactions by AI tool
      const interactionsByTool = await db
        .select({
          aiTool: aiInteractionAnalytics.aiTool,
          count: sql<number>`count(*)`,
          avgProcessingTime: sql<number>`avg(${aiInteractionAnalytics.processingTimeMs})`,
          errorRate: sql<number>`(count(*) filter (where ${aiInteractionAnalytics.errorOccurred} = true)::float / count(*)) * 100`
        })
        .from(aiInteractionAnalytics)
        .where(whereClause)
        .groupBy(aiInteractionAnalytics.aiTool);

      // Get interactions by store location
      const interactionsByStore = await db
        .select({
          storeLocation: aiInteractionAnalytics.storeLocation,
          count: sql<number>`count(*)`,
          uniqueSessions: sql<number>`count(distinct ${aiInteractionAnalytics.sessionId})`
        })
        .from(aiInteractionAnalytics)
        .where(whereClause)
        .groupBy(aiInteractionAnalytics.storeLocation);

      // Get most searched products
      const topProductQueries = await db
        .select({
          productQuery: aiInteractionAnalytics.productQuery,
          count: sql<number>`count(*)`
        })
        .from(aiInteractionAnalytics)
        .where(
          whereClause ? 
            and(whereClause, sql`${aiInteractionAnalytics.productQuery} is not null`) :
            sql`${aiInteractionAnalytics.productQuery} is not null`
        )
        .groupBy(aiInteractionAnalytics.productQuery)
        .orderBy(desc(sql`count(*)`))
        .limit(10);

      // Get comparison data
      const topComparisons = await db
        .select({
          product1: aiInteractionAnalytics.productModel1,
          product2: aiInteractionAnalytics.productModel2,
          count: sql<number>`count(*)`
        })
        .from(aiInteractionAnalytics)
        .where(
          whereClause ? 
            and(whereClause, eq(aiInteractionAnalytics.interactionType, 'comparison')) :
            eq(aiInteractionAnalytics.interactionType, 'comparison')
        )
        .groupBy(aiInteractionAnalytics.productModel1, aiInteractionAnalytics.productModel2)
        .orderBy(desc(sql`count(*)`))
        .limit(10);

      return {
        totalInteractions: totalInteractions[0]?.count || 0,
        interactionsByTool,
        interactionsByStore,
        topProductQueries,
        topComparisons
      };
    } catch (error) {
      console.error('Failed to get analytics summary:', error);
      return {
        totalInteractions: 0,
        interactionsByTool: [],
        interactionsByStore: [],
        topProductQueries: [],
        topComparisons: []
      };
    }
  }

  /**
   * Generate CSV export of analytics data
   */
  static async exportAnalyticsCSV(filters?: {
    storeLocation?: string;
    aiTool?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<string> {
    try {
      let whereConditions = [];
      
      if (filters?.storeLocation) {
        whereConditions.push(eq(aiInteractionAnalytics.storeLocation, filters.storeLocation));
      }
      
      if (filters?.aiTool) {
        whereConditions.push(eq(aiInteractionAnalytics.aiTool, filters.aiTool));
      }
      
      if (filters?.dateFrom) {
        whereConditions.push(gte(aiInteractionAnalytics.createdAt, filters.dateFrom));
      }
      
      if (filters?.dateTo) {
        whereConditions.push(lte(aiInteractionAnalytics.createdAt, filters.dateTo));
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const interactions = await db
        .select()
        .from(aiInteractionAnalytics)
        .where(whereClause)
        .orderBy(desc(aiInteractionAnalytics.createdAt))
        .limit(10000); // Limit to prevent memory issues

      // Generate CSV headers
      const headers = [
        'Date/Time',
        'Store Location',
        'AI Tool',
        'Interaction Type',
        'User Prompt',
        'Product Query',
        'Product Model 1',
        'Product Model 2',
        'Category',
        'Price Range',
        'Processing Time (ms)',
        'Credit Used',
        'Error Occurred',
        'User Agent',
        'Device Type',
        'Session ID',
        'QR Code ID'
      ];

      // Generate CSV rows
      const rows = interactions.map(interaction => [
        interaction.createdAt?.toISOString() || '',
        interaction.storeLocation || '',
        interaction.aiTool || '',
        interaction.interactionType || '',
        (interaction.userPrompt || '').replace(/"/g, '""'), // Escape quotes
        interaction.productQuery || '',
        interaction.productModel1 || '',
        interaction.productModel2 || '',
        interaction.category || '',
        interaction.priceRange || '',
        interaction.processingTimeMs?.toString() || '',
        interaction.creditUsed ? 'Yes' : 'No',
        interaction.errorOccurred ? 'Yes' : 'No',
        interaction.userAgent || '',
        interaction.deviceType || '',
        interaction.sessionId || '',
        interaction.qrCodeId || ''
      ]);

      // Combine headers and rows into CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      return csvContent;
    } catch (error) {
      console.error('Failed to export analytics CSV:', error);
      throw error;
    }
  }
}