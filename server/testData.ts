// Create some test booking data to demonstrate real data functionality
import { storage } from "./storage";

export async function createTestInstallationData() {
  try {
    // Only create test data if ENABLE_DEMO_DATA environment variable is set to 'true'
    if (process.env.ENABLE_DEMO_DATA !== 'true') {
      console.log("Test data creation skipped (ENABLE_DEMO_DATA not set to 'true')");
      return;
    }
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
        estimatedPrice: "155.00",
        estimatedTotal: "155.00",
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
        estimatedPrice: "312.00",
        estimatedTotal: "312.00",
        notes: "Harvey Norman referral - 65'' QLED TV from Carrickmines store. Customer needs full motion mount for optimal viewing angles.",
        difficulty: "moderate",
        status: "pending",
        scheduledDate: new Date('2025-07-04'),
        qrCode: "QR-REQ-002",
        installerId: null,
        referralCode: "HN-CRK-2576597",
        referralDiscount: "30.00"
      },
      {
        userId: null, // Emergency installation request
        customerName: "Michael Walsh", 
        customerEmail: "michael.walsh@email.com",
        customerPhone: "+353 86 555 7788",
        tvSize: "75\"",
        serviceType: "gold-large",
        wallType: "concrete", 
        mountType: "fixed",
        addons: [],
        address: "89 Eyre Square, Galway, Ireland",
        estimatedPrice: "350.00",
        estimatedTotal: "350.00", 
        notes: "URGENT: Customer needs TV mounted today for important presentation tomorrow. Willing to pay premium for same-day service.",
        difficulty: "moderate",
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

    // Create past leads for demo installer (ID: 2)
    const pastLeads = [
      {
        userId: "demo-customer-1",
        customerName: "Sarah O'Brien",
        customerEmail: "sarah.obrien@email.ie",
        customerPhone: "+353 86 123 4567",
        tvSize: "55 inch",
        serviceType: "silver-premium",
        wallType: "Drywall",
        mountType: "Tilting Wall Mount",
        addons: [{ name: "Cable Management", key: "cable-management", price: 25 }],
        address: "15 Grafton Street, Dublin 2, Ireland",
        estimatedPrice: "155.00",
        estimatedTotal: "155.00",
        notes: "Customer prefers evening installation after 6pm",
        difficulty: "easy",
        status: "completed",
        scheduledDate: new Date('2025-06-28'),
        completedDate: new Date('2025-06-28'),
        qrCode: "QR-PAST-001",
        installerId: 2,
        referralCode: null,
        referralDiscount: null,
        createdAt: new Date('2025-06-25').toISOString()
      },
      {
        userId: "demo-customer-2", 
        customerName: "Michael Walsh",
        customerEmail: "m.walsh@gmail.com",
        customerPhone: "+353 87 987 6543",
        tvSize: "65 inch",
        serviceType: "gold-premium-large",
        wallType: "Brick",
        mountType: "Full Motion Wall Mount",
        addons: [
          { name: "Cable Management", key: "cable-management", price: 25 },
          { name: "Soundbar Installation", key: "soundbar-installation", price: 45 }
        ],
        address: "42 Patrick Street, Cork, Ireland",
        estimatedPrice: "380.00",
        estimatedTotal: "380.00",
        notes: "Large TV, customer has all equipment ready",
        difficulty: "moderate",
        status: "in-progress",
        scheduledDate: new Date('2025-07-02'),
        qrCode: "QR-PAST-002",
        installerId: 2,
        referralCode: null,
        referralDiscount: null,
        createdAt: new Date('2025-06-30').toISOString()
      },
      {
        userId: "demo-customer-3",
        customerName: "Emma Kelly",
        customerEmail: "emma.kelly@outlook.com", 
        customerPhone: "+353 85 555 1234",
        tvSize: "43 inch",
        serviceType: "bronze-wall-mount",
        wallType: "Drywall",
        mountType: "Fixed Wall Mount",
        addons: [],
        address: "78 O'Connell Street, Limerick, Ireland",
        estimatedPrice: "120.00",
        estimatedTotal: "120.00",
        notes: "First floor apartment, easy access",
        difficulty: "easy",
        status: "scheduled",
        scheduledDate: new Date('2025-07-03'),
        qrCode: "QR-PAST-003",
        installerId: 2,
        referralCode: null,
        referralDiscount: null,
        createdAt: new Date('2025-07-01').toISOString()
      }
    ];

    // Create past leads for demo installer
    for (const lead of pastLeads) {
      try {
        await storage.createBooking(lead);
        console.log(`Created past lead: ${lead.qrCode} - ${lead.customerName} (${lead.status})`);
      } catch (error) {
        console.log(`Past lead ${lead.qrCode} may already exist, skipping...`);
      }
    }

    // Create sample reviews for demo installer (ID: 2)
    const sampleReviews = [
      {
        userId: "demo-customer-1",
        installerId: 2,
        bookingId: 1,
        customerName: "Sarah O'Brien",
        rating: 5,
        title: "Excellent Professional Service",
        comment: "Amazing work! The installer was punctual, professional, and did a perfect job mounting my 55\" TV. Cable management was neat and tidy. Highly recommend!",
        isVerified: true,
        serviceType: "silver-premium",
        tvSize: "55 inch",
        completedDate: new Date('2025-06-28').toISOString(),
        createdAt: new Date('2025-06-29').toISOString()
      },
      {
        userId: "demo-customer-4",
        installerId: 2,
        bookingId: 2,
        customerName: "David Murphy",
        rating: 4,
        title: "Great Job, Quick Service",
        comment: "Very satisfied with the installation. The technician was knowledgeable and completed the work efficiently. Only minor issue was running slightly late, but he called ahead to let me know.",
        isVerified: true,
        serviceType: "bronze-wall-mount",
        tvSize: "43 inch",
        completedDate: new Date('2025-06-25').toISOString(),
        createdAt: new Date('2025-06-26').toISOString()
      },
      {
        userId: "demo-customer-5",
        installerId: 2,
        bookingId: 3,
        customerName: "Lisa Collins",
        rating: 5,
        title: "Perfect Installation",
        comment: "Couldn't be happier with the service. The installer explained everything clearly, worked cleanly, and the final result looks fantastic. Will definitely use again!",
        isVerified: true,
        serviceType: "gold-premium-large",
        tvSize: "65 inch",
        completedDate: new Date('2025-06-20').toISOString(),
        createdAt: new Date('2025-06-21').toISOString()
      }
    ];

    // Create sample reviews
    for (const review of sampleReviews) {
      try {
        await storage.createReview(review);
        console.log(`Created review: ${review.customerName} - ${review.rating}/5 stars`);
      } catch (error) {
        console.log(`Review from ${review.customerName} may already exist, skipping...`);
      }
    }
    
    console.log("Test installation data creation completed");
  } catch (error) {
    console.error("Error creating test data:", error);
  }
}