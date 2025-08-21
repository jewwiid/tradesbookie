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
      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }
      const data = await response.json();
      console.log('Subscription response:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Setting clientSecret:', data.clientSecret);
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        setError('No payment required - subscription already exists');
      }
    },
    onError: (error: any) => {
      console.error('Subscription creation error:', error);
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
          console.log('Initializing Stripe...');
          const stripe = await getStripePromise();
          console.log('Stripe loaded:', !!stripe);
          setStripeInstance(stripe);
        } catch (error: any) {
          console.error('Stripe initialization error:', error);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            VIP Installer Membership
          </DialogTitle>
          <DialogDescription>
            Upgrade to VIP status and never pay lead fees again
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-3 text-lg">Loading payment system...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8 text-red-600">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-medium">Payment Setup Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Main Content - 2 Column Layout */}
          {!loading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Benefits & Status */}
              <div className="space-y-4">
                {/* VIP Benefits */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      VIP Benefits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span><strong>No lead fees</strong> - Save €12-35 per job</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span><strong>Priority support</strong> - Get help faster</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span><strong>VIP badge</strong> - Stand out to customers</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span><strong>Cancel anytime</strong> - No long-term commitment</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Status */}
                {subscriptionStatus && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl">Current Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge 
                          variant={isVipActive ? "default" : "secondary"}
                          className={isVipActive ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                        >
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
                          {willCancelAtPeriodEnd ? 'Membership ends' : 'Next billing'} on{' '}
                          <span className="font-medium">
                            {new Date((subscriptionStatus as any).currentPeriodEnd).toLocaleDateString()}
                          </span>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Value Proposition */}
                <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      <span className="font-semibold text-yellow-800">Pay for itself quickly!</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Just 2-3 jobs per month and VIP pays for itself. 
                      Most installers save €200+ monthly on lead fees.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Payment Form & Actions */}
              <div className="space-y-4">
                {/* Payment Form */}
                {clientSecret && stripeInstance && (
                  <Card className="border-2 border-yellow-200">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-600" />
                        Secure Payment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                {!clientSecret && stripeInstance && (
                  <Card className="border-2 border-yellow-200">
                    <CardContent className="p-6">
                      {!isVipActive && (
                        <div className="text-center space-y-4">
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                            <div className="text-2xl font-bold text-yellow-800 mb-1">€50/month</div>
                            <div className="text-sm text-yellow-700">Cancel anytime</div>
                          </div>
                          
                          <Button 
                            onClick={handleSubscribe}
                            disabled={createSubscription.isPending}
                            className="w-full h-12 text-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                          >
                            {createSubscription.isPending ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Setting up payment...
                              </>
                            ) : (
                              <>
                                <Crown className="w-5 h-5 mr-2" />
                                Upgrade to VIP Now
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {isVipActive && !willCancelAtPeriodEnd && (
                        <div className="text-center space-y-4">
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="text-lg font-semibold text-green-800 mb-1">VIP Active</div>
                            <div className="text-sm text-green-700">Enjoying zero lead fees</div>
                          </div>
                          
                          <Button 
                            onClick={handleCancel}
                            disabled={cancelSubscription.isPending}
                            variant="outline"
                            className="w-full h-10"
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
                        </div>
                      )}

                      <div className="text-center mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                          <Shield className="w-3 h-3" />
                          Secure payments powered by Stripe
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}