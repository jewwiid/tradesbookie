// Temporary VIP toggle fix to bypass TypeScript compilation issues
import type { Express } from "express";
import { storage } from "./storage";

export function registerVipToggleFix(app: Express) {
  // Working VIP toggle endpoint
  app.patch("/api/admin/installers/:id/vip-fixed", async (req: any, res: any) => {
    try {
      console.log('🔧 VIP Toggle Fix - Request received');
      
      // Check admin authentication
      const userId = req.session?.passport?.user;
      if (!userId) {
        console.log('❌ VIP Toggle Fix - No user ID in session');
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        console.log('❌ VIP Toggle Fix - User not found in database');
        return res.status(401).json({ message: "Authentication required" });
      }

      const isAdmin = user.email === 'admin@tradesbook.ie' || 
                     user.email === 'jude.okun@gmail.com' || 
                     user.role === 'admin';
      
      if (!isAdmin) {
        console.log('❌ VIP Toggle Fix - User is not admin');
        return res.status(403).json({ message: "Admin access required" });
      }

      console.log('✅ VIP Toggle Fix - Admin check passed');

      const installerId = parseInt(req.params.id);
      const { isVip, vipNotes } = req.body;
      
      console.log(`🔧 VIP Toggle Fix - Updating installer ${installerId} VIP status to ${isVip ? 'VIP' : 'standard'}`);

      // Get installer to verify existence
      const installer = await storage.getInstaller(installerId);
      if (!installer) {
        console.log('❌ VIP Toggle Fix - Installer not found');
        return res.status(404).json({ message: "Installer not found" });
      }

      // Update VIP status with admin tracking
      const updateData: any = { 
        isVip: isVip === true,
        vipNotes: vipNotes || null
      };

      if (isVip === true) {
        // Grant VIP status
        updateData.vipGrantedBy = userId;
        updateData.vipGrantedAt = new Date();
        console.log('✅ VIP Toggle Fix - Granting VIP status');
      } else {
        // Remove VIP status
        updateData.vipGrantedBy = null;
        updateData.vipGrantedAt = null;
        console.log('✅ VIP Toggle Fix - Removing VIP status');
      }

      await storage.updateInstaller(installerId, updateData);
      console.log('✅ VIP Toggle Fix - Database update successful');

      const successMessage = `Installer ${isVip ? 'granted' : 'removed'} VIP status successfully`;
      console.log(`✅ VIP Toggle Fix - ${successMessage}`);

      res.json({ 
        message: successMessage,
        isVip: isVip === true,
        vipGrantedBy: isVip ? userId : null
      });

    } catch (error) {
      console.error("❌ VIP Toggle Fix - Error:", error);
      res.status(500).json({ message: "Failed to update installer VIP status" });
    }
  });
}