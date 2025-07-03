import { db } from './db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});
import { 
  leadQualityTracking, 
  customerVerification, 
  antiManipulation, 
  leadRefunds,
  bookings,
  users,
  installers,
  installerWallets,
  installerTransactions
} from '../shared/schema';
import { eq, and, count, gte, desc, sql, avg } from 'drizzle-orm';

export interface QualityAssessment {
  qualityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'verified';
  requiresVerification: boolean;
  suspiciousFlags: string[];
  recommendations: string[];
}

export interface RefundEligibility {
  eligible: boolean;
  reason?: string;
  refundAmount: number;
  automaticApproval: boolean;
  evidence?: string[];
}

export class FraudPreventionService {
  
  // Customer Verification and Quality Assessment
  async assessCustomerQuality(bookingId: number, userId?: number): Promise<QualityAssessment> {
    try {
      const booking = await db.select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

      if (!booking.length) {
        throw new Error('Booking not found');
      }

      const bookingData = booking[0];
      let qualityScore = 50; // Base score
      const suspiciousFlags: string[] = [];
      const recommendations: string[] = [];
      
      // Check for multiple bookings with same contact details
      const similarBookings = await db.select({ count: count() })
        .from(bookings)
        .where(
          and(
            eq(bookings.contactEmail, bookingData.contactEmail),
            sql`${bookings.id} != ${bookingId}`
          )
        );

      if (similarBookings[0].count > 2) {
        qualityScore -= 15;
        suspiciousFlags.push('Multiple bookings with same email');
        recommendations.push('Verify customer identity before lead purchase');
      }

      // Check for rapid booking patterns
      const recentBookings = await db.select({ count: count() })
        .from(bookings)
        .where(
          and(
            eq(bookings.contactEmail, bookingData.contactEmail),
            gte(bookings.createdAt, sql`NOW() - INTERVAL '24 hours'`)
          )
        );

      if (recentBookings[0].count > 1) {
        qualityScore -= 20;
        suspiciousFlags.push('Rapid booking creation');
        recommendations.push('Implement cooling-off period');
      }

      // Check user verification status if available
      if (userId) {
        const user = await db.select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (user.length && user[0].emailVerified) {
          qualityScore += 15;
        }

        if (user.length && user[0].registrationMethod === 'invoice') {
          qualityScore += 20; // Harvey Norman customers are more reliable
        }
      }

      // Check for incomplete contact information
      if (!bookingData.contactPhone || bookingData.contactPhone.length < 10) {
        qualityScore -= 10;
        suspiciousFlags.push('Incomplete phone number');
        recommendations.push('Verify phone number before installer contact');
      }

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'verified' = 'medium';
      if (qualityScore >= 80) riskLevel = 'verified';
      else if (qualityScore >= 60) riskLevel = 'low';
      else if (qualityScore >= 40) riskLevel = 'medium';
      else riskLevel = 'high';

      // Create or update quality tracking record
      await this.updateQualityTracking(bookingId, {
        qualityScore,
        riskLevel,
        suspiciousActivity: suspiciousFlags.length > 0,
        multipleBookingsSameDetails: similarBookings[0].count > 0
      });

      return {
        qualityScore,
        riskLevel,
        requiresVerification: riskLevel === 'high' || suspiciousFlags.length > 1,
        suspiciousFlags,
        recommendations
      };

    } catch (error) {
      console.error('Error assessing customer quality:', error);
      return {
        qualityScore: 30,
        riskLevel: 'high',
        requiresVerification: true,
        suspiciousFlags: ['Assessment failed'],
        recommendations: ['Manual review required']
      };
    }
  }

  // Phone Verification System
  async initiatePhoneVerification(bookingId: number, phoneNumber: string): Promise<{ success: boolean; verificationCode?: string }> {
    try {
      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store verification attempt
      await db.insert(customerVerification).values({
        bookingId,
        phoneNumber,
        phoneVerificationCode: verificationCode,
        phoneVerified: false,
        phoneVerificationAttempts: 1
      }).onConflictDoUpdate({
        target: customerVerification.bookingId,
        set: {
          phoneVerificationCode: verificationCode,
          phoneVerificationAttempts: sql`${customerVerification.phoneVerificationAttempts} + 1`,
          updatedAt: new Date()
        }
      });

      // In production, send SMS via Twilio or similar service
      console.log(`SMS Verification Code for ${phoneNumber}: ${verificationCode}`);
      
      return { success: true, verificationCode }; // Only return for testing
    } catch (error) {
      console.error('Error initiating phone verification:', error);
      return { success: false };
    }
  }

  // Verify Phone Code
  async verifyPhoneCode(bookingId: number, code: string): Promise<boolean> {
    try {
      const verification = await db.select()
        .from(customerVerification)
        .where(eq(customerVerification.bookingId, bookingId))
        .limit(1);

      if (!verification.length || verification[0].phoneVerificationCode !== code) {
        return false;
      }

      // Mark as verified
      await db.update(customerVerification)
        .set({
          phoneVerified: true,
          phoneVerificationDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(customerVerification.bookingId, bookingId));

      // Update quality tracking
      await this.updateQualityTracking(bookingId, {
        phoneVerified: true,
        phoneVerificationDate: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error verifying phone code:', error);
      return false;
    }
  }

  // Anti-Manipulation Detection
  async detectManipulation(bookingId: number, installerId?: number): Promise<string[]> {
    const flags: string[] = [];

    try {
      const booking = await db.select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

      if (!booking.length) return flags;

      const bookingData = booking[0];

      // Check for rapid cancellation after installer contact
      if (bookingData.status === 'cancelled' && bookingData.createdAt) {
        const timeDiff = Date.now() - bookingData.createdAt.getTime();
        if (timeDiff < 2 * 60 * 60 * 1000) { // Less than 2 hours
          flags.push('Rapid cancellation after creation');
          await this.flagAntiManipulation(bookingId, installerId, 'rapidBookingCancellation', true);
        }
      }

      // Check for price discrepancies
      if (bookingData.agreedPrice && bookingData.estimatedPrice) {
        const estimatedPrice = parseFloat(bookingData.estimatedPrice.toString());
        const agreedPrice = parseFloat(bookingData.agreedPrice.toString());
        const discrepancy = Math.abs(estimatedPrice - agreedPrice) / estimatedPrice;
        
        if (discrepancy > 0.3) { // More than 30% difference
          flags.push('Significant price discrepancy detected');
          await this.flagAntiManipulation(bookingId, installerId, 'priceDiscrepancyReported', true);
        }
      }

      // Check for multiple QR code accesses from different locations
      await this.trackQRAccess(bookingId);

    } catch (error) {
      console.error('Error detecting manipulation:', error);
    }

    return flags;
  }

  // QR Code Access Tracking
  async trackQRAccess(bookingId: number, ipAddress?: string): Promise<void> {
    try {
      // Get current anti-manipulation record
      const existing = await db.select()
        .from(antiManipulation)
        .where(eq(antiManipulation.bookingId, bookingId))
        .limit(1);

      if (existing.length) {
        // Increment access count
        await db.update(antiManipulation)
          .set({
            qrCodeAccessedMultipleTimes: sql`${antiManipulation.qrCodeAccessedMultipleTimes} + 1`,
            updatedAt: new Date()
          })
          .where(eq(antiManipulation.bookingId, bookingId));
      } else {
        // Create new record
        await db.insert(antiManipulation).values({
          bookingId,
          qrCodeAccessedMultipleTimes: 1
        });
      }
    } catch (error) {
      console.error('Error tracking QR access:', error);
    }
  }

  // Lead Refund System
  async assessRefundEligibility(installerId: number, bookingId: number, reason: string): Promise<RefundEligibility> {
    try {
      // Get lead fee paid
      const jobAssignment = await db.select()
        .from(db.select().from(sql`job_assignments`))
        .where(
          and(
            eq(sql`installer_id`, installerId),
            eq(sql`booking_id`, bookingId),
            eq(sql`lead_fee_status`, 'paid')
          )
        )
        .limit(1);

      if (!jobAssignment.length) {
        return {
          eligible: false,
          reason: 'No paid lead fee found',
          refundAmount: 0,
          automaticApproval: false
        };
      }

      const leadFee = parseFloat(jobAssignment[0].lead_fee?.toString() || '0');
      
      // Check quality tracking for this booking
      const qualityData = await db.select()
        .from(leadQualityTracking)
        .where(
          and(
            eq(leadQualityTracking.bookingId, bookingId),
            eq(leadQualityTracking.installerId, installerId)
          )
        )
        .limit(1);

      let automaticApproval = false;
      let refundAmount = 0;

      // Determine refund eligibility based on reason and evidence
      switch (reason) {
        case 'customer_unresponsive':
          if (qualityData.length && qualityData[0].installerContacted && !qualityData[0].customerResponded) {
            automaticApproval = true;
            refundAmount = leadFee * 0.8; // 80% refund for unresponsive customers
          }
          break;

        case 'fake_booking':
          if (qualityData.length && qualityData[0].riskLevel === 'high') {
            automaticApproval = true;
            refundAmount = leadFee; // Full refund for fake bookings
          }
          break;

        case 'customer_ghosted':
          refundAmount = leadFee * 0.6; // 60% refund, requires manual review
          break;

        case 'technical_issue':
          automaticApproval = true;
          refundAmount = leadFee; // Full refund for platform issues
          break;
      }

      return {
        eligible: refundAmount > 0,
        reason: reason,
        refundAmount,
        automaticApproval,
        evidence: qualityData.length ? [
          `Quality score: ${qualityData[0].qualityScore}`,
          `Risk level: ${qualityData[0].riskLevel}`,
          `Customer contacted: ${qualityData[0].installerContacted}`,
          `Customer responded: ${qualityData[0].customerResponded}`
        ] : []
      };

    } catch (error) {
      console.error('Error assessing refund eligibility:', error);
      return {
        eligible: false,
        reason: 'Assessment failed',
        refundAmount: 0,
        automaticApproval: false
      };
    }
  }

  // Process Lead Refund
  async processLeadRefund(installerId: number, bookingId: number, refundRequest: {
    reason: string;
    evidence?: string;
    installerNotes?: string;
  }): Promise<{ success: boolean; refundId?: number; message: string }> {
    try {
      const eligibility = await this.assessRefundEligibility(installerId, bookingId, refundRequest.reason);
      
      if (!eligibility.eligible) {
        return {
          success: false,
          message: eligibility.reason || 'Not eligible for refund'
        };
      }

      // Create refund request
      const refundData = {
        installerId,
        bookingId,
        originalLeadFee: eligibility.refundAmount / (eligibility.reason === 'fake_booking' ? 1 : 0.8), // Calculate original fee
        refundReason: refundRequest.reason,
        refundAmount: eligibility.refundAmount,
        refundType: 'credit' as const,
        evidenceProvided: refundRequest.evidence,
        installerNotes: refundRequest.installerNotes,
        status: eligibility.automaticApproval ? 'approved' as const : 'pending' as const,
        automaticApproval: eligibility.automaticApproval,
        fraudCheckPassed: true
      };

      const [refund] = await db.insert(leadRefunds).values(refundData).returning();

      // If automatically approved, add credit to installer wallet
      if (eligibility.automaticApproval) {
        await this.addInstallerCredit(installerId, eligibility.refundAmount, 'Lead refund');
        
        await db.update(leadRefunds)
          .set({
            status: 'processed',
            processedDate: new Date()
          })
          .where(eq(leadRefunds.id, refund.id));
      }

      return {
        success: true,
        refundId: refund.id,
        message: eligibility.automaticApproval ? 
          `€${eligibility.refundAmount.toFixed(2)} credit added to your wallet` :
          'Refund request submitted for review'
      };

    } catch (error) {
      console.error('Error processing lead refund:', error);
      return {
        success: false,
        message: 'Failed to process refund request'
      };
    }
  }

  // Helper Methods
  private async updateQualityTracking(bookingId: number, updates: any): Promise<void> {
    try {
      await db.insert(leadQualityTracking).values({
        bookingId,
        ...updates
      }).onConflictDoUpdate({
        target: leadQualityTracking.bookingId,
        set: {
          ...updates,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating quality tracking:', error);
    }
  }

  private async flagAntiManipulation(bookingId: number, installerId?: number, flag: string, value: boolean): Promise<void> {
    try {
      const updateData: any = { [flag]: value, updatedAt: new Date() };
      
      await db.insert(antiManipulation).values({
        bookingId,
        installerId,
        ...updateData
      }).onConflictDoUpdate({
        target: antiManipulation.bookingId,
        set: updateData
      });
    } catch (error) {
      console.error('Error flagging anti-manipulation:', error);
    }
  }

  private async addInstallerCredit(installerId: number, amount: number, description: string): Promise<void> {
    try {
      // Add credit to wallet
      await db.update(installerWallets)
        .set({
          balance: sql`${installerWallets.balance} + ${amount}`,
          updatedAt: new Date()
        })
        .where(eq(installerWallets.installerId, installerId));

      // Record transaction
      await db.insert(installerTransactions).values({
        installerId,
        type: 'credit',
        amount: amount.toString(),
        description,
        status: 'completed'
      });
    } catch (error) {
      console.error('Error adding installer credit:', error);
    }
  }

  // Admin Functions
  async getRefundRequests(status?: string): Promise<any[]> {
    try {
      const query = db.select({
        id: leadRefunds.id,
        installerId: leadRefunds.installerId,
        bookingId: leadRefunds.bookingId,
        originalLeadFee: leadRefunds.originalLeadFee,
        refundReason: leadRefunds.refundReason,
        refundAmount: leadRefunds.refundAmount,
        installerNotes: leadRefunds.installerNotes,
        status: leadRefunds.status,
        requestedDate: leadRefunds.requestedDate,
        automaticApproval: leadRefunds.automaticApproval
      }).from(leadRefunds);

      if (status) {
        query.where(eq(leadRefunds.status, status));
      }

      return await query.orderBy(desc(leadRefunds.requestedDate));
    } catch (error) {
      console.error('Error getting refund requests:', error);
      return [];
    }
  }

  async approveRefund(refundId: number, adminNotes?: string): Promise<boolean> {
    try {
      const refund = await db.select()
        .from(leadRefunds)
        .where(eq(leadRefunds.id, refundId))
        .limit(1);

      if (!refund.length) return false;

      const refundData = refund[0];

      // Add credit to installer wallet
      await this.addInstallerCredit(
        refundData.installerId, 
        parseFloat(refundData.refundAmount.toString()), 
        `Approved refund: ${refundData.refundReason}`
      );

      // Update refund status
      await db.update(leadRefunds)
        .set({
          status: 'processed',
          reviewedDate: new Date(),
          processedDate: new Date(),
          adminNotes
        })
        .where(eq(leadRefunds.id, refundId));

      return true;
    } catch (error) {
      console.error('Error approving refund:', error);
      return false;
    }
  }

  // Stripe Integration Methods
  async trackPaymentFraud(paymentIntentId: string, bookingId: number): Promise<void> {
    try {
      if (!paymentIntentId) return;

      // Get payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Analyze payment patterns for fraud indicators
      const riskScore = this.calculatePaymentRiskScore(paymentIntent);
      
      if (riskScore > 0.7) {
        await this.flagAntiManipulation(bookingId, undefined, 'high_risk_payment', true);
        
        // Update quality tracking
        await this.updateQualityTracking(bookingId, {
          qualityScore: Math.max(0, 50 - (riskScore * 50)),
          riskLevel: 'high',
          requiresVerification: true
        });
      }
    } catch (error) {
      console.error('Error tracking payment fraud:', error);
    }
  }

  private calculatePaymentRiskScore(paymentIntent: any): number {
    let riskScore = 0;

    // Check for failed attempts
    if (paymentIntent.charges?.data?.[0]?.outcome?.risk_level === 'highest') {
      riskScore += 0.5;
    }

    // Check for disputed payments
    if (paymentIntent.charges?.data?.[0]?.disputed) {
      riskScore += 0.8;
    }

    // Check payment method risk
    const paymentMethod = paymentIntent.charges?.data?.[0]?.payment_method_details;
    if (paymentMethod?.card?.funding === 'prepaid') {
      riskScore += 0.3;
    }

    return Math.min(riskScore, 1.0);
  }

  async processStripeRefund(refundId: number, amount: number): Promise<boolean> {
    try {
      const refundRecord = await db.select().from(leadRefunds).where(eq(leadRefunds.id, refundId)).limit(1);
      
      if (refundRecord.length === 0) return false;

      const booking = await db.select().from(bookings).where(eq(bookings.id, refundRecord[0].bookingId)).limit(1);
      
      if (booking.length === 0 || !booking[0].paymentIntentId) return false;

      // Create Stripe refund
      const stripeRefund = await stripe.refunds.create({
        payment_intent: booking[0].paymentIntentId,
        amount: Math.round(amount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          refund_id: refundId.toString(),
          booking_id: refundRecord[0].bookingId.toString()
        }
      });

      // Update refund record with Stripe ID
      await db.update(leadRefunds)
        .set({
          stripeRefundId: stripeRefund.id,
          status: 'processed',
          processedAt: new Date()
        })
        .where(eq(leadRefunds.id, refundId));

      return true;
    } catch (error) {
      console.error('Error processing Stripe refund:', error);
      return false;
    }
  }

  // Real Data Analytics Methods
  async getRealQualityMetrics(): Promise<any> {
    try {
      const totalBookings = await db.select({ count: count() }).from(bookings);
      
      const verifiedBookings = await db.select({ count: count() })
        .from(leadQualityTracking)
        .where(eq(leadQualityTracking.phoneVerified, true));
      
      const highRiskBookings = await db.select({ count: count() })
        .from(leadQualityTracking)
        .where(eq(leadQualityTracking.riskLevel, 'high'));
      
      const avgQualityScore = await db.select({ avg: avg(leadQualityTracking.qualityScore) })
        .from(leadQualityTracking);
      
      const refundRequests = await db.select({ count: count() }).from(leadRefunds);
      
      const fraudDetections = await db.select({ count: count() })
        .from(antiManipulation)
        .where(eq(antiManipulation.flag, 'high_risk_payment'));

      const totalCount = totalBookings[0]?.count || 0;
      const refundCount = refundRequests[0]?.count || 0;
      const refundRate = totalCount > 0 ? ((refundCount / totalCount) * 100).toFixed(1) : '0.0';

      return {
        totalBookings: totalCount,
        verifiedBookings: verifiedBookings[0]?.count || 0,
        highRiskBookings: highRiskBookings[0]?.count || 0,
        averageQualityScore: parseFloat(avgQualityScore[0]?.avg || '0'),
        refundRate: parseFloat(refundRate),
        fraudDetections: fraudDetections[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting real quality metrics:', error);
      return {
        totalBookings: 0,
        verifiedBookings: 0,
        highRiskBookings: 0,
        averageQualityScore: 0,
        refundRate: 0,
        fraudDetections: 0
      };
    }
  }

  // Real-time monitoring for suspicious patterns
  async monitorInstallationPatterns(installerId: number): Promise<any> {
    try {
      // Get installer's recent bookings
      const recentBookings = await db.select()
        .from(bookings)
        .where(eq(bookings.installerId, installerId))
        .orderBy(desc(bookings.createdAt))
        .limit(20);

      // Check for suspicious patterns
      const suspiciousPatterns = {
        rapidBookings: false,
        highCancellationRate: false,
        unusualPricing: false,
        multipleRefunds: false
      };

      // Analyze booking patterns
      if (recentBookings.length >= 5) {
        const bookingTimes = recentBookings.map(b => new Date(b.createdAt!).getTime());
        const timeGaps = [];
        
        for (let i = 1; i < bookingTimes.length; i++) {
          timeGaps.push(bookingTimes[i-1] - bookingTimes[i]);
        }
        
        const avgGap = timeGaps.reduce((a, b) => a + b, 0) / timeGaps.length;
        const oneHour = 60 * 60 * 1000;
        
        if (avgGap < oneHour) {
          suspiciousPatterns.rapidBookings = true;
        }
      }

      // Check refund patterns
      const refunds = await db.select({ count: count() })
        .from(leadRefunds)
        .where(eq(leadRefunds.installerId, installerId));
      
      if (refunds[0]?.count && refunds[0].count > 3) {
        suspiciousPatterns.multipleRefunds = true;
      }

      return {
        recentBookingsCount: recentBookings.length,
        suspiciousPatterns,
        riskLevel: Object.values(suspiciousPatterns).some(p => p) ? 'medium' : 'low'
      };
    } catch (error) {
      console.error('Error monitoring installation patterns:', error);
      return {
        recentBookingsCount: 0,
        suspiciousPatterns: {},
        riskLevel: 'low'
      };
    }
  }
}

export const fraudPreventionService = new FraudPreventionService();