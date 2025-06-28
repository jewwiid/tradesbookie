import { Express, Request, Response, NextFunction } from "express";
import passport from "passport";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: sessionTtl,
      sameSite: 'lax'
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport serialization
  passport.serializeUser((user: any, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log("Deserializing user:", id);
      const user = await storage.getUserById(id);
      if (user) {
        console.log("User deserialized successfully:", user.email);
        done(null, user);
      } else {
        console.log("User not found during deserialization:", id);
        done(null, false);
      }
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error);
    }
  });

  // OAuth login endpoint - redirects to Replit OAuth
  app.post("/api/login", (req: Request, res: Response) => {
    const role = req.query.role as string || 'customer';
    console.log("Login request for role:", role);

    // Store intended role in session
    (req.session as any).intendedRole = role;

    // Build OAuth authorization URL
    const issuerUrl = process.env.ISSUER_URL || "https://replit.com/oidc";
    const clientId = process.env.REPL_ID;
    const hostname = req.hostname;

    if (!clientId) {
      return res.status(500).json({ error: "OAuth configuration missing" });
    }

    // Determine correct redirect URI
    let redirectUri: string;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      redirectUri = `http://localhost:5000/api/callback`;
    } else if (hostname === 'tradesbook.ie') {
      redirectUri = `https://tradesbook.ie/api/callback`;
    } else {
      redirectUri = `https://${hostname}/api/callback`;
    }

    const authParams = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'openid email profile offline_access',
      prompt: 'login consent',
      state: req.sessionID,
    });

    const authorizationURL = `${issuerUrl}/auth?${authParams.toString()}`;
    
    console.log("Redirecting to OAuth provider:", authorizationURL);
    res.redirect(authorizationURL);
  });

  // OAuth callback endpoint - handles the code exchange
  app.get("/api/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      
      console.log("OAuth callback received:", { code: !!code, state });

      if (!code) {
        console.error("No authorization code received");
        return res.redirect("/?error=oauth_failed");
      }

      // Verify state parameter matches session ID
      if (state !== req.sessionID) {
        console.error("State parameter mismatch");
        return res.redirect("/?error=oauth_failed");
      }

      // Exchange code for tokens
      const tokenResponse = await exchangeCodeForTokens(code as string, req);
      
      if (!tokenResponse.success) {
        console.error("Token exchange failed:", tokenResponse.error);
        return res.redirect("/?error=oauth_failed");
      }

      // Get user info from tokens
      const userInfo = await getUserInfoFromTokens(tokenResponse.tokens);
      
      if (!userInfo.success) {
        console.error("Failed to get user info:", userInfo.error);
        return res.redirect("/?error=oauth_failed");
      }

      // Create or update user in database
      const intendedRole = (req.session as any).intendedRole || 'customer';
      const userData = {
        id: userInfo.data.sub,
        email: userInfo.data.email,
        firstName: userInfo.data.first_name || 'User',
        lastName: userInfo.data.last_name || '',
        role: intendedRole,
        isEmailVerified: true,
      };

      console.log("Creating/updating user:", userData);
      await storage.upsertUser(userData);

      // Log user in by setting session
      req.login(userData, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.redirect("/?error=login_failed");
        }

        console.log("User logged in successfully:", userData.email);
        
        // Redirect based on role
        const redirectUrl = intendedRole === 'installer' ? '/installer-dashboard' : 
                           intendedRole === 'admin' ? '/admin' : '/';
        
        res.redirect(redirectUrl);
      });

    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect("/?error=oauth_failed");
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req: Request, res: Response) => {
    console.log("Logout request received");
    
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destroy error:", destroyErr);
        }
        
        console.log("User logged out successfully");
        res.json({ success: true });
      });
    });
  });

  // Current user endpoint
  app.get("/api/user", (req: Request, res: Response) => {
    if (req.isAuthenticated() && req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });
}

async function exchangeCodeForTokens(code: string, req: Request) {
  try {
    const issuerUrl = process.env.ISSUER_URL || "https://replit.com/oidc";
    const clientId = process.env.REPL_ID;
    const hostname = req.hostname;

    // Determine correct redirect URI (must match the one used in auth request)
    let redirectUri: string;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      redirectUri = `http://localhost:5000/api/callback`;
    } else if (hostname === 'tradesbook.ie') {
      redirectUri = `https://tradesbook.ie/api/callback`;
    } else {
      redirectUri = `https://${hostname}/api/callback`;
    }

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId!,
    });

    const tokenResponse = await fetch(`${issuerUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return { success: false, error: errorText };
    }

    const tokens = await tokenResponse.json();
    console.log("Token exchange successful");
    return { success: true, tokens };

  } catch (error) {
    console.error("Token exchange error:", error);
    return { success: false, error: error.message };
  }
}

async function getUserInfoFromTokens(tokens: any) {
  try {
    const issuerUrl = process.env.ISSUER_URL || "https://replit.com/oidc";
    
    const userInfoResponse = await fetch(`${issuerUrl}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error("UserInfo request failed:", errorText);
      return { success: false, error: errorText };
    }

    const userInfo = await userInfoResponse.json();
    console.log("User info retrieved successfully");
    return { success: true, data: userInfo };

  } catch (error) {
    console.error("UserInfo error:", error);
    return { success: false, error: error.message };
  }
}

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
};