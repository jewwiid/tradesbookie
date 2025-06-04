import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
  varchar
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for customers, installers, and admins
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("customer"), // customer, installer, admin
  createdAt: timestamp("created_at").defaultNow(),
});

// Service tiers with pricing
export const serviceTiers = pgTable("service_tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(), // table-top, bronze, silver, gold
  tvSizeMin: integer("tv_size_min"),
  tvSizeMax: integer("tv_size_max"),
  isActive: boolean("is_active").default(true),
});

// Fee structure for app monetization
export const feeStructure = pgTable("fee_structure", {
  id: serial("id").primaryKey(),
  serviceTierId: integer("service_tier_id").references(() => serviceTiers.id),
  feePercentage: decimal("fee_percentage", { precision: 5, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Add-on services
export const addOnServices = pgTable("add_on_services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => users.id),
  installerId: integer("installer_id").references(() => users.id),
  serviceTierId: integer("service_tier_id").references(() => serviceTiers.id),
  tvSize: integer("tv_size").notNull(),
  wallType: text("wall_type").notNull(),
  mountType: text("mount_type").notNull(),
  scheduledDate: timestamp("scheduled_date"),
  scheduledTime: text("scheduled_time"),
  address: text("address").notNull(),
  customerNotes: text("customer_notes"),
  roomPhotoUrl: text("room_photo_url"),
  aiPreviewUrl: text("ai_preview_url"),
  status: text("status").notNull().default("pending"), // pending, confirmed, assigned, in-progress, completed, cancelled
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  addOnTotal: decimal("add_on_total", { precision: 10, scale: 2 }).default("0"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  appFee: decimal("app_fee", { precision: 10, scale: 2 }).notNull(),
  qrCode: text("qr_code").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Booking add-ons junction table
export const bookingAddOns = pgTable("booking_add_ons", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id),
  addOnServiceId: integer("add_on_service_id").references(() => addOnServices.id),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

// Installer availability
export const installerAvailability = pgTable("installer_availability", {
  id: serial("id").primaryKey(),
  installerId: integer("installer_id").references(() => users.id),
  date: timestamp("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  isAvailable: boolean("is_available").default(true),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  bookingsAsCustomer: many(bookings, { relationName: "customerBookings" }),
  bookingsAsInstaller: many(bookings, { relationName: "installerBookings" }),
  availability: many(installerAvailability),
}));

export const serviceTiersRelations = relations(serviceTiers, ({ many, one }) => ({
  bookings: many(bookings),
  feeStructure: one(feeStructure),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  customer: one(users, {
    fields: [bookings.customerId],
    references: [users.id],
    relationName: "customerBookings",
  }),
  installer: one(users, {
    fields: [bookings.installerId],
    references: [users.id],
    relationName: "installerBookings",
  }),
  serviceTier: one(serviceTiers, {
    fields: [bookings.serviceTierId],
    references: [serviceTiers.id],
  }),
  addOns: many(bookingAddOns),
}));

export const bookingAddOnsRelations = relations(bookingAddOns, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingAddOns.bookingId],
    references: [bookings.id],
  }),
  addOnService: one(addOnServices, {
    fields: [bookingAddOns.addOnServiceId],
    references: [addOnServices.id],
  }),
}));

export const addOnServicesRelations = relations(addOnServices, ({ many }) => ({
  bookingAddOns: many(bookingAddOns),
}));

export const feeStructureRelations = relations(feeStructure, ({ one }) => ({
  serviceTier: one(serviceTiers, {
    fields: [feeStructure.serviceTierId],
    references: [serviceTiers.id],
  }),
}));

export const installerAvailabilityRelations = relations(installerAvailability, ({ one }) => ({
  installer: one(users, {
    fields: [installerAvailability.installerId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
  phone: true,
  role: true,
});

export const insertServiceTierSchema = createInsertSchema(serviceTiers).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  qrCode: true,
});

export const insertAddOnServiceSchema = createInsertSchema(addOnServices).omit({
  id: true,
});

export const insertBookingAddOnSchema = createInsertSchema(bookingAddOns).omit({
  id: true,
});

export const insertFeeStructureSchema = createInsertSchema(feeStructure).omit({
  id: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ServiceTier = typeof serviceTiers.$inferSelect;
export type InsertServiceTier = z.infer<typeof insertServiceTierSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type AddOnService = typeof addOnServices.$inferSelect;
export type InsertAddOnService = z.infer<typeof insertAddOnServiceSchema>;
export type BookingAddOn = typeof bookingAddOns.$inferSelect;
export type InsertBookingAddOn = z.infer<typeof insertBookingAddOnSchema>;
export type FeeStructure = typeof feeStructure.$inferSelect;
export type InsertFeeStructure = z.infer<typeof insertFeeStructureSchema>;
export type InstallerAvailability = typeof installerAvailability.$inferSelect;
