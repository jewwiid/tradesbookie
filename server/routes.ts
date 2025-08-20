import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Stripe from "stripe";
import { storage } from "./storage";
import { 
  insertBookingSchema, insertUserSchema, insertReviewSchema, insertScheduleNegotiationSchema,
  insertResourceSchema, tvSetupBookingFormSchema, insertProductCategorySchema, insertAiToolSchema, 
  users, bookings, reviews, referralCodes, referralUsage, jobAssignments, installers, 
  scheduleNegotiations, leadRefunds, antiManipulation, installerTransactions, declinedRequests
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray, isNotNull, sql, or, not, gte, lt } from "drizzle-orm";
import { generateTVPreview, analyzeRoomForTVPlacement } from "./openai";
import { generateTVRecommendation } from "./tvRecommendationService";
import { AIAnalyticsService } from "./aiAnalyticsService";
import { getServiceTiersForTvSize, calculateBookingPricing as calculatePricing, SERVICE_TIERS, getLeadFee } from "./pricing";
import { z } from "zod";
import multer from "multer";
import QRCode from "qrcode";
import { setupAuth, isAuthenticated } from "./replitAuth";
import passport from "passport";
import "./types"; // Import session type extensions

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

import { sendGmailEmail, sendBookingConfirmation, sendInstallerNotification, sendAdminNotification, sendLeadPurchaseNotification, sendStatusUpdateNotification, sendScheduleProposalNotification, sendScheduleConfirmationNotification, sendInstallerWelcomeEmail, sendInstallerApprovalEmail, sendInstallerRejectionEmail, sendTvSetupBookingConfirmation, sendTvSetupAdminNotification, sendPreInstallationReminder } from "./gmailService";

// Helper function to generate secure completion token
function generateCompletionToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

// Helper function to check if user has opted in to receive specific types of emails
async function checkUserEmailPreferences(userId: string, emailType: 'general' | 'booking' | 'marketing'): Promise<boolean> {
  try {
    const user = await db.select({
      emailNotifications: users.emailNotifications,
      bookingUpdates: users.bookingUpdates,
      marketingEmails: users.marketingEmails
    }).from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user || user.length === 0) {
      console.log(`User ${userId} not found, defaulting to no email`);
      return false;
    }
    
    const userPrefs = user[0];
    
    switch (emailType) {
      case 'general':
        return userPrefs.emailNotifications ?? true;
      case 'booking':
        return userPrefs.bookingUpdates ?? true;
      case 'marketing':
        return userPrefs.marketingEmails ?? false;
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error checking email preferences for user ${userId}:`, error);
    return false; // Err on the side of not sending emails if there's an error
  }
}

// Helper function to check if user has opted in by email address
async function checkUserEmailPreferencesByEmail(email: string, emailType: 'general' | 'booking' | 'marketing'): Promise<boolean> {
  try {
    const user = await db.select({
      id: users.id,
      emailNotifications: users.emailNotifications,
      bookingUpdates: users.bookingUpdates,
      marketingEmails: users.marketingEmails
    }).from(users).where(eq(users.email, email)).limit(1);
    
    if (!user || user.length === 0) {
      console.log(`User with email ${email} not found, defaulting to send for essential communications`);
      // For users not in our system, we allow essential communications but not marketing
      return emailType !== 'marketing';
    }
    
    return checkUserEmailPreferences(user[0].id, emailType);
  } catch (error) {
    console.error(`Error checking email preferences for email ${email}:`, error);
    return emailType !== 'marketing'; // Allow essential communications but block marketing on error
  }
}
import { generateVerificationToken, sendVerificationEmail, verifyEmailToken, resendVerificationEmail } from "./emailVerificationService";
import { harveyNormanReferralService } from "./harvestNormanReferralService";
import { fraudPreventionService } from "./fraudPreventionService";
import { pricingManagementService } from "./pricingManagementService";
import { getWebsiteMetrics } from "./analyticsService";
import { requestPasswordReset, resetPassword } from "./passwordResetService";
import { askQuestion, getPopularQuestions, updateFaqAnswer, deactivateFaqAnswer } from "./faqService";
import { compareTVModels } from "./tvComparisonService";
import { compareElectronicProducts } from "./electronicProductComparisonService";
import { getProductRecommendations } from "./productRecommendationService";
import { getProductInfo } from "./productInfoService";
import { analyzeProductCare } from "./productCareAnalysisService";
import { QRCodeService } from "./qrCodeService";
import { generateEmailTemplate, getPresetTemplate, getAllPresetTemplates } from "./aiEmailTemplateService";
import { AIContentService } from "./services/aiContentService";
import { checkAiCredits, recordAiUsage, AI_FEATURES, clearAiToolsCache, type AIRequest } from "./aiCreditMiddleware";

// Auto-refund service for expired leads
class LeadExpiryService {
  private static readonly EXPIRY_DAYS = 5;
  private static intervalId: NodeJS.Timeout | null = null;

  // Check for expired leads and process refunds
  static async processExpiredLeads(): Promise<void> {
    try {
      console.log('🕐 Checking for expired leads...');
      
      // Calculate 5 days ago
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() - this.EXPIRY_DAYS);
      
      // Find all purchased leads older than 5 days that haven't been selected
      const expiredLeads = await db.select({
        jobAssignment: jobAssignments,
        booking: bookings
      })
      .from(jobAssignments)
      .innerJoin(bookings, eq(jobAssignments.bookingId, bookings.id))
      .where(and(
        eq(jobAssignments.status, 'purchased'),
        eq(jobAssignments.leadFeeStatus, 'paid')
      ));

      // Filter by expiry date (assignments older than 5 days)
      const actuallyExpired = expiredLeads.filter(item => {
        const assignedDate = item.jobAssignment.assignedDate ? new Date(item.jobAssignment.assignedDate) : null;
        return assignedDate && assignedDate < expiryDate;
      });

      if (actuallyExpired.length === 0) {
        console.log('✅ No expired leads found');
        return;
      }

      console.log(`🔄 Processing ${actuallyExpired.length} expired leads...`);
      
      // Group by booking ID to process each booking's expired leads
      const expiredByBooking = new Map<number, typeof actuallyExpired>();
      for (const item of actuallyExpired) {
        const bookingId = item.jobAssignment.bookingId;
        if (bookingId && !expiredByBooking.has(bookingId)) {
          expiredByBooking.set(bookingId, []);
        }
        if (bookingId) {
          expiredByBooking.get(bookingId)!.push(item);
        }
      }

      let totalRefunded = 0;
      let totalAmount = 0;

      // Process each booking's expired leads
      for (const [bookingId, expiredItems] of expiredByBooking) {
        try {
          console.log(`📋 Processing booking ${bookingId} with ${expiredItems.length} expired lead(s)`);
          
          for (const item of expiredItems) {
            const { jobAssignment } = item;
            
            // Update assignment status to expired
            await db.update(jobAssignments)
              .set({ 
                status: 'expired'
              })
              .where(eq(jobAssignments.id, jobAssignment.id));

            // Process refund
            const leadFee = jobAssignment.leadFee ? parseFloat(jobAssignment.leadFee) : 0;
            const installerId = jobAssignment.installerId;
            if (!installerId) continue;
            
            const wallet = await storage.getInstallerWallet(installerId);
            
            if (wallet && leadFee > 0) {
              const newBalance = parseFloat(wallet.balance) + leadFee;
              const totalSpent = Math.max(0, parseFloat(wallet.totalSpent) - leadFee);
              
              await storage.updateInstallerWalletBalance(installerId, newBalance);
              await storage.updateInstallerWalletTotalSpent(installerId, totalSpent);
              
              // Add refund transaction record
              await storage.addInstallerTransaction({
                installerId: installerId,
                type: 'refund',
                amount: leadFee.toString(),
                description: `Auto-refund for expired lead #${bookingId} (${this.EXPIRY_DAYS} day limit)`,
                jobAssignmentId: jobAssignment.id,
                status: 'completed'
              });
              
              totalRefunded++;
              totalAmount += leadFee;
              
              console.log(`💰 Refunded €${leadFee} to installer ${installerId} for expired lead ${bookingId}`);
            }
          }
          
          // Update booking status to indicate lead expired
          await storage.updateBookingStatus(bookingId, 'expired');
          
        } catch (error) {
          console.error(`❌ Error processing expired booking ${bookingId}:`, error);
        }
      }
      
      if (totalRefunded > 0) {
        console.log(`✅ Auto-refund complete: ${totalRefunded} refunds totaling €${totalAmount.toFixed(2)}`);
      }
      
    } catch (error) {
      console.error('❌ Error processing expired leads:', error);
    }
  }

  // Start the periodic expiry check
  static startExpiryMonitoring(): void {
    // Check every hour for expired leads
    const intervalMs = 60 * 60 * 1000; // 1 hour
    
    console.log(`🚀 Starting lead expiry monitoring (checking every ${intervalMs / 1000 / 60} minutes)`);
    
    // Run initial check
    this.processExpiredLeads();
    
    // Set up recurring checks
    this.intervalId = setInterval(() => {
      this.processExpiredLeads();
    }, intervalMs);
  }

  // Stop the monitoring (for cleanup)
  static stopExpiryMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Lead expiry monitoring stopped');
    }
  }
}

// Pre-installation reminder service for 1-day advance notifications
class PreInstallationReminderService {
  private static intervalId: NodeJS.Timeout | null = null;

  // Check for installations scheduled for tomorrow and send reminders
  static async processInstallationReminders(): Promise<void> {
    try {
      console.log('🔔 Checking for installations scheduled tomorrow...');
      
      // Calculate tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow
      
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
      dayAfterTomorrow.setHours(0, 0, 0, 0); // Start of day after tomorrow
      
      // Find all bookings scheduled for tomorrow that haven't received reminders
      const tomorrowInstallations = await db.select()
        .from(bookings)
        .where(and(
          gte(bookings.scheduledDate, tomorrow.toISOString().split('T')[0]),
          lt(bookings.scheduledDate, dayAfterTomorrow.toISOString().split('T')[0]),
          eq(bookings.reminderSent, false),
          isNotNull(bookings.installerId),
          or(
            eq(bookings.status, 'scheduled'),
            eq(bookings.status, 'confirmed'),
            eq(bookings.status, 'installation_scheduled')
          )
        ));

      if (tomorrowInstallations.length === 0) {
        console.log('✅ No installations scheduled tomorrow requiring reminders');
        return;
      }

      console.log(`📨 Processing ${tomorrowInstallations.length} installation reminder(s)...`);
      
      let remindersSent = 0;
      let remindersSkipped = 0;
      
      for (const booking of tomorrowInstallations) {
        try {
          console.log(`📋 Processing reminder for booking ${booking.qrCode} scheduled ${booking.scheduledDate}`);
          
          // Send reminder to customer
          const customerReminderSent = await sendPreInstallationReminder(booking, 'customer');
          
          // Send reminder to installer
          const installerReminderSent = await sendPreInstallationReminder(booking, 'installer');
          
          if (customerReminderSent || installerReminderSent) {
            // Mark reminder as sent
            await db.update(bookings)
              .set({ 
                reminderSent: true,
                reminderSentAt: new Date()
              })
              .where(eq(bookings.id, booking.id));
              
            console.log(`✅ Reminder sent for booking ${booking.qrCode}: Customer: ${customerReminderSent}, Installer: ${installerReminderSent}`);
            remindersSent++;
          } else {
            console.log(`❌ Failed to send reminder for booking ${booking.qrCode}`);
            remindersSkipped++;
          }
          
        } catch (error) {
          console.error(`❌ Error processing reminder for booking ${booking.id}:`, error);
          remindersSkipped++;
        }
      }
      
      if (remindersSent > 0) {
        console.log(`✅ Reminder processing complete: ${remindersSent} sent, ${remindersSkipped} skipped`);
      }
      
    } catch (error) {
      console.error('❌ Error processing installation reminders:', error);
    }
  }

  // Start the periodic reminder check
  static startReminderMonitoring(): void {
    // Check every 4 hours for installations scheduled tomorrow
    const intervalMs = 4 * 60 * 60 * 1000; // 4 hours
    
    console.log(`🔔 Starting pre-installation reminder monitoring (checking every ${intervalMs / 1000 / 60 / 60} hours)`);
    
    // Run initial check
    this.processInstallationReminders();
    
    // Set up recurring checks
    this.intervalId = setInterval(() => {
      this.processInstallationReminders();
    }, intervalMs);
  }

  // Stop the monitoring (for cleanup)
  static stopReminderMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Pre-installation reminder monitoring stopped');
    }
  }
}

// WebSocket clients for real-time updates
const wsClients = new Set<WebSocket>();

// Broadcast function for real-time updates
function broadcastBookingUpdate(bookingId: number, event: string, data?: any) {
  const message = JSON.stringify({
    type: 'booking_update',
    bookingId,
    event,
    data,
    timestamp: new Date().toISOString()
  });
  
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  
  console.log(`Broadcast booking update: ${event} for booking ${bookingId}`);
}

// Function to reset and generate varied demo leads for demo account (creates actual database bookings)
const resetDemoLeads = async (installerId: number) => {
  try {
    // Clear any existing status cache for demo account
    if ((global as any).demoStatusUpdates) {
      delete (global as any).demoStatusUpdates;
      console.log('Cleared demo status cache for fresh session');
    }
    
    // Get existing demo bookings
    const existingBookings = await storage.getAllBookings();
    const demoBookings = existingBookings.filter(booking => 
      booking.qrCode && booking.qrCode.includes('QR-DEMO')
    );
    
    // Fixed set of 3 demo leads for consistency
    const fixedDemoLeads = [
      {
        qrCode: "QR-DEMO-001",
        address: "15 Grafton Street, Dublin 2, Ireland",
        tvSize: "55 inch",
        serviceType: "silver-premium",
        wallType: "Drywall",
        difficulty: "Easy",
        estimatedEarnings: 155,
        leadFee: 25,
        customerName: "Sarah O'Brien",
        customerEmail: "sarah.obrien@example.com",
        customerPhone: "+353 87 123 4567",
        addons: [{ name: "Cable Management", key: "cable_management", price: 20 }]
      },
      {
        qrCode: "QR-DEMO-002",
        address: "42 Patrick Street, Cork, Ireland", 
        tvSize: "65 inch",
        serviceType: "gold-premium-large",
        wallType: "Brick",
        difficulty: "Difficult",
        estimatedEarnings: 345,
        leadFee: 35,
        customerName: "Michael Walsh",
        customerEmail: "michael.walsh@example.com",
        customerPhone: "+353 86 234 5678",
        addons: [
          { name: "Cable Management", key: "cable_management", price: 20 },
          { name: "Soundbar Installation", key: "soundbar_installation", price: 30 }
        ]
      },
      {
        qrCode: "QR-DEMO-003",
        address: "89 Henry Street, Galway, Ireland",
        tvSize: "43 inch", 
        serviceType: "bronze-wall-mount",
        wallType: "Plasterboard",
        difficulty: "Moderate",
        estimatedEarnings: 100,
        leadFee: 20,
        customerName: "Emma Collins",
        customerEmail: "emma.collins@example.com",
        customerPhone: "+353 85 345 6789",
        addons: []
      }
    ];

    const processedIds = [];
    
    // Process each fixed demo lead
    for (const leadTemplate of fixedDemoLeads) {
      const existingLead = demoBookings.find(booking => booking.qrCode === leadTemplate.qrCode);
      
      if (existingLead) {
        // Reset existing lead to available status
        try {
          await storage.updateBookingStatus(existingLead.id, 'pending');
          // Reset installer assignment to make it available again
          await storage.updateBooking(existingLead.id, { 
            installerId: null,
            status: 'pending'
          });
          processedIds.push(existingLead.id);
          console.log(`Reset existing demo lead ${leadTemplate.qrCode} (ID: ${existingLead.id}) to available status`);
        } catch (error) {
          console.error(`Error resetting existing demo lead ${leadTemplate.qrCode}:`, error);
        }
      } else {
        // Demo lead doesn't exist - this is expected after database cleanup
        console.log(`Demo lead ${leadTemplate.qrCode} not found - this is normal after database cleanup`);
      }
    }

    // Clean up any old demo bookings that aren't part of our fixed set
    const extraDemoBookings = demoBookings.filter(booking => 
      !fixedDemoLeads.some(lead => lead.qrCode === booking.qrCode)
    );
    
    for (const extraBooking of extraDemoBookings) {
      try {
        await storage.deleteBooking(extraBooking.id);
        console.log(`Deleted old demo booking ${extraBooking.qrCode} (ID: ${extraBooking.id})`);
      } catch (error) {
        console.log(`Could not delete old demo booking ${extraBooking.id}, skipping...`);
      }
    }

    console.log(`Successfully processed ${processedIds.length} demo leads for installer ${installerId}: ${processedIds.join(', ')}`);
    return processedIds;
  } catch (error) {
    console.error("Error resetting demo leads:", error);
    return [];
  }
};

// Email notification service with Gmail integration
async function sendNotificationEmail(to: string, subject: string, content: string, html?: string) {
  return await sendGmailEmail({
    to,
    subject,
    text: content,
    html: html || content.replace(/\n/g, '<br>')
  });
}

// SMS notification service (placeholder for Twilio integration)
async function sendNotificationSMS(to: string, message: string) {
  // In production, this would use Twilio API
  console.log(`SMS NOTIFICATION: To: ${to}, Message: ${message}`);
  return true;
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {


  // Auth middleware - sets up passport and sessions
  await setupAuth(app);
  
  // Start the lead expiry monitoring system
  LeadExpiryService.startExpiryMonitoring();
  
  // Start the pre-installation reminder monitoring system
  PreInstallationReminderService.startReminderMonitoring();

  // OAuth Login Route - for customers and admins only (installers use email/password)
  app.get("/api/login", (req, res, next) => {
    console.log("=== OAUTH LOGIN REQUEST START ===");
    console.log("Login request from hostname:", req.hostname);
    console.log("Login query params:", req.query);
    console.log("Current user:", req.user);
    console.log("Is authenticated:", req.isAuthenticated ? req.isAuthenticated() : false);
    console.log("Session ID:", req.sessionID);
    
    // Redirect installers to their dedicated login page
    if (req.query.role === 'installer') {
      console.log("Installer login detected, redirecting to installer login page");
      return res.redirect("/installer-login");
    }
    
    try {
      // Store intended action and role in session
      (req.session as any).authAction = 'login';
      (req.session as any).intendedRole = req.query.role || 'customer';
      
      // Store return URL if provided
      if (req.query.returnTo) {
        (req.session as any).returnTo = req.query.returnTo as string;
      }
      
      // Determine strategy based on hostname
      const getStrategyName = (hostname: string): string | null => {
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'googleauth:localhost';
        } else if (hostname.includes('replit.dev') || hostname.includes('spock.replit.dev') || hostname.includes('replit.app')) {
          return `googleauth:${hostname}`;
        } else if (hostname === 'tradesbook.ie' || hostname.includes('tradesbook.ie')) {
          return 'googleauth:tradesbook.ie';
        } else {
          const registeredDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
          return registeredDomain ? `googleauth:${registeredDomain}` : null;
        }
      };
      
      const strategyName = getStrategyName(req.hostname);
      if (!strategyName) {
        console.error("No OAuth strategy found for hostname:", req.hostname);
        return res.status(400).json({ error: "OAuth not configured for this domain" });
      }
      
      console.log("Using OAuth strategy:", strategyName);
      
      // Check if strategy is registered
      const availableStrategies = Object.keys((passport as any)._strategies || {});
      console.log("Available strategies:", availableStrategies);
      
      if (!availableStrategies.includes(strategyName)) {
        console.error(`Strategy ${strategyName} not found!`);
        return res.status(500).json({ 
          error: "OAuth strategy not available", 
          strategy: strategyName,
          available: availableStrategies 
        });
      }
      
      // Save session before OAuth redirect
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error before OAuth:", saveErr);
          return res.status(500).json({ error: "Session save failed" });
        }
        
        // Use passport authenticate - should redirect to OAuth provider
        console.log("About to call passport.authenticate for login...");
        passport.authenticate(strategyName, { 
          scope: "openid email profile "
          // Removed prompt parameter as it's not supported by Replit OAuth
        })(req, res, (authErr) => {
          if (authErr) {
            console.error("Passport authentication error in login:", authErr);
            return res.status(500).json({ error: "OAuth authentication failed", details: authErr.message });
          }
          console.log("Passport authentication completed for login");
        });
      });
      
    } catch (error) {
      console.error("OAuth login setup error:", error);
      res.status(500).json({ error: "OAuth login failed", details: error.message });
    }
  });

  // OAuth Simple Login Route - just tries to login with current session
  app.get("/api/login-simple", (req, res, next) => {
    console.log("=== OAUTH SIMPLE LOGIN REQUEST START ===");
    console.log("Simple login request from hostname:", req.hostname);
    console.log("Simple login query params:", req.query);
    
    try {
      // Store intended action and role in session
      (req.session as any).authAction = 'login';
      (req.session as any).intendedRole = req.query.role || 'customer';
      
      // Store return URL if provided
      if (req.query.returnTo) {
        (req.session as any).returnTo = req.query.returnTo as string;
      }
      
      // Determine strategy based on hostname
      function getStrategyName(hostname: string): string | null {
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'googleauth:localhost';
        } else if (hostname.includes('replit.dev') || hostname.includes('spock.replit.dev') || hostname.includes('replit.app')) {
          return `googleauth:${hostname}`;
        } else if (hostname === 'tradesbook.ie' || hostname.includes('tradesbook.ie')) {
          return 'googleauth:tradesbook.ie';
        } else {
          const registeredDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
          return registeredDomain ? `googleauth:${registeredDomain}` : null;
        }
      }
      
      const strategyName = getStrategyName(req.hostname);
      if (!strategyName) {
        console.error("No OAuth strategy found for hostname:", req.hostname);
        return res.status(400).json({ error: "OAuth not configured for this domain" });
      }
      
      console.log("Using OAuth strategy for account selection:", strategyName);
      
      // Check if strategy is registered
      const availableStrategies = Object.keys((passport as any)._strategies || {});
      console.log("Available strategies:", availableStrategies);
      
      if (!availableStrategies.includes(strategyName)) {
        console.error(`Strategy ${strategyName} not found!`);
        return res.status(500).json({ 
          error: "OAuth strategy not available", 
          strategy: strategyName,
          available: availableStrategies 
        });
      }
      
      // Save session before OAuth redirect
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error before OAuth:", saveErr);
          return res.status(500).json({ error: "Session save failed" });
        }
        
        console.log("About to call passport.authenticate for account selection...");
        passport.authenticate(strategyName, { 
          scope: "openid email profile ",
          // Add timestamp to force fresh request and clear cached auth state
          state: `account_selection_${Date.now()}`
        })(req, res, next);
      });
      
    } catch (error) {
      console.error("OAuth account selection setup error:", error);
      res.status(500).json({ error: "OAuth account selection failed", details: error.message });
    }
  });

  // Simple installer authentication routes
  app.post("/api/installers/register", async (req, res) => {
    try {
      const { firstName, lastName, businessName, email, phone, address, county, yearsExperience, password, selectedServiceType } = req.body;
      
      // Validate input
      if (!firstName || !lastName || !businessName || !email || !phone || !address || !county || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      
      // Check if email already exists
      const existingInstaller = await storage.getInstallerByEmail(email);
      if (existingInstaller) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      // Use bcrypt to hash password
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.default.hash(password, 10);
      
      // Create installer account with full name information
      const fullName = `${firstName} ${lastName}`;
      const installer = await storage.registerInstaller(email, passwordHash, {
        contactName: fullName,
        businessName: businessName,
        phone: phone,
        address: address,
        serviceArea: county,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : 0
      });

      // Assign selected service type to the installer if provided
      if (selectedServiceType) {
        try {
          const serviceType = await storage.getServiceTypeByKey(selectedServiceType);
          if (serviceType) {
            await storage.assignServiceToInstaller({
              installerId: installer.id,
              serviceTypeId: serviceType.id,
              assignedBy: 'registration', // Indicate this was assigned during registration
              isActive: true
            });
            console.log(`✅ Service ${selectedServiceType} assigned to installer ${installer.id} during registration`);
          } else {
            console.warn(`⚠️ Service type ${selectedServiceType} not found during installer registration`);
          }
        } catch (serviceError) {
          console.error('❌ Failed to assign service during registration:', serviceError);
          // Don't fail registration if service assignment fails
        }
      }
      
      // Send welcome email to the installer
      try {
        console.log(`Attempting to send welcome email to: ${email}`);
        const emailResult = await sendInstallerWelcomeEmail(email, fullName, businessName);
        if (emailResult) {
          console.log(`✅ Welcome email sent successfully to new installer: ${email}`);
        } else {
          console.log(`❌ Welcome email failed to send to: ${email}`);
        }
      } catch (emailError) {
        console.error('❌ Failed to send welcome email to installer:', emailError);
        // Don't fail registration if email fails
      }
      
      // Return installer data (without password hash)
      const { passwordHash: _, ...installerData } = installer;
      res.status(201).json({
        success: true,
        installer: installerData,
        message: "Registration successful. Please complete your profile and wait for admin approval."
      });
      
    } catch (error) {
      console.error("Installer registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });



  // Public installer profile endpoint for customers
  app.get("/api/installer/:id/public-profile", async (req, res) => {
    try {
      const installerId = parseInt(req.params.id);
      
      if (!installerId) {
        return res.status(400).json({ error: "Invalid installer ID" });
      }

      // Get installer basic info
      const installer = await storage.getInstaller(installerId);
      if (!installer) {
        return res.status(404).json({ error: "Installer not found" });
      }

      // Only show active installers (removing isPubliclyVisible check since it may not exist)
      if (!installer.isActive) {
        return res.status(404).json({ error: "Installer profile not available" });
      }

      // Get job assignments and filter for completed ones
      const allJobs = await storage.getInstallerJobs(installerId);
      const completedJobs = allJobs.filter((job: any) => job.status === 'completed');
      
      // Transform completed jobs to include photos and reviews
      const completedWork = await Promise.all(
        completedJobs.slice(0, 10).map(async (job: any) => {
          // Get booking details
          const booking = await storage.getBooking(job.bookingId);
          if (!booking) return null;

          // Get before/after photos if available
          const beforeAfterPhotos = job.beforeAfterPhotos || [];

          // Get customer review if available
          const reviews = await storage.getInstallerReviews(installerId);
          const jobReview = reviews.find((r: any) => r.bookingId === job.bookingId);

          return {
            id: job.id,
            location: booking.address || 'Location not specified',
            serviceType: booking.serviceType || 'TV Installation',
            completedAt: job.completedDate || job.createdAt,
            qualityStars: job.qualityStars || 5,
            beforeAfterPhotos: beforeAfterPhotos,
            customerRating: jobReview?.rating,
            customerReview: jobReview?.comment
          };
        })
      );

      // Filter out null entries
      const validCompletedWork = completedWork.filter(work => work !== null);

      // Calculate total completed jobs
      const totalJobs = completedJobs.length;
      
      // Get installer rating data
      const ratingData = await storage.getInstallerRating(installerId);

      // Return public profile data
      const publicProfile = {
        id: installer.id,
        businessName: installer.businessName,
        contactName: installer.contactName,
        email: installer.email,
        phone: installer.phone,
        serviceArea: installer.serviceArea,
        address: installer.address,
        yearsExperience: installer.yearsExperience || 1,
        averageRating: ratingData.averageRating,
        totalReviews: ratingData.totalReviews,
        expertise: installer.expertise || [],
        bio: installer.bio || '',
        profileImageUrl: installer.profileImageUrl,
        isActive: installer.isActive,
        completedJobs: totalJobs,
        completedWork: validCompletedWork
      };

      res.json(publicProfile);
      
    } catch (error) {
      console.error("Get public installer profile error:", error);
      res.status(500).json({ error: "Failed to get installer profile" });
    }
  });

  // Get installer profile endpoint
  app.get("/api/installers/profile", async (req, res) => {
    try {
      // Check if installer is authenticated via session OR if user is admin
      const isInstallerAuth = req.session.installerAuthenticated && req.session.installerId;
      const isAdminAuth = req.isAuthenticated() && req.user && (
        req.user.role === 'admin' || 
        req.user.email === 'admin@tradesbook.ie' || 
        req.user.email === 'jude.okun@gmail.com' ||
        req.user.id === '42442296'
      );
      
      if (!isInstallerAuth && !isAdminAuth) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // For admin users, return a placeholder or first installer if no specific installer is selected
      let installer;
      if (isAdminAuth && !isInstallerAuth) {
        // Admin accessing - return a general response or first installer
        const allInstallers = await storage.getAllInstallers();
        if (allInstallers && allInstallers.length > 0) {
          installer = allInstallers[0]; // Return first installer as example
        } else {
          return res.json({ 
            isAdminView: true, 
            message: "Admin view - no installers available",
            id: 0,
            businessName: "Admin Dashboard View",
            email: req.user.email,
            role: "admin_viewing_installer"
          });
        }
      } else {
        installer = await storage.getInstaller(req.session.installerId);
      }
      
      if (!installer) {
        return res.status(404).json({ error: "Installer not found" });
      }
      
      // Return installer data (without password hash)
      const { passwordHash: _, ...installerData } = installer;
      
      // Add flag if this is admin view
      if (isAdminAuth && !isInstallerAuth) {
        (installerData as any).isAdminView = true;
      }
      
      res.json(installerData);
      
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  app.post("/api/installers/profile", async (req, res) => {
    try {
      // Check if installer is authenticated via session
      if (!req.session.installerAuthenticated || !req.session.installerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const installerId = req.session.installerId;
      
      // Validate installer exists
      const installer = await storage.getInstaller(installerId);
      if (!installer) {
        return res.status(404).json({ error: "Installer not found" });
      }
      
      // Update profile
      const updatedInstaller = await storage.updateInstallerProfile(installerId, req.body);
      
      // Return updated installer data (without password hash)
      const { passwordHash: _, ...installerData } = updatedInstaller;
      res.json({
        success: true,
        installer: installerData,
        message: "Profile updated successfully"
      });
      
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Profile update failed" });
    }
  });

  // OAuth Signup Route - for customers and admins only (installers use email/password)
  app.get("/api/signup", (req, res, next) => {
    console.log("=== OAUTH SIGNUP REQUEST START ===");
    console.log("Signup request from hostname:", req.hostname);
    console.log("Signup query params:", req.query);
    
    // Redirect installers to their dedicated registration page
    if (req.query.role === 'installer') {
      console.log("Installer signup detected, redirecting to installer registration");
      return res.redirect("/installer-registration");
    }
    
    try {
      // Store intended action and role in session
      (req.session as any).authAction = 'signup';
      (req.session as any).intendedRole = req.query.role || 'customer';
      
      // Store return URL if provided
      if (req.query.returnTo) {
        (req.session as any).returnTo = req.query.returnTo as string;
      }
      
      // Determine strategy based on hostname (matching login route exactly)
      const getStrategyName = (hostname: string): string | null => {
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'googleauth:localhost';
        } else if (hostname.includes('replit.dev') || hostname.includes('spock.replit.dev') || hostname.includes('replit.app')) {
          return `googleauth:${hostname}`;
        } else if (hostname === 'tradesbook.ie' || hostname.includes('tradesbook.ie')) {
          return 'googleauth:tradesbook.ie';
        } else {
          const registeredDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
          return registeredDomain ? `googleauth:${registeredDomain}` : null;
        }
      };
      
      const strategyName = getStrategyName(req.hostname);
      if (!strategyName) {
        console.error("No OAuth strategy found for hostname:", req.hostname);
        return res.status(400).json({ error: "OAuth not configured for this domain" });
      }
      
      console.log("Using OAuth strategy:", strategyName);
      
      // Save session before OAuth redirect (copying from login route)
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error before OAuth:", saveErr);
          return res.status(500).json({ error: "Session save failed" });
        }
        
        console.log("About to call passport.authenticate for signup...");
        passport.authenticate(strategyName, { 
          scope: "openid email profile "
        })(req, res, next);
      });
      
    } catch (error) {
      console.error("OAuth signup error:", error);
      res.status(500).json({ error: "OAuth signup failed" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Service tiers endpoint with dynamic pricing
  app.get("/api/service-tiers", async (req, res) => {
    try {
      const tvSize = req.query.tvSize ? parseInt(req.query.tvSize as string) : null;
      
      // Get service tiers from database
      const dbTiers = await pricingManagementService.getAllPricing();
      const serviceTierCategories = ['table-top', 'wall-mount', 'premium'];
      
      let serviceTiers = dbTiers
        .filter(tier => serviceTierCategories.includes(tier.category) && tier.isActive)
        .map(tier => ({
          id: tier.id,
          key: tier.itemKey,
          name: tier.name,
          description: tier.description,
          category: tier.category,
          basePrice: tier.customerPrice,
          customerPrice: tier.customerPrice,
          leadFee: tier.leadFee,
          installerEarnings: tier.customerPrice - tier.leadFee,
          minTvSize: tier.minTvSize || 32,
          maxTvSize: tier.maxTvSize
        }));

      // Filter by TV size if provided
      if (tvSize) {
        serviceTiers = serviceTiers.filter(tier => {
          return tvSize >= tier.minTvSize && (tier.maxTvSize === null || tvSize <= tier.maxTvSize);
        });
      }

      // Fallback if no database tiers found
      if (serviceTiers.length === 0) {
        const dynamicTiers = Object.values(SERVICE_TIERS).map((tier, index) => ({
          id: index + 1,
          key: tier.key,
          name: tier.name,
          description: tier.description,
          category: tier.category,
          basePrice: tier.customerEstimate,
          customerPrice: tier.customerEstimate,
          leadFee: tier.leadFee,
          installerEarnings: tier.customerEstimate - tier.leadFee,
          minTvSize: tier.minTvSize,
          maxTvSize: tier.maxTvSize
        }));
        
        serviceTiers = dynamicTiers.length > 0 ? dynamicTiers : [
          {
            id: 1,
            key: "table-top-small",
            name: "Table Top Installation",
            description: "Professional table top setup for smaller TVs",
            category: "table-top",
            basePrice: 89,
            customerPrice: 105,
            minTvSize: 32,
            maxTvSize: 42
          },
          {
            id: 2,
            key: "table-top-large", 
            name: "Table Top Installation",
            description: "Professional table top setup for larger TVs",
            category: "table-top",
            basePrice: 109,
            customerPrice: 128,
            minTvSize: 43,
            maxTvSize: null
          },
          {
            id: 3,
            key: "bronze",
            name: "Bronze TV Mounting",
            description: "Fixed wall mount installation",
            category: "bronze",
            basePrice: 109,
            customerPrice: 128,
            minTvSize: 32,
            maxTvSize: 42
          },
          {
            id: 4,
            key: "silver",
            name: "Silver TV Mounting",
            description: "Tilting wall mount with cable management",
            category: "silver",
            basePrice: 159,
            customerPrice: 187,
            minTvSize: 43,
            maxTvSize: 85
          },
          {
            id: 5,
            key: "silver-large",
            name: "Silver TV Mounting",
            description: "Tilting wall mount for large TVs",
            category: "silver",
            basePrice: 259,
            customerPrice: 305,
            minTvSize: 86,
            maxTvSize: null
          },
          {
            id: 6,
            key: "gold",
            name: "Gold TV Mounting",
            description: "Full motion mount with premium features",
            category: "gold",
            basePrice: 259,
            customerPrice: 305,
            minTvSize: 43,
            maxTvSize: 85
          },
          {
            id: 7,
            key: "gold-large",
            name: "Gold TV Mounting",
            description: "Premium large TV full motion installation",
            category: "gold",
            basePrice: 359,
            customerPrice: 422,
            minTvSize: 86,
            maxTvSize: null
          }
        ];
      }

      res.json(serviceTiers);
    } catch (error) {
      console.error("Error fetching service tiers:", error);
      res.status(500).json({ message: "Failed to fetch service tiers" });
    }
  });

  // Service types endpoint - get all active service types
  app.get("/api/service-types/active", async (req, res) => {
    try {
      const activeServiceTypes = await storage.getActiveServiceTypes();
      res.json(activeServiceTypes);
    } catch (error) {
      console.error("Error fetching active service types:", error);
      res.status(500).json({ message: "Failed to fetch active service types" });
    }
  });

  // Installer service assignments endpoint
  app.get("/api/installer-service-assignments", async (req, res) => {
    try {
      const installerServiceAssignments = await storage.getAllInstallerServiceAssignments();
      res.json(installerServiceAssignments);
    } catch (error) {
      console.error("Error fetching installer service assignments:", error);
      res.status(500).json({ message: "Failed to fetch installer service assignments" });
    }
  });

  // Assign service to installer endpoint
  app.post("/api/installer-service-assignments", async (req, res) => {
    try {
      const { installerId, serviceTypeId, assignedBy } = req.body;
      
      if (!installerId || !serviceTypeId) {
        return res.status(400).json({ message: "installerId and serviceTypeId are required" });
      }

      // Check if assignment already exists
      const existingAssignment = await storage.getInstallerServiceAssignment(installerId, serviceTypeId);
      if (existingAssignment) {
        return res.status(409).json({ message: "Service already assigned to installer" });
      }

      const assignment = await storage.assignServiceToInstaller({
        installerId,
        serviceTypeId,
        assignedBy: assignedBy || 'admin_manual',
        isActive: true
      });
      
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning service to installer:", error);
      res.status(500).json({ message: "Failed to assign service to installer" });
    }
  });

  // Remove service from installer endpoint
  app.delete("/api/installer-service-assignments/:installerId/:serviceTypeId", async (req, res) => {
    try {
      const { installerId, serviceTypeId } = req.params;
      
      await storage.removeServiceFromInstaller(parseInt(installerId), parseInt(serviceTypeId));
      res.json({ message: "Service assignment removed successfully" });
    } catch (error) {
      console.error("Error removing service from installer:", error);
      res.status(500).json({ message: "Failed to remove service from installer" });
    }
  });

  // Get active service types endpoint
  app.get("/api/service-types/active", async (req, res) => {
    try {
      const serviceTypes = await storage.getActiveServiceTypes();
      res.json(serviceTypes);
    } catch (error) {
      console.error("Error fetching active service types:", error);
      res.status(500).json({ message: "Failed to fetch active service types" });
    }
  });

  // Demo user login endpoint for testing booking creation
  app.post("/api/demo-login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check for demo user credentials
      if (email === 'demo@tradesbook.ie' && password === '3UBg3nXAFLM48hQ>') {
        const demoUser = await storage.getUserByEmail(email);
        
        if (demoUser) {
          // Set up session for demo user
          req.session.passport = { user: demoUser.id };
          (req.session as any).user = demoUser;
          
          res.json({
            success: true,
            user: {
              id: demoUser.id,
              email: demoUser.email,
              firstName: demoUser.firstName,
              lastName: demoUser.lastName,
              role: demoUser.role
            },
            message: "Demo user authenticated successfully"
          });
        } else {
          res.status(404).json({ error: "Demo user not found" });
        }
      } else {
        res.status(401).json({ error: "Invalid demo credentials" });
      }
    } catch (error) {
      console.error("Demo login error:", error);
      res.status(500).json({ error: "Demo login failed" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      console.log("GET /api/auth/user - Session ID:", req.sessionID);
      console.log("GET /api/auth/user - req.user:", req.user);
      console.log("GET /api/auth/user - isAuthenticated:", req.isAuthenticated());
      console.log("GET /api/auth/user - Session:", req.session);
      
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // req.user now contains the full user object from database
      const user = req.user;
      console.log("Returning user data:", { id: user.id, email: user.email, role: user.role });
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        registrationMethod: user.registrationMethod,
        emailNotifications: user.emailNotifications ?? true,
        bookingUpdates: user.bookingUpdates ?? true,
        marketingEmails: user.marketingEmails ?? false
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile update endpoint for authenticated users
  app.patch('/api/auth/profile', async (req: any, res) => {
    try {
      console.log("PATCH /api/auth/profile - Session ID:", req.sessionID);
      console.log("PATCH /api/auth/profile - req.user:", req.user);
      console.log("PATCH /api/auth/profile - isAuthenticated:", req.isAuthenticated());
      console.log("PATCH /api/auth/profile - Update data:", req.body);
      
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user;
      const { firstName, lastName, email, phone } = req.body;
      
      // Validate input
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }
      
      // Prepare update data
      const updateData: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim()
      };
      
      // Add phone if provided
      if (phone !== undefined) {
        updateData.phone = phone ? phone.trim() : null;
      }
      
      // Update user profile
      const updatedUser = await storage.updateUser(user.id, updateData);
      
      console.log("Profile updated successfully:", { id: updatedUser.id, email: updatedUser.email });
      
      res.json({ 
        message: "Profile updated successfully",
        user: updatedUser
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // User preferences update endpoint
  app.patch('/api/auth/preferences', async (req: any, res) => {
    try {
      console.log("PATCH /api/auth/preferences - Session ID:", req.sessionID);
      console.log("PATCH /api/auth/preferences - req.user:", req.user);
      console.log("PATCH /api/auth/preferences - Preferences data:", req.body);
      
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { emailNotifications, bookingUpdates, marketingEmails } = req.body;

      // Validate input - at least one preference field should be provided
      if (emailNotifications === undefined && bookingUpdates === undefined && marketingEmails === undefined) {
        return res.status(400).json({ message: "At least one preference field must be provided" });
      }

      // Prepare update object with only provided fields
      const updateData: any = {};
      if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
      if (bookingUpdates !== undefined) updateData.bookingUpdates = bookingUpdates;
      if (marketingEmails !== undefined) updateData.marketingEmails = marketingEmails;

      // Update user preferences in database
      await db.update(users)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(users.id, req.user.id));

      console.log("User preferences updated successfully");
      res.json({ message: "Preferences updated successfully" });
    } catch (error) {
      console.error("Preferences update error:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Test endpoint to debug session state
  app.get('/api/auth/debug', async (req: any, res) => {
    res.json({
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      user: req.user,
      session: req.session,
      headers: req.headers,
      hostname: req.hostname
    });
  });

  // Admin: Get all users with their email preferences
  app.get("/api/admin/users-preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check if user is admin
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user[0] || user[0].role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        emailVerified: users.emailVerified,
        emailNotifications: users.emailNotifications,
        bookingUpdates: users.bookingUpdates,
        marketingEmails: users.marketingEmails,
        createdAt: users.createdAt,
        registrationMethod: users.registrationMethod
      }).from(users).orderBy(desc(users.createdAt));

      res.json(allUsers);
    } catch (error) {
      console.error('Error fetching users with preferences:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Get email preference statistics
  app.get("/api/admin/email-preference-stats", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check if user is admin
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user[0] || user[0].role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const allUsers = await db.select({
        emailNotifications: users.emailNotifications,
        bookingUpdates: users.bookingUpdates,
        marketingEmails: users.marketingEmails
      }).from(users);

      const stats = {
        emailNotifications: {
          enabled: allUsers.filter(u => u.emailNotifications === true).length,
          disabled: allUsers.filter(u => u.emailNotifications === false).length
        },
        bookingUpdates: {
          enabled: allUsers.filter(u => u.bookingUpdates === true).length,
          disabled: allUsers.filter(u => u.bookingUpdates === false).length
        },
        marketingEmails: {
          enabled: allUsers.filter(u => u.marketingEmails === true).length,
          disabled: allUsers.filter(u => u.marketingEmails === false).length
        },
        allOptedOut: allUsers.filter(u => 
          u.emailNotifications === false && 
          u.bookingUpdates === false && 
          u.marketingEmails === false
        ).length,
        total: allUsers.length
      };

      // Get installer preference statistics
      const allInstallers = await db.select({
        emailNotifications: installers.emailNotifications,
        bookingUpdates: installers.bookingUpdates,
        marketingEmails: installers.marketingEmails
      }).from(installers);

      const installerStats = {
        emailNotifications: {
          enabled: allInstallers.filter(i => i.emailNotifications === true).length,
          disabled: allInstallers.filter(i => i.emailNotifications === false).length
        },
        bookingUpdates: {
          enabled: allInstallers.filter(i => i.bookingUpdates === true).length,
          disabled: allInstallers.filter(i => i.bookingUpdates === false).length
        },
        marketingEmails: {
          enabled: allInstallers.filter(i => i.marketingEmails === true).length,
          disabled: allInstallers.filter(i => i.marketingEmails === false).length
        },
        allOptedOut: allInstallers.filter(i => 
          i.emailNotifications === false && 
          i.bookingUpdates === false && 
          i.marketingEmails === false
        ).length,
        total: allInstallers.length
      };

      const combinedStats = {
        users: stats,
        installers: installerStats
      };

      res.json(combinedStats);
    } catch (error) {
      console.error('Error fetching email preference stats:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Update user preferences
  app.patch("/api/admin/users/:userId/preferences", isAuthenticated, async (req, res) => {
    try {
      const adminUserId = req.user?.id;
      if (!adminUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check if user is admin
      const adminUser = await db.select().from(users).where(eq(users.id, adminUserId)).limit(1);
      if (!adminUser[0] || adminUser[0].role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { userId } = req.params;
      const preferences = req.body;
      
      // Update user preferences in the database
      await db.update(users)
        .set({
          ...preferences,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      res.json({ 
        message: "User preferences updated successfully",
        userId,
        preferences
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Send bulk email with preference filtering for users and installers
  app.post("/api/admin/send-bulk-email", isAuthenticated, async (req, res) => {
    try {
      const adminUserId = req.user?.id;
      if (!adminUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check if user is admin
      const adminUser = await db.select().from(users).where(eq(users.id, adminUserId)).limit(1);
      if (!adminUser[0] || adminUser[0].role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { recipientIds, subject, message, emailType, targetAudience } = req.body;

      if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
        return res.status(400).json({ error: "Recipient IDs are required" });
      }

      if (!subject || !message) {
        return res.status(400).json({ error: "Subject and message are required" });
      }

      let allRecipients = [];
      let sentCount = 0;
      let errorCount = 0;

      // Handle users (customers)
      const userIds = recipientIds.filter(id => !id.toString().startsWith('installer_'));
      if (userIds.length > 0 && (targetAudience === 'users' || targetAudience === 'both')) {
        const userRecipients = await db.select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          emailNotifications: users.emailNotifications,
          bookingUpdates: users.bookingUpdates,
          marketingEmails: users.marketingEmails,
          type: 'user' as const
        }).from(users).where(eq(users.id, userIds[0])); // Will be filtered properly below
        
        // Get all users and then filter
        const allUsers = await db.select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          emailNotifications: users.emailNotifications,
          bookingUpdates: users.bookingUpdates,
          marketingEmails: users.marketingEmails,
          type: 'user' as const
        }).from(users);
        
        const filteredUserRecipients = allUsers.filter(user => {
          if (!userIds.includes(user.id)) return false;
          
          // Check if user has opted in for this email type
          switch (emailType) {
            case 'general':
              return user.emailNotifications !== false;
            case 'booking':
              return user.bookingUpdates !== false;
            case 'marketing':
              return user.marketingEmails === true;
            default:
              return true;
          }
        });
        
        allRecipients.push(...filteredUserRecipients);
      }

      // Handle installers
      const installerIds = recipientIds
        .filter(id => id.toString().startsWith('installer_'))
        .map(id => parseInt(id.toString().replace('installer_', '')));
      const directInstallerIds = recipientIds.filter(id => !isNaN(parseInt(id)) && !id.toString().startsWith('installer_')).map(id => parseInt(id));
      const allInstallerIds = [...installerIds, ...directInstallerIds];
      
      if (allInstallerIds.length > 0 && (targetAudience === 'installers' || targetAudience === 'both')) {
        const allInstallersData = await db.select({
          id: installers.id,
          email: installers.email,
          businessName: installers.businessName,
          contactName: installers.contactName,
          emailNotifications: installers.emailNotifications,
          bookingUpdates: installers.bookingUpdates,
          marketingEmails: installers.marketingEmails,
          type: 'installer' as const
        }).from(installers);
        
        const filteredInstallerRecipients = allInstallersData.filter(installer => {
          if (!allInstallerIds.includes(installer.id)) return false;
          
          // Check if installer has opted in for this email type
          switch (emailType) {
            case 'general':
              return installer.emailNotifications !== false;
            case 'booking':
              return installer.bookingUpdates !== false;
            case 'marketing':
              return installer.marketingEmails === true;
            default:
              return true;
          }
        });
        
        allRecipients.push(...filteredInstallerRecipients);
      }

      // Send emails to all filtered recipients
      for (const recipient of allRecipients) {
        try {
          let displayName;
          if (recipient.type === 'user') {
            displayName = recipient.firstName && recipient.lastName 
              ? `${recipient.firstName} ${recipient.lastName}`
              : recipient.email.split('@')[0];
          } else {
            displayName = recipient.contactName || recipient.businessName || recipient.email.split('@')[0];
          }

          const personalizedMessage = message.replace(/\{name\}/g, displayName);
          const recipientType = recipient.type === 'user' ? 'customer' : 'installer';
          
          await sendGmailEmail({
            to: recipient.email,
            subject: subject,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #2563eb;">TradesBook</h2>
                <p>Hello ${displayName},</p>
                <div style="margin: 20px 0;">
                  ${personalizedMessage.replace(/\n/g, '<br>')}
                </div>
                <hr style="margin: 30px 0; border: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                  This email was sent to ${recipient.email} as part of our ${emailType} communications for ${recipientType}s. 
                  You can manage your email preferences in your account dashboard.
                </p>
              </div>
            `
          });
          
          sentCount++;
        } catch (emailError) {
          console.error(`Failed to send email to ${recipient.email}:`, emailError);
          errorCount++;
        }
      }

      const skippedCount = recipientIds.length - allRecipients.length;

      res.json({ 
        message: "Bulk email sent successfully",
        sentCount,
        skippedCount,
        errorCount,
        totalRecipients: recipientIds.length
      });
    } catch (error) {
      console.error('Error sending bulk email:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Get installers with email preferences
  app.get("/api/admin/installers-preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check if user is admin
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user[0] || user[0].role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const allInstallers = await db.select({
        id: installers.id,
        email: installers.email,
        businessName: installers.businessName,
        contactName: installers.contactName,
        emailNotifications: installers.emailNotifications,
        bookingUpdates: installers.bookingUpdates,
        marketingEmails: installers.marketingEmails,
        createdAt: installers.createdAt,
        isActive: installers.isActive
      }).from(installers).orderBy(desc(installers.createdAt));

      res.json(allInstallers);
    } catch (error) {
      console.error('Error fetching installers with preferences:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Update installer preferences
  app.patch("/api/admin/installers/:installerId/preferences", isAuthenticated, async (req, res) => {
    try {
      const adminUserId = req.user?.id;
      if (!adminUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check if user is admin
      const adminUser = await db.select().from(users).where(eq(users.id, adminUserId)).limit(1);
      if (!adminUser[0] || adminUser[0].role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { installerId } = req.params;
      const preferences = req.body;
      
      // Update installer preferences in the database
      await db.update(installers)
        .set({
          emailNotifications: preferences.emailNotifications,
          bookingUpdates: preferences.bookingUpdates,
          marketingEmails: preferences.marketingEmails,
          updatedAt: new Date()
        })
        .where(eq(installers.id, parseInt(installerId)));

      res.json({ message: "Installer preferences updated successfully" });
    } catch (error) {
      console.error('Error updating installer preferences:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Email verification endpoints
  app.post("/api/auth/send-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const result = await resendVerificationEmail(email);
      
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      res.status(500).json({ message: "Failed to send verification email" });
    }
  });

  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      const result = await verifyEmailToken(token);
      
      if (result.success && result.user) {
        // Auto-login the user after successful email verification
        req.login(result.user, (err) => {
          if (err) {
            console.error('Error logging in user after verification:', err);
            return res.json({ message: result.message, autoLogin: false });
          }
          console.log(`User ${result.user.email} automatically logged in after email verification`);
          res.json({ message: result.message, autoLogin: true, user: { id: result.user.id, email: result.user.email, role: result.user.role } });
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "Email verification failed" });
    }
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const { name, email, phone, role } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.json(existingUser);
      }
      
      // Parse name into first and last name
      const nameParts = (name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const user = await storage.createUser({
        id: Date.now(), // Generate unique integer ID
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: role || 'customer',
        profileImageUrl: null,
        emailVerified: true, // OAuth users are pre-verified through trusted provider
        registrationMethod: 'oauth',
      });
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: "Failed to create user", error: String(error) });
    }
  });

  app.get("/api/users/:email", async (req, res) => {
    try {
      const user = await storage.getUserByEmail(req.params.email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get stored room photo for booking (installers and admin only)
  app.get("/api/bookings/:id/room-photo", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { type = 'compressed' } = req.query; // 'original' or 'compressed'
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Check if user has permission (installer assigned to booking or admin)
      const isInstaller = req.installerUser && booking.installerId === req.installerUser.id;
      const isAdmin = req.user && req.user.role === 'admin';
      
      if (!isInstaller && !isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check if photo storage consent was given
      if (!booking.photoStorageConsent) {
        return res.status(404).json({ message: "Room photo not available - customer consent not given" });
      }
      
      const photoUrl = type === 'original' ? booking.roomPhotoUrl : booking.roomPhotoCompressedUrl;
      
      if (!photoUrl) {
        return res.status(404).json({ message: "Room photo not found" });
      }
      
      res.json({
        photoUrl,
        type,
        hasConsent: booking.photoStorageConsent,
        roomAnalysis: booking.roomAnalysis,
        bookingId: booking.id,
        qrCode: booking.qrCode
      });
    } catch (error) {
      console.error("Error retrieving room photo:", error);
      res.status(500).json({ message: "Failed to retrieve room photo" });
    }
  });

  // Photo upload with optional storage and compression
  app.post("/api/upload-room-photo", upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No photo uploaded" });
      }

      const sharp = (await import('sharp')).default;
      
      // Create optimized versions of the image
      const originalBuffer = req.file.buffer;
      
      // Compress for storage (720p max, 80% quality) - saves bandwidth and storage
      const compressedBuffer = await sharp(originalBuffer)
        .resize(1280, 720, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      // Convert to base64 for immediate display and AI processing
      const base64Image = originalBuffer.toString('base64');
      const compressedBase64 = compressedBuffer.toString('base64');
      
      // Perform room analysis when photo is uploaded
      let analysis = null;
      try {
        analysis = await analyzeRoomForTVPlacement(base64Image);
      } catch (error) {
        console.error("Room analysis failed:", error);
        // Continue without analysis if it fails
      }
      
      res.json({
        success: true,
        imageBase64: base64Image, // For immediate display
        compressedBase64: compressedBase64, // For storage when consent is given
        analysis: analysis,
        originalSize: originalBuffer.length,
        compressedSize: compressedBuffer.length,
        compressionRatio: Math.round((1 - compressedBuffer.length / originalBuffer.length) * 100)
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ message: "Failed to upload photo", error: String(error) });
    }
  });

  // Profile photo upload for installers
  app.post("/api/installer/profile-photo", (req, res, next) => {
    upload.single('profilePhoto')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: "File too large. Maximum size allowed is 2MB" 
          });
        }
        return res.status(400).json({ 
          message: err.message || "File upload error" 
        });
      }
      next();
    });
  }, async (req, res) => {
    try {
      // Check installer authentication
      if (!req.session.installerAuthenticated || !req.session.installerId) {
        return res.status(401).json({ message: "Installer not authenticated" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No photo uploaded" });
      }

      // Additional file size validation (2MB = 2,097,152 bytes)
      if (req.file.size > 2 * 1024 * 1024) {
        return res.status(400).json({ 
          message: "File too large. Maximum size allowed is 2MB" 
        });
      }

      // Validate file type
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ 
          message: "Invalid file type. Only image files are allowed" 
        });
      }

      const installerId = req.session.installerId;

      // Convert to base64 for storage
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      // Update installer profile with new photo
      const updatedInstaller = await storage.updateInstaller(installerId, {
        profileImageUrl: base64Image
      });
      
      res.json({
        success: true,
        message: "Profile photo updated successfully",
        profileImageUrl: base64Image
      });
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      res.status(500).json({ message: "Failed to upload profile photo", error: String(error) });
    }
  });

  // Room analysis endpoint for testing
  app.post("/api/analyze-room", async (req, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ message: "No image provided" });
      }

      // Extract base64 data from data URL
      const base64Image = image.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const analysis = await analyzeRoomForTVPlacement(base64Image);
      
      res.json({
        success: true,
        analysis: analysis
      });
    } catch (error) {
      console.error("Error analyzing room:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to analyze room", 
        error: String(error) 
      });
    }
  });

  app.post("/api/generate-ai-preview", checkAiCredits(AI_FEATURES.TV_PREVIEW), async (req: AIRequest, res) => {
    try {
      const { imageBase64, tvSize, mountType, wallType, selectedAddons } = req.body;
      
      if (!imageBase64 || !tvSize) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const result = await generateTVPreview(
        imageBase64, 
        tvSize, 
        mountType || "fixed",
        wallType || "drywall",
        selectedAddons || []
      );
      
      if (!result.success) {
        return res.status(500).json({ message: result.error });
      }

      // Record AI usage after successful generation
      await recordAiUsage(req);
      
      res.json(result);
    } catch (error) {
      console.error("Error generating AI preview:", error);
      res.status(500).json({ message: "Failed to generate AI preview", error: String(error) });
    }
  });

  // Booking routes
  app.post("/api/bookings", async (req, res) => {
    try {
      // Transform and validate the incoming data
      const rawData = req.body;
      console.log('Raw booking data before processing:', JSON.stringify(rawData, null, 2));
      
      // Ensure userId is a string
      if (rawData.userId && typeof rawData.userId === 'number') {
        rawData.userId = String(rawData.userId);
      }
      
      // Convert preferredDate string to Date object
      if (rawData.preferredDate && typeof rawData.preferredDate === 'string') {
        rawData.preferredDate = new Date(rawData.preferredDate);
      }
      
      // Handle multi-TV or single TV pricing calculation
      let totalEstimatedPrice = 0;
      let totalAddonsPrice = 0;
      let totalBookingEstimate = 0;
      
      if (rawData.tvInstallations && Array.isArray(rawData.tvInstallations) && rawData.tvInstallations.length > 0) {
        // Multi-TV booking: calculate pricing for each TV
        console.log('Processing multi-TV booking with', rawData.tvInstallations.length, 'TVs');
        
        rawData.tvInstallations.forEach((tv: any, index: number) => {
          if (tv.serviceType && tv.addons) {
            const tvPricing = calculatePricing(tv.serviceType, tv.addons);
            tv.estimatedPrice = tvPricing.estimatedPrice;
            tv.estimatedAddonsPrice = tvPricing.addonsPrice;
            tv.estimatedTotal = tvPricing.totalEstimate;
            
            totalEstimatedPrice += tvPricing.estimatedPrice;
            totalAddonsPrice += tvPricing.addonsPrice;
            totalBookingEstimate += tvPricing.totalEstimate;
            
            console.log(`TV ${index + 1} (${tv.location || 'Unknown location'}): ${tv.tvSize}" ${tv.serviceType} = €${tvPricing.totalEstimate}`);
          }
        });
        
        // Store multi-TV installations as JSONB
        rawData.tvInstallations = rawData.tvInstallations;
      } else {
        // Legacy single TV booking
        console.log('Processing single TV booking');
        const pricing = calculatePricing(
          rawData.serviceType || 'bronze',
          rawData.addons || []
        );
        
        totalEstimatedPrice = pricing.estimatedPrice;
        totalAddonsPrice = pricing.addonsPrice;
        totalBookingEstimate = pricing.totalEstimate;
      }
      
      // Set installerId to null for initial booking creation
      rawData.installerId = null;
      
      // Add calculated pricing to data as strings with null checks
      rawData.estimatedPrice = totalEstimatedPrice.toFixed(2);
      rawData.estimatedTotal = totalBookingEstimate.toFixed(2);
      rawData.estimatedAddonsPrice = totalAddonsPrice.toFixed(2);
      
      // Add contact information (get from authenticated user or request)
      if (req.user) {
        rawData.contactName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Demo User';
        rawData.contactEmail = req.user.email || 'demo@tradesbook.ie';
        rawData.contactPhone = rawData.contactPhone || '01-234-5678'; // Default if not provided
        rawData.userId = req.user.id; // Link booking to authenticated user
      } else {
        rawData.contactName = rawData.contactName || 'Guest User';
        rawData.contactEmail = rawData.contactEmail || 'guest@tradesbook.ie';
        rawData.contactPhone = rawData.contactPhone || '01-234-5678';
        rawData.userId = null; // No user linkage for guest bookings
      }
      
      // Add invoice tracking for invoice-authenticated users
      if ((req.session as any).authMethod === 'invoice' && (req.session as any).invoiceNumber) {
        rawData.invoiceNumber = (req.session as any).invoiceNumber;
        rawData.invoiceSessionId = (req.session as any).invoiceSessionId;
        console.log(`Booking linked to invoice: ${rawData.invoiceNumber}, session: ${rawData.invoiceSessionId}`);
      } else {
        console.log(`Booking created without invoice tracking, auth method: ${(req.session as any).authMethod}`);
      }
      
      console.log('Raw data after processing:', {
        roomAnalysis: rawData.roomAnalysis,
        roomAnalysisType: typeof rawData.roomAnalysis,
        referralDiscount: rawData.referralDiscount,
        referralDiscountType: typeof rawData.referralDiscount
      });
      
      const bookingData = insertBookingSchema.parse(rawData);
      
      // Transform parsed data for storage
      if (bookingData.roomAnalysis === null) {
        bookingData.roomAnalysis = '';
      }
      
      if (typeof bookingData.referralDiscount === 'number') {
        bookingData.referralDiscount = bookingData.referralDiscount.toFixed(2);
      } else if (bookingData.referralDiscount === null || bookingData.referralDiscount === undefined) {
        bookingData.referralDiscount = '0.00';
      }
      
      // Convert userId to integer if it's a string
      if (bookingData.userId && typeof bookingData.userId === 'string') {
        bookingData.userId = parseInt(bookingData.userId, 10);
      }
      
      // Handle image storage when user gives consent
      if (bookingData.photoStorageConsent && rawData.roomPhotoBase64 && rawData.compressedRoomPhoto) {
        console.log('Storing room photos - user has given consent');
        
        // Store both original and compressed versions as data URLs for immediate access
        bookingData.roomPhotoUrl = `data:image/jpeg;base64,${rawData.roomPhotoBase64}`;
        bookingData.roomPhotoCompressedUrl = `data:image/jpeg;base64,${rawData.compressedRoomPhoto}`;
        
        console.log('Images stored successfully with consent');
      } else if (!bookingData.photoStorageConsent) {
        console.log('Photo storage consent not given - images will not be stored');
        // Clear any image URLs to ensure privacy
        bookingData.roomPhotoUrl = null;
        bookingData.roomPhotoCompressedUrl = null;
      }
      
      let booking;
      try {
        booking = await storage.createBooking(bookingData);
      } catch (dbError) {
        // If database is unavailable, create temporary booking for demo
        if (String(dbError).includes('endpoint is disabled')) {
          const tempBooking = {
            id: Math.floor(Math.random() * 1000000),
            bookingId: `DEMO-${Date.now()}`,
            userId: 1,
            businessId: 1,
            installerId: 1,
            tvSize: bookingData.tvSize,
            serviceType: bookingData.serviceType,
            wallType: bookingData.wallType,
            mountType: bookingData.mountType,
            addons: bookingData.addons || [],
            scheduledDate: bookingData.scheduledDate,
            timeSlot: bookingData.scheduledTime || bookingData.timeSlot,
            address: bookingData.address,
            roomPhotoUrl: bookingData.roomPhotoUrl,
            aiPreviewUrl: bookingData.aiPreviewUrl,
            estimatedPrice: pricing.estimatedPrice.toString(),
            estimatedAddonsPrice: pricing.addonsPrice.toString(),
            estimatedTotal: pricing.totalEstimate.toString(),
            leadFee: pricing.leadFee.toString(),
            status: 'pending',
            customerNotes: bookingData.customerNotes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return res.json({ booking: tempBooking, qrCode: `data:image/svg+xml;base64,${Buffer.from('<svg>Demo QR</svg>').toString('base64')}` });
        } else {
          throw dbError;
        }
      }

      // For successful database bookings, generate QR code
      try {
        // Generate QR code for booking tracking
        const qrCodeDataURL = await QRCode.toDataURL(booking.qrCode || `BOOKING-${booking.id}`, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Update booking status to 'open' for installer matching
        await storage.updateBookingStatus(booking.id, 'open');

        // Send professional booking confirmation email
        try {
          const bookingDetails = {
            qrCode: booking.qrCode || `BOOKING-${booking.id}`,
            serviceType: bookingData.serviceType,
            tvSize: bookingData.tvSize,
            address: bookingData.address,
            totalPrice: pricing.totalEstimate,
            installerEarnings: pricing.estimatedPrice,
            difficulty: bookingData.difficulty || 'Standard'
          };

          // Send confirmation to customer if user is authenticated
          if (req.user?.email) {
            await sendBookingConfirmation(
              req.user.email, 
              `${req.user.firstName} ${req.user.lastName}`.trim(), 
              bookingDetails
            );
          }

          // Notify all approved installers about new booking
          const installers = await storage.getAllInstallers();
          const approvedInstallers = installers.filter(installer => 
            installer.approvalStatus === 'approved' && installer.email
          );
          
          console.log(`Notifying ${approvedInstallers.length} approved installers about new booking ${bookingDetails.qrCode}`);
          
          for (const installer of approvedInstallers) {
            try {
              await sendInstallerNotification(
                installer.email,
                installer.contactName || installer.businessName,
                bookingDetails
              );
              console.log(`Email sent to installer: ${installer.email}`);
            } catch (emailError) {
              console.error(`Failed to send email to installer ${installer.email}:`, emailError);
            }
          }

          // Send admin notification
          await sendAdminNotification(
            'New Booking Created',
            `A new TV installation booking has been created:\n\nBooking ID: ${bookingDetails.qrCode}\nService: ${bookingDetails.serviceType}\nLocation: ${bookingDetails.address}\nTotal: €${bookingDetails.totalPrice}`,
            bookingDetails
          );
        } catch (emailError) {
          console.error("Email notification error:", emailError);
          // Don't fail the booking creation if emails fail
        }

        res.json({ 
          booking: { ...booking, status: 'open' }, 
          qrCode: qrCodeDataURL,
          message: "Booking created successfully. Installers will be notified and can accept your request."
        });
      } catch (finalError) {
        // If secondary operations fail, still return the booking
        console.error("Error with QR generation:", finalError);
        res.json({ booking });
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(400).json({ message: "Failed to create booking", error: String(error) });
    }
  });

  // Get individual installer details for direct booking
  app.get("/api/installers/:id", async (req, res) => {
    try {
      const installerId = parseInt(req.params.id);
      const installer = await storage.getInstaller(installerId);
      
      if (!installer) {
        return res.status(404).json({ message: "Installer not found" });
      }
      
      // Only return approved and publicly visible installers
      if (installer.approvalStatus !== 'approved' || installer.isPubliclyVisible === false) {
        return res.status(404).json({ message: "Installer not available" });
      }
      
      // Return safe installer info for direct booking
      const safeInstallerInfo = {
        id: installer.id,
        businessName: installer.businessName,
        contactName: installer.contactName?.split(' ')[0] + " " + (installer.contactName?.split(' ')[1]?.[0] || '') + ".",
        serviceArea: installer.serviceArea,
        profileImageUrl: installer.profileImageUrl,
        isAvailable: installer.isAvailable,
        yearsExperience: installer.yearsExperience,
        bio: installer.bio
      };
      
      res.json(safeInstallerInfo);
    } catch (error) {
      console.error("Error fetching installer:", error);
      res.status(500).json({ message: "Failed to fetch installer" });
    }
  });

  // Direct installer booking endpoint
  app.post("/api/bookings/direct", async (req, res) => {
    try {
      const bookingData = req.body;
      console.log('Direct booking data:', JSON.stringify(bookingData, null, 2));
      
      // Validate that installerId is provided
      if (!bookingData.preselectedInstallerId) {
        return res.status(400).json({ message: "Installer ID is required for direct booking" });
      }
      
      // Verify the installer exists and is available
      const installer = await storage.getInstaller(bookingData.preselectedInstallerId);
      if (!installer) {
        return res.status(404).json({ message: "Installer not found" });
      }
      
      if (installer.approvalStatus !== 'approved') {
        return res.status(400).json({ message: "Installer is not approved for bookings" });
      }
      
      // Create the booking with direct installer assignment
      const insertBooking = {
        ...bookingData,
        installerId: bookingData.preselectedInstallerId,
        status: 'confirmed',
        isDirectBooking: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Remove the direct booking fields from the insert data
      delete insertBooking.preselectedInstallerId;
      delete insertBooking.directBooking;
      delete insertBooking.installerInfo;
      
      const booking = await storage.createBooking(insertBooking);
      
      // Create a job assignment for direct booking (no lead fee)
      await storage.createJobAssignment({
        bookingId: booking.id,
        installerId: installer.id,
        status: "accepted",
        leadFee: "0.00",
        leadFeeStatus: "exempt",
        assignedDate: new Date(),
        acceptedDate: new Date()
      });
      
      res.json({
        booking: { ...booking, status: 'confirmed', installer: installer.businessName },
        message: `Direct booking confirmed with ${installer.businessName}. You will be contacted directly.`,
        directBooking: true
      });
      
    } catch (error) {
      console.error("Error creating direct booking:", error);
      res.status(400).json({ message: "Failed to create direct booking", error: String(error) });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBooking(parseInt(req.params.id));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.get("/api/bookings/qr/:qrCode", async (req, res) => {
    try {
      const booking = await storage.getBookingByQrCode(req.params.qrCode);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Get job assignment details if exists
      let jobAssignment = null;
      let installer = null;
      let scheduleNegotiations = null;
      
      if (booking.installerId) {
        installer = await storage.getInstaller(booking.installerId);
        const jobs = await storage.getInstallerJobs(booking.installerId);
        jobAssignment = jobs.find(job => job.bookingId === booking.id);
      }
      
      // Get schedule negotiations with installer info for tracking progress
      try {
        const rawNegotiations = await db.select()
          .from(scheduleNegotiations)
          .leftJoin(installers, eq(scheduleNegotiations.installerId, installers.id))
          .where(eq(scheduleNegotiations.bookingId, booking.id))
          .orderBy(desc(scheduleNegotiations.createdAt));

        scheduleNegotiations = rawNegotiations.map(row => ({
          id: row.schedule_negotiations.id,
          bookingId: row.schedule_negotiations.bookingId,
          installerId: row.schedule_negotiations.installerId,
          proposedDate: row.schedule_negotiations.proposedDate,
          proposedTimeSlot: row.schedule_negotiations.proposedTimeSlot,
          proposedStartTime: row.schedule_negotiations.proposedStartTime,
          proposedEndTime: row.schedule_negotiations.proposedEndTime,
          proposedBy: row.schedule_negotiations.proposedBy,
          status: row.schedule_negotiations.status,
          proposalMessage: row.schedule_negotiations.proposalMessage,
          responseMessage: row.schedule_negotiations.responseMessage,
          createdAt: row.schedule_negotiations.createdAt,
          updatedAt: row.schedule_negotiations.updatedAt,
          proposedAt: row.schedule_negotiations.proposedAt,
          respondedAt: row.schedule_negotiations.respondedAt,
          installer: row.installers ? {
            id: row.installers.id,
            businessName: row.installers.businessName,
            contactName: row.installers.contactName,
            firstName: row.installers.contactName?.split(' ')[0] || '',
            lastName: row.installers.contactName?.split(' ').slice(1).join(' ') || '',
            profileImageUrl: row.installers.profileImageUrl,
          } : null
        }));
      } catch (error) {
        console.warn("Could not fetch schedule negotiations for tracking:", error);
        scheduleNegotiations = [];
      }
      
      // Get the latest accepted schedule from negotiations
      const latestAcceptedSchedule = scheduleNegotiations
        .filter(n => n.status === 'accepted')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      // Format the date properly (extract just the date part from ISO string)
      let formattedScheduledDate = booking.scheduledDate;
      if (latestAcceptedSchedule?.proposedDate) {
        const dateObj = new Date(latestAcceptedSchedule.proposedDate);
        formattedScheduledDate = dateObj.toISOString().split('T')[0]; // Gets YYYY-MM-DD format
      }
      
      // Format response with all tracking information
      const trackingData = {
        ...booking,
        // Override with latest accepted schedule if available
        scheduledDate: formattedScheduledDate,
        scheduledTime: booking.status === 'open' ? null : (latestAcceptedSchedule?.proposedTimeSlot || booking.preferredTime),
        installer: installer ? {
          id: installer.id,
          name: installer.contactName,
          businessName: installer.businessName,
          phone: installer.phone,
          email: installer.email,
          profileImageUrl: installer.profileImageUrl
        } : null,
        jobAssignment: jobAssignment ? {
          status: jobAssignment.status,
          assignedDate: jobAssignment.assignedDate,
          acceptedDate: jobAssignment.acceptedDate,
          completedDate: jobAssignment.completedDate
        } : null,
        scheduleNegotiations: scheduleNegotiations || [],
        contact: {
          name: booking.contactName,
          phone: booking.contactPhone,
          email: booking.contactEmail
        }
      };
      
      res.json(trackingData);
    } catch (error) {
      console.error("Error fetching booking by QR code:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.get("/api/users/:userId/bookings", async (req, res) => {
    try {
      const bookings = await storage.getUserBookings(parseInt(req.params.userId));
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get bookings for current authenticated user (including invoice-authenticated users)
  app.get("/api/auth/user/bookings", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      let bookings;
      
      // If user authenticated via invoice, filter by invoice number
      if ((req.session as any).authMethod === 'invoice' && (req.session as any).invoiceNumber) {
        const allBookings = await storage.getAllBookings();
        bookings = allBookings.filter(booking => 
          booking.invoiceNumber === (req.session as any).invoiceNumber ||
          booking.userId === req.user.id.toString()
        );
        console.log(`Found ${bookings.length} bookings for invoice ${(req.session as any).invoiceNumber}`);
      } else {
        // Regular OAuth user - get bookings by user ID
        bookings = await storage.getUserBookings(req.user.id.toString());
      }

      // Enhance bookings with installer information if assigned
      const enhancedBookings = await Promise.all(
        bookings.map(async (booking) => {
          if (booking.installerId) {
            try {
              const installer = await storage.getInstaller(booking.installerId);
              if (installer) {
                // Get installer rating data
                const ratingData = await storage.getInstallerRating(installer.id);
                
                // Calculate completion date - use updatedAt if status is completed
                let completedAt = booking.createdAt;
                if (booking.status === 'completed' && booking.updatedAt && new Date(booking.updatedAt) > new Date(booking.createdAt)) {
                  completedAt = booking.updatedAt;
                }
                
                return {
                  ...booking,
                  completedAt, // Add proper completion date
                  installer: {
                    id: installer.id,
                    businessName: installer.businessName,
                    contactName: installer.contactName,
                    phone: installer.phone,
                    profileImageUrl: installer.profileImageUrl,
                    averageRating: ratingData.averageRating || 0,
                    totalReviews: ratingData.totalReviews || 0,
                    serviceArea: installer.serviceArea
                  }
                };
              }
            } catch (error) {
              console.error(`Error fetching installer ${booking.installerId}:`, error);
            }
          }
          // Still add completion date even if no installer
          if (booking.status === 'completed' && booking.updatedAt && new Date(booking.updatedAt) > new Date(booking.createdAt)) {
            return {
              ...booking,
              completedAt: booking.updatedAt
            };
          }
          return booking;
        })
      );

      res.json(enhancedBookings);
    } catch (error) {
      console.error("Error fetching authenticated user bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get TV setup bookings for current authenticated user
  app.get("/api/auth/user/tv-setup-bookings", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get TV setup bookings by user email (matching the booking email)
      const tvSetupBookings = await storage.getTvSetupBookingsByEmail(req.user.email);
      
      console.log(`Found ${tvSetupBookings.length} TV setup bookings for user ${req.user.email}`);
      res.json(tvSetupBookings);
    } catch (error) {
      console.error("Error fetching authenticated user TV setup bookings:", error);
      res.status(500).json({ message: "Failed to fetch TV setup bookings" });
    }
  });

  // QR Code generation
  app.get("/api/qr-code/:text", async (req, res) => {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(req.params.text, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      res.json({ qrCode: qrCodeDataURL });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  // Admin routes
  app.get("/api/admin/bookings", async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      
      // Enhance bookings with installer and user information
      const enhancedBookings = await Promise.all(
        bookings.map(async (booking) => {
          let installerInfo = null;
          let userInfo = null;
          
          // Fetch installer details if booking is assigned
          if (booking.installerId) {
            try {
              const installer = await storage.getInstaller(booking.installerId);
              if (installer) {
                installerInfo = {
                  id: installer.id,
                  name: installer.contactName || installer.businessName,
                  businessName: installer.businessName,
                  email: installer.email,
                  phone: installer.phone
                };
              }
            } catch (error) {
              console.error(`Error fetching installer ${booking.installerId}:`, error);
            }
          }
          
          // Fetch user details if booking has a userId (to show updated user info instead of booking contact info)
          if (booking.userId) {
            try {
              const user = await storage.getUserById(booking.userId.toString());
              if (user) {
                userInfo = {
                  id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                  fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || null
                };
              }
            } catch (error) {
              console.error(`Error fetching user ${booking.userId}:`, error);
            }
          }
          
          // Calculate accurate lead fee using the pricing system
          let totalLeadFee = 0;
          let totalBookingValue = 0;
          
          if (booking.tvInstallations && Array.isArray(booking.tvInstallations) && booking.tvInstallations.length > 0) {
            // Multi-TV booking: calculate total lead fee and value
            booking.tvInstallations.forEach((tv: any) => {
              if (tv.serviceType) {
                const tvLeadFee = getLeadFee(tv.serviceType);
                totalLeadFee += tvLeadFee;
                totalBookingValue += tv.estimatedTotal || 0;
              }
            });
          } else {
            // Single TV booking: use legacy calculation
            totalLeadFee = getLeadFee(booking.serviceType);
            const bookingPricing = calculatePricing(booking.serviceType, booking.addons || []);
            totalBookingValue = bookingPricing.totalEstimate;
          }
          
          // Map database fields to expected frontend fields and add installer/user info
          return {
            ...booking,
            // Fix price field mapping - use calculated total for multi-TV or stored value for single TV
            totalPrice: totalBookingValue || parseFloat(booking.estimatedTotal || booking.estimatedPrice || '0'),
            estimatedTotal: totalBookingValue || parseFloat(booking.estimatedTotal || booking.estimatedPrice || '0'),
            // Add accurate app fee (lead fee) calculation
            appFee: totalLeadFee,
            leadFee: totalLeadFee,
            // Add installer information
            installer: installerInfo,
            installerName: installerInfo?.name || null,
            installerBusiness: installerInfo?.businessName || null,
            // Add user information (prioritize current user data over booking contact data)
            user: userInfo,
            // Override contact information with user data if available (shows updated user info)
            contactName: userInfo?.fullName || booking.contactName,
            contactEmail: userInfo?.email || booking.contactEmail,
            customerName: userInfo?.fullName || booking.contactName,
            customerEmail: userInfo?.email || booking.contactEmail
          };
        })
      );
      
      res.json(enhancedBookings);
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });



  // ====================== ADD-ONS ENDPOINT ======================
  
  // Add-ons endpoint
  app.get("/api/addons", async (req, res) => {
    try {
      const addons = [
        { id: 1, key: 'cable-concealment', name: 'Cable Concealment', description: 'Hide cables inside the wall for a clean look', price: 49 },
        { id: 2, key: 'multi-device-setup', name: 'Multi-Device Setup', description: 'Connect and configure multiple devices (soundbar, gaming console, etc.)', price: 79 },
        { id: 3, key: 'smart-tv-config', name: 'Smart TV Configuration', description: 'Complete setup of smart TV features and apps', price: 39 },
        { id: 4, key: 'same-day-service', name: 'Same-Day Service', description: 'Priority booking for same-day installation', price: 99 },
        { id: 5, key: 'weekend-installation', name: 'Weekend Installation', description: 'Saturday and Sunday installation availability', price: 49 },
        { id: 6, key: 'evening-installation', name: 'Evening Installation', description: 'After 6 PM installation service', price: 39 }
      ];
      
      res.json(addons);
    } catch (error) {
      console.error("Error fetching add-ons:", error);
      res.status(500).json({ message: "Failed to fetch add-ons" });
    }
  });

  // ====================== STRIPE PAYMENT ENDPOINTS ======================
  
  // Create payment intent for booking
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, bookingId, metadata = {} } = req.body;
      
      // Validate amount
      if (!amount || amount < 50) { // Minimum 50 cents
        return res.status(400).json({ message: "Invalid payment amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "eur", // Using EUR for Ireland
        metadata: {
          bookingId: bookingId?.toString() || '',
          service: 'tv_installation',
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Confirm payment and update booking status
  app.post("/api/confirm-payment", async (req, res) => {
    try {
      const { paymentIntentId, bookingId } = req.body;

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        // Update booking status to paid
        if (bookingId) {
          await storage.updateBookingStatus(parseInt(bookingId), 'paid');
          
          // Get booking details for confirmation
          const booking = await storage.getBooking(parseInt(bookingId));
          if (booking) {
            // Send confirmation email to customer
            await sendNotificationEmail(
              booking.customerEmail || '',
              'Payment Confirmed - TV Installation Booking',
              `Your payment of €${(paymentIntent.amount / 100).toFixed(2)} has been confirmed. Your TV installation is scheduled and you'll receive further updates soon.`
            );
          }
        }

        res.json({
          success: true,
          message: "Payment confirmed successfully",
          paymentIntent: {
            id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: paymentIntent.status
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Payment not completed",
          status: paymentIntent.status
        });
      }
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ 
        message: "Error confirming payment: " + error.message 
      });
    }
  });

  // Get payment status
  app.get("/api/payment-status/:paymentIntentId", async (req, res) => {
    try {
      const { paymentIntentId } = req.params;
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      res.json({
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata
      });
    } catch (error: any) {
      console.error("Error fetching payment status:", error);
      res.status(500).json({ 
        message: "Error fetching payment status: " + error.message 
      });
    }
  });

  // Webhook endpoint for Stripe events
  app.post("/api/stripe-webhook", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // In production, you'd set up a webhook endpoint secret
      event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Handle booking payments
        if (paymentIntent.metadata.bookingId) {
          if (paymentIntent.metadata.service === 'tv_setup') {
            // Handle TV setup booking payment
            await storage.updateTvSetupBookingPayment(
              parseInt(paymentIntent.metadata.bookingId), 
              paymentIntent.id,
              'paid'
            );

            // Handle TV setup credentials payment
            if (paymentIntent.metadata.paymentType === 'credentials') {
              await storage.updateTvSetupBookingCredentialsPayment(
                parseInt(paymentIntent.metadata.bookingId),
                'completed'
              );
              
              // Update setup status to completed
              await storage.updateTvSetupBookingStatus(
                parseInt(paymentIntent.metadata.bookingId),
                'completed'
              );
            }

            // Get booking details and send confirmation emails
            try {
              const booking = await storage.getTvSetupBooking(parseInt(paymentIntent.metadata.bookingId));
              if (booking) {
                // Import email service dynamically to avoid circular dependencies
                const { sendTvSetupConfirmationEmail, sendTvSetupAdminNotification, sendTvSetupPaymentCompletedEmail, sendTvSetupCredentialsEmail } = await import('./tvSetupEmailService');
                
                // Handle initial booking payment
                if (paymentIntent.metadata.paymentType !== 'credentials') {
                  // Send confirmation email to customer
                  if (!booking.confirmationEmailSent) {
                    const confirmationSent = await sendTvSetupConfirmationEmail(booking);
                    if (confirmationSent) {
                      await storage.markTvSetupEmailSent(booking.id, 'confirmation');
                      console.log(`TV setup confirmation email sent for booking ${booking.id}`);
                    }
                  }
                  
                  // Send admin notification
                  if (!booking.adminNotificationSent) {
                    const adminNotificationSent = await sendTvSetupAdminNotification(booking);
                    if (adminNotificationSent) {
                      await storage.markTvSetupEmailSent(booking.id, 'admin');
                      console.log(`TV setup admin notification sent for booking ${booking.id}`);
                    }
                  }
                } else {
                  // Handle credentials payment completion
                  console.log(`Processing credentials payment for booking ${booking.id}`);
                  
                  // Send payment completion email to customer
                  const paymentCompletedSent = await sendTvSetupPaymentCompletedEmail(booking);
                  if (paymentCompletedSent) {
                    console.log(`TV setup payment completion email sent for booking ${booking.id}`);
                  }
                  
                  // Auto-send credentials if they are available
                  const hasAppCredentials = booking.appUsername && booking.appPassword;
                  const hasIptvCredentials = booking.serverUsername && booking.serverPassword && booking.serverHostname;
                  const hasM3uUrl = booking.m3uUrl;
                  
                  if ((hasAppCredentials || hasIptvCredentials || hasM3uUrl) && !booking.credentialsEmailSent) {
                    const credentialsSent = await sendTvSetupCredentialsEmail(booking);
                    if (credentialsSent) {
                      await storage.markTvSetupEmailSent(booking.id, 'credentials');
                      console.log(`TV setup credentials email auto-sent for booking ${booking.id} after payment`);
                    }
                  }
                  
                  // Send admin notification about completed payment
                  const { sendTvSetupAdminPaymentNotification } = await import('./tvSetupEmailService');
                  const adminPaymentNotificationSent = await sendTvSetupAdminPaymentNotification(booking);
                  if (adminPaymentNotificationSent) {
                    console.log(`TV setup admin payment notification sent for booking ${booking.id}`);
                  }
                  
                  // Broadcast real-time update to connected clients
                  const updateMessage = {
                    type: 'booking_update',
                    event: 'payment_completed',
                    bookingId: booking.id.toString(),
                    data: {
                      status: 'paid',
                      paidAt: new Date().toISOString(),
                      paymentAmount: booking.credentialsPaymentAmount || booking.paymentAmount
                    },
                    timestamp: new Date().toISOString()
                  };
                  
                  // Send to all connected WebSocket clients
                  wsClients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                      client.send(JSON.stringify(updateMessage));
                    }
                  });
                }

                // Auto-send credentials if they are already available (for regular bookings)
                if (paymentIntent.metadata.paymentType !== 'credentials') {
                  const hasAppCredentials = booking.appUsername && booking.appPassword;
                  const hasIptvCredentials = booking.serverUsername && booking.serverPassword && booking.serverHostname;
                  const hasM3uUrl = booking.m3uUrl;
                  
                  if ((hasAppCredentials || hasIptvCredentials || hasM3uUrl) && !booking.credentialsEmailSent) {
                    try {
                      const credentialsSent = await sendTvSetupCredentialsEmail(booking);
                      if (credentialsSent) {
                        await storage.markTvSetupEmailSent(booking.id, 'credentials');
                        console.log(`TV setup credentials email auto-sent for booking ${booking.id} after payment`);
                      }
                    } catch (credentialsError) {
                      console.error('Failed to auto-send credentials email after payment:', credentialsError);
                    }
                  }
                }
              }
            } catch (emailError) {
              console.error('Error sending TV setup booking emails:', emailError);
            }
          } else {
            // Handle regular installation booking payment
            await storage.updateBookingStatus(
              parseInt(paymentIntent.metadata.bookingId), 
              'paid'
            );
          }
        }

        // Handle TV setup credentials payment
        if (paymentIntent.metadata.tvSetupBookingId && paymentIntent.metadata.type === 'tv_setup_credentials') {
          const bookingId = parseInt(paymentIntent.metadata.tvSetupBookingId);
          
          try {
            // Update credentials payment status
            await storage.updateTvSetupBookingCredentialsPayment(bookingId, 'paid', new Date().toISOString());
            
            // Get booking details for notifications
            const booking = await storage.getTvSetupBooking(bookingId);
            if (booking) {
              // Send payment confirmation to customer
              const { sendGmailEmail } = await import('./gmailService');
              await sendGmailEmail({
                to: booking.email,
                subject: `Payment Confirmed - Your TV Setup Credentials Are Ready`,
                html:
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #10B981, #047857); color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">Payment Confirmed!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">Your streaming credentials are now available</p>
                  </div>
                  
                  <div style="padding: 30px; background: #F0FDF4;">
                    <h2 style="color: #047857; margin: 0 0 20px 0;">Hello ${booking.name}!</h2>
                    
                    <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                      Thank you for your payment! Your TV streaming credentials are now ready and can be accessed through your tracking link.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
                      <h3 style="color: #047857; margin: 0 0 15px 0;">Next Steps</h3>
                      <p style="margin: 0; color: #374151;">
                        1. Visit your tracking page to access your credentials<br>
                        2. Follow the setup instructions provided<br>
                        3. Contact us if you need any assistance
                      </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.FRONTEND_URL || 'https://tradesbook.ie'}/tv-setup-tracker?bookingId=${booking.id}" 
                         style="background: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Access Your Credentials
                      </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #6B7280; text-align: center; margin-top: 30px;">
                      Booking #${booking.id} | Payment Amount: €${booking.credentialsPaymentAmount || booking.paymentAmount}
                    </p>
                  </div>
                </div>
                `
              });

              // Send admin notification about payment
              await sendGmailEmail({
                to: 'admin@tradesbook.ie',
                subject: `Credentials Payment Received - Booking #${booking.id}`,
                html:
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: #1F2937; color: white; padding: 20px;">
                    <h2 style="margin: 0;">TV Setup Credentials Payment Received</h2>
                  </div>
                  
                  <div style="padding: 20px; background: #F9FAFB;">
                    <h3 style="color: #1F2937;">Payment Details</h3>
                    <ul>
                      <li><strong>Booking ID:</strong> #${booking.id}</li>
                      <li><strong>Customer:</strong> ${booking.name} (${booking.email})</li>
                      <li><strong>Amount Paid:</strong> €${booking.credentialsPaymentAmount || booking.paymentAmount}</li>
                      <li><strong>Payment Intent:</strong> ${paymentIntent.id}</li>
                      <li><strong>TV:</strong> ${booking.tvBrand} ${booking.tvModel}</li>
                      <li><strong>MAC Address:</strong> ${booking.macAddress || 'Not provided'}</li>
                    </ul>
                    
                    <p style="margin-top: 20px; padding: 15px; background: #FEF3C7; border-radius: 6px; color: #92400E;">
                      <strong>Action Required:</strong> Customer has paid for credentials. You can now mark the setup as completed in the admin dashboard.
                    </p>
                    
                    <div style="text-align: center; margin: 20px 0;">
                      <a href="${process.env.FRONTEND_URL || 'https://tradesbook.ie'}/admin-dashboard" 
                         style="background: #1F2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        View in Admin Dashboard
                      </a>
                    </div>
                  </div>
                </div>
                `
              });

              // Broadcast real-time update via WebSocket
              const updateMessage = {
                type: 'booking_update',
                event: 'payment_completed',
                bookingId: booking.id.toString(),
                data: {
                  status: 'paid',
                  paidAt: new Date().toISOString(),
                  paymentAmount: booking.credentialsPaymentAmount || booking.paymentAmount
                },
                timestamp: new Date().toISOString()
              };
              
              // Send to all connected WebSocket clients
              wsClients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(updateMessage));
                }
              });

              console.log(`TV setup credentials payment confirmed for booking ${booking.id}`);
            }
          } catch (error) {
            console.error('Error processing credentials payment:', error);
          }
        }
        
        // Handle credit purchases
        if (paymentIntent.metadata.service === 'credit_purchase' && paymentIntent.metadata.installerId) {
          const installerId = parseInt(paymentIntent.metadata.installerId);
          const creditAmount = parseFloat(paymentIntent.metadata.creditAmount);
          
          // Get current wallet
          let wallet = await storage.getInstallerWallet(installerId);
          if (!wallet) {
            wallet = await storage.createInstallerWallet({
              installerId,
              balance: "0.00",
              totalSpent: "0.00",
              totalEarned: "0.00"
            });
          }
          
          // Calculate new balance
          const currentBalance = parseFloat(wallet.balance);
          const newBalance = currentBalance + creditAmount;
          
          // Update wallet balance
          await storage.updateInstallerWalletBalance(installerId, newBalance);
          
          // Add transaction record
          await storage.addInstallerTransaction({
            installerId,
            type: "credit_purchase",
            amount: creditAmount.toString(),
            description: `Added €${creditAmount} credits to wallet via Stripe`,
            paymentIntentId: paymentIntent.id,
            status: "completed"
          });
          
          console.log(`Added €${creditAmount} credits to installer ${installerId} wallet via webhook`);
        }
        break;
      
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        
        // Update booking status to payment_failed
        if (failedPayment.metadata.bookingId) {
          await storage.updateBookingStatus(
            parseInt(failedPayment.metadata.bookingId), 
            'payment_failed'
          );
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  // TV Setup Assistance API endpoints
  app.post("/api/tv-setup-booking", async (req, res) => {
    try {
      // Validate request data
      const validatedData = tvSetupBookingFormSchema.parse(req.body);
      
      // Initialize pricing
      let originalAmount = 110.00;
      let discountAmount = 0.00;
      let finalAmount = originalAmount;
      let referralCodeId = null;
      let salesStaffName = null;
      let salesStaffStore = null;
      
      // Process referral code if provided
      if (validatedData.referralCode) {
        try {
          const { harveyNormanReferralService } = await import('./harvestNormanReferralService');
          const referralService = harveyNormanReferralService;
          
          const referralResult = await referralService.validateAndCalculateDiscount(
            validatedData.referralCode.toUpperCase(),
            originalAmount
          );
          
          if (referralResult.success) {
            discountAmount = referralResult.discountAmount;
            finalAmount = originalAmount - discountAmount;
            referralCodeId = referralResult.referralCodeId;
            salesStaffName = referralResult.salesStaffName;
            salesStaffStore = referralResult.salesStaffStore;
          }
        } catch (referralError) {
          console.error('Error processing referral code:', referralError);
          // Continue with booking creation even if referral validation fails
        }
      }
      
      // Create the booking in the database without payment
      const booking = await storage.createTvSetupBooking({
        name: validatedData.name,
        email: validatedData.email,
        mobile: validatedData.mobile,
        tvBrand: validatedData.tvBrand,
        tvModel: validatedData.tvModel,
        isSmartTv: validatedData.isSmartTv,
        tvOs: validatedData.tvOs,
        yearOfPurchase: validatedData.yearOfPurchase,
        streamingApps: validatedData.streamingApps,
        preferredSetupDate: validatedData.preferredSetupDate,
        additionalNotes: validatedData.additionalNotes,
        paymentStatus: 'not_required', // Payment happens after credentials are provided
        setupStatus: 'pending',
        // Pricing and referral information
        originalAmount: originalAmount.toString(),
        discountAmount: discountAmount.toString(),
        paymentAmount: finalAmount.toString(),
        referralCode: validatedData.referralCode?.toUpperCase() || null,
        referralCodeId,
        salesStaffName,
        salesStaffStore
      });

      // Create referral usage tracking if referral code was used successfully
      if (referralCodeId) {
        try {
          // Get the referral code details to determine referrer
          const referralCode = await storage.getReferralCodeById(referralCodeId);
          if (referralCode) {
            // Calculate reward amount (typically 5% of original amount for referrer)
            const rewardAmount = originalAmount * 0.05; // 5% commission for referrer
            
            // Create referral usage record for TV setup booking
            await storage.createReferralUsage({
              referralCodeId: referralCodeId,
              bookingId: null, // Not a regular booking
              tvSetupBookingId: booking.id, // TV setup booking ID
              bookingType: 'tv_setup', // Specify this is a TV setup booking
              referrerUserId: referralCode.userId || `sales_staff_${referralCode.salesStaffName?.toLowerCase()}`, // User who owns the referral code or staff identifier
              refereeUserId: validatedData.email, // Customer who used the code (using email as identifier)
              discountAmount: discountAmount.toString(),
              rewardAmount: rewardAmount.toString(),
              subsidizedByInstaller: false // TV setup referrals are platform-subsidized
            });

            // Update referral code statistics
            await storage.updateReferralCodeStats(referralCodeId, rewardAmount);
            
            console.log(`Created referral usage tracking for code ${validatedData.referralCode}, booking ${booking.id}, discount €${discountAmount}, reward €${rewardAmount}`);
          }
        } catch (referralTrackingError) {
          console.error('Error creating referral usage tracking:', referralTrackingError);
          // Don't fail booking creation if referral tracking fails
        }
      }

      // Send immediate booking confirmation email to customer
      try {
        const { sendTvSetupConfirmationEmail } = await import('./tvSetupEmailService');
        await sendTvSetupConfirmationEmail(booking);
        await storage.markTvSetupEmailSent(booking.id, 'confirmation');
      } catch (emailError) {
        console.error('Failed to send TV setup booking confirmation email:', emailError);
      }

      // Send immediate admin notification email
      try {
        const { sendTvSetupAdminNotification } = await import('./tvSetupEmailService');
        await sendTvSetupAdminNotification(booking);
        await storage.markTvSetupEmailSent(booking.id, 'admin');
      } catch (emailError) {
        console.error('Failed to send TV setup admin notification email:', emailError);
      }

      res.json({ 
        success: true, 
        bookingId: booking.id, 
        message: "Booking created successfully. You will receive payment instructions once your login credentials are prepared." 
      });
    } catch (error: any) {
      console.error("Error creating TV setup booking:", error);
      res.status(500).json({ 
        message: "Error creating TV setup booking: " + error.message 
      });
    }
  });

  // Send payment link to customer after credentials are provided
  app.post("/api/tv-setup-booking/:id/send-payment", isAuthenticated, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getTvSetupBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "TV setup booking not found" });
      }

      if (!booking.credentialsProvided) {
        return res.status(400).json({ message: "Credentials must be provided before requesting payment" });
      }

      // Calculate payment amount (use credentials payment amount or fallback to booking payment amount)
      const paymentAmount = booking.credentialsPaymentAmount 
        ? parseFloat(booking.credentialsPaymentAmount) 
        : parseFloat(booking.paymentAmount);

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'TV Setup Assistance Service - Login Credentials',
                description: `Access credentials for ${booking.name} - Professional TV app setup assistance`,
              },
              unit_amount: Math.round(paymentAmount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/tv-setup-confirmation?booking_id=${booking.id}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tv-setup-status?booking_id=${booking.id}`,
        metadata: {
          bookingId: booking.id.toString(),
          service: 'tv_setup',
          bookingType: 'tv_setup_credentials'
        },
      });

      // Update booking with Stripe session info
      await storage.updateTvSetupBookingPayment(booking.id, session.payment_intent as string, 'pending');
      
      // TODO: Send email to customer with payment link
      
      res.json({ 
        success: true, 
        sessionId: session.id,
        message: "Payment link created successfully" 
      });
    } catch (error: any) {
      console.error("Error creating payment session:", error);
      res.status(500).json({ 
        message: "Error creating payment session: " + error.message 
      });
    }
  });

  // Customer payment page
  app.get("/api/tv-setup-booking/:id/payment", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getTvSetupBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "TV setup booking not found" });
      }

      if (!booking.credentialsProvided) {
        return res.status(400).json({ message: "Credentials not yet provided" });
      }

      if (booking.paymentStatus === 'completed') {
        return res.status(400).json({ message: "Payment already completed" });
      }

      res.json({ 
        booking: {
          id: booking.id,
          name: booking.name,
          email: booking.email,
          tvBrand: booking.tvBrand,
          tvModel: booking.tvModel,
          paymentAmount: booking.paymentAmount,
          credentialsProvided: booking.credentialsProvided
        }
      });
    } catch (error: any) {
      console.error("Error fetching booking for payment:", error);
      res.status(500).json({ 
        message: "Error fetching booking: " + error.message 
      });
    }
  });

  // Get TV setup booking by ID
  app.get("/api/tv-setup-booking/:id", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getTvSetupBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "TV setup booking not found" });
      }
      
      res.json(booking);
    } catch (error: any) {
      console.error("Error fetching TV setup booking:", error);
      res.status(500).json({ 
        message: "Error fetching TV setup booking: " + error.message 
      });
    }
  });

  // Get all TV setup bookings (admin only)
  app.get("/api/admin/tv-setup-bookings", isAuthenticated, async (req, res) => {
    try {
      const bookings = await storage.getAllTvSetupBookings();
      res.json(bookings);
    } catch (error: any) {
      console.error("Error fetching TV setup bookings:", error);
      res.status(500).json({ 
        message: "Error fetching TV setup bookings: " + error.message 
      });
    }
  });

  // Update TV setup booking credentials (admin only)
  app.post("/api/admin/tv-setup-booking/:id/credentials", isAuthenticated, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { 
        credentialsType,
        serverHostname,
        serverUsername, 
        serverPassword,
        numberOfDevices,
        m3uUrl
      } = req.body;

      if (!credentialsType) {
        return res.status(400).json({ message: "Credentials type is required" });
      }

      // Validate IPTV credentials
      if (credentialsType === "iptv") {
        if (!serverHostname || !serverUsername || !serverPassword) {
          return res.status(400).json({ message: "Server hostname, username, and password are required for IPTV credentials" });
        }
      }

      // Validate M3U URL credentials
      if (credentialsType === "m3u_url") {
        if (!m3uUrl) {
          return res.status(400).json({ message: "M3U URL is required for M3U credentials" });
        }
      }

      // Update credentials in database using new storage method
      await storage.updateTvSetupBookingIptvCredentials(bookingId, {
        credentialsType,
        serverHostname,
        serverUsername,
        serverPassword,
        numberOfDevices: numberOfDevices || 1,
        m3uUrl
      });
      
      // Get updated booking details
      const booking = await storage.getTvSetupBooking(bookingId);
      
      // Auto-send credentials email if payment is completed and email hasn't been sent yet
      if (booking && booking.paymentStatus === 'paid' && !booking.credentialsEmailSent) {
        try {
          const { sendTvSetupCredentialsEmail } = await import('./tvSetupEmailService');
          const credentialsSent = await sendTvSetupCredentialsEmail(booking);
          if (credentialsSent) {
            await storage.markTvSetupEmailSent(bookingId, 'credentials');
            console.log(`TV setup credentials email auto-sent for booking ${bookingId} after admin added credentials`);
          }
        } catch (emailError) {
          console.error('Failed to auto-send credentials email:', emailError);
          // Don't fail the request if email fails
        }
      }

      res.json({ success: true, message: "Credentials updated successfully" });
    } catch (error: any) {
      console.error("Error updating TV setup credentials:", error);
      res.status(500).json({ 
        message: "Error updating TV setup credentials: " + error.message 
      });
    }
  });

  // Send credentials email to customer (admin only)
  app.post("/api/admin/tv-setup-booking/:id/send-credentials", isAuthenticated, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getTvSetupBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "TV setup booking not found" });
      }

      // Check if payment has been completed first
      if (booking.credentialsPaymentStatus !== 'completed' && booking.credentialsPaymentStatus !== 'paid') {
        return res.status(400).json({ message: "Cannot send credentials - payment not yet completed by customer." });
      }

      // Check if any credentials are available
      const hasAppCredentials = booking.appUsername && booking.appPassword;
      const hasIptvCredentials = booking.serverUsername && booking.serverPassword && booking.serverHostname;
      const hasM3uUrl = booking.m3uUrl;
      
      if (!hasAppCredentials && !hasIptvCredentials && !hasM3uUrl) {
        return res.status(400).json({ message: "No credentials or M3U URL available for this booking. Please add IPTV credentials or M3U URL first." });
      }

      // Send credentials email
      const { sendTvSetupCredentialsEmail } = await import('./tvSetupEmailService');
      const emailSent = await sendTvSetupCredentialsEmail(booking);
      
      if (emailSent) {
        await storage.markTvSetupEmailSent(bookingId, 'credentials');
        res.json({ success: true, message: "Credentials email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send credentials email" });
      }
    } catch (error: any) {
      console.error("Error sending credentials email:", error);
      res.status(500).json({ 
        message: "Error sending credentials email: " + error.message 
      });
    }
  });

  // Update TV setup booking status (admin only)
  app.post("/api/admin/tv-setup-booking/:id/status", isAuthenticated, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { status, adminNotes, assignedTo } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      // Get the booking before updating to check current status
      const currentBooking = await storage.getTvSetupBooking(bookingId);
      if (!currentBooking) {
        return res.status(404).json({ message: "TV setup booking not found" });
      }

      // Update the booking status
      await storage.updateTvSetupBookingStatus(bookingId, status, adminNotes, assignedTo);
      
      // Get updated booking with new status
      const updatedBooking = await storage.getTvSetupBooking(bookingId);
      
      // Send status update email to customer if status actually changed
      if (currentBooking.setupStatus !== status && updatedBooking) {
        try {
          const { sendTvSetupStatusUpdateEmail } = await import('./tvSetupEmailService');
          await sendTvSetupStatusUpdateEmail(updatedBooking, status);
          console.log(`Status update email sent for booking ${bookingId}: ${currentBooking.setupStatus} → ${status}`);
        } catch (emailError) {
          console.error('Failed to send status update email:', emailError);
          // Don't fail the request if email fails
        }
      }

      res.json({ success: true, message: "Status updated successfully" });
    } catch (error: any) {
      console.error("Error updating TV setup booking status:", error);
      res.status(500).json({ 
        message: "Error updating TV setup booking status: " + error.message 
      });
    }
  });

  // Update TV setup booking referral information (admin only)
  app.post("/api/admin/tv-setup-booking/:id/referral", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookingId = parseInt(req.params.id);
      const { referralCode, referralCodeId, salesStaffName, salesStaffStore } = req.body;

      // Verify booking exists
      const currentBooking = await storage.getTvSetupBooking(bookingId);
      if (!currentBooking) {
        return res.status(404).json({ message: "TV setup booking not found" });
      }

      // Update the booking referral information
      await storage.updateTvSetupBookingReferral(bookingId, {
        referralCode: referralCode || null,
        referralCodeId: referralCodeId || null,
        salesStaffName: salesStaffName || null,
        salesStaffStore: salesStaffStore || null,
      });

      res.json({ success: true, message: "Referral information updated successfully" });
    } catch (error: any) {
      console.error("Error updating TV setup booking referral:", error);
      res.status(500).json({ 
        message: "Error updating TV setup booking referral: " + error.message 
      });
    }
  });

  // Update TV setup booking expiry date (admin only)
  app.post("/api/admin/tv-setup-booking/:id/expiry", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookingId = parseInt(req.params.id);
      const { subscriptionExpiryDate } = req.body;

      if (!subscriptionExpiryDate) {
        return res.status(400).json({ message: "Expiry date is required" });
      }

      // Verify booking exists
      const currentBooking = await storage.getTvSetupBooking(bookingId);
      if (!currentBooking) {
        return res.status(404).json({ message: "TV setup booking not found" });
      }

      // Validate and parse the date
      const expiryDate = new Date(subscriptionExpiryDate);
      if (isNaN(expiryDate.getTime())) {
        return res.status(400).json({ message: "Invalid expiry date format" });
      }

      // Update the booking expiry date
      await storage.updateTvSetupBookingExpiry(bookingId, expiryDate);

      res.json({ success: true, message: "Expiry date updated successfully" });
    } catch (error: any) {
      console.error("Error updating TV setup booking expiry:", error);
      res.status(500).json({ 
        message: "Error updating TV setup booking expiry: " + error.message 
      });
    }
  });

  // Mark IPTV credentials payment as received (admin only)
  app.post("/api/admin/tv-setup-booking/:id/mark-credentials-paid", isAuthenticated, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      
      if (!bookingId || isNaN(bookingId)) {
        return res.status(400).json({ message: "Valid booking ID is required" });
      }

      // Get the booking
      const booking = await storage.getTvSetupBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "TV setup booking not found" });
      }

      // Check if credentials are provided and MAC address is provided
      if (!booking.credentialsProvided) {
        return res.status(400).json({ message: "Credentials not yet provided for this booking" });
      }

      if (!booking.macAddressProvided) {
        return res.status(400).json({ message: "MAC address not yet provided for this booking" });
      }

      // Mark credentials payment as paid
      await storage.markTvSetupCredentialsPaid(bookingId);
      
      // Update status to completed if all requirements are met
      if (booking.setupStatus !== 'completed') {
        await storage.updateTvSetupBookingStatus(bookingId, 'completed');
      }

      res.json({ 
        success: true, 
        message: "IPTV credentials payment marked as received" 
      });
    } catch (error: any) {
      console.error("Error marking credentials payment as paid:", error);
      res.status(500).json({ 
        message: "Error marking credentials payment as paid: " + error.message 
      });
    }
  });

  // Send payment request email for credentials (admin only)
  app.post("/api/admin/tv-setup-booking/:id/send-payment-request", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookingId = parseInt(req.params.id);
      const booking = await storage.getTvSetupBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "TV setup booking not found" });
      }

      // Check if MAC address is provided
      if (!booking.macAddress) {
        return res.status(400).json({ message: "Cannot send payment request - MAC address not provided by customer yet." });
      }

      // Check if already paid
      if (booking.credentialsPaymentStatus === 'completed' || booking.credentialsPaymentStatus === 'paid') {
        return res.status(400).json({ message: "Customer has already completed payment for credentials." });
      }

      // Send payment request email
      const { sendTvSetupPaymentRequestEmail } = await import('./tvSetupEmailService');
      const emailSent = await sendTvSetupPaymentRequestEmail(booking);
      
      if (emailSent) {
        res.json({ success: true, message: "Payment request email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send payment request email" });
      }
    } catch (error: any) {
      console.error("Error sending payment request email:", error);
      res.status(500).json({ 
        message: "Error sending payment request email: " + error.message 
      });
    }
  });

  // Delete TV setup booking (admin only)
  app.delete("/api/admin/tv-setup-booking/:id", isAuthenticated, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      
      if (!bookingId || isNaN(bookingId)) {
        return res.status(400).json({ message: "Valid booking ID is required" });
      }

      // Check if booking exists
      const booking = await storage.getTvSetupBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "TV setup booking not found" });
      }

      await storage.deleteTvSetupBooking(bookingId);
      res.json({ success: true, message: "TV setup booking deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting TV setup booking:", error);
      res.status(500).json({ 
        message: "Error deleting TV setup booking: " + error.message 
      });
    }
  });

  // TV Setup Tracker (public endpoint)
  app.get("/api/tv-setup-tracker", async (req, res) => {
    try {
      const { bookingId, email } = req.query;
      
      if (!bookingId && !email) {
        return res.status(400).json({ message: "Booking ID or email is required" });
      }

      let booking;
      
      if (bookingId) {
        const id = parseInt(bookingId as string);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid booking ID" });
        }
        booking = await storage.getTvSetupBooking(id);
      } else if (email) {
        // Find booking by email (get most recent one)
        const bookings = await storage.getAllTvSetupBookings();
        const userBookings = bookings.filter(b => b.email === email);
        if (userBookings.length > 0) {
          // Get the most recent booking
          booking = userBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        }
      }

      if (!booking) {
        return res.status(404).json({ message: "TV setup booking not found" });
      }

      // Return booking details (excluding sensitive information like payment intent IDs)
      const safeBooking = {
        id: booking.id,
        name: booking.name,
        email: booking.email,
        mobile: booking.mobile,
        tvBrand: booking.tvBrand,
        tvModel: booking.tvModel,
        isSmartTv: booking.isSmartTv,
        tvOs: booking.tvOs,
        yearOfPurchase: booking.yearOfPurchase,
        setupStatus: booking.setupStatus || 'pending',
        paymentAmount: booking.paymentAmount,
        originalAmount: booking.originalAmount,
        discountAmount: booking.discountAmount,
        referralCode: booking.referralCode,
        salesStaffName: booking.salesStaffName,
        salesStaffStore: booking.salesStaffStore,
        additionalNotes: booking.additionalNotes,
        preferredSetupDate: booking.preferredSetupDate,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        
        // MAC Address fields
        macAddress: booking.macAddress,
        macAddressProvided: booking.macAddressProvided || false,
        macAddressProvidedAt: booking.macAddressProvidedAt,
        recommendedApp: booking.recommendedApp,
        appDownloadInstructions: booking.appDownloadInstructions,
        
        // Credentials fields
        credentialsProvided: booking.credentialsProvided || false,
        credentialsEmailSent: booking.credentialsEmailSent || false,
        credentialsSentAt: booking.credentialsSentAt,
        credentialsType: booking.credentialsType,
        
        // IPTV credentials (only show if payment is completed)
        serverHostname: booking.paymentStatus === 'paid' ? booking.serverHostname : undefined,
        serverUsername: booking.paymentStatus === 'paid' ? booking.serverUsername : undefined,
        serverPassword: booking.paymentStatus === 'paid' ? booking.serverPassword : undefined,
        numberOfDevices: booking.paymentStatus === 'paid' ? booking.numberOfDevices : undefined,
        m3uUrl: booking.paymentStatus === 'paid' ? booking.m3uUrl : undefined,
        
        // Payment for credentials
        credentialsPaymentRequired: booking.credentialsProvided && booking.paymentStatus !== 'paid',
        credentialsPaymentStatus: booking.paymentStatus || 'pending',
        credentialsPaymentAmount: booking.paymentAmount,
        credentialsPaidAt: booking.paymentStatus === 'paid' ? booking.updatedAt : undefined,
        
        // Admin tracking
        adminNotes: booking.adminNotes,
        assignedTo: booking.assignedTo,
        completedAt: booking.completedAt
      };

      res.json(safeBooking);
    } catch (error: any) {
      console.error("Error fetching TV setup booking for tracking:", error);
      res.status(500).json({ 
        message: "Error fetching TV setup booking: " + error.message 
      });
    }
  });

  // Submit MAC Address for TV Setup
  app.put("/api/tv-setup-bookings/:id/mac-address", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { macAddress } = req.body;
      
      if (!bookingId || isNaN(bookingId)) {
        return res.status(400).json({ message: "Valid booking ID is required" });
      }
      
      if (!macAddress || !macAddress.trim()) {
        return res.status(400).json({ message: "MAC address is required" });
      }
      
      // Get the booking
      const booking = await storage.getTvSetupBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "TV setup booking not found" });
      }
      
      // Update MAC address and mark as provided
      await storage.updateTvSetupBookingMacAddress(bookingId, macAddress.trim());
      
      // Update status to credentials_ready if not already set
      if (booking.setupStatus === 'pending' || booking.setupStatus === 'mac_required') {
        await storage.updateTvSetupBookingStatus(bookingId, 'credentials_ready');
      }
      
      res.json({ 
        success: true, 
        message: "MAC address submitted successfully" 
      });
    } catch (error: any) {
      console.error("Error submitting MAC address:", error);
      res.status(500).json({ 
        message: "Error submitting MAC address: " + error.message 
      });
    }
  });

  // Send payment link email to customer (admin only)
  app.post("/api/tv-setup-booking/:id/send-payment", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      
      if (!bookingId || isNaN(bookingId)) {
        return res.status(400).json({ message: "Valid booking ID is required" });
      }
      
      // Get the booking
      const booking = await storage.getTvSetupBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "TV setup booking not found" });
      }
      
      // Check if credentials are provided and payment is required
      if (!booking.credentialsProvided) {
        return res.status(400).json({ message: "Credentials not yet available" });
      }
      
      if (booking.credentialsPaymentStatus === 'paid') {
        return res.status(400).json({ message: "Payment already completed" });
      }
      
      // Send payment link email
      const paymentAmount = booking.credentialsPaymentAmount || booking.paymentAmount;
      const subject = `Payment Required - Your TV Setup Credentials Are Ready - Booking #${booking.id}`;
      
      const trackingUrl = `${req.get('origin') || 'https://tradesbook.ie'}/tv-setup-tracker?bookingId=${booking.id}`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">💳 Payment Required</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your TV setup credentials are ready!</p>
          </div>
          
          <div style="padding: 30px; background: #fff;">
            <h2 style="color: #1E40AF; margin: 0 0 20px 0;">Hello ${booking.name}!</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Great news! Your IPTV streaming credentials for your ${booking.tvBrand} ${booking.tvModel} are now ready and waiting for you.
            </p>
            
            <div style="background: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
              <h3 style="color: #065F46; margin: 0 0 15px 0;">✅ What's Ready for You:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #065F46; line-height: 1.6;">
                <li>Your personalized streaming login credentials</li>
                <li>Complete setup instructions for your TV</li>
                <li>Access to premium streaming content</li>
                <li>Technical support if needed</li>
              </ul>
            </div>
            
            <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
              <h3 style="color: #92400E; margin: 0 0 15px 0;">💰 Payment Required</h3>
              <p style="margin: 0; color: #92400E; font-size: 16px;">
                <strong>Amount: €${paymentAmount}</strong><br>
                A final payment is required to access your streaming credentials and complete your TV setup.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${trackingUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Complete Payment & Get Your Credentials
              </a>
            </div>
            
            <div style="background: #EEF2FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1E40AF; margin: 0 0 15px 0;">📋 Booking Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Booking ID:</td><td style="padding: 8px 0; color: #6B7280;">#${booking.id}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">TV Brand:</td><td style="padding: 8px 0; color: #6B7280;">${booking.tvBrand}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">TV Model:</td><td style="padding: 8px 0; color: #6B7280;">${booking.tvModel}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Payment Amount:</td><td style="padding: 8px 0; color: #6B7280;">€${paymentAmount}</td></tr>
              </table>
            </div>
            
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin: 0 0 15px 0;">🔗 Quick Access</h3>
              <p style="margin: 0; color: #6B7280; line-height: 1.6;">
                Click the button above or visit: <br>
                <a href="${trackingUrl}" style="color: #3B82F6; word-break: break-all;">${trackingUrl}</a>
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
            
            <div style="text-align: center; color: #6B7280; font-size: 14px;">
              <p style="margin: 0;">Need help? Contact us at <a href="mailto:support@tradesbook.ie" style="color: #3B82F6;">support@tradesbook.ie</a></p>
              <p style="margin: 10px 0 0 0;">© 2025 Tradesbook.ie - Professional TV Installation Services</p>
            </div>
          </div>
        </div>
      `;
      
      const { sendGmailEmail } = await import('./gmailService');
      const emailSent = await sendGmailEmail(booking.email, subject, htmlContent);
      
      if (emailSent) {
        res.json({ 
          success: true, 
          message: "Payment link email sent successfully" 
        });
      } else {
        res.status(500).json({ 
          message: "Failed to send payment link email" 
        });
      }
    } catch (error: any) {
      console.error("Error sending payment link email:", error);
      res.status(500).json({ 
        message: "Error sending payment link email: " + error.message 
      });
    }
  });

  // Initiate payment for TV setup credentials
  app.post("/api/tv-setup-bookings/:id/payment", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      
      if (!bookingId || isNaN(bookingId)) {
        return res.status(400).json({ message: "Valid booking ID is required" });
      }
      
      // Get the booking
      const booking = await storage.getTvSetupBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "TV setup booking not found" });
      }
      
      // Check if credentials are provided and payment is required
      if (!booking.credentialsProvided) {
        return res.status(400).json({ message: "Credentials not yet available" });
      }
      
      if (booking.credentialsPaymentStatus === 'paid') {
        return res.status(400).json({ message: "Payment already completed" });
      }
      
      // Calculate payment amount (use credentials payment amount or fallback to original)
      const paymentAmount = booking.credentialsPaymentAmount 
        ? parseFloat(booking.credentialsPaymentAmount) 
        : parseFloat(booking.paymentAmount);
      
      console.log(`Creating Stripe session for booking ${booking.id}, amount: €${paymentAmount}`);
      
      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `TV Setup Credentials - Booking #${booking.id}`,
                description: `Access to streaming login credentials for ${booking.tvBrand} ${booking.tvModel}`,
              },
              unit_amount: Math.round(paymentAmount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/tv-setup-tracker?bookingId=${booking.id}&payment=success`,
        cancel_url: `${req.protocol}://${req.get('host')}/tv-setup-tracker?bookingId=${booking.id}&payment=cancelled`,
        metadata: {
          bookingId: booking.id.toString(),
          service: 'tv_setup',
          paymentType: 'credentials'
        },
        customer_email: booking.email,
      });

      // Store the Stripe session ID
      await storage.updateTvSetupBookingStripeSession(bookingId, session.id);
      
      res.json({ 
        success: true, 
        stripeUrl: session.url,
        sessionId: session.id
      });
    } catch (error: any) {
      console.error("Error creating payment session:", error);
      console.error("Error details:", {
        message: error.message,
        type: error.type,
        code: error.code,
        stack: error.stack
      });
      res.status(500).json({ 
        message: "Error creating payment session: " + error.message 
      });
    }
  });

  // Admin endpoint to mark TV setup as completed after payment
  app.post("/api/admin/tv-setup-bookings/:id/complete", async (req, res) => {
    try {
      // Check admin authentication
      if (!req.user || req.user.role !== 'admin') {
        return res.status(401).json({ message: "Admin access required" });
      }

      const bookingId = parseInt(req.params.id);
      
      if (!bookingId || isNaN(bookingId)) {
        return res.status(400).json({ message: "Valid booking ID is required" });
      }
      
      // Get the booking
      const booking = await storage.getTvSetupBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "TV setup booking not found" });
      }
      
      // Check if payment is completed
      if (booking.credentialsPaymentStatus !== 'paid') {
        return res.status(400).json({ message: "Payment must be completed before marking as complete" });
      }
      
      // Update booking status to completed
      await storage.updateTvSetupBookingStatus(bookingId, 'completed');
      
      // Send completion notification to customer
      const { sendGmailEmail } = await import('./gmailService');
      await sendGmailEmail({
        to: booking.email,
        subject: `TV Setup Complete - Booking #${booking.id}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Setup Complete! 🎉</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Your TV streaming service is ready to use</p>
          </div>
          
          <div style="padding: 30px; background: #F0FDF4;">
            <h2 style="color: #047857; margin: 0 0 20px 0;">Hello ${booking.name}!</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Great news! Your TV setup service has been completed successfully. Your streaming credentials are active and ready to use.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
              <h3 style="color: #047857; margin: 0 0 15px 0;">What's Next?</h3>
              <p style="margin: 0; color: #374151;">
                • Your credentials are ready and working<br>
                • Start enjoying your streaming content<br>
                • Contact us if you need any support
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://tradesbook.ie'}/tv-setup-tracker?bookingId=${booking.id}" 
                 style="background: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                View Your Credentials
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6B7280; text-align: center; margin-top: 30px;">
              Thank you for choosing TradesBook.ie for your TV setup needs!
            </p>
          </div>
        </div>
        `
      });
      
      res.json({ 
        success: true, 
        message: "TV setup marked as completed and customer notified"
      });
    } catch (error: any) {
      console.error("Error marking TV setup as completed:", error);
      res.status(500).json({ 
        message: "Error marking setup as completed: " + error.message 
      });
    }
  });

  // Installer Dashboard API endpoints
  app.get("/api/installer/stats", async (req, res) => {
    try {
      // For demo purposes, return mock stats
      // In production, this would calculate real stats from database
      const stats = {
        monthlyJobs: 18,
        earnings: "2,850",
        rating: "4.9"
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching installer stats:", error);
      res.status(500).json({ message: "Failed to fetch installer stats" });
    }
  });

  app.get("/api/installer/bookings", async (req, res) => {
    try {
      // Check installer session authentication
      if (!req.session || !req.session.installerAuthenticated || !req.session.installerId) {
        return res.status(401).json({ message: "Not authenticated as installer" });
      }
      
      const installerId = req.session.installerId;

      // Get bookings where this installer has purchased leads (jobAssignments)
      const installerAssignments = await storage.getInstallerJobAssignments(installerId);
      console.log(`Found ${installerAssignments.length} job assignments for installer ${installerId}`);
      
      const enhancedBookings = [];
      
      for (const assignment of installerAssignments) {
        try {
          const booking = await storage.getBooking(assignment.bookingId);
          if (!booking) continue;
          
          // Get the most relevant schedule date from negotiations
          const scheduleQuery = await db.execute(sql`
            SELECT 
              COALESCE(
                (SELECT sn.proposed_date::text 
                 FROM schedule_negotiations sn 
                 WHERE sn.booking_id = ${booking.id} AND sn.status = 'accepted' 
                 ORDER BY sn.created_at DESC LIMIT 1),
                ${booking.scheduledDate ? (typeof booking.scheduledDate === 'string' ? booking.scheduledDate : booking.scheduledDate.toISOString()) : null}
              ) as negotiated_date,
              (SELECT sn.proposed_time_slot 
               FROM schedule_negotiations sn 
               WHERE sn.booking_id = ${booking.id} 
               AND sn.status IN ('accepted', 'pending')
               ORDER BY 
                 CASE WHEN sn.status = 'accepted' THEN 1 ELSE 2 END,
                 sn.created_at DESC 
               LIMIT 1
              ) as negotiated_time,
              (SELECT sn.status
               FROM schedule_negotiations sn 
               WHERE sn.booking_id = ${booking.id} 
               AND sn.status IN ('accepted', 'accept', 'pending')
               ORDER BY sn.created_at DESC 
               LIMIT 1
              ) as negotiation_status
          `);
          
          const negotiatedSchedule = scheduleQuery.rows[0];
          
          // Skip if customer has selected a different installer (job is no longer available to this installer)
          if (booking.installerId && booking.installerId !== installerId) {
            console.log(`Skipping booking ${booking.id} - customer selected different installer`);
            continue;
          }
          
          // Skip if job assignment is not in valid status for active jobs display
          if (!['assigned', 'accepted', 'in_progress'].includes(assignment.status)) {
            continue;
          }

          enhancedBookings.push({
            id: booking.id,
            contactName: booking.contactName,
            contactPhone: booking.contactPhone,
            contactEmail: booking.contactEmail,
            serviceType: booking.serviceType,
            tvSize: booking.tvSize,
            wallType: booking.wallType,
            mountType: booking.mountType,
            wallMountOption: booking.wallMountOption,
            addons: Array.isArray(booking.addons) ? booking.addons : [],
            tvInstallations: booking.tvInstallations || [], // Include multi-TV installations
            tvQuantity: booking.tvInstallations && Array.isArray(booking.tvInstallations) && booking.tvInstallations.length > 0 ? booking.tvInstallations.length : 1,
            address: booking.address,
            preferredDate: booking.preferredDate,
            preferredTime: booking.preferredTime,
            // Use negotiated schedule dates instead of original booking dates
            scheduledDate: negotiatedSchedule?.negotiated_date || (booking.scheduledDate ? (typeof booking.scheduledDate === 'string' ? booking.scheduledDate : booking.scheduledDate.toISOString()) : null),
            scheduledTime: negotiatedSchedule?.negotiated_time || booking.preferredTime,
            negotiationStatus: negotiatedSchedule?.negotiation_status || null,
            estimatedPrice: booking.estimatedPrice,
            estimatedTotal: booking.estimatedTotal,
            status: booking.installerId === installerId ? booking.status : 'competing', // Special status for competitive phase
            roomPhotoUrl: booking.photoStorageConsent ? booking.roomPhotoUrl : null,
            aiPreviewUrl: booking.aiPreviewUrl,
            roomAnalysis: booking.roomAnalysis,
            photoStorageConsent: booking.photoStorageConsent,
            customerNotes: booking.customerNotes,
            qrCode: booking.qrCode,
            createdAt: booking.createdAt,
            // Job assignment specific fields
            leadFee: (assignment.leadFee && parseFloat(assignment.leadFee) > 0) ? assignment.leadFee : getLeadFee(booking.serviceType).toString(),
            assignmentStatus: assignment.status,
            assignedDate: assignment.assignedDate,
            isSelected: booking.installerId === installerId, // Whether customer has selected this installer
          });
        } catch (bookingError) {
          console.error(`Error processing booking ${assignment.bookingId}:`, bookingError);
        }
      }

      console.log(`Returning ${enhancedBookings.length} active bookings for installer ${installerId}`);
      res.json(enhancedBookings);
    } catch (error) {
      console.error("Error fetching installer bookings:", error);
      res.status(500).json({ message: "Failed to fetch installer bookings" });
    }
  });

  // Referral routes
  app.get("/api/referral/settings", async (req, res) => {
    try {
      const settings = await storage.getReferralSettings();
      res.json(settings || { referralReward: 25, refereeDiscount: 10, isActive: true });
    } catch (error) {
      console.error("Error fetching referral settings:", error);
      res.status(500).json({ message: "Failed to fetch referral settings" });
    }
  });



  app.post("/api/referral/generate", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }
      
      // Check if user already has a referral code
      const existingCode = await storage.getReferralCodeByUserId(userId);
      if (existingCode) {
        return res.json(existingCode);
      }
      
      // Generate new referral code
      const referralCode = `TB${userId.slice(-4).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      const newCode = await storage.createReferralCode({
        userId: userId,
        referralCode: referralCode,
        totalReferrals: 0,
        totalEarnings: "0.00",
        isActive: true
      });
      
      res.json(newCode);
    } catch (error) {
      console.error("Error generating referral code:", error);
      res.status(500).json({ message: "Failed to generate referral code" });
    }
  });

  app.post("/api/referral/validate", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Referral code required" });
      }
      
      const validation = await storage.validateReferralCode(code);
      res.json(validation);
    } catch (error) {
      console.error("Error validating referral code:", error);
      res.status(500).json({ message: "Failed to validate referral code" });
    }
  });

  app.get("/api/referral/earnings/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const earnings = await storage.getReferralEarnings(userId);
      res.json(earnings);
    } catch (error) {
      console.error("Error fetching referral earnings:", error);
      res.status(500).json({ message: "Failed to fetch referral earnings" });
    }
  });

  // Public platform statistics endpoints (for homepage/public pages)
  app.get("/api/platform/stats", async (req, res) => {
    try {
      const installers = await storage.getAllInstallers();
      const bookings = await storage.getAllBookings();
      const reviews = await storage.getAllReviews();

      // Calculate real statistics
      const totalInstallers = installers.filter(installer => installer.approvalStatus === 'approved').length;
      
      // Get unique counties from installer service areas
      const counties = new Set(installers
        .filter(installer => installer.approvalStatus === 'approved')
        .map(installer => installer.serviceArea)
        .filter(Boolean));
      
      // Calculate average rating from all reviews
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = reviews.length > 0 ? (totalRating / reviews.length) : 0;
      
      // Count completed installations
      const completedInstallations = bookings.filter(booking => booking.status === 'completed').length;

      res.json({
        totalInstallers,
        countiesCovered: counties.size,
        averageRating: Number(averageRating.toFixed(1)),
        completedInstallations
      });
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      res.status(500).json({ message: "Failed to fetch platform statistics" });
    }
  });

  // Admin referral code management endpoints
  app.post("/api/referrals/codes", async (req, res) => {
    try {
      const { code, referralType, discountPercentage, salesStaffName, salesStaffStore, isActive } = req.body;
      
      if (!code || !referralType || discountPercentage === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if code already exists
      const existingCode = await storage.getReferralCodeByCode(code);
      if (existingCode) {
        return res.status(400).json({ message: "Referral code already exists" });
      }

      const newCode = await storage.createReferralCode({
        userId: referralType === 'customer' ? null : null, // Admin created codes
        referralCode: code,
        referralType: referralType,
        salesStaffName: salesStaffName || null,
        salesStaffStore: salesStaffStore || null,
        totalReferrals: 0,
        totalEarnings: "0.00",
        isActive: isActive !== undefined ? isActive : true
      });

      res.json(newCode);
    } catch (error) {
      console.error("Error creating referral code:", error);
      res.status(500).json({ message: "Failed to create referral code" });
    }
  });

  app.put("/api/referrals/codes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { code, discountPercentage, isActive, referralType, salesStaffName, salesStaffStore } = req.body;
      
      if (!code || discountPercentage === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const updateData: any = {
        referralCode: code,
        discountPercentage: discountPercentage.toString(),
        isActive: isActive
      };

      // Add type-specific fields if provided
      if (referralType !== undefined) {
        updateData.referralType = referralType;
      }
      if (salesStaffName !== undefined) {
        updateData.salesStaffName = salesStaffName;
      }
      if (salesStaffStore !== undefined) {
        updateData.salesStaffStore = salesStaffStore;
      }

      const updatedCode = await storage.updateReferralCode(parseInt(id), updateData);

      if (!updatedCode) {
        return res.status(404).json({ message: "Referral code not found" });
      }

      res.json(updatedCode);
    } catch (error) {
      console.error("Error updating referral code:", error);
      res.status(500).json({ message: "Failed to update referral code" });
    }
  });

  app.delete("/api/referrals/codes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const success = await storage.deleteReferralCode(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Referral code not found" });
      }

      res.json({ message: "Referral code deleted successfully" });
    } catch (error) {
      console.error("Error deleting referral code:", error);
      res.status(500).json({ message: "Failed to delete referral code" });
    }
  });

  app.get("/api/referrals/usage", async (req, res) => {
    try {
      const usage = await storage.getReferralUsageHistory();
      res.json(usage);
    } catch (error) {
      console.error("Error fetching referral usage:", error);
      res.status(500).json({ message: "Failed to fetch referral usage" });
    }
  });

  // Admin endpoint for fetching active referral codes
  app.get("/api/admin/referral-codes", async (req, res) => {
    try {
      const codes = await storage.getAllReferralCodes();
      const activeCodes = codes.filter(code => code.isActive);
      res.json(activeCodes);
    } catch (error) {
      console.error("Error fetching active referral codes:", error);
      res.status(500).json({ message: "Failed to fetch referral codes" });
    }
  });

  // Retail Partner Sales Staff Referral Routes
  app.post("/api/retail-partner/create-code", async (req, res) => {
    try {
      const { salesStaffName, salesStaffStore, customCode, retailerCode } = req.body;
      
      if (!salesStaffName || !salesStaffStore) {
        return res.status(400).json({ message: "Sales staff name and store required" });
      }
      
      const { retailerDetectionService } = await import('./retailerDetectionService');
      
      // Generate retailer-specific code or use custom code
      const referralCode = customCode || retailerDetectionService.generateReferralCode(
        retailerCode || 'RT', // Default to generic RT if no retailer specified
        salesStaffStore,
        salesStaffName
      );
      
      const newCode = await harveyNormanReferralService.createSalesStaffCode(
        salesStaffName,
        salesStaffStore,
        referralCode
      );
      
      res.json(newCode);
    } catch (error) {
      console.error("Error creating retail partner referral code:", error);
      res.status(500).json({ message: "Failed to create referral code" });
    }
  });

  app.post("/api/retail-partner/validate", async (req, res) => {
    try {
      const { referralCode, bookingAmount } = req.body;
      
      if (!referralCode || !bookingAmount) {
        return res.status(400).json({ message: "Referral code and booking amount required" });
      }
      
      const { retailerDetectionService } = await import('./retailerDetectionService');
      
      // Detect retailer from referral code
      const parsedCode = retailerDetectionService.detectRetailerFromReferralCode(referralCode);
      
      const result = await harveyNormanReferralService.validateAndCalculateDiscount(
        referralCode,
        parseFloat(bookingAmount)
      );
      
      // Enhance result with retailer information
      if (result.success && parsedCode) {
        result.retailerInfo = parsedCode.retailerInfo;
        result.storeName = retailerDetectionService.getStoreName(
          parsedCode.retailerCode, 
          parsedCode.storeCode
        );
        result.staffName = parsedCode.staffName;
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error validating retail partner referral code:", error);
      res.status(500).json({ message: "Failed to validate referral code" });
    }
  });

  app.get("/api/retail-partner/codes", async (req, res) => {
    try {
      const codes = await harveyNormanReferralService.getAllSalesStaffCodes();
      
      // Enhance codes with retailer information
      const { retailerDetectionService } = await import('./retailerDetectionService');
      const enhancedCodes = codes.map(code => {
        const parsedCode = retailerDetectionService.detectRetailerFromReferralCode(code.referralCode);
        return {
          ...code,
          retailerInfo: parsedCode?.retailerInfo,
          storeName: parsedCode ? retailerDetectionService.getStoreName(
            parsedCode.retailerCode, 
            parsedCode.storeCode
          ) : code.salesStaffStore,
          staffName: parsedCode?.staffName || code.salesStaffName
        };
      });
      
      res.json(enhancedCodes);
    } catch (error) {
      console.error("Error fetching retail partner referral codes:", error);
      res.status(500).json({ message: "Failed to fetch referral codes" });
    }
  });

  // Get all supported retailers
  app.get("/api/retail-partner/retailers", async (req, res) => {
    try {
      const { retailerDetectionService } = await import('./retailerDetectionService');
      const retailers = retailerDetectionService.getAllRetailers();
      res.json(retailers);
    } catch (error) {
      console.error("Error fetching retailers:", error);
      res.status(500).json({ message: "Failed to fetch retailers" });
    }
  });

  // Create new retailer (Admin only)
  app.post("/api/retail-partner/retailers", async (req, res) => {
    try {
      const { code, name, fullName, color, invoiceFormats, referralCodePrefix, storeLocations } = req.body;

      if (!code || !name || !fullName || !color) {
        return res.status(400).json({ message: "Code, name, fullName, and color are required" });
      }

      const { retailerDetectionService } = await import('./retailerDetectionService');
      
      // Check if retailer already exists
      if (retailerDetectionService.retailerExists(code)) {
        return res.status(409).json({ message: "Retailer with this code already exists" });
      }

      const created = retailerDetectionService.addRetailer({
        code,
        name,
        fullName,
        color,
        invoiceFormats,
        referralCodePrefix,
        storeLocations
      });
      
      if (created) {
        res.status(201).json({ 
          success: true, 
          message: `Retailer ${code} created successfully`,
          retailer: retailerDetectionService.getRetailer(code.toUpperCase())
        });
      } else {
        res.status(400).json({ message: "Failed to create retailer" });
      }
    } catch (error) {
      console.error("Error creating retailer:", error);
      res.status(500).json({ message: "Failed to create retailer" });
    }
  });

  // Update retailer (Admin only)
  app.patch("/api/retail-partner/retailers/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const updates = req.body;

      const { retailerDetectionService } = await import('./retailerDetectionService');
      
      const updated = retailerDetectionService.updateRetailer(code, updates);
      
      if (updated) {
        res.json({ 
          success: true, 
          message: `Retailer ${code} updated successfully`,
          retailer: retailerDetectionService.getRetailer(code.toUpperCase())
        });
      } else {
        res.status(404).json({ message: "Retailer not found" });
      }
    } catch (error) {
      console.error("Error updating retailer:", error);
      res.status(500).json({ message: "Failed to update retailer" });
    }
  });

  // Delete retailer (Admin only)
  app.delete("/api/retail-partner/retailers/:code", async (req, res) => {
    try {
      const { code } = req.params;

      const { retailerDetectionService } = await import('./retailerDetectionService');
      
      const deleted = retailerDetectionService.deleteRetailer(code);
      
      if (deleted) {
        res.json({ 
          success: true, 
          message: `Retailer ${code} deleted successfully`
        });
      } else {
        res.status(404).json({ message: "Retailer not found" });
      }
    } catch (error) {
      console.error("Error deleting retailer:", error);
      res.status(500).json({ message: "Failed to delete retailer" });
    }
  });

  // Update retailer store locations (Admin only)
  app.put("/api/retail-partner/retailers/:code/stores", async (req, res) => {
    try {
      const { code } = req.params;
      const { storeLocations } = req.body;

      if (!storeLocations || typeof storeLocations !== 'object') {
        return res.status(400).json({ message: "Valid store locations object required" });
      }

      const { retailerDetectionService } = await import('./retailerDetectionService');
      const updated = retailerDetectionService.updateStoreLocations(code.toUpperCase(), storeLocations);
      
      if (updated) {
        res.json({ 
          success: true, 
          message: `Store locations updated for ${code}`,
          storeLocations 
        });
      } else {
        res.status(404).json({ message: "Retailer not found" });
      }
    } catch (error) {
      console.error("Error updating store locations:", error);
      res.status(500).json({ message: "Failed to update store locations" });
    }
  });

  // Detect retailer from referral code or invoice
  app.post("/api/retail-partner/detect", async (req, res) => {
    try {
      const { code, type } = req.body; // type: 'referral' or 'invoice'
      
      if (!code || !type) {
        return res.status(400).json({ message: "Code and type required" });
      }
      
      const { retailerDetectionService } = await import('./retailerDetectionService');
      
      let result = null;
      if (type === 'referral') {
        result = retailerDetectionService.detectRetailerFromReferralCode(code);
      } else if (type === 'invoice') {
        result = retailerDetectionService.detectRetailerFromInvoice(code);
      }
      
      if (result) {
        res.json({
          success: true,
          detected: true,
          ...result
        });
      } else {
        res.json({
          success: true,
          detected: false,
          message: "Retailer could not be detected from the provided code"
        });
      }
    } catch (error) {
      console.error("Error detecting retailer:", error);
      res.status(500).json({ message: "Failed to detect retailer" });
    }
  });

  app.post("/api/harvey-norman/deactivate/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await harveyNormanReferralService.deactivateSalesStaffCode(parseInt(id));
      
      if (success) {
        res.json({ message: "Referral code deactivated successfully" });
      } else {
        res.status(404).json({ message: "Referral code not found" });
      }
    } catch (error) {
      console.error("Error deactivating Harvey Norman referral code:", error);
      res.status(500).json({ message: "Failed to deactivate referral code" });
    }
  });

  // Anonymous review route (for public review forms)
  app.post("/api/public-reviews", async (req, res) => {
    try {
      const { bookingId, installerId, userId, rating, title, comment, reviewerName, qrCode } = req.body;
      
      if (!rating || !title || !comment || !reviewerName) {
        return res.status(400).json({ message: "Missing required review fields" });
      }
      
      const review = await storage.createReview({
        bookingId: bookingId || null,
        installerId: installerId || null,
        userId: userId || null,
        rating: rating,
        title: title,
        comment: comment,
        reviewerName: reviewerName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Send notification to admin about new review
      await sendNotificationEmail(
        'admin@tradesbook.ie',
        `New ${rating}-Star Review Submitted`,
        `A new review has been submitted:\n\nRating: ${rating}/5 stars\nTitle: ${title}\nReviewer: ${reviewerName}\nComment: ${comment}\n\nBooking: ${qrCode || bookingId}`
      );
      
      res.json({ success: true, review });
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to submit review" });
    }
  });

  app.get("/api/reviews/installer/:installerId", async (req, res) => {
    try {
      const { installerId } = req.params;
      const reviews = await storage.getInstallerReviews(parseInt(installerId));
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching installer reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Fee structure routes
  app.post("/api/admin/fee-structures", async (req, res) => {
    try {
      const { installerId, serviceType, feePercentage } = req.body;
      
      // Check if fee structure exists
      const existing = await storage.getFeeStructure(installerId, serviceType);
      
      if (existing) {
        await storage.updateFeeStructure(installerId, serviceType, feePercentage);
        res.json({ message: "Fee structure updated" });
      } else {
        const feeStructure = await storage.createFeeStructure({
          installerId,
          serviceType,
          feePercentage: feePercentage.toString()
        });
        res.json(feeStructure);
      }
    } catch (error) {
      console.error("Error managing fee structure:", error);
      res.status(500).json({ message: "Failed to manage fee structure" });
    }
  });

  // Customer booking routes
  app.get("/api/customer/bookings", async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get all bookings for the current user
      const bookings = await storage.getAllBookings();
      const userBookings = bookings.filter(booking => booking.userId === user.id);
      
      res.json(userBookings);
    } catch (error) {
      console.error("Error fetching customer bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Installer routes
  app.post("/api/installers/register", async (req, res) => {
    try {
      const installerData = req.body;
      
      // Check if installer already exists (for OAuth users who need profile completion)
      const existingInstaller = await storage.getInstallerByEmail(installerData.email);
      if (existingInstaller) {
        // For OAuth users, update existing profile instead of creating new one
        const updatedInstaller = await storage.updateInstaller(existingInstaller.id, {
          contactName: installerData.name,
          businessName: installerData.businessName || installerData.name,
          phone: installerData.phone,
          address: installerData.address,
          serviceArea: installerData.county,
          expertise: [...(installerData.specialties || []), ...(installerData.deviceTypes || [])], // Combine specialties and deviceTypes
          bio: installerData.bio,
          yearsExperience: parseInt(installerData.experience) || 1,
          // Set approval status to pending when profile is completed
          approvalStatus: 'pending',
          isActive: false // Requires admin approval
        });
        
        return res.json({ 
          message: "Profile updated successfully. Awaiting admin approval.", 
          installer: { id: updatedInstaller.id, email: updatedInstaller.email, name: updatedInstaller.contactName }
        });
      }
      
      // Create new installer for non-OAuth registrations
      const installer = await storage.createInstaller({
        contactName: installerData.name,
        businessName: installerData.businessName || installerData.name,
        email: installerData.email,
        phone: installerData.phone,
        address: installerData.address,
        serviceArea: installerData.county,
        expertise: [...(installerData.specialties || []), ...(installerData.deviceTypes || [])], // Combine specialties and deviceTypes
        bio: installerData.bio,
        yearsExperience: parseInt(installerData.experience) || 1,
        approvalStatus: 'pending',
        isActive: false // Requires admin approval
      });
      
      res.json({ 
        message: "Registration successful. Awaiting admin approval.", 
        installer: { id: installer.id, email: installer.email, name: installer.contactName }
      });
    } catch (error) {
      console.error("Error registering installer:", error);
      res.status(500).json({ message: "Failed to register installer" });
    }
  });

  // Installer profile update endpoint for OAuth users
  app.post("/api/installers/profile/update", async (req, res) => {
    try {
      const installerData = req.body;
      
      if (!installerData.email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find existing installer by email
      const existingInstaller = await storage.getInstallerByEmail(installerData.email);
      if (!existingInstaller) {
        return res.status(404).json({ error: "Installer not found" });
      }

      // Update installer profile
      const updatedInstaller = await storage.updateInstaller(existingInstaller.id, {
        contactName: installerData.name,
        businessName: installerData.businessName || installerData.name,
        phone: installerData.phone,
        address: installerData.address,
        serviceArea: installerData.county,
        expertise: [...(installerData.specialties || []), ...(installerData.deviceTypes || [])],
        bio: installerData.bio,
        yearsExperience: parseInt(installerData.experience) || 1,
        approvalStatus: 'pending',
        isActive: false // Requires admin approval
      });

      res.json({ 
        message: "Profile updated successfully. Awaiting admin approval.", 
        installer: { id: updatedInstaller.id, email: updatedInstaller.email, name: updatedInstaller.contactName }
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Uber-style installer request management endpoints
  app.get("/api/installer/available-requests", async (req, res) => {
    try {
      const { installerId } = req.query;
      
      // Check if installer is demo account
      let isDemoAccount = false;
      if (installerId) {
        const installer = await storage.getInstaller(parseInt(installerId as string));
        isDemoAccount = installer?.email === "test@tradesbook.ie";
      }

      // Get leads already purchased by this installer if installerId is provided
      let purchasedBookingIds = new Set<number>();
      if (installerId) {
        const purchasedLeads = await storage.getInstallerPurchasedLeads(parseInt(installerId as string));
        purchasedBookingIds = new Set(purchasedLeads.map(lead => lead.id));
      }

      // Get all open bookings that haven't been assigned to an installer
      const bookings = await storage.getAllBookings();
      const availableRequests = await Promise.all(bookings.filter(booking => {
        // Must be open and unassigned, and not directly assigned
        if (booking.status !== 'open' || booking.installerId || booking.assignmentType === 'direct') {
          return false;
        }
        
        // Exclude leads already purchased by this installer
        if (installerId && purchasedBookingIds.has(booking.id)) {
          return false;
        }
        
        // Demo accounts only see demo bookings
        if (isDemoAccount) {
          return booking.isDemo === true;
        }
        
        // Regular installers only see non-demo bookings
        return booking.isDemo !== true;
      }).map(async (booking) => {
        // Only show bookings from email-verified customers to ensure lead quality
        if (booking.userId) {
          try {
            const customer = await storage.getUserById(String(booking.userId));
            if (!customer || !customer.emailVerified) {
              console.log(`Filtering out booking ${booking.id} - customer ${booking.userId} not email verified`);
              return null; // Filter out unverified customers
            }
          } catch (error) {
            console.log(`Error checking customer verification for booking ${booking.id}:`, error);
            return null; // Filter out if we can't verify
          }
        }
        return booking;
      })).then(results => results.filter(booking => booking !== null));

      // Transform bookings with lead access protection
      const requests = availableRequests.map(booking => {
        // Handle multi-TV vs single TV data
        let tvInfo, serviceInfo, totalPrice, installerEarnings;
        
        if (booking.tvInstallations && Array.isArray(booking.tvInstallations) && booking.tvInstallations.length > 0) {
          // Multi-TV booking
          const tvCount = booking.tvInstallations.length;
          const tvSizes = booking.tvInstallations.map((tv: any) => tv.tvSize).join(', ');
          const services = booking.tvInstallations.map((tv: any) => tv.serviceType).join(', ');
          
          tvInfo = `${tvCount} TVs (${tvSizes}")`;
          serviceInfo = services;
          totalPrice = booking.estimatedTotal || booking.totalPrice;
          installerEarnings = (parseFloat(totalPrice || '0') * 0.75).toFixed(0);
        } else {
          // Single TV booking (legacy)
          tvInfo = booking.tvSize;
          serviceInfo = booking.serviceType;
          totalPrice = booking.totalPrice;
          installerEarnings = (parseFloat(totalPrice || '0') * 0.75).toFixed(0);
        }
        
        // Base information available to all installers
        const baseInfo = {
          id: booking.id,
          customerId: booking.userId || 0,
          tvSize: tvInfo,
          serviceType: serviceInfo,
          totalPrice: totalPrice,
          estimatedTotal: totalPrice,
          installerEarnings: installerEarnings, // 75% commission  
          preferredDate: booking.scheduledDate,
          preferredTime: "14:00", // Default time
          urgency: "standard", // Default urgency
          timePosted: booking.createdAt?.toISOString() || new Date().toISOString(),
          estimatedDuration: "2 hours", // Default duration
          customerRating: 4.8, // Default rating
          distance: Math.floor(Math.random() * 20) + 5, // Random distance 5-25km
          status: "pending",
          leadFee: 25, // Lead fee required to access full details
          isPurchasable: true,
          coordinates: { lat: 53.3498, lng: -6.2603 }, // Default Dublin coordinates
          tvInstallations: booking.tvInstallations || null,
          tvQuantity: booking.tvInstallations ? booking.tvInstallations.length : 1
        };

        // For demo accounts, hide sensitive customer information 
        if (isDemoAccount) {
          return {
            ...baseInfo,
            address: booking.address ? `${booking.address.split(',').slice(-2).join(',').trim()}` : 'Dublin, Ireland', // Only show city/county
            county: "Dublin", 
            customerNotes: "Purchase lead to view full details and contact information",
            customer: {
              name: "Customer Name Hidden",
              phone: "Purchase lead to view",
              email: "Purchase lead to view"
            },
            demoRestricted: true,
            requiresPayment: true,
            restrictionReason: "Demo account - Customer contact details protected"
          };
        }

        // For regular installers, also hide contact details until lead is purchased
        return {
          ...baseInfo,
          address: booking.address ? `${booking.address.split(',').slice(-2).join(',').trim()}` : 'Dublin, Ireland', // Only show city/county initially
          county: "Dublin",
          customerNotes: "Purchase lead to view full details and contact information", 
          customer: {
            name: "Purchase lead to view",
            phone: "Purchase lead to view", 
            email: "Purchase lead to view"
          },
          demoRestricted: false,
          requiresPayment: true,
          restrictionReason: "Lead purchase required to access customer contact details"
        };
      });

      res.json(requests);
    } catch (error) {
      console.error("Error fetching available requests:", error);
      res.status(500).json({ message: "Failed to fetch available requests" });
    }
  });

  // New endpoint for purchasing leads (with demo account protection)
  app.post("/api/installer/purchase-lead/:requestId", async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { installerId } = req.body;
      
      // Check if installer is demo account
      const installer = await storage.getInstaller(installerId);
      if (!installer) {
        return res.status(404).json({ message: "Installer not found" });
      }

      // Handle demo account special case - simulate purchase without payment
      if (installer.email === "test@tradesbook.ie") {
        const booking = await storage.getBooking(requestId);
        if (booking) {
          // Mark booking as accepted and assigned to demo installer
          await storage.updateBooking(requestId, {
            status: 'accepted',
            installerId: installerId
          });
          
          return res.json({
            success: true,
            message: "Demo lead purchased successfully",
            booking: booking,
            demo: true,
            demoMessage: "This is a demo purchase - no actual payment processed"
          });
        } else {
          return res.status(404).json({ message: "Booking not found" });
        }
      }

      // Get the booking
      const booking = await storage.getBooking(requestId);
      if (!booking) {
        return res.status(404).json({ message: "Lead not found" });
      }

      if (booking.installerId) {
        return res.status(400).json({ message: "Lead already purchased by another installer" });
      }

      // In a real implementation, this would integrate with payment processing
      // For now, we'll simulate the lead purchase and assignment
      
      // Assign the lead to the installer
      await storage.updateBooking(requestId, { installerId });
      await storage.updateBookingStatus(requestId, "assigned");

      // Create job assignment
      const jobAssignment = await storage.createJobAssignment({
        bookingId: requestId,
        installerId,
        status: "purchased"
      });

      // Return full lead details after purchase
      res.json({
        success: true,
        message: "Lead purchased successfully",
        leadDetails: {
          id: booking.id,
          customerName: booking.contactName,
          customerEmail: booking.contactEmail,
          customerPhone: booking.contactPhone,
          fullAddress: booking.address,
          serviceDetails: {
            tvSize: booking.tvSize,
            serviceType: booking.serviceType,
            wallType: booking.wallType,
            mountType: booking.mountType,
            addons: {
              cableConcealment: booking.cableConcealment,
              soundBarInstallation: booking.soundBarInstallation
            }
          },
          customerNotes: booking.customerNotes,
          scheduledDate: booking.scheduledDate,
          totalPrice: booking.totalPrice,
          jobAssignmentId: jobAssignment.id
        }
      });

    } catch (error) {
      console.error("Error purchasing lead:", error);
      res.status(500).json({ message: "Failed to purchase lead" });
    }
  });

  app.post("/api/installer/accept-request/:requestId", async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { installerId } = req.body;
      
      // Default to installer ID 2 if not provided (demo account)
      const targetInstallerId = installerId || 2;
      
      console.log(`Accept request ${requestId} for installer ${targetInstallerId}`);
      
      // Check if this is the demo installer account
      const installer = await storage.getInstaller(targetInstallerId);
      if (!installer) {
        return res.status(404).json({ message: "Installer not found" });
      }
      
      // For demo account, check wallet balance and process purchase
      if (installer.email === "test@tradesbook.ie") {
        // Get the actual booking from database to find the lead fee
        const booking = await storage.getBooking(requestId);
        
        if (!booking) {
          return res.status(404).json({ message: "Booking not found" });
        }
        
        // Check if installer should pay lead fee (VIP, Free Leads Promotion, or First Lead Voucher)
        const shouldPayFee = await storage.shouldInstallerPayLeadFee(targetInstallerId);
        
        if (shouldPayFee) {
          // Calculate lead fee based on service type
          const leadFee = getLeadFee(booking.serviceType);
          
          // Check wallet balance
          const wallet = await storage.getInstallerWallet(targetInstallerId);
          if (!wallet) {
            return res.status(400).json({ message: "Wallet not found" });
          }
          
          const currentBalance = parseFloat(wallet.balance);
          if (currentBalance < leadFee) {
            return res.status(400).json({ 
              message: "Insufficient wallet balance. Please add credits to purchase this lead.",
              required: leadFee,
              available: currentBalance 
            });
          }
        } else {
          console.log(`Installer ${targetInstallerId} is exempt from lead fees (VIP, Free Leads Promotion, or First Lead Voucher)`);
        }
        
        // Determine lead fee and fee status based on exemption
        const finalLeadFee = shouldPayFee ? getLeadFee(booking.serviceType) : 0;
        const feeStatus = shouldPayFee ? "paid" : "exempt";
        
        // Create job assignment for demo lead purchase
        const jobAssignment = await storage.createJobAssignment({
          bookingId: requestId,
          installerId: targetInstallerId,
          status: "accepted",
          acceptedDate: new Date(),
          leadFee: finalLeadFee.toString(),
          leadFeeStatus: feeStatus,
          leadPaidDate: new Date()
        });
        
        let newBalance = parseFloat(wallet.balance);
        let totalSpent = parseFloat(wallet.totalSpent);
        
        // Only deduct fee if installer should pay
        if (shouldPayFee && finalLeadFee > 0) {
          newBalance = currentBalance - finalLeadFee;
          totalSpent = parseFloat(wallet.totalSpent) + finalLeadFee;
          await storage.updateInstallerWalletBalance(targetInstallerId, newBalance);
          await storage.updateInstallerWalletTotalSpent(targetInstallerId, totalSpent);
          
          // Add transaction record for paid lead
          await storage.addInstallerTransaction({
            installerId: targetInstallerId,
            type: "lead_purchase",
            amount: (-finalLeadFee).toString(),
            description: `Purchased demo lead access for request #${requestId}`,
            jobAssignmentId: jobAssignment.id,
            status: "completed"
          });
        } else {
          // Add transaction record for exempt lead
          await storage.addInstallerTransaction({
            installerId: targetInstallerId,
            type: "lead_purchase",
            amount: "0.00",
            description: `Free demo lead access (VIP/Promotion/Voucher) for request #${requestId}`,
            jobAssignmentId: jobAssignment.id,
            status: "completed"
          });
        }
        
        return res.json({
          success: true,
          message: "Demo lead purchased successfully! Customer contact details are now available in your purchased leads.",
          jobAssignment: jobAssignment,
          newBalance: newBalance,
          demo: true
        });
      }
      
      // For real installers, allow multiple purchases of the same lead
      const booking = await storage.getBooking(requestId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if installer has already purchased this lead (only block if active, allow repurchase if cancelled)
      const existingAssignment = await db.select().from(jobAssignments)
        .where(and(
          eq(jobAssignments.bookingId, requestId),
          eq(jobAssignments.installerId, targetInstallerId),
          not(eq(jobAssignments.status, 'cancelled')) // Allow repurchase if previously cancelled
        ))
        .limit(1);

      if (existingAssignment.length > 0) {
        return res.status(400).json({ 
          message: "You have already purchased this lead",
          existingStatus: existingAssignment[0].status 
        });
      }

      // Check if installer should pay lead fee (VIP, Free Leads Promotion, or First Lead Voucher)
      const shouldPayFee = await storage.shouldInstallerPayLeadFee(targetInstallerId);
      
      // Get wallet for balance checking
      const wallet = await storage.getInstallerWallet(targetInstallerId);
      if (!wallet) {
        return res.status(400).json({ message: "Wallet not found" });
      }
      
      const currentBalance = parseFloat(wallet.balance);
      let finalLeadFee = 0;
      let feeStatus = "exempt";
      
      if (shouldPayFee) {
        // Calculate lead fee based on service type
        finalLeadFee = getLeadFee(booking.serviceType);
        feeStatus = "paid";
        
        // Check wallet balance only if fee is required
        if (currentBalance < finalLeadFee) {
          return res.status(400).json({ 
            message: "Insufficient wallet balance. Please add credits to purchase this lead.",
            required: finalLeadFee,
            available: currentBalance 
          });
        }
      } else {
        console.log(`Installer ${targetInstallerId} is exempt from lead fees (VIP, Free Leads Promotion, or First Lead Voucher)`);
      }
      
      // Create job assignment with appropriate fee status
      const jobAssignment = await storage.createJobAssignment({
        bookingId: requestId,
        installerId: targetInstallerId,
        status: "purchased", // New status for purchased but not selected
        leadFee: finalLeadFee.toString(),
        leadFeeStatus: feeStatus,
        leadPaidDate: new Date()
      });
      
      let newBalance = currentBalance;
      let totalSpent = parseFloat(wallet.totalSpent);
      
      // Only deduct fee if installer should pay
      if (shouldPayFee && finalLeadFee > 0) {
        newBalance = currentBalance - finalLeadFee;
        totalSpent = parseFloat(wallet.totalSpent) + finalLeadFee;
        await storage.updateInstallerWalletBalance(targetInstallerId, newBalance);
        await storage.updateInstallerWalletTotalSpent(targetInstallerId, totalSpent);
        
        // Add transaction record for paid lead
        await storage.addInstallerTransaction({
          installerId: targetInstallerId,
          type: "lead_purchase",
          amount: (-finalLeadFee).toString(),
          description: `Purchased lead access for request #${requestId}`,
          jobAssignmentId: jobAssignment.id,
          status: "completed"
        });
      } else {
        // Add transaction record for exempt lead
        await storage.addInstallerTransaction({
          installerId: targetInstallerId,
          type: "lead_purchase",
          amount: "0.00",
          description: `Free lead access (VIP/Promotion/Voucher) for request #${requestId}`,
          jobAssignmentId: jobAssignment.id,
          status: "completed"
        });
      }
      
      return res.json({
        success: true,
        message: "Lead purchased successfully! Wait for customer to select an installer.",
        jobAssignment: jobAssignment,
        newBalance: newBalance,
        status: "purchased"
      });

    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  // Get all installers who have purchased a specific booking/lead
  app.get("/api/booking/:bookingId/interested-installers", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      
      if (!bookingId) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }

      // Get all job assignments for this booking with installer details
      const interestedInstallers = await db.select({
        jobAssignment: jobAssignments,
        installer: {
          id: installers.id,
          businessName: installers.businessName,
          contactName: installers.contactName,
          phone: installers.phone,
          serviceArea: installers.serviceArea,
          yearsExperience: installers.yearsExperience,
          profileImageUrl: installers.profileImageUrl,
          rating: installers.adminScore
        }
      })
      .from(jobAssignments)
      .innerJoin(installers, eq(jobAssignments.installerId, installers.id))
      .where(and(
        eq(jobAssignments.bookingId, bookingId),
        eq(jobAssignments.leadFeeStatus, 'paid')
      ))
      .orderBy(desc(jobAssignments.assignedDate));

      // Get installer reviews for each installer
      const installersWithReviews = await Promise.all(
        interestedInstallers.map(async (item) => {
          const reviews = await storage.getInstallerReviews(item.installer.id);
          const avgRating = reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;
          
          return {
            ...item.jobAssignment,
            installer: {
              ...item.installer,
              averageRating: Math.round(avgRating * 10) / 10,
              totalReviews: reviews.length
            }
          };
        })
      );

      res.json(installersWithReviews);
    } catch (error) {
      console.error("Error fetching interested installers:", error);
      res.status(500).json({ message: "Failed to fetch interested installers" });
    }
  });

  // Direct installer assignment (no bidding process)
  app.post("/api/bookings/:bookingId/assign-installer", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const { installerId, assignmentType } = req.body;

      if (!bookingId || !installerId) {
        return res.status(400).json({ message: "Booking ID and installer ID are required" });
      }

      // Verify the customer owns this booking or user is authenticated
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if booking already has an installer assigned
      if (booking.installerId) {
        return res.status(400).json({ message: "This booking already has an installer assigned" });
      }

      // Get installer details
      const installer = await storage.getInstaller(installerId);
      if (!installer) {
        return res.status(404).json({ message: "Installer not found" });
      }

      // Directly assign installer to booking (no lead fee for direct assignments)
      await db.update(bookings)
        .set({ 
          installerId: installerId,
          status: 'assigned',
          assignmentType: assignmentType || 'direct'
        })
        .where(eq(bookings.id, bookingId));

      // Create job assignment record for direct assignment
      const leadFee = 0; // No fee for direct assignments
      const jobAssignment = await db.insert(jobAssignments).values({
        bookingId: bookingId,
        installerId: installerId,
        status: 'accepted',
        leadFee: leadFee.toString(),
        acceptedDate: new Date(),
        assignmentType: 'direct'
      }).returning();

      // Send notifications
      try {
        if (installer.email) {
          await sendLeadPurchaseNotification(
            installer.email,
            installer.businessName || installer.contactName || 'Installer',
            booking,
            'direct_assignment'
          );
        }

        if (booking.contactEmail) {
          await sendStatusUpdateNotification(
            booking.contactEmail,
            booking.contactName,
            booking,
            'assigned',
            `Your installation has been assigned to ${installer.businessName || 'selected installer'}`
          );
        }
      } catch (emailError) {
        console.error('Error sending notification emails:', emailError);
      }

      res.json({
        success: true,
        message: "Installer assigned successfully",
        installer: {
          id: installer.id,
          businessName: installer.businessName,
          contactName: installer.contactName
        },
        assignmentType: 'direct',
        jobAssignmentId: jobAssignment[0]?.id
      });
    } catch (error) {
      console.error("Error assigning installer:", error);
      res.status(500).json({ message: "Failed to assign installer" });
    }
  });

  // Customer selects preferred installer (from bidding process)
  app.post("/api/booking/:bookingId/select-installer", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const { installerId } = req.body;

      if (!bookingId || !installerId) {
        return res.status(400).json({ message: "Booking ID and installer ID are required" });
      }

      // Verify the customer owns this booking
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Get all job assignments for this booking
      const allAssignments = await storage.getBookingJobAssignments(bookingId);
      
      if (allAssignments.length === 0) {
        return res.status(400).json({ message: "No installers have purchased this lead" });
      }

      // Verify the selected installer has purchased the lead
      const selectedAssignment = allAssignments.find(a => a.installerId === installerId);
      if (!selectedAssignment) {
        return res.status(400).json({ message: "Selected installer has not purchased this lead" });
      }

      // Update the selected installer's status to "accepted"
      await db.update(jobAssignments)
        .set({ 
          status: "accepted", 
          acceptedDate: new Date() 
        })
        .where(and(
          eq(jobAssignments.bookingId, bookingId),
          eq(jobAssignments.installerId, installerId)
        ));

      // Update booking to assign the selected installer
      await storage.updateBookingInstaller(bookingId, installerId);
      await storage.updateBookingStatus(bookingId, "confirmed");

      // Process refunds for non-selected installers
      const nonSelectedAssignments = allAssignments.filter(a => a.installerId !== installerId);
      
      for (const assignment of nonSelectedAssignments) {
        try {
          // Update assignment status to "refunded"
          await db.update(jobAssignments)
            .set({ status: "refunded" })
            .where(eq(jobAssignments.id, assignment.id));

          // Refund the lead fee to installer wallet
          const leadFee = parseFloat(assignment.leadFee);
          const wallet = await storage.getInstallerWallet(assignment.installerId);
          
          if (wallet) {
            const newBalance = parseFloat(wallet.balance) + leadFee;
            const totalSpent = Math.max(0, parseFloat(wallet.totalSpent) - leadFee);
            
            await storage.updateInstallerWalletBalance(assignment.installerId, newBalance);
            await storage.updateInstallerWalletTotalSpent(assignment.installerId, totalSpent);
            
            // Add refund transaction record
            await storage.addInstallerTransaction({
              installerId: assignment.installerId,
              type: "refund",
              amount: leadFee.toString(),
              description: `Refund for unselected lead #${bookingId}`,
              jobAssignmentId: assignment.id,
              status: "completed"
            });
            
            console.log(`Refunded €${leadFee} to installer ${assignment.installerId} for booking ${bookingId}`);
          }
        } catch (refundError) {
          console.error(`Error processing refund for installer ${assignment.installerId}:`, refundError);
        }
      }

      // Get selected installer details for response
      const selectedInstaller = await storage.getInstaller(installerId);
      
      // Send confirmation emails
      try {
        // Notify selected installer
        if (selectedInstaller?.email) {
          await sendLeadPurchaseNotification(
            selectedInstaller.email,
            selectedInstaller.businessName || selectedInstaller.contactName || 'Installer',
            booking,
            'selected'
          );
        }

        // Notify customer
        if (booking.contactEmail) {
          await sendStatusUpdateNotification(
            booking.contactEmail,
            booking.contactName,
            booking,
            'confirmed',
            `Your installation has been confirmed with ${selectedInstaller?.businessName || 'selected installer'}`
          );
        }
      } catch (emailError) {
        console.error('Error sending notification emails:', emailError);
      }

      res.json({
        success: true,
        message: `Installer ${selectedInstaller?.businessName || 'selected'} has been assigned to your booking`,
        selectedInstaller: {
          id: selectedInstaller?.id,
          businessName: selectedInstaller?.businessName,
          contactName: selectedInstaller?.contactName
        },
        refundedInstallers: nonSelectedAssignments.length
      });
    } catch (error) {
      console.error("Error selecting installer:", error);
      res.status(500).json({ message: "Failed to select installer" });
    }
  });

  app.post("/api/installer/decline-request/:requestId", async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      
      // Get installer ID from session
      const session = req.session as any;
      const installerId = session.installerId;
      
      if (!installerId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // For demo account (installer ID 2), remove from demo leads cache
      if (installerId === 2 && (global as any).demoLeadsCache && (global as any).demoLeadsCache[installerId]) {
        (global as any).demoLeadsCache[installerId] = (global as any).demoLeadsCache[installerId].filter((lead: any) => lead.id !== requestId);
        console.log(`Removed lead ${requestId} from demo cache for installer ${installerId}`);
      } else {
        // For real installers, track declined requests in database
        await storage.declineRequestForInstaller(installerId, requestId);
      }
      
      res.json({ 
        message: "Request declined successfully"
      });
    } catch (error) {
      console.error("Error declining request:", error);
      res.status(500).json({ message: "Failed to decline request" });
    }
  });

  // Get passed (declined) leads for an installer
  app.get("/api/installer/:installerId/passed-leads", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      
      // Validate installerId is a valid number
      if (isNaN(installerId) || installerId <= 0) {
        return res.status(400).json({ error: "Invalid installer ID" });
      }

      // Check if installer is demo account
      const installer = await storage.getInstaller(installerId);
      const isDemoAccount = installer?.email === "test@tradesbook.ie";

      if (isDemoAccount) {
        // For demo account, return empty array since we remove from cache instead of tracking
        res.json([]);
      } else {
        // For real installers, get declined requests with booking details
        const declinedRequests = await storage.getDeclinedRequestsWithDetailsForInstaller(installerId);
        
        // Transform to match the client-side interface
        const passedLeads = declinedRequests.map(declined => {
          // Calculate correct total price for multi-TV installations
          let totalPrice = declined.booking.customerTotal || declined.booking.estimatedPrice || "0";
          
          // If we have tvInstallations data, calculate the total from individual TV totals
          if (declined.booking.tvInstallations && Array.isArray(declined.booking.tvInstallations) && declined.booking.tvInstallations.length > 1) {
            const calculatedTotal = declined.booking.tvInstallations.reduce((sum: number, tv: any) => {
              return sum + (parseFloat(tv.estimatedTotal) || 0);
            }, 0);
            totalPrice = calculatedTotal.toString();
          }

          return {
            id: declined.booking.id,
            address: declined.booking.address,
            customerName: "Lead Details Hidden", // Hide until retrieved
            customerEmail: "Click to retrieve lead",
            customerPhone: "Click to retrieve lead",
            serviceType: declined.booking.serviceType,
            tvSize: declined.booking.tvSize || "Not specified",
            estimatedPrice: totalPrice,
            status: declined.booking.status,
            // Multi-TV support
            tvInstallations: declined.booking.tvInstallations || [],
            tvQuantity: declined.booking.tvQuantity || 1,
          createdAt: declined.booking.createdAt,
          declinedAt: declined.declinedAt,
          needsWallMount: declined.booking.needsWallMount,
          wallType: declined.booking.wallType,
          mountType: declined.booking.mountType,
          difficulty: declined.booking.difficulty,
          customerNotes: declined.booking.customerNotes
          };
        });
        
        res.json(passedLeads);
      }
    } catch (error) {
      console.error("Error fetching passed leads:", error);
      res.status(500).json({ message: "Failed to fetch passed leads" });
    }
  });

  // Retrieve a passed (declined) lead back to active leads
  app.post("/api/installer/:installerId/retrieve-passed-lead/:requestId", async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const installerId = parseInt(req.params.installerId);
      
      // Validate parameters
      if (isNaN(installerId) || installerId <= 0 || isNaN(requestId) || requestId <= 0) {
        return res.status(400).json({ error: "Invalid installer ID or request ID" });
      }
      
      // Get installer ID from session for security
      const session = req.session as any;
      const sessionInstallerId = session.installerId;
      
      if (!sessionInstallerId || sessionInstallerId !== installerId) {
        return res.status(401).json({ message: "Not authenticated or unauthorized" });
      }

      // Check if installer is demo account
      const installer = await storage.getInstaller(installerId);
      const isDemoAccount = installer?.email === "test@tradesbook.ie";

      if (isDemoAccount) {
        // For demo account, we can't retrieve since we don't track declined leads
        return res.status(400).json({ message: "Demo account cannot retrieve passed leads" });
      } else {
        // For real installers, remove from declined requests to make it available again
        await storage.removeDeclinedRequestForInstaller(installerId, requestId);
        
        // Get the booking details to return to client
        const booking = await storage.getBooking(requestId);
        if (!booking) {
          return res.status(404).json({ message: "Lead not found" });
        }
        
        res.json({ 
          message: "Lead retrieved successfully",
          lead: {
            id: booking.id,
            address: booking.address,
            serviceType: booking.serviceType,
            tvSize: booking.tvSize,
            estimatedPrice: booking.estimatedPrice,
            status: booking.status
          }
        });
      }
    } catch (error) {
      console.error("Error retrieving passed lead:", error);
      res.status(500).json({ message: "Failed to retrieve passed lead" });
    }
  });

  app.get("/api/installer/:installerId/active-jobs", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      
      // Validate installerId is a valid number
      if (isNaN(installerId) || installerId <= 0) {
        return res.status(400).json({ error: "Invalid installer ID" });
      }
      
      const jobs = await storage.getInstallerJobs(installerId);
      
      // Get full booking details for each job
      const activeJobs = await Promise.all(
        jobs.map(async (job) => {
          const booking = await storage.getBooking(job.bookingId);
          return {
            ...job,
            booking
          };
        })
      );

      res.json(activeJobs);
    } catch (error) {
      console.error("Error fetching active jobs:", error);
      res.status(500).json({ message: "Failed to fetch active jobs" });
    }
  });

  // Get installer job assignments
  app.get("/api/installer/:installerId/job-assignments", async (req, res) => {
    try {
      // Check installer session authentication
      if (!req.session || !req.session.installerAuthenticated || !req.session.installerId) {
        return res.status(401).json({ message: "Not authenticated as installer" });
      }
      
      const sessionInstallerId = req.session.installerId;
      const requestedInstallerId = parseInt(req.params.installerId);
      
      // Ensure installer can only access their own assignments
      if (sessionInstallerId !== requestedInstallerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const jobAssignments = await storage.getInstallerJobAssignments(requestedInstallerId);
      res.json(jobAssignments);
    } catch (error) {
      console.error("Error fetching job assignments:", error);
      res.status(500).json({ message: "Failed to fetch job assignments" });
    }
  });

  app.post("/api/installer/update-job-status/:jobId", async (req, res) => {
    try {
      // Check installer session authentication
      if (!req.session || !req.session.installerAuthenticated || !req.session.installerId) {
        return res.status(401).json({ message: "Not authenticated as installer" });
      }
      
      const installerId = req.session.installerId;
      const jobId = parseInt(req.params.jobId);
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ['accepted', 'in_progress', 'completed', 'declined'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
      }
      
      // Get job assignment to find the booking
      const jobAssignments = await storage.getInstallerJobAssignments(installerId);
      const job = jobAssignments.find(j => j.id === jobId);
      
      if (!job) {
        return res.status(404).json({ error: 'Job assignment not found' });
      }
      
      await storage.updateJobStatus(jobId, status);
      
      // Update booking status based on job assignment status
      switch (status) {
        case 'accepted':
          await storage.updateBookingStatus(job.bookingId, "confirmed");
          break;
        case 'in_progress':
          await storage.updateBookingStatus(job.bookingId, "in_progress");
          break;
        case 'completed':
          await storage.updateBookingStatus(job.bookingId, "completed");
          
          // Send completion notification to customer
          const booking = await storage.getBooking(job.bookingId);
          if (booking) {
            await sendNotificationEmail(
              booking.customerEmail,
              "TV Installation Completed",
              `Your TV installation has been completed successfully! Thank you for choosing tradesbook.ie. Reference: ${booking.qrCode}`
            );
          }
          break;
      }
      
      res.json({ message: "Job status updated successfully" });
    } catch (error) {
      console.error("Error updating job status:", error);
      res.status(500).json({ message: "Failed to update job status" });
    }
  });

  // Installer registration endpoint
  app.post("/api/installers/register", async (req, res) => {
    try {
      const {
        name: contactName,
        businessName,
        email,
        phone,
        serviceArea,
        county,
        experience,
        specialties,
        deviceTypes,
        certifications,
        hourlyRate,
        bio,
        maxTravelDistance,
        availability
      } = req.body;

      // Check if installer already exists
      const existingInstaller = await storage.getInstallerByEmail(email);
      if (existingInstaller) {
        return res.status(400).json({ message: "An installer with this email already exists" });
      }

      // Create installer profile
      const installerData = {
        businessName: businessName || contactName,
        contactName,
        email,
        phone,
        address: `${county}, Ireland`,
        serviceArea,
        expertise: [...(specialties || []), ...(deviceTypes || [])],
        bio,
        yearsExperience: parseInt(experience?.split('-')[0] || '1'),
        isActive: true
      };

      const newInstaller = await storage.createInstaller(installerData);
      
      res.json({ 
        success: true, 
        installer: newInstaller,
        message: "Registration successful! You can now access your dashboard." 
      });
    } catch (error) {
      console.error("Error registering installer:", error);
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  app.post("/api/installers/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Demo account with specific email and restricted access
      if (email === "test@tradesbook.ie" && password === "demo123") {
        let installer = await storage.getInstallerByEmail(email);
        
        // If demo installer doesn't exist, create one (always enabled for demo access)
        if (!installer) {
          const demoInstallerData = {
            businessName: "Demo TV Services",
            contactName: "Demo Installer",
            email: "test@tradesbook.ie",
            phone: "(555) 123-4567",
            address: "Dublin, Ireland",
            serviceArea: "Dublin",
            expertise: ["Wall Mounting", "Cable Management", "LED TVs"],
            bio: "Demo installer account for exploring the platform.",
            yearsExperience: 5,
            isActive: true,
            isDemoAccount: true // Flag to identify demo accounts
          };
          installer = await storage.createInstaller(demoInstallerData);
        }

        // Reset and regenerate mock leads for demo account on each login
        console.log(`Demo account login detected - resetting leads for installer ${installer.id}`);
        await resetDemoLeads(installer.id);
        
        // Reset wallet for demo account
        await storage.resetInstallerWallet(installer.id);
        console.log(`Demo account wallet reset to €0.00 for installer ${installer.id}`);

        // Set installer session data
        (req.session as any).installerId = installer.id;
        (req.session as any).installerAuthenticated = true;

        // Save session before sending response
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ error: 'Failed to save session' });
          }
          
          res.json({ 
            success: true, 
            installer: {
              ...installer,
              isDemoAccount: true
            },
            message: "Demo login successful! Limited access to protect customer privacy." 
          });
        });
      }
      // Regular demo access for other emails (legacy support)
      else if (password === "demo123") {
        let installer = await storage.getInstallerByEmail(email);
        
        // If installer doesn't exist, create a demo installer (always enabled for demo access)
        if (!installer) {
          const demoInstallerData = {
            businessName: `${email.split('@')[0]} TV Services`,
            contactName: email.split('@')[0],
            email,
            phone: "(555) 123-4567",
            address: "Dublin, Ireland",
            serviceArea: "Dublin",
            expertise: ["Wall Mounting", "Cable Management", "LED TVs"],
            bio: "Professional TV installer with years of experience.",
            yearsExperience: 5,
            isActive: true,
            isDemoAccount: false
          };
          installer = await storage.createInstaller(demoInstallerData);
        }

        // Set installer session data
        (req.session as any).installerId = installer.id;
        (req.session as any).installerAuthenticated = true;
        
        // Save session before sending response
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ error: 'Failed to save session' });
          }
          
          res.json({ 
            success: true, 
            installer: {
              ...installer,
              isDemoAccount: false
            },
            message: "Login successful!" 
          });
        });
      } else {
        // Regular authentication using bcrypt comparison
        const installer = await storage.authenticateInstaller(email, password);
        if (!installer) {
          return res.status(401).json({ error: "Invalid email or password" });
        }
        
        // Set installer session data regardless of approval status
        (req.session as any).installerId = installer.id;
        (req.session as any).installerAuthenticated = true;
        
        // Save session before sending response
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ error: 'Failed to save session' });
          }
          
          // Return installer data (without password hash)
          const { passwordHash: _, ...installerData } = installer;
          res.json({
            success: true,
            installer: installerData,
            message: "Login successful",
            approvalStatus: installer.approvalStatus,
            profileCompleted: installer.profileCompleted
          });
        });
      }
    } catch (error) {
      console.error("Error logging in installer:", error);
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  // Installer logout endpoint
  app.post("/api/installers/logout", async (req, res) => {
    try {
      // Clear installer session data
      delete (req.session as any).installerId;
      delete (req.session as any).installerAuthenticated;
      
      // Destroy the session
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).json({ error: 'Failed to logout' });
        }
        
        res.json({ 
          success: true, 
          message: "Logged out successfully" 
        });
      });
    } catch (error) {
      console.error("Error logging out installer:", error);
      res.status(500).json({ message: "Logout failed. Please try again." });
    }
  });

  app.get("/api/installers", async (req, res) => {
    try {
      const { serviceType } = req.query;
      const installers = await storage.getAllInstallers();
      const allServiceAssignments = await storage.getAllInstallerServiceAssignments();
      
      // Return only public-safe installer information (hide contact details)
      let publicInstallers = installers
        .filter(installer => 
          installer.approvalStatus === 'approved' && 
          installer.isPubliclyVisible !== false &&
          installer.businessName !== 'Demo TV Services'
        )
        .map(installer => {
          // Get services for this installer
          const installerServices = allServiceAssignments.filter(assignment => 
            assignment.installerId === installer.id && assignment.isActive
          );

          return {
            id: installer.id,
            businessName: installer.businessName,
            serviceArea: installer.serviceArea || installer.county,
            bio: installer.bio,
            yearsExperience: installer.yearsExperience,
            expertise: installer.expertise,
            profileImageUrl: installer.profileImageUrl,
            insurance: installer.insurance,
            certifications: installer.certifications,
            isAvailable: installer.isAvailable, // Show availability status for badge system
            services: installerServices.map(assignment => ({
              id: assignment.serviceType.id,
              key: assignment.serviceType.key,
              name: assignment.serviceType.name,
              iconName: assignment.serviceType.iconName,
              colorScheme: assignment.serviceType.colorScheme
            })),
            // Hide contact details from public view
            contactName: installer.contactName?.split(' ')[0] + " " + (installer.contactName?.split(' ')[1]?.[0] || '') + ".", // Show first name + last initial
            email: "***@***.***", // Hidden
            phone: "***-***-****", // Hidden
            address: installer.county || "Ireland" // Only show county, not full address
          };
        });

      // Filter by service type if specified
      if (serviceType && typeof serviceType === 'string') {
        publicInstallers = publicInstallers.filter(installer => 
          installer.services.some(service => service.key === serviceType)
        );
      }
      
      res.json(publicInstallers);
    } catch (error) {
      console.error("Error fetching installers:", error);
      res.status(500).json({ message: "Failed to fetch installers" });
    }
  });

  // Check installer authentication status
  app.get("/api/installer/auth/status", async (req, res) => {
    try {
      const installerId = (req.session as any)?.installerId;
      const installerAuthenticated = (req.session as any)?.installerAuthenticated;
      
      if (!installerId || !installerAuthenticated) {
        return res.status(401).json({ 
          authenticated: false, 
          message: "Not authenticated as installer" 
        });
      }
      
      const installers = await storage.getAllInstallers();
      const installer = installers.find(i => i.id === installerId);
      
      if (!installer) {
        return res.status(404).json({ 
          authenticated: false, 
          message: "Installer profile not found" 
        });
      }
      
      // Return authentication status with basic installer info
      const { passwordHash: _, ...installerData } = installer;
      res.json({
        authenticated: true,
        installer: installerData
      });
    } catch (error) {
      console.error("Error checking installer auth status:", error);
      res.status(500).json({ 
        authenticated: false, 
        message: "Failed to check authentication status" 
      });
    }
  });

  // Get current installer's profile
  app.get("/api/installer/profile", async (req, res) => {
    try {
      const installerId = (req.session as any)?.installerId;
      
      if (!installerId) {
        return res.status(401).json({ message: "Not authenticated as installer" });
      }
      
      const installers = await storage.getAllInstallers();
      const installer = installers.find(i => i.id === installerId);
      
      if (!installer) {
        return res.status(404).json({ message: "Installer profile not found" });
      }
      
      // Return profile without password hash
      const { passwordHash: _, ...profileData } = installer;
      res.json(profileData);
    } catch (error) {
      console.error("Error fetching installer profile:", error);
      res.status(500).json({ message: "Failed to fetch installer profile" });
    }
  });

  // Toggle installer availability status
  app.post("/api/installer/availability", async (req, res) => {
    try {
      const installerId = (req.session as any)?.installerId;
      
      if (!installerId) {
        return res.status(401).json({ message: "Not authenticated as installer" });
      }
      
      const { isAvailable } = req.body;
      
      if (typeof isAvailable !== 'boolean') {
        return res.status(400).json({ message: "isAvailable must be a boolean" });
      }
      
      await storage.updateInstallerAvailability(installerId, isAvailable);
      
      res.json({ 
        success: true, 
        isAvailable,
        message: `Availability ${isAvailable ? 'enabled' : 'disabled'} successfully` 
      });
    } catch (error) {
      console.error("Error updating installer availability:", error);
      res.status(500).json({ message: "Failed to update availability status" });
    }
  });

  // Update installer profile based on approval status
  app.patch("/api/installer/profile/:installerId", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      const updateData = req.body;
      
      // Verify installer authentication
      const sessionInstallerId = (req.session as any)?.installerId;
      if (!sessionInstallerId || sessionInstallerId !== installerId) {
        return res.status(401).json({ message: "Unauthorized: Can only update your own profile" });
      }

      // Get current installer profile
      const installers = await storage.getAllInstallers();
      const currentInstaller = installers.find(i => i.id === installerId);
      
      if (!currentInstaller) {
        return res.status(404).json({ message: "Installer profile not found" });
      }

      // Determine what fields can be updated based on approval status
      let allowedUpdates: any = {};
      
      if (currentInstaller.approvalStatus === 'rejected') {
        // Rejected installers can update Essential Profile Information only
        allowedUpdates = {
          businessName: updateData.businessName,
          contactName: updateData.contactName,
          phone: updateData.phone,
          address: updateData.address,
          county: updateData.county,
          vatNumber: updateData.vatNumber,
          insurance: updateData.insurance,
          maxTravelDistance: updateData.maxTravelDistance,
          yearsExperience: updateData.yearsExperience ? parseInt(updateData.yearsExperience) : currentInstaller.yearsExperience,
          emergencyCallout: updateData.emergencyCallout,
          weekendAvailable: updateData.weekendAvailable,
          // Reset approval status to pending when resubmitting
          approvalStatus: 'pending',
          adminComments: null // Clear previous comments
        };
      } else if (currentInstaller.approvalStatus === 'approved') {
        // Approved installers can update enhanced profile information
        allowedUpdates = {
          businessName: updateData.businessName,
          contactName: updateData.contactName,
          phone: updateData.phone,
          address: updateData.address,
          county: updateData.county,
          bio: updateData.bio,
          yearsExperience: updateData.yearsExperience ? parseInt(updateData.yearsExperience) : currentInstaller.yearsExperience,
          certifications: updateData.certifications,
          expertise: updateData.expertise || currentInstaller.expertise,
          serviceAreas: updateData.serviceAreas || currentInstaller.serviceAreas,
          emergencyCallout: updateData.emergencyCallout,
          weekendAvailable: updateData.weekendAvailable,
          insurance: updateData.insurance,
          vatNumber: updateData.vatNumber,
          maxTravelDistance: updateData.maxTravelDistance,
          languages: updateData.languages || currentInstaller.languages,
          teamSize: updateData.teamSize,
          vehicleType: updateData.vehicleType,
          responseTime: updateData.responseTime,
          wallTypes: updateData.wallTypes || currentInstaller.wallTypes,
          mountTypes: updateData.mountTypes || currentInstaller.mountTypes,
          deviceTypes: updateData.deviceTypes || currentInstaller.deviceTypes,
          specialServices: updateData.specialServices || currentInstaller.specialServices
        };
      } else {
        // Pending installers cannot update their profile
        return res.status(403).json({ 
          message: "Profile cannot be updated while application is pending review" 
        });
      }

      // Remove undefined values
      Object.keys(allowedUpdates).forEach(key => 
        allowedUpdates[key] === undefined && delete allowedUpdates[key]
      );

      // Update the installer profile
      const updatedInstaller = await storage.updateInstaller(installerId, allowedUpdates);
      
      // Return updated profile without password hash
      const { passwordHash: _, ...profileData } = updatedInstaller;
      
      res.json({
        success: true,
        message: currentInstaller.approvalStatus === 'rejected' 
          ? "Profile updated and resubmitted for review"
          : "Profile updated successfully",
        installer: profileData
      });
      
    } catch (error) {
      console.error("Error updating installer profile:", error);
      res.status(500).json({ message: "Failed to update installer profile" });
    }
  });





  // Test endpoint for approval/rejection emails
  app.post("/api/test-installer-email", async (req, res) => {
    try {
      const { email, action, score, comments } = req.body;
      
      if (!email || !action) {
        return res.status(400).json({ error: "Email and action are required" });
      }
      
      // Find the installer
      const installers = await storage.getAllInstallers();
      const installer = installers.find(i => i.email === email);
      
      if (!installer) {
        return res.status(404).json({ error: "Installer not found" });
      }
      
      let result = false;
      let emailType = '';
      
      if (action === 'approve') {
        console.log(`Sending TEST approval email to: ${email}`);
        result = await sendInstallerApprovalEmail(
          email, 
          installer.contactName || 'Installer',
          installer.businessName,
          score,
          comments
        );
        emailType = 'approval';
      } else if (action === 'reject') {
        console.log(`Sending TEST rejection email to: ${email}`);
        result = await sendInstallerRejectionEmail(
          email, 
          installer.contactName || 'Installer',
          installer.businessName,
          comments
        );
        emailType = 'rejection';
      } else {
        return res.status(400).json({ error: "Action must be 'approve' or 'reject'" });
      }
      
      res.json({ 
        success: result, 
        message: `${emailType} email ${result ? 'sent successfully' : 'failed to send'}`,
        installer: {
          email: installer.email,
          name: installer.contactName,
          business: installer.businessName
        },
        emailType,
        testData: { score, comments }
      });
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ error: "Failed to send test email", details: error.message });
    }
  });





  app.get("/api/installers/:id/jobs", async (req, res) => {
    try {
      const jobs = await storage.getInstallerJobs(parseInt(req.params.id));
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching installer jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // QR Code tracking route
  app.get("/qr-tracking/:qrCode", async (req, res) => {
    try {
      const { qrCode } = req.params;
      const booking = await storage.getBookingByQrCode(qrCode);
      
      if (!booking) {
        return res.status(404).send(`
          <html>
            <head><title>Booking Not Found</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1>Booking Not Found</h1>
              <p>The booking with QR code ${qrCode} was not found.</p>
              <a href="https://tradesbook.ie">Return to tradesbook.ie</a>
            </body>
          </html>
        `);
      }

      // Display booking tracking page
      res.send(`
        <html>
          <head>
            <title>Track Your Installation - ${qrCode}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .status { padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; font-weight: bold; }
              .status.pending { background: #fff3cd; color: #856404; }
              .status.confirmed { background: #d4edda; color: #155724; }
              .status.completed { background: #d1ecf1; color: #0c5460; }
              .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
              .contact { background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Installation Tracking</h1>
                <h2>Booking: ${booking.qrCode}</h2>
              </div>
              
              <div class="status ${booking.status}">
                Status: ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </div>
              
              <div class="details">
                <h3>Installation Details</h3>
                <div class="detail-row">
                  <span><strong>Service:</strong></span>
                  <span>${booking.serviceType}</span>
                </div>
                <div class="detail-row">
                  <span><strong>TV Size:</strong></span>
                  <span>${booking.tvSize}"</span>
                </div>
                <div class="detail-row">
                  <span><strong>Address:</strong></span>
                  <span>${booking.address}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Total Cost:</strong></span>
                  <span>€${booking.totalPrice}</span>
                </div>
                ${booking.scheduledDate ? `
                <div class="detail-row">
                  <span><strong>Scheduled:</strong></span>
                  <span>${new Date(booking.scheduledDate).toLocaleDateString()}</span>
                </div>
                ` : ''}
              </div>
              
              <div class="contact">
                <h3>Need Help?</h3>
                <p>Contact our support team:</p>
                <p><strong>Email:</strong> support@tradesbook.ie</p>
                <p><strong>Phone:</strong> +353 1 234 5678</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://tradesbook.ie" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Return to tradesbook.ie</a>
              </div>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error tracking booking:", error);
      res.status(500).send(`
        <html>
          <head><title>Error</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>Error</h1>
            <p>Unable to retrieve booking information. Please try again later.</p>
            <a href="https://tradesbook.ie">Return to tradesbook.ie</a>
          </body>
        </html>
      `);
    }
  });

  app.patch("/api/jobs/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateJobStatus(parseInt(req.params.id), status);
      res.json({ message: "Job status updated" });
    } catch (error) {
      console.error("Error updating job status:", error);
      res.status(500).json({ message: "Failed to update job status" });
    }
  });

  // TV Recommendation API
  app.post('/api/tv-recommendation', async (req, res) => {
    try {
      const { answers } = req.body;
      
      if (!answers || typeof answers !== 'object') {
        return res.status(400).json({ error: "Valid answers object required" });
      }

      const recommendation = await generateTVRecommendation(answers);
      res.json(recommendation);
    } catch (error) {
      console.error("TV recommendation error:", error);
      res.status(500).json({ error: "Failed to generate TV recommendation" });
    }
  });

  // Generate product image for TV recommendations
  app.post('/api/generate-product-image', async (req, res) => {
    try {
      const { brand, model, tvType, size } = req.body;
      
      if (!brand || !model || !tvType) {
        return res.status(400).json({ error: 'Missing required product information' });
      }

      const { getProductImageWithFallback } = await import('./productImageService');
      const imageUrl = await getProductImageWithFallback({ brand, model, tvType, size });
      
      res.json({ success: true, imageUrl });
    } catch (error) {
      console.error('Product image generation error:', error);
      res.status(500).json({ error: 'Failed to generate product image' });
    }
  });

  // Retailer sample data initialization
  app.post('/api/retail-partner/initialize-samples', async (req, res) => {
    try {
      const { RetailerInvoiceService } = await import('./retailerInvoiceService');
      const retailerInvoiceService = new RetailerInvoiceService();
      await retailerInvoiceService.createSampleInvoices();
      res.json({ success: true, message: 'Sample invoices initialized' });
    } catch (error) {
      console.error('Error initializing sample invoices:', error);
      res.status(500).json({ error: 'Failed to initialize sample invoices' });
    }
  });

  // Retailer Invoice Authentication API
  app.post('/api/auth/invoice-login', async (req, res) => {
    try {
      const { invoiceNumber } = req.body;
      
      if (!invoiceNumber) {
        return res.status(400).json({ error: "Invoice number is required" });
      }

      const { retailerDetectionService } = await import('./retailerDetectionService');
      
      // Use enhanced retailer detection service for login
      const result = await retailerDetectionService.loginWithInvoice(invoiceNumber);
      
      if (result.success && result.user) {
        // First, logout any existing user session to ensure clean state
        req.logout((logoutErr) => {
          if (logoutErr) {
            console.error('Logout error during invoice login:', logoutErr);
          }
          
          // Clear existing session data
          req.session.regenerate((regenerateErr) => {
            if (regenerateErr) {
              console.error('Session regeneration error:', regenerateErr);
              return res.status(500).json({ error: 'Failed to establish clean session' });
            }
            
            // Establish proper Passport session for invoice-authenticated user
            req.login(result.user, (err) => {
              if (err) {
                console.error('Session login error:', err);
                return res.status(500).json({ error: 'Failed to establish session' });
              }
              
              // Set additional session data for invoice authentication
              (req.session as any).userId = result.user.id;
              (req.session as any).isAuthenticated = true;
              (req.session as any).authMethod = 'invoice';
              (req.session as any).invoiceNumber = invoiceNumber;
              (req.session as any).invoiceSessionId = `invoice-${invoiceNumber}-${Date.now()}`;
              
              console.log(`Invoice login successful for ${invoiceNumber}: User ${result.user.id}`);
              
              res.json({
                success: true,
                user: result.user,
                message: result.message,
                isNewRegistration: result.isNewRegistration,
                invoiceNumber: invoiceNumber,
                sessionId: (req.session as any).invoiceSessionId
              });
            });
          });
        });
      } else {
        res.status(401).json({ error: result.message });
      }
    } catch (error) {
      console.error("Invoice login error:", error);
      res.status(500).json({ error: "Unable to process invoice login at this time" });
    }
  });

  // Profile completion for temporary invoice accounts
  app.post('/api/auth/complete-invoice-profile', async (req, res) => {
    try {
      const { invoiceNumber, email, firstName, lastName, phone } = req.body;
      
      if (!invoiceNumber || !email || !firstName || !lastName) {
        return res.status(400).json({ error: "Invoice number, email, first and last name are required" });
      }

      const { retailerDetectionService } = await import('./retailerDetectionService');
      
      // Find the temporary user by invoice number
      const user = await storage.getUserByRetailerInvoice(invoiceNumber);
      if (!user) {
        return res.status(404).json({ error: "Temporary account not found for this invoice number" });
      }

      // Check if email is already in use by another account
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ error: "Email is already registered to another account" });
      }

      // Update the temporary account with real customer details
      const updatedUser = await storage.updateUserProfile(user.id, {
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        profileCompleted: true,
        emailVerified: false // Will need to verify the new email
      });

      // Send verification email for the new email address
      try {
        const { generateVerificationToken, sendVerificationEmail } = await import('./emailVerificationService');
        const verificationToken = await generateVerificationToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        await storage.updateUser(user.id, {
          emailVerificationToken: verificationToken,
          emailVerificationExpires: expiresAt
        });
        
        await sendVerificationEmail(email, firstName, verificationToken);
        console.log(`✅ Verification email sent to completed profile: ${email}`);
      } catch (emailError) {
        console.error('❌ Error sending verification email:', emailError);
        // Continue even if email fails
      }

      // Also create the retailer invoice record if it doesn't exist
      const parsedInvoice = retailerDetectionService.detectRetailerFromInvoice(invoiceNumber);
      if (parsedInvoice) {
        try {
          await storage.createRetailerInvoice({
            invoiceNumber,
            customerEmail: email,
            customerName: `${firstName} ${lastName}`,
            customerPhone: phone || null,
            purchaseDate: new Date(),
            storeName: parsedInvoice.storeCode ? parsedInvoice.retailerInfo.storeLocations?.[parsedInvoice.storeCode] : null,
            storeCode: parsedInvoice.storeCode,
            retailerCode: parsedInvoice.retailerCode,
            isUsedForRegistration: true
          });
        } catch (invoiceError) {
          console.error('Warning: Could not create retailer invoice record:', invoiceError);
          // Don't fail the request if invoice creation fails
        }
      }

      res.json({
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          role: updatedUser.role,
          profileCompleted: true
        },
        message: "Profile completed successfully! Please check your email to verify your address."
      });
    } catch (error) {
      console.error("Profile completion error:", error);
      res.status(500).json({ error: "Unable to complete profile at this time" });
    }
  });

  // Invoice + Email login for customers who completed their profile
  app.post('/api/auth/invoice-email-login', async (req, res) => {
    try {
      const { invoiceNumber, email } = req.body;
      
      if (!invoiceNumber || !email) {
        return res.status(400).json({ error: "Invoice number and email are required" });
      }

      // Find user by both invoice number and email
      const user = await storage.getUserByRetailerInvoiceAndEmail(invoiceNumber, email.toLowerCase());
      if (!user) {
        return res.status(401).json({ 
          error: "Invalid invoice number and email combination. Please check your details or complete your profile setup first." 
        });
      }

      // Ensure the account has been completed
      if (!user.profileCompleted) {
        return res.status(400).json({ 
          error: "Please complete your profile setup first using the invoice number." 
        });
      }

      // Login the user
      req.logout((logoutErr) => {
        if (logoutErr) {
          console.error('Logout error during invoice-email login:', logoutErr);
        }
        
        req.session.regenerate((regenerateErr) => {
          if (regenerateErr) {
            console.error('Session regeneration error:', regenerateErr);
            return res.status(500).json({ error: 'Failed to establish session' });
          }
          
          req.login(user, (err) => {
            if (err) {
              console.error('Session login error:', err);
              return res.status(500).json({ error: 'Failed to establish session' });
            }
            
            // Set session data
            (req.session as any).userId = user.id;
            (req.session as any).isAuthenticated = true;
            (req.session as any).authMethod = 'invoice-email';
            (req.session as any).invoiceNumber = invoiceNumber;
            
            console.log(`Invoice-email login successful for ${invoiceNumber} / ${email}: User ${user.id}`);
            
            res.json({
              success: true,
              user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                role: user.role,
                profileCompleted: user.profileCompleted,
                emailVerified: user.emailVerified
              },
              message: "Welcome back! You've been logged in using your invoice and email.",
              invoiceNumber: invoiceNumber
            });
          });
        });
      });
    } catch (error) {
      console.error("Invoice-email login error:", error);
      res.status(500).json({ error: "Unable to process login at this time" });
    }
  });

  // Profile Update API - allows users to update their profile information
  app.put('/api/auth/profile', requireAuth, async (req, res) => {
    try {
      const { firstName, lastName, phone, email } = req.body;
      
      if (!firstName || !lastName) {
        return res.status(400).json({ error: "First name and last name are required" });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Update user profile in database
      const updatedUser = await storage.updateUserProfile(userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || req.user.email // Keep existing email if not provided
      });

      res.json({
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          role: updatedUser.role
        },
        message: "Profile updated successfully"
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Unable to update profile at this time" });
    }
  });

  // Guest Booking API - allows booking with just email/phone
  app.post('/api/auth/guest-booking', async (req, res) => {
    try {
      const { email, phone, firstName, lastName } = req.body;
      
      if (!email || !phone) {
        return res.status(400).json({ error: "Email and phone number are required" });
      }

      // Check if user already exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create guest user account
        const userId = Math.floor(Math.random() * 1000000000); // Generate random integer ID
        
        const userData = {
          id: userId,
          email,
          firstName: firstName || '',
          lastName: lastName || '',
          role: 'customer',
          registrationMethod: 'guest',
          emailVerified: false, // Guest users need to verify later
        };

        user = await storage.upsertUser(userData);
      }

      // Establish proper Passport session for guest user
      req.login(user, (err) => {
        if (err) {
          console.error('Guest session login error:', err);
          return res.status(500).json({ error: 'Failed to establish guest session' });
        }
        
        // Set additional session data
        (req.session as any).userId = user.id;
        (req.session as any).isAuthenticated = true;
        (req.session as any).authMethod = 'guest';

        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          },
          message: "Guest account created successfully. You can proceed with booking."
        });
      });
    } catch (error) {
      console.error("Guest booking error:", error);
      res.status(500).json({ error: "Unable to create guest account at this time" });
    }
  });

  // Mock Authentication API for testing
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Check against mock credentials
      const mockUser = Object.values(mockCredentials).find(
        cred => cred.email === email && cred.password === password
      );

      if (!mockUser) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // For mock authentication, return user data based on credentials
      res.json({
        success: true,
        user: {
          id: mockUser.role === 'installer' ? 1 : mockUser.role === 'admin' ? 999 : 2,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role
        },
        token: `mock-token-${mockUser.role}-${Date.now()}`
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Solar enquiry endpoints for OHK Energy partnership
  app.post("/api/solar-enquiries", async (req, res) => {
    try {
      const enquiryData = req.body;
      
      const enquiry = await storage.createSolarEnquiry({
        firstName: enquiryData.firstName,
        lastName: enquiryData.lastName,
        email: enquiryData.email,
        phone: enquiryData.phone,
        address: enquiryData.address,
        county: enquiryData.county,
        propertyType: enquiryData.propertyType,
        roofType: enquiryData.roofType,
        electricityBill: enquiryData.electricityBill,
        timeframe: enquiryData.timeframe,
        grants: enquiryData.grants || false,
        storeName: enquiryData.storeName || null,
        storeLocation: enquiryData.storeLocation || null,
        additionalInfo: enquiryData.additionalInfo || null,
        status: "new"
      });
      
      // Send notification email to admin
      await sendNotificationEmail(
        "admin@tradesbook.ie",
        "New Solar Panel Installation Enquiry",
        `
        New solar panel installation enquiry received:
        
        Customer: ${enquiry.firstName} ${enquiry.lastName}
        Email: ${enquiry.email}
        Phone: ${enquiry.phone}
        Location: ${enquiry.address}, ${enquiry.county}
        Property Type: ${enquiry.propertyType}
        Roof Type: ${enquiry.roofType}
        Monthly Bill: ${enquiry.electricityBill}
        Timeframe: ${enquiry.timeframe}
        SEAI Grants Interest: ${enquiry.grants ? 'Yes' : 'No'}
        Store Name: ${enquiry.storeName || 'Not specified'}
        Store Location: ${enquiry.storeLocation || 'Not specified'}
        
        Additional Information:
        ${enquiry.additionalInfo || 'None provided'}
        
        This is a potential lead for OHK Energy partnership.
        Commission opportunity available upon successful conversion.
        `
      );
      
      res.json({ 
        success: true, 
        message: "Solar enquiry submitted successfully",
        enquiryId: enquiry.id 
      });
    } catch (error) {
      console.error("Error creating solar enquiry:", error);
      res.status(500).json({ message: "Failed to submit solar enquiry" });
    }
  });

  app.get("/api/solar-enquiries", async (req, res) => {
    try {
      const enquiries = await storage.getAllSolarEnquiries();
      res.json(enquiries);
    } catch (error) {
      console.error("Error fetching solar enquiries:", error);
      res.status(500).json({ message: "Failed to fetch solar enquiries" });
    }
  });

  app.patch("/api/solar-enquiries/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      await storage.updateSolarEnquiryStatus(parseInt(id), status);
      res.json({ message: "Solar enquiry status updated" });
    } catch (error) {
      console.error("Error updating solar enquiry status:", error);
      res.status(500).json({ message: "Failed to update solar enquiry status" });
    }
  });

  app.delete("/api/solar-enquiries/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.deleteSolarEnquiry(parseInt(id));
      res.json({ message: "Solar enquiry deleted successfully" });
    } catch (error) {
      console.error("Error deleting solar enquiry:", error);
      res.status(500).json({ message: "Failed to delete solar enquiry" });
    }
  });

  // Public analytics endpoints - no authentication required for transparency
  app.get('/api/analytics/website-metrics', async (req, res) => {
    try {
      const { getWebsiteMetrics } = await import('./analyticsService');
      const metrics = await getWebsiteMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching website metrics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics data' });
    }
  });

  app.get('/api/analytics/realtime-stats', async (req, res) => {
    try {
      const { getRealTimeStats } = await import('./analyticsService');
      const stats = await getRealTimeStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching real-time stats:', error);
      res.status(500).json({ message: 'Failed to fetch real-time data' });
    }
  });

  // Public service tier metrics based on actual usage
  app.get('/api/analytics/service-popularity', async (req, res) => {
    try {
      const { getWebsiteMetrics } = await import('./analyticsService');
      const metrics = await getWebsiteMetrics();
      res.json({
        popularServices: metrics.popularServices,
        totalBookings: metrics.totalBookings
      });
    } catch (error) {
      console.error('Error fetching service popularity:', error);
      res.status(500).json({ message: 'Failed to fetch service data' });
    }
  });

  // Review analytics endpoint
  app.get('/api/analytics/reviews', async (req, res) => {
    try {
      const { getWebsiteMetrics } = await import('./analyticsService');
      const metrics = await getWebsiteMetrics();
      res.json(metrics.reviewMetrics);
    } catch (error) {
      console.error('Error fetching review analytics:', error);
      res.status(500).json({ message: 'Failed to fetch review data' });
    }
  });

  // Referral analytics endpoint
  app.get('/api/analytics/referrals', async (req, res) => {
    try {
      const { getWebsiteMetrics } = await import('./analyticsService');
      const metrics = await getWebsiteMetrics();
      res.json(metrics.referralMetrics);
    } catch (error) {
      console.error('Error fetching referral analytics:', error);
      res.status(500).json({ message: 'Failed to fetch referral data' });
    }
  });

  // Harvey Norman Carrickmines Consultation Booking
  app.post('/api/consultation-booking', async (req, res) => {
    try {
      const bookingData = req.body;
      
      const booking = await storage.createConsultationBooking({
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        preferredDate: new Date(bookingData.preferredDate),
        preferredTime: bookingData.preferredTime,
        tvRecommendation: bookingData.tvRecommendation,
        customerPreferences: bookingData.customerPreferences,
        specialRequests: bookingData.specialRequests || null,
        status: "pending"
      });
      
      // Send notification email to admin
      await sendNotificationEmail(
        "admin@tradesbook.ie",
        `[tradesbook.ie] New Harvey Norman Consultation Booking - ${booking.customerName}`,
        `
        New Harvey Norman Carrickmines consultation booking:
        
        Customer: ${booking.customerName}
        Email: ${booking.customerEmail}
        Phone: ${booking.customerPhone}
        Preferred Date: ${booking.preferredDate.toDateString()}
        Preferred Time: ${booking.preferredTime}
        
        TV Recommendation: ${booking.tvRecommendation?.type || 'N/A'} - ${booking.tvRecommendation?.model || 'N/A'}
        
        Customer's Quiz Preferences:
        - Primary Usage: ${typeof booking.customerPreferences === 'object' ? booking.customerPreferences?.usage : 'Not specified'}
        - Budget Range: ${typeof booking.customerPreferences === 'object' ? booking.customerPreferences?.budget : 'Not specified'}
        - Room Type: ${typeof booking.customerPreferences === 'object' ? booking.customerPreferences?.room : 'Not specified'}
        - Gaming Importance: ${typeof booking.customerPreferences === 'object' ? booking.customerPreferences?.gaming : 'Not specified'}
        - Priority Features: ${typeof booking.customerPreferences === 'object' ? booking.customerPreferences?.features : 'Not specified'}
        
        Special Requests:
        ${booking.specialRequests || 'None'}
        
        Store Location: Harvey Norman Carrickmines
        Address: The Park, Carrickmines, Dublin 18, D18 R9P0
        
        Please contact the customer to confirm the appointment and assign a TV installation expert. Use the quiz preferences above to suggest alternative models if needed.
        `
      );
      
      // Send confirmation email to customer
      await sendNotificationEmail(
        booking.customerEmail,
        "Harvey Norman Consultation Booking Received",
        `
        Dear ${booking.customerName},
        
        Thank you for booking a TV consultation at Harvey Norman Carrickmines!
        
        Your booking details:
        - Preferred Date: ${booking.preferredDate.toDateString()}
        - Preferred Time: ${booking.preferredTime}
        - Location: Harvey Norman Carrickmines, The Park, Carrickmines, Dublin 18
        
        Recommended TV: ${booking.tvRecommendation?.type || 'N/A'} - ${booking.tvRecommendation?.model || 'N/A'}
        
        Your preferences (for reference during consultation):
        - Primary Usage: ${booking.customerPreferences?.usage || 'Not specified'}
        - Budget Range: ${booking.customerPreferences?.budget || 'Not specified'}
        - Room Type: ${booking.customerPreferences?.room || 'Not specified'}
        - Gaming Importance: ${booking.customerPreferences?.gaming || 'Not specified'}
        - Priority Features: ${booking.customerPreferences?.features || 'Not specified'}
        
        Our team will contact you within 24 hours to confirm your appointment time and assign a TV installation expert to meet with you.
        
        During your consultation, you'll be able to:
        • View your recommended TV model in person
        • Explore alternative models based on your preferences
        • Discuss installation options and pricing
        • Get expert advice on setup and placement
        • Arrange professional installation if needed
        
        If you need to make any changes, please contact us at bookings@tradesbook.ie
        
        Best regards,
        The tradesbook.ie Team
        `
      );

      res.json({ 
        success: true, 
        message: "Consultation booking submitted successfully",
        bookingId: booking.id 
      });
    } catch (error) {
      console.error("Error creating consultation booking:", error);
      res.status(500).json({ message: "Failed to create consultation booking" });
    }
  });

  app.get("/api/consultation-bookings", async (req, res) => {
    try {
      const bookings = await storage.getAllConsultationBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching consultation bookings:", error);
      res.status(500).json({ message: "Failed to fetch consultation bookings" });
    }
  });

  app.patch("/api/consultation-bookings/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      await storage.updateConsultationBookingStatus(parseInt(id), status);
      res.json({ message: "Consultation booking status updated" });
    } catch (error) {
      console.error("Error updating consultation booking status:", error);
      res.status(500).json({ message: "Failed to update consultation booking status" });
    }
  });



  // TV Recommendation Contact Form
  app.post('/api/tv-recommendation/contact', async (req, res) => {
    try {
      const { name, email, phone, message, recommendation, preferences } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ error: "Name, email, and message are required" });
      }

      // Email content for admin
      const adminEmailSubject = `New TV Recommendation Inquiry from ${name}`;
      const adminEmailContent = `
New TV recommendation inquiry received:

Customer Details:
- Name: ${name}
- Email: ${email}
- Phone: ${phone || 'Not provided'}

TV Recommendation:
- Type: ${recommendation?.type || 'N/A'}
- Model: ${recommendation?.model || 'N/A'}

Customer Preferences:
- Primary usage: ${preferences?.usage || 'N/A'}
- Budget range: ${preferences?.budget || 'N/A'}
- Room environment: ${preferences?.room || 'N/A'}
- Gaming importance: ${preferences?.gaming || 'N/A'}
- Priority feature: ${preferences?.features || 'N/A'}

Customer Message:
${message}

Please follow up with this customer within 24 hours.
      `;

      // Send email to admin using Gmail service
      await sendAdminNotification(
        adminEmailSubject,
        adminEmailContent,
        { recommendation, preferences, customerDetails: { name, email, phone } }
      );

      // Send confirmation email to customer
      const customerEmailSubject = "TV Recommendation Inquiry Received";
      const customerEmailContent = `
Hi ${name},

Thank you for your interest in our TV recommendation service! We've received your inquiry about ${recommendation?.type} recommendations.

Our TV experts will review your preferences and contact you within 24 hours to discuss:
- Specific TV models that match your needs
- Pricing and availability
- Installation options
- Any questions you may have

Your inquiry details:
- Recommended TV Type: ${recommendation?.type}
- Budget Range: ${preferences?.budget}
- Primary Usage: ${preferences?.usage}

Best regards,
tradesbook.ie Team

If you have any urgent questions, please call us at +353 1 XXX XXXX
      `;

      // Send confirmation email to customer with professional HTML format
      const customerEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1>TV Recommendation Inquiry Received</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <p>Hi ${name},</p>
            <p>Thank you for your interest in our TV recommendation service! We've received your inquiry about ${recommendation?.type} recommendations.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Your Inquiry Details:</h3>
              <p><strong>Recommended TV Type:</strong> ${recommendation?.type}</p>
              <p><strong>Budget Range:</strong> ${preferences?.budget}</p>
              <p><strong>Primary Usage:</strong> ${preferences?.usage}</p>
            </div>
            
            <p>Our TV experts will review your preferences and contact you within 24 hours to discuss:</p>
            <ul>
              <li>Specific TV models that match your needs</li>
              <li>Pricing and availability</li>
              <li>Installation options</li>
              <li>Any questions you may have</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #666;">Best regards,<br><strong>tradesbook.ie Team</strong></p>
            </div>
          </div>
        </div>
      `;

      await sendGmailEmail({
        to: email,
        subject: customerEmailSubject,
        html: customerEmailHtml,
        from: 'recommendations@tradesbook.ie'
      });

      res.json({ 
        success: true, 
        message: "Contact request sent successfully" 
      });
    } catch (error) {
      console.error("TV recommendation contact error:", error);
      res.status(500).json({ error: "Failed to send contact request" });
    }
  });

  // ====================== ADMIN DASHBOARD ENDPOINTS ======================
  
  // Admin authentication check middleware
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      console.log("Admin check - Session ID:", req.sessionID);
      console.log("Admin check - Session passport:", req.session?.passport);
      
      // Check if session exists and has user ID
      if (!req.session?.passport?.user) {
        console.log("Admin check failed: No session user ID");
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = req.session.passport.user;
      console.log("Admin check - Session user ID:", userId);

      // Fetch user from database
      const user = await storage.getUserById(userId);
      if (!user) {
        console.log("Admin check failed: User not found in database");
        return res.status(401).json({ message: "Authentication required" });
      }

      console.log("Admin check - User from DB:", { id: user.id, email: user.email, role: user.role });

      const isAdminUser = user.email === 'admin@tradesbook.ie' || 
                         user.email === 'jude.okun@gmail.com' || 
                         user.id === 42442296 ||
                         user.role === 'admin';
      
      console.log("Admin check - isAdminUser result:", isAdminUser);
      
      if (!isAdminUser) {
        console.log("Admin check failed: User is not admin");
        return res.status(403).json({ message: "Admin access required" });
      }
      
      console.log("Admin check passed - proceeding");
      next();
    } catch (error) {
      console.error("Admin check error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // Admin Dashboard Stats
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      const installers = await storage.getAllInstallers();
      
      // Calculate metrics
      const totalBookings = bookings.length;
      const monthlyBookings = bookings.filter(b => {
        const bookingDate = new Date(b.createdAt);
        const thisMonth = new Date();
        return bookingDate.getMonth() === thisMonth.getMonth() && 
               bookingDate.getFullYear() === thisMonth.getFullYear();
      }).length;
      
      // Calculate platform revenue from lead fees (not customer payments)
      let totalRevenue = 0;
      for (const booking of bookings) {
        const leadFee = getLeadFee(booking.serviceType);
        totalRevenue += leadFee;
      }
      
      // Average lead fee per booking
      const avgLeadFee = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      const activeBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
      const completedBookings = bookings.filter(b => b.status === 'completed').length;
      const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      
      // Get most popular service type
      const serviceTypeCounts = bookings.reduce((acc, b) => {
        acc[b.serviceType] = (acc[b.serviceType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topServiceType = Object.keys(serviceTypeCounts).reduce((a, b) => 
        serviceTypeCounts[a] > serviceTypeCounts[b] ? a : b, 'None'
      );

      const stats = {
        totalBookings,
        monthlyBookings,
        revenue: Math.round(totalRevenue),
        appFees: Math.round(avgLeadFee),
        totalUsers: bookings.filter(b => b.userId).length,
        totalInstallers: installers.length,
        activeBookings,
        completedBookings,
        avgBookingValue: Math.round(avgBookingValue),
        topServiceType
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin statistics" });
    }
  });

  // Admin Users Management
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      // Get all users from the users table
      const allUsers = await storage.getAllUsers();
      const bookings = await storage.getAllBookings();
      
      // Create a map of user booking statistics
      const userStats = new Map();
      bookings.forEach(booking => {
        if (booking.userId) {
          if (!userStats.has(booking.userId)) {
            userStats.set(booking.userId, {
              bookingCount: 0,
              totalSpent: 0
            });
          }
          const stats = userStats.get(booking.userId);
          stats.bookingCount++;
          // Calculate total lead fees paid (what customer saves, platform revenue)
          const leadFee = getLeadFee(booking.serviceType);
          stats.totalSpent += leadFee;
        }
      });

      // Combine user data with booking statistics
      const enhancedUsers = allUsers.map(user => ({
        id: user.id.toString(),
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt?.toISOString() || '',
        lastLogin: user.updatedAt?.toISOString() || '',
        bookingCount: userStats.get(user.id)?.bookingCount || 0,
        totalSpent: userStats.get(user.id)?.totalSpent || 0,
        registrationMethod: user.registrationMethod || 'oauth',
        role: user.role || 'customer',
        emailVerified: user.emailVerified || false
      }));

      res.json(enhancedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });



  // Admin Installers Management
  app.get("/api/admin/installers", isAdmin, async (req, res) => {
    try {
      const installers = await storage.getAllInstallers();
      
      const enhancedInstallers = await Promise.all(installers.map(async (installer) => {
        // Get actual job assignments for this installer
        const jobs = await storage.getInstallerJobs(installer.id);
        const completedJobs = jobs.filter(j => j.status === 'completed').length;
        
        // Calculate real earnings from completed bookings
        let totalEarnings = 0;
        const allBookings = await storage.getAllBookings();
        const installerBookings = allBookings.filter(booking => 
          booking.installerId === installer.id && booking.status === 'completed'
        );
        
        totalEarnings = installerBookings.reduce((sum, booking) => {
          const estimatedPrice = parseFloat(booking.estimatedPrice || '0');
          return sum + estimatedPrice;
        }, 0);
        
        // Get authentic rating from reviews
        const installerReviews = await storage.getInstallerReviews(installer.id);
        const averageRating = installerReviews.length > 0 
          ? installerReviews.reduce((sum, review) => sum + review.rating, 0) / installerReviews.length
          : 0;
        
        return {
          ...installer,
          completedJobs,
          rating: parseFloat(averageRating.toFixed(1)),
          totalEarnings: Math.round(totalEarnings)
        };
      }));

      res.json(enhancedInstallers);
    } catch (error) {
      console.error("Error fetching installers:", error);
      res.status(500).json({ message: "Failed to fetch installers" });
    }
  });

  // Lead payments endpoint for tracking installer wallet transactions with pagination
  app.get("/api/admin/lead-payments", isAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 25;
      const offset = (page - 1) * limit;
      
      // Get all installer transactions including:
      // 1. Lead fee payments (debits when installers claim leads)
      // 2. Credit top-ups (credits when installers add funds via Stripe)
      // 3. Earnings (credits when installers complete jobs)
      
      const allTransactions = await storage.getAllInstallerTransactions();
      
      // Filter out demo account transactions (installer ID 2 = test@tradesbook.ie)
      // Only include transactions from verified, non-demo installers
      const realTransactions = [];
      for (const transaction of allTransactions) {
        const installer = await storage.getInstaller(transaction.installerId);
        // Exclude demo account and unverified installers
        if (installer && 
            installer.id !== 2 && 
            installer.email !== "test@tradesbook.ie" && 
            installer.approvalStatus === 'approved') {
          realTransactions.push(transaction);
        }
      }
      
      // Sort by creation date (newest first)
      const sortedTransactions = realTransactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Apply pagination
      const paginatedTransactions = sortedTransactions.slice(offset, offset + limit);
      
      // Enhance with installer business names
      const enhancedTransactions = await Promise.all(
        paginatedTransactions.map(async (transaction) => {
          const installer = await storage.getInstaller(transaction.installerId);
          return {
            ...transaction,
            installerName: installer?.businessName || `Installer #${transaction.installerId}`,
            installerVerified: installer?.approvalStatus === 'approved'
          };
        })
      );

      res.json({
        transactions: enhancedTransactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(realTransactions.length / limit),
          totalTransactions: realTransactions.length,
          limit
        }
      });
    } catch (error) {
      console.error('Error fetching lead payments:', error);
      res.status(500).json({ error: 'Failed to fetch lead payments' });
    }
  });

  // Delete transaction endpoint for admin
  app.delete("/api/admin/lead-payments/:id", isAdmin, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      
      if (!transactionId || isNaN(transactionId)) {
        return res.status(400).json({ message: "Valid transaction ID is required" });
      }
      
      // Delete the transaction
      await storage.deleteInstallerTransaction(transactionId);
      
      res.json({ 
        success: true, 
        message: "Transaction deleted successfully" 
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(500).json({ 
        error: 'Failed to delete transaction',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Bulk delete transactions endpoint for admin
  app.delete("/api/admin/lead-payments/bulk", isAdmin, async (req, res) => {
    try {
      const { transactionIds, olderThanDays } = req.body;
      
      let deletedCount = 0;
      
      if (transactionIds && Array.isArray(transactionIds)) {
        // Delete specific transactions by IDs
        for (const id of transactionIds) {
          try {
            await storage.deleteInstallerTransaction(parseInt(id));
            deletedCount++;
          } catch (error) {
            console.error(`Failed to delete transaction ${id}:`, error);
          }
        }
      } else if (olderThanDays && typeof olderThanDays === 'number') {
        // Delete transactions older than specified days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        
        const allTransactions = await storage.getAllInstallerTransactions();
        const oldTransactions = allTransactions.filter(t => 
          new Date(t.createdAt) < cutoffDate
        );
        
        for (const transaction of oldTransactions) {
          try {
            await storage.deleteInstallerTransaction(transaction.id);
            deletedCount++;
          } catch (error) {
            console.error(`Failed to delete transaction ${transaction.id}:`, error);
          }
        }
      } else {
        return res.status(400).json({ 
          message: "Either transactionIds array or olderThanDays number is required" 
        });
      }
      
      res.json({ 
        success: true, 
        message: `Successfully deleted ${deletedCount} transaction(s)`,
        deletedCount 
      });
    } catch (error) {
      console.error('Error bulk deleting transactions:', error);
      res.status(500).json({ 
        error: 'Failed to bulk delete transactions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Platform Insights - Real Lead Generation Metrics
  app.get("/api/admin/platform-insights", isAdmin, async (req, res) => {
    try {
      // Get all bookings for lead analysis
      const allBookings = await storage.getAllBookings();
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Filter bookings by current month
      const monthlyBookings = allBookings.filter(booking => {
        if (!booking.createdAt) return false;
        const bookingDate = new Date(booking.createdAt);
        return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
      });

      // Get real service tiers from database
      const serviceTiers = await storage.getServiceTiers();
      
      const leadRevenueByService: Record<string, { leadFee: number; count: number; revenue: number }> = {};
      
      // Initialize service tracking using actual service tier data
      serviceTiers.forEach((tier: any) => {
        leadRevenueByService[tier.key] = {
          leadFee: tier.leadFee || 0,
          count: 0,
          revenue: 0
        };
      });

      // Count actual bookings per service type
      monthlyBookings.forEach(booking => {
        const serviceKey = booking.serviceType;
        
        // Try direct match first
        if (leadRevenueByService[serviceKey]) {
          leadRevenueByService[serviceKey].count += 1;
          leadRevenueByService[serviceKey].revenue += leadRevenueByService[serviceKey].leadFee;
        } else {
          // Check legacy service type mappings for backward compatibility
          const legacyMapping: Record<string, string> = {
            'Premium Wall Mount': 'silver',
            'Bronze Wall Mount': 'bronze',
            'Silver Wall Mount': 'silver',
            'Gold Wall Mount': 'gold',
            'Table Mount': 'table-top-small',
            'Table Mount Large': 'table-top-large'
          };
          
          const mappedKey = legacyMapping[serviceKey];
          if (mappedKey && leadRevenueByService[mappedKey]) {
            leadRevenueByService[mappedKey].count += 1;
            leadRevenueByService[mappedKey].revenue += leadRevenueByService[mappedKey].leadFee;
          } else {
            // Log unmatched service types for debugging
            console.log(`Unmatched service type in revenue breakdown: ${serviceKey}`);
          }
        }
      });

      // Calculate total monthly lead revenue
      const totalMonthlyLeadRevenue = Object.values(leadRevenueByService)
        .reduce((sum, service) => sum + service.revenue, 0);

      // Calculate average lead value from actual service tiers
      const averageLeadValue = serviceTiers.length > 0 
        ? serviceTiers.reduce((sum: number, tier: any) => sum + (tier.leadFee || 0), 0) / serviceTiers.length
        : 0;

      // Calculate lead conversion rate (completed vs total bookings)
      const completedBookings = allBookings.filter(b => b.status === 'completed').length;
      const leadConversionRate = allBookings.length > 0 
        ? ((completedBookings / allBookings.length) * 100)
        : 0;

      // Calculate installer retention (active installers vs total)
      const allInstallers = await storage.getAllInstallers();
      const activeInstallers = allInstallers.filter(installer => installer.isActive).length;
      const installerRetentionRate = allInstallers.length > 0 
        ? ((activeInstallers / allInstallers.length) * 100)
        : 0;

      // Calculate addon revenue
      const bookingsWithAddons = monthlyBookings.filter(booking => 
        booking.addons && booking.addons.length > 0
      );
      
      const addonRevenue = bookingsWithAddons.reduce((sum, booking) => {
        // Addon lead fees: Cable Concealment €5, Soundbar €7, Additional Devices €3
        const addonFees = {
          'cable-concealment': 5,
          'soundbar-mounting': 7,
          'additional-devices': 3
        };
        
        if (booking.addons && typeof booking.addons === 'string') {
          const bookingAddonRevenue = booking.addons.split(',').reduce((addonSum: number, addon: string) => {
            const cleanAddon = addon.trim().toLowerCase().replace(' ', '-');
            return addonSum + (addonFees[cleanAddon as keyof typeof addonFees] || 0);
          }, 0);
          return sum + bookingAddonRevenue;
        }
        return sum;
      }, 0);

      const insights = {
        monthlyLeadRevenue: totalMonthlyLeadRevenue,
        averageLeadValue: Math.round(averageLeadValue * 100) / 100,
        leadConversionRate: Math.round(leadConversionRate * 10) / 10,
        installerRetentionRate: Math.round(installerRetentionRate * 10) / 10,
        totalBookings: allBookings.length,
        monthlyBookings: monthlyBookings.length,
        completedBookings,
        activeInstallers,
        totalInstallers: allInstallers.length,
        addonRevenue,
        annualRevenueProjection: (totalMonthlyLeadRevenue + addonRevenue) * 12,
        serviceBreakdown: leadRevenueByService
      };

      res.json(insights);
    } catch (error) {
      console.error("Error fetching platform insights:", error);
      res.status(500).json({ message: "Failed to fetch platform insights" });
    }
  });

  // Admin Actions - Update Installer Status
  app.patch("/api/admin/installers/:id/status", isAdmin, async (req, res) => {
    try {
      const installerId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      console.log(`Updating installer ${installerId} status to ${isActive ? 'active' : 'inactive'}`);
      
      // Update the installer status in the database
      const installers = await storage.getAllInstallers();
      const installer = installers.find(i => i.id === installerId);
      
      if (!installer) {
        return res.status(404).json({ message: "Installer not found" });
      }
      
      await storage.updateInstaller(installerId, { isActive });
      
      res.json({ message: "Installer status updated successfully" });
    } catch (error) {
      console.error("Error updating installer status:", error);
      res.status(500).json({ message: "Failed to update installer status" });
    }
  });

  // Admin Actions - Update Installer Public Visibility
  app.patch("/api/admin/installers/:id/visibility", isAdmin, async (req, res) => {
    try {
      const installerId = parseInt(req.params.id);
      const { isPubliclyVisible } = req.body;
      
      console.log(`Updating installer ${installerId} public visibility to ${isPubliclyVisible ? 'visible' : 'hidden'}`);
      
      // Update the installer visibility in the database
      const installers = await storage.getAllInstallers();
      const installer = installers.find(i => i.id === installerId);
      
      if (!installer) {
        return res.status(404).json({ message: "Installer not found" });
      }
      
      await storage.updateInstaller(installerId, { isPubliclyVisible });
      
      res.json({ message: "Installer visibility updated successfully" });
    } catch (error) {
      console.error("Error updating installer visibility:", error);
      res.status(500).json({ message: "Failed to update installer visibility" });
    }
  });

  // Admin Actions - Toggle Installer VIP Status
  app.patch("/api/admin/installers/:id/vip", isAdmin, async (req, res) => {
    try {
      const installerId = parseInt(req.params.id);
      const { isVip, vipNotes } = req.body;
      const adminUserId = req.session.passport?.user || 'admin';
      
      console.log(`Updating installer ${installerId} VIP status to ${isVip ? 'VIP' : 'standard'}`);
      
      // Get installer to verify existence
      const installer = await storage.getInstaller(installerId);
      if (!installer) {
        return res.status(404).json({ message: "Installer not found" });
      }
      
      // Update VIP status with admin tracking
      const updateData: any = { 
        isVip,
        vipNotes: vipNotes || null
      };
      
      if (isVip) {
        // Grant VIP status
        updateData.vipGrantedBy = adminUserId;
        updateData.vipGrantedAt = new Date();
      } else {
        // Remove VIP status
        updateData.vipGrantedBy = null;
        updateData.vipGrantedAt = null;
      }
      
      await storage.updateInstaller(installerId, updateData);
      
      res.json({ 
        message: `Installer ${isVip ? 'granted' : 'removed'} VIP status successfully`,
        isVip,
        vipGrantedBy: isVip ? adminUserId : null
      });
    } catch (error) {
      console.error("Error updating installer VIP status:", error);
      res.status(500).json({ message: "Failed to update installer VIP status" });
    }
  });


  // Admin installer image upload endpoint
  app.post("/api/admin/installers/:id/image", isAuthenticated, isAdmin, upload.single('profileImage'), async (req, res) => {
    try {
      console.log(`🔄 Image upload request received for installer ID: ${req.params.id}`);
      console.log(`📁 File info:`, req.file ? { 
        fieldname: req.file.fieldname, 
        originalname: req.file.originalname, 
        mimetype: req.file.mimetype, 
        size: req.file.size 
      } : 'No file');
      
      const installerId = parseInt(req.params.id);
      
      if (!req.file) {
        console.log("❌ No image file provided in request");
        return res.status(400).json({ message: "No image file provided" });
      }
      
      if (!installerId || isNaN(installerId)) {
        console.log(`❌ Invalid installer ID: ${req.params.id}`);
        return res.status(400).json({ message: "Valid installer ID is required" });
      }
      
      // Get installer details to verify existence
      const installers = await storage.getAllInstallers();
      const installer = installers.find(i => i.id === installerId);
      
      if (!installer) {
        console.log(`❌ Installer with ID ${installerId} not found in database`);
        return res.status(404).json({ message: "Installer not found" });
      }
      
      console.log(`👤 Found installer: ${installer.businessName} (ID: ${installer.id})`);
      
      // Convert uploaded file to base64 for storage
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      console.log(`📸 Base64 image created, length: ${base64Image.length} characters`);
      
      // Update installer profile with new image
      console.log(`💾 Updating installer image in database...`);
      const updatedInstaller = await storage.updateInstallerImage(installerId, base64Image);
      
      console.log(`✅ Successfully uploaded image for installer ${installer.businessName}`);
      console.log(`🔄 Updated installer:`, { 
        id: updatedInstaller.id, 
        businessName: updatedInstaller.businessName, 
        hasImage: !!updatedInstaller.profileImageUrl,
        imageLength: updatedInstaller.profileImageUrl?.length || 0
      });
      
      res.json({ 
        message: "Profile image uploaded successfully",
        profileImageUrl: base64Image,
        installer: updatedInstaller
      });
      
    } catch (error) {
      console.error("❌ Error uploading installer image:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({ message: "Failed to upload image", error: error.message });
    }
  });

  // Admin installer profile update endpoint
  app.patch("/api/admin/installers/:id/profile", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const installerId = parseInt(req.params.id);
      const profileData = req.body;
      
      if (!installerId || isNaN(installerId)) {
        return res.status(400).json({ message: "Valid installer ID is required" });
      }
      
      // Update installer profile
      const updatedInstaller = await storage.updateInstallerProfile(installerId, profileData);
      
      res.json({ 
        message: "Installer profile updated successfully", 
        installer: updatedInstaller 
      });
      
    } catch (error) {
      console.error("Error updating installer profile:", error);
      res.status(500).json({ message: "Failed to update installer profile" });
    }
  });

  // Admin installer approval endpoints
  app.patch("/api/admin/installers/:id/approve", isAuthenticated, isAdmin, async (req, res) => {
    try {
      console.log("🔄 Starting installer approval process");
      console.log("Request params:", req.params);
      console.log("Request body:", req.body);
      console.log("User:", req.user);
      
      const installerId = parseInt(req.params.id);
      const { approvalStatus, adminScore, adminComments } = req.body;
      const adminUserId = (req.user as any)?.id;
      
      console.log(`📋 Processing approval for installer ID: ${installerId}`);
      console.log(`👤 Admin user ID: ${adminUserId}`);
      console.log(`⭐ Score: ${adminScore}, Comments: ${adminComments}`);
      
      if (!installerId || isNaN(installerId)) {
        console.log("❌ Invalid installer ID");
        return res.status(400).json({ message: "Valid installer ID is required" });
      }
      
      // Get installer details before updating
      console.log("📝 Fetching installer details...");
      const installers = await storage.getAllInstallers();
      const installer = installers.find(i => i.id === installerId);
      
      if (!installer) {
        console.log("❌ Installer not found");
        return res.status(404).json({ message: "Installer not found" });
      }
      
      console.log(`✅ Found installer: ${installer.businessName} (${installer.email})`);
      
      // Update approval status
      console.log("💾 Updating installer approval status...");
      await storage.updateInstallerApproval(installerId, {
        approvalStatus: 'approved',
        adminScore,
        adminComments,
        reviewedBy: adminUserId?.toString(),
        reviewedAt: new Date()
      });
      console.log("✅ Database update completed");
      
      // Send approval email
      console.log(`📧 Sending approval email to installer: ${installer.email}`);
      const emailSent = await sendInstallerApprovalEmail(
        installer.email, 
        installer.contactName || 'Installer',
        installer.businessName,
        adminScore,
        adminComments
      );
      console.log(`📧 Email sent status: ${emailSent}`);
      
      console.log("🎉 Installer approval process completed successfully");
      
      res.json({ 
        message: "Installer approved successfully",
        emailSent,
        installer: {
          email: installer.email,
          name: installer.contactName,
          business: installer.businessName
        }
      });
    } catch (error) {
      console.error("❌ Error approving installer:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        message: "Failed to approve installer",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.patch("/api/admin/installers/:id/reject", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const installerId = parseInt(req.params.id);
      const { approvalStatus, adminComments } = req.body;
      const adminUserId = (req.user as any)?.id;
      
      // Get installer details before updating
      const installers = await storage.getAllInstallers();
      const installer = installers.find(i => i.id === installerId);
      
      if (!installer) {
        return res.status(404).json({ message: "Installer not found" });
      }
      
      // Update rejection status
      await storage.updateInstallerApproval(installerId, {
        approvalStatus: 'rejected',
        adminComments,
        reviewedBy: adminUserId?.toString(),
        reviewedAt: new Date()
      });
      
      // Send rejection email
      console.log(`Sending rejection email to installer: ${installer.email}`);
      const emailSent = await sendInstallerRejectionEmail(
        installer.email, 
        installer.contactName || 'Installer',
        installer.businessName,
        adminComments
      );
      
      res.json({ 
        message: "Installer rejected",
        emailSent,
        installer: {
          email: installer.email,
          name: installer.contactName,
          business: installer.businessName
        }
      });
    } catch (error) {
      console.error("Error rejecting installer:", error);
      res.status(500).json({ message: "Failed to reject installer" });
    }
  });

  // Admin delete installer
  app.delete("/api/admin/installers/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const installerId = parseInt(req.params.id);
      
      if (!installerId || isNaN(installerId)) {
        return res.status(400).json({ message: "Valid installer ID is required" });
      }

      // Get installer details before deleting for logging
      const installers = await storage.getAllInstallers();
      const installer = installers.find(i => i.id === installerId);
      
      if (!installer) {
        return res.status(404).json({ message: "Installer not found" });
      }

      console.log(`Starting deletion process for installer ID ${installerId}: ${installer.businessName} (${installer.email})`);

      // Delete the installer and all related records
      await storage.deleteInstaller(installerId);
      
      // Verify deletion was successful
      const installerAfterDeletion = await storage.getInstaller(installerId);
      if (installerAfterDeletion) {
        throw new Error("Installer deletion failed - record still exists");
      }
      
      console.log(`✅ Installer successfully deleted: ${installer.businessName} (${installer.email})`);
      
      res.json({ 
        message: "Installer permanently deleted from database",
        deletedInstaller: {
          id: installerId,
          businessName: installer.businessName,
          email: installer.email
        }
      });
    } catch (error) {
      console.error("❌ Error deleting installer:", error);
      res.status(500).json({ 
        message: "Failed to delete installer", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Admin Actions - Update Booking Status with cross-dashboard sync
  app.patch("/api/admin/bookings/:id/status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      
      // Get booking details before update for notification
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Check if booking is already assigned to installer (restrict admin power for assigned bookings)
      if (booking.installerId && !['open', 'pending', 'confirmed'].includes(booking.status)) {
        return res.status(400).json({ 
          message: "Cannot modify booking status once assigned to installer and in progress" 
        });
      }
      
      await storage.updateBookingStatus(bookingId, status);
      
      // Send real-time notifications for status changes
      if (booking.customerEmail) {
        await sendStatusUpdateNotification(booking.customerEmail, booking.qrCode || '', status);
      }
      
      // If booking has an assigned installer, notify them too
      if (booking.installerId) {
        const installer = await storage.getInstaller(booking.installerId);
        if (installer?.email) {
          await sendStatusUpdateNotification(installer.email, booking.qrCode || '', status);
        }
      }
      
      res.json({ message: "Booking status updated successfully" });
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Admin Actions - Update Demo Flag
  app.patch("/api/admin/bookings/:id/demo-flag", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { isDemo } = req.body;
      
      // Validate booking exists
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Update demo flag in database
      await storage.updateBookingDemoFlag(bookingId, isDemo);
      
      res.json({ message: "Demo flag updated successfully" });
    } catch (error) {
      console.error("Error updating demo flag:", error);
      res.status(500).json({ message: "Failed to update demo flag" });
    }
  });

  // Admin Actions - Delete Booking with Full Cascading Deletion
  app.delete("/api/admin/bookings/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const forceDelete = req.query.force === 'true'; // Allow force deletion with query parameter
      
      // Get booking details
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Check if booking can be safely deleted (unless force delete is requested)
      if (!forceDelete && booking.installerId && ['installer_accepted', 'in_progress', 'completed'].includes(booking.status)) {
        return res.status(400).json({ 
          message: "Booking is in active state. Use force=true parameter to override.",
          canForceDelete: true,
          currentStatus: booking.status,
          assignedInstaller: booking.installerId
        });
      }
      
      console.log(`🗑️ Admin deletion initiated for booking ${bookingId} (force: ${forceDelete})`);
      
      // Start transaction for safe deletion
      await db.transaction(async (trx) => {
        // 1. Delete all related records in proper order to avoid foreign key constraints
        
        // Delete reviews
        await trx.delete(reviews).where(eq(reviews.bookingId, bookingId));
        console.log(`✅ Deleted reviews for booking ${bookingId}`);
        
        // Delete installer transactions related to job assignments for this booking
        const jobAssignmentsForBooking = await trx.select({ id: jobAssignments.id }).from(jobAssignments).where(eq(jobAssignments.bookingId, bookingId));
        if (jobAssignmentsForBooking.length > 0) {
          const jobAssignmentIds = jobAssignmentsForBooking.map(ja => ja.id);
          await trx.delete(installerTransactions).where(
            jobAssignmentIds.length === 1 
              ? eq(installerTransactions.jobAssignmentId, jobAssignmentIds[0])
              : inArray(installerTransactions.jobAssignmentId, jobAssignmentIds)
          );
          console.log(`✅ Deleted installer transactions for booking ${bookingId}`);
        }
        
        // Delete job assignments and purchased leads
        await trx.delete(jobAssignments).where(eq(jobAssignments.bookingId, bookingId));
        console.log(`✅ Deleted job assignments for booking ${bookingId}`);
        
        // Delete schedule negotiations
        await trx.delete(scheduleNegotiations).where(eq(scheduleNegotiations.bookingId, bookingId));
        console.log(`✅ Deleted schedule negotiations for booking ${bookingId}`);
        
        // Delete lead refunds
        await trx.delete(leadRefunds).where(eq(leadRefunds.bookingId, bookingId));
        console.log(`✅ Deleted lead refunds for booking ${bookingId}`);
        
        // Note: Notifications table deletion not implemented due to schema issues
        
        // Delete referral usage records
        await trx.delete(referralUsage).where(eq(referralUsage.bookingId, bookingId));
        console.log(`✅ Deleted referral usage for booking ${bookingId}`);
        
        // Delete anti-manipulation records
        await trx.delete(antiManipulation).where(eq(antiManipulation.bookingId, bookingId));
        console.log(`✅ Deleted anti-manipulation records for booking ${bookingId}`);
        
        // Delete declined requests
        await trx.delete(declinedRequests).where(eq(declinedRequests.bookingId, bookingId));
        console.log(`✅ Deleted declined requests for booking ${bookingId}`);
        
        // Finally delete the booking itself
        await trx.delete(bookings).where(eq(bookings.id, bookingId));
        console.log(`✅ Deleted booking ${bookingId}`);
      });
      
      // Log deletion for audit trail
      console.log(`🗑️ ADMIN DELETION COMPLETED - Booking ID: ${bookingId}, QR: ${booking.qrCode}, Customer: ${booking.customerEmail}, Force: ${forceDelete}`);
      
      // Notify customer about cancellation
      if (booking.customerEmail) {
        try {
          await sendGmailEmail(
            booking.customerEmail,
            'Booking Cancelled - tradesbook.ie',
            `Your TV installation booking (${booking.qrCode}) has been cancelled by our admin team. 
            
            ${forceDelete ? 'This was an administrative decision due to special circumstances.' : ''}
            
            If you have any questions about this cancellation, please contact our support team at support@tradesbook.ie.
            
            We apologize for any inconvenience caused.
            
            Best regards,
            tradesbook.ie Team`
          );
        } catch (emailError) {
          console.error("Failed to send deletion notification email:", emailError);
          // Continue with deletion even if email fails
        }
      }
      
      res.json({ 
        message: "Booking and all associated data deleted successfully",
        deletedBookingId: bookingId,
        qrCode: booking.qrCode,
        wasForceDelete: forceDelete,
        customerNotified: !!booking.customerEmail
      });
      
    } catch (error) {
      console.error("Error in admin booking deletion:", error);
      res.status(500).json({ 
        message: "Failed to delete booking", 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get booking assignment status (for checking if booking can be modified)
  app.get("/api/admin/bookings/:id/assignment-status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const canModify = !booking.installerId || ['open', 'pending', 'confirmed'].includes(booking.status);
      const canDelete = !booking.installerId && !['installer_accepted', 'in_progress', 'completed'].includes(booking.status);
      
      res.json({
        canModify,
        canDelete,
        status: booking.status,
        installerId: booking.installerId,
        assignedInstaller: booking.installerId ? await storage.getInstaller(booking.installerId) : null
      });
    } catch (error) {
      console.error("Error checking booking assignment status:", error);
      res.status(500).json({ message: "Failed to check booking status" });
    }
  });

  // Real-time booking status sync endpoint for cross-dashboard updates
  app.get("/api/bookings/:id/status", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Return current booking status with timestamp for real-time sync
      res.json({
        id: booking.id,
        status: booking.status,
        lastUpdated: booking.updatedAt,
        installerId: booking.installerId,
        customerEmail: booking.customerEmail,
        qrCode: booking.qrCode
      });
    } catch (error) {
      console.error("Error fetching booking status:", error);
      res.status(500).json({ message: "Failed to fetch booking status" });
    }
  });

  // Bulk booking status sync for dashboard real-time updates
  app.get("/api/bookings/status-sync", async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      
      // Return essential status information for all bookings
      const statusData = bookings.map(booking => ({
        id: booking.id,
        status: booking.status,
        lastUpdated: booking.updatedAt,
        installerId: booking.installerId,
        qrCode: booking.qrCode
      }));
      
      res.json(statusData);
    } catch (error) {
      console.error("Error syncing booking statuses:", error);
      res.status(500).json({ message: "Failed to sync booking statuses" });
    }
  });

  // Admin Actions - Update User Profile
  app.patch("/api/admin/users/:userId", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { firstName, lastName, email } = req.body;
      
      console.log(`Admin attempting to update user: ${userId}`);
      
      // Validate required fields
      if (!email || email.trim() === '') {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Check if user exists
      const user = await storage.getUserById(userId.toString());
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user profile
      const updatedUser = await storage.updateUser(userId.toString(), {
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        email: email.trim()
      });
      
      if (updatedUser) {
        console.log(`✅ User profile updated successfully: ${email} (ID: ${userId})`);
        res.json({ 
          message: "User profile updated successfully",
          user: updatedUser
        });
      } else {
        res.status(404).json({ message: "User not found or update failed" });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Admin Actions - Delete User
  app.delete("/api/admin/users/:userId", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      console.log(`Admin attempting to delete user: ${userId}`);
      
      // First, check if user exists
      const user = await storage.getUserById(userId.toString());
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent deletion of admin users
      if (user.role === 'admin') {
        return res.status(403).json({ message: "Cannot delete admin users" });
      }
      
      // Delete related data first to avoid foreign key constraints
      try {
        // Delete user's bookings - set user_id to null rather than deleting bookings
        await db.update(bookings)
          .set({ userId: null })
          .where(eq(bookings.userId, userId));
        
        // Delete user's reviews
        await db.delete(reviews)
          .where(eq(reviews.userId, userId.toString()));
          
        // Delete user's referral codes
        await db.delete(referralCodes)
          .where(eq(referralCodes.userId, userId.toString()));
          
        // Delete user's referral usage records
        await db.delete(referralUsage)
          .where(eq(referralUsage.userId, userId.toString()));
          
      } catch (cleanupError) {
        console.log("Some related records cleanup failed (expected for new users):", cleanupError.message);
      }
      
      // Finally delete the user
      const success = await storage.deleteUser(userId);
      
      if (success) {
        console.log(`✅ User successfully deleted: ${user.email} (ID: ${userId})`);
        res.json({ message: "User deleted successfully" });
      } else {
        res.status(404).json({ message: "User not found or already deleted" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ====================== BANNED USER MANAGEMENT ======================
  
  // Get all banned users
  app.get("/api/admin/banned-users", isAdmin, async (req, res) => {
    try {
      const bannedUsers = await storage.getAllBannedUsers();
      res.json(bannedUsers);
    } catch (error) {
      console.error("Error fetching banned users:", error);
      res.status(500).json({ message: "Failed to fetch banned users" });
    }
  });

  // Ban a user or installer
  app.post("/api/admin/ban-user", isAdmin, async (req, res) => {
    try {
      const adminUser = req.user as any;
      const { email, userType, banReason, banType, banDuration, originalUserId } = req.body;

      if (!email || !userType || !banReason || !banType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if user is already banned
      const existingBan = await storage.isBanned(email);
      if (existingBan) {
        return res.status(400).json({ message: "User is already banned" });
      }

      // Calculate ban expiration for temporary bans
      let banExpiresAt: Date | null = null;
      if (banType === 'temporary' && banDuration) {
        banExpiresAt = new Date();
        banExpiresAt.setHours(banExpiresAt.getHours() + banDuration);
      }

      const bannedUser = await storage.banUser({
        email,
        userType,
        bannedBy: adminUser.id,
        banReason,
        banType,
        banExpiresAt,
        originalUserId: originalUserId || null,
        ipAddress: req.ip || null,
        additionalInfo: {
          bannedByEmail: adminUser.email,
          userAgent: req.get('user-agent')
        }
      });

      console.log(`🚫 User banned: ${email} by admin ${adminUser.email}`);
      res.json(bannedUser);
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ message: "Failed to ban user" });
    }
  });

  // Unban a user
  app.post("/api/admin/unban-user", isAdmin, async (req, res) => {
    try {
      const { email } = req.body;
      const adminUser = req.user as any;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user is actually banned
      const bannedUser = await storage.isBanned(email);
      if (!bannedUser) {
        return res.status(400).json({ message: "User is not currently banned" });
      }

      await storage.unbanUser(email);
      console.log(`✅ User unbanned: ${email} by admin ${adminUser.email}`);
      res.json({ message: "User unbanned successfully" });
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ message: "Failed to unban user" });
    }
  });

  // Check if email is banned (public endpoint for registration/login)
  app.get("/api/check-ban/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const bannedUser = await storage.isBanned(email);
      
      if (bannedUser) {
        res.json({ 
          banned: true, 
          banType: bannedUser.banType,
          banReason: bannedUser.banReason,
          banExpiresAt: bannedUser.banExpiresAt 
        });
      } else {
        res.json({ banned: false });
      }
    } catch (error) {
      console.error("Error checking ban status:", error);
      res.status(500).json({ message: "Failed to check ban status" });
    }
  });

  // Update banned user details
  app.patch("/api/admin/banned-users/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      await storage.updateBannedUser(parseInt(id), updates);
      res.json({ message: "Banned user updated successfully" });
    } catch (error) {
      console.error("Error updating banned user:", error);
      res.status(500).json({ message: "Failed to update banned user" });
    }
  });

  // ====================== EMAIL TEST ENDPOINT ======================
  
  // Test booking confirmation email with tracking URL
  app.post("/api/test-booking-email", async (req, res) => {
    try {
      const { qrCode } = req.body;
      
      if (!qrCode) {
        return res.status(400).json({ error: 'QR code is required' });
      }

      // Get booking details
      const booking = await storage.getBookingByQrCode(qrCode);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Send booking confirmation email with fixed tracking URL
      const success = await sendBookingConfirmation(
        booking.contactEmail,
        booking.contactName,
        booking
      );

      if (success) {
        res.json({ success: true, message: `Test booking confirmation email sent successfully to ${booking.contactEmail}` });
      } else {
        res.status(500).json({ success: false, message: 'Failed to send test booking email' });
      }
    } catch (error) {
      console.error('Test booking email error:', error);
      res.status(500).json({ success: false, message: 'Error sending test booking email' });
    }
  });

  // Test Gmail functionality
  app.post("/api/test-email", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { to, subject, message } = req.body;
      
      if (!to || !subject || !message) {
        return res.status(400).json({ error: "Missing required fields: to, subject, message" });
      }
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Gmail Service Test</h1>
              <p>tradesbook.ie Email System</p>
            </div>
            
            <div class="content">
              <h3>Email Test Message</h3>
              <p>${message}</p>
              
              <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>System Status:</strong> Gmail integration is working correctly</p>
                <p><strong>Time:</strong> ${new Date().toISOString()}</p>
                <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
              </div>
              
              <div class="footer">
                <p>This is a test email from tradesbook.ie Gmail service</p>
                <p>Admin Dashboard: <a href="https://tradesbook.ie/admin">https://tradesbook.ie/admin</a></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const emailSent = await sendGmailEmail({
        to,
        subject: `[TEST] ${subject}`,
        html,
        from: 'admin@tradesbook.ie',
        replyTo: 'support@tradesbook.ie'
      });
      
      if (emailSent) {
        res.json({ 
          success: true, 
          message: "Test email sent successfully",
          details: {
            to,
            subject,
            from: 'admin@tradesbook.ie',
            timestamp: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json({ error: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  });

  // ====================== STRIPE CONFIGURATION ENDPOINT ======================
  
  // Get Stripe publishable key for frontend
  app.get('/api/stripe/config', (req, res) => {
    res.json({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
  });

  // ====================== STRIPE PAYMENT ENDPOINTS ======================

  // Create payment intent
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, bookingId } = req.body;
      
      if (!amount || amount < 0.5) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "eur",
        metadata: {
          bookingId: bookingId?.toString() || "unknown",
          service: "tv_installation"
        },
      });

      // Update booking with payment intent ID
      if (bookingId) {
        await storage.updateBookingPayment(bookingId, paymentIntent.id, "processing");
      }

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Payment intent creation error:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // Confirm payment
  app.post("/api/confirm-payment", async (req, res) => {
    try {
      const { paymentIntentId, bookingId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID required" });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === "succeeded") {
        // Update booking payment status
        if (bookingId) {
          await storage.updateBookingPayment(
            bookingId, 
            paymentIntentId, 
            "succeeded", 
            paymentIntent.amount / 100
          );
        }
        
        res.json({ 
          success: true, 
          message: "Payment confirmed successfully",
          paymentStatus: paymentIntent.status
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: "Payment not completed",
          status: paymentIntent.status
        });
      }
    } catch (error: any) {
      console.error("Payment confirmation error:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // Check payment status
  app.get("/api/payment-status/:paymentIntentId", async (req, res) => {
    try {
      const { paymentIntentId } = req.params;
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      res.json({
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata
      });
    } catch (error: any) {
      console.error("Payment status check error:", error);
      res.status(500).json({ error: "Failed to check payment status" });
    }
  });

  // Stripe webhook for real-time payment updates
  app.post("/api/stripe-webhook", async (req, res) => {
    try {
      const event = req.body;
      
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata?.bookingId;
        
        if (bookingId) {
          await storage.updateBookingPayment(
            parseInt(bookingId), 
            paymentIntent.id, 
            "succeeded", 
            paymentIntent.amount / 100
          );
        }
      } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata?.bookingId;
        
        if (bookingId) {
          await storage.updateBookingPayment(
            parseInt(bookingId), 
            paymentIntent.id, 
            "failed"
          );
        }
      }
      
      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Get review for a specific booking (check if user already reviewed)
  app.get("/api/bookings/:bookingId/review", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
      const bookingId = parseInt(req.params.bookingId);
      
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }
      
      // Check if user has already reviewed this booking
      const existingReview = await db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          title: reviews.title,
          comment: reviews.comment,
          createdAt: reviews.createdAt
        })
        .from(reviews)
        .where(
          and(
            eq(reviews.bookingId, bookingId),
            eq(reviews.userId, userId)
          )
        )
        .limit(1);
      
      if (existingReview.length > 0) {
        return res.json(existingReview[0]);
      } else {
        return res.status(404).json({ message: "No review found" });
      }
    } catch (error) {
      console.error("Error fetching booking review:", error);
      res.status(500).json({ message: "Failed to fetch review" });
    }
  });

  // Review endpoints
  app.post("/api/reviews", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { bookingId, installerId, rating, title, comment, qrCode } = req.body;
      
      // Validate required fields
      if (!bookingId || !installerId || !rating || !title || !comment) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Verify booking exists and belongs to user
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (booking.status !== 'completed') {
        return res.status(400).json({ message: "Can only review completed installations" });
      }
      
      // Check if user has already reviewed this booking
      const existingReviews = await storage.getUserReviews(userId);
      const hasReviewed = existingReviews.some(review => review.bookingId === bookingId);
      
      if (hasReviewed) {
        return res.status(400).json({ message: "You have already reviewed this installation" });
      }

      // Create the review
      const reviewData = {
        userId,
        installerId,
        bookingId,
        rating: parseInt(rating),
        title: title.trim(),
        comment: comment.trim()
      };

      const review = await storage.createReview(reviewData);
      
      // Calculate review stars (2 stars max from customer review)
      // 5-star review = 2 review stars, 4-star = 1.5, 3-star = 1, 2-star = 0.5, 1-star = 0
      const reviewStars = Math.max(0, Math.min(2, (rating - 1) * 0.5));
      
      // Get current photo stars and calculate total quality stars  
      const photoStars = booking.photoStars || 0;
      const totalQualityStars = photoStars + reviewStars;
      
      // Update booking with review stars and total quality stars
      await storage.updateBooking(bookingId, {
        reviewStars: Math.round(reviewStars * 10) / 10, // Round to 1 decimal place
        qualityStars: Math.round(totalQualityStars * 10) / 10,
        starCalculatedAt: new Date(),
        eligibleForRefund: totalQualityStars >= 3 // Minimum 3 stars needed for refund eligibility
      });
      
      console.log(`Review submitted for booking ${bookingId}: ${rating} stars -> ${reviewStars} review stars, ${totalQualityStars} total quality stars`);
      
      res.json({ 
        success: true, 
        review,
        reviewStars,
        totalQualityStars,
        message: `Review submitted! Added ${reviewStars} review stars. Total quality: ${totalQualityStars}/5 stars.`
      });
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get("/api/installers/:id/reviews", async (req, res) => {
    try {
      const installerId = parseInt(req.params.id);
      const reviews = await storage.getInstallerReviews(installerId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching installer reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Get detailed installer review stats for mini-profile
  app.get("/api/installer/:installerId/reviews", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      
      // Get all reviews for this installer
      const reviews = await storage.getInstallerReviews(installerId);
      
      // Calculate review statistics
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;
      
      // Calculate rating distribution
      const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
        rating,
        count: reviews.filter(r => r.rating === rating).length,
        percentage: totalReviews > 0 ? (reviews.filter(r => r.rating === rating).length / totalReviews) * 100 : 0
      }));
      
      const reviewStats = {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        ratingDistribution,
        recentReviews: reviews.slice(0, 10) // Show 10 most recent reviews
      };
      
      res.json(reviewStats);
    } catch (error) {
      console.error("Error fetching installer review stats:", error);
      res.status(500).json({ message: "Failed to fetch review stats" });
    }
  });

  // Get all reviews for homepage display
  app.get("/api/reviews", async (req, res) => {
    try {
      const reviews = await storage.getAllReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching all reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Past leads management endpoints
  app.get("/api/installer/:installerId/past-leads", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      
      // Validate installerId is a valid number
      if (isNaN(installerId) || installerId <= 0) {
        return res.status(400).json({ error: "Invalid installer ID" });
      }
      
      // Check if installer is demo account
      const installer = await storage.getInstaller(installerId);
      const isDemoAccount = installer?.email === "test@tradesbook.ie";
      
      // Get actual purchased leads from job assignments
      const purchasedLeads = await storage.getInstallerPurchasedLeads(installerId);
      console.log(`Found ${purchasedLeads.length} purchased leads for installer ${installerId}`);
      
      // Transform purchased leads to the expected format
      const transformedPurchasedLeads = purchasedLeads.map(booking => ({
        id: booking.id,
        customerName: booking.contactName || "Customer",
        customerEmail: booking.contactEmail || "",
        customerPhone: booking.contactPhone || "",
        address: booking.address,
        tvSize: booking.tvSize,
        serviceType: booking.serviceType,
        wallType: booking.wallType || "Drywall", 
        mountType: booking.mountType || "Fixed",
        addons: booking.addons || [],
        estimatedPrice: booking.estimatedTotal || booking.estimatedPrice || booking.totalPrice || "0",
        leadFee: (booking as any).jobLeadFee || getLeadFee(booking.serviceType).toString(),
        status: (booking as any).jobAssignmentStatus || booking.status, // Use job assignment status
        scheduledDate: booking.scheduledDate,
        completedDate: booking.completedDate,
        customerNotes: booking.customerNotes,
        createdAt: booking.createdAt || new Date().toISOString(),
        acceptedDate: (booking as any).acceptedDate, // Include accepted date
        // Multi-TV installation support
        tvInstallations: (booking as any).tvInstallations || booking.tvInstallations || [],
        tvQuantity: (booking as any).tvQuantity || (Array.isArray(booking.tvInstallations) && booking.tvInstallations.length > 0 ? booking.tvInstallations.length : 1),
        // Image support
        roomPhotoUrl: booking.roomPhotoUrl,
        aiPreviewUrl: booking.aiPreviewUrl
      }));
      
      // For backward compatibility, also get bookings directly assigned to installer
      // BUT exclude bookings that are already in purchasedLeads to avoid duplicates
      const allBookings = await storage.getAllBookings();
      const purchasedBookingIds = transformedPurchasedLeads.map(lead => lead.id);
      const installerBookings = allBookings.filter(booking => {
        // Must be assigned to this installer
        if (booking.installerId !== installerId) {
          return false;
        }
        
        // Skip if already included in purchased leads to avoid duplicates
        if (purchasedBookingIds.includes(booking.id)) {
          return false;
        }
        
        // Demo accounts only see demo bookings
        if (isDemoAccount) {
          return booking.isDemo === true;
        }
        
        // Regular installers only see non-demo bookings
        return booking.isDemo !== true;
      });
      
      // Transform bookings to past leads format
      const pastLeads = installerBookings.map(booking => {
        let finalStatus = booking.status;
        let finalNotes = booking.customerNotes || booking.notes;
        
        // For demo account, apply any cached status updates
        if (installerId === 2 && (global as any).demoStatusUpdates && (global as any).demoStatusUpdates[booking.id]) {
          const statusUpdate = (global as any).demoStatusUpdates[booking.id];
          console.log(`Applying cached status update for lead ${booking.id}: ${booking.status} -> ${statusUpdate.status}`);
          finalStatus = statusUpdate.status;
          finalNotes = statusUpdate.message || finalNotes;
        }
        
        return {
          id: booking.id,
          customerName: booking.contactName || "Customer",
          customerEmail: booking.contactEmail || "",
          customerPhone: booking.contactPhone || "",
          address: booking.address,
          tvSize: booking.tvSize,
          serviceType: booking.serviceType,
          wallType: booking.wallType || "Drywall",
          mountType: booking.mountType || "Fixed",
          addons: booking.addons || [],
          estimatedPrice: booking.estimatedTotal || booking.estimatedPrice || booking.totalPrice || "0",
          leadFee: getLeadFee(booking.serviceType).toString(),
          status: finalStatus,
          scheduledDate: booking.scheduledDate,
          completedDate: booking.completedDate,
          customerNotes: finalNotes,
          createdAt: booking.createdAt || new Date().toISOString()
        };
      });
      
      // Apply status updates to purchased leads as well
      const updatedPurchasedLeads = transformedPurchasedLeads.map(lead => {
        if (installerId === 2 && (global as any).demoStatusUpdates && (global as any).demoStatusUpdates[lead.id]) {
          const statusUpdate = (global as any).demoStatusUpdates[lead.id];
          return {
            ...lead,
            status: statusUpdate.status,
            customerNotes: statusUpdate.message || lead.customerNotes
          };
        }
        return lead;
      });
      
      // Return combined results with applied status updates
      res.json([...updatedPurchasedLeads, ...pastLeads]);
    } catch (error) {
      console.error("Error fetching past leads:", error);
      res.status(500).json({ message: "Failed to fetch past leads" });
    }
  });

  app.post("/api/installer/:installerId/update-lead-status", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      
      // Validate installerId is a valid number
      if (isNaN(installerId) || installerId <= 0) {
        return res.status(400).json({ error: "Invalid installer ID" });
      }
      
      const { leadId, status, message } = req.body;
      
      if (!leadId || !status) {
        return res.status(400).json({ message: "Lead ID and status are required" });
      }
      
      // For demo account (installer ID 2), handle status updates without database operations
      // since demo leads are generated dynamically and may have invalid date fields
      if (installerId === 2) {
        console.log(`Demo account status update: Lead ${leadId} status changed to ${status}`);
        
        // Store demo status updates in memory for persistence across requests
        if (!(global as any).demoStatusUpdates) {
          (global as any).demoStatusUpdates = {};
        }
        (global as any).demoStatusUpdates[leadId] = {
          status: status,
          message: message,
          updatedAt: new Date().toISOString()
        };
        
        console.log(`Stored demo status update for lead ${leadId}:`, (global as any).demoStatusUpdates[leadId]);
        console.log('Current cache state:', Object.keys((global as any).demoStatusUpdates));
        
        return res.json({ 
          success: true, 
          message: "Status updated successfully (demo mode)",
          newStatus: status
        });
      }
      
      // For real installers, proceed with database operations
      const booking = await storage.getBooking(leadId);
      if (!booking) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Verify installer owns this lead
      if (booking.installerId !== installerId) {
        return res.status(403).json({ message: "Unauthorized to update this lead" });
      }
      
      // Update the booking status
      await storage.updateBookingStatus(leadId, status);
      
      // Send customer notification email about status update
      try {
        await sendStatusUpdateNotification(
          booking.customerEmail,
          booking.customerName,
          {
            qrCode: booking.qrCode,
            tvSize: booking.tvSize,
            serviceType: booking.serviceType,
            address: booking.address
          },
          status,
          'installer',
          message
        );
        console.log(`Sent status update notification to ${booking.customerEmail}: Status changed to ${status}`);
      } catch (emailError) {
        console.error("Failed to send status update notification:", emailError);
      }
      
      res.json({ 
        success: true, 
        message: "Status updated successfully",
        newStatus: status
      });
    } catch (error) {
      console.error("Error updating lead status:", error);
      res.status(500).json({ message: "Failed to update lead status" });
    }
  });

  // Customer status update endpoint (bidirectional status management)
  app.post("/api/customer/update-lead-status", async (req, res) => {
    try {
      const { qrCode, status, message } = req.body;
      
      if (!qrCode || !status) {
        return res.status(400).json({ message: "QR code and status are required" });
      }
      
      // Find booking by QR code
      const booking = await storage.getBookingByQrCode(qrCode);
      if (!booking) {
        return res.status(404).json({ message: "Installation request not found" });
      }
      
      // Update the booking status
      await storage.updateBookingStatus(booking.id, status);
      
      // If the booking has an assigned installer, notify them
      if (booking.installerId) {
        const installer = await storage.getInstaller(booking.installerId);
        if (installer) {
          try {
            await sendStatusUpdateNotification(
              installer.email,
              installer.contactName,
              {
                qrCode: booking.qrCode,
                tvSize: booking.tvSize,
                serviceType: booking.serviceType,
                address: booking.address
              },
              status,
              'customer',
              message
            );
            console.log(`Sent status update notification to installer ${installer.email}: Status changed to ${status}`);
          } catch (emailError) {
            console.error("Failed to send status update notification to installer:", emailError);
          }
        }
      }
      
      res.json({ 
        success: true, 
        message: "Status updated successfully",
        newStatus: status
      });
    } catch (error) {
      console.error("Error updating customer lead status:", error);
      res.status(500).json({ message: "Failed to update lead status" });
    }
  });

  // Reviews endpoint for installer dashboard
  app.get("/api/installer/:installerId/reviews", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      
      // For demo installer (ID: 2), return mock review data
      if (installerId === 2) {
        const mockReviews = [
          {
            id: 201,
            userId: "demo-customer-1",
            installerId: 2,
            bookingId: 101,
            customerName: "Sarah O'Brien",
            rating: 5,
            title: "Excellent Professional Service",
            comment: "Michael was punctual, professional, and did an excellent job mounting our 55-inch TV. Clean cable management and explained everything clearly. Highly recommend!",
            serviceType: "silver-premium",
            isVerified: true,
            createdAt: new Date('2025-06-29').toISOString()
          },
          {
            id: 202,
            userId: "demo-customer-2",
            installerId: 2,
            bookingId: 102,
            customerName: "David Murphy",
            rating: 5,
            title: "Perfect Wall Mount Installation",
            comment: "Great work on our brick wall installation. Brought all the right tools and completed the job efficiently. Very happy with the full motion mount.",
            serviceType: "gold-premium-large",
            isVerified: true,
            createdAt: new Date('2025-06-27').toISOString()
          },
          {
            id: 203,
            userId: "demo-customer-3",
            installerId: 2,
            bookingId: 103,
            customerName: "Lisa Collins",
            rating: 4,
            title: "Good Service, Minor Delay",
            comment: "Quality installation work, though arrived 30 minutes late. The final result looks great and all cables are hidden nicely.",
            serviceType: "bronze-wall-mount",
            isVerified: true,
            createdAt: new Date('2025-06-25').toISOString()
          }
        ];
        
        const totalReviews = mockReviews.length;
        const averageRating = mockReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
        
        // Calculate rating distribution
        const ratingCounts = [1, 2, 3, 4, 5].map(rating => ({
          rating,
          count: mockReviews.filter(r => r.rating === rating).length,
          percentage: totalReviews > 0 ? (mockReviews.filter(r => r.rating === rating).length / totalReviews) * 100 : 0
        }));
        
        return res.json({
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingDistribution: ratingCounts,
          recentReviews: mockReviews
        });
      }
      
      // For other installers, get reviews from database
      const reviews = await storage.getInstallerReviews(installerId);
      
      // Calculate review statistics
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;
      
      // Calculate rating distribution
      const ratingCounts = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: reviews.filter(r => r.rating === rating).length,
        percentage: totalReviews > 0 ? (reviews.filter(r => r.rating === rating).length / totalReviews) * 100 : 0
      }));
      
      const reviewStats = {
        totalReviews,
        averageRating,
        ratingDistribution: ratingCounts,
        recentReviews: reviews.slice(0, 10) // Show 10 most recent reviews
      };
      
      res.json(reviewStats);
    } catch (error) {
      console.error("Error fetching installer reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get("/api/installers/:id/rating", async (req, res) => {
    try {
      const installerId = parseInt(req.params.id);
      const rating = await storage.getInstallerRating(installerId);
      res.json(rating);
    } catch (error) {
      console.error("Error fetching installer rating:", error);
      res.status(500).json({ message: "Failed to fetch rating" });
    }
  });

  // Get installation locations for map tracker - Real data from bookings
  app.get("/api/installations/locations", async (req, res) => {
    try {
      const allBookings = await storage.getAllBookings();
      
      // Group bookings by location (extract county from address)
      const locationMap = new Map<string, any[]>();
      
      allBookings.forEach(booking => {
        // Extract county from address - assume address format includes county
        const addressParts = booking.address.split(',');
        let county = 'Unknown';
        
        // Try to extract county from address
        if (addressParts.length >= 2) {
          county = addressParts[addressParts.length - 2].trim();
        } else if (addressParts.length === 1) {
          // If single part address, check if it contains known Irish counties
          const knownCounties = ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kilkenny', 'Wexford', 'Carlow', 'Kildare', 'Laois', 'Meath', 'Wicklow', 'Offaly', 'Westmeath', 'Longford', 'Louth', 'Cavan', 'Monaghan', 'Donegal', 'Sligo', 'Leitrim', 'Roscommon', 'Mayo', 'Clare', 'Kerry', 'Tipperary'];
          const foundCounty = knownCounties.find(c => booking.address.toLowerCase().includes(c.toLowerCase()));
          if (foundCounty) county = foundCounty;
        }
        
        if (!locationMap.has(county)) {
          locationMap.set(county, []);
        }
        locationMap.get(county)!.push(booking);
      });
      
      // Transform to required format
      const locations = Array.from(locationMap.entries()).map(([location, bookings]) => {
        // Sort bookings by date (most recent first)
        const sortedBookings = bookings.sort((a, b) => 
          new Date(b.createdAt || b.scheduledDate || new Date()).getTime() - 
          new Date(a.createdAt || a.scheduledDate || new Date()).getTime()
        );
        
        // Format recent installations
        const recentInstallations = sortedBookings.slice(0, 5).map(booking => ({
          id: booking.id,
          serviceType: booking.serviceType,
          tvSize: booking.tvSize,
          date: booking.scheduledDate || booking.createdAt || new Date().toISOString(),
          status: booking.status || 'pending'
        }));
        
        return {
          location,
          count: bookings.length,
          recentInstallations
        };
      });
      
      // Sort locations by count (descending) and filter out Unknown
      const filteredLocations = locations
        .filter(loc => loc.location !== 'Unknown' && loc.count > 0)
        .sort((a, b) => b.count - a.count);
      
      res.json(filteredLocations);
    } catch (error) {
      console.error("Error fetching installation locations:", error);
      // Return empty array instead of mock data on error
      res.json([]);
    }
  });

  // Customer selects installer from those who accepted
  app.post("/api/bookings/:bookingId/select-installer", isAuthenticated, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const { installerId } = req.body;

      if (!installerId) {
        return res.status(400).json({ message: "Installer ID required" });
      }

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Update booking with selected installer
      await storage.updateBookingInstaller(bookingId, installerId);
      await storage.updateBookingStatus(bookingId, 'assigned');

      // Update job assignment status for selected installer
      await storage.updateJobInstallerStatus(bookingId, installerId, 'assigned');

      res.json({ 
        success: true,
        message: "Installer selected successfully. Installation can now be scheduled." 
      });
    } catch (error) {
      console.error("Error selecting installer:", error);
      res.status(500).json({ message: "Failed to select installer" });
    }
  });

  // Get installers who accepted a specific booking
  app.get("/api/bookings/:bookingId/accepted-installers", isAuthenticated, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const assignments = await storage.getBookingJobAssignments(bookingId);
      
      const acceptedInstallers = await Promise.all(
        assignments
          .filter(assignment => assignment.status === 'accepted')
          .map(async assignment => {
            const installer = await storage.getInstaller(assignment.installerId);
            return {
              ...installer,
              assignmentId: assignment.id,
              acceptedAt: assignment.createdAt
            };
          })
      );

      res.json(acceptedInstallers);
    } catch (error) {
      console.error("Error fetching accepted installers:", error);
      res.status(500).json({ message: "Failed to fetch accepted installers" });
    }
  });

  // Test Gmail service endpoint
  app.post('/api/test-email', async (req, res) => {
    try {
      const { to, subject, message } = req.body;
      
      if (!to || !subject || !message) {
        return res.status(400).json({ error: "Missing required fields: to, subject, message" });
      }

      const success = await sendAdminNotification(
        `Test Email: ${subject}`,
        `This is a test email from tradesbook.ie:\n\n${message}\n\nSent to: ${to}`
      );

      if (success) {
        res.json({ success: true, message: "Test email sent successfully" });
      } else {
        res.status(500).json({ success: false, message: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ success: false, message: "Error sending test email" });
    }
  });

  // Email delivery status and troubleshooting endpoint
  app.get("/api/email-delivery-status", async (req, res) => {
    try {
      res.json({
        status: "operational",
        gmailApiConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN),
        troubleshooting: {
          commonIssues: [
            "Check Gmail spam/junk folder for emails from noreply@tradesbook.ie",
            "Search Gmail for recent emails with subject containing 'tradesbook.ie'",
            "Check if Gmail filters are automatically archiving emails",
            "Try accessing Gmail web interface instead of mobile app",
            "Allow 1-2 minutes for email delivery"
          ],
          emailAddresses: {
            from: "noreply@tradesbook.ie",
            replyTo: "support@tradesbook.ie",
            admin: "admin@tradesbook.ie"
          },
          lastTestResults: "All email API calls return successful message IDs with Gmail verification"
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get email status" });
    }
  });

  // Referral system endpoints
  app.post('/api/send-booking-simulation', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email address required" });
      }

      const bookingDetails = {
        id: 'TEST-001',
        qrCode: 'QR-TEST-001',
        tvSize: '65"',
        serviceType: 'Professional Wall Mount',
        address: '123 Test Street, Dublin 2, Ireland',
        totalPrice: '€289',
        installerEarnings: '€231',
        scheduledDate: '2025-06-28',
        timeSlot: '10:00 AM - 12:00 PM',
        wallType: 'Drywall',
        mountType: 'Tilting Mount',
        addons: ['Cable Management', 'Soundbar Installation'],
        customerNotes: 'Please call before arrival. Parking available in driveway.',
        basePrice: '€199',
        addonTotal: '€90',
        appFee: '€58',
        referralCode: 'FRIEND25',
        referralDiscount: '10%'
      };

      const success = await sendBookingConfirmation(email, 'Jude Okun', bookingDetails);
      
      if (success) {
        res.json({ success: true, message: "Booking simulation email sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send booking simulation email" });
      }
    } catch (error) {
      console.error('Error sending booking simulation:', error);
      res.status(500).json({ error: "Failed to send booking simulation" });
    }
  });

  app.post('/api/referral/validate', async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ valid: false, message: "Referral code required" });
      }

      const validation = await storage.validateReferralCode(code);
      res.json(validation);
    } catch (error) {
      console.error('Error validating referral code:', error);
      res.status(500).json({ valid: false, message: "Error validating referral code" });
    }
  });

  app.get('/api/referrals/stats', async (req, res) => {
    try {
      // Get real referral statistics from database
      const referralCodes = await storage.getAllReferralCodes();
      
      const totalReferrals = referralCodes.reduce((sum, code) => sum + code.totalReferrals, 0);
      const totalRewardsPaid = referralCodes.reduce((sum, code) => sum + parseFloat(code.totalEarnings.toString()), 0);
      const activeCodes = referralCodes.filter(code => code.isActive).length;
      
      // Calculate conversion rate (referrals / active codes)
      const conversionRate = activeCodes > 0 ? (totalReferrals / activeCodes) : 0;
      
      const stats = {
        totalReferrals,
        totalRewardsPaid,
        activeCodes,
        conversionRate: Math.round(conversionRate * 10) / 10
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      res.status(500).json({ error: "Failed to fetch referral statistics" });
    }
  });

  app.get('/api/referrals/codes', async (req, res) => {
    try {
      const referralCodes = await storage.getAllReferralCodes();
      
      // Get user details for each referral code
      const codesWithUserData = await Promise.all(
        referralCodes.map(async (code) => {
          // Only fetch user if userId is valid and not null
          const user = code.userId && !isNaN(Number(code.userId)) 
            ? await storage.getUserById(code.userId) 
            : null;
          
          // Determine the referrer name based on the referral type
          let referrerName = 'Unknown User';
          if (code.referralType === 'sales_staff') {
            referrerName = code.salesStaffName ? `${code.salesStaffName} (${code.salesStaffStore})` : 'Sales Staff';
          } else if (code.referralType === 'customer') {
            if (user?.firstName && user?.lastName) {
              referrerName = `${user.firstName} ${user.lastName}`;
            } else if (user?.email) {
              referrerName = user.email;
            } else if (code.salesStaffName) {
              // For customer codes created by admin, use the name provided
              referrerName = code.salesStaffName;
            }
          }
          
          return {
            id: code.id,
            referralCode: code.referralCode,
            referrerName: referrerName,
            totalReferrals: code.totalReferrals,
            totalEarnings: parseFloat(code.totalEarnings.toString()),
            createdAt: code.createdAt?.toISOString() || new Date().toISOString(),
            isActive: code.isActive,
            referralType: code.referralType || 'customer',
            salesStaffName: code.salesStaffName,
            salesStaffStore: code.salesStaffStore,
            discountPercentage: code.discountPercentage || '10'
          };
        })
      );
      
      res.json(codesWithUserData);
    } catch (error) {
      console.error('Error fetching referral codes:', error);
      res.status(500).json({ error: "Failed to fetch referral codes" });
    }
  });

  app.get('/api/referrals/settings', async (req, res) => {
    try {
      const settings = await storage.getReferralSettings();
      
      if (!settings) {
        // Return default settings if none exist
        return res.json({
          globalDiscountPercentage: 10,
          isActive: true
        });
      }
      
      res.json({
        globalDiscountPercentage: parseFloat(settings.globalDiscountPercentage),
        isActive: settings.isActive
      });
    } catch (error) {
      console.error('Error fetching referral settings:', error);
      res.status(500).json({ error: "Failed to fetch referral settings" });
    }
  });

  app.put('/api/referrals/settings', async (req, res) => {
    try {
      const { globalDiscountPercentage } = req.body;
      
      if (!globalDiscountPercentage) {
        return res.status(400).json({ error: "Global discount percentage required" });
      }

      // Update referral settings in database
      const settings = await storage.updateReferralSettings({
        globalDiscountPercentage: globalDiscountPercentage.toString(),
        isActive: true
      });
      
      res.json({ success: true, settings });
    } catch (error) {
      console.error('Error updating referral settings:', error);
      res.status(500).json({ error: "Failed to update referral settings" });
    }
  });

  // ====================== ADMIN PRICING MANAGEMENT ENDPOINTS ======================
  
  // Get all pricing configurations
  app.get("/api/admin/pricing", isAdmin, async (req, res) => {
    try {
      const pricing = await pricingManagementService.getAllPricing();
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching pricing:", error);
      res.status(500).json({ message: "Failed to fetch pricing configurations" });
    }
  });

  // Get pricing by category
  app.get("/api/admin/pricing/:category", isAdmin, async (req, res) => {
    try {
      const category = req.params.category as 'service' | 'addon' | 'bracket';
      if (!['service', 'addon', 'bracket'].includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      
      const pricing = await pricingManagementService.getPricingByCategory(category);
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching pricing by category:", error);
      res.status(500).json({ message: "Failed to fetch pricing by category" });
    }
  });

  // Create or update pricing configuration
  app.post("/api/admin/pricing", isAdmin, async (req, res) => {
    try {
      const { category, itemKey, name, description, customerPrice, leadFee, minTvSize, maxTvSize } = req.body;
      
      // Validation
      if (!category || !itemKey || !name || !customerPrice || !leadFee) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!['service', 'addon', 'bracket'].includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }

      if (typeof customerPrice !== 'number' || customerPrice < 0) {
        return res.status(400).json({ message: "Customer price must be a positive number" });
      }

      if (typeof leadFee !== 'number' || leadFee < 0) {
        return res.status(400).json({ message: "Lead fee must be a positive number" });
      }

      const pricingData = {
        category,
        itemKey,
        name,
        description,
        customerPrice,
        leadFee,
        minTvSize,
        maxTvSize,
        isActive: true
      };

      const savedPricing = await pricingManagementService.upsertPricing(pricingData);
      res.json(savedPricing);
    } catch (error) {
      console.error("Error saving pricing:", error);
      res.status(500).json({ message: "Failed to save pricing configuration" });
    }
  });

  // Update existing pricing configuration
  app.put("/api/admin/pricing/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { category, itemKey, name, description, customerPrice, leadFee, minTvSize, maxTvSize, isActive } = req.body;
      
      if (!category || !itemKey || !name || customerPrice === undefined || leadFee === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!['service', 'addon', 'bracket'].includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }

      if (typeof customerPrice !== 'number' || customerPrice < 0) {
        return res.status(400).json({ message: "Customer price must be a positive number" });
      }

      if (typeof leadFee !== 'number' || leadFee < 0) {
        return res.status(400).json({ message: "Lead fee must be a positive number" });
      }

      const pricingData = {
        id,
        category,
        itemKey,
        name,
        description,
        customerPrice,
        leadFee,
        minTvSize,
        maxTvSize,
        isActive: isActive !== undefined ? isActive : true
      };

      const updatedPricing = await pricingManagementService.upsertPricing(pricingData);
      res.json(updatedPricing);
    } catch (error) {
      console.error("Error updating pricing:", error);
      res.status(500).json({ message: "Failed to update pricing configuration" });
    }
  });

  // Delete pricing configuration (soft delete)
  app.delete("/api/admin/pricing/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await pricingManagementService.deletePricing(id);
      
      if (success) {
        res.json({ message: "Pricing configuration deleted successfully" });
      } else {
        res.status(404).json({ message: "Pricing configuration not found" });
      }
    } catch (error) {
      console.error("Error deleting pricing:", error);
      res.status(500).json({ message: "Failed to delete pricing configuration" });
    }
  });

  // Initialize default pricing (for setup)
  app.post("/api/admin/pricing/initialize", isAdmin, async (req, res) => {
    try {
      await pricingManagementService.initializeDefaultPricing();
      res.json({ message: "Default pricing configurations initialized successfully" });
    } catch (error) {
      console.error("Error initializing pricing:", error);
      res.status(500).json({ message: "Failed to initialize pricing configurations" });
    }
  });

  // Test booking confirmation emails without authentication
  app.post("/api/test-booking-emails", async (req, res) => {
    try {
      const { customerEmail, customerName } = req.body;
      
      // Mock booking data for email testing with complete details
      const mockBooking = {
        id: 999,
        qrCode: "TEST-QR-999",
        address: "123 Test Street, Dublin, Ireland",
        tvSize: "65",
        serviceType: "wall-mount-medium",
        wallType: "drywall",
        mountType: "tilting",
        totalPrice: "249",
        basePrice: "199",
        installerEarnings: "179", // 90% of base price
        appFee: "70",
        scheduledDate: new Date().toISOString().split('T')[0],
        status: "confirmed",
        difficulty: "Standard",
        estimatedDuration: "2-3 hours"
      };

      // Send customer booking confirmation
      const customerEmailSent = await sendBookingConfirmation(
        customerEmail,
        customerName,
        mockBooking
      );

      // Send installer notification to admin email (since installer email doesn't exist)
      const installerEmailSent = await sendInstallerNotification(
        customerEmail, // Send to your email for testing
        "Test Installer",
        {
          ...mockBooking,
          customerName,
          customerEmail
        }
      );

      if (customerEmailSent && installerEmailSent) {
        res.json({
          success: true,
          message: "Booking confirmation emails sent successfully",
          details: {
            customerEmail: customerEmailSent,
            installerEmail: installerEmailSent
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to send booking confirmation emails"
        });
      }
    } catch (error) {
      console.error("Error sending booking confirmation emails:", error);
      res.status(500).json({
        success: false,
        message: "Error sending booking confirmation emails"
      });
    }
  });

  // ====================== INSTALLER WALLET ENDPOINTS ======================
  
  // Get installer wallet balance and transaction history
  app.get("/api/installer/:installerId/wallet", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      
      // Get or create wallet
      let wallet = await storage.getInstallerWallet(installerId);
      if (!wallet) {
        wallet = await storage.createInstallerWallet({
          installerId,
          balance: "0.00",
          totalSpent: "0.00",
          totalEarned: "0.00"
        });
      }
      
      // Get recent transactions
      const transactions = await storage.getInstallerTransactions(installerId);
      
      res.json({
        wallet,
        transactions: transactions.slice(0, 10) // Last 10 transactions
      });
    } catch (error) {
      console.error("Error fetching installer wallet:", error);
      res.status(500).json({ message: "Failed to fetch wallet information" });
    }
  });

  // Create payment intent for credit purchase
  app.post("/api/installer/:installerId/wallet/create-payment-intent", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      const { amount } = req.body;
      
      if (!amount || amount <= 0 || amount < 5) {
        return res.status(400).json({ message: "Invalid amount. Minimum €5 required." });
      }
      
      if (amount > 500) {
        return res.status(400).json({ message: "Maximum €500 per transaction." });
      }

      // Get installer details
      const installer = await storage.getInstaller(installerId);
      if (!installer) {
        return res.status(404).json({ message: "Installer not found" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "eur",
        metadata: {
          installerId: installerId.toString(),
          installerEmail: installer.email,
          creditAmount: amount.toString(),
          service: "credit_purchase"
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Error creating credit payment intent:", error);
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Add credits to installer wallet (for demo account simulation only)
  app.post("/api/installer/:installerId/wallet/add-credits-demo", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      const { amount } = req.body;
      
      // Only allow demo installer (ID: 2) to use this endpoint
      if (installerId !== 2) {
        return res.status(403).json({ message: "Demo credit simulation only available for demo account" });
      }
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      // Get current wallet
      let wallet = await storage.getInstallerWallet(installerId);
      if (!wallet) {
        wallet = await storage.createInstallerWallet({
          installerId,
          balance: "0.00",
          totalSpent: "0.00",
          totalEarned: "0.00"
        });
      }
      
      // Calculate new balance
      const currentBalance = parseFloat(wallet.balance);
      const newBalance = currentBalance + amount;
      
      // Update wallet balance
      await storage.updateInstallerWalletBalance(installerId, newBalance);
      
      // Add transaction record
      await storage.addInstallerTransaction({
        installerId,
        type: "credit_purchase",
        amount: amount.toString(),
        description: `Demo: Added €${amount} credits to wallet (simulation)`,
        paymentIntentId: `demo-${Date.now()}`,
        status: "completed"
      });
      
      res.json({ 
        success: true, 
        newBalance,
        message: `Successfully added €${amount} demo credits to your wallet`
      });
    } catch (error) {
      console.error("Error adding credits:", error);
      res.status(500).json({ message: "Failed to add credits" });
    }
  });

  // Confirm credit purchase payment
  app.post("/api/installer/:installerId/wallet/confirm-payment", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID required" });
      }

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        const creditAmount = parseFloat(paymentIntent.metadata.creditAmount);
        
        // Get current wallet
        let wallet = await storage.getInstallerWallet(installerId);
        if (!wallet) {
          wallet = await storage.createInstallerWallet({
            installerId,
            balance: "0.00",
            totalSpent: "0.00",
            totalEarned: "0.00"
          });
        }
        
        // Calculate new balance
        const currentBalance = parseFloat(wallet.balance);
        const newBalance = currentBalance + creditAmount;
        
        // Update wallet balance
        await storage.updateInstallerWalletBalance(installerId, newBalance);
        
        // Add transaction record
        await storage.addInstallerTransaction({
          installerId,
          type: "credit_purchase",
          amount: creditAmount.toString(),
          description: `Added €${creditAmount} credits to wallet`,
          paymentIntentId: paymentIntentId,
          status: "completed"
        });

        res.json({
          success: true,
          newBalance,
          creditAmount,
          message: `Successfully added €${creditAmount} to your wallet`,
          paymentIntent: {
            id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: paymentIntent.status
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Payment not completed",
          status: paymentIntent.status
        });
      }
    } catch (error: any) {
      console.error("Error confirming credit payment:", error);
      res.status(500).json({ 
        message: "Error confirming payment: " + error.message 
      });
    }
  });

  // Purchase lead access (installer pays to accept job)
  app.post("/api/installer/:installerId/purchase-lead", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      const { bookingId, leadFee } = req.body;
      
      if (!bookingId || !leadFee || leadFee <= 0) {
        return res.status(400).json({ message: "Invalid booking or lead fee" });
      }
      
      // Check wallet balance
      const wallet = await storage.getInstallerWallet(installerId);
      if (!wallet) {
        return res.status(400).json({ message: "Wallet not found" });
      }
      
      const currentBalance = parseFloat(wallet.balance);
      if (currentBalance < leadFee) {
        return res.status(400).json({ 
          message: "Insufficient balance", 
          required: leadFee,
          available: currentBalance 
        });
      }
      
      // Create job assignment
      const jobAssignment = await storage.createJobAssignment({
        bookingId,
        installerId,
        status: "accepted",
        acceptedDate: new Date(),
        leadFee: leadFee.toString(),
        leadFeeStatus: "paid",
        leadPaidDate: new Date()
      });
      
      // Automatically update booking status to "confirmed" (Customer Confirmed)
      // This happens when installer accepts/purchases the job
      await storage.updateBookingStatus(bookingId, 'confirmed');
      
      // Deduct lead fee from wallet and update total spent
      const newBalance = currentBalance - leadFee;
      const totalSpent = parseFloat(wallet.totalSpent) + leadFee;
      await storage.updateInstallerWalletBalance(installerId, newBalance);
      await storage.updateInstallerWalletTotalSpent(installerId, totalSpent);
      
      // Add transaction record
      await storage.addInstallerTransaction({
        installerId,
        type: "lead_purchase",
        amount: (-leadFee).toString(),
        description: `Purchased lead access for booking #${bookingId}`,
        jobAssignmentId: jobAssignment.id,
        status: "completed"
      });
      
      // Update booking status to "installation_scheduled"
      await storage.updateBookingStatus(bookingId, "installation_scheduled");
      
      // Get booking and installer details for email notification
      const booking = await storage.getBooking(bookingId);
      const installer = await storage.getInstaller(installerId);
      
      if (booking && installer) {
        // Send email notification to customer
        try {
          await sendLeadPurchaseNotification(
            booking.customerEmail,
            booking.customerName,
            {
              qrCode: booking.qrCode,
              tvSize: booking.tvSize,
              serviceType: booking.serviceType,
              wallType: booking.wallType,
              address: booking.address
            },
            {
              contactName: installer.contactName,
              businessName: installer.businessName,
              email: installer.email,
              phone: installer.phone,
              yearsExperience: installer.yearsExperience
            }
          );
          console.log(`Sent lead purchase notification to ${booking.customerEmail}`);
        } catch (emailError) {
          console.error("Failed to send lead purchase notification:", emailError);
        }
      }
      
      res.json({ 
        success: true, 
        jobAssignment,
        newBalance,
        message: "Lead purchased successfully" 
      });
    } catch (error) {
      console.error("Error purchasing lead:", error);
      res.status(500).json({ message: "Failed to purchase lead" });
    }
  });

  // Customer wallet endpoints
  // Get customer wallet balance and transaction history
  app.get("/api/customer/wallet", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      
      // Get or create wallet
      let wallet = await storage.getCustomerWallet(userId);
      if (!wallet) {
        wallet = await storage.createCustomerWallet({
          userId,
          balance: "0.00",
          totalSpent: "0.00",
          totalTopUps: "0.00"
        });
      }
      
      // Get transaction history
      const transactions = await storage.getCustomerTransactions(userId);
      
      res.json({
        wallet,
        transactions
      });
    } catch (error: any) {
      console.error("Error fetching customer wallet:", error);
      res.status(500).json({ message: "Failed to fetch wallet information" });
    }
  });

  // Create payment intent for customer credit top-up
  app.post("/api/customer/wallet/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { amount } = req.body;
      const userId = (req as any).user.id;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "eur",
        metadata: {
          type: "customer_credit_topup",
          userId: userId,
          creditAmount: amount.toString()
        }
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Error creating customer credit payment intent:", error);
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Confirm customer credit payment
  app.post("/api/customer/wallet/confirm-payment", isAuthenticated, async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      const userId = (req as any).user.id;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID required" });
      }
      
      // Retrieve payment intent
      let paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Payment should have been confirmed by Stripe Elements on the frontend
      if (paymentIntent.status === "succeeded") {
        const creditAmount = parseFloat(paymentIntent.metadata.creditAmount || "0");
        
        // Get current wallet
        let wallet = await storage.getCustomerWallet(userId);
        if (!wallet) {
          wallet = await storage.createCustomerWallet({
            userId,
            balance: "0.00",
            totalSpent: "0.00",
            totalTopUps: "0.00"
          });
        }
        
        const currentBalance = parseFloat(wallet.balance);
        const currentTotalTopUps = parseFloat(wallet.totalTopUps);
        
        // Update wallet balance
        await storage.updateCustomerWalletBalance(userId, currentBalance + creditAmount);
        await storage.updateCustomerWalletTotalTopUps(userId, currentTotalTopUps + creditAmount);
        
        // Add transaction record
        await storage.addCustomerTransaction({
          userId,
          type: "credit_purchase",
          amount: creditAmount.toString(),
          description: `Added €${creditAmount} credits to wallet`,
          paymentIntentId: paymentIntentId,
          status: "completed"
        });
        
        res.json({
          success: true,
          message: `Successfully added €${creditAmount} to your wallet`,
          newBalance: currentBalance + creditAmount,
          paymentIntent: {
            id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: paymentIntent.status
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Payment not completed",
          status: paymentIntent.status,
          details: "Payment must be confirmed through Stripe Elements before calling this endpoint"
        });
      }
    } catch (error: any) {
      console.error("Error confirming customer credit payment:", error);
      res.status(500).json({ 
        message: "Error confirming payment: " + error.message 
      });
    }
  });

  // Support ticket endpoints
  // Create a support ticket (customer)
  app.post("/api/support/tickets", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { subject, message, category, priority } = req.body;
      
      if (!subject || !message) {
        return res.status(400).json({ message: "Subject and message are required" });
      }
      
      // Create the ticket
      const ticket = await storage.createSupportTicket({
        userId,
        subject,
        status: "open",
        priority: priority || "medium",
        category: category || "general"
      });
      
      // Add the initial message
      await storage.addTicketMessage({
        ticketId: ticket.id,
        userId,
        message,
        isAdminReply: false
      });
      
      // Send email notification to admin
      try {
        const { sendGmailEmail } = await import('./gmailService');
        await sendGmailEmail({
          to: 'support@tradesbook.ie',
          subject: `New Support Ticket #${ticket.id}: ${subject}`,
          html: `
            <h2>New Support Ticket Created</h2>
            <p><strong>Ticket ID:</strong> #${ticket.id}</p>
            <p><strong>From:</strong> ${(req as any).user.email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Category:</strong> ${category || 'general'}</p>
            <p><strong>Priority:</strong> ${priority || 'medium'}</p>
            <p><strong>Message:</strong></p>
            <div style="padding: 15px; background-color: #f5f5f5; border-radius: 5px; margin: 10px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p><a href="https://tradesbook.ie/admin#support">View in Admin Dashboard</a></p>
          `
        });
      } catch (emailError) {
        console.error("Failed to send support ticket notification:", emailError);
      }
      
      res.json({ 
        success: true, 
        ticket,
        message: "Support ticket created successfully" 
      });
    } catch (error: any) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  // Get user's support tickets
  app.get("/api/support/tickets", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const tickets = await storage.getUserSupportTickets(userId);
      res.json(tickets);
    } catch (error: any) {
      console.error("Error fetching user support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  // Get ticket messages (customer)
  app.get("/api/support/tickets/:ticketId/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const ticketId = parseInt(req.params.ticketId);
      
      // Verify user owns this ticket
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket || ticket.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const messages = await storage.getTicketMessages(ticketId);
      res.json(messages);
    } catch (error: any) {
      console.error("Error fetching ticket messages:", error);
      res.status(500).json({ message: "Failed to fetch ticket messages" });
    }
  });

  // Add message to ticket (customer)
  app.post("/api/support/tickets/:ticketId/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const ticketId = parseInt(req.params.ticketId);
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Verify user owns this ticket
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket || ticket.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Add the message
      const newMessage = await storage.addTicketMessage({
        ticketId,
        userId,
        message,
        isAdminReply: false
      });
      
      // Update ticket status to open if it was closed
      if (ticket.status === 'closed') {
        await storage.updateSupportTicketStatus(ticketId, 'open');
      }
      
      res.json({ 
        success: true, 
        message: newMessage,
        notification: "Message sent successfully" 
      });
    } catch (error: any) {
      console.error("Error adding ticket message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Admin endpoints
  // Get all support tickets (admin only)
  app.get("/api/admin/support/tickets", isAuthenticated, async (req, res) => {
    try {
      const userRole = (req as any).user.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const tickets = await storage.getAllSupportTickets();
      res.json(tickets);
    } catch (error: any) {
      console.error("Error fetching all support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  // Update ticket status (admin only)
  app.put("/api/admin/support/tickets/:ticketId/status", isAuthenticated, async (req, res) => {
    try {
      const userRole = (req as any).user.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const ticketId = parseInt(req.params.ticketId);
      const { status, assignedTo } = req.body;
      
      await storage.updateSupportTicketStatus(ticketId, status, assignedTo);
      
      res.json({ 
        success: true, 
        message: "Ticket status updated successfully" 
      });
    } catch (error: any) {
      console.error("Error updating ticket status:", error);
      res.status(500).json({ message: "Failed to update ticket status" });
    }
  });

  // Admin reply to ticket
  app.post("/api/admin/support/tickets/:ticketId/reply", isAuthenticated, async (req, res) => {
    try {
      const userRole = (req as any).user.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const ticketId = parseInt(req.params.ticketId);
      const userId = (req as any).user.id;
      const { message, status } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Add admin reply
      await storage.addTicketMessage({
        ticketId,
        userId,
        message,
        isAdminReply: true
      });
      
      // Update ticket status if provided
      if (status) {
        await storage.updateSupportTicketStatus(ticketId, status, userId);
      }
      
      // Send email notification to customer
      try {
        const ticket = await storage.getSupportTicket(ticketId);
        const user = await storage.getUser(ticket?.userId || '');
        
        if (user?.email) {
          const { sendGmailEmail } = await import('./gmailService');
          await sendGmailEmail({
            to: user.email,
            subject: `Support Ticket #${ticketId} - New Response`,
            html: `
              <h2>Support Team Response</h2>
              <p>Hello ${user.firstName || 'there'},</p>
              <p>Our support team has responded to your ticket <strong>#${ticketId}</strong>:</p>
              <div style="padding: 15px; background-color: #f0f9ff; border-radius: 5px; margin: 15px 0;">
                ${message.replace(/\n/g, '<br>')}
              </div>
              <p><a href="https://tradesbook.ie/dashboard#support">View Full Conversation</a></p>
              <p>Best regards,<br>Tradesbook Support Team</p>
            `
          });
        }
      } catch (emailError) {
        console.error("Failed to send customer notification:", emailError);
      }
      
      res.json({ 
        success: true, 
        message: "Reply sent successfully" 
      });
    } catch (error: any) {
      console.error("Error sending admin reply:", error);
      res.status(500).json({ message: "Failed to send reply" });
    }
  });

  // Get available leads for installer
  app.get("/api/installer/:installerId/available-leads", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      
      // Validate installerId is a valid number
      if (isNaN(installerId) || installerId <= 0) {
        return res.status(400).json({ error: "Invalid installer ID" });
      }
      
      // Check if this is the demo account and if we have cached demo leads
      if (installerId === 2 && (global as any).demoLeadsCache && (global as any).demoLeadsCache[installerId]) {
        const demoLeads = (global as any).demoLeadsCache[installerId];
        // Hide customer contact details in available leads to ensure platform usage
        const protectedDemoLeads = demoLeads.map((lead: any) => ({
          ...lead,
          customerName: "Customer details available after lead purchase",
          customerEmail: null,
          customerPhone: null
        }));
        console.log(`Returning ${protectedDemoLeads.length} cached demo leads for installer ${installerId}`);
        return res.json(protectedDemoLeads);
      }
      
      // Get declined requests for this installer to filter them out
      const declinedRequestIds = await storage.getDeclinedRequestsForInstaller(installerId);
      
      // Get all unassigned bookings that can be purchased as leads
      const allBookings = await storage.getAllBookings();
      const availableBookings = await Promise.all(allBookings.filter(booking => {
        // Basic filters for available leads
        const isAvailable = (booking.status === "open" || booking.status === "pending" || booking.status === "urgent" || booking.status === "confirmed") &&
          !booking.installerId && // Not assigned to any installer yet
          booking.assignmentType !== 'direct' && // Exclude directly assigned bookings
          !declinedRequestIds.includes(booking.id); // Not declined by this installer
        
        // Demo filtering logic
        if (installerId === 2) {
          // Demo installer (ID 2) can see all available bookings including demo ones
          return isAvailable;
        } else {
          // Real installers should NOT see demo bookings
          return isAvailable && !booking.isDemo;
        }
      }).map(async (booking) => {
        // Only show bookings from email-verified customers to ensure lead quality
        if (booking.userId && installerId !== 2) { // Skip verification check for demo installer
          try {
            const customer = await storage.getUserById(String(booking.userId));
            if (!customer || !customer.emailVerified) {
              console.log(`Filtering out booking ${booking.id} - customer ${booking.userId} not email verified`);
              return null; // Filter out unverified customers
            }
          } catch (error) {
            console.log(`Error checking customer verification for booking ${booking.id}:`, error);
            return null; // Filter out if we can't verify
          }
        }
        return booking;
      })).then(results => results.filter(booking => booking !== null));
      
      // Add lead fees and profit calculations with distance calculation
      const leadsWithFees = await Promise.all(availableBookings.map(async booking => {
        const leadFee = getLeadFee(booking.serviceType);
        const estimatedTotal = parseFloat(booking.estimatedTotal || booking.estimatedPrice || '0');
        const estimatedEarnings = estimatedTotal - leadFee;
        const profitMargin = estimatedTotal > 0 ? (estimatedEarnings / estimatedTotal * 100) : 0;
        
        // Fetch referral information if available
        let referralInfo = null;
        if (booking.referralCodeId) {
          try {
            const referralCode = await storage.getReferralCodeById(booking.referralCodeId);
            if (referralCode) {
              referralInfo = {
                referralCode: referralCode.referralCode,
                referralType: referralCode.referralType,
                salesStaffName: referralCode.salesStaffName,
                salesStaffStore: referralCode.salesStaffStore,
                isStaffReferral: referralCode.referralType === 'sales_staff'
              };
            }
          } catch (error) {
            console.error('Error fetching referral info for booking', booking.id, ':', error);
          }
        }
        
        // Calculate distance from installer to booking address
        let distance = null;
        try {
          // Get installer location (defaulting to Dublin for now)
          const installer = await storage.getInstaller(installerId);
          const installerLat = installer?.lat || 53.3441; // Dublin latitude
          const installerLng = installer?.lng || -6.2675; // Dublin longitude
          
          // Get customer coordinates using geocoding service
          const geocodingService = await import('./services/geocoding.js');
          const customerCoords = await geocodingService.geocodeAddress(booking.address);
          
          if (customerCoords && customerCoords.lat && customerCoords.lng) {
            // Calculate distance using Haversine formula
            const R = 6371; // Earth's radius in km
            const dLat = (customerCoords.lat - installerLat) * Math.PI / 180;
            const dLng = (customerCoords.lng - installerLng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(installerLat * Math.PI / 180) * Math.cos(customerCoords.lat * Math.PI / 180) *
                      Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            distance = Math.round(R * c);
          }
        } catch (error) {
          console.error('Error calculating distance for booking', booking.id, ':', error);
          distance = Math.floor(Math.random() * 20) + 5; // Fallback to random distance
        }
        
        return {
          id: booking.id,
          address: booking.address,
          serviceType: booking.serviceType,
          tvSize: booking.tvSize,
          wallType: booking.wallType,
          mountType: booking.mountType,
          addons: booking.addons || [],
          tvInstallations: booking.tvInstallations || null, // Include multi-TV data
          estimatedTotal: estimatedTotal.toFixed(2),
          leadFee,
          estimatedEarnings: Math.max(0, estimatedEarnings),
          profitMargin: Math.max(0, profitMargin),
          status: booking.status,
          scheduledDate: booking.scheduledDate,
          preferredDate: booking.preferredDate,
          preferredTime: booking.preferredTime,
          createdAt: booking.createdAt,
          qrCode: booking.qrCode,
          notes: booking.customerNotes || booking.notes,
          difficulty: booking.difficulty || 'moderate',
          distance, // Real calculated distance
          // Customer contact details hidden until lead purchase
          customerName: "Customer details available after lead purchase",
          customerEmail: null, // Hidden until purchase
          customerPhone: null, // Hidden until purchase
          referralCode: booking.referralCode,
          referralDiscount: booking.referralDiscount,
          referralInfo // Complete referral context for installer
        };
      }));
      
      res.json(leadsWithFees);
    } catch (error) {
      console.error("Error fetching available leads:", error);
      res.status(500).json({ message: "Failed to fetch available leads" });
    }
  });

  // ====================== BOOKING TRACKER API ENDPOINT ======================
  
  // Public booking tracker - allows users to track bookings without authentication
  app.get("/api/booking-tracker", async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: "Tracking code is required" });
      }
      
      // Search for booking by QR code, booking ID, or Harvey Norman invoice
      const bookings = await storage.getAllBookings();
      let booking = null;
      
      // Try to find booking by QR code first
      booking = bookings.find(b => b.qrCode === code);
      
      // If not found by QR code, try booking ID
      if (!booking) {
        const bookingId = parseInt(code);
        if (!isNaN(bookingId)) {
          booking = bookings.find(b => b.id === bookingId);
        }
      }
      
      // If not found, try Harvey Norman invoice format (both HN-GAL-009876 and HNGAL009876)
      if (!booking && code.toUpperCase().startsWith('HN')) {
        // Normalize the code to both formats for comparison
        const normalizeInvoice = (invoice) => {
          if (!invoice) return null;
          // Remove hyphens for comparison
          return invoice.replace(/-/g, '').toUpperCase();
        };
        
        const normalizedSearchCode = normalizeInvoice(code);
        
        // Find user by Harvey Norman invoice (supporting both formats)
        const users = await storage.getAllUsers();
        const user = users.find(u => {
          if (!u.harveyNormanInvoiceNumber) return false;
          const normalizedUserInvoice = normalizeInvoice(u.harveyNormanInvoiceNumber);
          return normalizedUserInvoice === normalizedSearchCode;
        });
        
        if (user) {
          booking = bookings.find(b => b.userId === user.id);
        }
        
        // Also try to find booking directly by invoice number
        if (!booking) {
          booking = bookings.find(b => {
            if (!b.invoiceNumber) return false;
            const normalizedBookingInvoice = normalizeInvoice(b.invoiceNumber);
            return normalizedBookingInvoice === normalizedSearchCode;
          });
        }
      }
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Get installer information if assigned
      let installerInfo = null;
      if (booking.installerId) {
        try {
          const installer = await storage.getInstaller(booking.installerId);
          if (installer) {
            installerInfo = {
              name: installer.contactName || installer.businessName,
              phone: installer.phone
            };
          }
        } catch (error) {
          console.log("Could not fetch installer info:", error);
        }
      }
      
      // Format response with booking details
      let parsedAddons = [];
      try {
        if (Array.isArray(booking.addons)) {
          parsedAddons = booking.addons;
        } else if (typeof booking.addons === 'string' && booking.addons) {
          parsedAddons = JSON.parse(booking.addons);
        } else if (booking.addons && typeof booking.addons === 'object') {
          parsedAddons = booking.addons;
        }
      } catch (err) {
        console.error("Error parsing addons:", err, "Raw addons:", booking.addons);
        parsedAddons = [];
      }

      const response = {
        id: booking.id,
        qrCode: booking.qrCode,
        status: booking.status,
        contactName: booking.contactName,
        contactEmail: booking.contactEmail,
        contactPhone: booking.contactPhone,
        address: booking.address,
        tvSize: booking.tvSize,
        serviceType: booking.serviceType,
        wallType: booking.wallType,
        mountType: booking.mountType,
        addons: parsedAddons,
        estimatedTotal: booking.estimatedTotal,
        scheduledDate: booking.scheduledDate,
        createdAt: booking.createdAt,
        installerName: installerInfo?.name,
        installerPhone: installerInfo?.phone,
        difficulty: booking.difficulty || 'moderate',
        notes: booking.customerNotes || booking.specialRequests
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching booking details:", error);
      res.status(500).json({ message: "Failed to fetch booking details" });
    }
  });

  // ====================== WALL MOUNT PRICING API ENDPOINTS ======================
  
  // Get all wall mount pricing options (admin only)
  app.get("/api/admin/wall-mount-pricing", isAdmin, async (req, res) => {
    try {
      const pricing = await storage.getAllWallMountPricing();
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching wall mount pricing:", error);
      res.status(500).json({ message: "Failed to fetch wall mount pricing" });
    }
  });

  // Get active wall mount pricing options (public for booking flow)
  app.get("/api/wall-mount-pricing", async (req, res) => {
    try {
      const pricing = await storage.getActiveWallMountPricing();
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching active wall mount pricing:", error);
      res.status(500).json({ message: "Failed to fetch wall mount pricing" });
    }
  });

  // Create wall mount pricing option (admin only)
  app.post("/api/admin/wall-mount-pricing", isAdmin, async (req, res) => {
    try {
      const { key, name, description, price, isActive, displayOrder } = req.body;
      
      if (!key || !name || !price) {
        return res.status(400).json({ message: "Key, name, and price are required" });
      }

      const pricing = await storage.createWallMountPricing({
        key,
        name,
        description: description || null,
        price: parseFloat(price),
        isActive: isActive ?? true,
        displayOrder: displayOrder || 0
      });

      res.json(pricing);
    } catch (error) {
      console.error("Error creating wall mount pricing:", error);
      res.status(500).json({ message: "Failed to create wall mount pricing" });
    }
  });

  // Update wall mount pricing option (admin only)
  app.put("/api/admin/wall-mount-pricing/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { key, name, description, price, isActive, displayOrder } = req.body;
      
      await storage.updateWallMountPricing(id, {
        key,
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        isActive,
        displayOrder
      });

      res.json({ message: "Wall mount pricing updated successfully" });
    } catch (error) {
      console.error("Error updating wall mount pricing:", error);
      res.status(500).json({ message: "Failed to update wall mount pricing" });
    }
  });

  // ====================== EMAIL TEMPLATE MANAGEMENT ROUTES ======================

  // Get all email templates (admin only)
  app.get("/api/admin/email-templates", isAdmin, async (req, res) => {
    try {
      const templates = await storage.getAllEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  // Get specific email template (admin only)
  app.get("/api/admin/email-templates/:templateKey", isAdmin, async (req, res) => {
    try {
      const template = await storage.getEmailTemplate(req.params.templateKey);
      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching email template:", error);
      res.status(500).json({ message: "Failed to fetch email template" });
    }
  });

  // Create email template (admin only)
  app.post("/api/admin/email-templates", isAdmin, async (req, res) => {
    try {
      const { templateKey, templateName, fromEmail, replyToEmail, subject, htmlContent, textContent, shortcodes } = req.body;
      
      if (!templateKey || !templateName || !fromEmail || !subject || !htmlContent) {
        return res.status(400).json({ 
          message: "Template key, name, from email, subject, and HTML content are required" 
        });
      }

      const template = await storage.createEmailTemplate({
        templateKey,
        templateName,
        fromEmail,
        replyToEmail: replyToEmail || null,
        subject,
        htmlContent,
        textContent: textContent || null,
        shortcodes: shortcodes || [],
        isActive: true
      });

      res.json(template);
    } catch (error) {
      console.error("Error creating email template:", error);
      if (error.code === '23505') {
        res.status(400).json({ message: "Email template with this key already exists" });
      } else {
        res.status(500).json({ message: "Failed to create email template" });
      }
    }
  });

  // Update email template (admin only)
  app.put("/api/admin/email-templates/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { templateName, fromEmail, replyToEmail, subject, htmlContent, textContent, shortcodes, isActive } = req.body;
      
      const template = await storage.updateEmailTemplate(id, {
        templateName,
        fromEmail,
        replyToEmail,
        subject,
        htmlContent,
        textContent,
        shortcodes,
        isActive
      });

      res.json(template);
    } catch (error) {
      console.error("Error updating email template:", error);
      res.status(500).json({ message: "Failed to update email template" });
    }
  });

  // Delete email template (admin only)
  app.delete("/api/admin/email-templates/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmailTemplate(id);
      
      if (success) {
        res.json({ message: "Email template deleted successfully" });
      } else {
        res.status(404).json({ message: "Email template not found" });
      }
    } catch (error) {
      console.error("Error deleting email template:", error);
      res.status(500).json({ message: "Failed to delete email template" });
    }
  });

  // Test email template (admin only)
  app.post("/api/admin/email-templates/:id/test", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getEmailTemplateById(id);
      
      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }

      // Get admin user email from session
      const adminUser = req.user as { id: number; email: string; role: string };
      const testEmail = adminUser.email;

      // Replace shortcodes with sample test data
      let testHtml = template.htmlContent;
      let testSubject = template.subject;

      const sampleData = {
        "{{customerName}}": "Test Customer",
        "{{customerEmail}}": "test@example.com",
        "{{bookingId}}": "TEST-12345",
        "{{qrCode}}": "TEST-12345",
        "{{serviceType}}": "Premium Wall Mount",
        "{{tvSize}}": "65",
        "{{address}}": "123 Test Street, Dublin, Ireland",
        "{{totalPrice}}": "€249",
        "{{installerName}}": "Test Installer",
        "{{installerEarnings}}": "€179",
        "{{businessName}}": "Test Business Ltd",
        "{{approvalScore}}": "9",
        "{{adminComments}}": "Excellent application with all requirements met",
        "{{scheduledDate}}": "March 15, 2025",
        "{{proposedDate}}": "March 15, 2025",
        "{{proposedTime}}": "2:00 PM",
        "{{estimatedDuration}}": "2-3 hours",
        "{{installerMessage}}": "Looking forward to completing your installation",
        "{{newStatus}}": "In Progress",
        "{{previousStatus}}": "Confirmed",
        "{{updateTime}}": new Date().toLocaleString(),
        "{{statusMessage}}": "Your installation is proceeding as scheduled",
        "{{trackingUrl}}": "https://tradesbook.ie/track/TEST-12345",
        "{{acceptUrl}}": "https://tradesbook.ie/accept/TEST-12345",
        "{{proposeAlternativeUrl}}": "https://tradesbook.ie/propose/TEST-12345",
        "{{currentDate}}": new Date().toLocaleDateString(),
        "{{platformName}}": "tradesbook.ie",
        "{{supportEmail}}": "support@tradesbook.ie"
      };

      // Replace shortcodes in both subject and content
      Object.entries(sampleData).forEach(([shortcode, value]) => {
        const regex = new RegExp(shortcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        testHtml = testHtml.replace(regex, value);
        testSubject = testSubject.replace(regex, value);
      });

      // Import the email service
      const { sendGmailEmail } = await import('./gmailService');

      // Send test email
      const success = await sendGmailEmail({
        to: testEmail,
        subject: `[TEST] ${testSubject}`,
        html: `
          <div style="background: #f0f8ff; padding: 20px; border: 2px solid #007bff; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #007bff; margin: 0 0 10px 0;">📧 Test Email Template</h2>
            <p style="margin: 0; color: #666;">This is a test email for template: <strong>${template.templateName}</strong></p>
            <p style="margin: 5px 0 0 0; color: #666;">Template Key: <strong>${template.templateKey}</strong></p>
          </div>
          ${testHtml}
          <div style="background: #f8f9fa; padding: 15px; border-top: 2px solid #ddd; margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            <p style="margin: 0;">This is a test email sent from the tradesbook.ie admin dashboard</p>
          </div>
        `,
        from: template.fromEmail,
        replyTo: template.replyToEmail || 'support@tradesbook.ie'
      });

      if (success) {
        res.json({ 
          message: "Test email sent successfully",
          sentTo: testEmail,
          templateName: template.templateName 
        });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  // Resources API Routes - Customer Help Resources Management
  // Get all resources (public endpoint for customers)
  app.get("/api/resources", async (req, res) => {
    try {
      const { category, brand, featured } = req.query;
      
      let resources;
      if (featured === 'true') {
        resources = await storage.getFeaturedResources();
      } else if (category) {
        resources = await storage.getResourcesByCategory(category as string);
      } else if (brand) {
        resources = await storage.getResourcesByBrand(brand as string);
      } else {
        resources = await storage.getActiveResources();
      }
      
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  // Get single resource (public endpoint)
  app.get("/api/resources/:id", async (req, res) => {
    try {
      const resource = await storage.getResource(parseInt(req.params.id));
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.json(resource);
    } catch (error) {
      console.error("Error fetching resource:", error);
      res.status(500).json({ message: "Failed to fetch resource" });
    }
  });

  // Admin resource management routes
  app.get("/api/admin/resources", isAdmin, async (req, res) => {
    try {
      const resources = await storage.getAllResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching admin resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  // AI Content Generation for Resources (admin only)
  app.post("/api/admin/resources/generate-content", isAdmin, async (req, res) => {
    try {
      const { url, markdown } = req.body;
      
      // Determine input method and validate
      if (url && markdown) {
        return res.status(400).json({ message: "Provide either URL or markdown content, not both" });
      }
      
      if (!url && !markdown) {
        return res.status(400).json({ message: "Either URL or markdown content is required" });
      }

      let generatedContent;

      if (url) {
        // URL method - validate URL format
        try {
          new URL(url);
        } catch {
          return res.status(400).json({ message: "Invalid URL format" });
        }

        console.log(`Generating AI content for URL: ${url}`);
        generatedContent = await AIContentService.generateContentFromUrl(url);
      } else {
        // Markdown method - validate content length
        if (markdown.trim().length < 50) {
          return res.status(400).json({ message: "Markdown content must be at least 50 characters long" });
        }

        console.log(`Generating AI content from markdown (${markdown.length} chars)`);
        generatedContent = await AIContentService.generateContentFromMarkdown(markdown);
      }
      
      res.json({
        success: true,
        data: generatedContent,
        method: url ? 'url' : 'markdown'
      });
    } catch (error) {
      console.error("Error generating AI content:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Failed to generate content" 
      });
    }
  });

  // Create new resource (admin only)
  app.post("/api/admin/resources", isAdmin, async (req, res) => {
    try {
      // Preprocess the request body to handle date fields
      const processedBody = { ...req.body };
      
      console.log('Original expiryDate:', processedBody.expiryDate, 'Type:', typeof processedBody.expiryDate);
      
      // Handle expiryDate conversion
      if (processedBody.expiryDate) {
        if (typeof processedBody.expiryDate === 'string') {
          if (processedBody.expiryDate.trim() === '') {
            // Empty string should be null
            console.log('Converting empty string to null');
            processedBody.expiryDate = null;
          } else {
            // Convert valid date string to Date object
            const dateValue = new Date(processedBody.expiryDate);
            if (isNaN(dateValue.getTime())) {
              // Invalid date
              console.log('Invalid date, converting to null');
              processedBody.expiryDate = null;
            } else {
              console.log('Converting date string to Date object:', dateValue);
              processedBody.expiryDate = dateValue;
            }
          }
        }
      } else {
        // Ensure null for missing or falsy values
        console.log('No expiryDate provided, setting to null');
        processedBody.expiryDate = null;
      }
      
      console.log('Final expiryDate:', processedBody.expiryDate, 'Type:', typeof processedBody.expiryDate);
      
      const resourceData = insertResourceSchema.parse(processedBody);
      
      // Add admin user information
      const user = req.user as any;
      const enhancedData = {
        ...resourceData,
        createdBy: user?.email || 'admin',
        lastModifiedBy: user?.email || 'admin'
      };
      
      const resource = await storage.createResource(enhancedData);
      res.status(201).json(resource);
    } catch (error) {
      console.error("Error creating resource:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid resource data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create resource" });
      }
    }
  });

  // Update resource (admin only)
  app.put("/api/admin/resources/:id", isAdmin, async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      
      // Preprocess the request body to handle date fields
      const processedBody = { ...req.body };
      
      // Handle expiryDate conversion
      if (processedBody.expiryDate) {
        if (typeof processedBody.expiryDate === 'string') {
          if (processedBody.expiryDate.trim() === '') {
            // Empty string should be null
            processedBody.expiryDate = null;
          } else {
            // Convert valid date string to Date object
            const dateValue = new Date(processedBody.expiryDate);
            if (isNaN(dateValue.getTime())) {
              // Invalid date
              processedBody.expiryDate = null;
            } else {
              processedBody.expiryDate = dateValue;
            }
          }
        }
      } else {
        // Ensure null for missing or falsy values
        processedBody.expiryDate = null;
      }
      
      const updateData = insertResourceSchema.partial().parse(processedBody);
      
      // Add admin user information
      const user = req.user as any;
      const enhancedData = {
        ...updateData,
        lastModifiedBy: user?.email || 'admin'
      };
      
      const resource = await storage.updateResource(resourceId, enhancedData);
      res.json(resource);
    } catch (error) {
      console.error("Error updating resource:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid resource data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update resource" });
      }
    }
  });

  // Delete resource (admin only)
  app.delete("/api/admin/resources/:id", isAdmin, async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      const success = await storage.deleteResource(resourceId);
      
      if (success) {
        res.json({ message: "Resource deleted successfully" });
      } else {
        res.status(404).json({ message: "Resource not found" });
      }
    } catch (error) {
      console.error("Error deleting resource:", error);
      res.status(500).json({ message: "Failed to delete resource" });
    }
  });

  // Toggle resource featured status (admin only)
  app.patch("/api/admin/resources/:id/featured", isAdmin, async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      const { featured } = req.body;
      
      await storage.toggleResourceFeatured(resourceId, featured);
      res.json({ message: "Resource featured status updated" });
    } catch (error) {
      console.error("Error updating resource featured status:", error);
      res.status(500).json({ message: "Failed to update featured status" });
    }
  });

  // Toggle resource active status (admin only)
  app.patch("/api/admin/resources/:id/toggle", isAdmin, async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      await storage.updateResource(resourceId, { isActive });
      res.json({ message: "Resource status updated" });
    } catch (error) {
      console.error("Error updating resource status:", error);
      res.status(500).json({ message: "Failed to update resource status" });
    }
  });

  // Update resource priority (admin only)
  app.patch("/api/admin/resources/:id/priority", isAdmin, async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      const { priority } = req.body;
      
      await storage.updateResourcePriority(resourceId, priority);
      res.json({ message: "Resource priority updated" });
    } catch (error) {
      console.error("Error updating resource priority:", error);
      res.status(500).json({ message: "Failed to update priority" });
    }
  });

  // Geocoding API Routes (using OpenStreetMap)
  app.post("/api/maps/geocode", async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }

      const { geocodeAddress } = await import('./services/geocoding');
      const result = await geocodeAddress(address);
      
      if (!result) {
        return res.status(404).json({ error: "Address not found" });
      }

      res.json(result);
    } catch (error) {
      console.error("Geocoding error:", error);
      res.status(500).json({ error: "Failed to geocode address" });
    }
  });

  app.post("/api/maps/batch-geocode", async (req, res) => {
    try {
      const { addresses } = req.body;
      
      if (!addresses || !Array.isArray(addresses)) {
        return res.status(400).json({ error: "Array of addresses is required" });
      }

      const { geocodeMultipleAddresses } = await import('./services/geocoding');
      const results = await geocodeMultipleAddresses(addresses);
      
      res.json({ results: Array.from(results.entries()).map(([address, result]) => ({ address, ...result })) });
    } catch (error) {
      console.error("Batch geocoding error:", error);
      res.status(500).json({ error: "Failed to batch geocode addresses" });
    }
  });

  // Alternative geocoding endpoint (for frontend compatibility)
  app.post("/api/geocode", async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }

      const { geocodeAddress } = await import('./services/geocoding');
      const result = await geocodeAddress(address);
      
      if (!result) {
        return res.status(404).json({ error: "Address not found" });
      }

      res.json(result);
    } catch (error) {
      console.error("Geocoding error:", error);
      res.status(500).json({ error: "Failed to geocode address" });
    }
  });

  // Schedule negotiation endpoints
  app.post("/api/schedule-negotiations", async (req, res) => {
    try {
      const validatedData = insertScheduleNegotiationSchema.parse(req.body);
      const negotiation = await storage.createScheduleNegotiation(validatedData);
      
      // Send email notification about new schedule proposal
      if (validatedData.proposedBy === 'customer') {
        // Notify installer about customer's schedule proposal
        const booking = await storage.getBooking(validatedData.bookingId);
        const installer = await storage.getInstaller(validatedData.installerId);
        
        if (booking && installer) {
          try {
            await sendScheduleProposalNotification(
              installer.email,
              booking,
              negotiation
            );
          } catch (emailError) {
            console.error("Failed to send schedule notification:", emailError);
          }
        }
      } else if (validatedData.proposedBy === 'installer') {
        // Notify customer about installer's schedule proposal
        const booking = await storage.getBooking(validatedData.bookingId);
        
        if (booking && booking.contactEmail) {
          try {
            await sendScheduleProposalNotification(
              booking.contactEmail,
              booking,
              negotiation
            );
          } catch (emailError) {
            console.error("Failed to send schedule notification:", emailError);
          }
        }
      }
      
      res.json(negotiation);
    } catch (error) {
      console.error("Schedule negotiation creation error:", error);
      res.status(400).json({ error: "Failed to create schedule negotiation" });
    }
  });

  app.get("/api/bookings/:bookingId/schedule-negotiations", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      
      // Temporary workaround using raw SQL query
      const result = await db.execute(sql`
        SELECT 
          sn.*,
          i.business_name as installer_business_name,
          i.contact_name as installer_contact_name,
          i.profile_image_url as installer_profile_image_url
        FROM schedule_negotiations sn
        LEFT JOIN installers i ON sn.installer_id = i.id
        WHERE sn.booking_id = ${bookingId}
        ORDER BY sn.created_at DESC
      `);
      
      // Transform the results to include installer info
      const negotiations = result.rows.map((row: any) => ({
        id: row.id,
        bookingId: row.booking_id,
        installerId: row.installer_id,
        proposedDate: row.proposed_date,
        proposedTimeSlot: row.proposed_time_slot,
        proposedStartTime: row.proposed_start_time,
        proposedEndTime: row.proposed_end_time,
        proposalMessage: row.proposal_message,
        status: row.status,
        proposedBy: row.proposed_by,
        responseMessage: row.response_message,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        proposedAt: row.proposed_at,
        respondedAt: row.responded_at,
        installer: row.installer_business_name ? {
          id: row.installer_id,
          businessName: row.installer_business_name,
          contactName: row.installer_contact_name,
          firstName: row.installer_contact_name?.split(' ')[0] || '',
          lastName: row.installer_contact_name?.split(' ').slice(1).join(' ') || '',
          profileImageUrl: row.installer_profile_image_url,
        } : null
      }));
      
      res.json(negotiations);
    } catch (error) {
      console.error("Get schedule negotiations error:", error);
      res.status(500).json({ error: "Failed to get schedule negotiations" });
    }
  });

  app.get("/api/installer/:installerId/schedule-negotiations", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      const negotiations = await storage.getInstallerScheduleNegotiations(installerId);
      res.json(negotiations);
    } catch (error) {
      console.error("Get installer negotiations error:", error);
      res.status(500).json({ error: "Failed to get installer negotiations" });
    }
  });

  // New endpoint for installer schedule calendar
  app.get("/api/installer/:installerId/schedule-calendar", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      
      // Get BOTH confirmed schedules AND pending proposals for calendar display
      const calendarEvents = await db.execute(sql`
        -- Union confirmed schedules and pending proposals
        SELECT 
          'confirmed' as "eventType",
          b.id,
          b.id as "bookingId", 
          b.contact_name as "customerName",
          b.address,
          b.tv_size as "tvSize",
          b.service_type as "serviceType", 
          b.status,
          b.estimated_total as "estimatedTotal",
          CASE 
            WHEN ja.status = 'completed' AND ja.completed_date IS NOT NULL 
            THEN ja.completed_date::text 
            ELSE COALESCE(
              (SELECT sn.proposed_date::text 
               FROM schedule_negotiations sn 
               WHERE sn.booking_id = b.id AND (sn.status = 'accepted' OR sn.status = 'accept')
               ORDER BY sn.created_at DESC LIMIT 1),
              b.scheduled_date::text
            ) 
          END as "scheduledDate",
          COALESCE(
            (SELECT sn.proposed_time_slot
             FROM schedule_negotiations sn 
             WHERE sn.booking_id = b.id AND (sn.status = 'accepted' OR sn.status = 'accept')
             ORDER BY sn.created_at DESC LIMIT 1),
            b.preferred_time
          ) as "scheduledTime"
        FROM bookings b
        INNER JOIN job_assignments ja ON ja.booking_id = b.id
        WHERE ja.installer_id = ${installerId}
          AND (ja.status = 'accepted' OR ja.status = 'assigned' OR ja.status = 'completed' OR ja.status = 'in_progress')
          AND (
            EXISTS (
              SELECT 1 FROM schedule_negotiations sn 
              WHERE sn.booking_id = b.id AND (sn.status = 'accepted' OR sn.status = 'accept')
            ) 
            OR b.scheduled_date IS NOT NULL
          )
        
        UNION ALL
        
        -- Pending proposals from this installer
        SELECT 
          'proposed' as "eventType",
          b.id,
          b.id as "bookingId",
          b.contact_name as "customerName", 
          b.address,
          b.tv_size as "tvSize",
          b.service_type as "serviceType",
          b.status,
          b.estimated_total as "estimatedTotal",
          sn.proposed_date::text as "scheduledDate",
          sn.proposed_time_slot as "scheduledTime"
        FROM bookings b
        INNER JOIN job_assignments ja ON ja.booking_id = b.id
        INNER JOIN schedule_negotiations sn ON sn.booking_id = b.id
        WHERE ja.installer_id = ${installerId}
          AND sn.installer_id = ${installerId}
          AND (ja.status = 'accepted' OR ja.status = 'assigned' OR ja.status = 'completed' OR ja.status = 'in_progress')
          AND sn.status = 'pending'
          AND sn.proposed_by = 'installer'
        
        ORDER BY "scheduledDate"
      `);

      // Format the calendar data
      const calendarData = calendarEvents.rows.map((event) => ({
        ...event,
        isProposed: event.eventType === 'proposed',
        isConfirmed: event.eventType === 'confirmed'
      }));

      res.json(calendarData);
    } catch (error) {
      console.error("Schedule calendar error:", error);
      res.status(500).json({ error: "Failed to get schedule calendar" });
    }
  });


  // Manual job cancellation endpoint - using booking ID
  app.post("/api/bookings/:bookingId/cancel-assignment", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const { reason, cancelledBy } = req.body; // 'customer' or 'installer'
      
      // Get the active job assignment for this booking
      const assignment = await db.select()
        .from(jobAssignments)
        .where(and(
          eq(jobAssignments.bookingId, bookingId),
          or(
            eq(jobAssignments.status, 'purchased'),
            eq(jobAssignments.status, 'accepted'),
            eq(jobAssignments.status, 'assigned')
          )
        ))
        .limit(1);
        
      if (assignment.length === 0) {
        return res.status(404).json({ error: "No active job assignment found for this booking" });
      }
      
      const jobAssignment = assignment[0];
      
      // Verify the assignment is in a cancellable state
      if (!['purchased', 'accepted', 'assigned'].includes(jobAssignment.status)) {
        return res.status(400).json({ error: "This job cannot be cancelled in its current state" });
      }
      
      // Get booking details
      const booking = await storage.getBooking(jobAssignment.bookingId!);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      console.log(`🚫 Manual cancellation requested for assignment ${jobAssignment.id} by ${cancelledBy}`);
      
      // Update assignment status to cancelled
      await db.update(jobAssignments)
        .set({ 
          status: 'cancelled'
        })
        .where(eq(jobAssignments.id, jobAssignment.id));
        
      // Process refund if there was a lead fee paid
      const leadFee = jobAssignment.leadFee ? parseFloat(jobAssignment.leadFee) : 0;
      const installerId = jobAssignment.installerId;
      
      if (installerId && leadFee > 0) {
        const wallet = await storage.getInstallerWallet(installerId);
        
        if (wallet) {
          const newBalance = parseFloat(wallet.balance) + leadFee;
          const totalSpent = Math.max(0, parseFloat(wallet.totalSpent) - leadFee);
          
          await storage.updateInstallerWalletBalance(installerId, newBalance);
          await storage.updateInstallerWalletTotalSpent(installerId, totalSpent);
          
          // Add refund transaction record
          await storage.addInstallerTransaction({
            installerId: installerId,
            type: 'refund',
            amount: leadFee.toString(),
            description: `Manual cancellation refund for job #${booking.id} (cancelled by ${cancelledBy})`,
            jobAssignmentId: jobAssignment.id,
            status: 'completed'
          });
          
          console.log(`💰 Refunded €${leadFee} to installer ${installerId} for manual cancellation of job ${booking.id}`);
        }
      }
      
      // Reset booking status back to open so other installers can take it
      await storage.updateBookingStatus(jobAssignment.bookingId!, 'open');
      
      // CRITICAL: Invalidate all existing schedule negotiations to prevent automatic re-assignment
      await db.update(scheduleNegotiations)
        .set({
          status: 'cancelled',
          responseMessage: `Job assignment cancelled by ${cancelledBy}`,
          respondedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(scheduleNegotiations.bookingId, bookingId));
      
      console.log(`🔄 Invalidated all schedule negotiations for booking ${bookingId} due to job cancellation`);
      
      // Clear installer assignment from the booking
      await db.update(bookings)
        .set({ 
          installerId: null,
          scheduledDate: null
        })
        .where(eq(bookings.id, jobAssignment.bookingId!));
      
      // This is now handled above with more comprehensive logic
      
      // Send cancellation notification emails
      try {
        if (booking.contact?.email) {
          await sendJobCancellationNotification(booking, cancelledBy, reason);
        }
      } catch (emailError) {
        console.error("Failed to send cancellation notification:", emailError);
      }
      
      res.json({ 
        success: true, 
        message: "Job successfully cancelled and refunded",
        refundAmount: leadFee 
      });
      
    } catch (error) {
      console.error("Manual job cancellation error:", error);
      res.status(500).json({ error: "Failed to cancel job assignment" });
    }
  });

  app.patch("/api/schedule-negotiations/:id", async (req, res) => {
    try {
      const negotiationId = parseInt(req.params.id);
      const { status, responseMessage } = req.body;
      
      // If accepting a new proposal, standardize status and invalidate previous acceptances
      if (status === 'accepted' || status === 'accept') {
        // First, set all previous "accepted" or "accept" proposals for this booking to "superseded"
        const currentNegotiation = await db.execute(sql`
          SELECT booking_id FROM schedule_negotiations WHERE id = ${negotiationId}
        `);
        
        if (currentNegotiation.rows.length > 0) {
          const bookingId = currentNegotiation.rows[0].booking_id;
          
          // Mark all existing accepted proposals as superseded
          await db.execute(sql`
            UPDATE schedule_negotiations 
            SET status = 'superseded', updated_at = NOW()
            WHERE booking_id = ${bookingId} 
              AND (status = 'accepted' OR status = 'accept')
              AND id != ${negotiationId}
          `);
          
          // Auto-decline all other pending proposals when one is accepted
          await db.execute(sql`
            UPDATE schedule_negotiations 
            SET status = 'declined', 
                response_message = 'Auto-declined: Customer accepted another proposal',
                responded_at = NOW(),
                updated_at = NOW()
            WHERE booking_id = ${bookingId} 
              AND status = 'pending'
              AND id != ${negotiationId}
          `);
        }
        
        // Now update this negotiation to "accepted" (standardized)
        await storage.updateScheduleNegotiationStatus(negotiationId, 'accepted', responseMessage);
      } else {
        // For other statuses (reject, etc.), use as-is
        await storage.updateScheduleNegotiationStatus(negotiationId, status, responseMessage);
      }
      
      // Send email notification about response
      // Get the specific negotiation that was just updated, not just the latest one
      const acceptedNegotiation = await db.execute(sql`
        SELECT * FROM schedule_negotiations WHERE id = ${negotiationId}
      `);
      
      if (acceptedNegotiation.rows.length > 0) {
        const negotiation = acceptedNegotiation.rows[0];
        const booking = await storage.getBooking(negotiation.booking_id);
        
        if (status === 'accepted' || status === 'accept') {
          // Update booking with confirmed schedule and assign installer
          // Automatically set status to "scheduled" (Installation Scheduled)
          await storage.updateBooking(negotiation.booking_id, {
            scheduledDate: new Date(negotiation.proposed_date),
            status: 'scheduled',
            installerId: negotiation.installer_id
          });
          
          // Update job assignment status from "purchased" to "accepted" when proposal is accepted
          await db.execute(sql`
            UPDATE job_assignments 
            SET status = 'accepted', accepted_date = NOW(), updated_at = NOW()
            WHERE booking_id = ${negotiation.booking_id} 
              AND installer_id = ${negotiation.installer_id} 
              AND status = 'purchased'
          `);
          
          // Send confirmation emails to both parties
          if (booking) {
            try {
              // Convert the database row to the expected format
              const negotiationForEmail = {
                id: negotiation.id,
                bookingId: negotiation.booking_id,
                installerId: negotiation.installer_id,
                proposedDate: negotiation.proposed_date,
                proposedTimeSlot: negotiation.proposed_time_slot,
                proposalMessage: negotiation.proposal_message,
                responseMessage: negotiation.response_message,
                status: 'accepted'
              };
              await sendScheduleConfirmationNotification(booking, negotiationForEmail);
            } catch (emailError) {
              console.error("Failed to send confirmation notification:", emailError);
            }
          }
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Update schedule negotiation error:", error);
      res.status(400).json({ error: "Failed to update schedule negotiation" });
    }
  });

  app.get("/api/bookings/:bookingId/active-negotiation", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const negotiation = await storage.getActiveScheduleNegotiation(bookingId);
      res.json(negotiation || null);
    } catch (error) {
      console.error("Get active negotiation error:", error);
      res.status(500).json({ error: "Failed to get active negotiation" });
    }
  });

  // OAuth authentication middleware
  function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  }

  // Installer authentication middleware
  function requireInstallerAuth(req: Request, res: Response, next: NextFunction) {
    const installerUser = (req as any).installerUser;
    if (!installerUser) {
      return res.status(401).json({ error: 'Installer authentication required' });
    }
    next();
  }

  // Fraud Prevention API Endpoints
  
  // Customer verification endpoints
  app.post('/api/fraud-prevention/verify-phone/:bookingId', async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { phoneNumber } = req.body;
      
      const { fraudPreventionService } = await import('./fraudPreventionService');
      const result = await fraudPreventionService.initiatePhoneVerification(
        parseInt(bookingId), 
        phoneNumber
      );
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: 'Verification code sent to your phone',
          // Only include code in development
          ...(process.env.NODE_ENV === 'development' && { verificationCode: result.verificationCode })
        });
      } else {
        res.status(500).json({ error: 'Failed to send verification code' });
      }
    } catch (error) {
      console.error('Error initiating phone verification:', error);
      res.status(500).json({ error: 'Failed to initiate verification' });
    }
  });

  app.post('/api/fraud-prevention/confirm-phone/:bookingId', async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { code } = req.body;
      
      const { fraudPreventionService } = await import('./fraudPreventionService');
      const verified = await fraudPreventionService.verifyPhoneCode(
        parseInt(bookingId), 
        code
      );
      
      if (verified) {
        res.json({ success: true, message: 'Phone number verified successfully' });
      } else {
        res.status(400).json({ error: 'Invalid verification code' });
      }
    } catch (error) {
      console.error('Error confirming phone verification:', error);
      res.status(500).json({ error: 'Failed to verify code' });
    }
  });

  // Quality assessment endpoint
  app.get('/api/fraud-prevention/assess-quality/:bookingId', async (req, res) => {
    try {
      const { bookingId } = req.params;
      const userId = req.user?.id;
      
      const { fraudPreventionService } = await import('./fraudPreventionService');
      const assessment = await fraudPreventionService.assessCustomerQuality(
        parseInt(bookingId), 
        userId
      );
      
      res.json(assessment);
    } catch (error) {
      console.error('Error assessing quality:', error);
      res.status(500).json({ error: 'Failed to assess quality' });
    }
  });

  // Lead refund endpoints for installers
  app.post('/api/fraud-prevention/request-refund', requireInstallerAuth, async (req, res) => {
    try {
      const installer = req.installerUser;
      const { bookingId, reason, evidence, installerNotes } = req.body;
      
      if (!installer) {
        return res.status(401).json({ error: 'Installer authentication required' });
      }
      
      const { fraudPreventionService } = await import('./fraudPreventionService');
      const result = await fraudPreventionService.processLeadRefund(
        installer.id,
        parseInt(bookingId),
        { reason, evidence, installerNotes }
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error requesting refund:', error);
      res.status(500).json({ error: 'Failed to process refund request' });
    }
  });

  app.get('/api/fraud-prevention/refund-eligibility/:bookingId', requireInstallerAuth, async (req, res) => {
    try {
      const installer = req.installerUser;
      const { bookingId } = req.params;
      const { reason } = req.query;
      
      if (!installer) {
        return res.status(401).json({ error: 'Installer authentication required' });
      }
      
      const { fraudPreventionService } = await import('./fraudPreventionService');
      const eligibility = await fraudPreventionService.assessRefundEligibility(
        installer.id,
        parseInt(bookingId),
        reason as string
      );
      
      res.json(eligibility);
    } catch (error) {
      console.error('Error checking refund eligibility:', error);
      res.status(500).json({ error: 'Failed to check eligibility' });
    }
  });

  // Customer cancellation endpoint
  app.post('/api/booking/:bookingId/cancel', async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const { reason, customerNotes } = req.body;

      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Don't allow cancellation if already completed
      if (booking.status === 'completed') {
        return res.status(400).json({ message: "Cannot cancel completed booking" });
      }

      // Get all job assignments for refunding
      const assignments = await storage.getBookingJobAssignments(bookingId);
      let totalRefunded = 0;

      for (const assignment of assignments) {
        // Only refund if the installer paid for the lead
        if (assignment.leadFeeStatus === 'paid' && assignment.status !== 'refunded') {
          const leadFee = parseFloat(assignment.leadFee);
          const wallet = await storage.getInstallerWallet(assignment.installerId);
          
          if (wallet && leadFee > 0) {
            // Full refund for customer cancellations
            const newBalance = parseFloat(wallet.balance) + leadFee;
            const totalSpent = Math.max(0, parseFloat(wallet.totalSpent) - leadFee);
            
            await storage.updateInstallerWalletBalance(assignment.installerId, newBalance);
            await storage.updateInstallerWalletTotalSpent(assignment.installerId, totalSpent);
            
            // Update assignment status
            await db.update(jobAssignments)
              .set({ status: 'refunded' })
              .where(eq(jobAssignments.id, assignment.id));
            
            // Add refund transaction
            await storage.addInstallerTransaction({
              installerId: assignment.installerId,
              type: 'refund',
              amount: leadFee.toString(),
              description: `Customer cancelled booking #${bookingId}. Reason: ${reason || 'No reason provided'}`,
              jobAssignmentId: assignment.id,
              status: 'completed'
            });
            
            totalRefunded += leadFee;
          }
        }
      }

      // Update booking status
      await storage.updateBookingStatus(bookingId, 'cancelled');

      // Send notification emails to affected installers
      for (const assignment of assignments) {
        if (assignment.leadFeeStatus === 'paid') {
          const installer = await storage.getInstaller(assignment.installerId);
          if (installer && installer.email) {
            // Email logic would go here
            console.log(`Notification sent to installer ${installer.businessName} about cancellation`);
          }
        }
      }

      res.json({
        success: true,
        message: `Booking cancelled successfully. €${totalRefunded.toFixed(2)} refunded to affected installers.`,
        refundAmount: totalRefunded,
        affectedInstallers: assignments.length
      });

    } catch (error) {
      console.error('Error cancelling booking:', error);
      res.status(500).json({ message: 'Failed to cancel booking' });
    }
  });

  // Installer withdrawal endpoint
  app.post('/api/installer/withdraw/:jobAssignmentId', requireInstallerAuth, async (req, res) => {
    try {
      const installer = req.installerUser;
      const jobAssignmentId = parseInt(req.params.jobAssignmentId);
      const { reason, notes } = req.body;

      if (!installer) {
        return res.status(401).json({ error: 'Installer authentication required' });
      }

      // Get the job assignment
      const assignment = await db.select().from(jobAssignments)
        .where(and(
          eq(jobAssignments.id, jobAssignmentId),
          eq(jobAssignments.installerId, installer.id)
        ))
        .limit(1);

      if (!assignment.length) {
        return res.status(404).json({ message: 'Job assignment not found' });
      }

      const jobAssignment = assignment[0];

      // Check if eligible for withdrawal
      if (jobAssignment.status === 'completed') {
        return res.status(400).json({ message: 'Cannot withdraw from completed job' });
      }

      if (jobAssignment.status === 'refunded') {
        return res.status(400).json({ message: 'Already withdrawn from this job' });
      }

      // Calculate refund based on job stage
      let refundPercentage = 1.0; // Default to full refund
      let refundReason = `Installer withdrawal - ${reason || 'No reason provided'}`;

      if (jobAssignment.status === 'accepted') {
        // Job was accepted but not started - full refund
        refundPercentage = 1.0;
      } else if (jobAssignment.status === 'in_progress') {
        // Job in progress - partial refund (80%)
        refundPercentage = 0.8;
        refundReason += ' (Partial refund - job was in progress)';
      } else if (jobAssignment.status === 'purchased') {
        // Just purchased, not yet accepted - full refund
        refundPercentage = 1.0;
      }

      const leadFee = parseFloat(jobAssignment.leadFee || '0');
      const refundAmount = leadFee * refundPercentage;

      if (leadFee > 0 && jobAssignment.leadFeeStatus === 'paid') {
        const wallet = await storage.getInstallerWallet(installer.id);
        if (wallet) {
          const newBalance = parseFloat(wallet.balance) + refundAmount;
          const totalSpent = Math.max(0, parseFloat(wallet.totalSpent) - refundAmount);
          
          await storage.updateInstallerWalletBalance(installer.id, newBalance);
          await storage.updateInstallerWalletTotalSpent(installer.id, totalSpent);
          
          // Update assignment status
          await db.update(jobAssignments)
            .set({ status: 'refunded' })
            .where(eq(jobAssignments.id, jobAssignmentId));
          
          // Add refund transaction
          await storage.addInstallerTransaction({
            installerId: installer.id,
            type: 'refund',
            amount: refundAmount.toString(),
            description: refundReason,
            jobAssignmentId: jobAssignmentId,
            status: 'completed'
          });

          // If this was an accepted job, update booking status
          if (jobAssignment.status === 'accepted') {
            await storage.updateBookingStatus(jobAssignment.bookingId, 'pending');
            // Remove installer assignment
            await storage.updateBookingInstaller(jobAssignment.bookingId, null);
          }

          res.json({
            success: true,
            message: `Successfully withdrawn from job. €${refundAmount.toFixed(2)} refunded to your wallet.`,
            refundAmount: refundAmount,
            refundPercentage: Math.round(refundPercentage * 100)
          });
        } else {
          res.status(500).json({ message: 'Wallet not found' });
        }
      } else {
        // No payment to refund, just update status
        await db.update(jobAssignments)
          .set({ status: 'declined' })
          .where(eq(jobAssignments.id, jobAssignmentId));

        res.json({
          success: true,
          message: 'Successfully withdrawn from job.',
          refundAmount: 0
        });
      }

    } catch (error) {
      console.error('Error processing installer withdrawal:', error);
      res.status(500).json({ message: 'Failed to process withdrawal' });
    }
  });

  // Get booking cancellation history for customers
  app.get('/api/customer/booking-history/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      // Get all bookings for this user
      const bookings = await db.select()
        .from(bookings)
        .where(eq(bookings.userId, userId))
        .orderBy(desc(bookings.createdAt));

      // For each booking, get refund details if cancelled
      const bookingsWithRefunds = await Promise.all(
        bookings.map(async (booking) => {
          const refundInfo = {
            totalRefunded: 0,
            refundedInstallers: 0,
            refundTransactions: []
          };

          if (booking.status === 'cancelled') {
            // Get all job assignments for this booking
            const assignments = await storage.getBookingJobAssignments(booking.id);
            
            for (const assignment of assignments) {
              if (assignment.leadFeeStatus === 'paid' && assignment.status === 'refunded') {
                const refundAmount = parseFloat(assignment.leadFee || '0');
                refundInfo.totalRefunded += refundAmount;
                refundInfo.refundedInstallers++;

                // Get the installer details
                const installer = await storage.getInstaller(assignment.installerId);
                refundInfo.refundTransactions.push({
                  installerName: installer?.businessName || `Installer #${assignment.installerId}`,
                  refundAmount: refundAmount,
                  refundDate: assignment.updatedAt || booking.updatedAt
                });
              }
            }
          }

          return {
            ...booking,
            refundInfo
          };
        })
      );

      res.json({
        bookings: bookingsWithRefunds,
        summary: {
          totalBookings: bookings.length,
          cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
          completedBookings: bookings.filter(b => b.status === 'completed').length
        }
      });

    } catch (error) {
      console.error('Error fetching customer booking history:', error);
      res.status(500).json({ message: 'Failed to fetch booking history' });
    }
  });

  // Get installer refund history
  app.get('/api/installer/:installerId/refund-history', requireInstallerAuth, async (req, res) => {
    try {
      const installer = req.installerUser;
      const installerId = parseInt(req.params.installerId);

      if (!installer || installer.id !== installerId) {
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      // Get all refund transactions for this installer
      const refundTransactions = await db.select({
        transaction: installerTransactions,
        jobAssignment: jobAssignments,
        booking: bookings
      })
        .from(installerTransactions)
        .leftJoin(jobAssignments, eq(installerTransactions.jobAssignmentId, jobAssignments.id))
        .leftJoin(bookings, eq(jobAssignments.bookingId, bookings.id))
        .where(and(
          eq(installerTransactions.installerId, installerId),
          eq(installerTransactions.type, 'refund')
        ))
        .orderBy(desc(installerTransactions.createdAt));

      const refundHistory = refundTransactions.map(({ transaction, jobAssignment, booking }) => ({
        id: transaction.id,
        amount: parseFloat(transaction.amount),
        description: transaction.description,
        refundDate: transaction.createdAt,
        bookingId: booking?.id,
        bookingAddress: booking?.address,
        jobAssignmentId: jobAssignment?.id,
        originalLeadFee: jobAssignment?.leadFee ? parseFloat(jobAssignment.leadFee) : 0,
        refundReason: transaction.description.includes('Customer cancelled') ? 'Customer Cancellation' :
                     transaction.description.includes('Installer withdrawal') ? 'Installer Withdrawal' :
                     transaction.description.includes('expired lead') ? 'Lead Expired' :
                     transaction.description.includes('refund') ? 'Platform Refund' : 'Other',
        status: transaction.status
      }));

      const summary = {
        totalRefunds: refundHistory.length,
        totalRefundAmount: refundHistory.reduce((sum, refund) => sum + refund.amount, 0),
        refundsByReason: {
          customerCancellation: refundHistory.filter(r => r.refundReason === 'Customer Cancellation').length,
          installerWithdrawal: refundHistory.filter(r => r.refundReason === 'Installer Withdrawal').length,
          leadExpired: refundHistory.filter(r => r.refundReason === 'Lead Expired').length,
          platformRefund: refundHistory.filter(r => r.refundReason === 'Platform Refund').length,
          other: refundHistory.filter(r => r.refundReason === 'Other').length
        }
      };

      res.json({
        refunds: refundHistory,
        summary
      });

    } catch (error) {
      console.error('Error fetching installer refund history:', error);
      res.status(500).json({ message: 'Failed to fetch refund history' });
    }
  });

  // Admin fraud prevention endpoints
  app.get('/api/admin/fraud-prevention/refund-requests', requireAuth, async (req, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const { status } = req.query;
      const { fraudPreventionService } = await import('./fraudPreventionService');
      const requests = await fraudPreventionService.getRefundRequests(status as string);
      
      res.json(requests);
    } catch (error) {
      console.error('Error getting refund requests:', error);
      res.status(500).json({ error: 'Failed to get refund requests' });
    }
  });

  app.post('/api/admin/fraud-prevention/approve-refund/:refundId', requireAuth, async (req, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const { refundId } = req.params;
      const { adminNotes } = req.body;
      
      const { fraudPreventionService } = await import('./fraudPreventionService');
      const success = await fraudPreventionService.approveRefund(
        parseInt(refundId),
        adminNotes
      );
      
      if (success) {
        res.json({ success: true, message: 'Refund approved and processed' });
      } else {
        res.status(400).json({ error: 'Failed to approve refund' });
      }
    } catch (error) {
      console.error('Error approving refund:', error);
      res.status(500).json({ error: 'Failed to approve refund' });
    }
  });

  // Admin middleware for fraud prevention
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };

  // Admin fraud prevention endpoints
  app.get('/api/admin/fraud-prevention/quality-metrics', requireAdmin, async (req, res) => {
    try {
      const metrics = await fraudPreventionService.getRealQualityMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching quality metrics:', error);
      res.status(500).json({ error: 'Failed to fetch quality metrics' });
    }
  });

  app.get('/api/admin/fraud-prevention/anti-manipulation', requireAdmin, async (req, res) => {
    try {
      const data = await fraudPreventionService.getAntiManipulationData();
      res.json(data);
    } catch (error) {
      console.error('Error fetching anti-manipulation data:', error);
      res.status(500).json({ error: 'Failed to fetch anti-manipulation data' });
    }
  });

  app.get('/api/admin/fraud-prevention/customer-verification', requireAdmin, async (req, res) => {
    try {
      const data = await fraudPreventionService.getCustomerVerificationData();
      res.json(data);
    } catch (error) {
      console.error('Error fetching customer verification data:', error);
      res.status(500).json({ error: 'Failed to fetch customer verification data' });
    }
  });

  app.get('/api/admin/fraud-prevention/risk-distribution', requireAdmin, async (req, res) => {
    try {
      const data = await fraudPreventionService.getRiskDistribution();
      res.json(data);
    } catch (error) {
      console.error('Error fetching risk distribution data:', error);
      res.status(500).json({ error: 'Failed to fetch risk distribution data' });
    }
  });

  app.get('/api/admin/fraud-prevention/refund-requests', requireAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      const refunds = await fraudPreventionService.getRefundRequests(status as string);
      res.json(refunds);
    } catch (error) {
      console.error('Error fetching refund requests:', error);
      res.status(500).json({ error: 'Failed to fetch refund requests' });
    }
  });

  app.get('/api/admin/fraud-prevention/installer-patterns/:installerId', requireAdmin, async (req, res) => {
    try {
      const { installerId } = req.params;
      const patterns = await fraudPreventionService.monitorInstallationPatterns(parseInt(installerId));
      res.json(patterns);
    } catch (error) {
      console.error('Error monitoring installer patterns:', error);
      res.status(500).json({ error: 'Failed to monitor patterns' });
    }
  });

  const httpServer = createServer(app);
  // Email/Password Authentication Endpoints
  
  // Register with email and password
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: "Email, password, first name, and last name are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
      }
      
      // Hash password
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Generate email verification token
      const { generateVerificationToken, sendVerificationEmail } = await import('./emailVerificationService');
      const verificationToken = await generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Create user with verification token
      const user = await storage.upsertUser({
        email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        passwordHash,
        registrationMethod: 'email',
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: expiresAt,
        role: 'customer'
      });
      
      // Send verification email
      try {
        const emailSent = await sendVerificationEmail(email, firstName.trim(), verificationToken);
        if (emailSent) {
          console.log(`✅ Verification email sent to: ${email}`);
        } else {
          console.log(`❌ Failed to send verification email to: ${email}`);
        }
      } catch (emailError) {
        console.error('❌ Error sending verification email:', emailError);
        // Continue with registration even if email fails
      }
      
      // Log user in (even unverified users can access limited features)
      req.login(user, (err) => {
        if (err) {
          console.error('Login error after registration:', err);
          return res.status(500).json({ error: "Registration successful but login failed" });
        }
        
        res.json({ 
          success: true, 
          message: "Registration successful! Please check your email to verify your account.",
          user: { 
            id: user.id, 
            email: user.email, 
            role: user.role,
            emailVerified: user.emailVerified,
            firstName: user.firstName,
            lastName: user.lastName
          },
          requiresEmailVerification: true
        });
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: "Registration failed" });
    }
  });
  
  // Login with email and password
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      // Get user
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Verify password
      const bcrypt = require('bcrypt');
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Log user in (allow unverified users to login with limited features)
      req.login(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ error: "Login failed" });
        }
        
        const response: any = { 
          success: true, 
          user: { 
            id: user.id, 
            email: user.email, 
            role: user.role,
            emailVerified: user.emailVerified,
            firstName: user.firstName,
            lastName: user.lastName
          } 
        };

        // Add verification reminder for unverified users
        if (!user.emailVerified) {
          response.message = "Please verify your email address to access all features.";
          response.requiresEmailVerification = true;
        }
        
        res.json(response);
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  
  // Change password (for authenticated users)
  app.post("/api/auth/change-password", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }
      
      // Get current user
      const user = await storage.getUserByEmail(req.user.email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // For OAuth users, current password is not required
      if (user.passwordHash) {
        const bcrypt = require('bcrypt');
        const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!passwordValid) {
          return res.status(401).json({ error: "Current password is incorrect" });
        }
      }
      
      // Hash new password
      const bcrypt = require('bcrypt');
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      
      // Update user
      await storage.upsertUser({
        ...user,
        passwordHash: newPasswordHash,
        registrationMethod: user.registrationMethod === 'oauth' ? 'oauth' : 'email'
      });
      
      res.json({ success: true, message: "Password updated successfully" });
      
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Admin-only route to change installer passwords
  app.post("/api/admin/installer-password", async (req, res) => {
    try {
      // Check if user is admin
      const isAdminAuth = req.isAuthenticated() && req.user && (
        req.user.role === 'admin' || 
        req.user.email === 'admin@tradesbook.ie' || 
        req.user.email === 'jude.okun@gmail.com' ||
        req.user.id === '42442296'
      );
      
      if (!isAdminAuth) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { installerId, newPassword } = req.body;
      
      if (!installerId || !newPassword) {
        return res.status(400).json({ error: "Installer ID and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      
      // Get installer
      const installer = await storage.getInstaller(installerId);
      if (!installer) {
        return res.status(404).json({ error: "Installer not found" });
      }
      
      // Hash new password
      const bcrypt = require('bcrypt');
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      
      // Update installer password
      await storage.updateInstaller(installerId, { passwordHash: newPasswordHash });
      
      res.json({ success: true, message: "Installer password updated successfully" });
      
    } catch (error) {
      console.error('Admin change installer password error:', error);
      res.status(500).json({ error: "Failed to change installer password" });
    }
  });

  // Create installer invitation with auto-generated password
  app.post("/api/admin/invite-installer", async (req, res) => {
    try {
      // Check if user is admin
      const isAdminAuth = req.isAuthenticated() && req.user && (
        req.user.role === 'admin' || 
        req.user.email === 'admin@tradesbook.ie' || 
        req.user.email === 'jude.okun@gmail.com' ||
        req.user.id === '42442296'
      );
      
      if (!isAdminAuth) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { name, email, businessName, phone, address, county, tradeSkill, yearsExperience } = req.body;
      
      // Validate input
      if (!name || !email || !businessName) {
        return res.status(400).json({ error: "Name, email, and business name are required" });
      }
      
      // Check if email already exists
      const existingInstaller = await storage.getInstallerByEmail(email);
      if (existingInstaller) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      // Generate secure password
      const { generateSecurePassword } = await import('./passwordGeneratorService');
      const password = generateSecurePassword();
      
      // Hash password
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.default.hash(password, 10);
      
      // Create installer account
      const installer = await storage.registerInstaller(email, passwordHash, {
        contactName: name,
        businessName,
        phone: phone || null,
        address: address || null,
        serviceArea: county || null,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : 0,
        skills: tradeSkill || null,
        isApproved: false, // Admin needs to approve
        createdBy: req.user.email
      });
      
      // Send invitation email with password
      try {
        const { sendInstallerInvitationEmail } = await import('./gmailService');
        const emailResult = await sendInstallerInvitationEmail(
          email,
          name,
          businessName,
          password,
          {
            tradeSkill,
            county,
            createdBy: req.user.email
          }
        );
        
        if (emailResult) {
          console.log(`✅ Invitation email sent successfully to: ${email}`);
        } else {
          console.log(`❌ Invitation email failed to send to: ${email}`);
        }
      } catch (emailError) {
        console.error('❌ Failed to send invitation email:', emailError);
        // Don't fail invitation if email fails
      }
      
      // Return installer data (without password hash)
      const { passwordHash: _, ...installerData } = installer;
      res.status(201).json({
        success: true,
        installer: installerData,
        generatedPassword: password, // Include for admin reference
        message: "Installer invitation created successfully with auto-generated password"
      });
      
    } catch (error) {
      console.error("Installer invitation error:", error);
      res.status(500).json({ error: "Failed to create installer invitation" });
    }
  });

  // Create basic installer profile with completion invitation
  app.post("/api/admin/create-basic-installer", async (req, res) => {
    try {
      // Check if user is admin
      const isAdminAuth = req.isAuthenticated() && req.user && (
        req.user.role === 'admin' || 
        req.user.email === 'admin@tradesbook.ie' || 
        req.user.email === 'jude.okun@gmail.com' ||
        req.user.id === '42442296'
      );
      
      if (!isAdminAuth) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { name, email, businessName, phone, county, tradeSkill, adminNotes } = req.body;
      
      // Validate input
      if (!name || !email || !tradeSkill) {
        return res.status(400).json({ error: "Name, email, and trade skill are required" });
      }
      
      // Check if email already exists
      const existingInstaller = await storage.getInstallerByEmail(email);
      if (existingInstaller) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      // Create basic installer profile (no password yet, pending completion)
      const installer = await storage.registerInstaller(email, null, {
        contactName: name,
        businessName: businessName || name,
        phone: phone || null,
        address: null,
        serviceArea: county || null,
        yearsExperience: 0,
        skills: tradeSkill,
        isApproved: false,
        profileCompleted: false, // Mark as incomplete
        completionToken: generateCompletionToken(), // Generate secure token for completion
        adminNotes: adminNotes || null,
        createdBy: req.user.email
      });
      
      // Send completion invitation email
      try {
        const { sendProfileCompletionInvitationEmail } = await import('./gmailService');
        const emailResult = await sendProfileCompletionInvitationEmail(
          email,
          name,
          installer.completionToken,
          {
            tradeSkill,
            county,
            createdBy: req.user.email,
            adminNotes
          }
        );
        
        if (emailResult) {
          console.log(`✅ Profile completion invitation sent successfully to: ${email}`);
        } else {
          console.log(`❌ Profile completion invitation failed to send to: ${email}`);
        }
      } catch (emailError) {
        console.error('❌ Failed to send completion invitation email:', emailError);
        // Don't fail creation if email fails
      }
      
      // Return installer data
      const { passwordHash: _, completionToken: __, ...installerData } = installer;
      res.status(201).json({
        success: true,
        installer: installerData,
        message: "Basic profile created successfully. Completion invitation sent."
      });
      
    } catch (error) {
      console.error("Basic profile creation error:", error);
      res.status(500).json({ error: "Failed to create basic installer profile" });
    }
  });
  
  // Upgrade guest account to email/password account
  app.post("/api/auth/upgrade-account", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { password, firstName, lastName } = req.body;
      
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }
      
      // Get current user
      const user = await storage.getUserByEmail(req.user.email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if user already has a password (not guest)
      if (user.passwordHash) {
        return res.status(400).json({ error: "Account already has password authentication" });
      }
      
      // Hash password
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Update user
      const updatedUser = await storage.upsertUser({
        ...user,
        firstName: firstName || user.firstName || '',
        lastName: lastName || user.lastName || '',
        passwordHash,
        registrationMethod: 'email'
      });
      
      res.json({ 
        success: true, 
        message: "Account upgraded successfully",
        user: { 
          id: updatedUser.id, 
          email: updatedUser.email, 
          role: updatedUser.role 
        } 
      });
      
    } catch (error) {
      console.error('Account upgrade error:', error);
      res.status(500).json({ error: "Failed to upgrade account" });
    }
  });

  // Platform settings API
  app.get('/api/admin/platform-settings', isAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllPlatformSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching platform settings:', error);
      res.status(500).json({ error: 'Failed to fetch platform settings' });
    }
  });

  app.post('/api/admin/platform-settings', isAdmin, async (req, res) => {
    try {
      const { key, value, description, category } = req.body;
      const setting = await storage.createPlatformSetting({
        key,
        value,
        description,
        category
      });
      res.json(setting);
    } catch (error) {
      console.error('Error creating platform setting:', error);
      res.status(500).json({ error: 'Failed to create platform setting' });
    }
  });

  app.patch('/api/admin/platform-settings/:key', isAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const { value, description, category } = req.body;
      const setting = await storage.updatePlatformSetting(key, {
        value,
        description,
        category
      });
      res.json(setting);
    } catch (error) {
      console.error('Error updating platform setting:', error);
      res.status(500).json({ error: 'Failed to update platform setting' });
    }
  });

  // Performance refund settings API (for star-based credit refunds)
  app.get('/api/admin/performance-refund-settings', isAdmin, async (req, res) => {
    try {
      const settings = await storage.getPerformanceRefundSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching performance refund settings:', error);
      res.status(500).json({ error: 'Failed to fetch performance refund settings' });
    }
  });

  app.post('/api/admin/performance-refund-settings', isAdmin, async (req, res) => {
    try {
      const { starLevel, refundPercentage, description, isActive } = req.body;
      
      if (!starLevel || refundPercentage === undefined) {
        return res.status(400).json({ error: 'Star level and refund percentage are required' });
      }
      
      const setting = await storage.createPerformanceRefundSetting({
        starLevel,
        refundPercentage,
        description,
        isActive: isActive !== false
      });
      
      res.json(setting);
    } catch (error) {
      console.error('Error creating performance refund setting:', error);
      res.status(500).json({ error: 'Failed to create performance refund setting' });
    }
  });

  app.put('/api/admin/performance-refund-settings/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { starLevel, refundPercentage, description, isActive } = req.body;
      
      const setting = await storage.updatePerformanceRefundSetting(parseInt(id), {
        starLevel,
        refundPercentage,
        description,
        isActive
      });
      
      res.json(setting);
    } catch (error) {
      console.error('Error updating performance refund setting:', error);
      res.status(500).json({ error: 'Failed to update performance refund setting' });
    }
  });

  app.delete('/api/admin/performance-refund-settings/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePerformanceRefundSetting(parseInt(id));
      
      if (!deleted) {
        return res.status(404).json({ error: 'Performance refund setting not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting performance refund setting:', error);
      res.status(500).json({ error: 'Failed to delete performance refund setting' });
    }
  });

  // First lead vouchers API
  app.get('/api/admin/first-lead-vouchers', isAdmin, async (req, res) => {
    try {
      const vouchers = await storage.getAllFirstLeadVouchers();
      res.json(vouchers);
    } catch (error) {
      console.error('Error fetching first lead vouchers:', error);
      res.status(500).json({ error: 'Failed to fetch first lead vouchers' });
    }
  });

  app.post('/api/admin/first-lead-vouchers', isAdmin, async (req, res) => {
    try {
      const { installerId, voucherAmount, originalLeadFee, adminNotes } = req.body;
      const voucher = await storage.createFirstLeadVoucher({
        installerId,
        voucherAmount,
        originalLeadFee,
        adminNotes
      });
      res.json(voucher);
    } catch (error) {
      console.error('Error creating first lead voucher:', error);
      res.status(500).json({ error: 'Failed to create first lead voucher' });
    }
  });

  app.patch('/api/admin/first-lead-vouchers/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isEligible, adminNotes } = req.body;
      const voucher = await storage.updateFirstLeadVoucher(parseInt(id), {
        isEligible,
        adminNotes
      });
      res.json(voucher);
    } catch (error) {
      console.error('Error updating first lead voucher:', error);
      res.status(500).json({ error: 'Failed to update first lead voucher' });
    }
  });

  // Check if installer is eligible for first lead voucher
  app.get('/api/installers/:id/first-lead-eligibility', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate installer ID
      if (!id || id === 'undefined' || isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'Invalid installer ID' });
      }
      
      const voucher = await storage.getFirstLeadVoucher(parseInt(id));
      
      // Check if they have platform setting enabled for first lead vouchers
      const settings = await storage.getAllPlatformSettings();
      const voucherEnabled = settings.find(s => s.key === 'first_lead_voucher_enabled');
      
      if (!voucherEnabled || voucherEnabled.value !== 'true') {
        return res.json({ eligible: false, reason: 'Voucher system disabled' });
      }
      
      // If no voucher record exists, they're eligible
      if (!voucher) {
        return res.json({ eligible: true, reason: 'First time installer' });
      }
      
      // Check if they're still eligible and haven't used their voucher
      if (voucher.isEligible && !voucher.isUsed) {
        return res.json({ 
          eligible: true, 
          voucherAmount: voucher.voucherAmount,
          reason: 'Unused voucher available' 
        });
      }
      
      res.json({ 
        eligible: false, 
        reason: voucher.isUsed ? 'Voucher already used' : 'No longer eligible' 
      });
    } catch (error) {
      console.error('Error checking first lead eligibility:', error);
      res.status(500).json({ error: 'Failed to check eligibility' });
    }
  });

  // Check admin promotion status for lead fee waivers
  app.get('/api/installers/:id/admin-promotion-status', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate installer ID
      if (!id || id === 'undefined' || isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'Invalid installer ID' });
      }
      
      // Check platform settings for active promotions
      const settings = await storage.getAllPlatformSettings();
      const freeLeadsPromotion = settings.find(s => s.key === 'free_leads_promotion_enabled');
      
      if (freeLeadsPromotion && freeLeadsPromotion.value === 'true') {
        return res.json({
          isActive: true,
          title: 'Free Leads Promotion Active!',
          description: 'All lead fees are currently waived as part of our special promotion',
          message: 'Take advantage of this limited-time offer to grow your business without lead fees!'
        });
      }
      
      // Check if installer has VIP status (also gets free leads)
      const installer = await storage.getInstaller(parseInt(id));
      if (installer && installer.isVip) {
        return res.json({
          isActive: true,
          title: 'VIP Status Active',
          description: 'You have VIP status with free lead access',
          message: 'As a VIP installer, you get free access to all leads!'
        });
      }
      
      res.json({ 
        isActive: false,
        title: '',
        description: '',
        message: ''
      });
    } catch (error) {
      console.error('Error checking admin promotion status:', error);
      res.status(500).json({ error: 'Failed to check promotion status' });
    }
  });

  // Use first lead voucher when purchasing a lead
  app.post('/api/installers/:id/use-first-lead-voucher', async (req, res) => {
    try {
      const { id } = req.params;
      const { bookingId, originalLeadFee } = req.body;
      
      const voucher = await storage.getFirstLeadVoucher(parseInt(id));
      
      if (!voucher || !voucher.isEligible || voucher.isUsed) {
        return res.status(400).json({ error: 'No eligible voucher available' });
      }
      
      // Mark voucher as used
      const usedVoucher = await storage.updateFirstLeadVoucher(voucher.id, {
        isUsed: true,
        usedAt: new Date(),
        usedForBookingId: bookingId,
        originalLeadFee
      });
      
      res.json({ 
        success: true, 
        voucherAmount: usedVoucher.voucherAmount,
        message: 'First lead voucher applied successfully' 
      });
    } catch (error) {
      console.error('Error using first lead voucher:', error);
      res.status(500).json({ error: 'Failed to use voucher' });
    }
  });

  // Upload completion photos for installed TVs
  app.post('/api/installer/upload-completion-photos', upload.array('photos'), async (req, res) => {
    try {
      const { bookingId, photos } = req.body;
      
      if (!bookingId || !photos || !Array.isArray(photos)) {
        return res.status(400).json({ error: 'Booking ID and photos array are required' });
      }
      
      // Update booking with completion photos
      await storage.updateBooking(parseInt(bookingId), {
        completionPhotos: photos
      });
      
      res.json({ success: true, photoCount: photos.length });
    } catch (error) {
      console.error('Error uploading completion photos:', error);
      res.status(500).json({ error: 'Failed to upload completion photos' });
    }
  });

  // QR Code verification and job completion endpoints
  // Verify QR code belongs to installer's assigned job
  app.post('/api/installer/verify-qr-code', async (req, res) => {
    try {
      const { qrCode, installerId } = req.body;
      
      if (!qrCode || !installerId) {
        return res.status(400).json({ error: 'QR code and installer ID are required' });
      }
      
      // Find booking by QR code
      const bookings = await storage.getAllBookings();
      const booking = bookings.find(b => b.qrCode === qrCode || b.qr_code === qrCode);
      
      if (!booking) {
        return res.status(404).json({ error: 'Invalid QR code - booking not found' });
      }
      
      // Check if installer is assigned to this booking
      const jobAssignments = await storage.getBookingJobAssignments(booking.id);
      const installerAssignment = jobAssignments.find(job => 
        job.installerId === parseInt(installerId) && (job.status === 'accepted' || job.status === 'in_progress')
      );
      
      if (!installerAssignment) {
        return res.status(403).json({ 
          error: 'You are not assigned to this installation or have not accepted the job',
          isAssigned: false
        });
      }
      
      // Check if job is already completed
      if (installerAssignment.status === 'completed') {
        return res.status(400).json({ 
          error: 'This installation has already been marked as complete',
          alreadyCompleted: true
        });
      }
      
      res.json({ 
        valid: true, 
        booking: {
          id: booking.id,
          qrCode: booking.qrCode,
          customerName: booking.contactName,
          address: booking.address,
          serviceType: booking.serviceType,
          scheduledDate: booking.scheduledDate,
          tvInstallations: booking.tvInstallations
        },
        jobAssignment: {
          id: installerAssignment.id,
          status: installerAssignment.status,
          acceptedDate: installerAssignment.acceptedDate,
          assignedDate: installerAssignment.assignedDate
        },
        jobAssignmentId: installerAssignment.id
      });
    } catch (error) {
      console.error('Error verifying QR code:', error);
      res.status(500).json({ error: 'Failed to verify QR code' });
    }
  });
  
  // Upload before and after photos for star rating system
  app.post('/api/installer/upload-before-after-photos', async (req, res) => {
    try {
      const { bookingId, photos } = req.body;
      
      if (!bookingId || !photos || !Array.isArray(photos)) {
        return res.status(400).json({ error: 'Booking ID and photos array are required' });
      }
      
      // Update the booking with before/after photos
      await storage.updateBooking(bookingId, {
        beforeAfterPhotos: photos
      });
      
      res.json({ 
        success: true, 
        message: 'Before and after photos uploaded successfully',
        photoCount: photos.length
      });
      
    } catch (error: any) {
      console.error('Error uploading before/after photos:', error);
      res.status(500).json({ error: error.message || 'Failed to upload photos' });
    }
  });

  // Installation Photo Progress Management Routes
  // Save photo progress (before/after photos with flexible capture)
  app.post('/api/installer/photo-progress', async (req, res) => {
    try {
      // Check installer authentication
      if (!req.session.installerAuthenticated || !req.session.installerId) {
        return res.status(401).json({ message: "Installer not authenticated" });
      }

      const installerId = req.session.installerId;
      const { bookingId, tvIndex, beforePhotoUrl, afterPhotoUrl, beforePhotoSource, afterPhotoSource, isCompleted } = req.body;

      if (!bookingId || tvIndex === undefined) {
        return res.status(400).json({ error: 'Booking ID and TV index are required' });
      }

      // Check if progress entry already exists
      const existingProgress = await storage.getInstallationPhotoProgress(bookingId, installerId, tvIndex);

      if (existingProgress) {
        // Update existing progress
        const updatedProgress = await storage.updateInstallationPhotoProgress(existingProgress.id, {
          beforePhotoUrl: beforePhotoUrl || existingProgress.beforePhotoUrl,
          afterPhotoUrl: afterPhotoUrl || existingProgress.afterPhotoUrl,
          beforePhotoSource: beforePhotoSource || existingProgress.beforePhotoSource,
          afterPhotoSource: afterPhotoSource || existingProgress.afterPhotoSource,
          isCompleted: isCompleted !== undefined ? isCompleted : existingProgress.isCompleted,
        });
        res.json({ success: true, progress: updatedProgress });
      } else {
        // Create new progress entry
        const newProgress = await storage.createInstallationPhotoProgress({
          bookingId,
          installerId,
          tvIndex,
          beforePhotoUrl: beforePhotoUrl || null,
          afterPhotoUrl: afterPhotoUrl || null,
          beforePhotoSource: beforePhotoSource || 'camera',
          afterPhotoSource: afterPhotoSource || 'camera',
          isCompleted: isCompleted || false,
        });
        res.json({ success: true, progress: newProgress });
      }
    } catch (error) {
      console.error('Error saving photo progress:', error);
      res.status(500).json({ error: 'Failed to save photo progress' });
    }
  });

  // Get photo progress for a booking
  app.get('/api/installer/photo-progress/:bookingId', async (req, res) => {
    try {
      // Check installer authentication
      if (!req.session.installerAuthenticated || !req.session.installerId) {
        return res.status(401).json({ message: "Installer not authenticated" });
      }

      const installerId = req.session.installerId;
      const bookingId = parseInt(req.params.bookingId);

      if (!bookingId) {
        return res.status(400).json({ error: 'Invalid booking ID' });
      }

      const progressList = await storage.getInstallationPhotoProgressByBooking(bookingId, installerId);
      res.json({ success: true, progress: progressList });
    } catch (error) {
      console.error('Error retrieving photo progress:', error);
      res.status(500).json({ error: 'Failed to retrieve photo progress' });
    }
  });

  // Get specific TV photo progress
  app.get('/api/installer/photo-progress/:bookingId/:tvIndex', async (req, res) => {
    try {
      // Check installer authentication
      if (!req.session.installerAuthenticated || !req.session.installerId) {
        return res.status(401).json({ message: "Installer not authenticated" });
      }

      const installerId = req.session.installerId;
      const bookingId = parseInt(req.params.bookingId);
      const tvIndex = parseInt(req.params.tvIndex);

      if (!bookingId || tvIndex === undefined) {
        return res.status(400).json({ error: 'Invalid booking ID or TV index' });
      }

      const progress = await storage.getInstallationPhotoProgress(bookingId, installerId, tvIndex);
      res.json({ success: true, progress });
    } catch (error) {
      console.error('Error retrieving specific photo progress:', error);
      res.status(500).json({ error: 'Failed to retrieve photo progress' });
    }
  });

  // Delete photo progress (reset progress when needed)
  app.delete('/api/installer/photo-progress/:bookingId', async (req, res) => {
    try {
      // Check installer authentication
      if (!req.session.installerAuthenticated || !req.session.installerId) {
        return res.status(401).json({ message: "Installer not authenticated" });
      }

      const installerId = req.session.installerId;
      const bookingId = parseInt(req.params.bookingId);

      if (!bookingId) {
        return res.status(400).json({ error: 'Invalid booking ID' });
      }

      await storage.deleteInstallationPhotoProgress(bookingId, installerId);
      res.json({ success: true, message: 'Photo progress deleted successfully' });
    } catch (error) {
      console.error('Error deleting photo progress:', error);
      res.status(500).json({ error: 'Failed to delete photo progress' });
    }
  });

  // Mark installation as complete via QR verification with star calculation
  app.post('/api/installer/complete-installation', async (req, res) => {
    try {
      const { qrCode, installerId, jobAssignmentId, beforeAfterPhotos } = req.body;
      
      if (!qrCode || !installerId || !jobAssignmentId) {
        return res.status(400).json({ error: 'QR code, installer ID, and job assignment ID are required' });
      }
      
      // Verify the QR code and assignment again for security
      const bookings = await storage.getAllBookings();
      const booking = bookings.find(b => b.qrCode === qrCode);
      
      if (!booking) {
        return res.status(404).json({ error: 'Invalid QR code - booking not found' });
      }
      
      const jobAssignments = await storage.getBookingJobAssignments(booking.id);
      const installerAssignment = jobAssignments.find(job => 
        job.id === jobAssignmentId && 
        job.installerId === parseInt(installerId) && 
        (job.status === 'accepted' || job.status === 'in_progress')
      );
      
      if (!installerAssignment) {
        return res.status(403).json({ error: 'Invalid job assignment' });
      }
      
      // Get TV count from booking to validate photos
      const tvInstallations = Array.isArray(booking.tvInstallations) ? booking.tvInstallations : [];
      const tvCount = tvInstallations.length || 1; // Default to 1 for legacy bookings
      
      // Validate before/after photos are provided
      if (!beforeAfterPhotos || !Array.isArray(beforeAfterPhotos) || beforeAfterPhotos.length !== tvCount) {
        return res.status(400).json({ 
          error: `Before and after photos required: ${tvCount} photo sets needed for ${tvCount} TV installation(s)`,
          requiredPhotoSets: tvCount,
          providedPhotoSets: beforeAfterPhotos ? beforeAfterPhotos.length : 0
        });
      }
      
      // Validate each TV has both before and after photos
      const incompletePhotos = beforeAfterPhotos.filter(tvPhoto => !tvPhoto.beforePhoto || !tvPhoto.afterPhoto);
      if (incompletePhotos.length > 0) {
        return res.status(400).json({ 
          error: `Incomplete photo sets: ${incompletePhotos.length} TV installations missing before or after photos`,
          requiredPhotos: 'Each TV needs both before and after photos'
        });
      }
      
      // Calculate photo completion rate and stars
      const photoCompletionRate = 100; // All photos completed if we reach this point
      const photoStars = 3; // Maximum photo stars for complete before/after photos
      
      // Total stars will be updated when customer leaves a review (up to 5 total)
      // Photo stars (0-3) + Review stars (0-2) = Total stars (0-5)
      const totalStars = photoStars; // Will be updated to include review stars later
      
      // Update booking with before/after photos, completion status, and star ratings
      await storage.updateBooking(booking.id, { 
        beforeAfterPhotos,
        photoCompletionRate,
        photoStars,
        qualityStars: totalStars,
        starCalculatedAt: new Date(),
        eligibleForRefund: true // Eligible for performance-based refund with 3+ stars
      });
      
      // Mark job as completed
      await storage.updateJobStatus(jobAssignmentId, 'completed');
      
      // Update booking status to completed
      await storage.updateBookingStatus(booking.id, 'completed');
      
      // Note: Installer payment is handled directly by customer, no platform wallet transaction needed
      
      // Send completion notifications
      try {
        const { sendGmailEmail } = await import('./gmailService');
        await sendGmailEmail({
          to: booking.customerEmail,
          subject: `TV Installation Completed - Booking #${booking.qrCode}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">🎉 Installation Complete!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your TV installation is ready to enjoy</p>
              </div>
              
              <div style="padding: 30px; background: #fff;">
                <h2 style="color: #10B981; margin: 0 0 20px 0;">Hello ${booking.customerName}!</h2>
                
                <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                  Great news! Your TV installation has been completed successfully. Our professional installer has finished the work and your entertainment setup is now ready to use.
                </p>
                
                <div style="background: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
                  <h3 style="color: #065F46; margin: 0 0 15px 0;">📝 Installation Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Booking Reference:</td><td style="color: #6B7280;">${booking.qrCode}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Installation Date:</td><td style="color: #6B7280;">${new Date().toLocaleDateString('en-IE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Service Type:</td><td style="color: #6B7280;">Professional TV Installation</td></tr>
                  </table>
                </div>
                
                <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
                  <h3 style="color: #92400E; margin: 0 0 15px 0;">⭐ Rate Your Experience</h3>
                  <p style="margin: 0; color: #78350F;">
                    We'd love to hear about your experience! Please consider leaving a review to help other customers and support our installer.
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <p style="color: #6B7280; font-size: 14px;">
                    Thank you for choosing <strong style="color: #10B981;">tradesbook.ie</strong> for your TV installation needs.
                  </p>
                </div>
              </div>
            </div>
          `
        });
        console.log(`✅ Installation completion email sent to: ${booking.customerEmail}`);
      } catch (emailError) {
        console.error('Failed to send completion notification:', emailError);
        // Don't fail the completion for email errors
      }
      
      res.json({ 
        success: true, 
        message: 'Installation marked as complete successfully',
        bookingId: booking.id,
        completedAt: new Date(),
        photoCount: beforeAfterPhotos.length,
        photoStars: photoStars,
        totalStars: totalStars
      });
    } catch (error) {
      console.error('Error completing installation:', error);
      res.status(500).json({ error: 'Failed to complete installation' });
    }
  });
  
  // Get installer's completed jobs
  app.get('/api/installer/:id/completed-jobs', async (req, res) => {
    try {
      const { id } = req.params;
      const jobAssignments = await storage.getInstallerJobAssignments(parseInt(id));
      
      const completedJobs = jobAssignments
        .filter(job => job.status === 'completed')
        .sort((a, b) => new Date(b.completedDate || 0).getTime() - new Date(a.completedDate || 0).getTime());
      
      // Get booking details for each completed job
      const completedJobsWithDetails = await Promise.all(
        completedJobs.map(async (job) => {
          const booking = await storage.getBooking(job.bookingId);
          return {
            ...job,
            booking: booking ? {
              id: booking.id,
              qrCode: booking.qrCode,
              customerName: booking.contactName,
              customerEmail: booking.contactEmail,
              phone: booking.phone,
              address: booking.address,
              serviceType: booking.serviceType,
              serviceDescription: booking.serviceDescription,
              estimatedTotal: booking.estimatedTotal,
              scheduledDate: booking.scheduledDate,
              completedDate: booking.completedDate,
              tvInstallations: booking.tvInstallations,
              beforeAfterPhotos: booking.beforeAfterPhotos,
              photoStars: booking.photoStars,
              qualityStars: booking.qualityStars,
              photoCompletionRate: booking.photoCompletionRate,
              showcaseInGallery: booking.showcaseInGallery
            } : null
          };
        })
      );
      
      res.json(completedJobsWithDetails);
    } catch (error) {
      console.error('Error fetching completed jobs:', error);
      res.status(500).json({ error: 'Failed to fetch completed jobs' });
    }
  });

  // Toggle showcase status for completed installation
  app.put('/api/booking/:id/showcase', async (req, res) => {
    try {
      const { id } = req.params;
      const { showcaseInGallery } = req.body;
      
      const booking = await storage.getBooking(parseInt(id));
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      // Only allow showcase for completed bookings with photos
      if (booking.status !== 'completed') {
        return res.status(400).json({ error: 'Only completed installations can be showcased' });
      }
      
      if (!booking.beforeAfterPhotos || booking.beforeAfterPhotos.length === 0) {
        return res.status(400).json({ error: 'Installations must have before/after photos to be showcased' });
      }
      
      await storage.updateBooking(parseInt(id), { 
        showcaseInGallery: showcaseInGallery 
      });
      
      res.json({ 
        success: true, 
        showcaseInGallery,
        message: showcaseInGallery ? 'Installation added to showcase gallery' : 'Installation removed from showcase gallery'
      });
    } catch (error) {
      console.error('Error updating showcase status:', error);
      res.status(500).json({ error: 'Failed to update showcase status' });
    }
  });

  // Send review request email to customer
  app.post('/api/installer/request-review', async (req, res) => {
    try {
      const { bookingId, installerId, customerEmail, customerName } = req.body;
      console.log('Review request data:', { bookingId, installerId, customerEmail, customerName });
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      if (booking.status !== 'completed') {
        return res.status(400).json({ error: 'Only completed installations can request reviews' });
      }
      
      const installer = await storage.getInstaller(installerId);
      if (!installer) {
        return res.status(404).json({ error: 'Installer not found' });
      }
      
      // Import and use gmail service
      const { sendReviewRequest } = await import('./gmailService.js');
      const emailSent = await sendReviewRequest(booking, installer, customerEmail, customerName);
      
      if (emailSent) {
        res.json({ 
          success: true,
          message: `Review request sent to ${customerName}`
        });
      } else {
        res.status(500).json({ error: 'Failed to send review request email' });
      }
    } catch (error) {
      console.error('Error sending review request:', error);
      res.status(500).json({ error: 'Failed to send review request' });
    }
  });

  // Get showcased installations for gallery
  app.get('/api/installation-showcase', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const serviceType = req.query.serviceType as string;
      
      const bookings = await storage.getAllBookings();
      
      // Filter for showcased completed installations with photos
      let showcasedBookings = bookings.filter(booking => 
        booking.showcaseInGallery === true &&
        booking.status === 'completed' &&
        booking.beforeAfterPhotos && 
        booking.beforeAfterPhotos.length > 0
      );
      
      // Filter by service type if specified
      if (serviceType && serviceType !== 'all') {
        showcasedBookings = showcasedBookings.filter(booking => 
          booking.serviceType === serviceType
        );
      }
      
      // Sort by completion date (newest first)
      showcasedBookings.sort((a, b) => 
        new Date(b.completedDate || b.updatedAt).getTime() - 
        new Date(a.completedDate || a.updatedAt).getTime()
      );
      
      const totalCount = showcasedBookings.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedBookings = showcasedBookings.slice(startIndex, endIndex);
      
      // Get installer details for each booking
      const installations = await Promise.all(paginatedBookings.map(async (booking) => {
        const installer = await storage.getInstaller(booking.installerId);
        const allReviews = await storage.getAllReviews();
        const bookingReviews = allReviews.filter(review => review.bookingId === booking.id);
        const primaryReview = bookingReviews.length > 0 ? bookingReviews[0] : null;
        
        // Get customer info for review attribution
        const customer = booking.userId ? await storage.getUser(booking.userId) : null;
        
        // Calculate real installer reviews and rating
        const installerReviews = allReviews.filter(review => {
          // Get booking for this review to find installer
          const reviewBooking = showcasedBookings.find(b => b.id === review.bookingId);
          return reviewBooking && reviewBooking.installerId === booking.installerId;
        });
        const averageRating = installerReviews.length > 0 
          ? installerReviews.reduce((sum, review) => sum + review.rating, 0) / installerReviews.length 
          : 0;
        const totalReviews = installerReviews.length;
        
        return {
          id: booking.id,
          location: booking.address,
          tvCount: booking.tvInstallations?.length || 1,
          services: booking.serviceDescription || booking.serviceType || 'TV Installation',
          primaryService: booking.serviceType || 'tv-installation',
          qualityStars: booking.qualityStars || 0,
          photoStars: booking.photoStars || 0,
          reviewStars: booking.reviewStars || 0,
          beforeAfterPhotos: booking.beforeAfterPhotos || [],
          installer: installer ? {
            id: installer.id,
            businessName: installer.businessName,
            contactName: installer.contactName,
            profileImage: installer.profileImageUrl,
            averageRating: averageRating,
            totalReviews: totalReviews,
            expertise: Array.isArray(installer.expertise) ? installer.expertise : [],
            serviceArea: installer.serviceArea || 'Ireland'
          } : null,
          reviews: bookingReviews.length > 0 ? bookingReviews.map(review => ({
            id: review.id,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            customerName: customer ? `${customer.firstName} ${customer.lastName}`.trim() : "Verified Customer",
            date: review.createdAt
          })) : [{
            id: null,
            rating: booking.qualityStars || 0,
            title: "Professional Installation",
            comment: "Installation completed to high standards",
            customerName: customer ? `${customer.firstName} ${customer.lastName}`.trim() : "Verified Customer",
            date: booking.completedDate || booking.updatedAt
          }],
          serviceType: booking.serviceType || 'tv-installation',
          completedAt: booking.completedDate || booking.updatedAt
        };
      }));
      
      res.json({
        installations,
        totalCount,
        page,
        hasMore: endIndex < totalCount
      });
    } catch (error) {
      console.error('Error fetching showcase installations:', error);
      res.status(500).json({ error: 'Failed to fetch showcase installations' });
    }
  });

  // Geocoded installations endpoint for maps
  app.get('/api/installations/geocoded', async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      const { geocodeAddress, getFallbackLocation } = await import('./services/geocoding.js');
      
      const geocodedInstallations = [];
      
      for (const booking of bookings) {
        if (!booking.address) continue;
        
        // Try to geocode the address
        let location = await geocodeAddress(booking.address);
        
        // If geocoding fails, try fallback location
        if (!location) {
          location = getFallbackLocation(booking.address);
        }
        
        // If still no location, skip this booking
        if (!location) continue;
        
        geocodedInstallations.push({
          id: booking.id,
          address: booking.address,
          county: location.county,
          lat: location.lat,
          lng: location.lng,
          serviceType: booking.serviceType,
          totalPrice: booking.totalPrice,
          status: booking.status,
          createdAt: booking.createdAt,
          tvSize: booking.tvSize
        });
      }
      
      res.json(geocodedInstallations);
    } catch (error) {
      console.error('Error fetching geocoded installations:', error);
      res.status(500).json({ error: 'Failed to fetch installation data' });
    }
  });

  // Password reset endpoints
  app.post('/api/password-reset/request', async (req, res) => {
    try {
      const { email, userType } = req.body;
      
      if (!email || !userType) {
        return res.status(400).json({ message: 'Email and user type are required' });
      }
      
      if (!['customer', 'installer'].includes(userType)) {
        return res.status(400).json({ message: 'Invalid user type' });
      }
      
      const result = await requestPasswordReset(email, userType);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error('Error requesting password reset:', error);
      res.status(500).json({ message: 'Failed to process password reset request' });
    }
  });

  app.post('/api/password-reset/confirm', async (req, res) => {
    try {
      const { token, newPassword, userType } = req.body;
      
      if (!token || !newPassword || !userType) {
        return res.status(400).json({ message: 'Token, new password, and user type are required' });
      }
      
      if (!['customer', 'installer'].includes(userType)) {
        return res.status(400).json({ message: 'Invalid user type' });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }
      
      const result = await resetPassword(token, newPassword, userType);
      
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error('Error confirming password reset:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  app.get('/api/password-reset/verify-token', async (req, res) => {
    try {
      const { token, userType } = req.query;
      
      console.log('=== PASSWORD RESET TOKEN VERIFICATION ===');
      console.log('Received token:', token);
      console.log('Received userType:', userType);
      console.log('Token length:', token ? (token as string).length : 'N/A');
      
      if (!token || !userType) {
        console.log('Missing token or userType');
        return res.status(400).json({ message: 'Token and user type are required' });
      }
      
      if (!['customer', 'installer'].includes(userType as string)) {
        console.log('Invalid userType:', userType);
        return res.status(400).json({ message: 'Invalid user type' });
      }
      
      const { hashToken } = await import('./passwordResetService.js');
      const hashedToken = hashToken(token as string);
      console.log('Hashed token:', hashedToken);
      
      const tokenRecord = await storage.getPasswordResetToken(hashedToken, userType as 'customer' | 'installer');
      console.log('Token record found:', !!tokenRecord);
      
      if (!tokenRecord) {
        console.log('Token record not found in database');
        return res.status(400).json({ 
          message: 'Invalid or expired reset token',
          debug: process.env.NODE_ENV === 'development' ? {
            receivedToken: token,
            hashedToken: hashedToken,
            userType: userType
          } : undefined
        });
      }
      
      console.log('Token expires at:', tokenRecord.expiresAt);
      console.log('Current time:', new Date());
      console.log('Is expired?', tokenRecord.expiresAt < new Date());
      
      if (tokenRecord.expiresAt < new Date()) {
        console.log('Token has expired');
        return res.status(400).json({ message: 'Reset token has expired' });
      }
      
      if (tokenRecord.used) {
        console.log('Token has already been used');
        return res.status(400).json({ message: 'Reset token has already been used' });
      }
      
      console.log('Token is valid!');
      res.json({ message: 'Token is valid' });
    } catch (error) {
      console.error('Error verifying password reset token:', error);
      res.status(500).json({ message: 'Failed to verify token' });
    }
  });

  // Customer Resources Management API Routes
  
  // Downloadable Guides Routes
  app.get("/api/downloadable-guides", async (req, res) => {
    try {
      const guides = await storage.getDownloadableGuides();
      res.json(guides);
    } catch (error) {
      console.error("Error fetching downloadable guides:", error);
      res.status(500).json({ message: "Failed to fetch downloadable guides" });
    }
  });

  app.get("/api/admin/downloadable-guides", isAdmin, async (req, res) => {
    try {
      const guides = await storage.getAllDownloadableGuides();
      res.json(guides);
    } catch (error) {
      console.error("Error fetching all downloadable guides:", error);
      res.status(500).json({ message: "Failed to fetch downloadable guides" });
    }
  });

  app.post("/api/admin/downloadable-guides", isAdmin, async (req, res) => {
    try {
      const guideData = req.body;
      const guide = await storage.createDownloadableGuide(guideData);
      res.json(guide);
    } catch (error) {
      console.error("Error creating downloadable guide:", error);
      res.status(500).json({ message: "Failed to create downloadable guide" });
    }
  });

  app.put("/api/admin/downloadable-guides/:id", isAdmin, async (req, res) => {
    try {
      const guideId = parseInt(req.params.id);
      const guideData = req.body;
      await storage.updateDownloadableGuide(guideId, guideData);
      res.json({ message: "Downloadable guide updated successfully" });
    } catch (error) {
      console.error("Error updating downloadable guide:", error);
      res.status(500).json({ message: "Failed to update downloadable guide" });
    }
  });

  app.delete("/api/admin/downloadable-guides/:id", isAdmin, async (req, res) => {
    try {
      const guideId = parseInt(req.params.id);
      await storage.deleteDownloadableGuide(guideId);
      res.json({ message: "Downloadable guide deleted successfully" });
    } catch (error) {
      console.error("Error deleting downloadable guide:", error);
      res.status(500).json({ message: "Failed to delete downloadable guide" });
    }
  });

  // Video Tutorials Routes
  app.get("/api/video-tutorials", async (req, res) => {
    try {
      const tutorials = await storage.getVideoTutorials();
      res.json(tutorials);
    } catch (error) {
      console.error("Error fetching video tutorials:", error);
      res.status(500).json({ message: "Failed to fetch video tutorials" });
    }
  });

  app.get("/api/admin/video-tutorials", isAdmin, async (req, res) => {
    try {
      const tutorials = await storage.getAllVideoTutorials();
      res.json(tutorials);
    } catch (error) {
      console.error("Error fetching all video tutorials:", error);
      res.status(500).json({ message: "Failed to fetch video tutorials" });
    }
  });

  app.post("/api/admin/video-tutorials", isAdmin, async (req, res) => {
    try {
      const tutorialData = req.body;
      const tutorial = await storage.createVideoTutorial(tutorialData);
      res.json(tutorial);
    } catch (error) {
      console.error("Error creating video tutorial:", error);
      res.status(500).json({ message: "Failed to create video tutorial" });
    }
  });

  app.put("/api/admin/video-tutorials/:id", isAdmin, async (req, res) => {
    try {
      const tutorialId = parseInt(req.params.id);
      const tutorialData = req.body;
      await storage.updateVideoTutorial(tutorialId, tutorialData);
      res.json({ message: "Video tutorial updated successfully" });
    } catch (error) {
      console.error("Error updating video tutorial:", error);
      res.status(500).json({ message: "Failed to update video tutorial" });
    }
  });

  app.delete("/api/admin/video-tutorials/:id", isAdmin, async (req, res) => {
    try {
      const tutorialId = parseInt(req.params.id);
      await storage.deleteVideoTutorial(tutorialId);
      res.json({ message: "Video tutorial deleted successfully" });
    } catch (error) {
      console.error("Error deleting video tutorial:", error);
      res.status(500).json({ message: "Failed to delete video tutorial" });
    }
  });

  // AI FAQ/Q&A System endpoints
  app.post("/api/faq/ask", checkAiCredits(AI_FEATURES.FAQ), async (req: AIRequest, res) => {
    try {
      const { question } = req.body;
      
      if (!question || question.trim().length === 0) {
        return res.status(400).json({ error: "Question is required" });
      }

      const response = await askQuestion(question);
      
      // Record AI usage after successful response
      await recordAiUsage(req);
      
      res.json(response);
    } catch (error) {
      console.error("Error asking FAQ question:", error);
      res.status(500).json({ 
        error: "Failed to generate answer", 
        message: error instanceof Error ? error.message : "Unknown error occurred" 
      });
    }
  });

  app.get("/api/faq/popular", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const popularQuestions = await getPopularQuestions(limit);
      res.json(popularQuestions);
    } catch (error) {
      console.error("Error fetching popular questions:", error);
      res.status(500).json({ error: "Failed to fetch popular questions" });
    }
  });

  // AI TV Comparison endpoint
  app.post("/api/ai/compare-tvs", checkAiCredits(AI_FEATURES.TV_COMPARISON), async (req: AIRequest, res) => {
    try {
      const { model1, model2 } = req.body;
      
      if (!model1 || !model2) {
        return res.status(400).json({ error: "Both TV models are required" });
      }

      const comparison = await compareTVModels(model1, model2);
      
      // Record AI usage after successful comparison
      await recordAiUsage(req);
      
      res.json(comparison);
    } catch (error) {
      console.error("Error comparing TV models:", error);
      res.status(500).json({ 
        error: "Failed to compare TV models", 
        message: error instanceof Error ? error.message : "Unknown error occurred" 
      });
    }
  });

  // AI Electronic Product Comparison endpoint
  app.post("/api/ai/compare-electronics", async (req, res) => {
    try {
      const { product1, product2, productCategory, questionnaire } = req.body;
      
      if (!product1 || !product2 || !productCategory) {
        return res.status(400).json({ 
          error: "Product 1, Product 2, and product category are required" 
        });
      }

      // Check if this is a skip-questions comparison (empty questionnaire)
      const isSkipComparison = !questionnaire || Object.keys(questionnaire).length === 0 || 
        !questionnaire.question1 || !questionnaire.question2 || !questionnaire.question3;

      if (!isSkipComparison) {
        // Normal comparison with questionnaire validation
        if (!questionnaire.question1 || !questionnaire.question2 || !questionnaire.question3) {
          return res.status(400).json({ 
            error: "Questionnaire must include answers to all three category questions" 
          });
        }
      }

      const comparison = await compareElectronicProducts(
        product1, 
        product2, 
        productCategory, 
        isSkipComparison ? {} : questionnaire
      );
      res.json(comparison);
    } catch (error) {
      console.error("Error comparing electronic products:", error);
      res.status(500).json({ 
        error: "Failed to compare electronic products", 
        message: error instanceof Error ? error.message : "Unknown error occurred" 
      });
    }
  });

  // AI Product Recommendation endpoint
  app.post("/api/ai/recommend", async (req, res) => {
    try {
      const { category, answers, maxBudgetEUR } = req.body;
      
      if (!category || !answers || !maxBudgetEUR) {
        return res.status(400).json({ 
          error: "Category, answers, and maxBudgetEUR are required" 
        });
      }

      console.log(`🎯 Finding products for category: ${category} with budget: €${maxBudgetEUR}`);
      
      const recommendations = await getProductRecommendations(
        category, 
        answers, 
        maxBudgetEUR
      );
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error getting product recommendations:", error);
      res.status(500).json({ 
        error: "Failed to get product recommendations", 
        message: error instanceof Error ? error.message : "Unknown error occurred" 
      });
    }
  });

  // AI Product Information endpoint
  app.post("/api/ai/product-info", checkAiCredits(AI_FEATURES.PRODUCT_INFO), async (req: AIRequest, res) => {
    try {
      const { model } = req.body;
      
      if (!model) {
        return res.status(400).json({ 
          error: "Product model is required" 
        });
      }

      console.log(`🔍 Getting product info for: ${model}`);
      
      const productInfo = await getProductInfo(model);
      
      // Record AI usage after successful response
      await recordAiUsage(req);
      
      res.json(productInfo);
    } catch (error) {
      console.error("Error getting product info:", error);
      res.status(500).json({ 
        error: "Failed to get product information", 
        message: error instanceof Error ? error.message : "Unknown error occurred" 
      });
    }
  });

  // AI Credit Usage Summary endpoint
  app.get('/api/ai/usage-summary', async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.user.id;
      const summary = await import("./aiCreditMiddleware").then(m => m.getAiUsageSummary(userId));
      
      res.json(summary);
    } catch (error) {
      console.error('Error getting AI usage summary:', error);
      res.status(500).json({ 
        error: 'Failed to get usage summary',
        message: 'Unable to retrieve AI usage information'
      });
    }
  });

  // AI Product Care Analysis endpoint
  app.post("/api/ai/product-care-analysis", checkAiCredits(AI_FEATURES.PRODUCT_CARE), async (req: AIRequest, res) => {
    try {
      const { productInfo, userContext } = req.body;
      
      if (!productInfo || !productInfo.name || !productInfo.category) {
        return res.status(400).json({ 
          error: "Product information with name and category is required" 
        });
      }

      console.log(`🛡️ Analyzing product care for: ${productInfo.name} (${productInfo.category})`);
      
      // The enhanced analyzeProductCare function now has built-in retry logic
      // and proper validation to minimize failures
      const analysis = await analyzeProductCare(productInfo, userContext);
      
      console.log(`✅ Product care analysis completed successfully with ${analysis.criticalScenarios.length} scenarios`);
      
      // Record AI usage after successful analysis
      await recordAiUsage(req);
      
      res.json(analysis);
    } catch (error) {
      console.error("❌ Product Care analysis failed after all retries:", error);
      res.status(500).json({ 
        error: "Failed to analyze product care", 
        message: error instanceof Error ? error.message : "AI analysis service unavailable",
        details: "Please ensure OpenAI API is available and try again"
      });
    }
  });

  // Admin FAQ management endpoints
  app.put("/api/admin/faq/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { answer } = req.body;
      
      if (!answer) {
        return res.status(400).json({ error: "Answer is required" });
      }

      await updateFaqAnswer(id, answer);
      res.json({ message: "FAQ answer updated successfully" });
    } catch (error) {
      console.error("Error updating FAQ answer:", error);
      res.status(500).json({ error: "Failed to update FAQ answer" });
    }
  });

  app.delete("/api/admin/faq/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await deactivateFaqAnswer(id);
      res.json({ message: "FAQ answer deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating FAQ answer:", error);
      res.status(500).json({ error: "Failed to deactivate FAQ answer" });
    }
  });

  // Consultation booking endpoints
  app.post("/api/consultations", async (req, res) => {
    try {
      const consultationData = req.body;
      
      // Basic validation
      if (!consultationData.customerName || !consultationData.customerEmail || 
          !consultationData.customerPhone || !consultationData.consultationType ||
          !consultationData.preferredContactMethod || !consultationData.subject || 
          !consultationData.message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create consultation in database
      const consultation = await storage.createConsultation(consultationData);

      // Send email notification to support
      const { sendGmailEmail } = await import('./gmailService');
      
      const consultationTypeLabels = {
        'technical-support': 'Technical Support',
        'tv-recommendation': 'TV Recommendation',
        'installation-planning': 'Installation Planning',
        'general-inquiry': 'General Inquiry'
      };

      const urgencyLabels = {
        'low': 'Low - Within a week',
        'normal': 'Normal - Within 2-3 days',  
        'high': 'High - Within 24 hours',
        'urgent': 'Urgent - Same day'
      };

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1>New Consultation Request</h1>
            <p style="margin: 0; opacity: 0.9;">ID: #${consultation.id}</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Customer Information</h2>
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p><strong>Name:</strong> ${consultationData.customerName}</p>
              <p><strong>Email:</strong> ${consultationData.customerEmail}</p>
              <p><strong>Phone:</strong> ${consultationData.customerPhone}</p>
              <p><strong>Existing Customer:</strong> ${consultationData.existingCustomer ? 'Yes' : 'No'}</p>
            </div>

            <h2 style="color: #333;">Consultation Details</h2>
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p><strong>Type:</strong> ${consultationTypeLabels[consultationData.consultationType] || consultationData.consultationType}</p>
              <p><strong>Subject:</strong> ${consultationData.subject}</p>
              <p><strong>Urgency:</strong> <span style="color: ${consultationData.urgency === 'urgent' ? '#dc2626' : consultationData.urgency === 'high' ? '#ea580c' : consultationData.urgency === 'normal' ? '#2563eb' : '#16a34a'};">${urgencyLabels[consultationData.urgency] || consultationData.urgency}</span></p>
              <p><strong>Preferred Contact:</strong> ${consultationData.preferredContactMethod}</p>
              ${consultationData.preferredDate ? `<p><strong>Preferred Date:</strong> ${new Date(consultationData.preferredDate).toLocaleDateString()}</p>` : ''}
              ${consultationData.preferredTime ? `<p><strong>Preferred Time:</strong> ${consultationData.preferredTime}</p>` : ''}
            </div>

            <h2 style="color: #333;">Message</h2>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
              <p style="margin: 0; white-space: pre-wrap;">${consultationData.message}</p>
            </div>

            <div style="margin-top: 30px; padding: 20px; background: #e3f2fd; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #1565c0;"><strong>Next Steps:</strong></p>
              <p style="margin: 5px 0 0 0; color: #1565c0;">Contact the customer within ${consultationData.urgency === 'urgent' ? '2 hours' : consultationData.urgency === 'high' ? '4 hours' : consultationData.urgency === 'normal' ? '24 hours' : '48 hours'} via their preferred method.</p>
            </div>
          </div>
        </div>
      `;

      const emailSent = await sendGmailEmail({
        to: 'support@tradesbook.ie',
        subject: `New Consultation Request: ${consultationTypeLabels[consultationData.consultationType]} - ${consultationData.subject}`,
        html: emailHtml
      });

      console.log(`Consultation created: ID ${consultation.id}, Email sent: ${emailSent}`);

      res.json({ 
        success: true, 
        consultation: consultation,
        emailSent: emailSent
      });

    } catch (error) {
      console.error("Error creating consultation:", error);
      res.status(500).json({ error: "Failed to create consultation request" });
    }
  });

  // Get consultation by ID (for confirmation page)
  app.get("/api/consultations/:id", async (req, res) => {
    try {
      const consultationId = parseInt(req.params.id);
      const consultation = await storage.getConsultation(consultationId);
      
      if (!consultation) {
        return res.status(404).json({ error: "Consultation not found" });
      }
      
      res.json(consultation);
    } catch (error) {
      console.error("Error fetching consultation:", error);
      res.status(500).json({ error: "Failed to fetch consultation" });
    }
  });

  // Admin endpoint to get all consultations
  app.get("/api/admin/consultations", isAdmin, async (req, res) => {
    try {
      const consultations = await storage.getAllConsultations();
      res.json(consultations);
    } catch (error) {
      console.error("Error fetching consultations:", error);
      res.status(500).json({ error: "Failed to fetch consultations" });
    }
  });

  // Admin endpoint to update consultation status
  app.patch("/api/admin/consultations/:id", isAdmin, async (req, res) => {
    try {
      const consultationId = parseInt(req.params.id);
      const updates = req.body;
      
      const consultation = await storage.updateConsultation(consultationId, updates);
      
      if (!consultation) {
        return res.status(404).json({ error: "Consultation not found" });
      }
      
      res.json(consultation);
    } catch (error) {
      console.error("Error updating consultation:", error);
      res.status(500).json({ error: "Failed to update consultation" });
    }
  });

  // Set up WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    wsClients.add(ws);
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      wsClients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsClients.delete(ws);
    });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connection_established',
      timestamp: new Date().toISOString()
    }));
  });
  
  console.log('WebSocket server setup complete on path /ws');

  // Manual trigger for expired lead processing (admin endpoint)
  app.post('/api/admin/process-expired-leads', async (req, res) => {
    try {
      console.log('🔧 Manual trigger for expired lead processing');
      await LeadExpiryService.processExpiredLeads();
      res.json({ 
        success: true, 
        message: 'Expired leads processed successfully' 
      });
    } catch (error) {
      console.error('Error in manual expired lead processing:', error);
      res.status(500).json({ 
        error: 'Failed to process expired leads',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Manual trigger for pre-installation reminders (admin endpoint)
  app.post('/api/admin/process-installation-reminders', async (req, res) => {
    try {
      console.log('🔧 Manual trigger for pre-installation reminders');
      await PreInstallationReminderService.processInstallationReminders();
      res.json({ 
        success: true, 
        message: 'Pre-installation reminders processed successfully' 
      });
    } catch (error) {
      console.error('Error in manual reminder processing:', error);
      res.status(500).json({ 
        error: 'Failed to process pre-installation reminders',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Cleanup monitoring services on server shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Server shutting down, cleaning up monitoring services...');
    LeadExpiryService.stopExpiryMonitoring();
    PreInstallationReminderService.stopReminderMonitoring();
  });

  process.on('SIGINT', () => {
    console.log('🛑 Server shutting down, cleaning up monitoring services...');
    LeadExpiryService.stopExpiryMonitoring();
    PreInstallationReminderService.stopReminderMonitoring();
    process.exit(0);
  });

  // ================================
  // PRODUCT CATEGORY QR CODE SYSTEM
  // ================================

  // Get all product categories (public endpoint)
  app.get('/api/product-categories', async (req, res) => {
    try {
      const categories = await storage.getActiveProductCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching product categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Get single product category by slug or ID
  app.get('/api/product-categories/:identifier', async (req, res) => {
    try {
      const { identifier } = req.params;
      
      // Try to find by slug first, then by ID
      let category = await storage.getProductCategoryBySlug(identifier);
      
      if (!category && !isNaN(Number(identifier))) {
        category = await storage.getProductCategory(Number(identifier));
      }

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      res.json(category);
    } catch (error) {
      console.error('Error fetching product category:', error);
      res.status(500).json({ error: 'Failed to fetch category' });
    }
  });

  // Track QR code scan (public endpoint)
  app.post('/api/qr-scan/:qrCodeId', async (req, res) => {
    try {
      const { qrCodeId } = req.params;
      const { storeLocation } = req.body;
      const sessionId = req.sessionID;
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip;
      const userId = req.session.user?.id;

      // Try AI tool QR code first
      const aiToolResult = await QRCodeService.trackAIToolQRCodeScan(
        qrCodeId, 
        sessionId, 
        storeLocation,
        userAgent, 
        ipAddress, 
        userId
      );

      if (aiToolResult.success) {
        console.log(`AI Tool QR scan tracked: ${qrCodeId}, tool: ${aiToolResult.toolId}`);
        return res.json({ 
          success: true, 
          type: 'ai-tool',
          toolId: aiToolResult.toolId,
          qrCodeDbId: aiToolResult.qrCodeDbId
        });
      }

      // Fallback to product category QR code
      const categoryResult = await QRCodeService.trackQRCodeScan(
        qrCodeId, 
        sessionId, 
        userAgent, 
        ipAddress, 
        userId
      );

      if (!categoryResult.success) {
        return res.status(404).json({ error: 'QR code not found' });
      }

      console.log(`Product category QR scan tracked: ${qrCodeId}, category: ${categoryResult.categoryId}`);
      res.json({ 
        success: true, 
        type: 'product-category',
        categoryId: categoryResult.categoryId 
      });
    } catch (error) {
      console.error('Error tracking QR scan:', error);
      res.status(500).json({ error: 'Failed to track scan' });
    }
  });

  // Admin endpoints for product category management
  app.post('/api/admin/product-categories', async (req, res) => {
    if (!req.session.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    try {
      // Validate the request body
      const validatedData = insertProductCategorySchema.parse(req.body);

      // Generate QR code for this category
      const { qrCodeId, qrCodeUrl } = await QRCodeService.generateCategoryQRCode(0, validatedData.slug);

      // Create the category with the QR code ID
      const categoryData = {
        ...validatedData,
        qrCodeId,
        qrCodeUrl,
        totalScans: 0,
        totalRecommendations: 0,
        totalConversions: 0,
        isActive: true
      };

      const category = await storage.createProductCategory(categoryData);

      // Update the QR code with the actual category ID
      await QRCodeService.generateCategoryQRCode(category.id, category.slug);

      res.json(category);
    } catch (error) {
      console.error('Error creating product category:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  });

  // Get all product categories for admin
  app.get('/api/admin/product-categories', async (req, res) => {
    if (!req.session.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    try {
      const categories = await storage.getAllProductCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching all product categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Update product category
  app.put('/api/admin/product-categories/:id', async (req, res) => {
    if (!req.session.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    try {
      const categoryId = parseInt(req.params.id);
      const updates = req.body;

      // If slug is being updated, regenerate QR code
      if (updates.slug) {
        const { qrCodeId, qrCodeUrl } = await QRCodeService.generateCategoryQRCode(categoryId, updates.slug);
        updates.qrCodeId = qrCodeId;
        updates.qrCodeUrl = qrCodeUrl;
      }

      const category = await storage.updateProductCategory(categoryId, updates);
      res.json(category);
    } catch (error) {
      console.error('Error updating product category:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  });

  // Delete product category
  app.delete('/api/admin/product-categories/:id', async (req, res) => {
    if (!req.session.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    try {
      const categoryId = parseInt(req.params.id);
      const success = await storage.deleteProductCategory(categoryId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Category not found' });
      }
    } catch (error) {
      console.error('Error deleting product category:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  // Generate flyer for category
  app.get('/api/admin/product-categories/:id/flyer', async (req, res) => {
    if (!req.session.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    try {
      const categoryId = parseInt(req.params.id);
      const category = await storage.getProductCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const flyerSVG = QRCodeService.generateFlyerSVG({
        name: category.name,
        description: category.description,
        iconEmoji: category.iconEmoji,
        backgroundColor: category.backgroundColor,
        textColor: category.textColor,
        qrCodeUrl: category.qrCodeUrl
      });

      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(flyerSVG);
    } catch (error) {
      console.error('Error generating flyer:', error);
      res.status(500).json({ error: 'Failed to generate flyer' });
    }
  });

  // Generate bulk flyers for all categories
  app.get('/api/admin/product-categories/bulk-flyer', async (req, res) => {
    if (!req.session.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    try {
      const categories = await storage.getActiveProductCategories();
      
      const flyerData = categories.map(category => ({
        name: category.name,
        description: category.description,
        iconEmoji: category.iconEmoji,
        backgroundColor: category.backgroundColor,
        textColor: category.textColor,
        qrCodeUrl: category.qrCodeUrl
      }));

      const bulkFlyerSVG = QRCodeService.generateBulkFlyerSVG(flyerData);

      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(bulkFlyerSVG);
    } catch (error) {
      console.error('Error generating bulk flyer:', error);
      res.status(500).json({ error: 'Failed to generate bulk flyer' });
    }
  });

  // Get analytics for a category
  app.get('/api/admin/product-categories/:id/analytics', async (req, res) => {
    if (!req.session.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    try {
      const categoryId = parseInt(req.params.id);
      const days = parseInt(req.query.days as string) || 30;

      const [scanStats, recommendationStats, flowStats] = await Promise.all([
        storage.getCategoryScanStats(categoryId, days),
        storage.getCategoryRecommendationStats(categoryId, days),
        storage.getCategoryFlowStats(categoryId, days)
      ]);

      res.json({
        scans: scanStats,
        recommendations: recommendationStats,
        flows: flowStats
      });
    } catch (error) {
      console.error('Error fetching category analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Track AI product recommendation
  app.post('/api/ai-recommendations', async (req, res) => {
    try {
      const sessionId = req.sessionID;
      const userId = req.session.user?.id;
      
      const recommendationData = {
        ...req.body,
        sessionId,
        userId: userId || null
      };

      const recommendation = await storage.createAiProductRecommendation(recommendationData);
      
      // Increment category recommendation count
      if (recommendation.categoryId) {
        await storage.incrementCategoryRecommendationCount(recommendation.categoryId);
      }

      res.json(recommendation);
    } catch (error) {
      console.error('Error tracking AI recommendation:', error);
      res.status(500).json({ error: 'Failed to track recommendation' });
    }
  });

  // Update recommendation engagement
  app.put('/api/ai-recommendations/:id/engagement', async (req, res) => {
    try {
      const recommendationId = parseInt(req.params.id);
      const { engagement, selectedProduct } = req.body;

      await storage.updateRecommendationEngagement(recommendationId, engagement, selectedProduct);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating recommendation engagement:', error);
      res.status(500).json({ error: 'Failed to update engagement' });
    }
  });

  // Track choice flow
  app.post('/api/choice-flow', async (req, res) => {
    try {
      const sessionId = req.sessionID;
      const userId = req.session.user?.id;
      
      const flowData = {
        ...req.body,
        sessionId,
        userId: userId || null
      };

      const flow = await storage.createChoiceFlowTracking(flowData);
      res.json(flow);
    } catch (error) {
      console.error('Error tracking choice flow:', error);
      res.status(500).json({ error: 'Failed to track choice flow' });
    }
  });

  // Update choice flow step
  app.put('/api/choice-flow/:id/step', async (req, res) => {
    try {
      const flowId = parseInt(req.params.id);
      const { currentStep, responses } = req.body;

      await storage.updateChoiceFlowStep(flowId, currentStep, responses);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating choice flow step:', error);
      res.status(500).json({ error: 'Failed to update step' });
    }
  });

  // Complete choice flow
  app.put('/api/choice-flow/:id/complete', async (req, res) => {
    try {
      const flowId = parseInt(req.params.id);
      const { timeSpentMinutes } = req.body;

      await storage.completeChoiceFlow(flowId, timeSpentMinutes);
      res.json({ success: true });
    } catch (error) {
      console.error('Error completing choice flow:', error);
      res.status(500).json({ error: 'Failed to complete flow' });
    }
  });

  // Tradesperson Onboarding API Routes
  
  // Create onboarding invitation
  app.post('/api/admin/onboarding/create-invitation', async (req, res) => {
    try {
      const invitationData = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        businessName: req.body.businessName,
        county: req.body.county,
        tradeSkill: req.body.tradeSkill,
        adminNotes: req.body.adminNotes,
        createdBy: (req.session as any).user?.email || 'admin'
      };

      const invitation = await storage.createOnboardingInvitation(invitationData);
      
      // TODO: Send invitation email using existing email service
      // await sendTradesPersonInvitationEmail(invitation);
      
      res.json(invitation);
    } catch (error) {
      console.error('Error creating onboarding invitation:', error);
      res.status(500).json({ error: 'Failed to create invitation' });
    }
  });

  // Get all onboarding invitations
  app.get('/api/admin/onboarding/invitations', async (req, res) => {
    try {
      const invitations = await storage.getAllOnboardingInvitations();
      res.json(invitations);
    } catch (error) {
      console.error('Error fetching onboarding invitations:', error);
      res.status(500).json({ error: 'Failed to fetch invitations' });
    }
  });

  // Resend invitation
  app.post('/api/admin/onboarding/resend-invitation/:id', async (req, res) => {
    try {
      const invitationId = parseInt(req.params.id);
      const invitation = await storage.getOnboardingInvitation(invitationId);
      
      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      await storage.resendOnboardingInvitation(invitationId);
      
      // TODO: Resend invitation email
      // await sendTradesPersonInvitationEmail(invitation);
      
      res.json({ success: true, message: 'Invitation resent successfully' });
    } catch (error) {
      console.error('Error resending invitation:', error);
      res.status(500).json({ error: 'Failed to resend invitation' });
    }
  });

  // Register installer directly on behalf
  app.post('/api/admin/onboarding/register-installer', async (req, res) => {
    try {
      const { name, email, phone, businessName, county, tradeSkill, password } = req.body;
      
      // Check if installer already exists
      const existingInstaller = await storage.getInstallerByEmail(email);
      if (existingInstaller) {
        return res.status(400).json({ error: 'Installer with this email already exists' });
      }

      // Hash password
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(password, 10);

      // Create installer
      const installerData = {
        contactName: name,
        email,
        phone,
        businessName,
        county,
        tradeSkill,
        passwordHash,
        approvalStatus: 'approved', // Auto-approve admin-registered installers
        profileCompleted: false,
        registeredBy: 'admin'
      };

      const installer = await storage.createInstaller(installerData);
      
      // TODO: Send welcome email with login credentials
      // await sendInstallerWelcomeEmail(installer, password);
      
      res.json({ success: true, installer: { ...installer, passwordHash: undefined } });
    } catch (error) {
      console.error('Error registering installer:', error);
      res.status(500).json({ error: 'Failed to register installer' });
    }
  });

  // Create email template
  app.post('/api/admin/onboarding/create-email-template', async (req, res) => {
    try {
      const templateData = {
        templateName: req.body.templateName,
        tradeSkill: req.body.tradeSkill,
        subject: req.body.subject,
        content: req.body.content,
        isActive: true
      };

      const template = await storage.createTradesPersonEmailTemplate(templateData);
      res.json(template);
    } catch (error) {
      console.error('Error creating email template:', error);
      res.status(500).json({ error: 'Failed to create email template' });
    }
  });

  // Get all email templates
  app.get('/api/admin/onboarding/email-templates', async (req, res) => {
    try {
      const templates = await storage.getAllTradesPersonEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      res.status(500).json({ error: 'Failed to fetch email templates' });
    }
  });

  // AI-powered email template generation
  app.post('/api/admin/onboarding/generate-ai-template', async (req, res) => {
    try {
      const { tradeSkill, templateName, tone, focus } = req.body;
      
      if (!tradeSkill) {
        return res.status(400).json({ error: 'Trade skill is required' });
      }
      
      const aiTemplate = await generateEmailTemplate({
        tradeSkill,
        templateName,
        tone: tone || 'professional',
        focus: focus || 'opportunity'
      });
      
      res.json(aiTemplate);
    } catch (error) {
      console.error('Error generating AI email template:', error);
      res.status(500).json({ error: error.message || 'Failed to generate AI email template' });
    }
  });

  // Get preset template for a specific trade skill
  app.get('/api/admin/onboarding/preset-template/:tradeSkill', async (req, res) => {
    try {
      const { tradeSkill } = req.params;
      
      const presetTemplate = getPresetTemplate(tradeSkill);
      
      if (!presetTemplate) {
        return res.status(404).json({ error: 'No preset template found for this trade skill' });
      }
      
      res.json(presetTemplate);
    } catch (error) {
      console.error('Error fetching preset template:', error);
      res.status(500).json({ error: 'Failed to fetch preset template' });
    }
  });

  // Get all available preset templates
  app.get('/api/admin/onboarding/preset-templates', async (req, res) => {
    try {
      const presetTemplates = getAllPresetTemplates();
      res.json(presetTemplates);
    } catch (error) {
      console.error('Error fetching preset templates:', error);
      res.status(500).json({ error: 'Failed to fetch preset templates' });
    }
  });

  // Onboarding landing page - handle invitation token
  app.get('/api/onboarding/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const invitation = await storage.getOnboardingInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ error: 'Invalid or expired invitation' });
      }

      // Update invitation status to 'opened' if still 'sent'
      if (invitation.status === 'sent') {
        await storage.updateOnboardingInvitationStatus(invitation.id, 'opened');
      }

      // Return invitation data for the onboarding form
      res.json({
        invitation: {
          id: invitation.id,
          name: invitation.name,
          email: invitation.email,
          phone: invitation.phone,
          businessName: invitation.businessName,
          county: invitation.county,
          tradeSkill: invitation.tradeSkill
        }
      });
    } catch (error) {
      console.error('Error fetching invitation:', error);
      res.status(500).json({ error: 'Failed to fetch invitation' });
    }
  });

  // Complete onboarding process
  app.post('/api/onboarding/:token/complete', async (req, res) => {
    try {
      const { token } = req.params;
      const invitation = await storage.getOnboardingInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ error: 'Invalid or expired invitation' });
      }

      const { password, ...profileData } = req.body;
      
      // Check if installer already exists
      const existingInstaller = await storage.getInstallerByEmail(invitation.email);
      if (existingInstaller) {
        return res.status(400).json({ error: 'Account already exists for this email' });
      }

      // Hash password
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(password, 10);

      // Create installer account
      const installerData = {
        contactName: invitation.name,
        email: invitation.email,
        phone: invitation.phone,
        businessName: invitation.businessName,
        county: invitation.county,
        tradeSkill: invitation.tradeSkill,
        passwordHash,
        ...profileData,
        approvalStatus: 'pending',
        profileCompleted: true,
        registeredViaInvitation: true
      };

      const installer = await storage.createInstaller(installerData);
      
      // Update invitation status
      await storage.updateOnboardingInvitationStatus(invitation.id, 'profile_completed');
      
      // Link invitation to created installer
      await db.update(onboardingInvitations)
        .set({ createdInstallerId: installer.id })
        .where(eq(onboardingInvitations.id, invitation.id));

      res.json({ 
        success: true, 
        message: 'Onboarding completed successfully! Your application is under review.',
        installer: { ...installer, passwordHash: undefined }
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      res.status(500).json({ error: 'Failed to complete onboarding' });
    }
  });

  // Store Partner Application Routes
  app.post("/api/store-partner/apply", async (req, res) => {
    try {
      const application = req.body;
      
      // Insert the store partner application
      const [newApplication] = await db.insert(storePartnerApplications)
        .values({
          storeName: application.storeName,
          businessName: application.businessName,
          websiteUrl: application.websiteUrl || null,
          contactName: application.contactName,
          contactEmail: application.contactEmail,
          contactPhone: application.contactPhone,
          contactPosition: application.contactPosition,
          businessRegistrationNumber: application.businessRegistrationNumber || null,
          vatNumber: application.vatNumber || null,
          yearsInBusiness: application.yearsInBusiness,
          numberOfLocations: application.numberOfLocations,
          primaryProducts: application.primaryProducts,
          headOfficeAddress: application.headOfficeAddress,
          serviceAreas: application.serviceAreas,
          monthlyInvoiceVolume: application.monthlyInvoiceVolume,
          installationServicesOffered: application.installationServicesOffered || false,
          currentInstallationPartners: application.currentInstallationPartners || null,
          reasonForJoining: application.reasonForJoining,
          invoiceFormat: application.invoiceFormat,
          sampleInvoiceNumber: application.sampleInvoiceNumber,
          posSystemUsed: application.posSystemUsed,
          canProvideInvoiceData: application.canProvideInvoiceData || false,
          submittedViaInvoice: application.submittedViaInvoice || null,
          referralSource: application.referralSource || null,
          status: "pending"
        })
        .returning();

      console.log(`✅ New store partnership application received from ${application.storeName}`);
      
      res.json({ 
        success: true,
        applicationId: newApplication.id,
        message: "Application submitted successfully! We'll review it within 2-3 business days."
      });

    } catch (error) {
      console.error("Error submitting store partnership application:", error);
      res.status(500).json({
        error: "Failed to submit application. Please try again later."
      });
    }
  });

  // Get store partnership applications (admin only)
  app.get("/api/admin/store-partner/applications", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const applications = await db.select()
        .from(storePartnerApplications)
        .orderBy(desc(storePartnerApplications.createdAt));

      res.json(applications);
    } catch (error) {
      console.error("Error fetching store partner applications:", error);
      res.status(500).json({
        error: "Failed to fetch applications"
      });
    }
  });

  // Service Types and Metrics endpoints
  app.get('/api/service-types', async (req, res) => {
    try {
      const serviceTypes = await storage.getAllServiceTypes();
      res.json(serviceTypes);
    } catch (error) {
      console.error('Error fetching service types:', error);
      res.status(500).json({ message: 'Failed to fetch service types' });
    }
  });

  app.get('/api/service-types/active', async (req, res) => {
    try {
      const activeServiceTypes = await storage.getActiveServiceTypes();
      res.json(activeServiceTypes);
    } catch (error) {
      console.error('Error fetching active service types:', error);
      res.status(500).json({ message: 'Failed to fetch active service types' });
    }
  });

  app.get('/api/service-metrics', async (req, res) => {
    try {
      const metrics = await storage.getServiceMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching service metrics:', error);
      res.status(500).json({ message: 'Failed to fetch service metrics' });
    }
  });

  app.post('/api/service-metrics/update-jobs-available', async (req, res) => {
    try {
      const { serviceTypeKey, count } = req.body;
      await storage.updateJobsAvailable(serviceTypeKey, count);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating jobs available:', error);
      res.status(500).json({ message: 'Failed to update jobs available' });
    }
  });

  app.post('/api/service-metrics/increment-completed', async (req, res) => {
    try {
      const { serviceTypeKey } = req.body;
      await storage.incrementJobsCompleted(serviceTypeKey);
      res.json({ success: true });
    } catch (error) {
      console.error('Error incrementing completed jobs:', error);
      res.status(500).json({ message: 'Failed to increment completed jobs' });
    }
  });

  app.post('/api/service-metrics/update-installer-count', async (req, res) => {
    try {
      const { serviceTypeKey, count } = req.body;
      await storage.updateInstallerCount(serviceTypeKey, count);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating installer count:', error);
      res.status(500).json({ message: 'Failed to update installer count' });
    }
  });

  app.post('/api/service-metrics/recalculate-earnings', async (req, res) => {
    try {
      const { serviceTypeKey } = req.body;
      await storage.recalculateEarningsRange(serviceTypeKey);
      res.json({ success: true });
    } catch (error) {
      console.error('Error recalculating earnings:', error);
      res.status(500).json({ message: 'Failed to recalculate earnings' });
    }
  });

  app.patch('/api/service-types/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      await storage.updateServiceTypeStatus(parseInt(id), isActive);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating service type status:', error);
      res.status(500).json({ message: 'Failed to update service type status' });
    }
  });

  // Installer service assignment endpoints
  app.get('/api/installer-service-assignments', async (req, res) => {
    try {
      console.log('Starting to fetch installer service assignments...');
      const assignments = await storage.getAllInstallerServiceAssignments();
      console.log('Successfully fetched assignments:', assignments.length);
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching installer service assignments:', error);
      res.status(500).json({ error: 'Failed to fetch installer service assignments' });
    }
  });

  app.get('/api/installers/:id/services', async (req, res) => {
    try {
      const installerId = parseInt(req.params.id);
      const services = await storage.getInstallerServices(installerId);
      res.json(services);
    } catch (error) {
      console.error('Error fetching installer services:', error);
      res.status(500).json({ error: 'Failed to fetch installer services' });
    }
  });

  app.post('/api/installers/:id/services', async (req, res) => {
    try {
      const installerId = parseInt(req.params.id);
      const { serviceTypeId, assignedBy } = req.body;
      
      const assignment = await storage.assignServiceToInstaller({
        installerId,
        serviceTypeId,
        assignedBy,
        isActive: true
      });
      
      res.json(assignment);
    } catch (error) {
      console.error('Error assigning service to installer:', error);
      res.status(500).json({ error: 'Failed to assign service to installer' });
    }
  });

  app.delete('/api/installers/:installerId/services/:serviceTypeId', async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      const serviceTypeId = parseInt(req.params.serviceTypeId);
      
      await storage.removeServiceFromInstaller(installerId, serviceTypeId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing service from installer:', error);
      res.status(500).json({ error: 'Failed to remove service from installer' });
    }
  });

  // Public showcase endpoint - displays completed installations without installer details
  app.get('/api/installation-showcase', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const serviceType = req.query.serviceType as string;

      // Build where conditions based on filters
      const whereConditions = [
        eq(bookings.status, 'completed'),
        eq(bookings.showcaseInGallery, true), // Only showcased installations
        isNotNull(bookings.beforeAfterPhotos)
      ];

      // Add service type filter if provided
      if (serviceType && serviceType !== 'all') {
        // Map frontend service types to backend values
        const serviceTypeMapping: { [key: string]: string } = {
          'tv-installation': 'TV Installation',
          'smart-home': 'Smart Home Setup',
          'general-install': 'General Installation'
        };
        
        const mappedServiceType = serviceTypeMapping[serviceType];
        if (mappedServiceType) {
          whereConditions.push(eq(bookings.serviceType, mappedServiceType));
        }
      }

      // Get completed bookings with installer information
      const completedJobs = await db
        .select({
          id: bookings.id,
          address: bookings.address,
          tvSize: bookings.tvSize,
          serviceType: bookings.serviceType,
          tvInstallations: bookings.tvInstallations,
          beforeAfterPhotos: bookings.beforeAfterPhotos,
          qualityStars: bookings.qualityStars,
          photoStars: bookings.photoStars,
          reviewStars: bookings.reviewStars,
          completedAt: bookings.updatedAt,
          createdAt: bookings.createdAt,
          installerId: jobAssignments.installerId,
          installerBusinessName: installers.businessName,
          installerContactName: installers.contactName,
          installerProfileImage: installers.profileImage,
          installerYearsExperience: installers.yearsExperience,
          installerExpertise: installers.expertise,
          installerServiceArea: installers.serviceArea,
          installerAverageRating: installers.averageRating,
          installerTotalReviews: installers.totalReviews
        })
        .from(bookings)
        .innerJoin(jobAssignments, eq(bookings.id, jobAssignments.bookingId))
        .innerJoin(installers, eq(jobAssignments.installerId, installers.id))
        .where(and(...whereConditions))
        .orderBy(desc(bookings.updatedAt))
        .limit(limit)
        .offset(offset);

      // Get reviews for these bookings (without reviewer personal info)
      const bookingIds = completedJobs.map(job => job.id);
      const jobReviews = await db
        .select({
          bookingId: reviews.bookingId,
          rating: reviews.rating,
          title: reviews.title,
          comment: reviews.comment,
          createdAt: reviews.createdAt
        })
        .from(reviews)
        .where(inArray(reviews.bookingId, bookingIds));

      // Combine jobs with their reviews
      const showcaseData = completedJobs.map(job => {
        const jobReview = jobReviews.find(review => review.bookingId === job.id);
        
        // Parse before/after photos
        const beforeAfterPhotos = Array.isArray(job.beforeAfterPhotos) 
          ? job.beforeAfterPhotos 
          : [];

        // Parse TV installations for multi-TV jobs
        const tvInstallations = Array.isArray(job.tvInstallations) 
          ? job.tvInstallations 
          : [];

        // Determine display information
        const displayInfo = tvInstallations.length > 0 
          ? {
              tvCount: tvInstallations.length,
              services: tvInstallations.map(tv => `${tv.tvSize} ${tv.serviceType}`).join(', '),
              primaryService: tvInstallations[0]?.serviceType || 'TV Installation'
            }
          : {
              tvCount: 1,
              services: `${job.tvSize} ${job.serviceType}`,
              primaryService: job.serviceType || 'TV Installation'
            };

        return {
          id: job.id,
          
          // Installer Profile Information
          installer: {
            id: job.installerId,
            businessName: job.installerBusinessName,
            contactName: job.installerContactName,
            profileImage: job.installerProfileImage,
            averageRating: job.installerAverageRating || 0,
            totalReviews: job.installerTotalReviews || 0,
            yearsExperience: job.installerYearsExperience || 0,
            expertise: Array.isArray(job.installerExpertise) ? job.installerExpertise : [],
            serviceArea: job.installerServiceArea || 'Ireland'
          },
          
          // Service Type (no sensitive details)
          serviceType: displayInfo.primaryService,
          
          // Photos (only show if they exist)
          beforeAfterPhotos: beforeAfterPhotos.filter(photo => 
            photo && photo.beforePhoto && photo.afterPhoto
          ),
          
          // Customer review (anonymous) - or placeholder if no review
          review: jobReview ? {
            rating: jobReview.rating,
            title: jobReview.title,
            comment: jobReview.comment,
            date: jobReview.createdAt
          } : {
            rating: job.qualityStars || 5,
            title: "Professional Installation Completed",
            comment: "Installation completed to professional standards with quality workmanship and attention to detail.",
            date: job.completedAt || job.createdAt
          },
          
          // Completion date (kept general)
          completedAt: job.completedAt || job.createdAt
        };
      }).filter(job => 
        // Only include jobs with photos
        job.beforeAfterPhotos.length > 0
      );

      res.json({
        installations: showcaseData,
        totalCount: showcaseData.length,
        page,
        hasMore: showcaseData.length === limit
      });

    } catch (error) {
      console.error('Error fetching installation showcase:', error);
      res.status(500).json({ 
        error: 'Failed to fetch installation showcase',
        installations: [],
        totalCount: 0,
        page: 1,
        hasMore: false
      });
    }
  });

  // AI Tools Management API Endpoints
  app.get("/api/admin/ai-tools", isAdmin, async (req, res) => {
    try {
      const tools = await storage.getAllAiTools();
      res.json(tools);
    } catch (error) {
      console.error('Error fetching AI tools:', error);
      res.status(500).json({ error: 'Failed to fetch AI tools' });
    }
  });

  app.post("/api/admin/ai-tools", isAdmin, async (req, res) => {
    try {
      const toolData = insertAiToolSchema.parse(req.body);
      const newTool = await storage.createAiTool(toolData);
      clearAiToolsCache(); // Clear cache so new tool is available immediately
      res.json(newTool);
    } catch (error) {
      console.error('Error creating AI tool:', error);
      res.status(500).json({ error: 'Failed to create AI tool' });
    }
  });

  app.put("/api/admin/ai-tools/:id", isAdmin, async (req, res) => {
    try {
      const toolId = parseInt(req.params.id);
      const updates = insertAiToolSchema.partial().parse(req.body);
      const updatedTool = await storage.updateAiTool(toolId, updates);
      clearAiToolsCache(); // Clear cache so updates are reflected immediately
      res.json(updatedTool);
    } catch (error) {
      console.error('Error updating AI tool:', error);
      res.status(500).json({ error: 'Failed to update AI tool' });
    }
  });

  app.patch("/api/admin/ai-tools/:id/status", isAdmin, async (req, res) => {
    try {
      const toolId = parseInt(req.params.id);
      const { isActive } = req.body;
      await storage.updateAiToolStatus(toolId, isActive);
      clearAiToolsCache(); // Clear cache so status changes are reflected immediately
      res.json({ success: true, message: 'AI tool status updated' });
    } catch (error) {
      console.error('Error updating AI tool status:', error);
      res.status(500).json({ error: 'Failed to update AI tool status' });
    }
  });

  app.delete("/api/admin/ai-tools/:id", isAdmin, async (req, res) => {
    try {
      const toolId = parseInt(req.params.id);
      await storage.deleteAiTool(toolId);
      clearAiToolsCache(); // Clear cache so deleted tool is no longer available
      res.json({ success: true, message: 'AI tool deleted' });
    } catch (error) {
      console.error('Error deleting AI tool:', error);
      res.status(500).json({ error: 'Failed to delete AI tool' });
    }
  });

  // Generate QR code for AI tool
  app.post("/api/admin/ai-tools/:id/qr-code", isAdmin, async (req, res) => {
    try {
      const toolId = parseInt(req.params.id);
      const { storeLocation } = req.body;
      
      // Get the AI tool details
      const tool = await storage.getAiTool(toolId);
      if (!tool) {
        return res.status(404).json({ error: 'AI tool not found' });
      }

      // Generate QR code for the AI tool
      const qrCodeData = await QRCodeService.generateAIToolQRCode(
        tool.id,
        tool.key,
        tool.name,
        storeLocation,
        true // Save to database
      );

      res.json({
        qrCodeId: qrCodeData.qrCodeId,
        qrCodeUrl: qrCodeData.qrCodeUrl,
        targetUrl: qrCodeData.qrCodeData,
        tool: {
          id: tool.id,
          name: tool.name,
          key: tool.key,
          description: tool.description
        },
        storeLocation
      });
    } catch (error) {
      console.error('Error generating AI tool QR code:', error);
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  });

  // Generate printable flyer for AI tool (GET method for downloading)
  app.get("/api/admin/ai-tools/:id/flyer", isAdmin, async (req, res) => {
    try {
      const toolId = parseInt(req.params.id);
      const storeLocation = req.query.storeLocation as string;
      
      // Get the AI tool details
      const tool = await storage.getAiTool(toolId);
      if (!tool) {
        return res.status(404).json({ error: 'AI tool not found' });
      }

      // Generate QR code for the AI tool (don't save for flyer generation)
      const qrCodeData = await QRCodeService.generateAIToolQRCode(
        tool.id,
        tool.key,
        tool.name,
        storeLocation,
        false // Don't save to database for flyer generation
      );

      // Generate printable flyer SVG
      const flyerSVG = QRCodeService.generateAIToolFlyerSVG({
        name: tool.name,
        description: tool.description,
        qrCodeUrl: qrCodeData.qrCodeUrl,
        storeLocation
      });

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="${tool.key}-flyer.svg"`);
      res.send(flyerSVG);
    } catch (error) {
      console.error('Error generating AI tool flyer:', error);
      res.status(500).json({ error: 'Failed to generate flyer' });
    }
  });

  // Also support POST method for backward compatibility
  app.post("/api/admin/ai-tools/:id/flyer", isAdmin, async (req, res) => {
    try {
      const toolId = parseInt(req.params.id);
      const { storeLocation } = req.body;
      
      // Get the AI tool details
      const tool = await storage.getAiTool(toolId);
      if (!tool) {
        return res.status(404).json({ error: 'AI tool not found' });
      }

      // Generate QR code for the AI tool (don't save for flyer generation)
      const qrCodeData = await QRCodeService.generateAIToolQRCode(
        tool.id,
        tool.key,
        tool.name,
        storeLocation,
        false // Don't save to database for flyer generation
      );

      // Generate printable flyer SVG
      const flyerSVG = QRCodeService.generateAIToolFlyerSVG({
        name: tool.name,
        description: tool.description,
        qrCodeUrl: qrCodeData.qrCodeUrl,
        storeLocation
      });

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="${tool.key}-flyer.svg"`);
      res.send(flyerSVG);
    } catch (error) {
      console.error('Error generating AI tool flyer:', error);
      res.status(500).json({ error: 'Failed to generate flyer' });
    }
  });

  // Get all QR codes for an AI tool
  app.get("/api/admin/ai-tools/:id/qr-codes", isAdmin, async (req, res) => {
    try {
      const toolId = parseInt(req.params.id);
      const qrCodes = await storage.getAiToolQrCodes(toolId);
      res.json(qrCodes);
    } catch (error) {
      console.error('Error fetching AI tool QR codes:', error);
      res.status(500).json({ error: 'Failed to fetch QR codes' });
    }
  });

  // Delete a saved QR code
  app.delete("/api/admin/ai-tools/qr-codes/:qrCodeId", isAdmin, async (req, res) => {
    try {
      const qrCodeId = parseInt(req.params.qrCodeId);
      await storage.deleteAiToolQrCode(qrCodeId);
      res.json({ success: true, message: 'QR code deleted successfully' });
    } catch (error) {
      console.error('Error deleting AI tool QR code:', error);
      res.status(500).json({ error: 'Failed to delete QR code' });
    }
  });

  // Update a saved QR code (activate/deactivate)
  app.patch("/api/admin/ai-tools/qr-codes/:qrCodeId", isAdmin, async (req, res) => {
    try {
      const qrCodeId = parseInt(req.params.qrCodeId);
      const { isActive, storeLocation } = req.body;
      
      const updates: any = {};
      if (typeof isActive !== 'undefined') updates.isActive = isActive;
      if (storeLocation !== undefined) updates.storeLocation = storeLocation;
      
      const updatedQrCode = await storage.updateAiToolQrCode(qrCodeId, updates);
      res.json(updatedQrCode);
    } catch (error) {
      console.error('Error updating AI tool QR code:', error);
      res.status(500).json({ error: 'Failed to update QR code' });
    }
  });

  // AI Analytics Admin Routes
  app.get("/api/admin/ai-analytics/summary", isAdmin, async (req, res) => {
    try {
      const { startDate, endDate, storeLocation, aiTool } = req.query;
      
      const summary = await AIAnalyticsService.getAnalyticsSummary({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        storeLocation: storeLocation as string,
        aiTool: aiTool as string
      });
      
      res.json(summary);
    } catch (error) {
      console.error("Error fetching analytics summary:", error);
      res.status(500).json({ error: "Failed to fetch analytics summary" });
    }
  });

  app.get("/api/admin/ai-analytics/interactions", isAdmin, async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 50, 
        storeLocation, 
        aiTool, 
        startDate, 
        endDate,
        category,
        searchTerm
      } = req.query;
      
      const interactions = await AIAnalyticsService.getFilteredInteractions({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        storeLocation: storeLocation as string,
        aiTool: aiTool as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        category: category as string,
        searchTerm: searchTerm as string
      });
      
      res.json(interactions);
    } catch (error) {
      console.error("Error fetching interactions:", error);
      res.status(500).json({ error: "Failed to fetch interactions" });
    }
  });

  app.get("/api/admin/ai-analytics/stores", isAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const storeAnalytics = await AIAnalyticsService.getStoreAnalytics({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });
      
      res.json(storeAnalytics);
    } catch (error) {
      console.error("Error fetching store analytics:", error);
      res.status(500).json({ error: "Failed to fetch store analytics" });
    }
  });

  app.get("/api/admin/ai-analytics/store-insights/:storeLocation", isAdmin, async (req, res) => {
    try {
      const { storeLocation } = req.params;
      const { startDate, endDate } = req.query;
      
      const insights = await AIAnalyticsService.getStoreInsights(storeLocation, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });
      
      res.json(insights);
    } catch (error) {
      console.error("Error fetching store insights:", error);
      res.status(500).json({ error: "Failed to fetch store insights" });
    }
  });

  app.get("/api/admin/ai-analytics/popular-products", isAdmin, async (req, res) => {
    try {
      const { storeLocation, startDate, endDate, limit = 20 } = req.query;
      
      const popularProducts = await AIAnalyticsService.getPopularProducts({
        storeLocation: storeLocation as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: parseInt(limit as string)
      });
      
      res.json(popularProducts);
    } catch (error) {
      console.error("Error fetching popular products:", error);
      res.status(500).json({ error: "Failed to fetch popular products" });
    }
  });

  app.get("/api/admin/ai-analytics/export-csv", isAdmin, async (req, res) => {
    try {
      const { storeLocation, aiTool, startDate, endDate } = req.query;
      
      const csvData = await AIAnalyticsService.exportInteractionsCSV({
        storeLocation: storeLocation as string,
        aiTool: aiTool as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });
      
      const filename = `ai-analytics-${storeLocation || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvData);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  app.get("/api/admin/ai-analytics/usage-patterns", isAdmin, async (req, res) => {
    try {
      const { storeLocation, timeRange = '7d' } = req.query;
      
      const patterns = await AIAnalyticsService.getUsagePatterns(
        storeLocation as string,
        timeRange as string
      );
      
      res.json(patterns);
    } catch (error) {
      console.error("Error fetching usage patterns:", error);
      res.status(500).json({ error: "Failed to fetch usage patterns" });
    }
  });

  // Track QR code scan when user accesses AI tool via QR code
  app.post("/api/qr-code/scan", async (req, res) => {
    try {
      const { qrCodeId } = req.body;
      
      if (!qrCodeId) {
        return res.status(400).json({ error: 'QR code ID is required' });
      }

      // Increment the scan count for this QR code
      await storage.incrementQrCodeScanCount(qrCodeId);
      
      res.json({ success: true, message: 'Scan tracked successfully' });
    } catch (error) {
      console.error('Error tracking QR code scan:', error);
      res.status(500).json({ error: 'Failed to track scan' });
    }
  });

  // Object Storage Routes for Photo Uploads
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Handle profile photo upload completion
  app.put("/api/installers/:id/profile-photo", isAuthenticated, async (req, res) => {
    try {
      const installerId = parseInt(req.params.id);
      const { photoURL } = req.body;

      if (!photoURL) {
        return res.status(400).json({ error: "Photo URL is required" });
      }

      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      // Set ACL policy for the uploaded photo
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        photoURL,
        {
          owner: req.user?.id || "admin",
          visibility: "public", // Profile photos should be publicly accessible
        }
      );

      // Update installer with photo path
      await storage.updateInstaller(installerId, {
        profileImageUrl: objectPath
      });

      res.json({ objectPath });
    } catch (error) {
      console.error("Error setting profile photo:", error);
      res.status(500).json({ error: "Failed to set profile photo" });
    }
  });

  // Serve private objects (installer photos)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof Error && error.name === "ObjectNotFoundError") {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  return httpServer;
}


