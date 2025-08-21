import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Star, Crown, Zap, Shield, Check, Loader2, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Load Stripe
let stripePromise: Promise<any> | null = null;

const getStripePromise = async () => {
  if (!stripePromise) {
    try {
      const response = await fetch('/api/stripe/config');
      const config = await response.json();
      if (!config.publishableKey) {
        throw new Error('Stripe publishable key not configured');
      }
      stripePromise = loadStripe(config.publishableKey);
    } catch (error) {
      console.error('Failed to load Stripe configuration:', error);
      throw new Error('Payment system unavailable');
    }
  }
  return stripePromise;
};

interface VipSubscriptionFormProps {
  installerId: number;
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function VipSubscriptionForm({ installerId, clientSecret, onSuccess, onCancel }: VipSubscriptionFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/installer-dashboard',
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome to VIP!",
          description: "Your VIP membership is now active. You'll no longer pay lead fees!",
        });
        onSuccess();
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "An error occurred during payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border-2 border-yellow-200">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-5 h-5 text-yellow-600" />
          <span className="font-medium text-yellow-800">VIP Installer Membership</span>
        </div>
        <p className="text-sm text-yellow-700">
          Upgrade to VIP and never pay lead fees again! Save €12-35 per job.
        </p>
      </div>

      <PaymentElement />

      <div className="flex gap-3">
        <Button 
          type="submit" 
          disabled={!stripe || !elements || isLoading}
          className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Crown className="w-4 h-4 mr-2" />
              Subscribe for €50/month
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

interface VipSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installerId: number;
}

export default function VipSubscriptionModal({ open, onOpenChange, installerId }: VipSubscriptionModalProps) {
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch subscription status
  const { data: subscriptionStatus, refetch: refetchStatus } = useQuery({
    queryKey: [`/api/installer/${installerId}/subscription-status`],
    enabled: open && installerId > 0,
    refetchOnWindowFocus: false,
  });

  // Create subscription mutation
  const createSubscription = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/installer/vip-subscription', {
        installerId
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create subscription');
      toast({
        title: "Error",
        description: "Failed to initialize subscription",
        variant: "destructive",
      });
    }
  });

  // Cancel subscription mutation
  const cancelSubscription = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/installer/cancel-vip-subscription', {
        installerId
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Canceled",
        description: "Your VIP membership will end at the end of your current billing period",
      });
      refetchStatus();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (open && installerId) {
      const initializeStripe = async () => {
        try {
          setLoading(true);
          const stripe = await getStripePromise();
          setStripeInstance(stripe);
        } catch (error: any) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };
      
      initializeStripe();
    }
  }, [open, installerId]);

  const handleSubscribe = () => {
    createSubscription.mutate();
  };

  const handleCancel = () => {
    cancelSubscription.mutate();
  };

  const handlePaymentSuccess = () => {
    setClientSecret(null);
    refetchStatus();
    queryClient.invalidateQueries({ queryKey: ['/api/installers/profile'] });
    onOpenChange(false);
  };

  const isVipActive = (subscriptionStatus as any)?.isVip && (subscriptionStatus as any)?.subscriptionStatus === 'active';
  const willCancelAtPeriodEnd = (subscriptionStatus as any)?.subscriptionDetails?.cancel_at_period_end;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            VIP Installer Membership
          </DialogTitle>
          <DialogDescription>
            Upgrade to VIP status and never pay lead fees again
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* VIP Benefits */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                VIP Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                <span>No lead fees (save €12-35 per job)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                <span>Priority customer support</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                <span>VIP badge on your profile</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </CardContent>
          </Card>

          {/* Current Status */}
          {subscriptionStatus && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={isVipActive ? "default" : "secondary"}>
                    {isVipActive ? "VIP Active" : "Standard Member"}
                  </Badge>
                  {willCancelAtPeriodEnd && (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      Canceling Soon
                    </Badge>
                  )}
                </div>
                {isVipActive && (subscriptionStatus as any)?.currentPeriodEnd && (
                  <p className="text-sm text-gray-600">
                    {willCancelAtPeriodEnd ? 'Ends' : 'Renews'} on{' '}
                    {new Date((subscriptionStatus as any).currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Form or Action Buttons */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-4 text-red-600">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Show payment form for new subscription */}
              {clientSecret && stripeInstance && (
                <Elements 
                  stripe={stripeInstance} 
                  options={{ clientSecret }}
                >
                  <VipSubscriptionForm
                    installerId={installerId}
                    clientSecret={clientSecret}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => {
                      setClientSecret(null);
                      setError(null);
                    }}
                  />
                </Elements>
              )}

              {/* Show action buttons when no payment in progress */}
              {!clientSecret && stripeInstance && (
                <div className="space-y-3">
                  {!isVipActive && (
                    <Button 
                      onClick={handleSubscribe}
                      disabled={createSubscription.isPending}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    >
                      {createSubscription.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        <>
                          <Crown className="w-4 h-4 mr-2" />
                          Subscribe for €50/month
                        </>
                      )}
                    </Button>
                  )}

                  {isVipActive && !willCancelAtPeriodEnd && (
                    <Button 
                      onClick={handleCancel}
                      disabled={cancelSubscription.isPending}
                      variant="outline"
                      className="w-full"
                    >
                      {cancelSubscription.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Canceling...
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Cancel Subscription
                        </>
                      )}
                    </Button>
                  )}

                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      Secure payments powered by Stripe
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}