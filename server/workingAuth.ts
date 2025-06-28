import { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { pool } from "./db";

const PgSession = ConnectPgSimple(session);

// Extend session interface to include custom properties
declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      name: string;
      role: string;
      replitId: string;
    } | null;
    intendedRole?: string;
  }
}

export function getSession() {
  return session({
    store: new PgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Allow HTTP for development
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  });
}

export async function setupAuth(app: Express) {
  // Setup session middleware first
  app.use(getSession());
  
  // Force API route middleware to prevent static file serving interference
  app.use('/api/*', (req: Request, res: Response, next: NextFunction) => {
    console.log(`API route intercepted: ${req.method} ${req.originalUrl}`);
    next();
  });

  // OAuth configuration
  const clientId = process.env.REPL_ID || 'tradesbook-ie';
  const issuerUrl = 'https://replit.com';

  // Debug endpoint to check OAuth configuration
  app.get("/api/auth-debug", (req: Request, res: Response) => {
    res.json({
      clientId: clientId,
      hostname: req.get('host'),
      repl_id: process.env.REPL_ID,
      environment: process.env.NODE_ENV
    });
  });

  // OAuth login endpoint with direct OAuth URL construction
  app.get("/api/login", (req: Request, res: Response) => {
    // Immediately handle OAuth without any middleware chain delays
    const role = req.query.role as string || 'customer';
    console.log(`Direct OAuth login for role: ${role}`);

    const hostname = req.get('host') || req.hostname;
    let redirectUri: string;
    
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      redirectUri = `http://localhost:5000/api/callback`;
    } else {
      redirectUri = `https://${hostname}/api/callback`;
    }

    console.log(`OAuth redirect URI: ${redirectUri}`);

    const authParams = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'openid email profile',
      state: role,
    });

    const authorizationURL = `${issuerUrl}/auth?${authParams.toString()}`;
    console.log(`Redirecting to: ${authorizationURL}`);
    
    // Use Express redirect method
    res.redirect(302, authorizationURL);
  });

  // Also handle POST for form submissions
  app.post("/api/login", (req: Request, res: Response) => {
    res.redirect(`/api/login?role=${req.body.role || 'customer'}`);
  });

  // OAuth callback endpoint
  app.get("/api/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      const role = state as string || 'customer';
      
      console.log(`OAuth callback: code=${!!code}, role=${role}`);

      if (!code) {
        console.error("No authorization code received");
        return res.redirect("/?error=oauth_failed");
      }

      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code as string, req);
      if (!tokens) {
        console.error("Failed to exchange code for tokens");
        return res.redirect("/?error=token_exchange_failed");
      }

      // Get user info from tokens
      const userInfo = await getUserInfoFromTokens(tokens);
      if (!userInfo) {
        console.error("Failed to get user info from tokens");
        return res.redirect("/?error=user_info_failed");
      }

      console.log(`User authenticated: ${userInfo.email}`);

      // Create or update user in database
      let user = await db.select().from(users).where(eq(users.email, userInfo.email)).limit(1);
      
      if (user.length === 0) {
        // Create new user
        const userId = `replit_${userInfo.id}_${Date.now()}`;
        const newUser = await db.insert(users).values({
          id: userId,
          email: userInfo.email,
          name: userInfo.name || userInfo.email,
          role: role,
          emailVerified: true,
        }).returning();
        user = newUser;
      }

      // Store user in session
      req.session.user = {
        id: user[0].id,
        email: user[0].email || '',
        name: user[0].name || user[0].email || '',
        role: user[0].role || 'customer',
        replitId: userInfo.id,
      };

      // Save session and redirect
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
        }

        // Redirect based on role
        const userRole = user[0].role;
        if (userRole === 'admin') {
          res.redirect("/admin");
        } else if (userRole === 'installer') {
          res.redirect("/installer");
        } else {
          res.redirect("/");
        }
      });

    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect("/?error=oauth_callback_failed");
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  // Get current user endpoint with automatic guest fallback for production
  app.get("/api/user", (req: Request, res: Response) => {
    if (req.session.user) {
      res.json(req.session.user);
    } else {
      // Create automatic guest session for seamless user experience
      const guestUser = {
        id: 'guest',
        email: 'guest@tradesbook.ie',
        name: 'Guest User',
        role: 'customer',
        isGuest: true
      };
      
      // Store guest user in session
      req.session.user = {
        id: 'guest',
        email: 'guest@tradesbook.ie',
        name: 'Guest User',
        role: 'customer',
        replitId: 'guest',
      };
      
      res.json(guestUser);
    }
  });

  // Guest login endpoint as OAuth fallback
  app.post("/api/guest-login", (req: Request, res: Response) => {
    const { role } = req.body;
    
    req.session.user = {
      id: 'guest',
      email: 'guest@tradesbook.ie',
      name: 'Guest User',
      role: role || 'customer',
      replitId: 'guest',
    };

    req.session.save((err) => {
      if (err) {
        console.error("Guest session save error:", err);
        return res.status(500).json({ error: "Failed to create guest session" });
      }
      
      res.json({ 
        success: true, 
        user: req.session.user,
        message: "Guest session created successfully"
      });
    });
  });
}

async function exchangeCodeForTokens(code: string, req: Request) {
  try {
    const hostname = req.get('host') || req.hostname;
    let redirectUri: string;
    
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      redirectUri = `http://localhost:5000/api/callback`;
    } else {
      redirectUri = `https://${hostname}/api/callback`;
    }

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: process.env.REPL_ID || 'tradesbook-ie',
    });

    const response = await fetch('https://replit.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!response.ok) {
      console.error(`Token exchange failed: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Token exchange error:", error);
    return null;
  }
}

async function getUserInfoFromTokens(tokens: any) {
  try {
    const response = await fetch('https://replit.com/auth/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!response.ok) {
      console.error(`User info fetch failed: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("User info fetch error:", error);
    return null;
  }
}

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: "Authentication required" });
  }
};