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
      secure: process.env.NODE_ENV === 'production',
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
  intendedRole?: string
) {
  const existingUser = await storage.getUser(claims["sub"]);
  
  const userData = {
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    role: 'customer' // Default role
  };

  if (!existingUser) {
    // New user - create account with email verification system
    const { generateVerificationToken, sendVerificationEmail } = await import('./emailVerificationService');
    const verificationToken = await generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Set role based on intended signup type
    if (intendedRole === 'installer') {
      userData.role = 'installer';
      console.log("Creating new installer user via OAuth:", userData.email);
    } else if (intendedRole === 'admin') {
      userData.role = 'admin';
      console.log("Creating new admin user via OAuth:", userData.email);
    } else {
      userData.role = 'customer';
      console.log("Creating new customer user via OAuth:", userData.email);
    }
    
    const newUserData = {
      ...userData,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: expiresAt,
    };
    
    await storage.upsertUser(newUserData);
    
    // Send admin notification for new registration
    const { sendAdminNotification } = await import('./gmailService');
    await sendAdminNotification(
      `New ${intendedRole || 'customer'} registration`,
      `A new ${intendedRole || 'customer'} has registered on tradesbook.ie`,
      {
        name: `${claims["first_name"]} ${claims["last_name"]}`.trim(),
        email: claims["email"],
        role: intendedRole || 'customer',
        registrationDate: new Date().toISOString(),
        profileImageUrl: claims["profile_image_url"]
      }
    );
    
    // If this is an installer signup, create installer profile
    if (intendedRole === 'installer') {
      try {
        const installerData = {
          contactName: `${claims["first_name"]} ${claims["last_name"]}`.trim(),
          businessName: `${claims["first_name"]} ${claims["last_name"]} TV Services`.trim(),
          email: claims["email"],
          phone: '', // Will be completed during profile setup
          address: 'Ireland', // Default location
          serviceArea: 'Greater Dublin Area', // Default service area
          expertise: ['TV Mounting', 'Wall Installation'],
          bio: 'Professional TV installer registered via OAuth',
          yearsExperience: 1,
          isActive: false // Requires profile completion
        };
        
        await storage.createInstaller(installerData);
        console.log("Created installer profile for OAuth user:", claims["email"]);
      } catch (err) {
        console.error("Failed to create installer profile:", err);
      }
    }
    
    // Send verification email for new OAuth users
    try {
      await sendVerificationEmail(
        claims["email"], 
        claims["first_name"] || 'User', 
        verificationToken
      );
      console.log("Verification email sent to new OAuth user:", claims["email"]);
    } catch (err) {
      console.error("Failed to send verification email to new OAuth user:", err);
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
    verified: passport.AuthenticateCallback,
    req?: any
  ) => {
    try {
      console.log("Starting OAuth verification process");
      
      const claims = tokens.claims();
      console.log("User claims:", { sub: claims?.sub, email: claims?.email });
      
      // Get intended role from session
      const intendedRole = req?.session?.intendedRole || 'customer';
      console.log("Intended role for user:", intendedRole);
      
      await upsertUser(claims, intendedRole);
      console.log("User upserted successfully");
      
      // Get the actual user from database after upsert
      const dbUser = await storage.getUserByEmail(claims.email);
      if (!dbUser) {
        throw new Error("Failed to retrieve user after upsert");
      }
      
      // Create user object with session tokens
      const user = {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role,
        profileImageUrl: dbUser.profileImageUrl
      };
      
      updateUserSession(user, tokens);
      console.log("User session updated with database user:", { email: user.email, role: user.role });
      
      verified(null, user);
    } catch (error) {
      console.error("OAuth verification failed:", error);
      verified(error);
    }
  };

  // Register strategies for all configured domains
  const domains = process.env.REPLIT_DOMAINS!.split(",");
  
  for (const domain of domains) {
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
  
  // Register strategy for production tradesbook.ie domain
  const productionStrategy = new Strategy(
    {
      name: `replitauth:tradesbook.ie`,
      config,
      scope: "openid email profile offline_access",
      callbackURL: `https://tradesbook.ie/api/callback`,
    },
    verify,
  );
  passport.use(productionStrategy);
  console.log(`Registered OAuth strategy for production domain: tradesbook.ie with callback: https://tradesbook.ie/api/callback`);
  
  // Register strategy for localhost development
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
  console.log(`Registered OAuth strategy for localhost with callback: http://localhost:5000/api/callback`);

  passport.serializeUser((user: any, cb) => {
    console.log("Serializing user:", { id: user.id, email: user.email, role: user.role });
    // Store only the user ID in the session
    cb(null, user.id);
  });
  
  passport.deserializeUser(async (userId: string, cb) => {
    try {
      console.log("Deserializing user ID:", userId);
      const user = await storage.getUserById(userId);
      console.log("Deserialized user:", user ? { id: user.id, email: user.email, role: user.role } : null);
      cb(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      cb(error, null);
    }
  });

  app.get("/api/login", (req, res, next) => {
    console.log("Login request from hostname:", req.hostname);
    console.log("Request headers host:", req.headers.host);
    console.log("Login query params:", req.query);
    
    // Store intended role in session for post-OAuth processing
    if (req.query.role === 'installer') {
      (req.session as any).intendedRole = 'installer';
      console.log("User intends to sign up/login as installer");
    } else if (req.query.role === 'admin') {
      (req.session as any).intendedRole = 'admin';
      console.log("User intends to sign up/login as admin");
    } else {
      (req.session as any).intendedRole = 'customer';
      console.log("User intends to sign up/login as customer (default)");
    }
    
    // Store return URL if provided
    if (req.query.returnTo) {
      (req.session as any).returnTo = req.query.returnTo as string;
    }
    
    // Determine strategy based on hostname/domain
    let strategyName;
    const hostname = req.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      strategyName = 'replitauth:localhost';
    } else if (hostname.includes('replit.dev') || hostname.includes('spock.replit.dev')) {
      strategyName = `replitauth:${hostname}`;
    } else if (hostname === 'tradesbook.ie' || hostname.includes('tradesbook.ie')) {
      strategyName = 'replitauth:tradesbook.ie';
    } else {
      const registeredDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
      strategyName = `replitauth:${registeredDomain}`;
    }
    
    console.log("Using strategy:", strategyName);
    
    // Check if strategy exists
    if (!(passport as any)._strategies[strategyName]) {
      console.error(`Strategy ${strategyName} not found!`);
      console.error("Available strategies:", Object.keys((passport as any)._strategies || {}));
      return res.status(500).json({ error: "OAuth strategy not configured for this domain" });
    }
    
    console.log("Strategy found, initiating OAuth flow...");
    
    // Don't wrap in try-catch as passport.authenticate handles its own errors
    passport.authenticate(strategyName, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    console.log("Callback request from hostname:", req.hostname);
    console.log("Callback query params:", req.query);
    
    // Check for OAuth error in query params
    if (req.query.error) {
      console.error("OAuth provider error:", req.query.error, req.query.error_description);
      return res.redirect(`/?error=oauth_error&details=${encodeURIComponent(req.query.error as string)}`);
    }
    
    // Determine strategy based on hostname/domain (same logic as login)
    let strategyName;
    const hostname = req.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      strategyName = 'replitauth:localhost';
    } else if (hostname.includes('replit.dev') || hostname.includes('spock.replit.dev')) {
      strategyName = `replitauth:${hostname}`;
    } else if (hostname === 'tradesbook.ie' || hostname.includes('tradesbook.ie')) {
      strategyName = 'replitauth:tradesbook.ie';
    } else {
      const registeredDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
      strategyName = `replitauth:${registeredDomain}`;
    }
    
    console.log("Using callback strategy:", strategyName);
    
    // Check if strategy exists
    if (!(passport as any)._strategies[strategyName]) {
      console.error(`Callback strategy ${strategyName} not found!`);
      console.error("Available strategies:", Object.keys((passport as any)._strategies || {}));
      return res.redirect("/?error=strategy_not_found");
    }
    
    passport.authenticate(strategyName, (err: any, user: any, info: any) => {
      if (err) {
        console.error("Passport authentication error:", err);
        return res.redirect("/?error=auth_callback_failed");
      }
      
      if (!user) {
        console.error("No user returned from authentication:", info);
        return res.redirect("/?error=auth_no_user");
      }
      
      console.log("Authentication successful, user:", { id: user.id, email: user.email, role: user.role });
      
      // Log in the user to establish session
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("Session login error:", loginErr);
          return res.redirect("/?error=session_failed");
        }
        
        console.log("User logged in successfully, session established");
        console.log("Session user:", req.user);
        console.log("Session ID:", req.sessionID);
        
        // Handle role-based redirect after successful authentication
        const intendedRole = (req.session as any)?.intendedRole;
        const returnTo = (req.session as any)?.returnTo;
        
        console.log("Post-auth redirect - Role:", intendedRole, "ReturnTo:", returnTo);
        
        // Clear session data
        delete (req.session as any).intendedRole;
        delete (req.session as any).returnTo;
        
        // Save session before redirect
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
          }
          
          // Redirect based on role
          if (intendedRole === 'installer') {
            return res.redirect('/installer-dashboard');
          } else if (intendedRole === 'admin') {
            return res.redirect('/admin-dashboard');
          } else if (returnTo) {
            return res.redirect(returnTo);
          } else {
            return res.redirect('/');
          }
        });
      });
    })(req, res, next);
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