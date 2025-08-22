import { db } from './db';
import { eq } from 'drizzle-orm';
import { storeReferralUsage, bookings } from '@shared/schema';

export class StoreReferralCompletionService {
  
  /**
   * Updates referral commission when an installation is actually completed
   * This ensures staff only earn commission from successful installations, not just bookings
   */
  async recordInstallationCompletion(bookingId: number): Promise<void> {
    try {
      // Find referral usage records for this booking
      const referralRecords = await db
        .select()
        .from(storeReferralUsage)
        .where(eq(storeReferralUsage.bookingId, bookingId));

      if (referralRecords.length === 0) {
        console.log(`No referral records found for booking ${bookingId} - not a referral-based booking`);
        return;
      }

      console.log(`📈 Processing referral completion for booking ${bookingId} - ${referralRecords.length} referral record(s) found`);

      // Update each referral record to mark installation as completed
      for (const record of referralRecords) {
        await db
          .update(storeReferralUsage)
          .set({
            installationCompleted: true,
            completedAt: new Date(),
            commissionEarned: record.rewardAmount, // Commission earned = original reward amount
          })
          .where(eq(storeReferralUsage.id, record.id));

        console.log(`✅ Marked referral completion for staff ${record.staffName} at ${record.storeName}: €${record.rewardAmount} commission earned`);
      }

    } catch (error) {
      console.error('Error recording referral completion:', error);
      // Don't throw - installation completion should succeed even if referral tracking fails
    }
  }

  /**
   * Get total commission earnings from completed installations for a store
   */
  async getCompletedReferralEarnings(retailerCode: string, storeCode?: string): Promise<number> {
    try {
      let query = db
        .select()
        .from(storeReferralUsage)
        .where(eq(storeReferralUsage.retailerCode, retailerCode));

      if (storeCode) {
        query = query.where(eq(storeReferralUsage.storeCode, storeCode));
      }

      const records = await query;
      
      // Only count earnings from completed installations
      const completedEarnings = records
        .filter(record => record.installationCompleted)
        .reduce((sum, record) => sum + parseFloat(record.commissionEarned || '0'), 0);

      return completedEarnings;
    } catch (error) {
      console.error('Error getting completed referral earnings:', error);
      return 0;
    }
  }

  /**
   * Get staff performance metrics based on completed installations
   */
  async getStaffCompletionMetrics(retailerCode: string, storeCode?: string): Promise<Array<{
    staffName: string;
    totalBookings: number;
    completedInstallations: number;
    completionRate: number;
    totalCommissionEarned: number;
  }>> {
    try {
      let query = db
        .select()
        .from(storeReferralUsage)
        .where(eq(storeReferralUsage.retailerCode, retailerCode));

      if (storeCode) {
        query = query.where(eq(storeReferralUsage.storeCode, storeCode));
      }

      const records = await query;
      
      // Group by staff member
      const staffMetrics = new Map();
      
      for (const record of records) {
        const staffName = record.staffName || 'Unknown';
        
        if (!staffMetrics.has(staffName)) {
          staffMetrics.set(staffName, {
            staffName,
            totalBookings: 0,
            completedInstallations: 0,
            totalCommissionEarned: 0,
          });
        }
        
        const metrics = staffMetrics.get(staffName);
        metrics.totalBookings++;
        
        if (record.installationCompleted) {
          metrics.completedInstallations++;
          metrics.totalCommissionEarned += parseFloat(record.commissionEarned || '0');
        }
      }
      
      // Calculate completion rates
      return Array.from(staffMetrics.values()).map(metrics => ({
        ...metrics,
        completionRate: metrics.totalBookings > 0 
          ? Math.round((metrics.completedInstallations / metrics.totalBookings) * 100) 
          : 0,
      }));
      
    } catch (error) {
      console.error('Error getting staff completion metrics:', error);
      return [];
    }
  }
}

export const storeReferralCompletionService = new StoreReferralCompletionService();