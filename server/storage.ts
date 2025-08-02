import { 
  users, bookings, installers, jobAssignments, reviews, solarEnquiries,
  referralSettings, referralCodes, referralUsage, consultationBookings,
  leadPricing, wallMountPricing, installerWallets, installerTransactions,
  scheduleNegotiations, declinedRequests, emailTemplates, bannedUsers,
  leadQualityTracking, antiManipulation, customerVerification, resources,
  platformSettings, firstLeadVouchers, passwordResetTokens, tvSetupBookings,
  consultations, downloadableGuides, videoTutorials,
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
  type Consultation, type InsertConsultation,
  type LeadPricing, type InsertLeadPricing,
  type WallMountPricing, type InsertWallMountPricing,
  type ScheduleNegotiation, type InsertScheduleNegotiation,
  type InstallerWallet, type InsertInstallerWallet,
  type InstallerTransaction, type InsertInstallerTransaction,
  type EmailTemplate, type InsertEmailTemplate,
  type BannedUser, type InsertBannedUser,
  type Resource, type InsertResource,
  type PlatformSettings, type InsertPlatformSettings,
  type FirstLeadVoucher, type InsertFirstLeadVoucher,
  type AntiManipulation, type InsertAntiManipulation,
  type PasswordResetToken, type InsertPasswordResetToken,
  type TvSetupBooking, type InsertTvSetupBooking,
  type DownloadableGuide, type InsertDownloadableGuide,
  type VideoTutorial, type InsertVideoTutorial
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(userId: number, updates: Partial<UpsertUser>): Promise<User>;
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
  updateInstallerApprovalStatus(installerId: number, status: string, comments?: string): Promise<void>;
  deleteInstaller(installerId: number): Promise<void>;
  
  // Installer authentication
  registerInstaller(email: string, passwordHash: string): Promise<Installer>;
  authenticateInstaller(email: string, passwordHash: string): Promise<Installer | null>;
  updateInstallerProfile(installerId: number, profileData: Partial<InsertInstaller>): Promise<Installer>;
  updateInstallerAvailability(installerId: number, isAvailable: boolean): Promise<void>;
  updateInstallerImage(installerId: number, imageUrl: string): Promise<Installer>;

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
  updateBookingDemoFlag(id: number, isDemo: boolean): Promise<void>;
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
  deleteSolarEnquiry(id: number): Promise<void>;

  // Referral operations
  getReferralSettings(): Promise<ReferralSettings | undefined>;
  updateReferralSettings(settings: InsertReferralSettings): Promise<ReferralSettings>;
  createReferralCode(referralCode: InsertReferralCode): Promise<ReferralCode>;
  getReferralCodeByCode(code: string): Promise<ReferralCode | undefined>;
  getReferralCodeById(id: number): Promise<ReferralCode | undefined>;
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
  deleteInstallerTransaction(transactionId: number): Promise<void>;

  // Lead payment operations
  updateJobAssignmentLeadFee(jobId: number, leadFee: number, paymentIntentId: string, status: string): Promise<void>;
  markLeadFeePaid(jobId: number): Promise<void>;

  // Declined requests operations for proper state management
  declineRequestForInstaller(installerId: number, bookingId: number): Promise<void>;
  getDeclinedRequestsForInstaller(installerId: number): Promise<number[]>; // Returns array of booking IDs

  // Email template operations
  getEmailTemplate(templateKey: string): Promise<EmailTemplate | undefined>;
  getEmailTemplateById(id: number): Promise<EmailTemplate | undefined>;
  getAllEmailTemplates(): Promise<EmailTemplate[]>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(id: number): Promise<boolean>;

  // Banned user operations
  banUser(bannedUser: InsertBannedUser): Promise<BannedUser>;
  unbanUser(email: string): Promise<void>;
  isBanned(email: string): Promise<BannedUser | undefined>;
  getAllBannedUsers(): Promise<BannedUser[]>;
  updateBannedUser(id: number, updates: Partial<InsertBannedUser>): Promise<void>;
  checkAndCleanExpiredBans(): Promise<void>;

  // Resource operations
  createResource(resource: InsertResource): Promise<Resource>;
  getResource(id: number): Promise<Resource | undefined>;
  getAllResources(): Promise<Resource[]>;
  getActiveResources(): Promise<Resource[]>;
  getFeaturedResources(): Promise<Resource[]>;
  getResourcesByCategory(category: string): Promise<Resource[]>;
  getResourcesByBrand(brand: string): Promise<Resource[]>;
  updateResource(id: number, updates: Partial<InsertResource>): Promise<Resource>;
  deleteResource(id: number): Promise<boolean>;
  toggleResourceFeatured(id: number, featured: boolean): Promise<void>;
  updateResourcePriority(id: number, priority: number): Promise<void>;

  // Downloadable Guides operations
  getDownloadableGuides(): Promise<DownloadableGuide[]>;
  getAllDownloadableGuides(): Promise<DownloadableGuide[]>;
  getDownloadableGuideById(id: number): Promise<DownloadableGuide | undefined>;
  createDownloadableGuide(guide: InsertDownloadableGuide): Promise<DownloadableGuide>;
  updateDownloadableGuide(id: number, guide: Partial<InsertDownloadableGuide>): Promise<void>;
  deleteDownloadableGuide(id: number): Promise<void>;
  incrementDownloadCount(id: number): Promise<void>;

  // Video Tutorials operations
  getVideoTutorials(): Promise<VideoTutorial[]>;
  getAllVideoTutorials(): Promise<VideoTutorial[]>;
  getVideoTutorialById(id: number): Promise<VideoTutorial | undefined>;
  createVideoTutorial(tutorial: InsertVideoTutorial): Promise<VideoTutorial>;
  updateVideoTutorial(id: number, tutorial: Partial<InsertVideoTutorial>): Promise<void>;
  deleteVideoTutorial(id: number): Promise<void>;
  incrementViewCount(id: number): Promise<void>;

  // Platform settings operations  
  getPlatformSetting(key: string): Promise<PlatformSettings | undefined>;
  getAllPlatformSettings(): Promise<PlatformSettings[]>;
  createPlatformSetting(setting: InsertPlatformSettings): Promise<PlatformSettings>;
  updatePlatformSetting(key: string, updates: Partial<PlatformSettings>): Promise<PlatformSettings>;
  deletePlatformSetting(key: string): Promise<void>;

  // First lead voucher operations
  getInstallerVoucher(installerId: number): Promise<FirstLeadVoucher | undefined>;
  createInstallerVoucher(voucher: InsertFirstLeadVoucher): Promise<FirstLeadVoucher>;
  markVoucherAsUsed(installerId: number, bookingId: number, voucherAmount: number, originalLeadFee: number): Promise<void>;
  checkVoucherEligibility(installerId: number): Promise<boolean>;
  getAllVouchers(): Promise<FirstLeadVoucher[]>;
  getAllFirstLeadVouchers(): Promise<FirstLeadVoucher[]>;
  createFirstLeadVoucher(voucher: InsertFirstLeadVoucher): Promise<FirstLeadVoucher>;
  updateFirstLeadVoucher(id: number, updates: Partial<FirstLeadVoucher>): Promise<FirstLeadVoucher>;
  getFirstLeadVoucher(installerId: number): Promise<FirstLeadVoucher | undefined>;

  // Anti-manipulation tracking operations
  createAntiManipulationRecord(record: InsertAntiManipulation): Promise<AntiManipulation>;
  getInstallerManipulationRecords(installerId: number): Promise<AntiManipulation[]>;
  markManipulationResolved(id: number, resolvedBy: string): Promise<void>;
  getAllManipulationRecords(): Promise<AntiManipulation[]>;

  // Password reset operations
  createPasswordResetToken(userId: number, tokenHash: string, expiresAt: Date, userType: 'customer' | 'installer'): Promise<PasswordResetToken>;
  getPasswordResetToken(tokenHash: string, userType: 'customer' | 'installer'): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(tokenHash: string): Promise<void>;
  deletePasswordResetToken(tokenHash: string): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<void>;
  updateUserPassword(userId: number, newPasswordHash: string): Promise<void>;
  updateInstallerPassword(userId: number, newPasswordHash: string): Promise<void>;

  // TV Setup booking operations
  createTvSetupBooking(booking: InsertTvSetupBooking): Promise<TvSetupBooking>;
  getTvSetupBooking(id: number): Promise<TvSetupBooking | undefined>;
  getAllTvSetupBookings(): Promise<TvSetupBooking[]>;
  updateTvSetupBookingPayment(id: number, paymentIntentId: string, status: string): Promise<void>;
  updateTvSetupBookingMacAddress(id: number, macAddress: string): Promise<void>;
  updateTvSetupBookingStatus(id: number, status: string, adminNotes?: string, assignedTo?: string): Promise<void>;
  updateTvSetupBookingReferral(id: number, referralData: {
    referralCode?: string | null;
    referralCodeId?: number | null;
    salesStaffName?: string | null;
    salesStaffStore?: string | null;
  }): Promise<void>;
  updateTvSetupBookingStripeSession(id: number, sessionId: string): Promise<void>;
  updateTvSetupBookingIptvCredentials(id: number, credentials: {
    credentialsType: string;
    serverHostname?: string;
    serverUsername?: string;
    serverPassword?: string;
    numberOfDevices?: number;
    m3uUrl?: string;
  }): Promise<void>;
  markTvSetupEmailSent(id: number, emailType: 'confirmation' | 'admin' | 'credentials'): Promise<void>;
  markTvSetupCredentialsPaid(id: number): Promise<void>;
  updateTvSetupBookingStripeSession(id: number, sessionId: string): Promise<void>;
  updateTvSetupBookingCredentialsPayment(id: number, sessionId: string, status: string): Promise<void>;
  deleteTvSetupBooking(id: number): Promise<void>;
  getTvSetupBookingsByEmail(email: string): Promise<TvSetupBooking[]>;

  // Consultations
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  getConsultation(id: number): Promise<Consultation | undefined>;
  getAllConsultations(): Promise<Consultation[]>;
  updateConsultation(id: number, updates: Partial<InsertConsultation>): Promise<Consultation | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, parseInt(id)));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, parseInt(id)));
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

  async updateUser(userId: number, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId.toString()))
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

  async updateInstallerApprovalStatus(installerId: number, status: string, comments?: string): Promise<void> {
    await db.update(installers)
      .set({
        approvalStatus: status,
        adminComments: comments,
        reviewedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(installers.id, installerId));
  }

  async deleteInstaller(installerId: number): Promise<void> {
    // Delete all related records first to avoid foreign key constraint violations
    
    // 1. Delete installer wallet records
    try {
      await db.delete(installerWallets)
        .where(eq(installerWallets.installerId, installerId));
    } catch (error) {
      console.log("No installer wallet records to delete");
    }
    
    // 2. Delete installer transaction records
    try {
      await db.delete(installerTransactions)
        .where(eq(installerTransactions.installerId, installerId));
    } catch (error) {
      console.log("No installer transaction records to delete");
    }
    
    // 3. Delete declined request records
    try {
      await db.delete(declinedRequests)
        .where(eq(declinedRequests.installerId, installerId));
    } catch (error) {
      console.log("No declined request records to delete");
    }
    
    // 4. Delete schedule negotiation records
    try {
      await db.delete(scheduleNegotiations)
        .where(eq(scheduleNegotiations.installerId, installerId));
    } catch (error) {
      console.log("No schedule negotiation records to delete");
    }
    
    // 5. Update any bookings assigned to this installer (set installer_id to null)
    try {
      await db.update(bookings)
        .set({ installerId: null })
        .where(eq(bookings.installerId, installerId));
    } catch (error) {
      console.log("No booking records to update");
    }
    
    // 6. Finally, delete the installer record
    await db.delete(installers)
      .where(eq(installers.id, installerId));
  }

  // Installer authentication methods
  async registerInstaller(email: string, passwordHash: string, additionalData?: {
    businessName?: string;
    contactName?: string;
    phone?: string;
    address?: string;
    serviceArea?: string;
  }): Promise<Installer> {
    const [installer] = await db.insert(installers).values({
      email,
      passwordHash,
      businessName: additionalData?.businessName || "TBD",
      contactName: additionalData?.contactName || "TBD",
      phone: additionalData?.phone || null,
      address: additionalData?.address || null,
      serviceArea: additionalData?.serviceArea || null,
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

  async updateInstallerAvailability(installerId: number, isAvailable: boolean): Promise<void> {
    await db.update(installers)
      .set({
        isAvailable,
        updatedAt: new Date()
      })
      .where(eq(installers.id, installerId));
  }

  async updateInstallerImage(installerId: number, imageUrl: string): Promise<Installer> {
    const [installer] = await db.update(installers)
      .set({
        profileImageUrl: imageUrl,
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
    // Delete all related records first to handle foreign key constraints
    
    // Delete from declined_requests
    await db.delete(declinedRequests).where(eq(declinedRequests.bookingId, id));
    
    // Delete from job_assignments
    await db.delete(jobAssignments).where(eq(jobAssignments.bookingId, id));
    
    // Delete from schedule_negotiations
    await db.delete(scheduleNegotiations).where(eq(scheduleNegotiations.bookingId, id));
    
    // Delete from lead_quality_tracking
    await db.delete(leadQualityTracking).where(eq(leadQualityTracking.bookingId, id));
    
    // Delete from reviews (if any)
    await db.delete(reviews).where(eq(reviews.bookingId, id));
    
    // Delete from anti_manipulation (if any)
    await db.delete(antiManipulation).where(eq(antiManipulation.bookingId, id));
    
    // Delete from customer_verification (if any)
    await db.delete(customerVerification).where(eq(customerVerification.bookingId, id));
    
    // Finally delete the booking itself
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

  async updateBookingDemoFlag(id: number, isDemo: boolean): Promise<void> {
    await db.update(bookings)
      .set({ isDemo, updatedAt: new Date() })
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

  async deleteSolarEnquiry(id: number): Promise<void> {
    await db
      .delete(solarEnquiries)
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

  async getReferralCodeById(id: number): Promise<ReferralCode | undefined> {
    const [referralCode] = await db.select().from(referralCodes)
      .where(eq(referralCodes.id, id));
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

  async updateReferralCode(id: number, updates: { 
    referralCode?: string; 
    discountPercentage?: string; 
    isActive?: boolean;
    referralType?: string;
    salesStaffName?: string;
    salesStaffStore?: string;
  }): Promise<ReferralCode | undefined> {
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

  async deleteInstallerTransaction(transactionId: number): Promise<void> {
    await db.delete(installerTransactions)
      .where(eq(installerTransactions.id, transactionId));
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

  // Email template operations
  async getEmailTemplate(templateKey: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select()
      .from(emailTemplates)
      .where(eq(emailTemplates.templateKey, templateKey))
      .limit(1);
    
    return template;
  }

  async getEmailTemplateById(id: number): Promise<EmailTemplate | undefined> {
    const [template] = await db.select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id))
      .limit(1);
    
    return template;
  }

  async getAllEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select()
      .from(emailTemplates)
      .orderBy(emailTemplates.templateName);
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db.insert(emailTemplates)
      .values(template)
      .returning();
    
    return newTemplate;
  }

  async updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const [updatedTemplate] = await db.update(emailTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    
    return updatedTemplate;
  }

  async deleteEmailTemplate(id: number): Promise<boolean> {
    const result = await db.delete(emailTemplates)
      .where(eq(emailTemplates.id, id));
    
    return result.rowCount > 0;
  }

  // Banned user operations
  async banUser(bannedUser: InsertBannedUser): Promise<BannedUser> {
    const [newBannedUser] = await db.insert(bannedUsers)
      .values(bannedUser)
      .returning();
    
    return newBannedUser;
  }

  async unbanUser(email: string): Promise<void> {
    await db.update(bannedUsers)
      .set({ isActive: false })
      .where(and(
        eq(bannedUsers.email, email),
        eq(bannedUsers.isActive, true)
      ));
  }

  async isBanned(email: string): Promise<BannedUser | undefined> {
    const [bannedUser] = await db.select()
      .from(bannedUsers)
      .where(and(
        eq(bannedUsers.email, email),
        eq(bannedUsers.isActive, true)
      ))
      .limit(1);
    
    // Check if temporary ban has expired
    if (bannedUser && bannedUser.banType === 'temporary' && bannedUser.banExpiresAt) {
      if (bannedUser.banExpiresAt <= new Date()) {
        // Expire the ban
        await this.unbanUser(email);
        return undefined;
      }
    }
    
    return bannedUser;
  }

  async getAllBannedUsers(): Promise<BannedUser[]> {
    const bannedUsersList = await db.select()
      .from(bannedUsers)
      .where(eq(bannedUsers.isActive, true))
      .orderBy(desc(bannedUsers.createdAt));
    
    return bannedUsersList;
  }

  async updateBannedUser(id: number, updates: Partial<InsertBannedUser>): Promise<void> {
    await db.update(bannedUsers)
      .set(updates)
      .where(eq(bannedUsers.id, id));
  }

  async checkAndCleanExpiredBans(): Promise<void> {
    const now = new Date();
    
    // Find all expired temporary bans
    const expiredBans = await db.select()
      .from(bannedUsers)
      .where(and(
        eq(bannedUsers.isActive, true),
        eq(bannedUsers.banType, 'temporary'),
        db.sql`ban_expires_at <= ${now}`
      ));
    
    // Deactivate expired bans
    if (expiredBans.length > 0) {
      await db.update(bannedUsers)
        .set({ isActive: false })
        .where(and(
          eq(bannedUsers.isActive, true),
          eq(bannedUsers.banType, 'temporary'),
          db.sql`ban_expires_at <= ${now}`
        ));
    }
  }

  // Resource operations
  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async getAllResources(): Promise<Resource[]> {
    return await db.select().from(resources).orderBy(desc(resources.priority), desc(resources.createdAt));
  }

  async getActiveResources(): Promise<Resource[]> {
    return await db.select()
      .from(resources)
      .where(eq(resources.isActive, true))
      .orderBy(desc(resources.priority), desc(resources.createdAt));
  }

  async getFeaturedResources(): Promise<Resource[]> {
    return await db.select()
      .from(resources)
      .where(and(eq(resources.isActive, true), eq(resources.featured, true)))
      .orderBy(desc(resources.priority), desc(resources.createdAt));
  }

  async getResourcesByCategory(category: string): Promise<Resource[]> {
    return await db.select()
      .from(resources)
      .where(and(eq(resources.isActive, true), eq(resources.category, category)))
      .orderBy(desc(resources.priority), desc(resources.createdAt));
  }

  async getResourcesByBrand(brand: string): Promise<Resource[]> {
    return await db.select()
      .from(resources)
      .where(and(eq(resources.isActive, true), eq(resources.brand, brand)))
      .orderBy(desc(resources.priority), desc(resources.createdAt));
  }

  async updateResource(id: number, updates: Partial<InsertResource>): Promise<Resource> {
    const [updatedResource] = await db.update(resources)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(resources.id, id))
      .returning();
    return updatedResource;
  }

  async deleteResource(id: number): Promise<boolean> {
    const result = await db.delete(resources).where(eq(resources.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async toggleResourceFeatured(id: number, featured: boolean): Promise<void> {
    await db.update(resources)
      .set({ featured, updatedAt: new Date() })
      .where(eq(resources.id, id));
  }

  async updateResourcePriority(id: number, priority: number): Promise<void> {
    await db.update(resources)
      .set({ priority, updatedAt: new Date() })
      .where(eq(resources.id, id));
  }

  // Platform settings operations
  async getPlatformSetting(key: string): Promise<PlatformSettings | undefined> {
    const [setting] = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    return setting;
  }

  async getAllPlatformSettings(): Promise<PlatformSettings[]> {
    return await db.select().from(platformSettings).orderBy(platformSettings.key);
  }

  async createPlatformSetting(setting: InsertPlatformSettings): Promise<PlatformSettings> {
    const [newSetting] = await db.insert(platformSettings).values(setting).returning();
    return newSetting;
  }

  async updatePlatformSetting(key: string, updates: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const [updatedSetting] = await db.update(platformSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(platformSettings.key, key))
      .returning();
    return updatedSetting;
  }

  async deletePlatformSetting(key: string): Promise<void> {
    await db.delete(platformSettings).where(eq(platformSettings.key, key));
  }

  // First lead voucher operations
  async getInstallerVoucher(installerId: number): Promise<FirstLeadVoucher | undefined> {
    const [voucher] = await db.select().from(firstLeadVouchers).where(eq(firstLeadVouchers.installerId, installerId));
    return voucher;
  }

  async createInstallerVoucher(voucher: InsertFirstLeadVoucher): Promise<FirstLeadVoucher> {
    const [newVoucher] = await db.insert(firstLeadVouchers).values(voucher).returning();
    return newVoucher;
  }

  async markVoucherAsUsed(installerId: number, bookingId: number, voucherAmount: number, originalLeadFee: number): Promise<void> {
    await db.update(firstLeadVouchers)
      .set({ 
        isUsed: true, 
        usedAt: new Date(),
        usedOnBookingId: bookingId,
        voucherAmount,
        originalLeadFee
      })
      .where(eq(firstLeadVouchers.installerId, installerId));
  }

  async checkVoucherEligibility(installerId: number): Promise<boolean> {
    // Check if installer has a voucher and it hasn't been used
    const voucher = await this.getInstallerVoucher(installerId);
    if (!voucher || voucher.isUsed) {
      return false;
    }

    // Check if installer has previously purchased any leads (excluding demo installer)
    if (installerId === 2) {
      return true; // Demo installer is always eligible
    }

    const previousLeads = await db.select()
      .from(jobAssignments)
      .where(eq(jobAssignments.installerId, installerId));

    return previousLeads.length === 0; // Eligible if no previous leads purchased
  }

  async getAllVouchers(): Promise<FirstLeadVoucher[]> {
    return await db.select().from(firstLeadVouchers).orderBy(desc(firstLeadVouchers.createdAt));
  }

  async createFirstLeadVoucher(voucher: InsertFirstLeadVoucher): Promise<FirstLeadVoucher> {
    const [newVoucher] = await db.insert(firstLeadVouchers).values(voucher).returning();
    return newVoucher;
  }

  async updateFirstLeadVoucher(id: number, updates: Partial<FirstLeadVoucher>): Promise<FirstLeadVoucher> {
    const [updatedVoucher] = await db.update(firstLeadVouchers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(firstLeadVouchers.id, id))
      .returning();
    return updatedVoucher;
  }

  async getFirstLeadVoucher(installerId: number): Promise<FirstLeadVoucher | undefined> {
    const [voucher] = await db.select().from(firstLeadVouchers).where(eq(firstLeadVouchers.installerId, installerId));
    return voucher;
  }

  async getAllFirstLeadVouchers(): Promise<FirstLeadVoucher[]> {
    return await db.select().from(firstLeadVouchers).orderBy(desc(firstLeadVouchers.createdAt));
  }

  async createFirstLeadVoucher(voucher: InsertFirstLeadVoucher): Promise<FirstLeadVoucher> {
    const [newVoucher] = await db.insert(firstLeadVouchers).values(voucher).returning();
    return newVoucher;
  }

  async updateFirstLeadVoucher(id: number, updates: Partial<FirstLeadVoucher>): Promise<FirstLeadVoucher> {
    const [updatedVoucher] = await db.update(firstLeadVouchers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(firstLeadVouchers.id, id))
      .returning();
    return updatedVoucher;
  }

  // Anti-manipulation tracking operations
  async createAntiManipulationRecord(record: InsertAntiManipulation): Promise<AntiManipulation> {
    const [newRecord] = await db.insert(antiManipulation).values(record).returning();
    return newRecord;
  }

  async getInstallerManipulationRecords(installerId: number): Promise<AntiManipulation[]> {
    return await db.select()
      .from(antiManipulation)
      .where(eq(antiManipulation.installerId, installerId))
      .orderBy(desc(antiManipulation.flaggedAt));
  }

  async markManipulationResolved(id: number, resolvedBy: string): Promise<void> {
    await db.update(antiManipulation)
      .set({ 
        isResolved: true, 
        resolvedAt: new Date(),
        resolvedBy
      })
      .where(eq(antiManipulation.id, id));
  }

  async getAllManipulationRecords(): Promise<AntiManipulation[]> {
    return await db.select()
      .from(antiManipulation)
      .orderBy(desc(antiManipulation.flaggedAt));
  }

  // Password reset operations
  async createPasswordResetToken(userId: number, tokenHash: string, expiresAt: Date, userType: 'customer' | 'installer'): Promise<PasswordResetToken> {
    const [token] = await db.insert(passwordResetTokens).values({
      userId,
      tokenHash,
      expiresAt,
      userType,
      used: false
    }).returning();
    return token;
  }

  async getPasswordResetToken(tokenHash: string, userType: 'customer' | 'installer'): Promise<PasswordResetToken | undefined> {
    const [token] = await db.select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        eq(passwordResetTokens.userType, userType)
      ));
    return token;
  }

  async markPasswordResetTokenAsUsed(tokenHash: string): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ 
        used: true, 
        usedAt: new Date() 
      })
      .where(eq(passwordResetTokens.tokenHash, tokenHash));
  }

  async deletePasswordResetToken(tokenHash: string): Promise<void> {
    await db.delete(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash));
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await db.delete(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.used, false),
        // Delete tokens older than their expiration date
        eq(passwordResetTokens.expiresAt, new Date())
      ));
  }

  async updateUserPassword(userId: number, newPasswordHash: string): Promise<void> {
    await db.update(users)
      .set({ 
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId.toString()));
  }

  async updateInstallerPassword(userId: number, newPasswordHash: string): Promise<void> {
    await db.update(installers)
      .set({ 
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      })
      .where(eq(installers.id, userId));
  }

  // TV Setup booking operations
  async createTvSetupBooking(booking: InsertTvSetupBooking): Promise<TvSetupBooking> {
    const [tvBooking] = await db.insert(tvSetupBookings).values(booking).returning();
    return tvBooking;
  }

  async getTvSetupBooking(id: number): Promise<TvSetupBooking | undefined> {
    const [tvBooking] = await db.select().from(tvSetupBookings).where(eq(tvSetupBookings.id, id));
    return tvBooking;
  }

  async getAllTvSetupBookings(): Promise<TvSetupBooking[]> {
    return await db.select().from(tvSetupBookings).orderBy(desc(tvSetupBookings.createdAt));
  }

  async updateTvSetupBookingPayment(id: number, paymentIntentId: string, status: string): Promise<void> {
    await db.update(tvSetupBookings)
      .set({ 
        stripePaymentIntentId: paymentIntentId,
        paymentStatus: status,
        updatedAt: new Date()
      })
      .where(eq(tvSetupBookings.id, id));
  }

  async updateTvSetupBookingCredentials(id: number, username: string, password: string): Promise<void> {
    await db.update(tvSetupBookings)
      .set({ 
        appUsername: username,
        appPassword: password,
        credentialsProvided: true,
        updatedAt: new Date()
      })
      .where(eq(tvSetupBookings.id, id));
  }

  async markTvSetupEmailSent(id: number, emailType: 'confirmation' | 'admin' | 'credentials'): Promise<void> {
    const updateData: any = { updatedAt: new Date() };
    
    switch (emailType) {
      case 'confirmation':
        updateData.confirmationEmailSent = true;
        break;
      case 'admin':
        updateData.adminNotificationSent = true;
        break;
      case 'credentials':
        updateData.credentialsEmailSent = true;
        updateData.credentialsSentAt = new Date();
        break;
    }

    await db.update(tvSetupBookings)
      .set(updateData)
      .where(eq(tvSetupBookings.id, id));
  }

  async updateTvSetupBookingStatus(id: number, status: string, adminNotes?: string, assignedTo?: string): Promise<void> {
    const updateData: any = { 
      setupStatus: status,
      updatedAt: new Date()
    };
    
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (status === 'completed') updateData.completedAt = new Date();

    await db.update(tvSetupBookings)
      .set(updateData)
      .where(eq(tvSetupBookings.id, id));
  }

  async updateTvSetupBookingReferral(id: number, referralData: {
    referralCode?: string | null;
    referralCodeId?: number | null;
    salesStaffName?: string | null;
    salesStaffStore?: string | null;
  }): Promise<void> {
    const updateData: any = { 
      updatedAt: new Date()
    };
    
    if (referralData.referralCode !== undefined) updateData.referralCode = referralData.referralCode;
    if (referralData.referralCodeId !== undefined) updateData.referralCodeId = referralData.referralCodeId;
    if (referralData.salesStaffName !== undefined) updateData.salesStaffName = referralData.salesStaffName;
    if (referralData.salesStaffStore !== undefined) updateData.salesStaffStore = referralData.salesStaffStore;

    await db.update(tvSetupBookings)
      .set(updateData)
      .where(eq(tvSetupBookings.id, id));
  }

  async updateTvSetupBookingMacAddress(id: number, macAddress: string): Promise<void> {
    await db.update(tvSetupBookings)
      .set({ 
        macAddress,
        macAddressProvided: true,
        macAddressProvidedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(tvSetupBookings.id, id));
  }

  async markTvSetupCredentialsPaid(id: number): Promise<void> {
    await db.update(tvSetupBookings)
      .set({ 
        credentialsPaymentStatus: 'paid',
        credentialsPaidAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(tvSetupBookings.id, id));
  }

  async updateTvSetupBookingStripeSession(id: number, sessionId: string): Promise<void> {
    await db.update(tvSetupBookings)
      .set({ 
        credentialsStripeSessionId: sessionId,
        updatedAt: new Date()
      })
      .where(eq(tvSetupBookings.id, id));
  }

  async updateTvSetupBookingCredentialsPayment(id: number, sessionId: string, status: string): Promise<void> {
    await db.update(tvSetupBookings)
      .set({ 
        credentialsStripeSessionId: sessionId,
        credentialsPaymentStatus: status,
        updatedAt: new Date()
      })
      .where(eq(tvSetupBookings.id, id));
  }

  async updateTvSetupBookingStripeSession(id: number, sessionId: string): Promise<void> {
    await db.update(tvSetupBookings)
      .set({ 
        stripeSessionId: sessionId,
        updatedAt: new Date()
      })
      .where(eq(tvSetupBookings.id, id));
  }

  async updateTvSetupBookingIptvCredentials(id: number, credentials: {
    credentialsType: string;
    serverHostname?: string;
    serverUsername?: string;
    serverPassword?: string;
    numberOfDevices?: number;
    m3uUrl?: string;
  }): Promise<void> {
    await db.update(tvSetupBookings)
      .set({ 
        credentialsType: credentials.credentialsType,
        serverHostname: credentials.serverHostname,
        serverUsername: credentials.serverUsername,
        serverPassword: credentials.serverPassword,
        numberOfDevices: credentials.numberOfDevices,
        m3uUrl: credentials.m3uUrl,
        credentialsProvided: true,
        updatedAt: new Date()
      })
      .where(eq(tvSetupBookings.id, id));
  }

  async deleteTvSetupBooking(id: number): Promise<void> {
    await db.delete(tvSetupBookings).where(eq(tvSetupBookings.id, id));
  }

  async getTvSetupBookingsByEmail(email: string): Promise<TvSetupBooking[]> {
    return await db.select()
      .from(tvSetupBookings)
      .where(eq(tvSetupBookings.email, email))
      .orderBy(desc(tvSetupBookings.createdAt));
  }

  // Downloadable Guides implementation
  async getDownloadableGuides(): Promise<DownloadableGuide[]> {
    return await db.select().from(downloadableGuides)
      .where(eq(downloadableGuides.isActive, true))
      .orderBy(downloadableGuides.createdAt);
  }

  async getAllDownloadableGuides(): Promise<DownloadableGuide[]> {
    return await db.select().from(downloadableGuides).orderBy(downloadableGuides.createdAt);
  }

  async getDownloadableGuideById(id: number): Promise<DownloadableGuide | undefined> {
    const [guide] = await db.select().from(downloadableGuides).where(eq(downloadableGuides.id, id));
    return guide;
  }

  async createDownloadableGuide(guide: InsertDownloadableGuide): Promise<DownloadableGuide> {
    const [newGuide] = await db.insert(downloadableGuides).values(guide).returning();
    return newGuide;
  }

  async updateDownloadableGuide(id: number, guide: Partial<InsertDownloadableGuide>): Promise<void> {
    await db.update(downloadableGuides)
      .set({ ...guide, updatedAt: new Date() })
      .where(eq(downloadableGuides.id, id));
  }

  async deleteDownloadableGuide(id: number): Promise<void> {
    await db.delete(downloadableGuides).where(eq(downloadableGuides.id, id));
  }

  async incrementDownloadCount(id: number): Promise<void> {
    await db.update(downloadableGuides)
      .set({ 
        downloadCount: sql`${downloadableGuides.downloadCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(downloadableGuides.id, id));
  }

  // Video Tutorials implementation
  async getVideoTutorials(): Promise<VideoTutorial[]> {
    return await db.select().from(videoTutorials)
      .where(eq(videoTutorials.isActive, true))
      .orderBy(videoTutorials.createdAt);
  }

  async getAllVideoTutorials(): Promise<VideoTutorial[]> {
    return await db.select().from(videoTutorials).orderBy(videoTutorials.createdAt);
  }

  async getVideoTutorialById(id: number): Promise<VideoTutorial | undefined> {
    const [tutorial] = await db.select().from(videoTutorials).where(eq(videoTutorials.id, id));
    return tutorial;
  }

  async createVideoTutorial(tutorial: InsertVideoTutorial): Promise<VideoTutorial> {
    const [newTutorial] = await db.insert(videoTutorials).values(tutorial).returning();
    return newTutorial;
  }

  async updateVideoTutorial(id: number, tutorial: Partial<InsertVideoTutorial>): Promise<void> {
    await db.update(videoTutorials)
      .set({ ...tutorial, updatedAt: new Date() })
      .where(eq(videoTutorials.id, id));
  }

  async deleteVideoTutorial(id: number): Promise<void> {
    await db.delete(videoTutorials).where(eq(videoTutorials.id, id));
  }

  async incrementViewCount(id: number): Promise<void> {
    await db.update(videoTutorials)
      .set({ 
        viewCount: sql`${videoTutorials.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(videoTutorials.id, id));
  }

  // Consultation operations
  async createConsultation(consultation: InsertConsultation): Promise<Consultation> {
    const [result] = await db.insert(consultations).values(consultation).returning();
    return result;
  }

  async getConsultation(id: number): Promise<Consultation | undefined> {
    const [result] = await db.select().from(consultations).where(eq(consultations.id, id));
    return result;
  }

  async getAllConsultations(): Promise<Consultation[]> {
    return await db.select().from(consultations).orderBy(desc(consultations.createdAt));
  }

  async updateConsultation(id: number, updates: Partial<InsertConsultation>): Promise<Consultation | undefined> {
    const [result] = await db.update(consultations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(consultations.id, id))
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
