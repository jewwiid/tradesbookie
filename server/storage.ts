import {
  users,
  serviceTiers,
  addOnServices,
  bookings,
  bookingAddOns,
  feeStructure,
  installerAvailability,
  type User,
  type InsertUser,
  type ServiceTier,
  type InsertServiceTier,
  type Booking,
  type InsertBooking,
  type AddOnService,
  type InsertAddOnService,
  type BookingAddOn,
  type InsertBookingAddOn,
  type FeeStructure,
  type InsertFeeStructure,
  type InstallerAvailability,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Service tier operations
  getServiceTiers(): Promise<ServiceTier[]>;
  getServiceTiersByTVSize(tvSize: number): Promise<ServiceTier[]>;
  createServiceTier(serviceTier: InsertServiceTier): Promise<ServiceTier>;
  
  // Add-on service operations
  getAddOnServices(): Promise<AddOnService[]>;
  createAddOnService(addOn: InsertAddOnService): Promise<AddOnService>;
  
  // Booking operations
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingByQrCode(qrCode: string): Promise<Booking | undefined>;
  getBookingsByCustomer(customerId: number): Promise<Booking[]>;
  getBookingsByInstaller(installerId: number): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
  assignInstaller(bookingId: number, installerId: number): Promise<Booking | undefined>;
  
  // Booking add-on operations
  createBookingAddOn(bookingAddOn: InsertBookingAddOn): Promise<BookingAddOn>;
  getBookingAddOns(bookingId: number): Promise<BookingAddOn[]>;
  
  // Fee structure operations
  getFeeStructure(): Promise<FeeStructure[]>;
  getFeeStructureByServiceTier(serviceTierId: number): Promise<FeeStructure | undefined>;
  updateFeeStructure(feeStructure: InsertFeeStructure): Promise<FeeStructure>;
  
  // Statistics
  getBookingStats(): Promise<{
    totalBookings: number;
    monthlyBookings: number;
    revenue: number;
    appFees: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async getServiceTiers(): Promise<ServiceTier[]> {
    return await db.select().from(serviceTiers).where(eq(serviceTiers.isActive, true));
  }

  async getServiceTiersByTVSize(tvSize: number): Promise<ServiceTier[]> {
    return await db
      .select()
      .from(serviceTiers)
      .where(
        and(
          eq(serviceTiers.isActive, true),
          sql`(${serviceTiers.tvSizeMin} IS NULL OR ${serviceTiers.tvSizeMin} <= ${tvSize})`,
          sql`(${serviceTiers.tvSizeMax} IS NULL OR ${serviceTiers.tvSizeMax} >= ${tvSize})`
        )
      );
  }

  async createServiceTier(serviceTierData: InsertServiceTier): Promise<ServiceTier> {
    const [serviceTier] = await db.insert(serviceTiers).values(serviceTierData).returning();
    return serviceTier;
  }

  async getAddOnServices(): Promise<AddOnService[]> {
    return await db.select().from(addOnServices).where(eq(addOnServices.isActive, true));
  }

  async createAddOnService(addOnData: InsertAddOnService): Promise<AddOnService> {
    const [addOn] = await db.insert(addOnServices).values(addOnData).returning();
    return addOn;
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingByQrCode(qrCode: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.qrCode, qrCode));
    return booking;
  }

  async getBookingsByCustomer(customerId: number): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.customerId, customerId))
      .orderBy(desc(bookings.createdAt));
  }

  async getBookingsByInstaller(installerId: number): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.installerId, installerId))
      .orderBy(desc(bookings.createdAt));
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    // Generate QR code string
    const qrCode = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const [booking] = await db
      .insert(bookings)
      .values({ ...bookingData, qrCode })
      .returning();
    return booking;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async assignInstaller(bookingId: number, installerId: number): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ installerId, status: "assigned", updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))
      .returning();
    return booking;
  }

  async createBookingAddOn(bookingAddOnData: InsertBookingAddOn): Promise<BookingAddOn> {
    const [bookingAddOn] = await db
      .insert(bookingAddOns)
      .values(bookingAddOnData)
      .returning();
    return bookingAddOn;
  }

  async getBookingAddOns(bookingId: number): Promise<BookingAddOn[]> {
    return await db
      .select()
      .from(bookingAddOns)
      .where(eq(bookingAddOns.bookingId, bookingId));
  }

  async getFeeStructure(): Promise<FeeStructure[]> {
    return await db.select().from(feeStructure).where(eq(feeStructure.isActive, true));
  }

  async getFeeStructureByServiceTier(serviceTierId: number): Promise<FeeStructure | undefined> {
    const [fee] = await db
      .select()
      .from(feeStructure)
      .where(
        and(
          eq(feeStructure.serviceTierId, serviceTierId),
          eq(feeStructure.isActive, true)
        )
      );
    return fee;
  }

  async updateFeeStructure(feeData: InsertFeeStructure): Promise<FeeStructure> {
    const [fee] = await db
      .insert(feeStructure)
      .values({ ...feeData, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: feeStructure.serviceTierId,
        set: {
          feePercentage: feeData.feePercentage,
          updatedAt: new Date(),
        },
      })
      .returning();
    return fee;
  }

  async getBookingStats(): Promise<{
    totalBookings: number;
    monthlyBookings: number;
    revenue: number;
    appFees: number;
  }> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings);

    const [monthlyResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(sql`${bookings.createdAt} >= ${firstDayOfMonth}`);

    const [revenueResult] = await db
      .select({
        revenue: sql<number>`sum(${bookings.totalPrice})`,
        fees: sql<number>`sum(${bookings.appFee})`,
      })
      .from(bookings)
      .where(eq(bookings.status, "completed"));

    return {
      totalBookings: totalResult.count || 0,
      monthlyBookings: monthlyResult.count || 0,
      revenue: Number(revenueResult.revenue) || 0,
      appFees: Number(revenueResult.fees) || 0,
    };
  }
}

export const storage = new DatabaseStorage();
