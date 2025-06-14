import { 
  users, 
  businesses,
  installers,
  serviceTiers,
  bookings,
  qrCodes,
  type User, 
  type Business,
  type Installer,
  type ServiceTier,
  type Booking,
  type QrCode,
  type BookingWithDetails,
  type InsertUser,
  type InsertBusiness,
  type InsertInstaller,
  type InsertServiceTier,
  type InsertBooking,
  type InsertQrCode
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Business operations
  getBusiness(id: number): Promise<Business | undefined>;
  getBusinesses(): Promise<Business[]>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusinessFees(id: number, feePercentages: Record<string, number>): Promise<Business | undefined>;

  // Installer operations
  getInstaller(id: number): Promise<Installer | undefined>;
  getInstallersByBusiness(businessId: number): Promise<Installer[]>;
  createInstaller(installer: InsertInstaller): Promise<Installer>;
  updateInstallerStats(id: number, totalJobs: number, rating: number): Promise<Installer | undefined>;

  // Service tier operations
  getServiceTiers(): Promise<ServiceTier[]>;
  getServiceTier(id: number): Promise<ServiceTier | undefined>;
  getServiceTierByKey(key: string): Promise<ServiceTier | undefined>;
  createServiceTier(serviceTier: InsertServiceTier): Promise<ServiceTier>;

  // Booking operations
  getBooking(id: number): Promise<BookingWithDetails | undefined>;
  getBookingByBookingId(bookingId: string): Promise<BookingWithDetails | undefined>;
  getBookingsByUser(userId: number): Promise<BookingWithDetails[]>;
  getBookingsByBusiness(businessId: number): Promise<BookingWithDetails[]>;
  getBookingsByInstaller(installerId: number): Promise<BookingWithDetails[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
  updateBookingInstaller(id: number, installerId: number): Promise<Booking | undefined>;

  // QR Code operations
  getQrCodeByToken(accessToken: string): Promise<QrCode | undefined>;
  createQrCode(qrCode: InsertQrCode): Promise<QrCode>;

  // Statistics
  getBusinessStats(businessId: number): Promise<{
    totalBookings: number;
    monthlyBookings: number;
    revenue: number;
    appFees: number;
  }>;
  getInstallerStats(installerId: number): Promise<{
    monthlyJobs: number;
    earnings: number;
    rating: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Business operations
  async getBusiness(id: number): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business;
  }

  async getBusinesses(): Promise<Business[]> {
    return await db.select().from(businesses).where(eq(businesses.isActive, true));
  }

  async createBusiness(insertBusiness: InsertBusiness): Promise<Business> {
    const [business] = await db.insert(businesses).values(insertBusiness).returning();
    return business;
  }

  async updateBusinessFees(id: number, feePercentages: Record<string, number>): Promise<Business | undefined> {
    const [business] = await db
      .update(businesses)
      .set({ feePercentages })
      .where(eq(businesses.id, id))
      .returning();
    return business;
  }

  // Installer operations
  async getInstaller(id: number): Promise<Installer | undefined> {
    const [installer] = await db.select().from(installers).where(eq(installers.id, id));
    return installer;
  }

  async getInstallersByBusiness(businessId: number): Promise<Installer[]> {
    return await db
      .select()
      .from(installers)
      .where(and(eq(installers.businessId, businessId), eq(installers.isActive, true)));
  }

  async createInstaller(insertInstaller: InsertInstaller): Promise<Installer> {
    const [installer] = await db.insert(installers).values(insertInstaller).returning();
    return installer;
  }

  async updateInstallerStats(id: number, totalJobs: number, rating: number): Promise<Installer | undefined> {
    const [installer] = await db
      .update(installers)
      .set({ totalJobs, rating: rating.toString() })
      .where(eq(installers.id, id))
      .returning();
    return installer;
  }

  // Service tier operations
  async getServiceTiers(): Promise<ServiceTier[]> {
    return await db.select().from(serviceTiers).where(eq(serviceTiers.isActive, true));
  }

  async getServiceTier(id: number): Promise<ServiceTier | undefined> {
    const [serviceTier] = await db.select().from(serviceTiers).where(eq(serviceTiers.id, id));
    return serviceTier;
  }

  async getServiceTierByKey(key: string): Promise<ServiceTier | undefined> {
    const [serviceTier] = await db.select().from(serviceTiers).where(eq(serviceTiers.key, key));
    return serviceTier;
  }

  async createServiceTier(insertServiceTier: InsertServiceTier): Promise<ServiceTier> {
    const [serviceTier] = await db.insert(serviceTiers).values(insertServiceTier).returning();
    return serviceTier;
  }

  // Booking operations
  async getBooking(id: number): Promise<BookingWithDetails | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(businesses, eq(bookings.businessId, businesses.id))
      .leftJoin(installers, eq(bookings.installerId, installers.id))
      .leftJoin(serviceTiers, eq(bookings.serviceTierId, serviceTiers.id))
      .leftJoin(qrCodes, eq(bookings.id, qrCodes.bookingId))
      .where(eq(bookings.id, id));

    if (!booking) return undefined;

    return {
      ...booking.bookings,
      user: booking.users!,
      business: booking.businesses!,
      installer: booking.installers || undefined,
      serviceTier: booking.service_tiers!,
      qrCode: booking.qr_codes || undefined,
    };
  }

  async getBookingByBookingId(bookingId: string): Promise<BookingWithDetails | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(businesses, eq(bookings.businessId, businesses.id))
      .leftJoin(installers, eq(bookings.installerId, installers.id))
      .leftJoin(serviceTiers, eq(bookings.serviceTierId, serviceTiers.id))
      .leftJoin(qrCodes, eq(bookings.id, qrCodes.bookingId))
      .where(eq(bookings.bookingId, bookingId));

    if (!booking) return undefined;

    return {
      ...booking.bookings,
      user: booking.users!,
      business: booking.businesses!,
      installer: booking.installers || undefined,
      serviceTier: booking.service_tiers!,
      qrCode: booking.qr_codes || undefined,
    };
  }

  async getBookingsByUser(userId: number): Promise<BookingWithDetails[]> {
    const results = await db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(businesses, eq(bookings.businessId, businesses.id))
      .leftJoin(installers, eq(bookings.installerId, installers.id))
      .leftJoin(serviceTiers, eq(bookings.serviceTierId, serviceTiers.id))
      .leftJoin(qrCodes, eq(bookings.id, qrCodes.bookingId))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));

    return results.map(booking => ({
      ...booking.bookings,
      user: booking.users!,
      business: booking.businesses!,
      installer: booking.installers || undefined,
      serviceTier: booking.service_tiers!,
      qrCode: booking.qr_codes || undefined,
    }));
  }

  async getBookingsByBusiness(businessId: number): Promise<BookingWithDetails[]> {
    const results = await db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(businesses, eq(bookings.businessId, businesses.id))
      .leftJoin(installers, eq(bookings.installerId, installers.id))
      .leftJoin(serviceTiers, eq(bookings.serviceTierId, serviceTiers.id))
      .leftJoin(qrCodes, eq(bookings.id, qrCodes.bookingId))
      .where(eq(bookings.businessId, businessId))
      .orderBy(desc(bookings.createdAt));

    return results.map(booking => ({
      ...booking.bookings,
      user: booking.users!,
      business: booking.businesses!,
      installer: booking.installers || undefined,
      serviceTier: booking.service_tiers!,
      qrCode: booking.qr_codes || undefined,
    }));
  }

  async getBookingsByInstaller(installerId: number): Promise<BookingWithDetails[]> {
    const results = await db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(businesses, eq(bookings.businessId, businesses.id))
      .leftJoin(installers, eq(bookings.installerId, installers.id))
      .leftJoin(serviceTiers, eq(bookings.serviceTierId, serviceTiers.id))
      .leftJoin(qrCodes, eq(bookings.id, qrCodes.bookingId))
      .where(eq(bookings.installerId, installerId))
      .orderBy(desc(bookings.createdAt));

    return results.map(booking => ({
      ...booking.bookings,
      user: booking.users!,
      business: booking.businesses!,
      installer: booking.installers || undefined,
      serviceTier: booking.service_tiers!,
      qrCode: booking.qr_codes || undefined,
    }));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    // Generate unique booking ID
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    const bookingId = `BK-${year}-${randomNum}`;

    const [booking] = await db
      .insert(bookings)
      .values({ ...insertBooking, bookingId })
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

  async updateBookingInstaller(id: number, installerId: number): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ installerId, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  // QR Code operations
  async getQrCodeByToken(accessToken: string): Promise<QrCode | undefined> {
    const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.accessToken, accessToken));
    return qrCode;
  }

  async createQrCode(insertQrCode: InsertQrCode): Promise<QrCode> {
    const [qrCode] = await db.insert(qrCodes).values(insertQrCode).returning();
    return qrCode;
  }

  // Statistics
  async getBusinessStats(businessId: number): Promise<{
    totalBookings: number;
    monthlyBookings: number;
    revenue: number;
    appFees: number;
  }> {
    // This would typically use aggregate functions in a real implementation
    const allBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.businessId, businessId));

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyBookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.createdAt!);
      return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
    });

    const revenue = allBookings.reduce((sum, booking) => sum + Number(booking.totalPrice), 0);
    const appFees = allBookings.reduce((sum, booking) => sum + Number(booking.appFee), 0);

    return {
      totalBookings: allBookings.length,
      monthlyBookings: monthlyBookings.length,
      revenue,
      appFees,
    };
  }

  async getInstallerStats(installerId: number): Promise<{
    monthlyJobs: number;
    earnings: number;
    rating: number;
  }> {
    const installer = await this.getInstaller(installerId);
    const installerBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.installerId, installerId));

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyJobs = installerBookings.filter(booking => {
      const bookingDate = new Date(booking.createdAt!);
      return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
    });

    const earnings = installerBookings.reduce((sum, booking) => {
      return sum + (Number(booking.totalPrice) - Number(booking.appFee) - Number(booking.businessFee));
    }, 0);

    return {
      monthlyJobs: monthlyJobs.length,
      earnings,
      rating: Number(installer?.rating || 0),
    };
  }
}

export const storage = new DatabaseStorage();
