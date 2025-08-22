import { 
  users, bookings, installers, jobAssignments, reviews, solarEnquiries,
  referralSettings, referralCodes, referralUsage, consultationBookings,
  leadPricing, wallMountPricing, installerWallets, installerTransactions,
  scheduleNegotiations, declinedRequests, emailTemplates, bannedUsers,
  leadQualityTracking, antiManipulation, customerVerification, resources,
  platformSettings, performanceRefundSettings, firstLeadVouchers, passwordResetTokens, tvSetupBookings,
  consultations, downloadableGuides, videoTutorials, productCategories,
  qrCodeScans, aiProductRecommendations, choiceFlowTracking, aiToolQrCodes, aiInteractionAnalytics,
  onboardingInvitations, tradesPersonEmailTemplates, serviceTypes, serviceMetrics, retailerInvoices,
  installerServiceAssignments, customerWallets, customerTransactions, supportTickets, ticketMessages, aiUsageTracking, aiTools, leadRefunds,
  installationPhotoProgress,
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
  type CustomerWallet, type InsertCustomerWallet,
  type CustomerTransaction, type InsertCustomerTransaction,
  type SupportTicket, type InsertSupportTicket,
  type TicketMessage, type InsertTicketMessage,
  type AiUsageTracking, type InsertAiUsageTracking,
  type EmailTemplate, type InsertEmailTemplate,
  type BannedUser, type InsertBannedUser,
  type Resource, type InsertResource,
  type PlatformSettings, type InsertPlatformSettings,
  type PerformanceRefundSettings, type InsertPerformanceRefundSettings,
  type FirstLeadVoucher, type InsertFirstLeadVoucher,
  type AntiManipulation, type InsertAntiManipulation,
  type PasswordResetToken, type InsertPasswordResetToken,
  type TvSetupBooking, type InsertTvSetupBooking,
  type DownloadableGuide, type InsertDownloadableGuide,
  type VideoTutorial, type InsertVideoTutorial,
  type ProductCategory, type InsertProductCategory,
  type QrCodeScan, type InsertQrCodeScan,
  type AiProductRecommendation, type InsertAiProductRecommendation,
  type ChoiceFlowTracking, type InsertChoiceFlowTracking,
  type AiToolQrCode, type InsertAiToolQrCode,
  type OnboardingInvitation, type InsertOnboardingInvitation,
  type TradesPersonEmailTemplate, type InsertTradesPersonEmailTemplate,
  type SelectServiceType, type InsertServiceType,
  type AiTool, type InsertAiTool,
  type SelectServiceMetrics, type InsertServiceMetrics,
  type InstallerServiceAssignment, type InsertInstallerServiceAssignment,
  type AiInteractionAnalytics, type InsertAiInteractionAnalytics,
  type InstallationPhotoProgress, type InsertInstallationPhotoProgress
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, isNull, sql, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(userId: string, updates: Partial<UpsertUser>): Promise<User>;
  updateUserProfile(userId: string, profileData: { firstName: string; lastName: string; phone?: string | null; email?: string }): Promise<User>;
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
  getAllReviews(): Promise<Review[]>;
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

  // Customer wallet operations
  getCustomerWallet(userId: string): Promise<CustomerWallet | undefined>;
  createCustomerWallet(wallet: InsertCustomerWallet): Promise<CustomerWallet>;
  updateCustomerWalletBalance(userId: string, amount: number): Promise<void>;
  updateCustomerWalletTotalSpent(userId: string, amount: number): Promise<void>;
  updateCustomerWalletTotalTopUps(userId: string, amount: number): Promise<void>;
  addCustomerTransaction(transaction: InsertCustomerTransaction): Promise<CustomerTransaction>;
  getCustomerTransactions(userId: string): Promise<CustomerTransaction[]>;
  getAllCustomerTransactions(): Promise<CustomerTransaction[]>;

  // Support ticket operations
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTicket(id: number): Promise<SupportTicket | undefined>;
  getUserSupportTickets(userId: string): Promise<SupportTicket[]>;
  getAllSupportTickets(): Promise<SupportTicket[]>;
  updateSupportTicketStatus(id: number, status: string, assignedTo?: string): Promise<void>;
  closeSupportTicket(id: number): Promise<void>;
  addTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;
  getTicketMessages(ticketId: number): Promise<TicketMessage[]>;

  // AI Usage Tracking operations
  getAiUsageTracking(userId: string | null, sessionId: string, aiFeature: string): Promise<AiUsageTracking | undefined>;
  createAiUsageTracking(usage: InsertAiUsageTracking): Promise<AiUsageTracking>;
  incrementAiUsage(userId: string | null, sessionId: string, aiFeature: string, isPaid: boolean): Promise<void>;
  getUserAiUsageSummary(userId: string): Promise<{ feature: string; freeCount: number; paidCount: number; }[]>;
  checkAiFreeUsageLimit(userId: string | null, sessionId: string, aiFeature: string, freeLimit?: number): Promise<{ canUseFree: boolean; usageCount: number; }>;

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

  // Performance refund settings operations
  getPerformanceRefundSettings(): Promise<PerformanceRefundSettings[]>;
  getPerformanceRefundSettingByStarLevel(starLevel: number): Promise<PerformanceRefundSettings | undefined>;
  createPerformanceRefundSetting(setting: InsertPerformanceRefundSettings): Promise<PerformanceRefundSettings>;
  updatePerformanceRefundSetting(id: number, setting: Partial<InsertPerformanceRefundSettings>): Promise<PerformanceRefundSettings>;
  deletePerformanceRefundSetting(id: number): Promise<boolean>;
  
  // Lead fee exemption checking
  shouldInstallerPayLeadFee(installerId: number): Promise<boolean>;

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
  createPasswordResetToken(userId: string | number, tokenHash: string, expiresAt: Date, userType: 'customer' | 'installer'): Promise<PasswordResetToken>;
  getPasswordResetToken(tokenHash: string, userType: 'customer' | 'installer'): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(tokenHash: string): Promise<void>;
  deletePasswordResetToken(tokenHash: string): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<void>;
  updateUserPassword(userId: string | number, newPasswordHash: string): Promise<void>;
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

  // Product Categories for QR Code Flyers
  createProductCategory(category: InsertProductCategory): Promise<ProductCategory>;
  getProductCategory(id: number): Promise<ProductCategory | undefined>;
  getProductCategoryBySlug(slug: string): Promise<ProductCategory | undefined>;
  getProductCategoryByQrCodeId(qrCodeId: string): Promise<ProductCategory | undefined>;
  getAllProductCategories(): Promise<ProductCategory[]>;
  getActiveProductCategories(): Promise<ProductCategory[]>;
  updateProductCategory(id: number, updates: Partial<InsertProductCategory>): Promise<ProductCategory>;
  deleteProductCategory(id: number): Promise<boolean>;
  incrementCategoryScanCount(id: number): Promise<void>;
  incrementCategoryRecommendationCount(id: number): Promise<void>;
  incrementCategoryConversionCount(id: number): Promise<void>;

  // QR Code Scan Tracking
  createQrCodeScan(scan: InsertQrCodeScan): Promise<QrCodeScan>;
  getQrCodeScan(id: number): Promise<QrCodeScan | undefined>;
  getQrCodeScansByCategory(categoryId: number): Promise<QrCodeScan[]>;
  getQrCodeScansBySession(sessionId: string): Promise<QrCodeScan[]>;
  getCategoryScanStats(categoryId: number, days?: number): Promise<{ totalScans: number; uniqueUsers: number; dailyScans: Array<{date: string, count: number}> }>;

  // AI Product Recommendations Tracking
  createAiProductRecommendation(recommendation: InsertAiProductRecommendation): Promise<AiProductRecommendation>;
  getAiProductRecommendation(id: number): Promise<AiProductRecommendation | undefined>;
  getRecommendationsByCategory(categoryId: number): Promise<AiProductRecommendation[]>;
  getRecommendationsBySession(sessionId: string): Promise<AiProductRecommendation[]>;
  updateRecommendationEngagement(id: number, engagement: string, selectedProduct?: string): Promise<void>;
  markRecommendationConverted(id: number, bookingId: number): Promise<void>;
  getCategoryRecommendationStats(categoryId: number, days?: number): Promise<{ totalRecommendations: number; conversions: number; engagementBreakdown: Record<string, number> }>;

  // Choice Flow Tracking
  createChoiceFlowTracking(flow: InsertChoiceFlowTracking): Promise<ChoiceFlowTracking>;

  // Service Types and Metrics operations
  getAllServiceTypes(): Promise<SelectServiceType[]>;
  getActiveServiceTypes(): Promise<SelectServiceType[]>;
  getServiceTypeByKey(key: string): Promise<SelectServiceType | undefined>;
  updateServiceTypeStatus(id: number, isActive: boolean): Promise<void>;
  
  // Service metrics operations
  getServiceMetrics(): Promise<(SelectServiceMetrics & { serviceType: SelectServiceType })[]>;
  getServiceMetricsByType(serviceTypeId: number): Promise<SelectServiceMetrics | undefined>;
  updateServiceMetrics(serviceTypeId: number, metrics: Partial<InsertServiceMetrics>): Promise<void>;
  
  // Real-time tracking updates
  incrementJobsCompleted(serviceTypeKey: string): Promise<void>;
  updateJobsAvailable(serviceTypeKey: string, count: number): Promise<void>;
  updateInstallerCount(serviceTypeKey: string, count: number): Promise<void>;
  recalculateEarningsRange(serviceTypeKey: string): Promise<void>;
  
  // Installer service assignment operations
  assignServiceToInstaller(assignment: InsertInstallerServiceAssignment): Promise<InstallerServiceAssignment>;
  removeServiceFromInstaller(installerId: number, serviceTypeId: number): Promise<void>;
  getInstallerServices(installerId: number): Promise<(InstallerServiceAssignment & { serviceType: SelectServiceType })[]>;
  getInstallersByService(serviceTypeId: number): Promise<(InstallerServiceAssignment & { installer: Installer })[]>;
  getAllInstallerServiceAssignments(): Promise<(InstallerServiceAssignment & { installer: Installer; serviceType: SelectServiceType })[]>;

  // Tradesperson Onboarding operations
  createOnboardingInvitation(invitation: InsertOnboardingInvitation): Promise<OnboardingInvitation>;
  getOnboardingInvitation(id: number): Promise<OnboardingInvitation | undefined>;
  getOnboardingInvitationByToken(token: string): Promise<OnboardingInvitation | undefined>;
  getAllOnboardingInvitations(): Promise<OnboardingInvitation[]>;
  updateOnboardingInvitationStatus(id: number, status: string): Promise<void>;
  resendOnboardingInvitation(id: number): Promise<void>;
  deleteOnboardingInvitation(id: number): Promise<void>;

  // Tradesperson Email Templates operations
  createTradesPersonEmailTemplate(template: InsertTradesPersonEmailTemplate): Promise<TradesPersonEmailTemplate>;
  getTradesPersonEmailTemplate(id: number): Promise<TradesPersonEmailTemplate | undefined>;
  getTradesPersonEmailTemplatesBySkill(tradeSkill: string): Promise<TradesPersonEmailTemplate[]>;
  getAllTradesPersonEmailTemplates(): Promise<TradesPersonEmailTemplate[]>;
  updateTradesPersonEmailTemplate(id: number, updates: Partial<InsertTradesPersonEmailTemplate>): Promise<TradesPersonEmailTemplate>;
  deleteTradesPersonEmailTemplate(id: number): Promise<void>;
  getChoiceFlowTracking(id: number): Promise<ChoiceFlowTracking | undefined>;
  getChoiceFlowsByCategory(categoryId: number): Promise<ChoiceFlowTracking[]>;
  getChoiceFlowsBySession(sessionId: string): Promise<ChoiceFlowTracking[]>;
  updateChoiceFlowStep(id: number, currentStep: number, responses: Record<string, any>): Promise<void>;
  completeChoiceFlow(id: number, timeSpentMinutes: number): Promise<void>;
  markChoiceFlowExit(id: number, exitStep: number, exitReason: string): Promise<void>;
  getCategoryFlowStats(categoryId: number, days?: number): Promise<{ totalFlows: number; completionRate: number; avgTimeSpent: number; dropOffByStep: Record<number, number> }>;
  
  // Invoice-based user operations
  getUserByRetailerInvoice(invoiceNumber: string): Promise<User | undefined>;
  getUserByRetailerInvoiceAndEmail(invoiceNumber: string, email: string): Promise<User | undefined>;
  createRetailerInvoice(invoiceData: {
    invoiceNumber: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string | null;
    purchaseDate: Date;
    storeName?: string | null;
    storeCode?: string | null;
    retailerCode?: string | null;
    isUsedForRegistration?: boolean;
  }): Promise<any>;

  // AI Tools management operations
  getAllAiTools(): Promise<AiTool[]>;
  getActiveAiTools(): Promise<AiTool[]>;
  getAiTool(id: number): Promise<AiTool | undefined>;
  getAiToolByKey(key: string): Promise<AiTool | undefined>;
  createAiTool(tool: InsertAiTool): Promise<AiTool>;
  updateAiTool(id: number, updates: Partial<InsertAiTool>): Promise<AiTool>;
  deleteAiTool(id: number): Promise<void>;
  updateAiToolStatus(id: number, isActive: boolean): Promise<void>;

  // AI Tool QR Code operations
  createAiToolQrCode(qrCode: InsertAiToolQrCode): Promise<AiToolQrCode>;
  getAiToolQrCodes(toolId: number): Promise<AiToolQrCode[]>;
  getAiToolQrCodeById(id: number): Promise<AiToolQrCode | undefined>;
  getAiToolQrCodeByQrCodeId(qrCodeId: string): Promise<AiToolQrCode | undefined>;
  updateAiToolQrCode(id: number, updates: Partial<InsertAiToolQrCode>): Promise<AiToolQrCode>;
  updateAiToolQrCodeScanData(id: number, updates: { scanCount: number; lastScannedAt: Date }): Promise<void>;
  deleteAiToolQrCode(id: number): Promise<void>;
  incrementQrCodeScanCount(qrCodeId: string): Promise<void>;
  
  // AI Interaction Analytics operations
  createAiInteractionAnalytics(analytics: InsertAiInteractionAnalytics): Promise<AiInteractionAnalytics>;
  getAiInteractionAnalytics(id: number): Promise<AiInteractionAnalytics | undefined>;
  getAnalyticsBySession(sessionId: string): Promise<AiInteractionAnalytics[]>;
  getAnalyticsByStore(storeLocation: string, limit?: number): Promise<AiInteractionAnalytics[]>;
  getAnalyticsByTool(aiTool: string, limit?: number): Promise<AiInteractionAnalytics[]>;
  updateInteractionEngagement(sessionId: string, updates: {
    userSatisfaction?: number;
    followUpQuestions?: number;
    sessionDurationMinutes?: number;
    actionTaken?: string;
  }): Promise<void>;
  
  // Installation photo progress operations
  createInstallationPhotoProgress(progress: InsertInstallationPhotoProgress): Promise<InstallationPhotoProgress>;
  getInstallationPhotoProgress(bookingId: number, installerId: number, tvIndex: number): Promise<InstallationPhotoProgress | undefined>;
  updateInstallationPhotoProgress(id: number, updates: Partial<InsertInstallationPhotoProgress>): Promise<InstallationPhotoProgress>;
  deleteInstallationPhotoProgress(bookingId: number, installerId: number): Promise<void>;
  getInstallationPhotoProgressByBooking(bookingId: number, installerId: number): Promise<InstallationPhotoProgress[]>;

  // Installer-specific resource operations (filtered by service type)
  getResourcesByServiceTypes(serviceTypeIds: number[]): Promise<Resource[]>;
  getDownloadableGuidesByServiceTypes(serviceTypeIds: number[]): Promise<DownloadableGuide[]>;
  getVideoTutorialsByServiceTypes(serviceTypeIds: number[]): Promise<VideoTutorial[]>;
  incrementGuideDownloadCount(guideId: number): Promise<void>;
  incrementVideoViewCount(videoId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserById(id: string | number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, String(id)));
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

    // Check if user exists by email first (for OAuth migration)
    const existingUserByEmail = await this.getUserByEmail(userData.email);
    
    if (existingUserByEmail) {
      // Update existing user with new OAuth ID and data
      const [user] = await db
        .update(users)
        .set({
          id: userDataWithRole.id, // Update to Google OAuth ID
          ...userDataWithRole,
          updatedAt: new Date(),
        })
        .where(eq(users.email, userData.email))
        .returning();
      return user;
    }

    // Create new user if doesn't exist
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

  async updateUser(userId: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserProfile(userId: string, profileData: { firstName: string; lastName: string; phone?: string | null; email?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        ...(profileData.email && { email: profileData.email }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, userId));
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
    yearsExperience?: number;
  }): Promise<Installer> {
    const [installer] = await db.insert(installers).values({
      email,
      passwordHash,
      businessName: additionalData?.businessName || "TBD",
      contactName: additionalData?.contactName || "TBD",
      phone: additionalData?.phone || null,
      address: additionalData?.address || null,
      serviceArea: additionalData?.serviceArea || null,
      yearsExperience: additionalData?.yearsExperience || 0,
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
    // Import lead pricing function
    const { getLeadFee } = await import('./leadPricing');
    
    // Get job assignments for this installer with purchased, accepted, etc. status
    const assignments = await db.select().from(jobAssignments)
      .where(and(
        eq(jobAssignments.installerId, installerId),
        inArray(jobAssignments.status, ['purchased', 'accepted', 'in_progress', 'completed'])
      ));

    // Get the corresponding bookings and merge with assignment data
    const results = [];
    for (const assignment of assignments) {
      const [booking] = await db.select().from(bookings)
        .where(eq(bookings.id, assignment.bookingId));
      
      if (booking) {
        // Calculate the correct lead fee based on service type if not properly stored
        const correctLeadFee = assignment.leadFee && parseFloat(assignment.leadFee) > 0 
          ? assignment.leadFee 
          : getLeadFee(booking.serviceType).toFixed(2);
        
        // Calculate TV quantity from installations array if available
        const tvInstallations = booking.tvInstallations || [];
        const tvQuantity = Array.isArray(tvInstallations) && tvInstallations.length > 0 
          ? tvInstallations.length 
          : 1;
        
        results.push({
          ...booking,
          jobAssignmentId: assignment.id,
          leadFee: correctLeadFee,
          assignedDate: assignment.assignedDate,
          acceptedDate: assignment.acceptedDate,
          completedDate: assignment.completedDate,
          jobAssignmentStatus: assignment.status,
          tvInstallations: tvInstallations,
          tvQuantity: tvQuantity,
          // Ensure customer data is properly mapped
          customerName: booking.contactName,
          customerEmail: booking.contactEmail,
          customerPhone: booking.contactPhone
        });
      }
    }

    return results;
  }

  async updateBooking(id: number, updates: Partial<InsertBooking>): Promise<void> {
    await db.update(bookings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bookings.id, id));
  }

  async deleteBooking(id: number): Promise<void> {
    try {
      console.log(`🗑️ Starting deletion process for booking ${id}`);
      
      // Delete all related records first to handle foreign key constraints
      console.log('✅ Deleting declined requests...');
      await db.delete(declinedRequests).where(eq(declinedRequests.bookingId, id));
      console.log('✅ Deleted declined requests for booking', id);
      
      console.log('✅ Deleting job assignments...');
      await db.delete(jobAssignments).where(eq(jobAssignments.bookingId, id));
      console.log('✅ Deleted job assignments for booking', id);
      
      console.log('✅ Deleting schedule negotiations...');
      await db.delete(scheduleNegotiations).where(eq(scheduleNegotiations.bookingId, id));
      console.log('✅ Deleted schedule negotiations for booking', id);
      
      console.log('✅ Deleting lead refunds...');
      await db.delete(leadRefunds).where(eq(leadRefunds.bookingId, id));
      console.log('✅ Deleted lead refunds for booking', id);
      
      console.log('✅ Deleting lead quality tracking...');
      await db.delete(leadQualityTracking).where(eq(leadQualityTracking.bookingId, id));
      console.log('✅ Deleted lead quality tracking for booking', id);
      
      console.log('✅ Deleting reviews...');
      await db.delete(reviews).where(eq(reviews.bookingId, id));
      console.log('✅ Deleted reviews for booking', id);
      
      console.log('✅ Deleting anti manipulation records...');
      await db.delete(antiManipulation).where(eq(antiManipulation.bookingId, id));
      console.log('✅ Deleted anti manipulation records for booking', id);
      
      console.log('✅ Deleting customer verification...');
      await db.delete(customerVerification).where(eq(customerVerification.bookingId, id));
      console.log('✅ Deleted customer verification for booking', id);
      
      console.log('✅ Deleting booking itself...');
      await db.delete(bookings).where(eq(bookings.id, id));
      console.log('✅ Successfully deleted booking', id);
    } catch (error) {
      console.error('Error in admin booking deletion:', error);
      throw error;
    }
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
    return await db.select().from(bookings);
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
      .where(eq(jobAssignments.bookingId, bookingId));
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
    const discount = settings ? parseFloat(settings.globalDiscountPercentage.toString()) : 10;

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

  async getReferralUsageHistory(): Promise<any[]> {
    try {
      const results = await db.select({
        id: referralUsage.id,
        referralCodeId: referralUsage.referralCodeId,
        bookingId: referralUsage.bookingId,
        tvSetupBookingId: referralUsage.tvSetupBookingId,
        bookingType: referralUsage.bookingType,
        referrerUserId: referralUsage.referrerUserId,
        refereeUserId: referralUsage.refereeUserId,
        discountAmount: referralUsage.discountAmount,
        rewardAmount: referralUsage.rewardAmount,
        subsidizedByInstaller: referralUsage.subsidizedByInstaller,
        status: referralUsage.status,
        paidOut: referralUsage.paidOut,
        createdAt: referralUsage.createdAt,
        updatedAt: referralUsage.updatedAt,
        // Join referral code info
        referralCode: referralCodes.referralCode,
        // Join TV setup booking customer info
        customerName: tvSetupBookings.name,
        customerEmail: tvSetupBookings.email,
        customerMobile: tvSetupBookings.mobile,
      }).from(referralUsage)
        .leftJoin(referralCodes, eq(referralUsage.referralCodeId, referralCodes.id))
        .leftJoin(tvSetupBookings, eq(referralUsage.tvSetupBookingId, tvSetupBookings.id))
        .orderBy(desc(referralUsage.createdAt));
      
      return results;
    } catch (error) {
      console.error('Error in getReferralUsageHistory:', error);
      // Fallback to simple query if joins fail
      return await db.select().from(referralUsage)
        .orderBy(desc(referralUsage.createdAt));
    }
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
    const [existing] = await db.select().from(installerWallets)
      .where(eq(installerWallets.installerId, installerId));
    
    if (existing) {
      return existing;
    }
    
    // Auto-create wallet if it doesn't exist
    const walletData = {
      installerId,
      balance: "0.00",
      totalSpent: "0.00", 
      totalEarned: "0.00",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const [newWallet] = await db.insert(installerWallets).values(walletData).returning();
    return newWallet;
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

  // Customer wallet operations
  async getCustomerWallet(userId: string): Promise<CustomerWallet | undefined> {
    const [wallet] = await db.select().from(customerWallets)
      .where(eq(customerWallets.userId, userId));
    return wallet;
  }

  async createCustomerWallet(wallet: InsertCustomerWallet): Promise<CustomerWallet> {
    const [newWallet] = await db.insert(customerWallets)
      .values(wallet)
      .returning();
    return newWallet;
  }

  async updateCustomerWalletBalance(userId: string, amount: number): Promise<void> {
    await db.update(customerWallets)
      .set({ 
        balance: amount.toString(),
        updatedAt: new Date()
      })
      .where(eq(customerWallets.userId, userId));
  }

  async updateCustomerWalletTotalSpent(userId: string, amount: number): Promise<void> {
    await db.update(customerWallets)
      .set({ 
        totalSpent: amount.toString(),
        updatedAt: new Date()
      })
      .where(eq(customerWallets.userId, userId));
  }

  async updateCustomerWalletTotalTopUps(userId: string, amount: number): Promise<void> {
    await db.update(customerWallets)
      .set({ 
        totalTopUps: amount.toString(),
        updatedAt: new Date()
      })
      .where(eq(customerWallets.userId, userId));
  }

  async addCustomerTransaction(transaction: InsertCustomerTransaction): Promise<CustomerTransaction> {
    const [newTransaction] = await db.insert(customerTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getCustomerTransactions(userId: string): Promise<CustomerTransaction[]> {
    return await db.select().from(customerTransactions)
      .where(eq(customerTransactions.userId, userId))
      .orderBy(desc(customerTransactions.createdAt));
  }

  async getAllCustomerTransactions(): Promise<CustomerTransaction[]> {
    return await db.select().from(customerTransactions)
      .orderBy(desc(customerTransactions.createdAt));
  }

  // Support ticket operations
  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const [newTicket] = await db.insert(supportTickets)
      .values(ticket)
      .returning();
    return newTicket;
  }

  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    const [ticket] = await db.select().from(supportTickets)
      .where(eq(supportTickets.id, id));
    return ticket;
  }

  async getUserSupportTickets(userId: string): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async getAllSupportTickets(): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets)
      .orderBy(desc(supportTickets.createdAt));
  }

  async updateSupportTicketStatus(id: number, status: string, assignedTo?: string): Promise<void> {
    const updateData: Partial<typeof supportTickets.$inferInsert> = {
      status,
      updatedAt: new Date()
    };
    
    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }
    
    if (status === 'closed') {
      updateData.closedAt = new Date();
    }
    
    await db.update(supportTickets)
      .set(updateData)
      .where(eq(supportTickets.id, id));
  }

  async closeSupportTicket(id: number): Promise<void> {
    await db.update(supportTickets)
      .set({ 
        status: 'closed',
        closedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(supportTickets.id, id));
  }

  async addTicketMessage(message: InsertTicketMessage): Promise<TicketMessage> {
    const [newMessage] = await db.insert(ticketMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getTicketMessages(ticketId: number): Promise<TicketMessage[]> {
    return await db.select().from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(ticketMessages.createdAt);
  }

  // AI Usage Tracking operations
  async getAiUsageTracking(userId: string | null, sessionId: string, aiFeature: string): Promise<AiUsageTracking | undefined> {
    // For authenticated users, track by userId and current date
    // For guest users, track by sessionId (no date reset)
    if (userId) {
      // Get today's start and end timestamps for accurate date comparison
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000); // Next day start
      
      const [usage] = await db.select().from(aiUsageTracking)
        .where(and(
          eq(aiUsageTracking.userId, userId),
          eq(aiUsageTracking.aiFeature, aiFeature),
          sql`${aiUsageTracking.createdAt} >= ${todayStart.toISOString()}`,
          sql`${aiUsageTracking.createdAt} < ${todayEnd.toISOString()}`
        ))
        .orderBy(desc(aiUsageTracking.createdAt))
        .limit(1);
      return usage;
    } else {
      // Guest users: track by session (no daily reset)
      const [usage] = await db.select().from(aiUsageTracking)
        .where(and(
          isNull(aiUsageTracking.userId),
          eq(aiUsageTracking.sessionId, sessionId),
          eq(aiUsageTracking.aiFeature, aiFeature)
        ));
      return usage;
    }
  }

  async createAiUsageTracking(usage: InsertAiUsageTracking): Promise<AiUsageTracking> {
    const [newUsage] = await db.insert(aiUsageTracking)
      .values(usage)
      .returning();
    return newUsage;
  }

  async incrementAiUsage(userId: string | null, sessionId: string, aiFeature: string, isPaid: boolean, qrCodeId?: string, storeLocation?: string): Promise<void> {
    if (userId) {
      // For authenticated users: check if there's already a record for today
      const existing = await this.getAiUsageTracking(userId, sessionId, aiFeature);
      
      if (existing) {
        // Update existing today's record
        await db.update(aiUsageTracking)
          .set({
            freeUsageCount: isPaid ? existing.freeUsageCount : (existing.freeUsageCount || 0) + 1,
            paidUsageCount: isPaid ? (existing.paidUsageCount || 0) + 1 : existing.paidUsageCount,
            lastFreeUsage: isPaid ? existing.lastFreeUsage : new Date(),
            lastPaidUsage: isPaid ? new Date() : existing.lastPaidUsage,
            qrCodeId: qrCodeId || existing.qrCodeId,
            storeLocation: storeLocation || existing.storeLocation,
            updatedAt: new Date()
          })
          .where(eq(aiUsageTracking.id, existing.id));
      } else {
        // Create new record for today
        await this.createAiUsageTracking({
          userId,
          sessionId,
          aiFeature,
          freeUsageCount: isPaid ? 0 : 1,
          paidUsageCount: isPaid ? 1 : 0,
          lastFreeUsage: isPaid ? null : new Date(),
          lastPaidUsage: isPaid ? new Date() : null,
          qrCodeId,
          storeLocation
        });
      }
    } else {
      // For guest users: use existing session-based logic
      const existing = await this.getAiUsageTracking(userId, sessionId, aiFeature);
      
      if (existing) {
        // Update existing record for guests
        await db.update(aiUsageTracking)
          .set({
            freeUsageCount: isPaid ? existing.freeUsageCount : (existing.freeUsageCount || 0) + 1,
            paidUsageCount: isPaid ? (existing.paidUsageCount || 0) + 1 : existing.paidUsageCount,
            lastFreeUsage: isPaid ? existing.lastFreeUsage : new Date(),
            lastPaidUsage: isPaid ? new Date() : existing.lastPaidUsage,
            qrCodeId: qrCodeId || existing.qrCodeId,
            storeLocation: storeLocation || existing.storeLocation,
            updatedAt: new Date()
          })
          .where(eq(aiUsageTracking.id, existing.id));
      } else {
        // Create new record for guests
        await this.createAiUsageTracking({
          userId,
          sessionId,
          aiFeature,
          freeUsageCount: isPaid ? 0 : 1,
          paidUsageCount: isPaid ? 1 : 0,
          lastFreeUsage: isPaid ? null : new Date(),
          lastPaidUsage: isPaid ? new Date() : null,
          qrCodeId,
          storeLocation
        });
      }
    }
  }

  async getUserAiUsageSummary(userId: string): Promise<{ feature: string; freeCount: number; paidCount: number; }[]> {
    // Get today's usage summary for authenticated user
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const usages = await db.select({
      feature: aiUsageTracking.aiFeature,
      freeCount: sql<number>`COALESCE(SUM(${aiUsageTracking.freeUsageCount}), 0)`,
      paidCount: sql<number>`COALESCE(SUM(${aiUsageTracking.paidUsageCount}), 0)`
    })
      .from(aiUsageTracking)
      .where(and(
        eq(aiUsageTracking.userId, userId),
        sql`${aiUsageTracking.createdAt} >= ${todayStart.toISOString()}`,
        sql`${aiUsageTracking.createdAt} < ${todayEnd.toISOString()}`
      ))
      .groupBy(aiUsageTracking.aiFeature);
    
    return usages.map(usage => ({
      feature: usage.feature,
      freeCount: usage.freeCount,
      paidCount: usage.paidCount
    }));
  }

  async checkAiFreeUsageLimit(userId: string | null, sessionId: string, aiFeature: string, freeLimit: number = 3): Promise<{ canUseFree: boolean; usageCount: number; }> {
    if (userId) {
      // For authenticated users: check today's usage (resets every 24 hours)
      // IMPORTANT: This method assumes email verification was already checked in middleware
      // to prevent bypass through mass unverified account creation
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const [usage] = await db.select({
        totalFreeUsage: sql<number>`COALESCE(SUM(${aiUsageTracking.freeUsageCount}), 0)`
      })
        .from(aiUsageTracking)
        .where(and(
          eq(aiUsageTracking.userId, userId),
          eq(aiUsageTracking.aiFeature, aiFeature),
          sql`${aiUsageTracking.createdAt} >= ${todayStart.toISOString()}`,
          sql`${aiUsageTracking.createdAt} < ${todayEnd.toISOString()}`
        ));
      
      const usageCount = usage?.totalFreeUsage || 0;
      return {
        canUseFree: usageCount < freeLimit,
        usageCount
      };
    } else {
      // For guest users: check session-based usage (no daily reset)
      // Limited to prevent abuse from rapid session creation
      const usage = await this.getAiUsageTracking(userId, sessionId, aiFeature);
      const usageCount = usage?.freeUsageCount || 0;
      
      return {
        canUseFree: usageCount < freeLimit,
        usageCount
      };
    }
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

  async getDeclinedRequestsWithDetailsForInstaller(installerId: number): Promise<any[]> {
    const declined = await db.select({
      id: declinedRequests.id,
      bookingId: declinedRequests.bookingId,
      declinedAt: declinedRequests.declinedAt,
      booking: bookings
    })
      .from(declinedRequests)
      .leftJoin(bookings, eq(declinedRequests.bookingId, bookings.id))
      .where(eq(declinedRequests.installerId, installerId))
      .orderBy(desc(declinedRequests.declinedAt));
    
    return declined.filter(item => item.booking !== null);
  }

  async removeDeclinedRequestForInstaller(installerId: number, bookingId: number): Promise<void> {
    await db.delete(declinedRequests)
      .where(
        and(
          eq(declinedRequests.installerId, installerId),
          eq(declinedRequests.bookingId, bookingId)
        )
      );
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

  async deleteScheduleNegotiation(negotiationId: number, userId: string, isInstaller: boolean = false): Promise<{ success: boolean; message: string }> {
    // Get the negotiation to verify ownership and check if it's deletable
    const [negotiation] = await db.select()
      .from(scheduleNegotiations)
      .where(eq(scheduleNegotiations.id, negotiationId));
    
    if (!negotiation) {
      return { success: false, message: "Negotiation not found" };
    }
    
    // Get all negotiations for this booking to find the most recent one
    const allNegotiations = await db.select()
      .from(scheduleNegotiations)
      .where(eq(scheduleNegotiations.bookingId, negotiation.bookingId))
      .orderBy(desc(scheduleNegotiations.createdAt));
    
    // Prevent deletion of the most recent negotiation
    if (allNegotiations.length > 0 && allNegotiations[0].id === negotiationId) {
      return { success: false, message: "Cannot delete the most recent message" };
    }
    
    // Verify user has permission to delete this negotiation
    // Only allow deletion if user is the one who created the negotiation OR if they're part of the booking
    if (isInstaller) {
      // For installers, check if they own this negotiation or if it's for their booking
      if (negotiation.installerId.toString() !== userId && negotiation.proposedBy !== 'installer') {
        return { success: false, message: "Not authorized to delete this negotiation" };
      }
    } else {
      // For customers, verify they're part of this booking
      const booking = await db.select()
        .from(bookings)
        .where(eq(bookings.id, negotiation.bookingId))
        .limit(1);
      
      if (booking.length === 0 || booking[0].userId !== userId) {
        return { success: false, message: "Not authorized to delete this negotiation" };
      }
    }
    
    // Delete the negotiation
    await db.delete(scheduleNegotiations)
      .where(eq(scheduleNegotiations.id, negotiationId));
    
    return { success: true, message: "Message deleted successfully" };
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
    const now = new Date();
    return await db.select()
      .from(resources)
      .where(and(
        eq(resources.isActive, true),
        or(
          isNull(resources.expiryDate),
          sql`${resources.expiryDate} > ${now}`
        )
      ))
      .orderBy(desc(resources.priority), desc(resources.createdAt));
  }

  async getFeaturedResources(): Promise<Resource[]> {
    const now = new Date();
    return await db.select()
      .from(resources)
      .where(and(
        eq(resources.isActive, true), 
        eq(resources.featured, true),
        or(
          isNull(resources.expiryDate),
          sql`${resources.expiryDate} > ${now}`
        )
      ))
      .orderBy(desc(resources.priority), desc(resources.createdAt));
  }

  async getResourcesByCategory(category: string): Promise<Resource[]> {
    const now = new Date();
    return await db.select()
      .from(resources)
      .where(and(
        eq(resources.isActive, true), 
        eq(resources.category, category),
        or(
          isNull(resources.expiryDate),
          sql`${resources.expiryDate} > ${now}`
        )
      ))
      .orderBy(desc(resources.priority), desc(resources.createdAt));
  }

  async getResourcesByBrand(brand: string): Promise<Resource[]> {
    const now = new Date();
    return await db.select()
      .from(resources)
      .where(and(
        eq(resources.isActive, true), 
        eq(resources.brand, brand),
        or(
          isNull(resources.expiryDate),
          sql`${resources.expiryDate} > ${now}`
        )
      ))
      .orderBy(desc(resources.priority), desc(resources.createdAt));
  }

  async checkAndCleanExpiredResources(): Promise<void> {
    const now = new Date();
    
    // Find all expired resources
    const expiredResources = await db.select()
      .from(resources)
      .where(and(
        eq(resources.isActive, true),
        db.sql`expiry_date <= ${now}`
      ));
    
    // Deactivate expired resources
    if (expiredResources.length > 0) {
      await db.update(resources)
        .set({ isActive: false })
        .where(and(
          eq(resources.isActive, true),
          db.sql`expiry_date <= ${now}`
        ));
      
      console.log(`🗑️  Deactivated ${expiredResources.length} expired resources`);
    }
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
  async createPasswordResetToken(userId: string | number, tokenHash: string, expiresAt: Date, userType: 'customer' | 'installer'): Promise<PasswordResetToken> {
    const [token] = await db.insert(passwordResetTokens).values({
      userId: typeof userId === 'string' ? parseInt(userId) : userId,
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

  async updateUserPassword(userId: string | number, newPasswordHash: string): Promise<void> {
    await db.update(users)
      .set({ 
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, typeof userId === 'number' ? userId.toString() : userId));
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

  async updateTvSetupBookingExpiry(id: number, expiryDate: Date): Promise<void> {
    await db.update(tvSetupBookings)
      .set({ 
        subscriptionExpiryDate: expiryDate,
        updatedAt: new Date()
      })
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

  async updateTvSetupBookingCredentialsPayment(id: number, status: string, paidAt?: string): Promise<void> {
    const updateData: any = { 
      credentialsPaymentStatus: status,
      updatedAt: new Date()
    };
    
    if (paidAt) {
      updateData.credentialsPaidAt = paidAt;
    }
    
    await db.update(tvSetupBookings)
      .set(updateData)
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

  // Product Categories for QR Code Flyers implementation
  async createProductCategory(category: InsertProductCategory): Promise<ProductCategory> {
    const [result] = await db.insert(productCategories).values(category).returning();
    return result;
  }

  async getProductCategory(id: number): Promise<ProductCategory | undefined> {
    const [result] = await db.select().from(productCategories).where(eq(productCategories.id, id));
    return result;
  }

  async getProductCategoryBySlug(slug: string): Promise<ProductCategory | undefined> {
    const [result] = await db.select().from(productCategories).where(eq(productCategories.slug, slug));
    return result;
  }

  async getProductCategoryByQrCodeId(qrCodeId: string): Promise<ProductCategory | undefined> {
    const [result] = await db.select().from(productCategories).where(eq(productCategories.qrCodeId, qrCodeId));
    return result;
  }

  async getAllProductCategories(): Promise<ProductCategory[]> {
    return await db.select().from(productCategories).orderBy(productCategories.displayOrder, desc(productCategories.createdAt));
  }

  async getActiveProductCategories(): Promise<ProductCategory[]> {
    return await db.select().from(productCategories)
      .where(eq(productCategories.isActive, true))
      .orderBy(productCategories.displayOrder, desc(productCategories.createdAt));
  }

  async updateProductCategory(id: number, updates: Partial<InsertProductCategory>): Promise<ProductCategory> {
    const [result] = await db.update(productCategories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(productCategories.id, id))
      .returning();
    return result;
  }

  async deleteProductCategory(id: number): Promise<boolean> {
    const result = await db.delete(productCategories).where(eq(productCategories.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async incrementCategoryScanCount(id: number): Promise<void> {
    await db.update(productCategories)
      .set({ totalScans: sql`${productCategories.totalScans} + 1` })
      .where(eq(productCategories.id, id));
  }

  async incrementCategoryRecommendationCount(id: number): Promise<void> {
    await db.update(productCategories)
      .set({ totalRecommendations: sql`${productCategories.totalRecommendations} + 1` })
      .where(eq(productCategories.id, id));
  }

  async incrementCategoryConversionCount(id: number): Promise<void> {
    await db.update(productCategories)
      .set({ totalConversions: sql`${productCategories.totalConversions} + 1` })
      .where(eq(productCategories.id, id));
  }

  // QR Code Scan Tracking implementation
  async createQrCodeScan(scan: InsertQrCodeScan): Promise<QrCodeScan> {
    const [result] = await db.insert(qrCodeScans).values(scan).returning();
    return result;
  }

  async getQrCodeScan(id: number): Promise<QrCodeScan | undefined> {
    const [result] = await db.select().from(qrCodeScans).where(eq(qrCodeScans.id, id));
    return result;
  }

  async getQrCodeScansByCategory(categoryId: number): Promise<QrCodeScan[]> {
    return await db.select().from(qrCodeScans)
      .where(eq(qrCodeScans.categoryId, categoryId))
      .orderBy(desc(qrCodeScans.scannedAt));
  }

  async getQrCodeScansBySession(sessionId: string): Promise<QrCodeScan[]> {
    return await db.select().from(qrCodeScans)
      .where(eq(qrCodeScans.sessionId, sessionId))
      .orderBy(desc(qrCodeScans.scannedAt));
  }

  async getCategoryScanStats(categoryId: number, days = 30): Promise<{ totalScans: number; uniqueUsers: number; dailyScans: Array<{date: string, count: number}> }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total scans and unique users
    const [stats] = await db
      .select({
        totalScans: sql<number>`COUNT(*)`,
        uniqueUsers: sql<number>`COUNT(DISTINCT ${qrCodeScans.userId})`
      })
      .from(qrCodeScans)
      .where(and(
        eq(qrCodeScans.categoryId, categoryId),
        sql`${qrCodeScans.scannedAt} >= ${startDate}`
      ));

    // Get daily scan counts
    const dailyScans = await db
      .select({
        date: sql<string>`DATE(${qrCodeScans.scannedAt})`,
        count: sql<number>`COUNT(*)`
      })
      .from(qrCodeScans)
      .where(and(
        eq(qrCodeScans.categoryId, categoryId),
        sql`${qrCodeScans.scannedAt} >= ${startDate}`
      ))
      .groupBy(sql`DATE(${qrCodeScans.scannedAt})`)
      .orderBy(sql`DATE(${qrCodeScans.scannedAt})`);

    return {
      totalScans: stats?.totalScans || 0,
      uniqueUsers: stats?.uniqueUsers || 0,
      dailyScans: dailyScans || []
    };
  }

  // AI Product Recommendations Tracking implementation
  async createAiProductRecommendation(recommendation: InsertAiProductRecommendation): Promise<AiProductRecommendation> {
    const [result] = await db.insert(aiProductRecommendations).values(recommendation).returning();
    return result;
  }

  async getAiProductRecommendation(id: number): Promise<AiProductRecommendation | undefined> {
    const [result] = await db.select().from(aiProductRecommendations).where(eq(aiProductRecommendations.id, id));
    return result;
  }

  async getRecommendationsByCategory(categoryId: number): Promise<AiProductRecommendation[]> {
    return await db.select().from(aiProductRecommendations)
      .where(eq(aiProductRecommendations.categoryId, categoryId))
      .orderBy(desc(aiProductRecommendations.createdAt));
  }

  async getRecommendationsBySession(sessionId: string): Promise<AiProductRecommendation[]> {
    return await db.select().from(aiProductRecommendations)
      .where(eq(aiProductRecommendations.sessionId, sessionId))
      .orderBy(desc(aiProductRecommendations.createdAt));
  }

  async updateRecommendationEngagement(id: number, engagement: string, selectedProduct?: string): Promise<void> {
    const updates: any = { userEngagement: engagement };
    if (selectedProduct) {
      updates.userSelectedProduct = selectedProduct;
    }
    
    await db.update(aiProductRecommendations)
      .set(updates)
      .where(eq(aiProductRecommendations.id, id));
  }

  async markRecommendationConverted(id: number, bookingId: number): Promise<void> {
    await db.update(aiProductRecommendations)
      .set({ 
        bookingCreated: true, 
        bookingId: bookingId,
        userEngagement: 'booking_initiated'
      })
      .where(eq(aiProductRecommendations.id, id));
  }

  async getCategoryRecommendationStats(categoryId: number, days = 30): Promise<{ totalRecommendations: number; conversions: number; engagementBreakdown: Record<string, number> }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total recommendations and conversions
    const [stats] = await db
      .select({
        totalRecommendations: sql<number>`COUNT(*)`,
        conversions: sql<number>`COUNT(CASE WHEN ${aiProductRecommendations.bookingCreated} = true THEN 1 END)`
      })
      .from(aiProductRecommendations)
      .where(and(
        eq(aiProductRecommendations.categoryId, categoryId),
        sql`${aiProductRecommendations.createdAt} >= ${startDate}`
      ));

    // Get engagement breakdown
    const engagementStats = await db
      .select({
        engagement: aiProductRecommendations.userEngagement,
        count: sql<number>`COUNT(*)`
      })
      .from(aiProductRecommendations)
      .where(and(
        eq(aiProductRecommendations.categoryId, categoryId),
        sql`${aiProductRecommendations.createdAt} >= ${startDate}`
      ))
      .groupBy(aiProductRecommendations.userEngagement);

    const engagementBreakdown: Record<string, number> = {};
    engagementStats.forEach(stat => {
      if (stat.engagement) {
        engagementBreakdown[stat.engagement] = stat.count;
      }
    });

    return {
      totalRecommendations: stats?.totalRecommendations || 0,
      conversions: stats?.conversions || 0,
      engagementBreakdown
    };
  }

  // Choice Flow Tracking implementation
  async createChoiceFlowTracking(flow: InsertChoiceFlowTracking): Promise<ChoiceFlowTracking> {
    const [result] = await db.insert(choiceFlowTracking).values(flow).returning();
    return result;
  }

  async getChoiceFlowTracking(id: number): Promise<ChoiceFlowTracking | undefined> {
    const [result] = await db.select().from(choiceFlowTracking).where(eq(choiceFlowTracking.id, id));
    return result;
  }

  async getChoiceFlowsByCategory(categoryId: number): Promise<ChoiceFlowTracking[]> {
    return await db.select().from(choiceFlowTracking)
      .where(eq(choiceFlowTracking.categoryId, categoryId))
      .orderBy(desc(choiceFlowTracking.createdAt));
  }

  async getChoiceFlowsBySession(sessionId: string): Promise<ChoiceFlowTracking[]> {
    return await db.select().from(choiceFlowTracking)
      .where(eq(choiceFlowTracking.sessionId, sessionId))
      .orderBy(desc(choiceFlowTracking.createdAt));
  }

  async updateChoiceFlowStep(id: number, currentStep: number, responses: Record<string, any>): Promise<void> {
    await db.update(choiceFlowTracking)
      .set({ 
        currentStep,
        questionResponses: responses,
        updatedAt: new Date()
      })
      .where(eq(choiceFlowTracking.id, id));
  }

  async completeChoiceFlow(id: number, timeSpentMinutes: number): Promise<void> {
    await db.update(choiceFlowTracking)
      .set({ 
        flowCompleted: true,
        completedAt: new Date(),
        timeSpentMinutes,
        updatedAt: new Date()
      })
      .where(eq(choiceFlowTracking.id, id));
  }

  async markChoiceFlowExit(id: number, exitStep: number, exitReason: string): Promise<void> {
    await db.update(choiceFlowTracking)
      .set({ 
        exitStep,
        exitReason,
        updatedAt: new Date()
      })
      .where(eq(choiceFlowTracking.id, id));
  }

  async getCategoryFlowStats(categoryId: number, days = 30): Promise<{ totalFlows: number; completionRate: number; avgTimeSpent: number; dropOffByStep: Record<number, number> }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total flows, completion rate, and average time spent
    const [stats] = await db
      .select({
        totalFlows: sql<number>`COUNT(*)`,
        completedFlows: sql<number>`COUNT(CASE WHEN ${choiceFlowTracking.flowCompleted} = true THEN 1 END)`,
        avgTimeSpent: sql<number>`AVG(CASE WHEN ${choiceFlowTracking.timeSpentMinutes} IS NOT NULL THEN ${choiceFlowTracking.timeSpentMinutes} END)`
      })
      .from(choiceFlowTracking)
      .where(and(
        eq(choiceFlowTracking.categoryId, categoryId),
        sql`${choiceFlowTracking.createdAt} >= ${startDate}`
      ));

    // Get drop-off by step
    const dropOffStats = await db
      .select({
        exitStep: choiceFlowTracking.exitStep,
        count: sql<number>`COUNT(*)`
      })
      .from(choiceFlowTracking)
      .where(and(
        eq(choiceFlowTracking.categoryId, categoryId),
        sql`${choiceFlowTracking.createdAt} >= ${startDate}`,
        sql`${choiceFlowTracking.exitStep} IS NOT NULL`
      ))
      .groupBy(choiceFlowTracking.exitStep);

    const dropOffByStep: Record<number, number> = {};
    dropOffStats.forEach(stat => {
      if (stat.exitStep !== null) {
        dropOffByStep[stat.exitStep] = stat.count;
      }
    });

    const totalFlows = stats?.totalFlows || 0;
    const completedFlows = stats?.completedFlows || 0;

    return {
      totalFlows,
      completionRate: totalFlows > 0 ? (completedFlows / totalFlows) * 100 : 0,
      avgTimeSpent: stats?.avgTimeSpent || 0,
      dropOffByStep
    };
  }

  // Tradesperson Onboarding operations implementation
  async createOnboardingInvitation(invitation: InsertOnboardingInvitation): Promise<OnboardingInvitation> {
    const token = nanoid(32);
    const baseUrl = process.env.DOMAIN || "https://tradesbook.ie";
    const invitationUrl = `${baseUrl}/onboarding/${token}`;
    
    const [created] = await db.insert(onboardingInvitations).values({
      ...invitation,
      invitationToken: token,
      invitationUrl: invitationUrl,
      status: 'sent',
      emailSent: false,
    }).returning();
    
    return created;
  }

  async getOnboardingInvitation(id: number): Promise<OnboardingInvitation | undefined> {
    const [invitation] = await db.select().from(onboardingInvitations).where(eq(onboardingInvitations.id, id));
    return invitation;
  }

  async getOnboardingInvitationByToken(token: string): Promise<OnboardingInvitation | undefined> {
    const [invitation] = await db.select().from(onboardingInvitations).where(eq(onboardingInvitations.invitationToken, token));
    return invitation;
  }

  async getAllOnboardingInvitations(): Promise<OnboardingInvitation[]> {
    return await db.select().from(onboardingInvitations).orderBy(desc(onboardingInvitations.createdAt));
  }

  async updateOnboardingInvitationStatus(id: number, status: string): Promise<void> {
    await db.update(onboardingInvitations)
      .set({ status, updatedAt: new Date() })
      .where(eq(onboardingInvitations.id, id));
  }

  async resendOnboardingInvitation(id: number): Promise<void> {
    await db.update(onboardingInvitations)
      .set({ emailSent: false, updatedAt: new Date() })
      .where(eq(onboardingInvitations.id, id));
  }

  async deleteOnboardingInvitation(id: number): Promise<void> {
    await db.delete(onboardingInvitations).where(eq(onboardingInvitations.id, id));
  }

  // Tradesperson Email Templates operations implementation
  async createTradesPersonEmailTemplate(template: InsertTradesPersonEmailTemplate): Promise<TradesPersonEmailTemplate> {
    const [created] = await db.insert(tradesPersonEmailTemplates).values(template).returning();
    return created;
  }

  async getTradesPersonEmailTemplate(id: number): Promise<TradesPersonEmailTemplate | undefined> {
    const [template] = await db.select().from(tradesPersonEmailTemplates).where(eq(tradesPersonEmailTemplates.id, id));
    return template;
  }

  async getTradesPersonEmailTemplatesBySkill(tradeSkill: string): Promise<TradesPersonEmailTemplate[]> {
    return await db.select().from(tradesPersonEmailTemplates)
      .where(and(
        eq(tradesPersonEmailTemplates.tradeSkill, tradeSkill),
        eq(tradesPersonEmailTemplates.isActive, true)
      ));
  }

  async getAllTradesPersonEmailTemplates(): Promise<TradesPersonEmailTemplate[]> {
    return await db.select().from(tradesPersonEmailTemplates).orderBy(desc(tradesPersonEmailTemplates.createdAt));
  }

  async updateTradesPersonEmailTemplate(id: number, updates: Partial<InsertTradesPersonEmailTemplate>): Promise<TradesPersonEmailTemplate> {
    const [updated] = await db.update(tradesPersonEmailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tradesPersonEmailTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteTradesPersonEmailTemplate(id: number): Promise<void> {
    await db.delete(tradesPersonEmailTemplates).where(eq(tradesPersonEmailTemplates.id, id));
  }

  // Lead fee exemption checking - VIP and promotion system integration
  async shouldInstallerPayLeadFee(installerId: number): Promise<boolean> {
    // Check if installer is VIP (VIP installers don't pay fees)
    const installer = await this.getInstaller(installerId);
    if (installer?.isVip) {
      return false;
    }

    // Check if free leads promotion is active
    const freeLeadsPromotion = await this.getPlatformSetting('free_leads_promotion_enabled');
    if (freeLeadsPromotion?.value === 'true') {
      return false;
    }

    // Check if first lead voucher system is active and installer has an unused voucher
    const firstLeadVoucherEnabled = await this.getPlatformSetting('first_lead_voucher_enabled');
    if (firstLeadVoucherEnabled?.value === 'true') {
      const isEligible = await this.checkVoucherEligibility(installerId);
      if (isEligible) {
        return false;
      }
    }

    // Default: installer should pay lead fee
    return true;
  }

  // Service Types and Metrics implementations
  async getAllServiceTypes(): Promise<SelectServiceType[]> {
    return await db.select().from(serviceTypes).orderBy(serviceTypes.name);
  }

  async getActiveServiceTypes(): Promise<SelectServiceType[]> {
    return await db
      .select()
      .from(serviceTypes)
      .where(eq(serviceTypes.isActive, true))
      .orderBy(serviceTypes.name);
  }

  async getServiceTypeByKey(key: string): Promise<SelectServiceType | undefined> {
    const [serviceType] = await db
      .select()
      .from(serviceTypes)
      .where(eq(serviceTypes.key, key));
    return serviceType;
  }

  async updateServiceTypeStatus(id: number, isActive: boolean): Promise<void> {
    await db
      .update(serviceTypes)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(serviceTypes.id, id));
  }

  async getServiceMetrics(): Promise<(SelectServiceMetrics & { serviceType: SelectServiceType })[]> {
    const results = await db
      .select({
        id: serviceMetrics.id,
        serviceTypeId: serviceMetrics.serviceTypeId,
        totalJobsCompleted: serviceMetrics.totalJobsCompleted,
        totalJobsAvailable: serviceMetrics.totalJobsAvailable,
        avgEarningsLow: serviceMetrics.avgEarningsLow,
        avgEarningsHigh: serviceMetrics.avgEarningsHigh,
        demandLevel: serviceMetrics.demandLevel,
        totalInstallers: serviceMetrics.totalInstallers,
        lastUpdated: serviceMetrics.lastUpdated,
        createdAt: serviceMetrics.createdAt,
        serviceType: {
          id: serviceTypes.id,
          key: serviceTypes.key,
          name: serviceTypes.name,
          description: serviceTypes.description,
          iconName: serviceTypes.iconName,
          colorScheme: serviceTypes.colorScheme,
          isActive: serviceTypes.isActive,
          setupTimeMinutes: serviceTypes.setupTimeMinutes,
          createdAt: serviceTypes.createdAt,
          updatedAt: serviceTypes.updatedAt,
        }
      })
      .from(serviceMetrics)
      .innerJoin(serviceTypes, eq(serviceMetrics.serviceTypeId, serviceTypes.id))
      .orderBy(serviceTypes.name);

    return results as (SelectServiceMetrics & { serviceType: SelectServiceType })[];
  }

  async getServiceMetricsByType(serviceTypeId: number): Promise<SelectServiceMetrics | undefined> {
    const [metrics] = await db
      .select()
      .from(serviceMetrics)
      .where(eq(serviceMetrics.serviceTypeId, serviceTypeId));
    return metrics;
  }

  async updateServiceMetrics(serviceTypeId: number, metrics: Partial<InsertServiceMetrics>): Promise<void> {
    await db
      .update(serviceMetrics)
      .set({ ...metrics, lastUpdated: new Date() })
      .where(eq(serviceMetrics.serviceTypeId, serviceTypeId));
  }

  async incrementJobsCompleted(serviceTypeKey: string): Promise<void> {
    const serviceType = await this.getServiceTypeByKey(serviceTypeKey);
    if (!serviceType) return;

    await db
      .update(serviceMetrics)
      .set({ 
        totalJobsCompleted: sql`${serviceMetrics.totalJobsCompleted} + 1`,
        lastUpdated: new Date() 
      })
      .where(eq(serviceMetrics.serviceTypeId, serviceType.id));
  }

  async updateJobsAvailable(serviceTypeKey: string, count: number): Promise<void> {
    const serviceType = await this.getServiceTypeByKey(serviceTypeKey);
    if (!serviceType) return;

    await db
      .update(serviceMetrics)
      .set({ 
        totalJobsAvailable: count,
        lastUpdated: new Date() 
      })
      .where(eq(serviceMetrics.serviceTypeId, serviceType.id));
  }

  async updateInstallerCount(serviceTypeKey: string, count: number): Promise<void> {
    const serviceType = await this.getServiceTypeByKey(serviceTypeKey);
    if (!serviceType) return;

    await db
      .update(serviceMetrics)
      .set({ 
        totalInstallers: count,
        lastUpdated: new Date() 
      })
      .where(eq(serviceMetrics.serviceTypeId, serviceType.id));
  }

  async recalculateEarningsRange(serviceTypeKey: string): Promise<void> {
    const serviceType = await this.getServiceTypeByKey(serviceTypeKey);
    if (!serviceType) return;

    // Get completed bookings for this service type to calculate real earnings
    const completedBookings = await db
      .select()
      .from(bookings)
      .where(and(
        eq(bookings.status, 'completed'),
        eq(bookings.serviceType, serviceTypeKey)
      ));

    if (completedBookings.length > 0) {
      const earnings = completedBookings.map(b => parseFloat(b.estimatedTotal || '0'));
      const minEarnings = Math.min(...earnings);
      const maxEarnings = Math.max(...earnings);

      await db
        .update(serviceMetrics)
        .set({ 
          avgEarningsLow: minEarnings.toString(),
          avgEarningsHigh: maxEarnings.toString(),
          lastUpdated: new Date() 
        })
        .where(eq(serviceMetrics.serviceTypeId, serviceType.id));
    }
  }

  // Installer Service Assignment operations
  async getAllInstallerServiceAssignments(): Promise<(InstallerServiceAssignment & { installer: Installer; serviceType: SelectServiceType })[]> {
    try {
      console.log('Step 1: Getting assignments...');
      const assignments = await db.select().from(installerServiceAssignments);
      console.log('Step 1 complete. Assignments found:', assignments.length);
      
      console.log('Step 2: Getting installers...');
      const allInstallers = await db.select().from(installers);
      console.log('Step 2 complete. Installers found:', allInstallers.length);
      
      console.log('Step 3: Getting service types...');
      const allServiceTypes = await db.select().from(serviceTypes);
      console.log('Step 3 complete. Service types found:', allServiceTypes.length);
      
      // Map assignments with their related data
      const result = assignments.map(assignment => {
        const installer = allInstallers.find(i => i.id === assignment.installerId);
        const serviceType = allServiceTypes.find(st => st.id === assignment.serviceTypeId);
        
        return {
          ...assignment,
          installer: installer!,
          serviceType: serviceType!
        };
      });
      
      console.log('Mapping complete. Returning', result.length, 'results');
      return result;
    } catch (error) {
      console.error('Error in getAllInstallerServiceAssignments:', error);
      throw error;
    }
  }

  async getInstallerServices(installerId: number): Promise<(InstallerServiceAssignment & { serviceType: SelectServiceType })[]> {
    const result = await db
      .select({
        assignment: installerServiceAssignments,
        serviceType: serviceTypes
      })
      .from(installerServiceAssignments)
      .leftJoin(serviceTypes, eq(installerServiceAssignments.serviceTypeId, serviceTypes.id))
      .where(eq(installerServiceAssignments.installerId, installerId));

    return result.map(row => ({
      ...row.assignment,
      serviceType: row.serviceType!
    }));
  }

  async assignServiceToInstaller(assignment: InsertInstallerServiceAssignment): Promise<InstallerServiceAssignment> {
    const [newAssignment] = await db
      .insert(installerServiceAssignments)
      .values(assignment)
      .returning();
    return newAssignment;
  }

  async removeServiceFromInstaller(installerId: number, serviceTypeId: number): Promise<void> {
    await db
      .delete(installerServiceAssignments)
      .where(and(
        eq(installerServiceAssignments.installerId, installerId),
        eq(installerServiceAssignments.serviceTypeId, serviceTypeId)
      ));
  }

  async getInstallerServiceAssignment(installerId: number, serviceTypeId: number): Promise<InstallerServiceAssignment | null> {
    const [assignment] = await db
      .select()
      .from(installerServiceAssignments)
      .where(and(
        eq(installerServiceAssignments.installerId, installerId),
        eq(installerServiceAssignments.serviceTypeId, serviceTypeId)
      ))
      .limit(1);
    
    return assignment || null;
  }

  // Performance refund settings operations
  async getPerformanceRefundSettings(): Promise<PerformanceRefundSettings[]> {
    return await db.select().from(performanceRefundSettings)
      .orderBy(performanceRefundSettings.starLevel);
  }

  async getPerformanceRefundSettingByStarLevel(starLevel: number): Promise<PerformanceRefundSettings | undefined> {
    const [setting] = await db.select().from(performanceRefundSettings)
      .where(eq(performanceRefundSettings.starLevel, starLevel));
    return setting;
  }

  async createPerformanceRefundSetting(setting: InsertPerformanceRefundSettings): Promise<PerformanceRefundSettings> {
    const [newSetting] = await db
      .insert(performanceRefundSettings)
      .values(setting)
      .returning();
    return newSetting;
  }

  async updatePerformanceRefundSetting(id: number, setting: Partial<InsertPerformanceRefundSettings>): Promise<PerformanceRefundSettings> {
    const [updatedSetting] = await db
      .update(performanceRefundSettings)
      .set(setting)
      .where(eq(performanceRefundSettings.id, id))
      .returning();
    return updatedSetting;
  }

  async deletePerformanceRefundSetting(id: number): Promise<boolean> {
    const result = await db
      .delete(performanceRefundSettings)
      .where(eq(performanceRefundSettings.id, id));
    return result.rowCount > 0;
  }

  // Review operations
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values(review)
      .returning();
    return newReview;
  }

  async getInstallerReviews(installerId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.installerId, installerId))
      .orderBy(desc(reviews.createdAt));
  }

  async getUserReviews(userId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async getAllReviews(): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .orderBy(desc(reviews.createdAt));
  }

  async getInstallerRating(installerId: number): Promise<{ averageRating: number; totalReviews: number }> {
    const installerReviews = await this.getInstallerReviews(installerId);
    const totalReviews = installerReviews.length;
    const averageRating = totalReviews > 0 
      ? installerReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;
    
    return { averageRating, totalReviews };
  }

  // Invoice-based user operations
  async getUserByRetailerInvoice(invoiceNumber: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.retailerInvoiceNumber, invoiceNumber))
      .limit(1);
    return user;
  }

  async getUserByRetailerInvoiceAndEmail(invoiceNumber: string, email: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(
        and(
          eq(users.retailerInvoiceNumber, invoiceNumber),
          eq(users.email, email.toLowerCase())
        )
      )
      .limit(1);
    return user;
  }

  async createRetailerInvoice(invoiceData: {
    invoiceNumber: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string | null;
    purchaseDate: Date;
    storeName?: string | null;
    storeCode?: string | null;
    retailerCode?: string | null;
    isUsedForRegistration?: boolean;
  }): Promise<any> {
    const [newInvoice] = await db.insert(retailerInvoices).values({
      invoiceNumber: invoiceData.invoiceNumber,
      customerEmail: invoiceData.customerEmail,
      customerName: invoiceData.customerName,
      customerPhone: invoiceData.customerPhone,
      purchaseDate: invoiceData.purchaseDate,
      storeName: invoiceData.storeName,
      storeCode: invoiceData.storeCode,
      retailerCode: invoiceData.retailerCode,
      isUsedForRegistration: invoiceData.isUsedForRegistration || false
    }).returning();
    return newInvoice;
  }

  // AI Tools management operations
  async getAllAiTools(): Promise<AiTool[]> {
    return await db.select().from(aiTools).orderBy(aiTools.name);
  }

  async getActiveAiTools(): Promise<AiTool[]> {
    return await db.select().from(aiTools).where(eq(aiTools.isActive, true)).orderBy(aiTools.name);
  }

  async getAiTool(id: number): Promise<AiTool | undefined> {
    const [tool] = await db.select().from(aiTools).where(eq(aiTools.id, id));
    return tool;
  }

  async getAiToolByKey(key: string): Promise<AiTool | undefined> {
    const [tool] = await db.select().from(aiTools).where(eq(aiTools.key, key));
    return tool;
  }

  async createAiTool(tool: InsertAiTool): Promise<AiTool> {
    const [newTool] = await db.insert(aiTools).values({
      key: tool.key,
      name: tool.name,
      description: tool.description,
      creditCost: tool.creditCost || 1,
      isActive: tool.isActive ?? true,
      iconName: tool.iconName || 'Zap',
      category: tool.category || 'general',
      endpoint: tool.endpoint
    }).returning();
    return newTool;
  }

  async updateAiTool(id: number, updates: Partial<InsertAiTool>): Promise<AiTool> {
    const [updatedTool] = await db.update(aiTools)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiTools.id, id))
      .returning();
    return updatedTool;
  }

  async deleteAiTool(id: number): Promise<void> {
    await db.delete(aiTools).where(eq(aiTools.id, id));
  }

  // Store QR Scan tracking functions
  async createStoreQrScan(storeQrScan: InsertStoreQrScan): Promise<StoreQrScan> {
    const [scan] = await db.insert(storeQrScans)
      .values(storeQrScan)
      .returning();
    return scan;
  }

  async updateAiToolStatus(id: number, isActive: boolean): Promise<void> {
    await db.update(aiTools)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(aiTools.id, id));
  }

  // AI Tool QR Code operations
  async createAiToolQrCode(qrCode: InsertAiToolQrCode): Promise<AiToolQrCode> {
    const [newQrCode] = await db.insert(aiToolQrCodes).values(qrCode).returning();
    return newQrCode;
  }

  async getAiToolQrCodes(toolId: number): Promise<AiToolQrCode[]> {
    return await db.select().from(aiToolQrCodes)
      .where(and(eq(aiToolQrCodes.toolId, toolId), eq(aiToolQrCodes.isActive, true)))
      .orderBy(desc(aiToolQrCodes.createdAt));
  }

  async getAiToolQrCodeById(id: number): Promise<AiToolQrCode | undefined> {
    const [qrCode] = await db.select().from(aiToolQrCodes).where(eq(aiToolQrCodes.id, id));
    return qrCode;
  }

  async getAiToolQrCodeByQrCodeId(qrCodeId: string): Promise<AiToolQrCode | undefined> {
    const [qrCode] = await db.select().from(aiToolQrCodes).where(eq(aiToolQrCodes.qrCodeId, qrCodeId));
    return qrCode;
  }

  async updateAiToolQrCode(id: number, updates: Partial<InsertAiToolQrCode>): Promise<AiToolQrCode> {
    const [updatedQrCode] = await db.update(aiToolQrCodes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiToolQrCodes.id, id))
      .returning();
    return updatedQrCode;
  }

  async deleteAiToolQrCode(id: number): Promise<void> {
    await db.delete(aiToolQrCodes).where(eq(aiToolQrCodes.id, id));
  }

  async incrementQrCodeScanCount(qrCodeId: string): Promise<void> {
    await db.update(aiToolQrCodes)
      .set({ 
        scanCount: sql`${aiToolQrCodes.scanCount} + 1`,
        lastScannedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(aiToolQrCodes.qrCodeId, qrCodeId));
  }

  async updateAiToolQrCodeScanData(id: number, updates: { scanCount: number; lastScannedAt: Date }): Promise<void> {
    await db.update(aiToolQrCodes)
      .set({ 
        scanCount: updates.scanCount,
        lastScannedAt: updates.lastScannedAt,
        updatedAt: new Date()
      })
      .where(eq(aiToolQrCodes.id, id));
  }

  // AI Interaction Analytics operations
  async createAiInteractionAnalytics(analytics: InsertAiInteractionAnalytics): Promise<AiInteractionAnalytics> {
    const [newAnalytics] = await db.insert(aiInteractionAnalytics).values(analytics).returning();
    return newAnalytics;
  }

  async getAiInteractionAnalytics(id: number): Promise<AiInteractionAnalytics | undefined> {
    const [analytics] = await db.select().from(aiInteractionAnalytics).where(eq(aiInteractionAnalytics.id, id));
    return analytics;
  }

  async getAnalyticsBySession(sessionId: string): Promise<AiInteractionAnalytics[]> {
    return await db.select()
      .from(aiInteractionAnalytics)
      .where(eq(aiInteractionAnalytics.sessionId, sessionId))
      .orderBy(desc(aiInteractionAnalytics.createdAt));
  }

  async getAnalyticsByStore(storeLocation: string, limit: number = 100): Promise<AiInteractionAnalytics[]> {
    return await db.select()
      .from(aiInteractionAnalytics)
      .where(eq(aiInteractionAnalytics.storeLocation, storeLocation))
      .orderBy(desc(aiInteractionAnalytics.createdAt))
      .limit(limit);
  }

  async getAnalyticsByTool(aiTool: string, limit: number = 100): Promise<AiInteractionAnalytics[]> {
    return await db.select()
      .from(aiInteractionAnalytics)
      .where(eq(aiInteractionAnalytics.aiTool, aiTool))
      .orderBy(desc(aiInteractionAnalytics.createdAt))
      .limit(limit);
  }

  async updateInteractionEngagement(sessionId: string, updates: {
    userSatisfaction?: number;
    followUpQuestions?: number;
    sessionDurationMinutes?: number;
    actionTaken?: string;
  }): Promise<void> {
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
  }
  
  // Installation photo progress operations
  async createInstallationPhotoProgress(progress: InsertInstallationPhotoProgress): Promise<InstallationPhotoProgress> {
    const [createdProgress] = await db.insert(installationPhotoProgress).values({
      ...progress,
      updatedAt: new Date()
    }).returning();
    return createdProgress;
  }

  async getInstallationPhotoProgress(bookingId: number, installerId: number, tvIndex: number): Promise<InstallationPhotoProgress | undefined> {
    const [progress] = await db.select().from(installationPhotoProgress)
      .where(and(
        eq(installationPhotoProgress.bookingId, bookingId),
        eq(installationPhotoProgress.installerId, installerId),
        eq(installationPhotoProgress.tvIndex, tvIndex)
      ));
    return progress;
  }

  async updateInstallationPhotoProgress(id: number, updates: Partial<InsertInstallationPhotoProgress>): Promise<InstallationPhotoProgress> {
    const [updatedProgress] = await db.update(installationPhotoProgress)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(installationPhotoProgress.id, id))
      .returning();
    return updatedProgress;
  }

  async deleteInstallationPhotoProgress(bookingId: number, installerId: number): Promise<void> {
    await db.delete(installationPhotoProgress)
      .where(and(
        eq(installationPhotoProgress.bookingId, bookingId),
        eq(installationPhotoProgress.installerId, installerId)
      ));
  }

  async getInstallationPhotoProgressByBooking(bookingId: number, installerId: number): Promise<InstallationPhotoProgress[]> {
    return await db.select().from(installationPhotoProgress)
      .where(and(
        eq(installationPhotoProgress.bookingId, bookingId),
        eq(installationPhotoProgress.installerId, installerId)
      ))
      .orderBy(installationPhotoProgress.tvIndex);
  }

  // Installer-specific resource operations (filtered by service type)
  async getResourcesByServiceTypes(serviceTypeIds: number[]): Promise<Resource[]> {
    if (serviceTypeIds.length === 0) return [];
    
    return await db
      .select()
      .from(resources)
      .where(or(
        inArray(resources.serviceTypeId, serviceTypeIds),
        isNull(resources.serviceTypeId) // Include general resources
      ))
      .orderBy(desc(resources.createdAt));
  }

  async getDownloadableGuidesByServiceTypes(serviceTypeIds: number[]): Promise<DownloadableGuide[]> {
    if (serviceTypeIds.length === 0) return [];
    
    return await db
      .select()
      .from(downloadableGuides)
      .where(and(
        eq(downloadableGuides.isActive, true),
        or(
          inArray(downloadableGuides.serviceTypeId, serviceTypeIds),
          isNull(downloadableGuides.serviceTypeId) // Include general guides
        )
      ))
      .orderBy(desc(downloadableGuides.createdAt));
  }

  async getVideoTutorialsByServiceTypes(serviceTypeIds: number[]): Promise<VideoTutorial[]> {
    if (serviceTypeIds.length === 0) return [];
    
    return await db
      .select()
      .from(videoTutorials)
      .where(and(
        eq(videoTutorials.isActive, true),
        or(
          inArray(videoTutorials.serviceTypeId, serviceTypeIds),
          isNull(videoTutorials.serviceTypeId) // Include general tutorials
        )
      ))
      .orderBy(desc(videoTutorials.createdAt));
  }

  async incrementGuideDownloadCount(guideId: number): Promise<void> {
    await db
      .update(downloadableGuides)
      .set({
        downloadCount: sql`${downloadableGuides.downloadCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(downloadableGuides.id, guideId));
  }

  async incrementVideoViewCount(videoId: number): Promise<void> {
    await db
      .update(videoTutorials)
      .set({
        viewCount: sql`${videoTutorials.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(videoTutorials.id, videoId));
  }
}

export const storage = new DatabaseStorage();
