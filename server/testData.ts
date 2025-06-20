// Create some test booking data to demonstrate real data functionality
import { storage } from "./storage";

export async function createTestInstallationData() {
  try {
    // Create test bookings across different counties
    const testBookings = [
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

    console.log("Creating test installation data...");
    
    for (const booking of testBookings) {
      try {
        await storage.createBooking(booking);
        console.log(`Created booking: ${booking.qrCode} in ${booking.address}`);
      } catch (error) {
        console.log(`Booking ${booking.qrCode} may already exist, skipping...`);
      }
    }
    
    console.log("Test installation data creation completed");
  } catch (error) {
    console.error("Error creating test data:", error);
  }
}