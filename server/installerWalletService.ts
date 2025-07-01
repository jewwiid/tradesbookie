// Installer wallet and transaction management service
import { 
  installerWallets, installerTransactions, jobAssignments,
  type InstallerWallet, type InsertInstallerWallet,
  type InstallerTransaction, type InsertInstallerTransaction 
} from "@shared/schema";
import { db } from "./db";
import { eq, sum, desc } from "drizzle-orm";

export interface WalletBalance {
  current: number;
  totalSpent: number;
  totalEarned: number;
  pendingCharges: number;
}

export class InstallerWalletService {
  // Create wallet for new installer
  async createWallet(installerId: number): Promise<InstallerWallet> {
    const walletData: InstallerWallet = {
      id: 0, // Will be auto-generated
      installerId,
      balance: "0.00",
      totalSpent: "0.00", 
      totalEarned: "0.00",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [wallet] = await db.insert(installerWallets).values(walletData).returning();
    return wallet;
  }

  // Get installer wallet or create if doesn't exist
  async getOrCreateWallet(installerId: number): Promise<InstallerWallet> {
    const [existing] = await db.select()
      .from(installerWallets)
      .where(eq(installerWallets.installerId, installerId))
      .limit(1);
    
    if (existing) {
      return existing;
    }
    
    return await this.createWallet(installerId);
  }

  // Add credits to installer wallet
  async addCredits(installerId: number, amount: number, paymentIntentId: string): Promise<void> {
    const wallet = await this.getOrCreateWallet(installerId);
    
    // Update wallet balance
    await db.update(installerWallets)
      .set({ 
        balance: (parseFloat(wallet.balance) + amount).toFixed(2),
        updatedAt: new Date()
      })
      .where(eq(installerWallets.installerId, installerId));

    // Record transaction
    await this.addTransaction({
      installerId,
      type: 'credit_purchase',
      amount: amount.toFixed(2),
      description: `Added €${amount} credits to wallet`,
      paymentIntentId,
      status: 'completed'
    });
  }

  // Calculate complete lead fee including base service, addons, and referral adjustments
  async calculateCompleteLeadFee(booking: any): Promise<{
    baseFee: number;
    addonFees: number;
    subsidyAmount: number;
    totalFee: number;
    breakdown: string[];
  }> {
    // Base service lead fees
    const serviceLeadFees: Record<string, number> = {
      'table-top-small': 12,
      'table-top-large': 15,
      'bronze': 20,
      'silver': 25,
      'silver-large': 30,
      'gold': 30,
      'gold-large': 35
    };

    // Addon lead fees
    const addonLeadFees: Record<string, number> = {
      'cable-concealment': 5,
      'soundbar-mounting': 7,
      'additional-devices': 3
    };

    const baseFee = serviceLeadFees[booking.serviceType] || 20;
    const breakdown: string[] = [`Base service: €${baseFee}`];
    
    // Calculate addon fees
    let addonFees = 0;
    if (booking.addons && typeof booking.addons === 'string' && booking.addons.length > 0) {
      const addons = booking.addons.split(',').map(a => a.trim().toLowerCase().replace(/\s+/g, '-'));
      addons.forEach(addon => {
        const fee = addonLeadFees[addon] || 0;
        if (fee > 0) {
          addonFees += fee;
          breakdown.push(`${addon}: €${fee}`);
        }
      });
    }

    // Calculate referral subsidy (Harvey Norman sales staff codes)
    let subsidyAmount = 0;
    if (booking.referralDiscount && parseFloat(booking.referralDiscount) > 0) {
      // Harvey Norman referral: 10% customer discount subsidized by installer
      const customerDiscount = parseFloat(booking.referralDiscount);
      subsidyAmount = Math.round(customerDiscount * 100) / 100; // Round to 2 decimal places
      breakdown.push(`Harvey Norman subsidy: €${subsidyAmount}`);
    }

    const totalFee = baseFee + addonFees + subsidyAmount;

    return {
      baseFee,
      addonFees,
      subsidyAmount,
      totalFee,
      breakdown
    };
  }

  // Charge for lead access with complete fee calculation
  async chargeLeadFee(installerId: number, jobAssignmentId: number, leadFee: number, subsidyAmount: number = 0): Promise<boolean> {
    const wallet = await this.getOrCreateWallet(installerId);
    const currentBalance = parseFloat(wallet.balance);
    const totalCharge = leadFee + subsidyAmount;
    
    if (currentBalance < totalCharge) {
      return false; // Insufficient balance
    }

    // Deduct total charge from wallet
    await db.update(installerWallets)
      .set({ 
        balance: (currentBalance - totalCharge).toFixed(2),
        totalSpent: (parseFloat(wallet.totalSpent) + totalCharge).toFixed(2),
        updatedAt: new Date()
      })
      .where(eq(installerWallets.installerId, installerId));

    // Record base lead fee transaction
    await this.addTransaction({
      installerId,
      type: 'lead_purchase',
      amount: `-${leadFee.toFixed(2)}`,
      description: `Lead access fee for job assignment #${jobAssignmentId}`,
      jobAssignmentId,
      status: 'completed'
    });

    // Record subsidy transaction if applicable
    if (subsidyAmount > 0) {
      await this.addTransaction({
        installerId,
        type: 'referral_subsidy',
        amount: `-${subsidyAmount.toFixed(2)}`,
        description: `Harvey Norman referral discount subsidy for job assignment #${jobAssignmentId}`,
        jobAssignmentId,
        status: 'completed'
      });
    }

    return true;
  }

  // Enhanced lead fee charging with complete breakdown
  async chargeCompleteLeadFee(installerId: number, jobAssignmentId: number, booking: any): Promise<boolean> {
    const feeCalculation = await this.calculateCompleteLeadFee(booking);
    const wallet = await this.getOrCreateWallet(installerId);
    const currentBalance = parseFloat(wallet.balance);
    
    if (currentBalance < feeCalculation.totalFee) {
      return false; // Insufficient balance
    }

    // Deduct total fee from wallet
    await db.update(installerWallets)
      .set({ 
        balance: (currentBalance - feeCalculation.totalFee).toFixed(2),
        totalSpent: (parseFloat(wallet.totalSpent) + feeCalculation.totalFee).toFixed(2),
        updatedAt: new Date()
      })
      .where(eq(installerWallets.installerId, installerId));

    // Record base service fee transaction
    await this.addTransaction({
      installerId,
      type: 'lead_purchase',
      amount: `-${feeCalculation.baseFee.toFixed(2)}`,
      description: `Lead fee: ${booking.serviceType} - Job #${jobAssignmentId}`,
      jobAssignmentId,
      status: 'completed'
    });

    // Record addon fee transactions separately
    if (feeCalculation.addonFees > 0 && booking.addons) {
      const addons = booking.addons.split(',').map((a: string) => a.trim());
      const addonLeadFees: Record<string, number> = {
        'cable-concealment': 5,
        'soundbar-mounting': 7,
        'additional-devices': 3
      };

      for (const addon of addons) {
        const addonKey = addon.toLowerCase().replace(/\s+/g, '-');
        const fee = addonLeadFees[addonKey];
        if (fee && fee > 0) {
          await this.addTransaction({
            installerId,
            type: 'addon_fee',
            amount: `-${fee.toFixed(2)}`,
            description: `Addon fee: ${addon} - Job #${jobAssignmentId}`,
            jobAssignmentId,
            status: 'completed'
          });
        }
      }
    }

    // Record referral subsidy transaction if applicable
    if (feeCalculation.subsidyAmount > 0) {
      await this.addTransaction({
        installerId,
        type: 'referral_subsidy',
        amount: `-${feeCalculation.subsidyAmount.toFixed(2)}`,
        description: `Harvey Norman referral subsidy - Job #${jobAssignmentId}`,
        jobAssignmentId,
        status: 'completed'
      });
    }

    return true;
  }

  // Add job earnings (when installer completes work)
  async addJobEarnings(installerId: number, jobAssignmentId: number, earnings: number): Promise<void> {
    const wallet = await this.getOrCreateWallet(installerId);
    
    // Update wallet with earnings
    await db.update(installerWallets)
      .set({ 
        totalEarned: (parseFloat(wallet.totalEarned) + earnings).toFixed(2),
        updatedAt: new Date()
      })
      .where(eq(installerWallets.installerId, installerId));

    // Record transaction
    await this.addTransaction({
      installerId,
      type: 'job_earnings',
      amount: earnings.toFixed(2),
      description: `Earnings from completed job #${jobAssignmentId}`,
      jobAssignmentId,
      status: 'completed'
    });
  }

  // Add transaction record
  async addTransaction(transaction: InsertInstallerTransaction): Promise<InstallerTransaction> {
    const [newTransaction] = await db.insert(installerTransactions)
      .values({
        ...transaction,
        createdAt: new Date()
      })
      .returning();
    
    return newTransaction;
  }

  // Get wallet balance summary
  async getWalletBalance(installerId: number): Promise<WalletBalance> {
    const wallet = await this.getOrCreateWallet(installerId);
    
    // Get pending charges (lead fees not yet paid)
    const pendingJobs = await db.select()
      .from(jobAssignments)
      .where(eq(jobAssignments.installerId, installerId));
    
    const pendingCharges = pendingJobs
      .filter(job => job.leadFeeStatus === 'pending')
      .reduce((sum, job) => sum + parseFloat(job.leadFee || '0'), 0);

    return {
      current: parseFloat(wallet.balance),
      totalSpent: parseFloat(wallet.totalSpent),
      totalEarned: parseFloat(wallet.totalEarned),
      pendingCharges
    };
  }

  // Get transaction history
  async getTransactionHistory(installerId: number, limit: number = 50): Promise<InstallerTransaction[]> {
    return await db.select()
      .from(installerTransactions)
      .where(eq(installerTransactions.installerId, installerId))
      .orderBy(desc(installerTransactions.createdAt))
      .limit(limit);
  }

  // Check if installer can afford lead fee
  async canAffordLeadFee(installerId: number, leadFee: number): Promise<boolean> {
    const balance = await this.getWalletBalance(installerId);
    return balance.current >= leadFee;
  }

  // Get spending statistics
  async getSpendingStats(installerId: number): Promise<{
    thisMonth: number;
    thisWeek: number;
    averagePerLead: number;
    totalLeads: number;
  }> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const transactions = await db.select()
      .from(installerTransactions)
      .where(eq(installerTransactions.installerId, installerId));

    const leadPurchases = transactions.filter(t => t.type === 'lead_purchase');
    
    const thisMonthSpending = leadPurchases
      .filter(t => t.createdAt && t.createdAt >= monthStart)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const thisWeekSpending = leadPurchases
      .filter(t => t.createdAt && t.createdAt >= weekStart)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalSpent = leadPurchases.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalLeads = leadPurchases.length;
    const averagePerLead = totalLeads > 0 ? totalSpent / totalLeads : 0;

    return {
      thisMonth: thisMonthSpending,
      thisWeek: thisWeekSpending,
      averagePerLead,
      totalLeads
    };
  }
}

export const installerWalletService = new InstallerWalletService();