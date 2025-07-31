import React, { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Tv, CheckCircle, AlertCircle, Key } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PaymentBooking {
  id: number;
  name: string;
  email: string;
  tvBrand: string;
  tvModel: string;
  paymentAmount: string;
  credentialsProvided: boolean;
}

function TvSetupPayment() {
  const [, params] = useRoute("/tv-setup-payment/:bookingId");
  const [location] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const bookingId = params?.bookingId;

  const { data: bookingData, isLoading, error } = useQuery({
    queryKey: [`/api/tv-setup-booking/${bookingId}/payment`],
    enabled: !!bookingId,
    retry: false,
  });

  const booking = bookingData?.booking as PaymentBooking | undefined;

  const handlePayment = async () => {
    if (!booking) return;

    setIsProcessing(true);
    try {
      // Create payment session
      const response = await fetch(`/api/tv-setup-booking/${booking.id}/send-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create payment session");
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Payment system not available");
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw new Error(error.message || "Payment failed");
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Payment Not Available</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              {error?.message === "Credentials not yet provided"
                ? "Your login credentials are still being prepared. You'll receive a payment link once they're ready."
                : error?.message === "Payment already completed"
                ? "Payment has already been completed for this booking."
                : "This booking was not found or is not available for payment."}
            </p>
            <Button onClick={() => window.close()} className="w-full">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tv className="h-5 w-5" />
            <span>TV Setup Payment</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Info */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Customer</label>
              <p className="font-medium">{booking.name}</p>
              <p className="text-sm text-gray-600">{booking.email}</p>
            </div>
            
            {/* TV Details */}
            <div>
              <label className="text-sm font-medium text-gray-500">TV Details</label>
              <p className="font-medium">{booking.tvBrand} {booking.tvModel}</p>
            </div>

            {/* Credentials Status */}
            <div>
              <label className="text-sm font-medium text-gray-500">Credentials Status</label>
              <div className="flex items-center space-x-2 mt-1">
                {booking.credentialsProvided ? (
                  <Badge className="bg-green-100 text-green-800">
                    <Key className="h-3 w-3 mr-1" />
                    Ready for Setup
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Preparing...
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">TV Setup Service</span>
              <span className="text-2xl font-bold text-blue-600">€{booking.paymentAmount}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              One-time payment for professional TV setup assistance including login credentials
            </p>
          </div>

          {/* Payment Button */}
          <Button 
            onClick={handlePayment}
            disabled={isProcessing || !booking.credentialsProvided}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay €{booking.paymentAmount}
              </>
            )}
          </Button>

          {!booking.credentialsProvided && (
            <p className="text-sm text-gray-500 text-center">
              Payment will be available once your login credentials are ready
            </p>
          )}

          {/* Security Info */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <div className="flex items-center justify-center space-x-1">
              <CheckCircle className="h-3 w-3" />
              <span>Secure payment powered by Stripe</span>
            </div>
            <p>Your payment information is encrypted and secure</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TvSetupPayment;