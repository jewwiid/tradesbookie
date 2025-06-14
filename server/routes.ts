import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertBookingSchema } from "@shared/schema";
import { generateTVPlacement, enhanceRoomImage } from "./openai";
import multer from "multer";
import { nanoid } from "nanoid";

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
  // Initialize default service tiers
  await initializeServiceTiers();
  await initializeDefaultBusiness();

  // User endpoints
  app.post('/api/users', async (req, res) => {
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
      console.error('Error creating user:', error);
      res.status(400).json({ message: 'Invalid user data' });
    }
  });

  app.get('/api/users/:email', async (req, res) => {
    try {
      const user = await storage.getUserByEmail(req.params.email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // Service tiers endpoints
  app.get('/api/service-tiers', async (req, res) => {
    try {
      const serviceTiers = await storage.getServiceTiers();
      res.json(serviceTiers);
    } catch (error) {
      console.error('Error fetching service tiers:', error);
      res.status(500).json({ message: 'Failed to fetch service tiers' });
    }
  });

  app.get('/api/service-tiers/:key', async (req, res) => {
    try {
      const serviceTier = await storage.getServiceTierByKey(req.params.key);
      if (!serviceTier) {
        return res.status(404).json({ message: 'Service tier not found' });
      }
      res.json(serviceTier);
    } catch (error) {
      console.error('Error fetching service tier:', error);
      res.status(500).json({ message: 'Failed to fetch service tier' });
    }
  });

  // AI Image processing endpoints
  app.post('/api/ai/tv-placement', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const { tvSize, mountType, wallType } = req.body;
      
      if (!tvSize || !mountType || !wallType) {
        return res.status(400).json({ message: 'Missing required parameters: tvSize, mountType, wallType' });
      }

      const imageBase64 = req.file.buffer.toString('base64');
      
      const result = await generateTVPlacement({
        imageBase64,
        tvSize: parseInt(tvSize),
        mountType,
        wallType,
      });

      res.json(result);
    } catch (error) {
      console.error('Error processing TV placement:', error);
      res.status(500).json({ message: 'Failed to process image' });
    }
  });

  app.post('/api/ai/enhance-room', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const { tvSize } = req.body;
      
      if (!tvSize) {
        return res.status(400).json({ message: 'Missing required parameter: tvSize' });
      }

      const imageBase64 = req.file.buffer.toString('base64');
      const enhancedImageUrl = await enhanceRoomImage(imageBase64, parseInt(tvSize));

      if (!enhancedImageUrl) {
        return res.status(500).json({ message: 'Failed to enhance image' });
      }

      res.json({ enhancedImageUrl });
    } catch (error) {
      console.error('Error enhancing room image:', error);
      res.status(500).json({ message: 'Failed to enhance image' });
    }
  });

  // Booking endpoints
  app.post('/api/bookings', async (req, res) => {
    try {
      const bookingData = req.body;
      
      // Get service tier for pricing
      const serviceTier = await storage.getServiceTierByKey(bookingData.serviceKey);
      if (!serviceTier) {
        return res.status(400).json({ message: 'Invalid service tier' });
      }

      // Calculate pricing
      const basePrice = Number(serviceTier.basePrice);
      const addonTotal = (bookingData.addons || []).reduce((sum: number, addon: any) => sum + addon.price, 0);
      const totalPrice = basePrice + addonTotal;
      
      // Calculate fees (15% default for app)
      const appFeePercentage = 0.15;
      const appFee = totalPrice * appFeePercentage;
      const businessFee = 0; // Business gets the rest

      const booking = await storage.createBooking({
        userId: bookingData.userId,
        businessId: 1, // Default business for now
        serviceTierId: serviceTier.id,
        tvSize: bookingData.tvSize,
        wallType: bookingData.wallType,
        mountType: bookingData.mountType,
        addons: bookingData.addons || [],
        scheduledDate: new Date(bookingData.scheduledDate),
        timeSlot: bookingData.timeSlot,
        basePrice: basePrice.toString(),
        addonTotal: addonTotal.toString(),
        totalPrice: totalPrice.toString(),
        businessFee: businessFee.toString(),
        appFee: appFee.toString(),
        originalImageUrl: bookingData.originalImageUrl,
        aiPreviewImageUrl: bookingData.aiPreviewImageUrl,
        customerNotes: bookingData.customerNotes,
        status: 'confirmed',
      });

      // Create QR code for customer access
      const accessToken = nanoid(32);
      await storage.createQrCode({
        bookingId: booking.id,
        qrCode: `TV-${booking.bookingId}`,
        accessToken,
      });

      // Return full booking details
      const fullBooking = await storage.getBooking(booking.id);
      res.json(fullBooking);
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ message: 'Failed to create booking' });
    }
  });

  app.get('/api/bookings/:bookingId', async (req, res) => {
    try {
      const booking = await storage.getBookingByBookingId(req.params.bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      res.json(booking);
    } catch (error) {
      console.error('Error fetching booking:', error);
      res.status(500).json({ message: 'Failed to fetch booking' });
    }
  });

  app.get('/api/bookings/user/:userId', async (req, res) => {
    try {
      const bookings = await storage.getBookingsByUser(parseInt(req.params.userId));
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      res.status(500).json({ message: 'Failed to fetch bookings' });
    }
  });

  app.get('/api/bookings/business/:businessId', async (req, res) => {
    try {
      const bookings = await storage.getBookingsByBusiness(parseInt(req.params.businessId));
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching business bookings:', error);
      res.status(500).json({ message: 'Failed to fetch bookings' });
    }
  });

  app.get('/api/bookings/installer/:installerId', async (req, res) => {
    try {
      const bookings = await storage.getBookingsByInstaller(parseInt(req.params.installerId));
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching installer bookings:', error);
      res.status(500).json({ message: 'Failed to fetch bookings' });
    }
  });

  app.patch('/api/bookings/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      const booking = await storage.updateBookingStatus(parseInt(req.params.id), status);
      res.json(booking);
    } catch (error) {
      console.error('Error updating booking status:', error);
      res.status(500).json({ message: 'Failed to update booking' });
    }
  });

  app.patch('/api/bookings/:id/installer', async (req, res) => {
    try {
      const { installerId } = req.body;
      const booking = await storage.updateBookingInstaller(parseInt(req.params.id), installerId);
      res.json(booking);
    } catch (error) {
      console.error('Error assigning installer:', error);
      res.status(500).json({ message: 'Failed to assign installer' });
    }
  });

  // QR Code access endpoint
  app.get('/api/qr/:accessToken', async (req, res) => {
    try {
      const qrCode = await storage.getQrCodeByToken(req.params.accessToken);
      if (!qrCode) {
        return res.status(404).json({ message: 'Invalid access token' });
      }

      const booking = await storage.getBooking(qrCode.bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      res.json(booking);
    } catch (error) {
      console.error('Error accessing booking via QR:', error);
      res.status(500).json({ message: 'Failed to access booking' });
    }
  });

  // Business management endpoints
  app.get('/api/businesses', async (req, res) => {
    try {
      const businesses = await storage.getBusinesses();
      res.json(businesses);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      res.status(500).json({ message: 'Failed to fetch businesses' });
    }
  });

  app.get('/api/businesses/:id/stats', async (req, res) => {
    try {
      const stats = await storage.getBusinessStats(parseInt(req.params.id));
      res.json(stats);
    } catch (error) {
      console.error('Error fetching business stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  app.patch('/api/businesses/:id/fees', async (req, res) => {
    try {
      const { feePercentages } = req.body;
      const business = await storage.updateBusinessFees(parseInt(req.params.id), feePercentages);
      res.json(business);
    } catch (error) {
      console.error('Error updating business fees:', error);
      res.status(500).json({ message: 'Failed to update fees' });
    }
  });

  // Installer endpoints
  app.get('/api/installers/business/:businessId', async (req, res) => {
    try {
      const installers = await storage.getInstallersByBusiness(parseInt(req.params.businessId));
      res.json(installers);
    } catch (error) {
      console.error('Error fetching installers:', error);
      res.status(500).json({ message: 'Failed to fetch installers' });
    }
  });

  app.get('/api/installers/:id/stats', async (req, res) => {
    try {
      const stats = await storage.getInstallerStats(parseInt(req.params.id));
      res.json(stats);
    } catch (error) {
      console.error('Error fetching installer stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Initialize default service tiers
async function initializeServiceTiers() {
  const serviceTiers = await storage.getServiceTiers();
  if (serviceTiers.length === 0) {
    const defaultTiers = [
      {
        key: 'table-top-small',
        name: 'Table Top TV Installation (Up to 43")',
        description: 'Basic table top installation for smaller TVs',
        basePrice: '89.00',
        minTvSize: 32,
        maxTvSize: 43,
        isActive: true,
      },
      {
        key: 'table-top-large',
        name: 'Table Top TV Installation (43" and above)',
        description: 'Table top installation for larger TVs',
        basePrice: '109.00',
        minTvSize: 43,
        maxTvSize: null,
        isActive: true,
      },
      {
        key: 'bronze',
        name: 'Bronze TV Mounting (up to 42")',
        description: 'Fixed wall mounting for medium TVs',
        basePrice: '109.00',
        minTvSize: 32,
        maxTvSize: 42,
        isActive: true,
      },
      {
        key: 'silver',
        name: 'Silver TV Mounting (43-85")',
        description: 'Tilting mount with cable management',
        basePrice: '159.00',
        minTvSize: 43,
        maxTvSize: 85,
        isActive: true,
      },
      {
        key: 'silver-large',
        name: 'Silver TV Mounting (85"+)',
        description: 'Tilting mount for large TVs',
        basePrice: '259.00',
        minTvSize: 85,
        maxTvSize: null,
        isActive: true,
      },
      {
        key: 'gold',
        name: 'Gold TV Mounting',
        description: 'Full motion mount with premium features',
        basePrice: '259.00',
        minTvSize: 32,
        maxTvSize: 85,
        isActive: true,
      },
      {
        key: 'gold-large',
        name: 'Gold TV Mounting (85"+)',
        description: 'Full motion mount for large TVs',
        basePrice: '359.00',
        minTvSize: 85,
        maxTvSize: null,
        isActive: true,
      },
    ];

    for (const tier of defaultTiers) {
      await storage.createServiceTier(tier);
    }
  }
}

// Initialize default business
async function initializeDefaultBusiness() {
  const businesses = await storage.getBusinesses();
  if (businesses.length === 0) {
    await storage.createBusiness({
      name: 'SmartTVMount Default',
      email: 'admin@smarttvmount.com',
      phone: '+353 1 234 5678',
      address: 'Dublin, Ireland',
      feePercentages: {
        'table-top-small': 15,
        'table-top-large': 15,
        'bronze': 15,
        'silver': 15,
        'silver-large': 15,
        'gold': 15,
        'gold-large': 15,
      },
      isActive: true,
    });
  }
}
