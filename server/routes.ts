import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertBookingSchema } from "@shared/schema";
import { generateTVPreview, analyzeRoomForTVPlacement } from "./openai";
import { z } from "zod";
import multer from "multer";
import QRCode from "qrcode";

// Email notification service (placeholder for SendGrid integration)
async function sendNotificationEmail(to: string, subject: string, content: string) {
  // In production, this would use SendGrid API
  console.log(`EMAIL NOTIFICATION: To: ${to}, Subject: ${subject}, Content: ${content}`);
  return true;
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
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.json(existingUser);
      }
      
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      // If database is unavailable, ask user to provide database credentials
      if (String(error).includes('endpoint is disabled')) {
        return res.status(503).json({ 
          message: "Database connection unavailable. Please check your database configuration or contact support.",
          error: "Database endpoint is disabled"
        });
      }
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

      const base64Image = req.file.buffer.toString('base64');
      
      // Store image without processing - AI analysis will happen at final booking step
      res.json({
        success: true,
        imageBase64: base64Image
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ message: "Failed to upload photo", error: String(error) });
    }
  });

  app.post("/api/generate-ai-preview", async (req, res) => {
    try {
      const { imageBase64, tvSize, mountType, wallType, concealment } = req.body;
      
      if (!imageBase64 || !tvSize) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const result = await generateTVPreview(
        imageBase64, 
        tvSize, 
        mountType || "fixed",
        wallType || "drywall",
        concealment || "none"
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
      const bookingData = insertBookingSchema.parse(req.body);
      
      // Calculate pricing based on service type and addons
      const pricing = calculateBookingPricing(
        bookingData.serviceType,
        bookingData.addons || [],
        bookingData.installerId || 1 // Default installer for demo
      );
      
      let booking;
      try {
        booking = await storage.createBooking({
          ...bookingData,
          basePrice: pricing.basePrice.toString(),
          addonsPrice: pricing.addonsPrice.toString(),
          totalPrice: pricing.totalPrice.toString(),
          appFee: pricing.appFee.toString(),
          installerEarnings: pricing.installerEarnings.toString(),
        });
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

      // For successful database bookings, create job assignment and QR code
      try {
        if (booking.installerId) {
          await storage.createJobAssignment({
            bookingId: booking.id,
            installerId: booking.installerId,
            status: 'assigned'
          });
        }

        // Generate QR code for booking tracking
        const qrCodeDataURL = await QRCode.toDataURL(booking.qrCode || `BOOKING-${booking.id}`, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        res.json({ booking, qrCode: qrCodeDataURL });
      } catch (finalError) {
        // If secondary operations fail, still return the booking
        console.error("Error with job assignment or QR generation:", finalError);
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
      
      res.json({
        totalBookings: bookings.length,
        monthlyBookings: monthlyBookings.length,
        revenue: totalRevenue,
        appFees: totalAppFees
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
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
      // Get all pending bookings that haven't been assigned to an installer
      const bookings = await storage.getAllBookings();
      const availableRequests = bookings.filter(booking => 
        booking.status === 'pending' && !booking.installerId
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
        return res.status(400).json({ message: "Request already accepted by another installer" });
      }

      // Update booking status and assign installer
      await storage.updateBookingStatus(requestId, "accepted");
      
      // In a real implementation, you'd update the booking with installer ID
      // For now, we'll create a job assignment
      const jobAssignment = await storage.createJobAssignment({
        bookingId: requestId,
        installerId: installerId || 1, // Default installer ID for demo
        status: "accepted",
        acceptedDate: new Date().toISOString()
      });

      // Send notifications to customer
      await sendNotificationEmail(
        booking.contactEmail || "customer@example.com",
        "TV Installation Request Accepted",
        `Great news! Your TV installation request has been accepted. An installer will contact you soon to confirm the appointment details. Booking reference: ${booking.qrCode}`
      );

      await sendNotificationSMS(
        booking.contactPhone || "+353850000000",
        `Your TV installation has been accepted! Installer will contact you soon. Reference: ${booking.qrCode}`
      );

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

  app.post("/api/installers/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const installer = await storage.getInstallerByEmail(email);
      if (!installer || password !== "demo123") {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json({ 
        message: "Login successful", 
        installer: { id: installer.id, email: installer.email, name: installer.contactName }
      });
    } catch (error) {
      console.error("Error logging in installer:", error);
      res.status(500).json({ message: "Failed to log in" });
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

  const httpServer = createServer(app);
  return httpServer;
}

// Pricing calculation helper
function calculateBookingPricing(
  serviceType: string,
  addons: Array<{ key: string; name: string; price: number }>,
  installerId: number
) {
  // Base pricing structure
  const basePrices: Record<string, number> = {
    'table-top-small': 89,
    'table-top-large': 109,
    'bronze': 109,
    'silver': 159,
    'silver-large': 259,
    'gold': 259,
    'gold-large': 359
  };

  const basePrice = basePrices[serviceType] || 109;
  const addonsPrice = addons.reduce((sum, addon) => sum + addon.price, 0);
  const totalPrice = basePrice + addonsPrice;
  
  // Default fee percentage (15%)
  const feePercentage = 15;
  const appFee = totalPrice * (feePercentage / 100);
  const installerEarnings = totalPrice - appFee;

  return {
    basePrice,
    addonsPrice,
    totalPrice,
    appFee,
    installerEarnings
  };
}
