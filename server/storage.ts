import { 
  users, bookings, installers, jobAssignments, reviews, solarEnquiries,
  referralSettings, referralCodes, referralUsage, consultationBookings,
  leadPricing, wallMountPricing, installerWallets, installerTransactions,
  scheduleNegotiations, declinedRequests,
  type User, type UpsertUser,
  type Booking, type InsertBooking,
  type Installer, type InsertInstaller,
  type JobAssignment, type InsertJobAssignment,
  type Review, type InsertReview,
  type SolarEnquiry, type InsertSolarEnquiry,
  type ReferralSettings, type InsertReferralSettings,
  type ReferralCode, type InsertReferralCode,
  type ReferralUsage, type InsertReferralUsage,
  type ConsultationBooking, type InsertConsultationBooking,
  type LeadPricing, type InsertLeadPricing,
  type WallMountPricing, type InsertWallMountPricing,
  type ScheduleNegotiation, type InsertScheduleNegotiation,
  type InstallerWallet, type InsertInstallerWallet,
  type InstallerTransaction, type InsertInstallerTransaction
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(userId: number): Promise<boolean>;
  verifyUserEmail(userId: string): Promise<void>;
  updateEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void>;

  // Installer operations
  getInstaller(id: number): Promise<Installer | undefined>;
  getInstallerByEmail(email: string): Promise<Installer | undefined>;
  createInstaller(installer: InsertInstaller): Promise<Installer>;
  updateInstaller(id: number, updates: Partial<InsertInstaller>): Promise<Installer>;
  getAllInstallers(): Promise<Installer[]>;
  updateInstallerApproval(installerId: number, approvalData: {
    approvalStatus: string;
    adminScore?: number;
    adminComments?: string;
    reviewedBy?: string;
    reviewedAt?: Date;
  }): Promise<void>;
  
  // Installer authentication
  registerInstaller(email: string, passwordHash: string): Promise<Installer>;
  authenticateInstaller(email: string, passwordHash: string): Promise<Installer | null>;
  updateInstallerProfile(installerId: number, profileData: Partial<InsertInstaller>): Promise<Installer>;

  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingByQrCode(qrCode: string): Promise<Booking | undefined>;
  getUserBookings(userId: string): Promise<Booking[]>;
  getInstallerBookings(installerId: number): Promise<Booking[]>;
  getInstallerPurchasedLeads(installerId: number): Promise<Booking[]>;
  updateBooking(id: number, updates: Partial<InsertBooking>): Promise<void>;
  deleteBooking(id: number): Promise<void>;
  updateBookingStatus(id: number, status: string): Promise<void>;
  updateBookingAiPreview(id: number, aiPreviewUrl: string): Promise<void>;
  updateBookingPayment(id: number, paymentIntentId: string, paymentStatus: string, paidAmount?: number): Promise<void>;
  getAllBookings(): Promise<Booking[]>;

  // Removed: Fee structure operations no longer needed in lead generation model

  // Job assignment operations
  createJobAssignment(assignment: InsertJobAssignment): Promise<JobAssignment>;
  getInstallerJobs(installerId: number): Promise<JobAssignment[]>;
  getInstallerJobAssignments(installerId: number): Promise<JobAssignment[]>;
  updateJobStatus(id: number, status: string): Promise<void>;

  // Schedule negotiation operations
  createScheduleNegotiation(negotiation: InsertScheduleNegotiation): Promise<ScheduleNegotiation>;
  getBookingScheduleNegotiations(bookingId: number): Promise<ScheduleNegotiation[]>;
  getInstallerScheduleNegotiations(installerId: number): Promise<ScheduleNegotiation[]>;
  updateScheduleNegotiationStatus(id: number, status: string, responseMessage?: string): Promise<void>;
  getActiveScheduleNegotiation(bookingId: number): Promise<ScheduleNegotiation | undefined>;

  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getInstallerReviews(installerId: number): Promise<Review[]>;
  getUserReviews(userId: string): Promise<Review[]>;
  getInstallerRating(installerId: number): Promise<{ averageRating: number; totalReviews: number }>;

  // Solar enquiry operations
  createSolarEnquiry(enquiry: InsertSolarEnquiry): Promise<SolarEnquiry>;
  getAllSolarEnquiries(): Promise<SolarEnquiry[]>;
  updateSolarEnquiryStatus(id: number, status: string): Promise<void>;

  // Referral operations
  getReferralSettings(): Promise<ReferralSettings | undefined>;
  updateReferralSettings(settings: InsertReferralSettings): Promise<ReferralSettings>;
  createReferralCode(referralCode: InsertReferralCode): Promise<ReferralCode>;
  getReferralCodeByCode(code: string): Promise<ReferralCode | undefined>;
  getReferralCodeByUserId(userId: string): Promise<ReferralCode | undefined>;
  validateReferralCode(code: string): Promise<{ valid: boolean; discount: number; referrerId?: string }>;
  createReferralUsage(usage: InsertReferralUsage): Promise<ReferralUsage>;
  getReferralUsageByBooking(bookingId: number): Promise<ReferralUsage | undefined>;
  updateReferralCodeStats(codeId: number, earnings: number): Promise<void>;
  getReferralEarnings(userId: string): Promise<{ totalEarnings: number; totalReferrals: number }>;

  // Consultation booking operations
  createConsultationBooking(booking: InsertConsultationBooking): Promise<ConsultationBooking>;
  getConsultationBooking(id: number): Promise<ConsultationBooking | undefined>;
  getAllConsultationBookings(): Promise<ConsultationBooking[]>;
  updateConsultationBookingStatus(id: number, status: string): Promise<void>;
  getConsultationBookingsByEmail(email: string): Promise<ConsultationBooking[]>;

  // New model: Lead pricing and installer wallet operations
  getLeadPricing(serviceType: string): Promise<LeadPricing | undefined>;
  createLeadPricing(pricing: InsertLeadPricing): Promise<LeadPricing>;
  getAllLeadPricing(): Promise<LeadPricing[]>;
  updateLeadPricing(id: number, pricing: Partial<InsertLeadPricing>): Promise<void>;

  // Wall mount pricing operations
  getWallMountPricing(key: string): Promise<WallMountPricing | undefined>;
  createWallMountPricing(pricing: InsertWallMountPricing): Promise<WallMountPricing>;
  getAllWallMountPricing(): Promise<WallMountPricing[]>;
  updateWallMountPricing(id: number, pricing: Partial<InsertWallMountPricing>): Promise<void>;
  getActiveWallMountPricing(): Promise<WallMountPricing[]>;

  // Installer wallet operations
  getInstallerWallet(installerId: number): Promise<InstallerWallet | undefined>;
  createInstallerWallet(wallet: InsertInstallerWallet): Promise<InstallerWallet>;
  updateInstallerWalletBalance(installerId: number, amount: number): Promise<void>;
  updateInstallerWalletTotalSpent(installerId: number, amount: number): Promise<void>;
  updateInstallerWalletTotalEarned(installerId: number, amount: number): Promise<void>;
  resetInstallerWallet(installerId: number): Promise<void>;
  addInstallerTransaction(transaction: InsertInstallerTransaction): Promise<InstallerTransaction>;
  getInstallerTransactions(installerId: number): Promise<InstallerTransaction[]>;
  getAllInstallerTransactions(): Promise<InstallerTransaction[]>;

  // Lead payment operations
  updateJobAssignmentLeadFee(jobId: number, leadFee: number, paymentIntentId: string, status: string): Promise<void>;
  markLeadFeePaid(jobId: number): Promise<void>;

  // Declined requests operations for proper state management
  declineRequestForInstaller(installerId: number, bookingId: number): Promise<void>;
  getDeclinedRequestsForInstaller(installerId: number): Promise<number[]>; // Returns array of booking IDs
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Determine role based on email for specific admin accounts
    const isAdminEmail = userData.email === 'admin@tradesbook.ie' || 
                        userData.email === 'jude.okun@gmail.com';
    
    const userDataWithRole = {
      ...userData,
      role: isAdminEmail ? 'admin' : 'customer',
    };

    const [user] = await db
      .insert(users)
      .values(userDataWithRole)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userDataWithRole,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(userId: number): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, userId.toString()));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  async verifyUserEmail(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        emailVerified: true, 
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async updateEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db
      .update(users)
      .set({ 
        emailVerificationToken: token,
        emailVerificationExpires: expiresAt,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  // Installer operations
  async getInstaller(id: number): Promise<Installer | undefined> {
    const [installer] = await db.select().from(installers).where(eq(installers.id, id));
    return installer;
  }

  async getInstallerByEmail(email: string): Promise<Installer | undefined> {
    const [installer] = await db.select().from(installers).where(eq(installers.email, email));
    return installer;
  }

  async createInstaller(insertInstaller: InsertInstaller): Promise<Installer> {
    const [installer] = await db.insert(installers).values(insertInstaller).returning();
    return installer;
  }

  async updateInstaller(id: number, updates: Partial<InsertInstaller>): Promise<Installer> {
    const [installer] = await db.update(installers)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(installers.id, id))
      .returning();
    return installer;
  }

  async getAllInstallers(): Promise<Installer[]> {
    return await db.select().from(installers);
  }

  async updateInstallerApproval(installerId: number, approvalData: {
    approvalStatus: string;
    adminScore?: number;
    adminComments?: string;
    reviewedBy?: string;
    reviewedAt?: Date;
  }): Promise<void> {
    await db.update(installers)
      .set({
        approvalStatus: approvalData.approvalStatus,
        adminScore: approvalData.adminScore,
        adminComments: approvalData.adminComments,
        reviewedBy: approvalData.reviewedBy,
        reviewedAt: approvalData.reviewedAt,
        updatedAt: new Date()
      })
      .where(eq(installers.id, installerId));
  }

  // Installer authentication methods
  async registerInstaller(email: string, passwordHash: string): Promise<Installer> {
    const [installer] = await db.insert(installers).values({
      email,
      passwordHash,
      businessName: "TBD", // Default value, will be updated when profile is completed
      contactName: "TBD", // Default value, will be updated when profile is completed
      approvalStatus: "pending",
      profileCompleted: false,
      isActive: true
    }).returning();
    return installer;
  }

  async authenticateInstaller(email: string, password: string): Promise<Installer | null> {
    const [installer] = await db.select().from(installers)
      .where(eq(installers.email, email));
    
    if (!installer || !installer.passwordHash) {
      return null;
    }
    
    // Use bcrypt to verify password
    const isValidPassword = await bcrypt.compare(password, installer.passwordHash);
    
    return isValidPassword ? installer : null;
  }

  async updateInstallerProfile(installerId: number, profileData: Partial<InsertInstaller>): Promise<Installer> {
    const [installer] = await db.update(installers)
      .set({
        ...profileData,
        profileCompleted: true, // Mark profile as completed when updated
        updatedAt: new Date()
      })
      .where(eq(installers.id, installerId))
      .returning();
    return installer;
  }

  // Booking operations
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const qrCode = `BK-${nanoid(10)}`;
    const [booking] = await db.insert(bookings).values({
      ...insertBooking,
      qrCode,
      addons: insertBooking.addons || [],
    }).returning();
    return booking;
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingByQrCode(qrCode: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.qrCode, qrCode));
    return booking;
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return await db.select().from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));
  }

  async getInstallerBookings(installerId: number): Promise<Booking[]> {
    return await db.select().from(bookings)
      .where(eq(bookings.installerId, installerId))
      .orderBy(desc(bookings.createdAt));
  }

  async getInstallerPurchasedLeads(installerId: number): Promise<Booking[]> {
    // Get purchased leads from job assignments table
    const purchasedJobs = await db.select({
      booking: bookings,
      jobAssignment: jobAssignments
    })
    .from(jobAssignments)
    .innerJoin(bookings, eq(jobAssignments.bookingId, bookings.id))
    .where(and(
      eq(jobAssignments.installerId, installerId),
      eq(jobAssignments.leadFeeStatus, 'paid')
    ))
    .orderBy(desc(jobAssignments.assignedDate));

    // Return bookings with job assignment info merged
    return purchasedJobs.map(row => ({
      ...row.booking,
      jobAssignmentId: row.jobAssignment.id,
      leadFee: row.jobAssignment.leadFee,
      assignedDate: row.jobAssignment.assignedDate,
      acceptedDate: row.jobAssignment.acceptedDate,
      completedDate: row.jobAssignment.completedDate,
      leadFeeStatus: row.jobAssignment.leadFeeStatus
    }));
  }

  async updateBooking(id: number, updates: Partial<InsertBooking>): Promise<void> {
    await db.update(bookings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bookings.id, id));
  }

  async deleteBooking(id: number): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  async updateBookingStatus(id: number, status: string): Promise<void> {
    await db.update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, id));
  }

  async updateBookingAiPreview(id: number, aiPreviewUrl: string): Promise<void> {
    await db.update(bookings)
      .set({ aiPreviewUrl, updatedAt: new Date() })
      .where(eq(bookings.id, id));
  }

  async updateBookingPayment(id: number, paymentIntentId: string, paymentStatus: string, paidAmount?: number): Promise<void> {
    const updateData: any = {
      paymentIntentId,
      paymentStatus,
      updatedAt: new Date()
    };
    
    if (paidAmount !== undefined) {
      updateData.paidAmount = paidAmount.toString();
    }
    
    if (paymentStatus === 'succeeded') {
      updateData.paymentDate = new Date();
    }

    await db.update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id));
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  // Removed: Fee structure operations no longer needed in lead generation model

  // Job assignment operations
  async createJobAssignment(insertAssignment: InsertJobAssignment): Promise<JobAssignment> {
    const [assignment] = await db.insert(jobAssignments).values(insertAssignment).returning();
    return assignment;
  }

  async getInstallerJobs(installerId: number): Promise<JobAssignment[]> {
    return await db.select().from(jobAssignments)
      .where(eq(jobAssignments.installerId, installerId))
      .orderBy(desc(jobAssignments.assignedDate));
  }

  async getInstallerJobAssignments(installerId: number): Promise<JobAssignment[]> {
    return await db.select().from(jobAssignments)
      .where(eq(jobAssignments.installerId, installerId))
      .orderBy(desc(jobAssignments.assignedDate));
  }

  async getBookingJobAssignments(bookingId: number): Promise<JobAssignment[]> {
    return await db.select().from(jobAssignments)
      .where(eq(jobAssignments.bookingId, bookingId))
      .orderBy(desc(jobAssignments.createdAt));
  }

  async updateBookingInstaller(bookingId: number, installerId: number): Promise<void> {
    await db.update(bookings)
      .set({ installerId, updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));
  }

  async updateJobInstallerStatus(bookingId: number, installerId: number, status: string): Promise<void> {
    await db.update(jobAssignments)
      .set({ status, updatedAt: new Date() })
      .where(and(
        eq(jobAssignments.bookingId, bookingId),
        eq(jobAssignments.installerId, installerId)
      ));
  }

  async updateJobStatus(id: number, status: string): Promise<void> {
    const updateData: any = { status };
    
    if (status === 'accepted') {
      updateData.acceptedDate = new Date();
    } else if (status === 'completed') {
      updateData.completedDate = new Date();
    }

    await db.update(jobAssignments)
      .set(updateData)
      .where(eq(jobAssignments.id, id));
  }

  // Review operations
  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(insertReview).returning();
    return review;
  }

  async getInstallerReviews(installerId: number): Promise<Review[]> {
    return await db.select().from(reviews)
      .where(eq(reviews.installerId, installerId))
      .orderBy(desc(reviews.createdAt));
  }

  async getUserReviews(userId: string): Promise<Review[]> {
    return await db.select().from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async getInstallerRating(installerId: number): Promise<{ averageRating: number; totalReviews: number }> {
    const installerReviews = await this.getInstallerReviews(installerId);
    
    if (installerReviews.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    const totalRating = installerReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / installerReviews.length;

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalReviews: installerReviews.length
    };
  }

  // Solar enquiry operations
  async createSolarEnquiry(insertEnquiry: InsertSolarEnquiry): Promise<SolarEnquiry> {
    const [enquiry] = await db
      .insert(solarEnquiries)
      .values(insertEnquiry)
      .returning();
    return enquiry;
  }

  async getAllSolarEnquiries(): Promise<SolarEnquiry[]> {
    return await db
      .select()
      .from(solarEnquiries)
      .orderBy(desc(solarEnquiries.createdAt));
  }

  async updateSolarEnquiryStatus(id: number, status: string): Promise<void> {
    await db
      .update(solarEnquiries)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(solarEnquiries.id, id));
  }

  // Referral operations
  async getReferralSettings(): Promise<ReferralSettings | undefined> {
    const [settings] = await db.select().from(referralSettings).limit(1);
    return settings;
  }

  async updateReferralSettings(settings: InsertReferralSettings): Promise<ReferralSettings> {
    const existingSettings = await this.getReferralSettings();
    
    if (existingSettings) {
      const [updated] = await db.update(referralSettings)
        .set({
          ...settings,
          updatedAt: new Date(),
        })
        .where(eq(referralSettings.id, existingSettings.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(referralSettings)
        .values({
          ...settings,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return created;
    }
  }

  async createReferralCode(referralCode: InsertReferralCode): Promise<ReferralCode> {
    const [code] = await db.insert(referralCodes)
      .values({
        ...referralCode,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return code;
  }

  async getReferralCodeByCode(code: string): Promise<ReferralCode | undefined> {
    const [referralCode] = await db.select().from(referralCodes)
      .where(and(eq(referralCodes.referralCode, code), eq(referralCodes.isActive, true)));
    return referralCode;
  }

  async getReferralCodeByUserId(userId: string): Promise<ReferralCode | undefined> {
    const [referralCode] = await db.select().from(referralCodes)
      .where(eq(referralCodes.userId, userId));
    return referralCode;
  }

  async validateReferralCode(code: string): Promise<{ valid: boolean; discount: number; referrerId?: string }> {
    const referralCode = await this.getReferralCodeByCode(code);
    if (!referralCode) {
      return { valid: false, discount: 0 };
    }

    const settings = await this.getReferralSettings();
    const discount = settings ? parseFloat(settings.refereeDiscount.toString()) : 10;

    return {
      valid: true,
      discount,
      referrerId: referralCode.userId,
    };
  }

  async createReferralUsage(usage: InsertReferralUsage): Promise<ReferralUsage> {
    const [referralUsageRecord] = await db.insert(referralUsage)
      .values({
        ...usage,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return referralUsageRecord;
  }

  async getReferralUsageByBooking(bookingId: number): Promise<ReferralUsage | undefined> {
    const [usage] = await db.select().from(referralUsage)
      .where(eq(referralUsage.bookingId, bookingId));
    return usage;
  }

  async updateReferralCodeStats(codeId: number, earnings: number): Promise<void> {
    await db.update(referralCodes)
      .set({
        totalReferrals: referralCodes.totalReferrals + 1,
        totalEarnings: (parseFloat(referralCodes.totalEarnings.toString()) + earnings).toString(),
        updatedAt: new Date(),
      })
      .where(eq(referralCodes.id, codeId));
  }

  async getAllReferralCodes(): Promise<ReferralCode[]> {
    return await db.select().from(referralCodes).orderBy(referralCodes.createdAt);
  }

  async getReferralCodeByCode(code: string): Promise<ReferralCode | undefined> {
    const [referralCode] = await db.select().from(referralCodes)
      .where(eq(referralCodes.referralCode, code));
    return referralCode;
  }

  async updateReferralCode(id: number, updates: { referralCode?: string; discountPercentage?: string; isActive?: boolean }): Promise<ReferralCode | undefined> {
    const [updated] = await db.update(referralCodes)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(referralCodes.id, id))
      .returning();
    return updated;
  }

  async deleteReferralCode(id: number): Promise<boolean> {
    const result = await db.delete(referralCodes)
      .where(eq(referralCodes.id, id));
    return result.rowCount > 0;
  }

  async getReferralUsageHistory(): Promise<ReferralUsage[]> {
    return await db.select().from(referralUsage)
      .orderBy(referralUsage.createdAt);
  }

  async getReferralEarnings(userId: string): Promise<{ totalEarnings: number; pendingEarnings: number; totalReferrals: number }> {
    const referralCode = await this.getReferralCodeByUserId(userId);
    if (!referralCode) {
      return { totalEarnings: 0, pendingEarnings: 0, totalReferrals: 0 };
    }

    const usages = await db.select().from(referralUsage)
      .where(eq(referralUsage.referrerUserId, userId));

    const totalEarnings = usages
      .filter(usage => usage.status === 'completed' && usage.paidOut)
      .reduce((sum, usage) => sum + parseFloat(usage.rewardAmount.toString()), 0);

    const pendingEarnings = usages
      .filter(usage => usage.status === 'completed' && !usage.paidOut)
      .reduce((sum, usage) => sum + parseFloat(usage.rewardAmount.toString()), 0);

    return {
      totalEarnings,
      pendingEarnings,
      totalReferrals: referralCode.totalReferrals
    };
  }

  async getAllReviews(): Promise<Review[]> {
    return await db.select().from(reviews).orderBy(reviews.createdAt);
  }

  async getReviewsByInstaller(installerId: number): Promise<Review[]> {
    return await db.select().from(reviews)
      .where(eq(reviews.installerId, installerId))
      .orderBy(reviews.createdAt);
  }

  async getReviewsByBooking(bookingId: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews)
      .where(eq(reviews.bookingId, bookingId));
    return review;
  }

  async getReferralEarnings(userId: string): Promise<{ totalEarnings: number; totalReferrals: number }> {
    const [referralCode] = await db.select().from(referralCodes)
      .where(eq(referralCodes.userId, userId));
    
    if (!referralCode) {
      return { totalEarnings: 0, totalReferrals: 0 };
    }

    return {
      totalEarnings: parseFloat(referralCode.totalEarnings.toString()),
      totalReferrals: referralCode.totalReferrals,
    };
  }

  // Consultation booking operations
  async createConsultationBooking(insertBooking: InsertConsultationBooking): Promise<ConsultationBooking> {
    const [booking] = await db.insert(consultationBookings).values(insertBooking).returning();
    return booking;
  }

  async getConsultationBooking(id: number): Promise<ConsultationBooking | undefined> {
    const [booking] = await db.select().from(consultationBookings).where(eq(consultationBookings.id, id));
    return booking;
  }

  async getAllConsultationBookings(): Promise<ConsultationBooking[]> {
    return await db.select().from(consultationBookings).orderBy(desc(consultationBookings.createdAt));
  }

  async updateConsultationBookingStatus(id: number, status: string): Promise<void> {
    await db.update(consultationBookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(consultationBookings.id, id));
  }

  async getConsultationBookingsByEmail(email: string): Promise<ConsultationBooking[]> {
    return await db.select().from(consultationBookings)
      .where(eq(consultationBookings.customerEmail, email))
      .orderBy(desc(consultationBookings.createdAt));
  }

  // Lead pricing operations
  async getLeadPricing(serviceType: string): Promise<LeadPricing | undefined> {
    const [pricing] = await db.select().from(leadPricing)
      .where(eq(leadPricing.serviceType, serviceType));
    return pricing;
  }

  async createLeadPricing(pricing: InsertLeadPricing): Promise<LeadPricing> {
    const [newPricing] = await db.insert(leadPricing)
      .values(pricing)
      .returning();
    return newPricing;
  }

  async getAllLeadPricing(): Promise<LeadPricing[]> {
    return await db.select().from(leadPricing)
      .orderBy(leadPricing.serviceType);
  }

  async updateLeadPricing(id: number, pricing: Partial<InsertLeadPricing>): Promise<void> {
    await db.update(leadPricing)
      .set({ ...pricing, updatedAt: new Date() })
      .where(eq(leadPricing.id, id));
  }

  // Wall mount pricing operations
  async getWallMountPricing(key: string): Promise<WallMountPricing | undefined> {
    const [pricing] = await db.select().from(wallMountPricing)
      .where(eq(wallMountPricing.key, key));
    return pricing;
  }

  async createWallMountPricing(pricing: InsertWallMountPricing): Promise<WallMountPricing> {
    const [newPricing] = await db.insert(wallMountPricing)
      .values(pricing)
      .returning();
    return newPricing;
  }

  async getAllWallMountPricing(): Promise<WallMountPricing[]> {
    return await db.select().from(wallMountPricing)
      .orderBy(wallMountPricing.displayOrder, wallMountPricing.name);
  }

  async updateWallMountPricing(id: number, pricing: Partial<InsertWallMountPricing>): Promise<void> {
    await db.update(wallMountPricing)
      .set({ ...pricing, updatedAt: new Date() })
      .where(eq(wallMountPricing.id, id));
  }

  async getActiveWallMountPricing(): Promise<WallMountPricing[]> {
    return await db.select().from(wallMountPricing)
      .where(eq(wallMountPricing.isActive, true))
      .orderBy(wallMountPricing.displayOrder, wallMountPricing.name);
  }

  // Installer wallet operations
  async getInstallerWallet(installerId: number): Promise<InstallerWallet | undefined> {
    const [wallet] = await db.select().from(installerWallets)
      .where(eq(installerWallets.installerId, installerId));
    return wallet;
  }

  async createInstallerWallet(wallet: InsertInstallerWallet): Promise<InstallerWallet> {
    const [newWallet] = await db.insert(installerWallets)
      .values(wallet)
      .returning();
    return newWallet;
  }

  async updateInstallerWalletBalance(installerId: number, amount: number): Promise<void> {
    await db.update(installerWallets)
      .set({ 
        balance: amount.toString(),
        updatedAt: new Date()
      })
      .where(eq(installerWallets.installerId, installerId));
  }

  async updateInstallerWalletTotalSpent(installerId: number, amount: number): Promise<void> {
    await db.update(installerWallets)
      .set({ 
        totalSpent: amount.toString(),
        updatedAt: new Date()
      })
      .where(eq(installerWallets.installerId, installerId));
  }

  async updateInstallerWalletTotalEarned(installerId: number, amount: number): Promise<void> {
    await db.update(installerWallets)
      .set({ 
        totalEarned: amount.toString(),
        updatedAt: new Date()
      })
      .where(eq(installerWallets.installerId, installerId));
  }

  async resetInstallerWallet(installerId: number): Promise<void> {
    await db.update(installerWallets)
      .set({ 
        balance: "0.00",
        totalSpent: "0.00",
        totalEarned: "0.00",
        updatedAt: new Date()
      })
      .where(eq(installerWallets.installerId, installerId));
  }

  async addInstallerTransaction(transaction: InsertInstallerTransaction): Promise<InstallerTransaction> {
    const [newTransaction] = await db.insert(installerTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getInstallerTransactions(installerId: number): Promise<InstallerTransaction[]> {
    return await db.select().from(installerTransactions)
      .where(eq(installerTransactions.installerId, installerId))
      .orderBy(desc(installerTransactions.createdAt));
  }

  async getAllInstallerTransactions(): Promise<InstallerTransaction[]> {
    return await db.select().from(installerTransactions)
      .orderBy(desc(installerTransactions.createdAt));
  }

  // Lead payment operations
  async updateJobAssignmentLeadFee(jobId: number, leadFee: number, paymentIntentId: string, status: string): Promise<void> {
    await db.update(jobAssignments)
      .set({
        leadFee: leadFee.toString(),
        leadPaymentIntentId: paymentIntentId,
        leadFeeStatus: status
      })
      .where(eq(jobAssignments.id, jobId));
  }

  async markLeadFeePaid(jobId: number): Promise<void> {
    await db.update(jobAssignments)
      .set({
        leadFeeStatus: 'paid',
        leadPaidDate: new Date()
      })
      .where(eq(jobAssignments.id, jobId));
  }

  // Declined requests operations for proper state management
  async declineRequestForInstaller(installerId: number, bookingId: number): Promise<void> {
    await db.insert(declinedRequests).values({
      installerId,
      bookingId
    }).onConflictDoNothing(); // Avoid duplicate entries
  }

  async getDeclinedRequestsForInstaller(installerId: number): Promise<number[]> {
    const declined = await db.select({ bookingId: declinedRequests.bookingId })
      .from(declinedRequests)
      .where(eq(declinedRequests.installerId, installerId));
    
    return declined.map(item => item.bookingId);
  }

  // Schedule negotiation operations
  async createScheduleNegotiation(negotiation: InsertScheduleNegotiation): Promise<ScheduleNegotiation> {
    const [newNegotiation] = await db.insert(scheduleNegotiations)
      .values(negotiation)
      .returning();
    return newNegotiation;
  }

  async getBookingScheduleNegotiations(bookingId: number): Promise<ScheduleNegotiation[]> {
    return await db.select()
      .from(scheduleNegotiations)
      .where(eq(scheduleNegotiations.bookingId, bookingId))
      .orderBy(desc(scheduleNegotiations.createdAt));
  }

  async getInstallerScheduleNegotiations(installerId: number): Promise<ScheduleNegotiation[]> {
    return await db.select()
      .from(scheduleNegotiations)
      .where(eq(scheduleNegotiations.installerId, installerId))
      .orderBy(desc(scheduleNegotiations.createdAt));
  }

  async updateScheduleNegotiationStatus(id: number, status: string, responseMessage?: string): Promise<void> {
    const updateData: any = {
      status,
      respondedAt: new Date(),
      updatedAt: new Date()
    };
    
    if (responseMessage) {
      updateData.responseMessage = responseMessage;
    }

    await db.update(scheduleNegotiations)
      .set(updateData)
      .where(eq(scheduleNegotiations.id, id));
  }

  async getActiveScheduleNegotiation(bookingId: number): Promise<ScheduleNegotiation | undefined> {
    const [negotiation] = await db.select()
      .from(scheduleNegotiations)
      .where(and(
        eq(scheduleNegotiations.bookingId, bookingId),
        eq(scheduleNegotiations.status, 'pending')
      ))
      .orderBy(desc(scheduleNegotiations.createdAt))
      .limit(1);
    
    return negotiation;
  }
}

export const storage = new DatabaseStorage();
