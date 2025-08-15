import { pgTable, text, serial, integer, bigint, boolean, timestamp, decimal, jsonb, varchar, index } from "drizzle-orm/pg-core";
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
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"), // Phone number for customer contact
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("customer"), // customer, admin
  
  // Password-based authentication
  passwordHash: varchar("password_hash"), // For email/password authentication
  
  emailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("verification_token_expires"),
  
  // Retailer invoice-based authentication
  retailerInvoiceNumber: varchar("retailer_invoice"),
  invoiceVerified: boolean("invoice_verified").default(false),
  registrationMethod: varchar("registration_method").default("oauth"), // oauth, invoice, guest, email
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Retailer invoice lookup table for simplified customer login
export const retailerInvoices = pgTable("retailer_invoices", {
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
  retailerCode: varchar("retailer_code"),
  productDetails: text("product_details"),
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
  isPubliclyVisible: boolean("is_publicly_visible").default(true), // Controls public platform visibility
  
  // Profile completion tracking
  profileCompleted: boolean("profile_completed").default(false),
  
  // Approval and scoring system
  approvalStatus: varchar("approval_status").default("pending"), // pending, approved, rejected
  adminScore: integer("admin_score"), // 1-10 rating from admin review
  adminComments: text("admin_comments"), // Admin review notes
  reviewedBy: varchar("reviewed_by"), // Admin user ID who reviewed
  reviewedAt: timestamp("reviewed_at"), // When review was completed
  
  // VIP System
  isVip: boolean("is_vip").default(false), // VIP installers don't pay lead fees
  vipGrantedBy: varchar("vip_granted_by"), // Admin user ID who granted VIP status
  vipGrantedAt: timestamp("vip_granted_at"), // When VIP status was granted
  vipNotes: text("vip_notes"), // Admin notes about VIP status
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service Types and Real-time Metrics
export const serviceTypes = pgTable("service_types", {
  id: serial("id").primaryKey(),
  key: varchar("key").unique().notNull(), // 'tv-installation', 'home-security', etc.
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  iconName: varchar("icon_name").notNull(), // Lucide icon name
  colorScheme: jsonb("color_scheme").notNull(), // { color, bgColor, borderColor }
  isActive: boolean("is_active").default(false),
  setupTimeMinutes: integer("setup_time_minutes").default(5),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Real-time Service Metrics
export const serviceMetrics = pgTable("service_metrics", {
  id: serial("id").primaryKey(),
  serviceTypeId: integer("service_type_id").references(() => serviceTypes.id).notNull(),
  
  // Live metrics updated from actual bookings and installations
  totalJobsCompleted: integer("total_jobs_completed").default(0),
  totalJobsAvailable: integer("total_jobs_available").default(0), // Active bookings awaiting assignment
  avgEarningsLow: decimal("avg_earnings_low", { precision: 8, scale: 2 }).default("0"),
  avgEarningsHigh: decimal("avg_earnings_high", { precision: 8, scale: 2 }).default("0"),
  demandLevel: varchar("demand_level").default("medium"), // high, medium, low
  
  // Calculated metrics
  totalInstallers: integer("total_installers").default(0), // Number of installers offering this service
  
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
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
  completedPhotoUrl: text("completed_photo_url"), // Legacy single photo field
  completionPhotos: jsonb("completion_photos").default([]), // Array of completion photos for multi-TV installations
  
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
  
  // Store information from retailer detection
  purchaseStoreCode: varchar("purchase_store_code"), // Store where customer bought TV/product (CKM, DUB, etc.)
  purchaseStoreName: varchar("purchase_store_name"), // Full store name (Harvey Norman Carrickmines)
  retailerCode: varchar("retailer_code"), // HN, CR, DD, PC, AR, EX
  
  // Retailer invoice tracking for invoice-authenticated bookings
  invoiceNumber: text("invoice_number"), // Retailer invoice used for authentication
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
  salesStaffName: text("sales_staff_name"), // For retail partner staff
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
  bookingId: integer("booking_id"), // Regular booking ID (nullable for TV setup bookings)
  tvSetupBookingId: integer("tv_setup_booking_id"), // TV setup booking ID (nullable for regular bookings)
  bookingType: text("booking_type").notNull().default("regular"), // "regular" or "tv_setup"
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
  paymentAmount: decimal("payment_amount", { precision: 8, scale: 2 }).notNull().default("110.00"),
  originalAmount: decimal("original_amount", { precision: 8, scale: 2 }).notNull().default("110.00"),
  discountAmount: decimal("discount_amount", { precision: 8, scale: 2 }).notNull().default("0.00"),
  
  // Referral system integration
  referralCode: text("referral_code"),
  referralCodeId: integer("referral_code_id"),
  salesStaffName: text("sales_staff_name"),
  salesStaffStore: text("sales_staff_store"),
  
  // Setup status
  setupStatus: text("setup_status").default("pending"), // pending, mac_required, credentials_ready, payment_required, completed, cancelled
  setupMethod: text("setup_method"), // remote, in_person
  
  // Admin tracking
  assignedTo: text("assigned_to"), // Admin/technician handling the setup
  completedAt: timestamp("completed_at"),
  adminNotes: text("admin_notes"),
  
  // MAC Address collection (after booking confirmation)
  macAddress: text("mac_address"), // Customer provides MAC address for their TV/device
  macAddressProvided: boolean("mac_address_provided").default(false),
  macAddressProvidedAt: timestamp("mac_address_provided_at"),
  recommendedApp: text("recommended_app"), // App recommended by admin based on TV model
  appDownloadInstructions: text("app_download_instructions"), // Custom instructions from admin
  
  // IPTV/M3U Credentials (provided by admin after MAC address)
  serverHostname: text("server_hostname"), // e.g., http://536429.solanaflix.com:8080/
  serverUsername: text("server_username"), // e.g., TV-10105389
  serverPassword: text("server_password"), // e.g., 530090324041
  m3uUrl: text("m3u_url"), // Generated M3U URL for the customer
  numberOfDevices: integer("number_of_devices").default(1),
  subscriptionExpiryDate: timestamp("subscription_expiry_date"), // 1 year from activation
  
  // Alternative: Email account for M3U access
  fastmailEmail: text("fastmail_email"), // e.g., tvsetup1tradesbook@fastmail.com
  fastmailPassword: text("fastmail_password"),
  
  // Login credentials provided by admin
  appUsername: text("app_username"),
  appPassword: text("app_password"),
  credentialsProvided: boolean("credentials_provided").default(false),
  credentialsEmailSent: boolean("credentials_email_sent").default(false),
  credentialsSentAt: timestamp("credentials_sent_at"),
  credentialsType: text("credentials_type"), // 'iptv' or 'm3u_email'
  
  // Payment for accessing credentials (only after MAC address provided and credentials ready)
  credentialsPaymentRequired: boolean("credentials_payment_required").default(true),
  credentialsPaymentStatus: text("credentials_payment_status").default("pending"), // pending, paid, failed
  credentialsPaymentAmount: decimal("credentials_payment_amount", { precision: 8, scale: 2 }),
  credentialsStripeSessionId: text("credentials_stripe_session_id"),
  credentialsPaidAt: timestamp("credentials_paid_at"),
  
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



// Onboarding invitations for tradespeople
export const onboardingInvitations = pgTable("onboarding_invitations", {
  id: serial("id").primaryKey(),
  
  // Invited person details
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  businessName: varchar("business_name", { length: 200 }),
  county: varchar("county", { length: 50 }),
  tradeSkill: varchar("trade_skill", { length: 100 }).notNull(), // carpenter, electrician, plumber, joiner, painter, general_handyman, tv_specialist
  
  // Invitation details  
  invitationToken: varchar("invitation_token", { length: 100 }).notNull().unique(),
  invitationUrl: text("invitation_url").notNull(),
  emailTemplateUsed: varchar("email_template_used", { length: 100 }),
  
  // Status tracking
  status: varchar("status", { length: 50 }).default("sent"), // sent, opened, profile_started, profile_completed, approved, declined
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  emailOpenedAt: timestamp("email_opened_at"),
  profileStartedAt: timestamp("profile_started_at"),
  profileCompletedAt: timestamp("profile_completed_at"),
  
  // Created installer
  createdInstallerId: integer("created_installer_id").references(() => installers.id),
  
  // Admin tracking
  createdBy: varchar("created_by", { length: 100 }).notNull(), // Admin who sent invitation
  adminNotes: text("admin_notes"),
  
  expiresAt: timestamp("expires_at").notNull(), // 30 days from creation
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tradesperson email templates with skill-specific content
export const tradesPersonEmailTemplates = pgTable("trades_person_email_templates", {
  id: serial("id").primaryKey(),
  templateName: varchar("template_name", { length: 200 }).notNull(),
  tradeSkill: varchar("trade_skill", { length: 100 }).notNull(), // carpenter, electrician, plumber, etc.
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  
  // Template variables available: {{name}}, {{tradeSkill}}, {{invitationUrl}}, {{platformBenefits}}, {{estimatedEarnings}}
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by", { length: 100 }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Store Partner Applications - Stores wanting to join the platform
export const storePartnerApplications = pgTable("store_partner_applications", {
  id: serial("id").primaryKey(),
  
  // Store Information
  storeName: varchar("store_name", { length: 200 }).notNull(),
  businessName: varchar("business_name", { length: 200 }).notNull(),
  websiteUrl: varchar("website_url", { length: 500 }),
  
  // Contact Details
  contactName: varchar("contact_name", { length: 100 }).notNull(),
  contactEmail: varchar("contact_email", { length: 150 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 20 }),
  contactPosition: varchar("contact_position", { length: 100 }),
  
  // Business Details
  businessRegistrationNumber: varchar("business_registration_number", { length: 50 }),
  vatNumber: varchar("vat_number", { length: 50 }),
  yearsInBusiness: varchar("years_in_business", { length: 20 }),
  numberOfLocations: varchar("number_of_locations", { length: 10 }),
  primaryProducts: text("primary_products"),
  
  // Geographic Information
  headOfficeAddress: text("head_office_address"),
  serviceAreas: text("service_areas"),
  monthlyInvoiceVolume: varchar("monthly_invoice_volume", { length: 20 }),
  installationServicesOffered: boolean("installation_services_offered").default(false),
  currentInstallationPartners: text("current_installation_partners"),
  reasonForJoining: text("reason_for_joining"),
  
  // Technical Requirements
  invoiceFormat: varchar("invoice_format", { length: 100 }),
  sampleInvoiceNumber: varchar("sample_invoice_number", { length: 50 }),
  posSystemUsed: varchar("pos_system_used", { length: 100 }),
  canProvideInvoiceData: boolean("can_provide_invoice_data").default(false),
  
  // Application Status
  status: varchar("status", { length: 20 }).default("pending"),
  adminNotes: text("admin_notes"),
  reviewedBy: varchar("reviewed_by", { length: 100 }),
  reviewedAt: timestamp("reviewed_at"),
  
  // Source tracking
  submittedViaInvoice: varchar("submitted_via_invoice", { length: 50 }),
  referralSource: varchar("referral_source", { length: 100 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Installer Service Assignments - tracks which services each installer provides
export const installerServiceAssignments = pgTable("installer_service_assignments", {
  id: serial("id").primaryKey(),
  installerId: integer("installer_id").references(() => installers.id).notNull(),
  serviceTypeId: integer("service_type_id").references(() => serviceTypes.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: text("assigned_by"), // Admin who assigned the service
  isActive: boolean("is_active").default(true),
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
  serviceAssignments: many(installerServiceAssignments),
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
  expiryDate: timestamp("expiry_date"), // Optional expiry date for promotions
  
  // Admin tracking
  createdBy: text("created_by"), // Admin user who created it
  lastModifiedBy: text("last_modified_by"), // Admin user who last modified it
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Add relations for service tables
export const serviceTypesRelations = relations(serviceTypes, ({ one, many }) => ({
  metrics: one(serviceMetrics, {
    fields: [serviceTypes.id],
    references: [serviceMetrics.serviceTypeId],
  }),
  installerAssignments: many(installerServiceAssignments),
}));

export const serviceMetricsRelations = relations(serviceMetrics, ({ one }) => ({
  serviceType: one(serviceTypes, {
    fields: [serviceMetrics.serviceTypeId],
    references: [serviceTypes.id],
  }),
}));

export const installerServiceAssignmentsRelations = relations(installerServiceAssignments, ({ one }) => ({
  installer: one(installers, {
    fields: [installerServiceAssignments.installerId],
    references: [installers.id],
  }),
  serviceType: one(serviceTypes, {
    fields: [installerServiceAssignments.serviceTypeId],
    references: [serviceTypes.id],
  }),
}));

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

// Product Categories for QR Code Flyers - TV/Electronic product categories for in-store marketing
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Gaming TVs", "OLED TVs", "Budget TVs"
  slug: text("slug").notNull().unique(), // URL-friendly version for routing
  description: text("description").notNull(),
  
  // QR Code details
  qrCodeId: text("qr_code_id").notNull().unique(), // Unique identifier for QR tracking
  qrCodeUrl: text("qr_code_url").notNull(), // Generated QR code image URL
  
  // Category configuration for AI recommendations
  priceRange: jsonb("price_range").notNull().default({}), // {min: 500, max: 2000}
  preferredFeatures: jsonb("preferred_features").notNull().default([]), // ["gaming", "hdr", "4k"]
  targetUseCase: text("target_use_case").notNull(), // "gaming", "movies", "general", "budget"
  recommendedBrands: jsonb("recommended_brands").notNull().default([]), // ["Sony", "Samsung", "LG"]
  
  // Visual and marketing
  iconEmoji: text("icon_emoji").notNull().default("📺"), // Visual identifier for flyers
  backgroundColor: text("background_color").notNull().default("#f3f4f6"), // Flyer background color
  textColor: text("text_color").notNull().default("#000000"), // Flyer text color
  
  // Tracking and analytics
  totalScans: integer("total_scans").default(0),
  totalRecommendations: integer("total_recommendations").default(0),
  totalConversions: integer("total_conversions").default(0), // Users who completed the flow
  
  // Management
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0), // For ordering in admin
  createdBy: text("created_by"), // Admin who created it
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// QR Code Scans Tracking - Detailed analytics for each QR code scan
export const qrCodeScans = pgTable("qr_code_scans", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => productCategories.id).notNull(),
  
  // Session and user tracking
  sessionId: text("session_id").notNull(), // Unique session identifier
  userId: integer("user_id").references(() => users.id), // If user registers/logs in
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  // Location and source
  scanLocation: text("scan_location"), // Store location if provided
  referrerUrl: text("referrer_url"), // Where they came from
  deviceType: text("device_type"), // mobile, tablet, desktop
  
  // Timestamp
  scannedAt: timestamp("scanned_at").defaultNow(),
});

// AI Product Recommendations Tracking - Track each AI recommendation generated
export const aiProductRecommendations = pgTable("ai_product_recommendations", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => productCategories.id).notNull(),
  scanId: integer("scan_id").references(() => qrCodeScans.id),
  sessionId: text("session_id").notNull(),
  userId: integer("user_id").references(() => users.id), // If user is logged in
  
  // Recommendation details
  questionsAnswered: jsonb("questions_answered").notNull().default({}), // User's questionnaire responses
  recommendedProducts: jsonb("recommended_products").notNull().default([]), // AI-generated recommendations
  aiAnalysis: text("ai_analysis"), // AI reasoning for recommendations
  
  // User interaction
  userSelectedProduct: text("user_selected_product"), // Which product user was interested in
  userEngagement: text("user_engagement").default("viewed"), // viewed, interested, booking_initiated
  
  // Conversion tracking
  bookingCreated: boolean("booking_created").default(false),
  bookingId: integer("booking_id").references(() => bookings.id), // If user created booking
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Product Recommendation Choice Flow - Track user's journey through questionnaire
export const choiceFlowTracking = pgTable("choice_flow_tracking", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => productCategories.id).notNull(),
  scanId: integer("scan_id").references(() => qrCodeScans.id),
  sessionId: text("session_id").notNull(),
  
  // Flow progression
  currentStep: integer("current_step").default(1), // Which question they're on
  totalSteps: integer("total_steps").default(5), // Total questions in flow
  
  // Individual question responses
  questionResponses: jsonb("question_responses").notNull().default({}), // {step1: "answer", step2: "answer"}
  
  // Flow completion
  flowCompleted: boolean("flow_completed").default(false),
  completedAt: timestamp("completed_at"),
  timeSpentMinutes: integer("time_spent_minutes"), // Total time in flow
  
  // Exit tracking
  exitStep: integer("exit_step"), // Which step user left on
  exitReason: text("exit_reason"), // timeout, manual_exit, error, completion
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
  qrCodeScans: many(qrCodeScans),
  aiProductRecommendations: many(aiProductRecommendations),
  choiceFlowTracking: many(choiceFlowTracking),
}));

export const qrCodeScansRelations = relations(qrCodeScans, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [qrCodeScans.categoryId],
    references: [productCategories.id],
  }),
  user: one(users, {
    fields: [qrCodeScans.userId],
    references: [users.id],
  }),
  aiProductRecommendations: many(aiProductRecommendations),
  choiceFlowTracking: many(choiceFlowTracking),
}));

export const aiProductRecommendationsRelations = relations(aiProductRecommendations, ({ one }) => ({
  category: one(productCategories, {
    fields: [aiProductRecommendations.categoryId],
    references: [productCategories.id],
  }),
  scan: one(qrCodeScans, {
    fields: [aiProductRecommendations.scanId],
    references: [qrCodeScans.id],
  }),
  user: one(users, {
    fields: [aiProductRecommendations.userId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [aiProductRecommendations.bookingId],
    references: [bookings.id],
  }),
}));

export const choiceFlowTrackingRelations = relations(choiceFlowTracking, ({ one }) => ({
  category: one(productCategories, {
    fields: [choiceFlowTracking.categoryId],
    references: [productCategories.id],
  }),
  scan: one(qrCodeScans, {
    fields: [choiceFlowTracking.scanId],
    references: [qrCodeScans.id],
  }),
}));



// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertRetailerInvoiceSchema = createInsertSchema(retailerInvoices).omit({
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
  userId: z.union([z.string(), z.number()]).nullable().optional(),
  preferredDate: z.date().optional(),
  estimatedPrice: z.string(),
  estimatedTotal: z.string(), 
  estimatedAddonsPrice: z.string().optional(),
  roomAnalysis: z.string().nullable().optional(),
  referralDiscount: z.union([z.string(), z.number()]).nullable().optional(),
  // Multi-TV installations support
  tvInstallations: z.array(z.object({
    tvSize: z.string(),
    serviceType: z.string(),
    wallType: z.string(),
    mountType: z.string(),
    needsWallMount: z.boolean(),
    wallMountOption: z.string().optional(),
    location: z.string().optional(),
    addons: z.array(z.object({
      key: z.string(),
      name: z.string(),
      price: z.number(),
    })),
    estimatedPrice: z.number(),
    estimatedAddonsPrice: z.number(),
    estimatedTotal: z.number(),
  })).optional(),
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
  createdAt: true,
  updatedAt: true,
});

// Common type exports
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
  streamingApps: z.array(z.string()).default([]),
  preferredSetupDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  additionalNotes: z.string().optional(),
  referralCode: z.string().optional(),
  
  // Store information from retailer detection
  purchaseStoreCode: z.string().optional(),
  purchaseStoreName: z.string().optional(),
  retailerCode: z.string().optional(),
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

// Additional Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type Installer = typeof installers.$inferSelect;
export type InsertBooking = typeof insertBookingSchema._type;
export type InsertInstaller = typeof insertInstallerSchema._type;
export type RetailerInvoice = typeof retailerInvoices.$inferSelect;
export type InsertRetailerInvoice = z.infer<typeof insertRetailerInvoiceSchema>;

export type InstallerRegister = z.infer<typeof installerRegisterSchema>;
export type InstallerLogin = z.infer<typeof installerLoginSchema>;
export type InstallerProfile = z.infer<typeof installerProfileSchema>;

// Service Type Schemas
export const insertServiceTypeSchema = createInsertSchema(serviceTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceMetricsSchema = createInsertSchema(serviceMetrics).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export type InsertServiceType = z.infer<typeof insertServiceTypeSchema>;
export type SelectServiceType = typeof serviceTypes.$inferSelect;

export type InsertServiceMetrics = z.infer<typeof insertServiceMetricsSchema>;
export type SelectServiceMetrics = typeof serviceMetrics.$inferSelect;

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

// Product Categories and QR Code Tracking Schemas
export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  qrCodeUrl: true, // Generated automatically
  totalScans: true,
  totalRecommendations: true,
  totalConversions: true,
});

export const insertQrCodeScanSchema = createInsertSchema(qrCodeScans).omit({
  id: true,
  scannedAt: true,
});

export const insertAiProductRecommendationSchema = createInsertSchema(aiProductRecommendations).omit({
  id: true,
  createdAt: true,
});

export const insertChoiceFlowTrackingSchema = createInsertSchema(choiceFlowTracking).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Product Category form schema with validation
export const productCategoryFormSchema = insertProductCategorySchema.extend({
  name: z.string().min(1, "Category name is required"),
  slug: z.string().min(1, "URL slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  targetUseCase: z.string().min(1, "Target use case is required"),
  priceRange: z.object({
    min: z.number().min(0, "Minimum price must be positive"),
    max: z.number().min(0, "Maximum price must be positive"),
  }).refine(data => data.max > data.min, {
    message: "Maximum price must be greater than minimum price",
  }),
  preferredFeatures: z.array(z.string()).default([]),
  recommendedBrands: z.array(z.string()).default([]),
});

// Type exports for new tables
export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;
export type ProductCategoryFormData = z.infer<typeof productCategoryFormSchema>;

export type QrCodeScan = typeof qrCodeScans.$inferSelect;
export type InsertQrCodeScan = z.infer<typeof insertQrCodeScanSchema>;

export type AiProductRecommendation = typeof aiProductRecommendations.$inferSelect;
export type InsertAiProductRecommendation = z.infer<typeof insertAiProductRecommendationSchema>;

export type ChoiceFlowTracking = typeof choiceFlowTracking.$inferSelect;
export type InsertChoiceFlowTracking = z.infer<typeof insertChoiceFlowTrackingSchema>;

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

// Consultations table for booking meetings with support
export const consultations = pgTable("consultations", {
  id: serial("id").primaryKey(),
  
  // Customer information
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  
  // Consultation details
  consultationType: text("consultation_type").notNull(), // "technical-support", "tv-recommendation", "installation-planning", "general-inquiry"
  preferredDate: timestamp("preferred_date"),
  preferredTime: text("preferred_time"), // "morning", "afternoon", "evening"
  preferredContactMethod: text("preferred_contact_method").notNull(), // "phone", "email", "video-call"
  
  // Subject and message
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  
  // Additional context
  urgency: text("urgency").default("normal"), // "low", "normal", "high", "urgent"
  existingCustomer: boolean("existing_customer").default(false),
  
  // Status tracking
  status: text("status").default("pending"), // "pending", "scheduled", "completed", "cancelled"
  adminNotes: text("admin_notes"),
  scheduledDateTime: timestamp("scheduled_date_time"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConsultationSchema = createInsertSchema(consultations).omit({
  id: true,
  status: true,
  adminNotes: true,
  scheduledDateTime: true,
  createdAt: true,
  updatedAt: true,
});

export type Consultation = typeof consultations.$inferSelect;
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;

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

// AI FAQ answers table for caching Q&A responses
export const faqAnswers = pgTable("faq_answers", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  questionHash: text("question_hash").unique().notNull(), // For faster lookups
  useCount: integer("use_count").default(1), // Track how often this Q&A is used
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFaqAnswerSchema = createInsertSchema(faqAnswers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Onboarding Invitations Schema
export const insertOnboardingInvitationSchema = createInsertSchema(onboardingInvitations).omit({
  id: true,
  invitationToken: true,
  invitationUrl: true,
  createdInstallerId: true,
  createdAt: true,
  updatedAt: true,
});

// Tradesperson Email Templates Schema
export const insertTradesPersonEmailTemplateSchema = createInsertSchema(tradesPersonEmailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Installer Service Assignments Schema
export const insertInstallerServiceAssignmentSchema = createInsertSchema(installerServiceAssignments).omit({
  id: true,
  assignedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type BannedUser = typeof bannedUsers.$inferSelect;
export type FaqAnswer = typeof faqAnswers.$inferSelect;
export type InsertFaqAnswer = z.infer<typeof insertFaqAnswerSchema>;
export type InsertBannedUser = z.infer<typeof insertBannedUserSchema>;

// Onboarding types
export type OnboardingInvitation = typeof onboardingInvitations.$inferSelect;
export type TradesPersonEmailTemplate = typeof tradesPersonEmailTemplates.$inferSelect;
export type InsertOnboardingInvitation = z.infer<typeof insertOnboardingInvitationSchema>;
export type InsertTradesPersonEmailTemplate = z.infer<typeof insertTradesPersonEmailTemplateSchema>;

// Service assignment types
export type InstallerServiceAssignment = typeof installerServiceAssignments.$inferSelect;
export type InsertInstallerServiceAssignment = z.infer<typeof insertInstallerServiceAssignmentSchema>;

// Platform settings and voucher types
export type PlatformSettings = typeof platformSettings.$inferSelect;
export type InsertPlatformSettings = z.infer<typeof insertPlatformSettingsSchema>;
export type FirstLeadVoucher = typeof firstLeadVouchers.$inferSelect;
export type InsertFirstLeadVoucher = z.infer<typeof insertFirstLeadVoucherSchema>;
export type AntiManipulation = typeof antiManipulation.$inferSelect;
export type InsertAntiManipulation = z.infer<typeof insertAntiManipulationSchema>;
