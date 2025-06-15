import { storage } from "./storage";

export async function createMockProfiles() {
  try {
    // Check if installer already exists
    const existingInstaller = await storage.getInstallerByEmail("installer@demo.com");
    
    if (!existingInstaller) {
      // Create mock installer profile
      const mockInstaller = await storage.createInstaller({
        email: "installer@demo.com",
        phone: "+353851234567",
        businessName: "Dublin TV Solutions",
        contactName: "Michael O'Connor",
        address: "15 Grafton Street, Dublin 2, Ireland",
        isActive: true
      });
      console.log("Mock installer created:", mockInstaller.email);
    } else {
      console.log("Mock installer already exists");
    }

    console.log("Mock credentials available for testing authentication");
  } catch (error) {
    console.error("Error creating mock profiles:", error);
  }
}

// Mock login credentials for testing
export const mockCredentials = {
  installer: {
    email: "installer@demo.com",
    password: "installer123",
    name: "Michael O'Connor",
    role: "installer"
  },
  client: {
    email: "client@demo.com", 
    password: "client123",
    name: "Sarah Murphy",
    role: "client"
  },
  admin: {
    email: "admin@smarttvmount.ie",
    password: "admin123",
    name: "Admin User",
    role: "admin"
  }
};