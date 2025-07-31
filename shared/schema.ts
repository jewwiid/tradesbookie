import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => ({
    sessionExpireIdx: index("IDX_session_expire").on(table.expire),
  }),
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: integer("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("customer"), // customer, admin
  
  // Password-based authentication
  passwordHash: varchar("password_hash"), // For email/password authentication
  
  emailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("verification_token_expires"),
  
  // Harvey Norman invoice-based authentication
  harveyNormanInvoiceNumber: varchar("harvey_norman_invoice"),
  invoiceVerified: boolean("invoice_verified").default(false),
  registrationMethod: varchar("registration_method").default("oauth"), // oauth, invoice, guest, email
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Harvey Norman invoice lookup table for simplified customer login
export const harveyNormanInvoices = pgTable("harvey_norman_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number").unique().notNull(),
  customerEmail: varchar("customer_email").notNull(),
  customerName: varchar("customer_name").notNull(),
  customerPhone: varchar("customer_phone"),
  purchaseDate: timestamp("purchase_date").notNull(),
  tvModel: varchar("tv_model"),
  tvSize: varchar("tv_size"),
  purchaseAmount: decimal("purchase_amount", { precision: 8, scale: 2 }),
  storeName: varchar("store_name"),
  storeCode: varchar("store_code"),
  isUsedForRegistration: boolean("is_used_for_registration").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Installers table
export const installers = pgTable("installers", {
  id: serial("id").primaryKey(),
  
  // Authentication fields
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  
  // Basic business information
  businessName: text("business_name").notNull(),
  contactName: text("contact_name"),
  phone: text("phone"),
  address: text("address"),
  serviceArea: text("service_area").default("Dublin"),
  expertise: jsonb("expertise").default([]), // TV types and services
  bio: text("bio"), // Short description
  yearsExperience: integer("years_experience").default(0),
  profileImageUrl: text("profile_image_url"),
  isActive: boolean("is_active").default(true),
  isAvailable: boolean("is_available").default(false),
  
  // Profile completion tracking
  profileCompleted: boolean("profile_completed").default(false),
  
  // Approval and scoring system
  approvalStatus: varchar("approval_status").default("pending"), // pending, approved, rejected
  adminScore: integer("admin_score"), // 1-10 rating from admin review
  adminComments: text("admin_comments"), // Admin review notes
  reviewedBy: varchar("reviewed_by"), // Admin user ID who reviewed
  reviewedAt: timestamp("reviewed_at"), // When review was completed
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Removed: feeStructures table no longer needed in lead generation model

// Bookings table - updated for multi-TV support
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  installerId: integer("installer_id").references(() => installers.id),
  qrCode: text("qr_code").unique(),
  
  // Customer contact information
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email").notNull(),
  
  // Multi-TV booking details - stored as JSON array for flexibility
  tvInstallations: jsonb("tv_installations").notNull().default([]), // Array of TV installation objects
  
  // Legacy fields for backward compatibility (for single TV bookings)
  tvSize: text("tv_size"),
  serviceType: text("service_type"),
  wallType: text("wall_type"),
  mountType: text("mount_type"),
  needsWallMount: boolean("needs_wall_mount").default(false),
  wallMountOption: text("wall_mount_option"),
  addons: jsonb("addons").default([]),
  
  // Scheduling
  preferredDate: timestamp("preferred_date"),
  preferredTime: text("preferred_time"),
  scheduledDate: timestamp("scheduled_date"),
  
  // Address
  address: text("address").notNull(),
  
  // Images
  roomPhotoUrl: text("room_photo_url"),
  roomPhotoCompressedUrl: text("room_photo_compressed_url"), // Optimized version for bandwidth efficiency
  aiPreviewUrl: text("ai_preview_url"),
  completedPhotoUrl: text("completed_photo_url"),
  
  // Photo storage consent and analysis
  photoStorageConsent: boolean("photo_storage_consent").default(false),
  roomAnalysis: text("room_analysis"), // AI analysis text for installer reference
  
  // Pricing - for reference/estimation only (customer pays installer directly)
  estimatedPrice: decimal("estimated_price", { precision: 8, scale: 2 }).notNull(),
  estimatedAddonsPrice: decimal("estimated_addons_price", { precision: 8, scale: 2 }).default("0"),
  estimatedTotal: decimal("estimated_total", { precision: 8, scale: 2 }).notNull(),
  
  // Final price agreed between customer and installer
  agreedPrice: decimal("agreed_price", { precision: 8, scale: 2 }),
  priceNegotiated: boolean("price_negotiated").default(false),
  
  // Direct payment tracking (customer pays installer directly)
  paymentMethod: text("payment_method"), // cash, card, bank_transfer, etc.
  paidToInstaller: boolean("paid_to_installer").default(false),
  installerPaymentDate: timestamp("installer_payment_date"),
  
  // Status
  status: text("status").notNull().default("pending"), // pending, confirmed, assigned, in-progress, completed, cancelled
  
  // Notes
  customerNotes: text("customer_notes"),
  installerNotes: text("installer_notes"),
  
  // Referral system
  referralCode: text("referral_code"),
  referralDiscount: decimal("referral_discount", { precision: 8, scale: 2 }).default("0.00"),
  
  // Harvey Norman invoice tracking for invoice-authenticated bookings
  invoiceNumber: text("invoice_number"), // Harvey Norman invoice used for authentication
  invoiceSessionId: text("invoice_session_id"), // Unique session identifier for invoice login
  
  // Demo flag to hide test bookings from real installers
  isDemo: boolean("is_demo").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job assignments
export const jobAssignments = pgTable("job_assignments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id),
  installerId: integer("installer_id").references(() => installers.id),
  assignedDate: timestamp("assigned_date").defaultNow(),
  acceptedDate: timestamp("accepted_date"),
  completedDate: timestamp("completed_date"),
  status: text("status").notNull().default("assigned"), // assigned, accepted, completed, declined
  
  // New model: Installer pays platform for lead access
  leadFee: decimal("lead_fee", { precision: 8, scale: 2 }).notNull().default("15.00"), // Fee installer pays to secure job
  leadFeeStatus: text("lead_fee_status").default("pending"), // pending, paid, failed
  leadPaymentIntentId: text("lead_payment_intent_id"), // Stripe payment for lead access
  leadPaidDate: timestamp("lead_paid_date"),
});

// Lead pricing structure - what installers pay for different job types
export const leadPricing = pgTable("lead_pricing", {
  id: serial("id").primaryKey(),
  serviceType: text("service_type").notNull(), // 'table-top-small', 'bronze', etc.
  leadFee: decimal("lead_fee", { precision: 8, scale: 2 }).notNull(), // What installer pays to access this lead
  priority: integer("priority").default(0), // Higher priority = more expensive but better visibility
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wall Mount Pricing table for managing wall mount options and pricing
export const wallMountPricing = pgTable("wall_mount_pricing", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // e.g. "basic-fixed", "premium-tilting"
  name: text("name").notNull(), // e.g. "Basic Fixed Mount"
  description: text("description").notNull(),
  mountType: text("mount_type").notNull(), // "Fixed", "Tilting", "Full Motion"
  price: decimal("price", { precision: 8, scale: 2 }).notNull(), // Price in euros
  maxTvSize: integer("max_tv_size"), // Maximum TV size in inches, null for no limit
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0), // For ordering in UI
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schedule negotiations table for mutual agreement on installation dates/times
export const scheduleNegotiations = pgTable("schedule_negotiations", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  installerId: integer("installer_id").notNull().references(() => installers.id),
  
  // Proposed schedule details
  proposedDate: timestamp("proposed_date").notNull(),
  proposedTimeSlot: varchar("proposed_time_slot").notNull(), // 'morning', 'afternoon', 'evening', 'specific-time'
  proposedStartTime: varchar("proposed_start_time"), // e.g., '09:00', '14:30'
  proposedEndTime: varchar("proposed_end_time"), // e.g., '11:00', '16:30'
  
  // Who made this proposal
  proposedBy: varchar("proposed_by").notNull(), // 'customer' or 'installer'
  
  // Negotiation status
  status: varchar("status").notNull().default('pending'), // 'pending', 'accepted', 'rejected', 'counter_proposed'
  
  // Messages and notes
  proposalMessage: text("proposal_message"), // Optional message with the proposal
  responseMessage: text("response_message"), // Response message when accepting/rejecting
  
  // Timestamps
  proposedAt: timestamp("proposed_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Installer wallet/credits system
export const installerWallets = pgTable("installer_wallets", {
  id: serial("id").primaryKey(),
  installerId: integer("installer_id").references(() => installers.id).notNull(),
  balance: decimal("balance", { precision: 8, scale: 2 }).default("0.00"), // Current credit balance
  totalSpent: decimal("total_spent", { precision: 8, scale: 2 }).default("0.00"), // Total spent on leads
  totalEarned: decimal("total_earned", { precision: 8, scale: 2 }).default("0.00"), // Total earned from completed jobs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Installer transactions (credits, lead purchases, earnings)
export const installerTransactions = pgTable("installer_transactions", {
  id: serial("id").primaryKey(),
  installerId: integer("installer_id").references(() => installers.id).notNull(),
  type: text("type").notNull(), // 'credit_purchase', 'lead_purchase', 'job_earnings', 'refund'
  amount: decimal("amount", { precision: 8, scale: 2 }).notNull(),
  description: text("description").notNull(),
  jobAssignmentId: integer("job_assignment_id").references(() => jobAssignments.id), // If related to specific job
  paymentIntentId: text("payment_intent_id"), // Stripe payment ID
  status: text("status").default("completed"), // completed, pending, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  installerId: integer("installer_id").references(() => installers.id).notNull(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"),
  comment: text("comment"),
  isVerified: boolean("is_verified").default(true), // Only users who completed bookings can review
  createdAt: timestamp("created_at").defaultNow(),
});

// Solar enquiries table for OHK Energy partnership leads
export const solarEnquiries = pgTable("solar_enquiries", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  address: text("address").notNull(),
  county: varchar("county", { length: 50 }).notNull(),
  propertyType: varchar("property_type", { length: 50 }).notNull(),
  roofType: varchar("roof_type", { length: 50 }).notNull(),
  electricityBill: varchar("electricity_bill", { length: 50 }).notNull(),
  timeframe: varchar("timeframe", { length: 50 }).notNull(),
  grants: boolean("grants").default(false),
  additionalInfo: text("additional_info"),
  status: varchar("status", { length: 50 }).default("new"), // new, contacted, quoted, converted, closed
  referralCommission: decimal("referral_commission", { precision: 8, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const referralSettings = pgTable("referral_settings", {
  id: serial("id").primaryKey(),
  globalDiscountPercentage: decimal("global_discount_percentage", { precision: 5, scale: 2 }).notNull().default("10.00"), // Global discount percentage for all referral codes
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const referralCodes = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  userId: text("user_id"), // Nullable for sales staff codes
  referralCode: text("referral_code").notNull().unique(),
  referralType: text("referral_type").notNull().default("customer"), // "customer" or "sales_staff"
  salesStaffName: text("sales_staff_name"), // For Harvey Norman staff
  salesStaffStore: text("sales_staff_store"), // Store location
  totalReferrals: integer("total_referrals").notNull().default(0),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).notNull().default("0.00"), // In euros (subsidy amounts for staff codes)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const referralUsage = pgTable("referral_usage", {
  id: serial("id").primaryKey(),
  referralCodeId: integer("referral_code_id").notNull(),
  bookingId: integer("booking_id").notNull(),
  referrerUserId: text("referrer_user_id"), // Nullable for sales staff codes
  refereeUserId: text("referee_user_id"), // Customer who used the code
  discountAmount: decimal("discount_amount", { precision: 8, scale: 2 }).notNull(), // In euros
  rewardAmount: decimal("reward_amount", { precision: 8, scale: 2 }).notNull(), // In euros
  subsidizedByInstaller: boolean("subsidized_by_installer").notNull().default(false), // If discount is subsidized by installer
  createdAt: timestamp("created_at").defaultNow(),
});

// TV Setup Assistance bookings - Remote help with FreeView+, SaorView apps
export const tvSetupBookings = pgTable("tv_setup_bookings", {
  id: serial("id").primaryKey(),
  
  // Customer information
  name: text("name").notNull(),
  email: text("email").notNull(),
  mobile: text("mobile").notNull(),
  
  // TV details
  tvBrand: text("tv_brand").notNull(),
  tvModel: text("tv_model").notNull(),
  isSmartTv: text("is_smart_tv").notNull(), // yes, no, unknown
  tvOs: text("tv_os"), // Android TV, WebOS, Tizen, Roku, FireTV, Other (only required if smart TV)
  yearOfPurchase: integer("year_of_purchase").notNull(),
  
  // Available streaming apps (JSON array)
  streamingApps: jsonb("streaming_apps").notNull().default([]), // FreeView+, SaorView Player, Tivimate, Smart STB, Other
  
  // Scheduling
  preferredSetupDate: timestamp("preferred_setup_date"),
  additionalNotes: text("additional_notes"),
  
  // Payment details
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  paymentStatus: text("payment_status").default("pending"), // pending, completed, failed
  paymentAmount: decimal("payment_amount", { precision: 8, scale: 2 }).notNull().default("100.00"),
  
  // Setup status
  setupStatus: text("setup_status").default("pending"), // pending, scheduled, in_progress, completed, cancelled
  setupMethod: text("setup_method"), // remote, in_person
  
  // Admin tracking
  assignedTo: text("assigned_to"), // Admin/technician handling the setup
  completedAt: timestamp("completed_at"),
  adminNotes: text("admin_notes"),
  
  // Login credentials provided by admin
  appUsername: text("app_username"),
  appPassword: text("app_password"),
  credentialsProvided: boolean("credentials_provided").default(false),
  credentialsEmailSent: boolean("credentials_email_sent").default(false),
  credentialsSentAt: timestamp("credentials_sent_at"),
  
  // Email notifications tracking
  confirmationEmailSent: boolean("confirmation_email_sent").default(false),
  adminNotificationSent: boolean("admin_notification_sent").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pricing Configuration table for admin-managed pricing
export const pricingConfig = pgTable("pricing_config", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 50 }).notNull(), // 'service', 'addon', 'bracket'
  itemKey: varchar("item_key", { length: 100 }).notNull(), // service key or addon key
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  customerPrice: decimal("customer_price", { precision: 10, scale: 2 }).notNull(), // What customer pays
  leadFee: decimal("lead_fee", { precision: 10, scale: 2 }).notNull(), // What installer pays
  minTvSize: integer("min_tv_size"),
  maxTvSize: integer("max_tv_size"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Declined requests table to track which installers have declined which requests
export const declinedRequests = pgTable("declined_requests", {
  id: serial("id").primaryKey(),
  installerId: integer("installer_id").notNull().references(() => installers.id),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  declinedAt: timestamp("declined_at").defaultNow(),
});

// Lead Quality Tracking - Prevents false leads and manipulation
export const leadQualityTracking = pgTable("lead_quality_tracking", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id),
  installerId: integer("installer_id").references(() => installers.id),
  
  // Customer verification checks
  phoneVerified: boolean("phone_verified").default(false),
  phoneVerificationDate: timestamp("phone_verification_date"),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationDate: timestamp("email_verification_date"),
  
  // Customer responsiveness tracking
  initialContactMade: boolean("initial_contact_made").default(false),
  initialContactDate: timestamp("initial_contact_date"),
  customerResponded: boolean("customer_responded").default(false),
  customerResponseDate: timestamp("customer_response_date"),
  responseTimeHours: integer("response_time_hours"), // How long customer took to respond
  
  // Quality scoring
  qualityScore: integer("quality_score").default(0), // 0-100 quality rating
  riskLevel: text("risk_level").default("unknown"), // low, medium, high, verified
  
  // Fraud prevention flags
  suspiciousActivity: boolean("suspicious_activity").default(false),
  multipleBookingsSameDetails: boolean("multiple_bookings_same_details").default(false),
  rapidCancellation: boolean("rapid_cancellation").default(false),
  offPlatformNegotiation: boolean("off_platform_negotiation").default(false),
  
  // Installer behavior tracking
  installerContacted: boolean("installer_contacted").default(false),
  installerContactDate: timestamp("installer_contact_date"),
  installerResponseReceived: boolean("installer_response_received").default(false),
  installerGhosted: boolean("installer_ghosted").default(false),
  
  // Completion tracking
  meetingScheduled: boolean("meeting_scheduled").default(false),
  meetingCompleted: boolean("meeting_completed").default(false),
  jobCompleted: boolean("job_completed").default(false),
  
  // Admin review
  adminReviewed: boolean("admin_reviewed").default(false),
  adminNotes: text("admin_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer Verification System - Enhanced verification to prevent fake bookings
export const customerVerification = pgTable("customer_verification", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  bookingId: integer("booking_id").references(() => bookings.id),
  
  // Phone verification
  phoneNumber: text("phone_number").notNull(),
  phoneVerificationCode: text("phone_verification_code"),
  phoneVerified: boolean("phone_verified").default(false),
  phoneVerificationAttempts: integer("phone_verification_attempts").default(0),
  phoneVerificationDate: timestamp("phone_verification_date"),
  
  // Identity verification
  identityVerified: boolean("identity_verified").default(false),
  identityVerificationMethod: text("identity_verification_method"), // sms, email, invoice, manual
  
  // Risk assessment
  ipAddress: text("ip_address"),
  deviceFingerprint: text("device_fingerprint"),
  locationConsistent: boolean("location_consistent").default(true),
  historicalBookings: integer("historical_bookings").default(0),
  previousCancellations: integer("previous_cancellations").default(0),
  
  // Verification status
  verificationLevel: text("verification_level").default("basic"), // basic, standard, premium, verified
  trustScore: integer("trust_score").default(50), // 0-100 trust rating
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Anti-Manipulation System - Prevents off-platform negotiations and booking abuse
export const antiManipulation = pgTable("anti_manipulation", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id),
  installerId: integer("installer_id").references(() => installers.id),
  
  // Communication monitoring flags
  suspiciousContactPattern: boolean("suspicious_contact_pattern").default(false),
  rapidBookingCancellation: boolean("rapid_booking_cancellation").default(false),
  priceDiscrepancyReported: boolean("price_discrepancy_reported").default(false),
  offPlatformContactSuspected: boolean("off_platform_contact_suspected").default(false),
  
  // Behavioral analysis
  unusualTimeToContact: boolean("unusual_time_to_contact").default(false),
  suspiciousLocationChange: boolean("suspicious_location_change").default(false),
  multipleAccountsDetected: boolean("multiple_accounts_detected").default(false),
  
  // QR code abuse prevention
  qrCodeShared: boolean("qr_code_shared").default(false),
  qrCodeAccessedMultipleTimes: integer("qr_code_accessed_multiple_times").default(0),
  qrCodeAccessLocations: jsonb("qr_code_access_locations").default([]),
  
  // Customer-installer collusion detection
  suspiciousNegotiation: boolean("suspicious_negotiation").default(false),
  rapidStatusChanges: integer("rapid_status_changes").default(0),
  inconsistentPaymentMethod: boolean("inconsistent_payment_method").default(false),
  
  // Administrative actions
  flaggedForReview: boolean("flagged_for_review").default(false),
  adminActionTaken: text("admin_action_taken"),
  reviewNotes: text("review_notes"),
  resolved: boolean("resolved").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lead Refund System - Protects installers from false leads
export const leadRefunds = pgTable("lead_refunds", {
  id: serial("id").primaryKey(),
  installerId: integer("installer_id").references(() => installers.id),
  bookingId: integer("booking_id").references(() => bookings.id),
  originalLeadFee: decimal("original_lead_fee", { precision: 8, scale: 2 }).notNull(),
  
  // Refund reason
  refundReason: text("refund_reason").notNull(), // customer_unresponsive, fake_booking, customer_ghosted, technical_issue
  refundAmount: decimal("refund_amount", { precision: 8, scale: 2 }).notNull(),
  refundType: text("refund_type").default("credit"), // credit, stripe_refund, manual
  
  // Evidence and documentation
  evidenceProvided: text("evidence_provided"),
  installerNotes: text("installer_notes"),
  adminNotes: text("admin_notes"),
  communicationLogs: jsonb("communication_logs").default([]),
  
  // Processing
  requestedDate: timestamp("requested_date").defaultNow(),
  reviewedDate: timestamp("reviewed_date"),
  processedDate: timestamp("processed_date"),
  status: text("status").default("pending"), // pending, approved, denied, processed
  reviewedBy: text("reviewed_by"), // Admin who reviewed the refund
  
  // Fraud prevention
  automaticApproval: boolean("automatic_approval").default(false), // System automatically approved based on criteria
  fraudCheckPassed: boolean("fraud_check_passed").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const installersRelations = relations(installers, ({ one, many }) => ({
  bookings: many(bookings),
  jobAssignments: many(jobAssignments),
  reviews: many(reviews),
  wallet: one(installerWallets),
  transactions: many(installerTransactions),
  declinedRequests: many(declinedRequests),
  scheduleNegotiations: many(scheduleNegotiations),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  installer: one(installers, {
    fields: [bookings.installerId],
    references: [installers.id],
  }),
  jobAssignments: many(jobAssignments),
  declinedRequests: many(declinedRequests),
  scheduleNegotiations: many(scheduleNegotiations),
}));

// Removed: feeStructuresRelations no longer needed

export const jobAssignmentsRelations = relations(jobAssignments, ({ one, many }) => ({
  booking: one(bookings, {
    fields: [jobAssignments.bookingId],
    references: [bookings.id],
  }),
  installer: one(installers, {
    fields: [jobAssignments.installerId],
    references: [installers.id],
  }),
  transactions: many(installerTransactions),
}));

export const leadPricingRelations = relations(leadPricing, ({ one }) => ({
  // No direct relations yet, but could add service tier relations
}));

export const wallMountPricingRelations = relations(wallMountPricing, ({ one }) => ({
  // No direct relations needed currently
}));

export const scheduleNegotiationsRelations = relations(scheduleNegotiations, ({ one }) => ({
  booking: one(bookings, {
    fields: [scheduleNegotiations.bookingId],
    references: [bookings.id],
  }),
  installer: one(installers, {
    fields: [scheduleNegotiations.installerId],
    references: [installers.id],
  }),
}));

export const installerWalletsRelations = relations(installerWallets, ({ one, many }) => ({
  installer: one(installers, {
    fields: [installerWallets.installerId],
    references: [installers.id],
  }),
  transactions: many(installerTransactions),
}));

export const installerTransactionsRelations = relations(installerTransactions, ({ one }) => ({
  installer: one(installers, {
    fields: [installerTransactions.installerId],
    references: [installers.id],
  }),
  wallet: one(installerWallets, {
    fields: [installerTransactions.installerId],
    references: [installerWallets.installerId],
  }),
  jobAssignment: one(jobAssignments, {
    fields: [installerTransactions.jobAssignmentId],
    references: [jobAssignments.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  installer: one(installers, {
    fields: [reviews.installerId],
    references: [installers.id],
  }),
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
}));

export const declinedRequestsRelations = relations(declinedRequests, ({ one }) => ({
  installer: one(installers, {
    fields: [declinedRequests.installerId],
    references: [installers.id],
  }),
  booking: one(bookings, {
    fields: [declinedRequests.bookingId],
    references: [bookings.id],
  }),
}));

export const leadQualityTrackingRelations = relations(leadQualityTracking, ({ one }) => ({
  booking: one(bookings, {
    fields: [leadQualityTracking.bookingId],
    references: [bookings.id],
  }),
  installer: one(installers, {
    fields: [leadQualityTracking.installerId],
    references: [installers.id],
  }),
}));

export const customerVerificationRelations = relations(customerVerification, ({ one }) => ({
  user: one(users, {
    fields: [customerVerification.userId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [customerVerification.bookingId],
    references: [bookings.id],
  }),
}));

export const antiManipulationRelations = relations(antiManipulation, ({ one }) => ({
  booking: one(bookings, {
    fields: [antiManipulation.bookingId],
    references: [bookings.id],
  }),
  installer: one(installers, {
    fields: [antiManipulation.installerId],
    references: [installers.id],
  }),
}));

export const leadRefundsRelations = relations(leadRefunds, ({ one }) => ({
  installer: one(installers, {
    fields: [leadRefunds.installerId],
    references: [installers.id],
  }),
  booking: one(bookings, {
    fields: [leadRefunds.bookingId],
    references: [bookings.id],
  }),
}));

export const referralCodesRelations = relations(referralCodes, ({ one, many }) => ({
  user: one(users, {
    fields: [referralCodes.userId],
    references: [users.id],
  }),
  usages: many(referralUsage),
}));

export const referralUsageRelations = relations(referralUsage, ({ one }) => ({
  referralCode: one(referralCodes, {
    fields: [referralUsage.referralCodeId],
    references: [referralCodes.id],
  }),
  booking: one(bookings, {
    fields: [referralUsage.bookingId],
    references: [bookings.id],
  }),
  referrer: one(users, {
    fields: [referralUsage.referrerUserId],
    references: [users.id],
  }),
}));

// Resources/Blog system for customer resources
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(), // Main content/body
  type: text("type").notNull().default("guide"), // guide, warranty, promotion, cashback, tutorial
  category: text("category").notNull().default("general"), // warranty, promotions, tutorials, guides
  
  // Brand/Company information
  brand: text("brand"), // Sony, Samsung, LG, Harvey Norman, etc.
  companyName: text("company_name"), // For partner companies
  
  // Link information
  externalUrl: text("external_url"), // Link to external resource
  linkText: text("link_text").default("Learn More"), // Text for the link button
  
  // Visual elements
  imageUrl: text("image_url"), // Optional image for the resource
  iconType: text("icon_type").default("link"), // link, warranty, cashback, info
  
  // Metadata
  featured: boolean("featured").default(false), // Show in featured section
  priority: integer("priority").default(0), // For ordering (higher = more important)
  tags: jsonb("tags").default([]), // Array of tags for filtering
  
  // Status and visibility
  isActive: boolean("is_active").default(true),
  publishedAt: timestamp("published_at").defaultNow(),
  
  // Admin tracking
  createdBy: text("created_by"), // Admin user who created it
  lastModifiedBy: text("last_modified_by"), // Admin user who last modified it
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const resourcesRelations = relations(resources, ({ one }) => ({
  // No direct relations needed currently
}));

// Customer Resources Tables for downloadable guides and video tutorials
export const downloadableGuides = pgTable("downloadable_guides", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  fileType: text("file_type").notNull(), // PDF, DOC, etc.
  fileSize: text("file_size").notNull(), // e.g., "2.1 MB"
  fileUrl: text("file_url"), // URL to the actual file
  category: text("category").default("general"), // compatibility, speed, remote-control, etc.
  downloadCount: integer("download_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const videoTutorials = pgTable("video_tutorials", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  duration: text("duration").notNull(), // e.g., "4:32"
  videoUrl: text("video_url").notNull(), // YouTube, Vimeo, or direct URL
  thumbnailUrl: text("thumbnail_url"), // Optional custom thumbnail
  thumbnailEmoji: text("thumbnail_emoji").default("📺"), // Fallback emoji thumbnail
  level: text("level").notNull(), // Beginner, Intermediate, Advanced
  category: text("category").default("general"), // setup, troubleshooting, optimization, etc.
  viewCount: integer("view_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Platform settings for admin configuration
export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  key: text("key").unique().notNull(), // setting identifier like 'first_lead_voucher_enabled'
  value: text("value").notNull(), // JSON string for complex values, simple string for basic ones
  description: text("description"), // Human-readable description of the setting
  category: text("category").default("general"), // general, promotions, security, billing
  dataType: text("data_type").default("string"), // string, boolean, number, json
  isPublic: boolean("is_public").default(false), // Whether setting can be accessed by frontend
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// First lead voucher tracking to prevent exploitation
export const firstLeadVouchers = pgTable("first_lead_vouchers", {
  id: serial("id").primaryKey(),
  installerId: integer("installer_id").references(() => installers.id).notNull(),
  isUsed: boolean("is_used").default(false),
  usedForBookingId: integer("used_for_booking_id").references(() => bookings.id), // Which booking used the voucher
  voucherAmount: decimal("voucher_amount", { precision: 8, scale: 2 }).notNull(), // How much was waived
  originalLeadFee: decimal("original_lead_fee", { precision: 8, scale: 2 }).notNull(), // What they would have paid
  usedAt: timestamp("used_at"), // When the voucher was redeemed
  adminNotes: text("admin_notes"), // For tracking/audit purposes
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset tokens for secure password reset functionality
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // References users.id or installers.id depending on userType
  tokenHash: text("token_hash").notNull().unique(), // SHA-256 hash of the actual token
  userType: text("user_type").notNull(), // "customer" or "installer"
  expiresAt: timestamp("expires_at").notNull(), // Token expiration (1 hour from creation)
  used: boolean("used").default(false), // Whether token has been used
  usedAt: timestamp("used_at"), // When token was used
  createdAt: timestamp("created_at").defaultNow(),
});



export const platformSettingsRelations = relations(platformSettings, ({ one }) => ({
  // No direct relations needed currently
}));

export const firstLeadVouchersRelations = relations(firstLeadVouchers, ({ one, many }) => ({
  installer: one(installers, {
    fields: [firstLeadVouchers.installerId],
    references: [installers.id],
  }),
  booking: one(bookings, {
    fields: [firstLeadVouchers.usedForBookingId],
    references: [bookings.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  // No direct relations since userId can reference either users or installers based on userType
}));



// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertHarveyNormanInvoiceSchema = createInsertSchema(harveyNormanInvoices).omit({
  id: true,
  createdAt: true,
});

export const insertInstallerSchema = createInsertSchema(installers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: true, // Never expose password hash
});

// Installer authentication schemas
export const installerRegisterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const installerLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const installerProfileSchema = insertInstallerSchema.omit({
  email: true, // Email set during registration
  approvalStatus: true,
  adminScore: true,
  adminComments: true,
  reviewedBy: true,
  reviewedAt: true,
}).extend({
  businessName: z.string().min(2, "Business name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  serviceArea: z.string().min(2, "Service area is required"),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  qrCode: true,
}).extend({
  addons: z.array(z.object({
    key: z.string(),
    name: z.string(),
    price: z.number(),
  })).optional(),
  userId: z.string().optional(),
  preferredDate: z.date().optional(),
  estimatedPrice: z.string(),
  estimatedTotal: z.string(), 
  estimatedAddonsPrice: z.string().optional(),
  roomAnalysis: z.string().nullable().optional(),
  referralDiscount: z.union([z.string(), z.number()]).nullable().optional(),
});

// Removed: insertFeeStructureSchema no longer needed

export const insertJobAssignmentSchema = createInsertSchema(jobAssignments).omit({
  id: true,
  assignedDate: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertSolarEnquirySchema = createInsertSchema(solarEnquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadPricingSchema = createInsertSchema(leadPricing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWallMountPricingSchema = createInsertSchema(wallMountPricing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Downloadable Guides schemas
export const insertDownloadableGuideSchema = createInsertSchema(downloadableGuides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  downloadCount: true,
});

export const downloadableGuideFormSchema = insertDownloadableGuideSchema.extend({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.string().min(1, "File size is required"),
  category: z.string().optional(),
});

// Video Tutorials schemas
export const insertVideoTutorialSchema = createInsertSchema(videoTutorials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
});

export const videoTutorialFormSchema = insertVideoTutorialSchema.extend({
  title: z.string().min(1, "Title is required"),
  duration: z.string().min(1, "Duration is required"),
  videoUrl: z.string().url("Valid video URL is required"),
  level: z.enum(["Beginner", "Intermediate", "Advanced"], {
    required_error: "Level is required",
  }),
  category: z.string().optional(),
  thumbnailEmoji: z.string().optional(),
});

export const insertPlatformSettingsSchema = createInsertSchema(platformSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFirstLeadVoucherSchema = createInsertSchema(firstLeadVouchers).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export const insertAntiManipulationSchema = createInsertSchema(antiManipulation).omit({
  id: true,
  flaggedAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Installer = typeof installers.$inferSelect;
export type InsertInstaller = z.infer<typeof insertInstallerSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type DownloadableGuide = typeof downloadableGuides.$inferSelect;
export type InsertDownloadableGuide = z.infer<typeof insertDownloadableGuideSchema>;
export type DownloadableGuideFormData = z.infer<typeof downloadableGuideFormSchema>;
export type VideoTutorial = typeof videoTutorials.$inferSelect;
export type InsertVideoTutorial = z.infer<typeof insertVideoTutorialSchema>;
export type VideoTutorialFormData = z.infer<typeof videoTutorialFormSchema>;

export const insertInstallerWalletSchema = createInsertSchema(installerWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// TV Setup Assistance schemas
export const insertTvSetupBookingSchema = createInsertSchema(tvSetupBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  stripePaymentIntentId: true,
});

export const tvSetupBookingFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  mobile: z.string().min(10, "Valid mobile number is required"),
  tvBrand: z.string().min(1, "TV brand is required"),
  tvModel: z.string().min(2, "TV model is required"),
  isSmartTv: z.string().min(1, "Please specify if this is a Smart TV"),
  tvOs: z.string().optional(),
  yearOfPurchase: z.number().min(2015, "Year must be 2015 or later").max(new Date().getFullYear(), "Year cannot be in the future"),
  streamingApps: z.array(z.string()).min(1, "Please select at least one streaming app"),
  preferredSetupDate: z.date().optional(),
  additionalNotes: z.string().optional(),
}).refine((data) => {
  // If it's a smart TV, then TV OS is required
  if (data.isSmartTv === "yes" && (!data.tvOs || data.tvOs.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "TV Operating System is required for Smart TVs",
  path: ["tvOs"],
});

// TV Setup type exports
export type TvSetupBooking = typeof tvSetupBookings.$inferSelect;
export type InsertTvSetupBooking = z.infer<typeof insertTvSetupBookingSchema>;
export type TvSetupBookingForm = z.infer<typeof tvSetupBookingFormSchema>;

export const insertInstallerTransactionSchema = createInsertSchema(installerTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertPricingConfigSchema = createInsertSchema(pricingConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduleNegotiationSchema = createInsertSchema(scheduleNegotiations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  proposedAt: true,
  respondedAt: true,
}).extend({
  proposedDate: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type HarveyNormanInvoice = typeof harveyNormanInvoices.$inferSelect;
export type InsertHarveyNormanInvoice = z.infer<typeof insertHarveyNormanInvoiceSchema>;

export type Installer = typeof installers.$inferSelect;
export type InsertInstaller = z.infer<typeof insertInstallerSchema>;
export type InstallerRegister = z.infer<typeof installerRegisterSchema>;
export type InstallerLogin = z.infer<typeof installerLoginSchema>;
export type InstallerProfile = z.infer<typeof installerProfileSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

// Removed: FeeStructure types no longer needed

export type JobAssignment = typeof jobAssignments.$inferSelect;
export type InsertJobAssignment = z.infer<typeof insertJobAssignmentSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type SolarEnquiry = typeof solarEnquiries.$inferSelect;
export type InsertSolarEnquiry = z.infer<typeof insertSolarEnquirySchema>;

export type LeadPricing = typeof leadPricing.$inferSelect;
export type InsertLeadPricing = z.infer<typeof insertLeadPricingSchema>;

export type WallMountPricing = typeof wallMountPricing.$inferSelect;
export type InsertWallMountPricing = z.infer<typeof insertWallMountPricingSchema>;

export type ScheduleNegotiation = typeof scheduleNegotiations.$inferSelect;
export type InsertScheduleNegotiation = z.infer<typeof insertScheduleNegotiationSchema>;

export type InstallerWallet = typeof installerWallets.$inferSelect;
export type InsertInstallerWallet = z.infer<typeof insertInstallerWalletSchema>;

export type InstallerTransaction = typeof installerTransactions.$inferSelect;
export type InsertInstallerTransaction = z.infer<typeof insertInstallerTransactionSchema>;

export type PricingConfig = typeof pricingConfig.$inferSelect;
export type InsertPricingConfig = z.infer<typeof insertPricingConfigSchema>;

export const insertReferralSettingsSchema = createInsertSchema(referralSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferralUsageSchema = createInsertSchema(referralUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ReferralSettings = typeof referralSettings.$inferSelect;
export type InsertReferralSettings = z.infer<typeof insertReferralSettingsSchema>;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;
export type ReferralUsage = typeof referralUsage.$inferSelect;
export type InsertReferralUsage = z.infer<typeof insertReferralUsageSchema>;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// Password reset schemas
export const passwordResetRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  userType: z.enum(["customer", "installer"], { required_error: "User type is required" }),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password confirmation is required"),
  userType: z.enum(["customer", "installer"], { required_error: "User type is required" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirm = z.infer<typeof passwordResetConfirmSchema>;

// Harvey Norman Carrickmines consultation bookings
export const consultationBookings = pgTable("consultation_bookings", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  preferredDate: timestamp("preferred_date").notNull(),
  preferredTime: text("preferred_time").notNull(), // "morning", "afternoon", "evening"
  tvRecommendation: jsonb("tv_recommendation"), // Store the recommendation data
  customerPreferences: jsonb("customer_preferences"), // Store quiz answers
  specialRequests: text("special_requests"),
  status: text("status").default("pending"), // pending, confirmed, completed, cancelled
  installerId: integer("installer_id"), // Optional assigned installer
  confirmedDateTime: timestamp("confirmed_date_time"),
  storeLocation: text("store_location").default("Harvey Norman Carrickmines"),
  storeAddress: text("store_address").default("The Park, Carrickmines, Dublin 18, D18 R9P0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConsultationBookingSchema = createInsertSchema(consultationBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ConsultationBooking = typeof consultationBookings.$inferSelect;
export type InsertConsultationBooking = z.infer<typeof insertConsultationBookingSchema>;

// Email templates table for admin customization
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  templateKey: varchar("template_key", { length: 100 }).notNull().unique(), // e.g. "booking_confirmation", "installer_notification"
  templateName: varchar("template_name", { length: 255 }).notNull(), // Human-readable name
  fromEmail: varchar("from_email", { length: 255 }).notNull(), // Sender email address
  replyToEmail: varchar("reply_to_email", { length: 255 }), // Optional reply-to address
  subject: text("subject").notNull(), // Subject line with shortcode support
  htmlContent: text("html_content").notNull(), // HTML content with shortcode support
  textContent: text("text_content"), // Optional plain text version
  shortcodes: jsonb("shortcodes").default([]), // Available shortcodes for this template
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

// Banned users table for user management and security
export const bannedUsers = pgTable("banned_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  userType: varchar("user_type", { length: 50 }).notNull(), // customer, installer, admin
  bannedBy: integer("banned_by").notNull(), // Admin user ID who banned this user
  banReason: text("ban_reason").notNull(),
  banType: varchar("ban_type", { length: 50 }).notNull().default("permanent"), // permanent, temporary
  banExpiresAt: timestamp("ban_expires_at"), // For temporary bans
  originalUserId: integer("original_user_id"), // Reference to original user ID if available
  ipAddress: varchar("ip_address", { length: 45 }), // For IP-based blocking
  additionalInfo: jsonb("additional_info"), // Store any additional ban context
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBannedUserSchema = createInsertSchema(bannedUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type BannedUser = typeof bannedUsers.$inferSelect;
export type InsertBannedUser = z.infer<typeof insertBannedUserSchema>;

// Platform settings and voucher types
export type PlatformSettings = typeof platformSettings.$inferSelect;
export type InsertPlatformSettings = z.infer<typeof insertPlatformSettingsSchema>;
export type FirstLeadVoucher = typeof firstLeadVouchers.$inferSelect;
export type InsertFirstLeadVoucher = z.infer<typeof insertFirstLeadVoucherSchema>;
export type AntiManipulation = typeof antiManipulation.$inferSelect;
export type InsertAntiManipulation = z.infer<typeof insertAntiManipulationSchema>;
