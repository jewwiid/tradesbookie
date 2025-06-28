import { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { pool } from "./db";

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

const PgSession = ConnectPgSimple(session);

export function getSession() {
  return session({
    store: new PgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  });
}

export async function setupAuth(app: Express) {
  // Setup session middleware
  app.use(getSession());

  // Initialize user session property
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
      req.session.user = null;
    }
    next();
  });

  // OAuth configuration
  const clientId = process.env.REPL_ID || 'unknown';
  const issuerUrl = 'https://replit.com';

  // OAuth login endpoint - redirects to Replit OAuth
  const handleLogin = (req: Request, res: Response) => {
    try {
      const role = req.query.role as string || 'customer';
      console.log("OAuth login request for role:", role);

      // Store intended role in session
      req.session.intendedRole = role;

      // Determine correct redirect URI based on hostname
      const hostname = req.get('host') || req.hostname;
      let redirectUri: string;
      
      if (hostname === 'localhost:5000' || hostname === '127.0.0.1:5000') {
        redirectUri = `http://localhost:5000/api/callback`;
      } else if (hostname === 'tradesbook.ie') {
        redirectUri = `https://tradesbook.ie/api/callback`;
      } else {
        redirectUri = `https://${hostname}/api/callback`;
      }

      console.log("Using redirect URI:", redirectUri);

      const authParams = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'openid email profile',
        state: req.sessionID,
      });

      const authorizationURL = `${issuerUrl}/auth?${authParams.toString()}`;
      console.log("Redirecting to OAuth provider:", authorizationURL);
      
      res.redirect(authorizationURL);
    } catch (error) {
      console.error("OAuth login error:", error);
      res.redirect("/?error=oauth_login_failed");
    }
  };

  // Register both GET and POST for login endpoint
  app.get("/api/login", handleLogin);
  app.post("/api/login", handleLogin);

  // OAuth callback endpoint
  app.get("/api/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      console.log("OAuth callback received:", { code: !!code, state });

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

      console.log("User authenticated:", userInfo.email);

      // Create or update user in database
      let user = await db.select().from(users).where(eq(users.email, userInfo.email)).limit(1);
      
      if (user.length === 0) {
        // Create new user - generate unique ID
        const userId = `replit_${userInfo.id}_${Date.now()}`;
        const newUser = await db.insert(users).values({
          id: userId,
          email: userInfo.email,
          name: userInfo.name || userInfo.email,
          role: req.session.intendedRole || 'customer',
          emailVerified: true, // Replit users are pre-verified
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

      // Redirect based on role
      const userRole = user[0].role;
      if (userRole === 'admin') {
        res.redirect("/admin");
      } else if (userRole === 'installer') {
        res.redirect("/installer");
      } else {
        res.redirect("/");
      }

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

  // Get current user endpoint
  app.get("/api/user", (req: Request, res: Response) => {
    if (req.session.user) {
      res.json(req.session.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });
}

async function exchangeCodeForTokens(code: string, req: Request) {
  try {
    const hostname = req.get('host') || req.hostname;
    let redirectUri: string;
    
    if (hostname === 'localhost:5000' || hostname === '127.0.0.1:5000') {
      redirectUri = `http://localhost:5000/api/callback`;
    } else if (hostname === 'tradesbook.ie') {
      redirectUri = `https://tradesbook.ie/api/callback`;
    } else {
      redirectUri = `https://${hostname}/api/callback`;
    }

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: process.env.REPL_ID || 'unknown',
    });

    const response = await fetch('https://replit.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!response.ok) {
      console.error("Token exchange failed:", response.status, response.statusText);
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
      console.error("User info fetch failed:", response.status, response.statusText);
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