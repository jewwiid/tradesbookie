import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// AI Feature names for tracking
export const AI_FEATURES = {
  TV_PREVIEW: 'tv-preview',
  PRODUCT_CARE: 'product-care',
  FAQ: 'faq',
  PRODUCT_INFO: 'product-info',
  EMAIL_TEMPLATE: 'email-template',
  TV_COMPARISON: 'tv-comparison'
} as const;

// Credit costs per AI feature (in credits)
export const AI_CREDIT_COSTS = {
  [AI_FEATURES.TV_PREVIEW]: 1,
  [AI_FEATURES.PRODUCT_CARE]: 1,
  [AI_FEATURES.FAQ]: 1,
  [AI_FEATURES.PRODUCT_INFO]: 1,
  [AI_FEATURES.EMAIL_TEMPLATE]: 1,
  [AI_FEATURES.TV_COMPARISON]: 1
} as const;

// Free usage limits per feature (3 free uses as requested)
const FREE_USAGE_LIMIT = 3;

export interface AIRequest extends Request {
  aiUsage?: {
    isAuthenticated: boolean;
    userId: string | null;
    sessionId: string;
    aiFeature: string;
    canUseFree: boolean;
    usageCount: number;
    creditCost: number;
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
      const creditCost = AI_CREDIT_COSTS[aiFeature as keyof typeof AI_CREDIT_COSTS] || 1;

      // Check free usage limit
      const freeUsageCheck = await storage.checkAiFreeUsageLimit(userId, sessionId, aiFeature, FREE_USAGE_LIMIT);
      
      let canProceed = false;
      let requiresPayment = false;

      if (freeUsageCheck.canUseFree) {
        // Can use free quota
        canProceed = true;
      } else {
        // Free quota exhausted, check if user is authenticated and has credits
        if (!isAuthenticated) {
          requiresPayment = true;
        } else {
          // Check if user has verified email
          const user = await storage.getUser(userId);
          if (!user?.emailVerified) {
            return res.status(403).json({
              error: 'Email verification required',
              message: 'Please verify your email address before purchasing AI credits.',
              requiresEmailVerification: true
            });
          }
          
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
            message: `You've used your ${FREE_USAGE_LIMIT} free ${aiFeature.replace('-', ' ')} requests. Please sign in and add credits to continue.`,
            freeUsageLimit: FREE_USAGE_LIMIT,
            usageCount: freeUsageCheck.usageCount,
            requiresSignIn: true,
            creditCost
          });
        } else {
          // Double-check email verification for authenticated users needing to pay
          const user = await storage.getUser(userId);
          if (!user?.emailVerified) {
            return res.status(403).json({
              error: 'Email verification required',
              message: 'Please verify your email address before purchasing AI credits.',
              requiresEmailVerification: true
            });
          }
          
          return res.status(402).json({
            error: 'Insufficient credits',
            message: `You need ${creditCost} credit${creditCost > 1 ? 's' : ''} to use this AI feature. Please top up your wallet.`,
            creditCost,
            currentBalance: parseFloat((await storage.getCustomerWallet(userId))?.balance || '0'),
            requiresTopUp: true
          });
        }
      }

      // Add usage info to request for the endpoint to use
      req.aiUsage = {
        isAuthenticated,
        userId,
        sessionId,
        aiFeature,
        canUseFree: freeUsageCheck.canUseFree,
        usageCount: freeUsageCheck.usageCount,
        creditCost
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

  const { userId, sessionId, aiFeature, canUseFree, creditCost } = req.aiUsage;
  const isPaidRequest = !canUseFree;

  try {
    // Record usage
    await storage.incrementAiUsage(userId, sessionId, aiFeature, isPaidRequest);

    // Deduct credits if it was a paid request
    if (isPaidRequest && userId) {
      // Verify email before deducting credits
      const user = await storage.getUser(userId);
      if (!user?.emailVerified) {
        console.error('Attempted credit deduction for unverified user:', userId);
        return; // Don't deduct credits for unverified users
      }
      
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