import { useState } from 'react';
import { AlertCircle, Mail, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';

interface EmailVerificationBannerProps {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    firstName?: string;
  };
  onDismiss?: () => void;
}

export function EmailVerificationBanner({ user, onDismiss }: EmailVerificationBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const { toast } = useToast();

  // Mutation for resending verification email
  const resendMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend verification email');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Verification email sent!",
        description: "Please check your email for the verification link.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send email",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Don't show banner if user is verified or banner is dismissed
  if (user.emailVerified || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleResend = () => {
    resendMutation.mutate();
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Email verification required
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Please verify your email address to access all features. Check your inbox at{' '}
              <span className="font-medium">{user.email}</span> for the verification link.
            </p>
            <div className="mt-3 flex items-center space-x-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleResend}
                disabled={resendMutation.isPending}
                className="bg-white border-yellow-300 text-yellow-800 hover:bg-yellow-50"
              >
                <Mail className="w-4 h-4 mr-2" />
                {resendMutation.isPending ? 'Sending...' : 'Resend email'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Success notification for when email gets verified
export function EmailVerifiedNotification() {
  return (
    <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
      <div className="flex items-center space-x-3">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <div>
          <h3 className="text-sm font-medium text-green-800">
            Email verified successfully!
          </h3>
          <p className="text-sm text-green-700 mt-1">
            You now have access to all features including unlimited AI previews and complete booking process.
          </p>
        </div>
      </div>
    </div>
  );
}