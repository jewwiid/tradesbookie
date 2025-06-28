import { Request, Response, NextFunction, Express } from 'express';

/**
 * API Route Handler Middleware
 * 
 * This middleware ensures API routes are handled before static file serving
 * to prevent production static file catch-all from intercepting OAuth endpoints
 */
export function setupApiRouteHandler(app: Express) {
  // Create a comprehensive API route interceptor
  app.use((req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl;
    
    // Check if this is an API route
    if (url.startsWith('/api/')) {
      console.log(`API route intercepted: ${req.method} ${url}`);
      
      // For critical OAuth endpoints, handle them immediately
      if (url.startsWith('/api/login') || url.startsWith('/api/callback') || url.startsWith('/api/logout')) {
        console.log(`OAuth endpoint detected: ${url}`);
        // Set headers to prevent caching
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
      }
    }
    
    next();
  });
}