import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for customers
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Installers table
export const installers = pgTable("installers", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  address: text("address"),
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
  
  // Status
  status: text("status").notNull().default("pending"), // pending, confirmed, assigned, in-progress, completed, cancelled
  
  // Notes
  customerNotes: text("customer_notes"),
  installerNotes: text("installer_notes"),
  
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const installersRelations = relations(installers, ({ many }) => ({
  bookings: many(bookings),
  feeStructures: many(feeStructures),
  jobAssignments: many(jobAssignments),
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
});

export const insertFeeStructureSchema = createInsertSchema(feeStructures).omit({
  id: true,
  createdAt: true,
});

export const insertJobAssignmentSchema = createInsertSchema(jobAssignments).omit({
  id: true,
  assignedDate: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Installer = typeof installers.$inferSelect;
export type InsertInstaller = z.infer<typeof insertInstallerSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type FeeStructure = typeof feeStructures.$inferSelect;
export type InsertFeeStructure = z.infer<typeof insertFeeStructureSchema>;

export type JobAssignment = typeof jobAssignments.$inferSelect;
export type InsertJobAssignment = z.infer<typeof insertJobAssignmentSchema>;
