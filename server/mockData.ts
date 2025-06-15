import { storage } from "./storage";

export async function createMockProfiles() {
  try {
    // Create mock installer profile
    const mockInstaller = await storage.createInstaller({
      email: "installer@demo.com",
      phone: "+353851234567",
      businessName: "Dublin TV Solutions",
      contactName: "Michael O'Connor",
      address: "15 Grafton Street, Dublin 2, Ireland",
      serviceArea: "Dublin, Wicklow, Kildare",
      isActive: true
    });

    // Create mock client/user profile
    const mockUser = await storage.createUser({
      email: "client@demo.com",
      name: "Sarah Murphy",
      phone: "+353857654321"
    });

    console.log("Mock profiles created successfully:");
    console.log("Installer:", mockInstaller);
    console.log("User:", mockUser);

    return {
      installer: mockInstaller,
      user: mockUser
    };
  } catch (error) {
    console.error("Error creating mock profiles:", error);
    throw error;
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