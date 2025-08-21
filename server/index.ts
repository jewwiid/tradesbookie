import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./db";
import { createMockProfiles } from "./mockData";
import { createTestInstallationData } from "./testData";
import path from "path";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve static files from attached_assets directory
app.use('/attached_assets', express.static(path.resolve(import.meta.dirname, '..', 'attached_assets')));

// Content Security Policy - disabled in development, enabled in production
app.use((req, res, next) => {
  if (app.get('env') !== 'development') {
    // Set CSP headers for production only
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
      "https://js.stripe.com https://m.stripe.network " +
      "https://www.google-analytics.com https://www.googletagmanager.com " +
      "https://connect.facebook.net " +
      "'sha256-PRh/fvLCFBNVoIAGULuMBLuPh7G0pBe3UpLsY8yvX0A=' " +
      "'sha256-5DA+a07wxWmEka9IdoWjSPVHb17Cp5284/lJzfbl8KA=' " +
      "'sha256-/5Guo2nzv5n/w6ukZpOBZOtTJBJPSkJ6mhHpnBgm3Ls='; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://cdnjs.cloudflare.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https: blob: https://unpkg.com https://cdnjs.cloudflare.com; " +
      "connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org; " +
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com; " +
      "object-src 'none'; " +
      "base-uri 'self';"
    );
  }
  // In development, no CSP headers are set to allow Vite to work properly
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Initialize database tables
    await initializeDatabase();
    
    // Initialize performance refund settings
    try {
      const { performanceRefundService } = await import('./performanceRefundService');
      await performanceRefundService.initializeDefaultSettings();
    } catch (error) {
      console.error('Error initializing performance refund settings:', error);
    }
    
    // Create mock profiles for testing
    try {
      await createMockProfiles();
      await createTestInstallationData();
    } catch (error) {
      // Profiles might already exist, continue
      console.log("Mock profiles setup:", error);
    }
    
    const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
