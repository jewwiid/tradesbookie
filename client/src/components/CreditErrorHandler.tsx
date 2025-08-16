import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard, Mail, LogIn } from 'lucide-react';

interface CreditError {
  error: string;
  message: string;
  freeUsageLimit?: number;
  usageCount?: number;
  requiresSignIn?: boolean;
  creditCost?: number;
  currentBalance?: number;
  requiresTopUp?: boolean;
  requiresEmailVerification?: boolean;
}

interface CreditErrorHandlerProps {
  error: CreditError;
  onSignIn?: () => void;
  onTopUp?: () => void;
  onVerifyEmail?: () => void;
  featureName?: string;
}

export default function CreditErrorHandler({ 
  error, 
  onSignIn, 
  onTopUp, 
  onVerifyEmail,
  featureName = 'AI feature'
}: CreditErrorHandlerProps) {
  
  // Free usage limit exceeded - guest user
  if (error.requiresSignIn) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="space-y-3">
          <div>
            <p className="font-medium text-blue-900">Free usage limit reached</p>
            <p className="text-sm text-blue-700">
              You've used your {error.freeUsageLimit} free {featureName} requests. 
              Sign in and add credits to continue using this feature.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={onSignIn} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <LogIn className="w-4 h-4 mr-2" />
              Sign In & Get Credits
            </Button>
            <span className="text-xs text-blue-600">
              Cost: {error.creditCost} credit{(error.creditCost || 1) > 1 ? 's' : ''} per use
            </span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Email verification required
  if (error.requiresEmailVerification) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <Mail className="h-4 w-4 text-orange-600" />
        <AlertDescription className="space-y-3">
          <div>
            <p className="font-medium text-orange-900">Email verification required</p>
            <p className="text-sm text-orange-700">
              Please verify your email address before purchasing AI credits.
            </p>
          </div>
          {onVerifyEmail && (
            <Button onClick={onVerifyEmail} size="sm" className="bg-orange-600 hover:bg-orange-700">
              <Mail className="w-4 h-4 mr-2" />
              Verify Email
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Insufficient credits - authenticated user
  if (error.requiresTopUp) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <CreditCard className="h-4 w-4 text-red-600" />
        <AlertDescription className="space-y-3">
          <div>
            <p className="font-medium text-red-900">Insufficient credits</p>
            <p className="text-sm text-red-700">
              You need {error.creditCost} credit{(error.creditCost || 1) > 1 ? 's' : ''} to use this feature.
            </p>
            <div className="text-xs text-red-600 space-y-1">
              <p>Current balance: {error.currentBalance || 0} credits</p>
              <p>Required: {error.creditCost} credits</p>
            </div>
          </div>
          {onTopUp && (
            <Button onClick={onTopUp} size="sm" className="bg-red-600 hover:bg-red-700">
              <CreditCard className="w-4 h-4 mr-2" />
              Top Up Credits
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Generic error fallback
  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription>
        <p className="font-medium text-red-900">{error.error}</p>
        <p className="text-sm text-red-700">{error.message}</p>
      </AlertDescription>
    </Alert>
  );
}