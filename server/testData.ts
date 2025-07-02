// Create some test booking data to demonstrate real data functionality
import { storage } from "./storage";

export async function createTestInstallationData() {
  try {
    // Create test bookings across different counties (completed ones for analytics)
    const completedBookings = [
      {
        userId: null,
        tvSize: "65\"",
        serviceType: "Gold TV Mounting",
        wallType: "plasterboard",
        mountType: "fixed",
        addons: [],
        address: "123 Main Street, Dublin, Ireland",
        basePrice: "259.00",
        addonsPrice: "0.00",
        totalPrice: "259.00",
        appFee: "38.85",
        installerEarnings: "220.15",
        status: "completed",
        scheduledDate: new Date('2025-06-18'),
        qrCode: "QR-DUB-001"
      },
      {
        userId: null,
        tvSize: "55\"",
        serviceType: "Silver TV Mounting",
        wallType: "plasterboard",
        mountType: "tilt",
        addons: [],
        address: "45 Patrick Street, Cork, Ireland",
        basePrice: "159.00",
        addonsPrice: "0.00",
        totalPrice: "159.00",
        appFee: "23.85",
        installerEarnings: "135.15",
        status: "completed",
        scheduledDate: new Date('2025-06-17'),
        qrCode: "QR-CRK-001"
      },
      {
        userId: null,
        tvSize: "75\"",
        serviceType: "Gold TV Mounting",
        wallType: "plasterboard",
        mountType: "full-motion",
        addons: [],
        address: "78 Shop Street, Galway, Ireland",
        basePrice: "259.00",
        addonsPrice: "0.00",
        totalPrice: "259.00",
        appFee: "38.85",
        installerEarnings: "220.15",
        status: "in_progress",
        scheduledDate: new Date('2025-06-19'),
        qrCode: "QR-GAL-001"
      },
      {
        userId: null,
        tvSize: "43\"",
        serviceType: "Bronze TV Mounting",
        wallType: "brick",
        mountType: "fixed",
        addons: [],
        address: "12 O'Connell Street, Limerick, Ireland",
        basePrice: "109.00",
        addonsPrice: "0.00",
        totalPrice: "109.00",
        appFee: "16.35",
        installerEarnings: "92.65",
        status: "completed",
        scheduledDate: new Date('2025-06-16'),
        qrCode: "QR-LIM-001"
      },
      {
        userId: null,
        tvSize: "50\"",
        serviceType: "Silver TV Mounting",
        wallType: "plasterboard",
        mountType: "tilt",
        addons: [],
        address: "34 The Quay, Waterford, Ireland",
        basePrice: "159.00",
        addonsPrice: "0.00",
        totalPrice: "159.00",
        appFee: "23.85",
        installerEarnings: "135.15",
        status: "completed",
        scheduledDate: new Date('2025-06-15'),
        qrCode: "QR-WAT-001"
      }
    ];

    // Create available installation requests for installers to purchase
    const availableRequests = [
      {
        userId: null, // Will be converted to string in storage
        customerName: "Sarah Murphy",
        customerEmail: "sarah.murphy@email.com",
        customerPhone: "+353 87 123 4567",
        tvSize: "55\"",
        serviceType: "silver",
        wallType: "plasterboard",
        mountType: "tilt",
        addons: ["Cable Management"],
        address: "15 Grafton Street, Dublin 2, Ireland",
        estimatedPrice: "180.00",
        estimatedTotal: "180.00",
        notes: "Living room mount, needs cables hidden behind wall",
        difficulty: "moderate",
        status: "pending",
        scheduledDate: new Date('2025-07-05'),
        qrCode: "QR-REQ-001",
        installerId: null,
        referralCode: null,
        referralDiscount: null
      },
      {
        userId: null, // Harvey Norman referral booking
        customerName: "John O'Brien",
        customerEmail: "john.obrien@email.com", 
        customerPhone: "+353 85 987 6543",
        tvSize: "65\"",
        serviceType: "gold",
        wallType: "brick",
        mountType: "full-motion",
        addons: ["Soundbar Installation", "Cable Management"],
        address: "42 Henry Street, Cork, Ireland",
        estimatedPrice: "342.00", // 10% discount applied via HN referral
        estimatedTotal: "342.00",
        notes: "Harvey Norman referral - 65'' OLED TV from Carrickmines store. Customer needs full motion mount for optimal viewing angles.",
        difficulty: "expert",
        status: "pending",
        scheduledDate: new Date('2025-07-04'),
        qrCode: "QR-REQ-002",
        installerId: null,
        referralCode: "HN-CRK-2576597",
        referralDiscount: "38.00" // 10% discount from €380
      },
      {
        userId: null, // Emergency installation request
        customerName: "Michael Walsh", 
        customerEmail: "michael.walsh@email.com",
        customerPhone: "+353 86 555 7788",
        tvSize: "75\"",
        serviceType: "gold",
        wallType: "concrete", 
        mountType: "fixed",
        addons: [],
        address: "89 Eyre Square, Galway, Ireland",
        estimatedPrice: "380.00",
        estimatedTotal: "380.00", 
        notes: "URGENT: Customer needs TV mounted today for important presentation tomorrow. Willing to pay premium for same-day service.",
        difficulty: "expert",
        status: "urgent",
        scheduledDate: new Date('2025-07-02'), // Today
        qrCode: "QR-REQ-003",
        installerId: null,
        referralCode: null,
        referralDiscount: null
      }
    ];

    console.log("Creating test installation data...");
    
    // Create completed bookings for analytics
    for (const booking of completedBookings) {
      try {
        await storage.createBooking(booking);
        console.log(`Booking ${booking.qrCode} may already exist, skipping...`);
      } catch (error) {
        console.log(`Booking ${booking.qrCode} may already exist, skipping...`);
      }
    }

    // Create available installation requests 
    for (const request of availableRequests) {
      try {
        await storage.createBooking(request);
        console.log(`Created available request: ${request.qrCode} - ${request.customerName} in ${request.address}`);
      } catch (error) {
        console.log(`Request ${request.qrCode} may already exist, skipping...`);
      }
    }
    
    console.log("Test installation data creation completed");
  } catch (error) {
    console.error("Error creating test data:", error);
  }
}