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
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("customer"), // customer, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Installers table
export const installers = pgTable("installers", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  address: text("address"),
  serviceArea: text("service_area").notNull().default("Dublin"),
  expertise: jsonb("expertise").default([]), // TV types and services
  bio: text("bio"), // Short description
  yearsExperience: integer("years_experience").default(0),
  profileImageUrl: text("profile_image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Fee structures for multi-tenant support
export const feeStructures = pgTable("fee_structures", {
  id: serial("id").primaryKey(),
  installerId: integer("installer_id").references(() => installers.id),
  serviceType: text("service_type").notNull(), // 'table-top-small', 'bronze', etc.
  feePercentage: decimal("fee_percentage", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  installerId: integer("installer_id").references(() => installers.id),
  qrCode: text("qr_code").unique(),
  
  // Booking details
  tvSize: text("tv_size").notNull(),
  serviceType: text("service_type").notNull(),
  wallType: text("wall_type").notNull(),
  mountType: text("mount_type").notNull(),
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
  
  // Pricing
  basePrice: decimal("base_price", { precision: 8, scale: 2 }).notNull(),
  addonsPrice: decimal("addons_price", { precision: 8, scale: 2 }).default("0"),
  totalPrice: decimal("total_price", { precision: 8, scale: 2 }).notNull(),
  appFee: decimal("app_fee", { precision: 8, scale: 2 }).notNull(),
  installerEarnings: decimal("installer_earnings", { precision: 8, scale: 2 }).notNull(),
  
  // Payment tracking
  paymentIntentId: text("payment_intent_id"),
  paymentStatus: text("payment_status").default("pending"), // pending, processing, succeeded, failed, canceled
  paidAmount: decimal("paid_amount", { precision: 8, scale: 2 }),
  paymentDate: timestamp("payment_date"),
  
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
  referralReward: decimal("referral_reward", { precision: 8, scale: 2 }).notNull().default("25.00"), // Amount in euros
  refereeDiscount: decimal("referee_discount", { precision: 5, scale: 2 }).notNull().default("10.00"), // Discount percentage
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const referralCodes = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  referralCode: text("referral_code").notNull().unique(),
  totalReferrals: integer("total_referrals").notNull().default(0),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).notNull().default("0.00"), // In euros
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const referralUsage = pgTable("referral_usage", {
  id: serial("id").primaryKey(),
  referralCodeId: integer("referral_code_id").notNull(),
  bookingId: integer("booking_id").notNull(),
  referrerUserId: text("referrer_user_id").notNull(),
  refereeUserId: text("referee_user_id"),
  discountAmount: decimal("discount_amount", { precision: 8, scale: 2 }).notNull(), // In euros
  rewardAmount: decimal("reward_amount", { precision: 8, scale: 2 }).notNull(), // In euros
  status: text("status").notNull().default("pending"), // pending, completed, cancelled
  paidOut: boolean("paid_out").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const installersRelations = relations(installers, ({ many }) => ({
  bookings: many(bookings),
  feeStructures: many(feeStructures),
  jobAssignments: many(jobAssignments),
  reviews: many(reviews),
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
}));

export const feeStructuresRelations = relations(feeStructures, ({ one }) => ({
  installer: one(installers, {
    fields: [feeStructures.installerId],
    references: [installers.id],
  }),
}));

export const jobAssignmentsRelations = relations(jobAssignments, ({ one }) => ({
  booking: one(bookings, {
    fields: [jobAssignments.bookingId],
    references: [bookings.id],
  }),
  installer: one(installers, {
    fields: [jobAssignments.installerId],
    references: [installers.id],
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

export const insertInstallerSchema = createInsertSchema(installers).omit({
  id: true,
  createdAt: true,
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
  basePrice: z.string(),
  totalPrice: z.string(), 
  appFee: z.string(),
  installerEarnings: z.string(),
});

export const insertFeeStructureSchema = createInsertSchema(feeStructures).omit({
  id: true,
  createdAt: true,
});

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

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Installer = typeof installers.$inferSelect;
export type InsertInstaller = z.infer<typeof insertInstallerSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type FeeStructure = typeof feeStructures.$inferSelect;
export type InsertFeeStructure = z.infer<typeof insertFeeStructureSchema>;

export type JobAssignment = typeof jobAssignments.$inferSelect;
export type InsertJobAssignment = z.infer<typeof insertJobAssignmentSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type SolarEnquiry = typeof solarEnquiries.$inferSelect;
export type InsertSolarEnquiry = z.infer<typeof insertSolarEnquirySchema>;

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
