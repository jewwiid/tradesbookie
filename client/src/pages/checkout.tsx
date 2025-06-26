import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Loader2, CreditCard, Shield } from "lucide-react";
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

interface BookingDetails {
  id: number;
  tvSize: string;
  serviceType: string;
  wallType: string;
  mountType: string;
  totalPrice: string;
  customerEmail: string;
  address: string;
  scheduledDate: string;
}

const CheckoutForm = ({ booking, onSuccess }: { booking: BookingDetails; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/booking-success',
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Your TV installation booking has been confirmed!",
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Booking Summary
          </CardTitle>
          <CardDescription>
            Review your TV installation details before payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">TV Size:</span>
              <p className="text-muted-foreground">{booking.tvSize}"</p>
            </div>
            <div>
              <span className="font-medium">Service:</span>
              <p className="text-muted-foreground">{booking.serviceType}</p>
            </div>
            <div>
              <span className="font-medium">Wall Type:</span>
              <p className="text-muted-foreground">{booking.wallType}</p>
            </div>
            <div>
              <span className="font-medium">Mount Type:</span>
              <p className="text-muted-foreground">{booking.mountType}</p>
            </div>
            <div className="col-span-2">
              <span className="font-medium">Address:</span>
              <p className="text-muted-foreground">{booking.address}</p>
            </div>
            <div className="col-span-2">
              <span className="font-medium">Scheduled Date:</span>
              <p className="text-muted-foreground">{new Date(booking.scheduledDate).toLocaleDateString()}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Amount:</span>
            <span className="text-primary">€{parseFloat(booking.totalPrice).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Secure Payment
          </CardTitle>
          <CardDescription>
            Your payment information is encrypted and secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={!stripe || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Payment - €{parseFloat(booking.totalPrice).toFixed(2)}
                </>
              )}
            </Button>

            <div className="text-xs text-muted-foreground text-center">
              <Shield className="h-3 w-3 inline mr-1" />
              Secured by Stripe • Your card details are never stored
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get booking ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('bookingId');

  useEffect(() => {
    if (!bookingId) {
      setError("No booking ID provided");
      setLoading(false);
      return;
    }

    const initializePayment = async () => {
      try {
        // Fetch booking details
        const bookingResponse = await apiRequest("GET", `/api/bookings/${bookingId}`);
        const bookingData = await bookingResponse.json();
        
        if (!bookingResponse.ok) {
          throw new Error(bookingData.message || "Failed to fetch booking");
        }

        setBooking(bookingData);

        // Create payment intent
        const paymentResponse = await apiRequest("POST", "/api/create-payment-intent", {
          amount: parseFloat(bookingData.totalPrice),
          bookingId: bookingData.id,
          metadata: {
            customerEmail: bookingData.customerEmail,
            serviceType: bookingData.serviceType,
            tvSize: bookingData.tvSize
          }
        });

        const paymentData = await paymentResponse.json();
        
        if (!paymentResponse.ok) {
          throw new Error(paymentData.message || "Failed to create payment intent");
        }

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
  }, [bookingId, toast]);

  const handlePaymentSuccess = () => {
    setLocation(`/booking-success?bookingId=${bookingId}`);
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

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Payment Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error || "Unable to load booking details"}
            </p>
            <Button onClick={() => setLocation('/')} variant="outline" className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Preparing payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Complete Your Booking</h1>
          <p className="text-muted-foreground mt-2">
            Secure payment for your TV installation service
          </p>
        </div>

        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm booking={booking} onSuccess={handlePaymentSuccess} />
        </Elements>
      </div>
    </div>
  );
}