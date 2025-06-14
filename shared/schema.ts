import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Businesses table (for multi-tenant support)
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  feePercentages: jsonb("fee_percentages").notNull().default('{}'), // Fee percentages per service type
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Installers table
export const installers = pgTable("installers", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  location: text("location"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalJobs: integer("total_jobs").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Service tiers table
export const serviceTiers = pgTable("service_tiers", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  minTvSize: integer("min_tv_size"),
  maxTvSize: integer("max_tv_size"),
  isActive: boolean("is_active").notNull().default(true),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingId: text("booking_id").notNull().unique(), // BK-2024-001 format
  userId: integer("user_id").references(() => users.id).notNull(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  installerId: integer("installer_id").references(() => installers.id),
  serviceTierId: integer("service_tier_id").references(() => serviceTiers.id).notNull(),
  
  // Booking details
  tvSize: integer("tv_size").notNull(),
  wallType: text("wall_type").notNull(),
  mountType: text("mount_type").notNull(),
  addons: jsonb("addons").notNull().default('[]'), // Array of addon objects
  
  // Scheduling
  scheduledDate: timestamp("scheduled_date").notNull(),
  timeSlot: text("time_slot").notNull(),
  
  // Pricing
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  addonTotal: decimal("addon_total", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  businessFee: decimal("business_fee", { precision: 10, scale: 2 }).notNull().default("0.00"),
  appFee: decimal("app_fee", { precision: 10, scale: 2 }).notNull().default("0.00"),
  
  // Images
  originalImageUrl: text("original_image_url"),
  aiPreviewImageUrl: text("ai_preview_image_url"),
  completedImageUrl: text("completed_image_url"),
  
  // Status
  status: text("status").notNull().default("pending"), // pending, confirmed, assigned, in_progress, completed, cancelled
  
  // Notes
  customerNotes: text("customer_notes"),
  installerNotes: text("installer_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// QR codes table for customer access
export const qrCodes = pgTable("qr_codes", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  qrCode: text("qr_code").notNull().unique(),
  accessToken: text("access_token").notNull().unique(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const businessesRelations = relations(businesses, ({ many }) => ({
  installers: many(installers),
  bookings: many(bookings),
}));

export const installersRelations = relations(installers, ({ one, many }) => ({
  business: one(businesses, {
    fields: [installers.businessId],
    references: [businesses.id],
  }),
  bookings: many(bookings),
}));

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  business: one(businesses, {
    fields: [bookings.businessId],
    references: [businesses.id],
  }),
  installer: one(installers, {
    fields: [bookings.installerId],
    references: [installers.id],
  }),
  serviceTier: one(serviceTiers, {
    fields: [bookings.serviceTierId],
    references: [serviceTiers.id],
  }),
  qrCode: one(qrCodes, {
    fields: [bookings.id],
    references: [qrCodes.bookingId],
  }),
}));

export const qrCodesRelations = relations(qrCodes, ({ one }) => ({
  booking: one(bookings, {
    fields: [qrCodes.bookingId],
    references: [bookings.id],
  }),
}));

export const serviceTiersRelations = relations(serviceTiers, ({ many }) => ({
  bookings: many(bookings),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
});

export const insertInstallerSchema = createInsertSchema(installers).omit({
  id: true,
  createdAt: true,
});

export const insertServiceTierSchema = createInsertSchema(serviceTiers).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  bookingId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQrCodeSchema = createInsertSchema(qrCodes).omit({
  id: true,
  createdAt: true,
});

// Select types
export type User = typeof users.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type Installer = typeof installers.$inferSelect;
export type ServiceTier = typeof serviceTiers.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type QrCode = typeof qrCodes.$inferSelect;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type InsertInstaller = z.infer<typeof insertInstallerSchema>;
export type InsertServiceTier = z.infer<typeof insertServiceTierSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertQrCode = z.infer<typeof insertQrCodeSchema>;

// Extended types for API responses
export type BookingWithDetails = Booking & {
  user: User;
  business: Business;
  installer?: Installer;
  serviceTier: ServiceTier;
  qrCode?: QrCode;
};
