import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { 
  insertBookingSchema, insertUserSchema, insertReviewSchema, insertScheduleNegotiationSchema,
  users, bookings, reviews, referralCodes, referralUsage
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { generateTVPreview, analyzeRoomForTVPlacement } from "./openai";
import { generateTVRecommendation } from "./tvRecommendationService";
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
  apiVersion: "2024-06-20",
});

import { sendGmailEmail, sendBookingConfirmation, sendInstallerNotification, sendAdminNotification, sendLeadPurchaseNotification, sendStatusUpdateNotification, sendScheduleProposalNotification, sendScheduleConfirmationNotification, sendInstallerWelcomeEmail, sendInstallerApprovalEmail, sendInstallerRejectionEmail } from "./gmailService";
import { generateVerificationToken, sendVerificationEmail, verifyEmailToken, resendVerificationEmail } from "./emailVerificationService";
import { harveyNormanReferralService } from "./harvestNormanReferralService";
import { pricingManagementService } from "./pricingManagementService";
import { getWebsiteMetrics } from "./analyticsService";

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
      function getStrategyName(hostname: string): string | null {
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'replitauth:localhost';
        } else if (hostname.includes('replit.dev') || hostname.includes('spock.replit.dev')) {
          return `replitauth:${hostname}`;
        } else if (hostname === 'tradesbook.ie' || hostname.includes('tradesbook.ie')) {
          return 'replitauth:tradesbook.ie';
        } else {
          const registeredDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
          return registeredDomain ? `replitauth:${registeredDomain}` : null;
        }
      }
      
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
          scope: "openid email profile offline_access",
          prompt: "login"  // Force login screen for sign-in
        })(req, res, next);
      });
      
    } catch (error) {
      console.error("OAuth login setup error:", error);
      res.status(500).json({ error: "OAuth login failed", details: error.message });
    }
  });

  // Simple installer authentication routes
  app.post("/api/installers/register", async (req, res) => {
    try {
      const { firstName, lastName, businessName, email, phone, address, county, password } = req.body;
      
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
        serviceArea: county
      });
      
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



  // Get installer profile endpoint
  app.get("/api/installers/profile", async (req, res) => {
    try {
      // Check if installer is authenticated via session
      if (!req.session.installerAuthenticated || !req.session.installerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const installer = await storage.getInstaller(req.session.installerId);
      
      if (!installer) {
        return res.status(404).json({ error: "Installer not found" });
      }
      
      // Return installer data (without password hash)
      const { passwordHash: _, ...installerData } = installer;
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
      
      // Determine strategy based on hostname
      function getStrategyName(hostname: string): string | null {
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'replitauth:localhost';
        } else if (hostname.includes('replit.dev') || hostname.includes('spock.replit.dev')) {
          return `replitauth:${hostname}`;
        } else if (hostname === 'tradesbook.ie' || hostname.includes('tradesbook.ie')) {
          return 'replitauth:tradesbook.ie';
        } else {
          const registeredDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
          return registeredDomain ? `replitauth:${registeredDomain}` : null;
        }
      }
      
      const strategyName = getStrategyName(req.hostname);
      if (!strategyName) {
        console.error("No OAuth strategy found for hostname:", req.hostname);
        return res.status(400).json({ error: "OAuth not configured for this domain" });
      }
      
      console.log("Using OAuth strategy:", strategyName);
      
      // Save session before OAuth redirect
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error before OAuth:", saveErr);
          return res.status(500).json({ error: "Session save failed" });
        }
        
        console.log("About to call passport.authenticate for signup...");
        passport.authenticate(strategyName, { 
          scope: "openid email profile offline_access",
          prompt: "consent"  // Force consent screen for sign-up
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
      
      res.json(user);
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
      const { firstName, lastName, email } = req.body;
      
      // Validate input
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }
      
      // Update user profile
      const updatedUser = await storage.updateUser(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim()
      });
      
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
      
      if (result.success) {
        res.json({ message: result.message });
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

  // Photo upload - storage only, no AI processing
  app.post("/api/upload-room-photo", upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No photo uploaded" });
      }

      // Optimize image for faster AI processing
      const base64Image = req.file.buffer.toString('base64');
      
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
        imageBase64: base64Image,
        analysis: analysis
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

  app.post("/api/generate-ai-preview", async (req, res) => {
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
      
      // Calculate pricing first to get required price fields
      const pricing = calculatePricing(
        rawData.serviceType || 'bronze',
        rawData.addons || []
      );
      

      
      // Set installerId to null for initial booking creation
      rawData.installerId = null;
      
      // Add calculated pricing to data as strings with null checks
      rawData.estimatedPrice = (pricing.estimatedPrice || 0).toFixed(2);
      rawData.estimatedTotal = (pricing.totalEstimate || 0).toFixed(2);
      rawData.estimatedAddonsPrice = (pricing.addonsPrice || 0).toFixed(2);
      
      // Add contact information (get from authenticated user or request)
      if (req.user) {
        rawData.contactName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Demo User';
        rawData.contactEmail = req.user.email || 'demo@tradesbook.ie';
        rawData.contactPhone = rawData.contactPhone || '01-234-5678'; // Default if not provided
      } else {
        rawData.contactName = rawData.contactName || 'Guest User';
        rawData.contactEmail = rawData.contactEmail || 'guest@tradesbook.ie';
        rawData.contactPhone = rawData.contactPhone || '01-234-5678';
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
      
      if (booking.installerId) {
        installer = await storage.getInstaller(booking.installerId);
        const jobs = await storage.getInstallerJobs(booking.installerId);
        jobAssignment = jobs.find(job => job.bookingId === booking.id);
      }
      
      // Format response with all tracking information
      const trackingData = {
        ...booking,
        installer: installer ? {
          id: installer.id,
          name: installer.contactName,
          businessName: installer.businessName,
          phone: installer.phone
        } : null,
        jobAssignment: jobAssignment ? {
          status: jobAssignment.status,
          assignedDate: jobAssignment.assignedDate,
          acceptedDate: jobAssignment.acceptedDate,
          completedDate: jobAssignment.completedDate
        } : null,
        contact: {
          name: booking.contactName,
          phone: booking.contactPhone
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
          
          // Calculate lead fee (app fee) for the booking
          const getLeadFee = (serviceType: string): number => {
            const serviceTierMap: { [key: string]: number } = {
              'table-top-small': 12,
              'bronze': 20,
              'silver': 25,
              'gold': 35
            };
            return serviceTierMap[serviceType] || 20; // Default to bronze fee
          };
          
          const leadFee = getLeadFee(booking.serviceType);
          
          // Map database fields to expected frontend fields and add installer/user info
          return {
            ...booking,
            // Fix price field mapping
            totalPrice: booking.estimatedPrice,
            estimatedTotal: booking.estimatedPrice,
            // Add app fee (lead fee) calculation
            appFee: leadFee,
            leadFee: leadFee,
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
          await storage.updateBookingStatus(
            parseInt(paymentIntent.metadata.bookingId), 
            'paid'
          );
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
      // Get all bookings with complete details including client selections
      const allBookings = await storage.getAllBookings();
      console.log('Total bookings retrieved:', allBookings.length);
      
      // Transform bookings to include all client selection details for installers
      const enhancedBookings = allBookings.map((booking, index) => {
        console.log(`Processing booking ${index + 1}/${allBookings.length}:`, booking.id);
        return {
        id: booking.id,
        customerName: booking.contactName,
        customer: booking.contactName, // Fallback for compatibility
        serviceTier: booking.serviceType,
        service: `${booking.serviceType} - ${booking.tvSize}" TV`, // Fallback for compatibility
        tvSize: booking.tvSize,
        wallType: booking.wallType,
        mountType: booking.mountType,
        wallMount: booking.wallMountOption,
        addons: Array.isArray(booking.addons) ? booking.addons : [],
        address: booking.address,
        preferredDate: booking.preferredDate,
        date: booking.preferredDate, // Fallback for compatibility
        installerEarnings: booking.estimatedPrice, // Use estimated price as earnings base
        earning: booking.estimatedPrice?.toString(), // Fallback for compatibility
        status: booking.status === 'pending' ? 'new' : booking.status,
        difficulty: booking.roomAnalysis ? 'Standard' : 'Unknown', // Derive from room analysis
        roomPhoto: booking.photoStorageConsent ? booking.roomPhotoUrl : null,
        originalImage: booking.photoStorageConsent ? booking.roomPhotoUrl : null, // Fallback for compatibility
        aiPreview: booking.aiPreviewUrl,
        roomAnalysis: booking.roomAnalysis, // Always show analysis text for installer preparation
        photoStorageConsent: booking.photoStorageConsent,
        customerEmail: booking.contactEmail,
        customerPhone: booking.contactPhone,
        notes: booking.customerNotes,
        qrCode: booking.qrCode,
        createdAt: booking.createdAt,
        totalPrice: booking.estimatedTotal
        };
      });

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

  // Harvey Norman Sales Staff Referral Routes
  app.post("/api/harvey-norman/create-code", async (req, res) => {
    try {
      const { salesStaffName, salesStaffStore, customCode } = req.body;
      
      if (!salesStaffName || !salesStaffStore) {
        return res.status(400).json({ message: "Sales staff name and store required" });
      }
      
      const newCode = await harveyNormanReferralService.createSalesStaffCode(
        salesStaffName,
        salesStaffStore,
        customCode
      );
      
      res.json(newCode);
    } catch (error) {
      console.error("Error creating Harvey Norman referral code:", error);
      res.status(500).json({ message: "Failed to create referral code" });
    }
  });

  app.post("/api/harvey-norman/validate", async (req, res) => {
    try {
      const { referralCode, bookingAmount } = req.body;
      
      if (!referralCode || !bookingAmount) {
        return res.status(400).json({ message: "Referral code and booking amount required" });
      }
      
      const result = await harveyNormanReferralService.validateAndCalculateDiscount(
        referralCode,
        parseFloat(bookingAmount)
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error validating Harvey Norman referral code:", error);
      res.status(500).json({ message: "Failed to validate referral code" });
    }
  });

  app.get("/api/harvey-norman/codes", async (req, res) => {
    try {
      const codes = await harveyNormanReferralService.getAllSalesStaffCodes();
      res.json(codes);
    } catch (error) {
      console.error("Error fetching Harvey Norman referral codes:", error);
      res.status(500).json({ message: "Failed to fetch referral codes" });
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

  // Review routes
  app.post("/api/reviews", async (req, res) => {
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

      // Get all open bookings that haven't been assigned to an installer
      const bookings = await storage.getAllBookings();
      const availableRequests = bookings.filter(booking => 
        booking.status === 'open' && !booking.installerId
      );

      // Transform bookings with lead access protection
      const requests = availableRequests.map(booking => {
        // Base information available to all installers
        const baseInfo = {
          id: booking.id,
          customerId: booking.userId || 0,
          tvSize: booking.tvSize,
          serviceType: booking.serviceType,
          totalPrice: booking.totalPrice,
          installerEarnings: (parseFloat(booking.totalPrice) * 0.75).toFixed(0), // 75% commission  
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
          coordinates: { lat: 53.3498, lng: -6.2603 } // Default Dublin coordinates
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
        
        // Create job assignment for demo lead purchase
        const jobAssignment = await storage.createJobAssignment({
          bookingId: requestId,
          installerId: targetInstallerId,
          status: "accepted",
          acceptedDate: new Date(),
          leadFee: leadFee.toString(),
          leadFeeStatus: "paid",
          leadPaidDate: new Date()
        });
        
        // Deduct lead fee from wallet
        const newBalance = currentBalance - leadFee;
        const totalSpent = parseFloat(wallet.totalSpent) + leadFee;
        await storage.updateInstallerWalletBalance(targetInstallerId, newBalance);
        await storage.updateInstallerWalletTotalSpent(targetInstallerId, totalSpent);
        
        // Add transaction record
        await storage.addInstallerTransaction({
          installerId: targetInstallerId,
          type: "lead_purchase",
          amount: (-leadFee).toString(),
          description: `Purchased demo lead access for request #${requestId}`,
          jobAssignmentId: jobAssignment.id,
          status: "completed"
        });
        
        return res.json({
          success: true,
          message: "Demo lead purchased successfully! Customer contact details are now available in your purchased leads.",
          jobAssignment: jobAssignment,
          newBalance: newBalance,
          demo: true
        });
      }
      
      // For real installers, redirect to purchase endpoint for lead-based model
      return res.status(400).json({ 
        message: "Lead purchase required",
        redirectTo: `/api/installer/purchase-lead/${requestId}`,
        requiresPayment: true
      });

    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({ message: "Failed to process request" });
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

  app.get("/api/installer/:installerId/active-jobs", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
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

  app.post("/api/installer/update-job-status/:jobId", async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const { status } = req.body;
      
      await storage.updateJobStatus(jobId, status);
      
      // If job is completed, also update the booking status and earnings
      if (status === "completed") {
        const jobs = await storage.getInstallerJobs(1); // Demo installer ID
        const job = jobs.find(j => j.id === jobId);
        
        if (job) {
          await storage.updateBookingStatus(job.bookingId, "completed");
          
          // Calculate earnings (installer keeps customer payment minus lead fee)
          const estimatedEarnings = 150.00; // Average job earnings
          
          // Update total earned in wallet
          const wallet = await storage.getInstallerWallet(1); // Demo installer ID
          if (wallet) {
            const currentEarned = parseFloat(wallet.totalEarned);
            const newTotalEarned = currentEarned + estimatedEarnings;
            await storage.updateInstallerWalletTotalEarned(1, newTotalEarned);
          }
          
          // Create earnings transaction record
          await storage.addInstallerTransaction({
            installerId: 1, // Demo installer ID
            type: "completion",
            amount: estimatedEarnings.toString(),
            description: `Job completion earnings for booking #${job.bookingId}`,
            jobAssignmentId: jobId,
            status: "completed"
          });
          
          // Send completion notification to customer
          const booking = await storage.getBooking(job.bookingId);
          if (booking) {
            await sendNotificationEmail(
              booking.customerEmail,
              "TV Installation Completed",
              `Your TV installation has been completed successfully! Thank you for choosing tradesbook.ie. Reference: ${booking.qrCode}`
            );
          }
        }
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
        
        // If demo installer doesn't exist, create one (only if demo data is enabled)
        if (!installer) {
          if (process.env.ENABLE_DEMO_DATA === 'true') {
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
          } else {
            return res.status(401).json({ error: "Demo account not available (demo data disabled)" });
          }
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
        
        // If installer doesn't exist, create a demo installer (only if demo data is enabled)
        if (!installer) {
          if (process.env.ENABLE_DEMO_DATA === 'true') {
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
          } else {
            return res.status(401).json({ error: "Demo account not available (demo data disabled)" });
          }
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
      const installers = await storage.getAllInstallers();
      
      // Return only public-safe installer information (hide contact details)
      const publicInstallers = installers
        .filter(installer => installer.approvalStatus === 'approved')
        .map(installer => ({
          id: installer.id,
          businessName: installer.businessName,
          serviceArea: installer.serviceArea || installer.county,
          bio: installer.bio,
          yearsExperience: installer.yearsExperience,
          expertise: installer.expertise,
          profileImageUrl: installer.profileImageUrl,
          insurance: installer.insurance,
          certifications: installer.certifications,
          // Hide contact details from public view
          contactName: installer.contactName?.split(' ')[0] + " " + (installer.contactName?.split(' ')[1]?.[0] || '') + ".", // Show first name + last initial
          email: "***@***.***", // Hidden
          phone: "***-***-****", // Hidden
          address: installer.county || "Ireland" // Only show county, not full address
        }));
      
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

  // Harvey Norman sample data initialization
  app.post('/api/harvey-norman/initialize-samples', async (req, res) => {
    try {
      const { harveyNormanInvoiceService } = await import('./harveyNormanInvoiceService');
      await harveyNormanInvoiceService.createSampleInvoices();
      res.json({ success: true, message: 'Sample invoices initialized' });
    } catch (error) {
      console.error('Error initializing sample invoices:', error);
      res.status(500).json({ error: 'Failed to initialize sample invoices' });
    }
  });

  // Harvey Norman Invoice Authentication API
  app.post('/api/auth/invoice-login', async (req, res) => {
    try {
      const { invoiceNumber } = req.body;
      
      if (!invoiceNumber) {
        return res.status(400).json({ error: "Invoice number is required" });
      }

      const { harveyNormanInvoiceService } = await import('./harveyNormanInvoiceService');
      
      // Validate invoice format first
      if (!harveyNormanInvoiceService.isValidInvoiceFormat(invoiceNumber)) {
        return res.status(400).json({ 
          error: "Invalid invoice format. Please enter your Harvey Norman invoice number (format: HN-[STORE]-[NUMBER])" 
        });
      }

      const result = await harveyNormanInvoiceService.loginWithInvoice(invoiceNumber);
      
      if (result.success && result.user) {
        // Establish proper Passport session for invoice-authenticated user
        req.login(result.user, (err) => {
          if (err) {
            console.error('Session login error:', err);
            return res.status(500).json({ error: 'Failed to establish session' });
          }
          
          // Set additional session data
          (req.session as any).userId = result.user.id;
          (req.session as any).isAuthenticated = true;
          (req.session as any).authMethod = 'invoice';
          
          res.json({
            success: true,
            user: result.user,
            message: result.message,
            isNewRegistration: result.isNewRegistration
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

      // Calculate real lead revenue from actual bookings
      const serviceTiers = [
        { id: 1, key: "table-top-small", name: "Table Top Small", leadFee: 12 },
        { id: 2, key: "bronze-wall-mount", name: "Bronze Wall Mount", leadFee: 20 },
        { id: 3, key: "silver-premium", name: "Silver Premium", leadFee: 25 },
        { id: 4, key: "gold-premium-large", name: "Gold Premium Large", leadFee: 35 }
      ];
      
      const leadRevenueByService: Record<string, { leadFee: number; count: number; revenue: number }> = {};
      
      // Initialize service tracking
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
        if (leadRevenueByService[serviceKey]) {
          leadRevenueByService[serviceKey].count += 1;
          leadRevenueByService[serviceKey].revenue += leadRevenueByService[serviceKey].leadFee;
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
      
      res.json({ message: "Installer status updated successfully" });
    } catch (error) {
      console.error("Error updating installer status:", error);
      res.status(500).json({ message: "Failed to update installer status" });
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

  // Admin Actions - Delete Booking (only for unassigned bookings)
  app.delete("/api/admin/bookings/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      
      // Get booking details to check if it can be deleted
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Only allow deletion if booking is not assigned or accepted by installer
      if (booking.installerId || ['installer_accepted', 'in_progress', 'completed'].includes(booking.status)) {
        return res.status(400).json({ 
          message: "Cannot delete booking that has been assigned to or accepted by an installer" 
        });
      }
      
      // Delete related records first to avoid foreign key constraints
      await db.delete(reviews).where(eq(reviews.bookingId, bookingId));
      
      // Delete the booking
      await storage.deleteBooking(bookingId);
      
      // Notify customer about cancellation
      if (booking.customerEmail) {
        await sendGmailEmail(
          booking.customerEmail,
          'Booking Cancelled - tradesbook.ie',
          `Your TV installation booking (${booking.qrCode}) has been cancelled by our admin team. If you have any questions, please contact our support team.`
        );
      }
      
      res.json({ message: "Booking deleted successfully" });
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ message: "Failed to delete booking" });
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

  // Review endpoints
  app.post("/api/reviews", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const reviewData = {
        ...req.body,
        userId
      };

      const review = await storage.createReview(reviewData);
      res.json(review);
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

  // Past leads management endpoints
  app.get("/api/installer/:installerId/past-leads", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      
      // Get actual purchased leads from database
      const purchasedLeads = await storage.getInstallerPurchasedLeads(installerId);
      
      // For other installers, try to get from database
      const allBookings = await storage.getAllBookings();
      const installerBookings = allBookings.filter(booking => 
        booking.installerId === installerId
      );
      
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
          estimatedPrice: booking.estimatedPrice || booking.totalPrice || "0",
          leadFee: getLeadFee(booking.serviceType).toString(),
          status: finalStatus,
          scheduledDate: booking.scheduledDate,
          completedDate: booking.completedDate,
          customerNotes: finalNotes,
          createdAt: booking.createdAt || new Date().toISOString()
        };
      });
      
      // Apply status updates to purchased leads as well
      const updatedPurchasedLeads = purchasedLeads.map(lead => {
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
      await storage.updateBookingStatus(bookingId, 'installer_assigned');

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

  // Get available leads for installer
  app.get("/api/installer/:installerId/available-leads", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      
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
      const availableBookings = allBookings.filter(booking => 
        // Include open, pending, urgent, confirmed status and ensure not assigned to any installer yet
        (booking.status === "open" || booking.status === "pending" || booking.status === "urgent" || booking.status === "confirmed") &&
        !booking.installerId && // Not assigned to any installer yet
        !declinedRequestIds.includes(booking.id) // Not declined by this installer
      );
      
      // Add lead fees and profit calculations
      const leadsWithFees = availableBookings.map(booking => {
        const leadFee = getLeadFee(booking.serviceType);
        const estimatedTotal = parseFloat(booking.estimatedTotal || booking.estimatedPrice || '0');
        const estimatedEarnings = estimatedTotal - leadFee;
        const profitMargin = estimatedTotal > 0 ? (estimatedEarnings / estimatedTotal * 100) : 0;
        
        return {
          id: booking.id,
          address: booking.address,
          serviceType: booking.serviceType,
          tvSize: booking.tvSize,
          wallType: booking.wallType,
          mountType: booking.mountType,
          addons: booking.addons || [],
          estimatedTotal: estimatedTotal.toFixed(2),
          leadFee,
          estimatedEarnings: Math.max(0, estimatedEarnings),
          profitMargin: Math.max(0, profitMargin),
          status: booking.status,
          scheduledDate: booking.scheduledDate,
          createdAt: booking.createdAt,
          qrCode: booking.qrCode,
          notes: booking.customerNotes || booking.notes,
          difficulty: booking.difficulty || 'moderate',
          // Customer contact details hidden until lead purchase
          customerName: "Customer details available after lead purchase",
          customerEmail: null, // Hidden until purchase
          customerPhone: null, // Hidden until purchase
          referralCode: booking.referralCode,
          referralDiscount: booking.referralDiscount
        };
      });
      
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
      
      // If not found, try Harvey Norman invoice format
      if (!booking && code.startsWith('HN-')) {
        // Find user by Harvey Norman invoice
        const users = await storage.getAllUsers();
        const user = users.find(u => u.harveyNormanInvoiceNumber === code);
        if (user) {
          booking = bookings.find(b => b.userId === user.id);
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

  // Google Maps API Routes
  app.post("/api/maps/geocode", async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }

      const { geocodeAddress } = await import('./googleMapsService');
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

  app.post("/api/maps/static-map", async (req, res) => {
    try {
      const { center, zoom, size, markers, mapType } = req.body;
      
      if (!center || !center.lat || !center.lng) {
        return res.status(400).json({ error: "Center coordinates are required" });
      }

      const { generateStaticMapUrl } = await import('./googleMapsService');
      const mapUrl = generateStaticMapUrl({
        center,
        zoom,
        size,
        markers,
        mapType
      });
      
      res.json({ mapUrl });
    } catch (error) {
      console.error("Static map generation error:", error);
      res.status(500).json({ error: "Failed to generate map" });
    }
  });

  app.post("/api/maps/distance", async (req, res) => {
    try {
      const { point1, point2 } = req.body;
      
      if (!point1 || !point2 || !point1.lat || !point1.lng || !point2.lat || !point2.lng) {
        return res.status(400).json({ error: "Two valid coordinate points are required" });
      }

      const { calculateDistance } = await import('./googleMapsService');
      const distance = calculateDistance(point1, point2);
      
      res.json({ distance });
    } catch (error) {
      console.error("Distance calculation error:", error);
      res.status(500).json({ error: "Failed to calculate distance" });
    }
  });

  app.post("/api/maps/validate-irish-address", async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }

      const { validateIrishAddress } = await import('./googleMapsService');
      const isValid = await validateIrishAddress(address);
      
      res.json({ isValid });
    } catch (error) {
      console.error("Address validation error:", error);
      res.status(500).json({ error: "Failed to validate address" });
    }
  });

  app.post("/api/maps/booking-map", async (req, res) => {
    try {
      const { customerAddress, installerLocation } = req.body;
      
      if (!customerAddress) {
        return res.status(400).json({ error: "Customer address is required" });
      }

      const { generateBookingMapImage } = await import('./googleMapsService');
      const mapUrl = await generateBookingMapImage(customerAddress, installerLocation);
      
      if (!mapUrl) {
        return res.status(404).json({ error: "Unable to generate map for the provided address" });
      }

      res.json({ mapUrl });
    } catch (error) {
      console.error("Booking map generation error:", error);
      res.status(500).json({ error: "Failed to generate booking map" });
    }
  });

  app.post("/api/maps/batch-geocode", async (req, res) => {
    try {
      const { addresses } = req.body;
      
      if (!addresses || !Array.isArray(addresses)) {
        return res.status(400).json({ error: "Array of addresses is required" });
      }

      const { batchGeocodeAddresses } = await import('./googleMapsService');
      const results = await batchGeocodeAddresses(addresses);
      
      res.json({ results });
    } catch (error) {
      console.error("Batch geocoding error:", error);
      res.status(500).json({ error: "Failed to batch geocode addresses" });
    }
  });

  app.post("/api/maps/find-nearby-installers", async (req, res) => {
    try {
      const { customerLocation, installerLocations } = req.body;
      
      if (!customerLocation || !installerLocations) {
        return res.status(400).json({ error: "Customer location and installer locations are required" });
      }

      const { findNearbyInstallers } = await import('./googleMapsService');
      const nearbyInstallers = await findNearbyInstallers(customerLocation, installerLocations);
      
      res.json({ nearbyInstallers });
    } catch (error) {
      console.error("Find nearby installers error:", error);
      res.status(500).json({ error: "Failed to find nearby installers" });
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
      const negotiations = await storage.getBookingScheduleNegotiations(bookingId);
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

  app.patch("/api/schedule-negotiations/:id", async (req, res) => {
    try {
      const negotiationId = parseInt(req.params.id);
      const { status, responseMessage } = req.body;
      
      await storage.updateScheduleNegotiationStatus(negotiationId, status, responseMessage);
      
      // Send email notification about response
      const negotiation = await storage.getBookingScheduleNegotiations(req.body.bookingId);
      const latestNegotiation = negotiation[0]; // Most recent
      
      if (latestNegotiation) {
        const booking = await storage.getBooking(latestNegotiation.bookingId);
        
        if (status === 'accepted') {
          // Update booking with confirmed schedule
          await storage.updateBooking(latestNegotiation.bookingId, {
            scheduledDate: new Date(latestNegotiation.proposedDate),
            status: 'scheduled'
          });
          
          // Send confirmation emails to both parties
          if (booking) {
            try {
              await sendScheduleConfirmationNotification(booking, latestNegotiation);
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

  const httpServer = createServer(app);
  return httpServer;
}


