import { 
  users, bookings, installers, feeStructures, jobAssignments, reviews, solarEnquiries,
  referralSettings, referralCodes, referralUsage,
  type User, type UpsertUser,
  type Booking, type InsertBooking,
  type Installer, type InsertInstaller,
  type FeeStructure, type InsertFeeStructure,
  type JobAssignment, type InsertJobAssignment,
  type Review, type InsertReview,
  type SolarEnquiry, type InsertSolarEnquiry,
  type ReferralSettings, type InsertReferralSettings,
  type ReferralCode, type InsertReferralCode,
  type ReferralUsage, type InsertReferralUsage
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Installer operations
  getInstaller(id: number): Promise<Installer | undefined>;
  getInstallerByEmail(email: string): Promise<Installer | undefined>;
  createInstaller(installer: InsertInstaller): Promise<Installer>;
  getAllInstallers(): Promise<Installer[]>;

  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingByQrCode(qrCode: string): Promise<Booking | undefined>;
  getUserBookings(userId: string): Promise<Booking[]>;
  getInstallerBookings(installerId: number): Promise<Booking[]>;
  updateBookingStatus(id: number, status: string): Promise<void>;
  updateBookingAiPreview(id: number, aiPreviewUrl: string): Promise<void>;
  updateBookingPayment(id: number, paymentIntentId: string, paymentStatus: string, paidAmount?: number): Promise<void>;
  getAllBookings(): Promise<Booking[]>;

  // Fee structure operations
  getFeeStructure(installerId: number, serviceType: string): Promise<FeeStructure | undefined>;
  createFeeStructure(feeStructure: InsertFeeStructure): Promise<FeeStructure>;
  updateFeeStructure(installerId: number, serviceType: string, feePercentage: number): Promise<void>;
  getInstallerFeeStructures(installerId: number): Promise<FeeStructure[]>;

  // Job assignment operations
  createJobAssignment(assignment: InsertJobAssignment): Promise<JobAssignment>;
  getInstallerJobs(installerId: number): Promise<JobAssignment[]>;
  updateJobStatus(id: number, status: string): Promise<void>;

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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
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

  async getAllInstallers(): Promise<Installer[]> {
    return await db.select().from(installers).where(eq(installers.isActive, true));
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

  // Fee structure operations
  async getFeeStructure(installerId: number, serviceType: string): Promise<FeeStructure | undefined> {
    const [feeStructure] = await db.select().from(feeStructures)
      .where(and(
        eq(feeStructures.installerId, installerId),
        eq(feeStructures.serviceType, serviceType)
      ));
    return feeStructure;
  }

  async createFeeStructure(insertFeeStructure: InsertFeeStructure): Promise<FeeStructure> {
    const [feeStructure] = await db.insert(feeStructures).values(insertFeeStructure).returning();
    return feeStructure;
  }

  async updateFeeStructure(installerId: number, serviceType: string, feePercentage: number): Promise<void> {
    await db.update(feeStructures)
      .set({ feePercentage: feePercentage.toString() })
      .where(and(
        eq(feeStructures.installerId, installerId),
        eq(feeStructures.serviceType, serviceType)
      ));
  }

  async getInstallerFeeStructures(installerId: number): Promise<FeeStructure[]> {
    return await db.select().from(feeStructures)
      .where(eq(feeStructures.installerId, installerId));
  }

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
}

export const storage = new DatabaseStorage();
