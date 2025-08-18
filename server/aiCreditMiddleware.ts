import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Dynamic AI tools cache
let aiToolsCache: Map<string, { creditCost: number; isActive: boolean }> = new Map();
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to load AI tools from database
async function loadAiTools(): Promise<Map<string, { creditCost: number; isActive: boolean }>> {
  const now = Date.now();
  
  // Return cache if still valid
  if (now - lastCacheUpdate < CACHE_DURATION && aiToolsCache.size > 0) {
    return aiToolsCache;
  }
  
  try {
    const tools = await storage.getActiveAiTools();
    const toolsMap = new Map();
    
    tools.forEach((tool: any) => {
      toolsMap.set(tool.key, {
        creditCost: tool.creditCost || 1,
        isActive: tool.isActive
      });
    });
    
    aiToolsCache = toolsMap;
    lastCacheUpdate = now;
    
    return toolsMap;
  } catch (error) {
    console.error('Error loading AI tools from database:', error);
    // Return empty map if database query fails
    return new Map();
  }
}

/**
 * Clear the AI tools cache - call this when tools are updated in admin
 */
export function clearAiToolsCache(): void {
  aiToolsCache.clear();
  lastCacheUpdate = 0;
}

/**
 * Get all available AI tools (with caching)
 */
export async function getAvailableAiTools(): Promise<Array<{ key: string; creditCost: number; isActive: boolean }>> {
  const toolsMap = await loadAiTools();
  return Array.from(toolsMap.entries()).map(([key, config]) => ({
    key,
    creditCost: config.creditCost,
    isActive: config.isActive
  }));
}

// Legacy constants for backward compatibility
export const AI_FEATURES = {
  TV_PREVIEW: 'tv-preview',
  PRODUCT_CARE: 'product-care',
  FAQ: 'faq',
  PRODUCT_INFO: 'product-info',
  EMAIL_TEMPLATE: 'email-template',
  TV_COMPARISON: 'tv-comparison'
} as const;

// Free usage limits per feature - resets every 24 hours for authenticated users
const FREE_USAGE_LIMIT = 3;

// IP-based rate limiting to prevent abuse (requests per minute per IP)
const IP_RATE_LIMIT = 10;
const ipRequestCounts: Map<string, { count: number; resetTime: number }> = new Map();

// Clean up old IP tracking data every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequestCounts.entries()) {
    if (now > data.resetTime) {
      ipRequestCounts.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export interface AIRequest extends Request {
  aiUsage?: {
    isAuthenticated: boolean;
    userId: string | null;
    sessionId: string;
    aiFeature: string;
    canUseFree: boolean;
    usageCount: number;
    creditCost: number;
    qrCodeId?: string;
    storeLocation?: string;
  };
}

/**
 * Middleware to check AI credit usage and enforce limits
 */
export function checkAiCredits(aiFeature: string) {
  return async (req: AIRequest, res: Response, next: NextFunction) => {
    try {
      const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
      const userId = isAuthenticated ? (req as any).user?.id : null;
      const sessionId = req.sessionID || req.headers['x-session-id'] as string || 'anonymous';
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      
      // IP-based rate limiting to prevent abuse
      const now = Date.now();
      const oneMinute = 60 * 1000;
      const ipData = ipRequestCounts.get(clientIP) || { count: 0, resetTime: now + oneMinute };
      
      if (now > ipData.resetTime) {
        // Reset counter for this IP
        ipData.count = 1;
        ipData.resetTime = now + oneMinute;
      } else {
        ipData.count++;
      }
      
      ipRequestCounts.set(clientIP, ipData);
      
      // Block if too many requests from this IP
      if (ipData.count > IP_RATE_LIMIT) {
        console.warn('🚨 RATE LIMIT: Blocked IP', clientIP, 'exceeded', IP_RATE_LIMIT, 'requests/minute for AI feature:', aiFeature);
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many AI requests from your IP address. Please wait before trying again.`,
          retryAfter: Math.ceil((ipData.resetTime - now) / 1000),
          rateLimitInfo: {
            limit: IP_RATE_LIMIT,
            window: '1 minute',
            preventsFraud: true
          }
        });
      }
      
      // Load AI tools from database
      const aiTools = await loadAiTools();
      const toolConfig = aiTools.get(aiFeature);
      
      // Check if AI tool exists and is active
      if (!toolConfig || !toolConfig.isActive) {
        return res.status(404).json({
          error: 'AI feature not available',
          message: `The AI feature '${aiFeature}' is not currently available.`
        });
      }
      
      const creditCost = toolConfig.creditCost;

      // For authenticated users, ALWAYS check email verification first
      // This prevents mass account creation to bypass limits
      if (isAuthenticated) {
        const user = await storage.getUser(userId);
        if (!user?.emailVerified) {
          // Log potential fraud attempt
          console.warn('🚨 Blocked unverified user AI attempt:', userId, 'IP:', req.ip || 'unknown', 'Feature:', aiFeature);
          
          return res.status(403).json({
            error: 'Email verification required',
            message: 'Please verify your email address to use AI features. Unverified accounts cannot access AI tools to prevent abuse.',
            requiresEmailVerification: true,
            preventsFraud: true,
            verificationHelp: 'Check your email for a verification link or request a new one from your account settings.'
          });
        }
      }

      // Check free usage limit
      const freeUsageCheck = await storage.checkAiFreeUsageLimit(userId, sessionId, aiFeature, FREE_USAGE_LIMIT);
      
      let canProceed = false;
      let requiresPayment = false;

      if (freeUsageCheck.canUseFree) {
        // Can use free quota (email already verified for authenticated users above)
        canProceed = true;
      } else {
        // Free quota exhausted, check if user is authenticated and has credits
        if (!isAuthenticated) {
          requiresPayment = true;
        } else {
          // User already verified above, check wallet balance
          
          // Check wallet balance
          const wallet = await storage.getCustomerWallet(userId);
          const balance = parseFloat(wallet?.balance || '0');
          
          if (balance >= creditCost) {
            canProceed = true;
          } else {
            requiresPayment = true;
          }
        }
      }

      if (!canProceed) {
        if (!isAuthenticated) {
          return res.status(401).json({
            error: 'Free usage limit exceeded',
            message: `You've used your ${FREE_USAGE_LIMIT} free ${aiFeature.replace('-', ' ')} requests for this session. Please sign in with a verified email to get ${FREE_USAGE_LIMIT} free requests daily that reset every 24 hours.`,
            freeUsageLimit: FREE_USAGE_LIMIT,
            usageCount: freeUsageCheck.usageCount,
            requiresSignIn: true,
            requiresVerifiedEmail: true,
            creditCost,
            dailyReset: false // Guest users don't get daily reset
          });
        } else {
          // User already verified above, show payment requirement
          
          return res.status(402).json({
            error: 'Insufficient credits',
            message: `You need ${creditCost} credit${creditCost > 1 ? 's' : ''} to use this AI feature. Please top up your wallet.`,
            creditCost,
            currentBalance: parseFloat((await storage.getCustomerWallet(userId))?.balance || '0'),
            requiresTopUp: true
          });
        }
      }

      // Extract QR code tracking parameters from request
      const qrCodeId = req.body?.qrCodeId || req.query?.qrCodeId as string;
      const storeLocation = req.body?.storeLocation || req.query?.storeLocation as string;

      // Add usage info to request for the endpoint to use
      req.aiUsage = {
        isAuthenticated,
        userId,
        sessionId,
        aiFeature,
        canUseFree: freeUsageCheck.canUseFree,
        usageCount: freeUsageCheck.usageCount,
        creditCost,
        qrCodeId,
        storeLocation
      };

      next();
    } catch (error) {
      console.error('Error in AI credit middleware:', error);
      res.status(500).json({ 
        error: 'Credit check failed',
        message: 'Unable to verify AI usage credits'
      });
    }
  };
}

/**
 * Function to be called after successful AI request to track usage and deduct credits
 */
export async function recordAiUsage(req: AIRequest): Promise<void> {
  if (!req.aiUsage) return;

  const { userId, sessionId, aiFeature, canUseFree, creditCost, qrCodeId, storeLocation } = req.aiUsage;
  const isPaidRequest = !canUseFree;
  
  // Verify tool is still active (in case it was disabled during request)
  const aiTools = await loadAiTools();
  const toolConfig = aiTools.get(aiFeature);
  if (!toolConfig || !toolConfig.isActive) {
    console.warn(`AI tool '${aiFeature}' is no longer active, skipping usage recording`);
    return;
  }

  // Double-check email verification for authenticated users (fraud prevention)
  if (userId) {
    const user = await storage.getUser(userId);
    if (!user?.emailVerified) {
      console.error('🚨 FRAUD ALERT: Attempted AI usage by unverified user:', userId, 'IP:', req.ip || 'unknown');
      return; // Don't record usage for unverified users
    }
  }

  try {
    // Record usage with QR code tracking
    await storage.incrementAiUsage(userId, sessionId, aiFeature, isPaidRequest, qrCodeId, storeLocation);

    // Deduct credits if it was a paid request
    if (isPaidRequest && userId) {
      const wallet = await storage.getCustomerWallet(userId);
      if (wallet) {
        const newBalance = parseFloat(wallet.balance) - creditCost;
        await storage.updateCustomerWalletBalance(userId, newBalance);
        
        // Add transaction record
        await storage.addCustomerTransaction({
          userId,
          type: 'ai_usage',
          amount: (-creditCost).toString(),
          description: `AI ${aiFeature.replace('-', ' ')} request`,
          status: 'completed'
        });
      }
    }
  } catch (error) {
    console.error('Error recording AI usage:', error);
    // Don't throw error as the AI request was already successful
  }
}

/**
 * Get user's AI usage summary for dashboard
 */
export async function getAiUsageSummary(userId: string) {
  try {
    const usages = await storage.getUserAiUsageSummary(userId);
    const wallet = await storage.getCustomerWallet(userId);
    
    return {
      totalCredits: parseFloat(wallet?.balance || '0'),
      usageByFeature: usages,
      freeUsageLimit: FREE_USAGE_LIMIT
    };
  } catch (error) {
    console.error('Error getting AI usage summary:', error);
    return {
      totalCredits: 0,
      usageByFeature: [],
      freeUsageLimit: FREE_USAGE_LIMIT
    };
  }
}