import { storage } from "./storage";
import { db } from "./db";
import { bookings, performanceRefundSettings, installerWallets, installerTransactions, jobAssignments } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";

export class PerformanceRefundService {
  
  // Check and process performance-based refunds for a booking
  async processPerformanceRefund(bookingId: number): Promise<{ success: boolean; message: string; refundAmount?: number }> {
    try {
      console.log(`Checking performance refund eligibility for booking ${bookingId}`);
      
      // Get booking with current star rating and refund status
      const [booking] = await db.select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);
      
      if (!booking) {
        return { success: false, message: 'Booking not found' };
      }
      
      // Check if already processed
      if (booking.refundProcessed) {
        return { success: false, message: 'Performance refund already processed' };
      }
      
      // Check if eligible for refund
      if (!booking.eligibleForRefund) {
        return { success: false, message: 'Not eligible for performance refund' };
      }
      
      const qualityStars = booking.qualityStars || 0;
      
      // Get refund settings for this star level
      const refundSetting = await this.getRefundSettingForStars(qualityStars);
      if (!refundSetting) {
        return { success: false, message: `No refund setting configured for ${qualityStars} stars` };
      }
      
      // Calculate refund amount
      const totalLeadFee = parseFloat(booking.totalLeadFee || '0');
      if (totalLeadFee <= 0) {
        return { success: false, message: 'No lead fee to refund' };
      }
      
      const refundPercentage = parseFloat(refundSetting.refundPercentage);
      const refundAmount = (totalLeadFee * refundPercentage) / 100;
      
      // Find installer who paid the lead fee (get the job assignment)
      const paidAssignments = await db.select()
        .from(jobAssignments)
        .where(and(
          eq(jobAssignments.bookingId, bookingId),
          eq(jobAssignments.leadFeeStatus, 'paid')
        ));
      
      if (paidAssignments.length === 0) {
        return { success: false, message: 'No paid lead fee found for this booking' };
      }
      
      // Process refund for each installer who paid (usually just one)
      let totalRefunded = 0;
      const processedInstallers: string[] = [];
      
      for (const assignment of paidAssignments) {
        const success = await this.addRefundCredit(
          assignment.installerId, 
          refundAmount, 
          `Performance refund - ${qualityStars} quality stars`,
          bookingId
        );
        
        if (success) {
          totalRefunded += refundAmount;
          processedInstallers.push(assignment.installerId.toString());
        }
      }
      
      // Update booking refund status
      await db.update(bookings)
        .set({
          refundAmount: totalRefunded.toString(),
          refundProcessed: true,
          refundPercentage: refundPercentage.toString()
        })
        .where(eq(bookings.id, bookingId));
      
      console.log(`Performance refund processed: €${totalRefunded.toFixed(2)} refunded to ${processedInstallers.length} installer(s) for ${qualityStars} quality stars`);
      
      return {
        success: true,
        message: `Performance refund of €${totalRefunded.toFixed(2)} processed for ${qualityStars} quality stars`,
        refundAmount: totalRefunded
      };
      
    } catch (error) {
      console.error('Error processing performance refund:', error);
      return {
        success: false,
        message: 'Failed to process performance refund'
      };
    }
  }
  
  // Get refund setting for a specific star level
  private async getRefundSettingForStars(stars: number): Promise<any> {
    try {
      // Find the highest star level that this booking qualifies for
      const [setting] = await db.select()
        .from(performanceRefundSettings)
        .where(and(
          eq(performanceRefundSettings.starLevel, Math.floor(stars)),
          eq(performanceRefundSettings.isActive, true)
        ))
        .limit(1);
      
      return setting;
    } catch (error) {
      console.error('Error fetching refund setting:', error);
      return null;
    }
  }
  
  // Add refund credit to installer wallet
  private async addRefundCredit(installerId: number, amount: number, description: string, bookingId: number): Promise<boolean> {
    try {
      // Get or create installer wallet
      let [wallet] = await db.select()
        .from(installerWallets)
        .where(eq(installerWallets.installerId, installerId))
        .limit(1);
      
      if (!wallet) {
        // Create wallet if doesn't exist
        [wallet] = await db.insert(installerWallets)
          .values({
            installerId,
            balance: "0.00",
            totalSpent: "0.00", 
            totalEarned: "0.00",
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
      }
      
      // Update wallet balance
      const currentBalance = parseFloat(wallet.balance);
      const newBalance = currentBalance + amount;
      
      await db.update(installerWallets)
        .set({
          balance: newBalance.toFixed(2),
          updatedAt: new Date()
        })
        .where(eq(installerWallets.installerId, installerId));
      
      // Record transaction
      await db.insert(installerTransactions)
        .values({
          installerId,
          amount: amount.toFixed(2),
          type: 'credit',
          description,
          bookingId,
          createdAt: new Date()
        });
      
      console.log(`Added €${amount.toFixed(2)} performance refund credit to installer ${installerId} wallet`);
      return true;
      
    } catch (error) {
      console.error(`Error adding refund credit to installer ${installerId}:`, error);
      return false;
    }
  }
  
  // Initialize default performance refund settings if they don't exist
  async initializeDefaultSettings(): Promise<void> {
    try {
      // Check if settings already exist
      const existingSettings = await db.select()
        .from(performanceRefundSettings)
        .limit(1);
      
      if (existingSettings.length > 0) {
        console.log('Performance refund settings already initialized');
        return;
      }
      
      // Create default settings
      const defaultSettings = [
        {
          starLevel: 3,
          refundPercentage: "25.00", // 25% refund for 3 stars (minimum)
          description: "Good quality - 3 stars (photos + customer satisfaction)",
          isActive: true
        },
        {
          starLevel: 4,
          refundPercentage: "50.00", // 50% refund for 4 stars
          description: "High quality - 4 stars (excellent photos and customer review)",
          isActive: true
        },
        {
          starLevel: 5,
          refundPercentage: "75.00", // 75% refund for 5 stars (perfect)
          description: "Exceptional quality - 5 stars (perfect execution and customer delight)",
          isActive: true
        }
      ];
      
      await db.insert(performanceRefundSettings)
        .values(defaultSettings);
      
      console.log('Default performance refund settings initialized');
      
    } catch (error) {
      console.error('Error initializing default performance refund settings:', error);
    }
  }
  
  // Get summary of all performance refunds
  async getPerformanceRefundSummary(): Promise<{
    totalRefunds: number;
    totalAmount: number;
    byStarLevel: Array<{starLevel: number; count: number; amount: number}>;
  }> {
    try {
      // Get all processed performance refunds
      const refundedBookings = await db.select({
        qualityStars: bookings.qualityStars,
        refundAmount: bookings.refundAmount
      })
      .from(bookings)
      .where(and(
        eq(bookings.refundProcessed, true),
        eq(bookings.eligibleForRefund, true)
      ));
      
      const totalRefunds = refundedBookings.length;
      const totalAmount = refundedBookings.reduce((sum: number, booking: any) => {
        return sum + parseFloat(booking.refundAmount || '0');
      }, 0);
      
      // Group by star level
      const byStarLevel = refundedBookings.reduce((acc: Array<{starLevel: number; count: number; amount: number}>, booking: any) => {
        const stars = booking.qualityStars || 0;
        const amount = parseFloat(booking.refundAmount || '0');
        
        const existing = acc.find((item: {starLevel: number; count: number; amount: number}) => item.starLevel === stars);
        if (existing) {
          existing.count++;
          existing.amount += amount;
        } else {
          acc.push({
            starLevel: stars,
            count: 1,
            amount: amount
          });
        }
        
        return acc;
      }, [] as Array<{starLevel: number; count: number; amount: number}>);
      
      return {
        totalRefunds,
        totalAmount,
        byStarLevel: byStarLevel.sort((a: {starLevel: number}, b: {starLevel: number}) => b.starLevel - a.starLevel)
      };
      
    } catch (error) {
      console.error('Error getting performance refund summary:', error);
      return {
        totalRefunds: 0,
        totalAmount: 0,
        byStarLevel: []
      };
    }
  }
}

// Export singleton instance
export const performanceRefundService = new PerformanceRefundService();