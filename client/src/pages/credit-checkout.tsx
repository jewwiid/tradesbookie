import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Loader2, CreditCard, Shield, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

// Dynamically load Stripe with live publishable key from server
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

interface CreditCheckoutFormProps {
  clientSecret: string;
  installerId: string;
  creditAmount: string;
  onPaymentSuccess: () => void;
}

function CreditCheckoutForm({ clientSecret, installerId, creditAmount, onPaymentSuccess }: CreditCheckoutFormProps) {
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
      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (result.error) {
        toast({
          title: "Payment Failed",
          description: result.error.message,
          variant: "destructive",
        });
      } else if (result.paymentIntent?.status === 'succeeded') {
        // Confirm the payment on our backend
        const confirmResponse = await apiRequest('POST', `/api/installer/${installerId}/wallet/confirm-payment`, {
          paymentIntentId: result.paymentIntent.id
        });

        if (confirmResponse.ok) {
          toast({
            title: "Credits Added Successfully",
            description: `€${creditAmount} has been added to your wallet`,
          });
          onPaymentSuccess();
        } else {
          throw new Error('Failed to confirm payment');
        }
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
      <div className="bg-muted/50 p-4 rounded-lg">
        <PaymentElement />
      </div>
      
      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium">Secure Payment</span>
        </div>
        <span className="text-sm text-muted-foreground">Powered by Stripe</span>
      </div>

      <Button 
        type="submit" 
        disabled={!stripe || !elements || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay €{creditAmount}
          </>
        )}
      </Button>
    </form>
  );
}

export default function CreditCheckout() {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const installerId = urlParams.get('installerId');
  const creditAmount = urlParams.get('amount');

  useEffect(() => {
    if (!installerId || !creditAmount) {
      setError("Missing payment parameters");
      setLoading(false);
      return;
    }

    const initializePayment = async () => {
      try {
        // Load Stripe
        const stripe = await getStripePromise();
        setStripePromise(Promise.resolve(stripe));

        // Create payment intent for credit purchase
        const response = await apiRequest("POST", `/api/installer/${installerId}/wallet/create-payment-intent`, {
          amount: parseFloat(creditAmount)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create payment intent");
        }

        const paymentData = await response.json();
        setClientSecret(paymentData.clientSecret);
      } catch (error: any) {
        console.error("Payment initialization error:", error);
        setError(error.message || "Failed to initialize payment");
        toast({
          title: "Payment Setup Failed",
          description: error.message || "Unable to set up payment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initializePayment();
  }, [installerId, creditAmount, toast]);

  const handlePaymentSuccess = () => {
    setLocation(`/installer-dashboard`);
  };

  const handleGoBack = () => {
    setLocation('/installer-dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Setting up secure payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Payment Setup Failed</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGoBack} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Purchase Credits
            </h1>
            <p className="text-muted-foreground">
              Add credits to your installer wallet to access lead details
            </p>
          </div>

          {/* Payment Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Payment Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credit Amount:</span>
                  <span className="font-medium">€{creditAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processing Fee:</span>
                  <span className="font-medium">€0.00</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>€{creditAmount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Enter your payment information to complete the credit purchase
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stripePromise && clientSecret && (
                <Elements 
                  stripe={stripePromise} 
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#3b82f6',
                        colorBackground: '#ffffff',
                        colorText: '#1f2937',
                        colorDanger: '#ef4444',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        spacingUnit: '4px',
                        borderRadius: '8px',
                      },
                    },
                  }}
                >
                  <CreditCheckoutForm
                    clientSecret={clientSecret}
                    installerId={installerId!}
                    creditAmount={creditAmount!}
                    onPaymentSuccess={handlePaymentSuccess}
                  />
                </Elements>
              )}
            </CardContent>
          </Card>

          {/* Back Link */}
          <div className="text-center mt-6">
            <Button onClick={handleGoBack} variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}