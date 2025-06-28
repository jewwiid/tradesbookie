import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    try {
      const issuerUrl = process.env.ISSUER_URL ?? "https://replit.com/oidc";
      const clientId = process.env.REPL_ID!;
      console.log("OIDC Discovery - Issuer:", issuerUrl, "Client ID:", clientId);
      
      const config = await client.discovery(
        new URL(issuerUrl),
        clientId
      );
      
      console.log("OIDC discovery successful");
      return config;
    } catch (error) {
      console.error("OIDC discovery failed:", error);
      throw error;
    }
  },
  { maxAge: 3600 * 1000 }
);

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
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  const existingUser = await storage.getUser(claims["sub"]);
  
  const userData = {
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  };

  if (!existingUser) {
    // New user - temporarily disable email verification during OAuth to prevent callback failures
    const newUserData = {
      ...userData,
      emailVerified: true, // Set to true for OAuth users temporarily
      emailVerificationToken: null,
      emailVerificationExpires: null,
    };
    
    console.log("Creating new user via OAuth:", newUserData.email);
    await storage.upsertUser(newUserData);
    
    // TODO: Re-enable email verification after fixing OAuth callback
    // Try to send verification email in background (don't await to prevent blocking)
    try {
      const { generateVerificationToken, sendVerificationEmail } = await import('./emailVerificationService');
      const verificationToken = await generateVerificationToken();
      sendVerificationEmail(
        claims["email"], 
        claims["first_name"] || 'User', 
        verificationToken
      ).catch(err => console.log("Background email verification failed:", err));
    } catch (err) {
      console.log("Could not send verification email:", err);
    }
  } else {
    // Existing user - just update their info
    console.log("Updating existing user via OAuth:", userData.email);
    await storage.upsertUser(userData);
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  let config;
  try {
    config = await getOidcConfig();
    console.log("OIDC config loaded successfully");
  } catch (error) {
    console.error("Failed to get OIDC config:", error);
    console.error("REPL_ID:", process.env.REPL_ID);
    console.error("ISSUER_URL:", process.env.ISSUER_URL || "https://replit.com/oidc");
    throw error; // Don't continue with broken auth
  }

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      console.log("Starting OAuth verification process");
      const user = {};
      updateUserSession(user, tokens);
      console.log("User session updated");
      
      const claims = tokens.claims();
      console.log("User claims:", { sub: claims?.sub, email: claims?.email });
      
      await upsertUser(claims);
      console.log("User upserted successfully");
      
      verified(null, user);
    } catch (error) {
      console.error("OAuth verification failed:", error);
      verified(error);
    }
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
    console.log(`Registered OAuth strategy for domain: ${domain} with callback: https://${domain}/api/callback`);
  }
  
  // Also register with localhost for development
  const localhostStrategy = new Strategy(
    {
      name: `replitauth:localhost`,
      config,
      scope: "openid email profile offline_access",
      callbackURL: `http://localhost:5000/api/callback`,
    },
    verify,
  );
  passport.use(localhostStrategy);

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    console.log("Login request from hostname:", req.hostname);
    
    // Temporary guest mode bypass for OAuth issues
    if (req.query.guest === 'true') {
      console.log("Guest login mode activated");
      const guestUser = {
        id: 'guest-' + Date.now(),
        email: 'guest@tradesbook.ie',
        firstName: 'Guest',
        lastName: 'User',
        profileImageUrl: null,
        emailVerified: true
      };
      
      req.login(guestUser, (err) => {
        if (err) {
          console.error("Guest login error:", err);
          return res.redirect('/?error=guest_login_failed');
        }
        return res.redirect('/?guest=true');
      });
      return;
    }
    
    console.log("Request headers:", req.headers);
    const strategyName = req.hostname === 'localhost' ? 'replitauth:localhost' : `replitauth:${req.hostname}`;
    console.log("Using strategy:", strategyName);
    console.log("Available strategies:", Object.keys((passport as any)._strategies || {}));
    
    // Check if strategy exists
    if (!(passport as any)._strategies[strategyName]) {
      console.error(`Strategy ${strategyName} not found!`);
      return res.status(500).json({ error: "OAuth strategy not configured" });
    }
    
    passport.authenticate(strategyName, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    console.log("Callback request from hostname:", req.hostname);
    console.log("Callback query params:", req.query);
    console.log("Callback body:", req.body);
    
    // Check for OAuth error in query params
    if (req.query.error) {
      console.error("OAuth provider error:", req.query.error, req.query.error_description);
      return res.redirect(`/?error=oauth_error&details=${encodeURIComponent(req.query.error as string)}`);
    }
    
    const strategyName = req.hostname === 'localhost' ? 'replitauth:localhost' : `replitauth:${req.hostname}`;
    console.log("Using callback strategy:", strategyName);
    
    // Check if strategy exists
    if (!(passport as any)._strategies[strategyName]) {
      console.error(`Callback strategy ${strategyName} not found!`);
      return res.status(500).json({ error: "OAuth strategy not configured for callback" });
    }
    
    passport.authenticate(strategyName, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/?error=auth_failed",
    })(req, res, (err: any) => {
      if (err) {
        console.error("Passport authentication error:", err);
        console.error("Full error object:", JSON.stringify(err, null, 2));
        return res.status(500).json({ error: "Authentication failed", details: err.message || err.toString() });
      }
      next();
    });
  });

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }
      
      // Clear the session and redirect to home with logout parameter
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error('Session destruction error:', sessionErr);
        }
        res.clearCookie('connect.sid');
        res.redirect('/?logout=true');
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};