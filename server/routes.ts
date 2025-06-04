import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateTVPlacementPreview, analyzeRoomForTVInstallation } from "./openai";
import { insertBookingSchema, insertUserSchema } from "@shared/schema";
import multer from "multer";
import QRCode from "qrcode";
import path from "path";

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
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // API Routes
  
  // Get service tiers
  app.get("/api/service-tiers", async (req, res) => {
    try {
      const tvSize = req.query.tvSize ? parseInt(req.query.tvSize as string) : undefined;
      
      let serviceTiers;
      if (tvSize) {
        serviceTiers = await storage.getServiceTiersByTVSize(tvSize);
      } else {
        serviceTiers = await storage.getServiceTiers();
      }
      
      res.json(serviceTiers);
    } catch (error) {
      console.error("Error fetching service tiers:", error);
      res.status(500).json({ message: "Failed to fetch service tiers" });
    }
  });

  // Get add-on services
  app.get("/api/add-on-services", async (req, res) => {
    try {
      const addOns = await storage.getAddOnServices();
      res.json(addOns);
    } catch (error) {
      console.error("Error fetching add-on services:", error);
      res.status(500).json({ message: "Failed to fetch add-on services" });
    }
  });

  // Upload room photo and get AI analysis
  app.post("/api/analyze-room", upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No photo uploaded" });
      }

      const base64Image = req.file.buffer.toString('base64');
      const analysis = await analyzeRoomForTVInstallation(base64Image);
      
      if (!analysis.success) {
        return res.status(500).json({ message: analysis.error });
      }

      // Return the base64 image along with analysis for frontend use
      res.json({
        ...analysis,
        imageBase64: base64Image
      });
    } catch (error) {
      console.error("Error analyzing room:", error);
      res.status(500).json({ message: "Failed to analyze room photo" });
    }
  });

  // Generate TV placement preview
  app.post("/api/generate-tv-preview", async (req, res) => {
    try {
      const { roomImageBase64, tvSize, mountType, wallType } = req.body;
      
      if (!roomImageBase64 || !tvSize || !mountType || !wallType) {
        return res.status(400).json({ 
          message: "Missing required fields: roomImageBase64, tvSize, mountType, wallType" 
        });
      }

      const preview = await generateTVPlacementPreview({
        roomImageBase64,
        tvSize: parseInt(tvSize),
        mountType,
        wallType
      });
      
      if (!preview.success) {
        return res.status(500).json({ message: preview.error });
      }

      res.json(preview);
    } catch (error) {
      console.error("Error generating TV preview:", error);
      res.status(500).json({ message: "Failed to generate TV preview" });
    }
  });

  // Create booking
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      
      // Calculate app fee based on fee structure
      const feeStructure = await storage.getFeeStructureByServiceTier(bookingData.serviceTierId);
      const feePercentage = feeStructure ? parseFloat(feeStructure.feePercentage.toString()) : 15; // Default 15%
      const appFee = (parseFloat(bookingData.totalPrice.toString()) * feePercentage) / 100;
      
      const booking = await storage.createBooking({
        ...bookingData,
        appFee: appFee.toString()
      });
      
      // Create booking add-ons if provided
      if (req.body.addOns && Array.isArray(req.body.addOns)) {
        for (const addOn of req.body.addOns) {
          await storage.createBookingAddOn({
            bookingId: booking.id,
            addOnServiceId: addOn.id,
            price: addOn.price
          });
        }
      }
      
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Get booking by QR code
  app.get("/api/bookings/qr/:qrCode", async (req, res) => {
    try {
      const { qrCode } = req.params;
      const booking = await storage.getBookingByQrCode(qrCode);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Get associated add-ons
      const addOns = await storage.getBookingAddOns(booking.id);
      
      res.json({ ...booking, addOns });
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  // Get booking by ID
  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const addOns = await storage.getBookingAddOns(booking.id);
      res.json({ ...booking, addOns });
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  // Customer login/access
  app.post("/api/customer-access", async (req, res) => {
    try {
      const { bookingId, email } = req.body;
      
      if (!bookingId || !email) {
        return res.status(400).json({ message: "Booking ID and email are required" });
      }

      // Find booking by QR code (which includes the booking ID) and verify email
      const booking = await storage.getBookingByQrCode(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Get customer details
      const customer = await storage.getUser(booking.customerId!);
      
      if (!customer || customer.email !== email) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const addOns = await storage.getBookingAddOns(booking.id);
      res.json({ 
        booking: { ...booking, addOns },
        customer 
      });
    } catch (error) {
      console.error("Error verifying customer access:", error);
      res.status(500).json({ message: "Failed to verify access" });
    }
  });

  // Get all bookings (admin)
  app.get("/api/admin/bookings", async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get booking statistics (admin)
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getBookingStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Update fee structure (admin)
  app.post("/api/admin/fee-structure", async (req, res) => {
    try {
      const { serviceTierId, feePercentage } = req.body;
      
      if (!serviceTierId || feePercentage === undefined) {
        return res.status(400).json({ message: "Service tier ID and fee percentage are required" });
      }

      const feeStructure = await storage.updateFeeStructure({
        serviceTierId,
        feePercentage: feePercentage.toString(),
        isActive: true
      });
      
      res.json(feeStructure);
    } catch (error) {
      console.error("Error updating fee structure:", error);
      res.status(500).json({ message: "Failed to update fee structure" });
    }
  });

  // Get fee structure (admin)
  app.get("/api/admin/fee-structure", async (req, res) => {
    try {
      const feeStructure = await storage.getFeeStructure();
      res.json(feeStructure);
    } catch (error) {
      console.error("Error fetching fee structure:", error);
      res.status(500).json({ message: "Failed to fetch fee structure" });
    }
  });

  // Installer routes
  app.get("/api/installer/jobs/:installerId", async (req, res) => {
    try {
      const installerId = parseInt(req.params.installerId);
      const jobs = await storage.getBookingsByInstaller(installerId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching installer jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Accept job (installer)
  app.post("/api/installer/accept-job", async (req, res) => {
    try {
      const { bookingId, installerId } = req.body;
      
      if (!bookingId || !installerId) {
        return res.status(400).json({ message: "Booking ID and installer ID are required" });
      }

      const booking = await storage.assignInstaller(bookingId, installerId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      console.error("Error accepting job:", error);
      res.status(500).json({ message: "Failed to accept job" });
    }
  });

  // Complete job (installer)
  app.post("/api/installer/complete-job", async (req, res) => {
    try {
      const { bookingId } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      const booking = await storage.updateBookingStatus(bookingId, "completed");
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      console.error("Error completing job:", error);
      res.status(500).json({ message: "Failed to complete job" });
    }
  });

  // Generate QR code
  app.get("/api/qr-code/:data", async (req, res) => {
    try {
      const { data } = req.params;
      const qrCodeDataUrl = await QRCode.toDataURL(data);
      res.json({ qrCode: qrCodeDataUrl });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  // Create user
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
