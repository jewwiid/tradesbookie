import { db } from './db';
import { and, eq, gte, lte, sql, inArray } from 'drizzle-orm';
import { storeQrScans, storeReferralUsage, aiInteractionAnalytics } from '@shared/schema';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays, subWeeks } from 'date-fns';

export type TimeWindow = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'last_30_days';

export class StoreDataCleanupService {

  /**
   * Delete store data for a specific time window to free up database space
   */
  async deleteStoreDataByTimeWindow(
    retailerCode: string,
    storeCode: string | undefined,
    timeWindow: TimeWindow
  ): Promise<{ deletedQrScans: number; deletedReferrals: number; deletedAiInteractions: number }> {
    const { startDate, endDate } = this.getTimeRange(timeWindow);
    
    console.log(`🗑️ Deleting store data for ${retailerCode}${storeCode ? ` - ${storeCode}` : ''} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    let deletedQrScans = 0;
    let deletedReferrals = 0;
    let deletedAiInteractions = 0;

    try {
      // Build store filter condition
      const storeFilter = storeCode 
        ? and(eq(storeQrScans.retailerCode, retailerCode), eq(storeQrScans.storeCode, storeCode))
        : eq(storeQrScans.retailerCode, retailerCode);

      const referralStoreFilter = storeCode 
        ? and(eq(storeReferralUsage.retailerCode, retailerCode), eq(storeReferralUsage.storeCode, storeCode))
        : eq(storeReferralUsage.retailerCode, retailerCode);

      // Delete QR scans within time range
      const qrScansToDelete = await db
        .select({ id: storeQrScans.id })
        .from(storeQrScans)
        .where(
          and(
            storeFilter,
            gte(storeQrScans.scannedAt, startDate),
            lte(storeQrScans.scannedAt, endDate)
          )
        );

      if (qrScansToDelete.length > 0) {
        const qrScanIds = qrScansToDelete.map(scan => scan.id);
        await db.delete(storeQrScans)
          .where(inArray(storeQrScans.id, qrScanIds));
        deletedQrScans = qrScansToDelete.length;
        console.log(`✅ Deleted ${deletedQrScans} QR scans`);
      }

      // Delete referral usage within time range (only completed ones to preserve pending earnings)
      const referralsToDelete = await db
        .select({ id: storeReferralUsage.id })
        .from(storeReferralUsage)
        .where(
          and(
            referralStoreFilter,
            gte(storeReferralUsage.usedAt, startDate),
            lte(storeReferralUsage.usedAt, endDate),
            eq(storeReferralUsage.installationCompleted, true) // Only delete completed installations
          )
        );

      if (referralsToDelete.length > 0) {
        const referralIds = referralsToDelete.map(ref => ref.id);
        await db.delete(storeReferralUsage)
          .where(inArray(storeReferralUsage.id, referralIds));
        deletedReferrals = referralsToDelete.length;
        console.log(`✅ Deleted ${deletedReferrals} completed referral records`);
      }

      // Get QR code IDs for this store to filter AI interactions
      const storeQrCodes = await db
        .select({ qrCodeId: storeQrScans.qrCodeId })
        .from(storeQrScans)
        .where(storeFilter);

      // Build store location filter for AI interactions (space format to match dashboard)
      const storeLocationPattern = `${retailerCode}${storeCode ? ` ${storeCode}` : ''}`;
      
      let aiInteractionsToDelete = [];
      
      // Delete AI interactions by QR code IDs (if any exist)
      if (storeQrCodes.length > 0) {
        const qrCodeIds = storeQrCodes.map(qr => qr.qrCodeId);
        
        const qrBasedInteractions = await db
          .select({ id: aiInteractionAnalytics.id })
          .from(aiInteractionAnalytics)
          .where(
            and(
              inArray(aiInteractionAnalytics.qrCodeId, qrCodeIds),
              gte(aiInteractionAnalytics.createdAt, startDate),
              lte(aiInteractionAnalytics.createdAt, endDate)
            )
          );
        
        aiInteractionsToDelete.push(...qrBasedInteractions);
      }
      
      // Also delete AI interactions by store location pattern
      const locationBasedInteractions = await db
        .select({ id: aiInteractionAnalytics.id })
        .from(aiInteractionAnalytics)
        .where(
          and(
            eq(aiInteractionAnalytics.storeLocation, storeLocationPattern),
            gte(aiInteractionAnalytics.createdAt, startDate),
            lte(aiInteractionAnalytics.createdAt, endDate)
          )
        );
      
      aiInteractionsToDelete.push(...locationBasedInteractions);
      
      // Remove duplicates
      const uniqueInteractionIds = Array.from(new Set(aiInteractionsToDelete.map(ai => ai.id)));
      
      if (uniqueInteractionIds.length > 0) {
        await db.delete(aiInteractionAnalytics)
          .where(inArray(aiInteractionAnalytics.id, uniqueInteractionIds));
        deletedAiInteractions = uniqueInteractionIds.length;
        console.log(`✅ Deleted ${deletedAiInteractions} AI interactions`);
      }

      console.log(`🎉 Data cleanup completed. Total deleted: ${deletedQrScans + deletedReferrals + deletedAiInteractions} records`);
      
      return { deletedQrScans, deletedReferrals, deletedAiInteractions };

    } catch (error) {
      console.error('Error during store data cleanup:', error);
      throw new Error(`Failed to clean up store data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the count of records that would be deleted for a specific time window (preview)
   */
  async previewDeleteCount(
    retailerCode: string,
    storeCode: string | undefined,
    timeWindow: TimeWindow
  ): Promise<{ qrScansCount: number; referralsCount: number; aiInteractionsCount: number }> {
    const { startDate, endDate } = this.getTimeRange(timeWindow);
    
    try {
      // Build store filter condition
      const storeFilter = storeCode 
        ? and(eq(storeQrScans.retailerCode, retailerCode), eq(storeQrScans.storeCode, storeCode))
        : eq(storeQrScans.retailerCode, retailerCode);

      const referralStoreFilter = storeCode 
        ? and(eq(storeReferralUsage.retailerCode, retailerCode), eq(storeReferralUsage.storeCode, storeCode))
        : eq(storeReferralUsage.retailerCode, retailerCode);

      // Count QR scans
      const qrScansCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(storeQrScans)
        .where(
          and(
            storeFilter,
            gte(storeQrScans.scannedAt, startDate),
            lte(storeQrScans.scannedAt, endDate)
          )
        );

      // Count completed referrals only
      const referralsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(storeReferralUsage)
        .where(
          and(
            referralStoreFilter,
            gte(storeReferralUsage.usedAt, startDate),
            lte(storeReferralUsage.usedAt, endDate),
            eq(storeReferralUsage.installationCompleted, true)
          )
        );

      // Count AI interactions from store QR codes and store location
      const storeQrCodes = await db
        .select({ qrCodeId: storeQrScans.qrCodeId })
        .from(storeQrScans)
        .where(storeFilter);

      const storeLocationPattern = `${retailerCode}${storeCode ? ` ${storeCode}` : ''}`;
      let aiInteractionsCount = 0;
      
      // Count QR-based interactions
      if (storeQrCodes.length > 0) {
        const qrCodeIds = storeQrCodes.map(qr => qr.qrCodeId);
        
        const qrBasedCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(aiInteractionAnalytics)
          .where(
            and(
              inArray(aiInteractionAnalytics.qrCodeId, qrCodeIds),
              gte(aiInteractionAnalytics.createdAt, startDate),
              lte(aiInteractionAnalytics.createdAt, endDate)
            )
          );
        
        aiInteractionsCount += qrBasedCount[0]?.count || 0;
      }
      
      // Count location-based interactions
      const locationBasedCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(aiInteractionAnalytics)
        .where(
          and(
            eq(aiInteractionAnalytics.storeLocation, storeLocationPattern),
            gte(aiInteractionAnalytics.createdAt, startDate),
            lte(aiInteractionAnalytics.createdAt, endDate)
          )
        );
      
      aiInteractionsCount += locationBasedCount[0]?.count || 0;

      return {
        qrScansCount: qrScansCount[0]?.count || 0,
        referralsCount: referralsCount[0]?.count || 0,
        aiInteractionsCount
      };

    } catch (error) {
      console.error('Error getting delete preview count:', error);
      throw new Error(`Failed to get delete preview: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get date range for a specific time window
   */
  private getTimeRange(timeWindow: TimeWindow): { startDate: Date; endDate: Date } {
    const now = new Date();
    
    switch (timeWindow) {
      case 'today':
        return {
          startDate: startOfDay(now),
          endDate: endOfDay(now)
        };
      
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return {
          startDate: startOfDay(yesterday),
          endDate: endOfDay(yesterday)
        };
      
      case 'this_week':
        return {
          startDate: startOfWeek(now, { weekStartsOn: 1 }), // Monday start
          endDate: endOfWeek(now, { weekStartsOn: 1 })
        };
      
      case 'last_week':
        const lastWeek = subWeeks(now, 1);
        return {
          startDate: startOfWeek(lastWeek, { weekStartsOn: 1 }),
          endDate: endOfWeek(lastWeek, { weekStartsOn: 1 })
        };
      
      case 'last_30_days':
        return {
          startDate: subDays(now, 30),
          endDate: now
        };
      
      default:
        throw new Error(`Unsupported time window: ${timeWindow}`);
    }
  }

  /**
   * Get human-readable description of time window
   */
  getTimeWindowDescription(timeWindow: TimeWindow): string {
    switch (timeWindow) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'this_week': return 'This Week';
      case 'last_week': return 'Last Week';
      case 'last_30_days': return 'Last 30 Days';
      default: return 'Unknown';
    }
  }
}

export const storeDataCleanupService = new StoreDataCleanupService();