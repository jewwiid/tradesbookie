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
  emailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("verification_token_expires"),
  
  // Harvey Norman invoice-based authentication
  harveyNormanInvoiceNumber: varchar("harvey_norman_invoice"),
  invoiceVerified: boolean("invoice_verified").default(false),
  registrationMethod: varchar("registration_method").default("oauth"), // oauth, invoice, guest
  
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

// Bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  installerId: integer("installer_id").references(() => installers.id),
  qrCode: text("qr_code").unique(),
  
  // Customer contact information
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email").notNull(),
  
  // Booking details
  tvSize: text("tv_size").notNull(),
  serviceType: text("service_type").notNull(),
  wallType: text("wall_type").notNull(),
  mountType: text("mount_type").notNull(),
  needsWallMount: boolean("needs_wall_mount").default(false),
  wallMountOption: text("wall_mount_option"), // Selected wall mount type if needed
  addons: jsonb("addons").default([]),
  
  // Scheduling
  preferredDate: timestamp("preferred_date"),
  preferredTime: text("preferred_time"),
  scheduledDate: timestamp("scheduled_date"),
  
  // Address
  address: text("address").notNull(),
  
  // Images
  roomPhotoUrl: text("room_photo_url"),
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
  subsidizedByInstaller: boolean("subsidized_by_installer").notNull().default(false), // If discount is paid by installer
  installerSubsidyAmount: decimal("installer_subsidy_amount", { precision: 8, scale: 2 }).default("0.00"), // Amount installer pays for discount
  status: text("status").notNull().default("pending"), // pending, completed, cancelled
  paidOut: boolean("paid_out").notNull().default(false),
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
  roomAnalysis: z.string().optional(),
  referralDiscount: z.string().optional(),
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

export const insertInstallerWalletSchema = createInsertSchema(installerWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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
