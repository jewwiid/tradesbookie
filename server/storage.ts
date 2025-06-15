import { 
  users, bookings, installers, feeStructures, jobAssignments,
  type User, type UpsertUser,
  type Booking, type InsertBooking,
  type Installer, type InsertInstaller,
  type FeeStructure, type InsertFeeStructure,
  type JobAssignment, type InsertJobAssignment
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Installer operations
  getInstaller(id: number): Promise<Installer | undefined>;
  getInstallerByEmail(email: string): Promise<Installer | undefined>;
  createInstaller(installer: InsertInstaller): Promise<Installer>;
  getAllInstallers(): Promise<Installer[]>;

  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingByQrCode(qrCode: string): Promise<Booking | undefined>;
  getUserBookings(userId: number): Promise<Booking[]>;
  getInstallerBookings(installerId: number): Promise<Booking[]>;
  updateBookingStatus(id: number, status: string): Promise<void>;
  updateBookingAiPreview(id: number, aiPreviewUrl: string): Promise<void>;
  updateBookingPayment(id: number, paymentIntentId: string, paymentStatus: string, paidAmount?: number): Promise<void>;
  getAllBookings(): Promise<Booking[]>;

  // Fee structure operations
  getFeeStructure(installerId: number, serviceType: string): Promise<FeeStructure | undefined>;
  createFeeStructure(feeStructure: InsertFeeStructure): Promise<FeeStructure>;
  updateFeeStructure(installerId: number, serviceType: string, feePercentage: number): Promise<void>;
  getInstallerFeeStructures(installerId: number): Promise<FeeStructure[]>;

  // Job assignment operations
  createJobAssignment(assignment: InsertJobAssignment): Promise<JobAssignment>;
  getInstallerJobs(installerId: number): Promise<JobAssignment[]>;
  updateJobStatus(id: number, status: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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

  async getAllInstallers(): Promise<Installer[]> {
    return await db.select().from(installers).where(eq(installers.isActive, true));
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

  async getUserBookings(userId: number): Promise<Booking[]> {
    return await db.select().from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));
  }

  async getInstallerBookings(installerId: number): Promise<Booking[]> {
    return await db.select().from(bookings)
      .where(eq(bookings.installerId, installerId))
      .orderBy(desc(bookings.createdAt));
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

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  // Fee structure operations
  async getFeeStructure(installerId: number, serviceType: string): Promise<FeeStructure | undefined> {
    const [feeStructure] = await db.select().from(feeStructures)
      .where(and(
        eq(feeStructures.installerId, installerId),
        eq(feeStructures.serviceType, serviceType)
      ));
    return feeStructure;
  }

  async createFeeStructure(insertFeeStructure: InsertFeeStructure): Promise<FeeStructure> {
    const [feeStructure] = await db.insert(feeStructures).values(insertFeeStructure).returning();
    return feeStructure;
  }

  async updateFeeStructure(installerId: number, serviceType: string, feePercentage: number): Promise<void> {
    await db.update(feeStructures)
      .set({ feePercentage: feePercentage.toString() })
      .where(and(
        eq(feeStructures.installerId, installerId),
        eq(feeStructures.serviceType, serviceType)
      ));
  }

  async getInstallerFeeStructures(installerId: number): Promise<FeeStructure[]> {
    return await db.select().from(feeStructures)
      .where(eq(feeStructures.installerId, installerId));
  }

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
}

export const storage = new DatabaseStorage();
