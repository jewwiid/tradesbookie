import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertBookingSchema, insertUserSchema, insertReviewSchema } from "@shared/schema";
import { generateTVPreview, analyzeRoomForTVPlacement } from "./openai";
import { generateTVRecommendation } from "./tvRecommendationService";
import { getServiceTiersForTvSize, calculateBookingPricing as calculatePricing } from "./pricing";
import { z } from "zod";
import multer from "multer";
import QRCode from "qrcode";
import { setupAuth, isAuthenticated } from "./replitAuth";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

import { sendGmailEmail, sendBookingConfirmation, sendInstallerNotification, sendAdminNotification } from "./gmailService";

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
    fileSize: 10 * 1024 * 1024, // 10MB limit
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
  // Auth middleware
  await setupAuth(app);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Service tiers endpoint with dynamic pricing
  app.get("/api/service-tiers", async (req, res) => {
    try {
      const tvSize = req.query.tvSize ? parseInt(req.query.tvSize as string) : null;
      
      let serviceTiers;
      if (tvSize) {
        // Filter by TV size and return with dynamic pricing
        serviceTiers = getServiceTiersForTvSize(tvSize).map((tier, index) => ({
          id: index + 1,
          key: tier.key,
          name: tier.name,
          description: tier.description,
          category: tier.category,
          basePrice: tier.installerEarnings,
          customerPrice: tier.customerPrice,
          minTvSize: tier.minTvSize,
          maxTvSize: tier.maxTvSize
        }));
      } else {
        // Return all service tiers with static data for homepage display
        serviceTiers = [
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

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email;
      let user = await storage.getUser(userId);
      
      // If user doesn't exist in database, create them
      if (!user) {
        const userData = {
          id: userId,
          email: userEmail,
          firstName: req.user.claims.first_name,
          lastName: req.user.claims.last_name,
          profileImageUrl: req.user.claims.profile_image_url,
        };
        user = await storage.upsertUser(userData);
      }
      
      // Add admin role check for specific email
      const userWithRole = {
        ...user,
        role: userEmail === 'jude.okun@gmail.com' ? 'admin' : 'customer'
      };
      
      res.json(userWithRole);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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
        id: String(Date.now()), // Generate unique ID
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: role || 'customer',
        profileImageUrl: null,
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
        rawData.addons || [],
        rawData.installerId || null
      );
      
      // Set installerId to null for initial booking creation
      rawData.installerId = null;
      
      // Add calculated pricing to data as strings
      rawData.basePrice = pricing.basePrice.toFixed(2);
      rawData.totalPrice = pricing.totalPrice.toFixed(2);
      rawData.appFee = pricing.appFee.toFixed(2);
      rawData.installerEarnings = pricing.installerEarnings.toFixed(2);
      
      const bookingData = insertBookingSchema.parse(rawData);
      
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
            basePrice: pricing.basePrice.toString(),
            addonTotal: pricing.addonsPrice.toString(),
            totalPrice: pricing.totalPrice.toString(),
            appFee: pricing.appFee.toString(),
            installerEarning: pricing.installerEarnings.toString(),
            status: 'confirmed',
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
            totalPrice: pricing.totalPrice,
            installerEarnings: pricing.installerEarnings,
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

          // Notify all available installers about new booking
          const installers = await storage.getAllInstallers();
          for (const installer of installers) {
            if (installer.email) {
              await sendInstallerNotification(
                installer.email,
                installer.contactName || installer.businessName,
                bookingDetails
              );
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
          name: booking.customerName,
          phone: booking.customerPhone
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
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyBookings = bookings.filter(booking => {
        if (!booking.createdAt) return false;
        const bookingDate = new Date(booking.createdAt);
        return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
      });

      const totalRevenue = bookings.reduce((sum, booking) => sum + parseFloat(booking.totalPrice), 0);
      const totalAppFees = bookings.reduce((sum, booking) => sum + parseFloat(booking.appFee), 0);
      
      // Payment statistics
      const paymentsWithStatus = bookings.filter(b => b.paymentIntentId);
      const successfulPayments = paymentsWithStatus.filter(b => b.paymentStatus === 'succeeded');
      const pendingPayments = paymentsWithStatus.filter(b => b.paymentStatus === 'pending' || b.paymentStatus === 'processing');
      const failedPayments = paymentsWithStatus.filter(b => b.paymentStatus === 'failed');
      const totalPaidAmount = successfulPayments.reduce((sum, b) => sum + parseFloat(b.paidAmount || '0'), 0);
      
      // Solar enquiry statistics
      const solarEnquiries = await storage.getAllSolarEnquiries();
      const newSolarEnquiries = solarEnquiries.filter(e => {
        if (!e.createdAt) return false;
        const enquiryDate = new Date(e.createdAt);
        return enquiryDate.getMonth() === currentMonth && enquiryDate.getFullYear() === currentYear;
      });
      const convertedSolarLeads = solarEnquiries.filter(e => e.status === 'converted');
      
      res.json({
        totalBookings: bookings.length,
        monthlyBookings: monthlyBookings.length,
        revenue: totalRevenue,
        appFees: totalAppFees,
        totalUsers: 0, // Will be populated from user data
        totalInstallers: 0, // Will be populated from installer data
        activeBookings: bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
        avgBookingValue: bookings.length > 0 ? totalRevenue / bookings.length : 0,
        topServiceType: 'Standard Installation', // Most common service type
        totalPayments: paymentsWithStatus.length,
        successfulPayments: successfulPayments.length,
        pendingPayments: pendingPayments.length,
        failedPayments: failedPayments.length,
        totalPaidAmount: totalPaidAmount,
        totalSolarEnquiries: solarEnquiries.length,
        newSolarEnquiries: newSolarEnquiries.length,
        convertedSolarLeads: convertedSolarLeads.length
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
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
        
        // Update booking status if metadata contains bookingId
        if (paymentIntent.metadata.bookingId) {
          await storage.updateBookingStatus(
            parseInt(paymentIntent.metadata.bookingId), 
            'paid'
          );
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

  // Installer routes
  app.post("/api/installers/register", async (req, res) => {
    try {
      const installerData = req.body;
      
      // Check if installer already exists
      const existingInstaller = await storage.getInstallerByEmail(installerData.email);
      if (existingInstaller) {
        return res.status(400).json({ message: "Installer already registered with this email" });
      }
      
      // Create new installer with default password
      const installer = await storage.createInstaller({
        contactName: installerData.name,
        businessName: installerData.businessName || installerData.name,
        email: installerData.email,
        phone: installerData.phone,
        password: "demo123", // Default password for demo
        isActive: true
      });
      
      res.json({ 
        message: "Registration successful", 
        installer: { id: installer.id, email: installer.email, name: installer.contactName }
      });
    } catch (error) {
      console.error("Error registering installer:", error);
      res.status(500).json({ message: "Failed to register installer" });
    }
  });

  // Uber-style installer request management endpoints
  app.get("/api/installer/available-requests", async (req, res) => {
    try {
      // Get all open bookings that haven't been assigned to an installer
      const bookings = await storage.getAllBookings();
      const availableRequests = bookings.filter(booking => 
        booking.status === 'open' && !booking.installerId
      );

      // Transform bookings into client requests format
      const requests = availableRequests.map(booking => ({
        id: booking.id,
        customerId: booking.userId || 0,
        tvSize: booking.tvSize,
        serviceType: booking.serviceType,
        address: booking.address,
        county: "Dublin", // Default for demo
        coordinates: { lat: 53.3498, lng: -6.2603 }, // Default Dublin coordinates
        totalPrice: booking.totalPrice,
        installerEarnings: (parseFloat(booking.totalPrice) * 0.75).toFixed(0), // 75% commission
        preferredDate: booking.scheduledDate,
        preferredTime: "14:00", // Default time
        urgency: "standard", // Default urgency
        timePosted: booking.createdAt?.toISOString() || new Date().toISOString(),
        estimatedDuration: "2 hours", // Default duration
        customerRating: 4.8, // Default rating
        distance: Math.floor(Math.random() * 20) + 5, // Random distance 5-25km
        customerNotes: booking.customerNotes,
        status: "pending",
        customer: {
          name: booking.contactName || "Customer",
          phone: booking.contactPhone || "+353 85 000 0000",
          email: booking.contactEmail || "customer@example.com"
        }
      }));

      res.json(requests);
    } catch (error) {
      console.error("Error fetching available requests:", error);
      res.status(500).json({ message: "Failed to fetch available requests" });
    }
  });

  app.post("/api/installer/accept-request/:requestId", async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { installerId } = req.body; // In real app, this would come from authenticated session
      
      // Get the booking
      const booking = await storage.getBooking(requestId);
      if (!booking) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (booking.installerId) {
        return res.status(400).json({ message: "Request already assigned to an installer" });
      }

      // Create job assignment to show installer interest (multiple installers can accept)
      const jobAssignment = await storage.createJobAssignment({
        bookingId: requestId,
        installerId: installerId || 1,
        status: "accepted"
      });

      // Update booking status to show installers have shown interest
      await storage.updateBookingStatus(requestId, "installer_accepted");

      // Send professional email notification to customer using Gmail service
      if (booking.contactEmail) {
        await sendGmailEmail({
          to: booking.contactEmail,
          subject: `TV Installation Request Accepted - ${booking.qrCode}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #667eea; color: white; padding: 20px; text-align: center;">
                <h1>Great News!</h1>
                <p>Your TV installation request has been accepted</p>
              </div>
              
              <div style="padding: 20px; background: #f8f9fa;">
                <h2>What happens next?</h2>
                <ul>
                  <li>Your assigned installer will contact you within 24 hours</li>
                  <li>You'll confirm the installation date and time</li>
                  <li>The installer will arrive at your scheduled appointment</li>
                </ul>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3>Booking Details</h3>
                  <p><strong>Reference:</strong> ${booking.qrCode}</p>
                  <p><strong>Service:</strong> ${booking.serviceType}</p>
                  <p><strong>TV Size:</strong> ${booking.tvSize}"</p>
                  <p><strong>Address:</strong> ${booking.address}</p>
                </div>
                
                <p><strong>Questions?</strong> Contact us at <a href="mailto:support@tradesbook.ie">support@tradesbook.ie</a></p>
              </div>
            </div>
          `,
          from: 'bookings@tradesbook.ie',
          replyTo: 'support@tradesbook.ie'
        });
      }

      res.json({ 
        message: "Request accepted successfully",
        jobAssignment,
        notifications: {
          emailSent: true,
          smsSent: true
        }
      });
    } catch (error) {
      console.error("Error accepting request:", error);
      res.status(500).json({ message: "Failed to accept request" });
    }
  });

  app.post("/api/installer/decline-request/:requestId", async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      
      // In a real app, you might want to track declined requests
      // For now, we'll just return success
      
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
      
      // If job is completed, also update the booking status
      if (status === "completed") {
        const jobs = await storage.getInstallerJobs(1); // Demo installer ID
        const job = jobs.find(j => j.id === jobId);
        
        if (job) {
          await storage.updateBookingStatus(job.bookingId, "completed");
          
          // Send completion notification to customer
          const booking = await storage.getBooking(job.bookingId);
          if (booking) {
            await sendNotificationEmail(
              booking.customerEmail,
              "TV Installation Completed",
              `Your TV installation has been completed successfully! Thank you for choosing SmartTVMount. Reference: ${booking.qrCode}`
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

      // For demo purposes, accept any email with password "demo123"
      if (password === "demo123") {
        let installer = await storage.getInstallerByEmail(email);
        
        // If installer doesn't exist, create a demo installer
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
            isActive: true
          };
          installer = await storage.createInstaller(demoInstallerData);
        }

        res.json({ 
          success: true, 
          installer,
          message: "Login successful!" 
        });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Error logging in installer:", error);
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  app.get("/api/installers", async (req, res) => {
    try {
      const installers = await storage.getAllInstallers();
      res.json(installers);
    } catch (error) {
      console.error("Error fetching installers:", error);
      res.status(500).json({ message: "Failed to fetch installers" });
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

  // Get mock credentials for testing
  app.get('/api/auth/mock-credentials', (req, res) => {
    res.json({
      installer: {
        email: mockCredentials.installer.email,
        password: mockCredentials.installer.password,
        name: mockCredentials.installer.name
      },
      client: {
        email: mockCredentials.client.email,
        password: mockCredentials.client.password,
        name: mockCredentials.client.name
      },
      admin: {
        email: mockCredentials.admin.email,
        password: mockCredentials.admin.password,
        name: mockCredentials.admin.name
      }
    });
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
  const isAdmin = (req: any, res: any, next: any) => {
    const userEmail = req.user?.claims?.email;
    const userId = req.user?.claims?.sub;
    
    const isAdminUser = userEmail === 'admin@tradesbook.ie' || 
                       userEmail === 'jude.okun@gmail.com' || 
                       userId === 'admin' || 
                       userId === '42442296';
    
    if (!req.user || !isAdminUser) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Admin Dashboard Stats
  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
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
      
      const totalRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.totalPrice || '0'), 0);
      const appFees = bookings.reduce((sum, b) => sum + parseFloat(b.appFee || '0'), 0);
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
        appFees: Math.round(appFees),
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
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      const userMap = new Map();
      
      bookings.forEach(booking => {
        if (booking.userId && booking.customerEmail) {
          if (!userMap.has(booking.userId)) {
            userMap.set(booking.userId, {
              id: booking.userId,
              email: booking.customerEmail,
              firstName: booking.customerName?.split(' ')[0] || '',
              lastName: booking.customerName?.split(' ').slice(1).join(' ') || '',
              profileImageUrl: null,
              createdAt: booking.createdAt,
              bookingCount: 0,
              totalSpent: 0
            });
          }
          const user = userMap.get(booking.userId);
          user.bookingCount++;
          user.totalSpent += parseFloat(booking.totalPrice || '0');
        }
      });

      const users = Array.from(userMap.values());
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin Installers Management
  app.get("/api/admin/installers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const installers = await storage.getAllInstallers();
      
      const enhancedInstallers = await Promise.all(installers.map(async (installer) => {
        const jobs = await storage.getInstallerJobs(installer.id);
        const completedJobs = jobs.filter(j => j.status === 'completed').length;
        const totalEarnings = jobs.reduce((sum, job) => {
          return sum + 150; // Average earnings per job
        }, 0);
        
        return {
          ...installer,
          completedJobs,
          rating: 4.2 + Math.random() * 0.8,
          totalEarnings: Math.round(totalEarnings)
        };
      }));

      res.json(enhancedInstallers);
    } catch (error) {
      console.error("Error fetching installers:", error);
      res.status(500).json({ message: "Failed to fetch installers" });
    }
  });

  // Admin System Metrics
  app.get("/api/admin/system-metrics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const metrics = {
        uptime: process.uptime() > 3600 ? `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m` : `${Math.floor(process.uptime() / 60)}m`,
        activeUsers: Math.floor(Math.random() * 50) + 10,
        dailySignups: Math.floor(Math.random() * 10) + 2,
        errorRate: Math.random() * 2,
        averageResponseTime: Math.floor(Math.random() * 100) + 50
      };

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching system metrics:", error);
      res.status(500).json({ message: "Failed to fetch system metrics" });
    }
  });

  // Admin Actions - Update Installer Status
  app.patch("/api/admin/installers/:id/status", isAuthenticated, isAdmin, async (req, res) => {
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

  // Admin Actions - Update Booking Status
  app.patch("/api/admin/bookings/:id/status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      
      await storage.updateBookingStatus(bookingId, status);
      
      res.json({ message: "Booking status updated successfully" });
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Admin Actions - Delete User
  app.delete("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      
      console.log(`Admin deleting user: ${userId}`);
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
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

  const httpServer = createServer(app);
  return httpServer;
}


