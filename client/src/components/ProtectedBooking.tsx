import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tv, User, Clock, Search, QrCode, Receipt, Zap, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import SimplifiedAuthDialog from "@/components/SimplifiedAuthDialog";

interface ProtectedBookingProps {
  children: React.ReactNode;
}

export function ProtectedBooking({ children }: ProtectedBookingProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [usageCount, setUsageCount] = useState(0);
  const [canProceed, setCanProceed] = useState(false);
  const [, setLocation] = useLocation();
  const [trackingCode, setTrackingCode] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogTab, setAuthDialogTab] = useState<'invoice' | 'guest' | 'email' | 'oauth'>('invoice');

  useEffect(() => {
    // Check daily usage from localStorage
    const today = new Date().toDateString();
    const storedCount = localStorage.getItem('booking_usage_count');
    const storedDate = localStorage.getItem('booking_usage_date');

    if (storedDate !== today) {
      // Reset count for new day
      localStorage.setItem('booking_usage_count', '0');
      localStorage.setItem('booking_usage_date', today);
      setUsageCount(0);
    } else {
      setUsageCount(parseInt(storedCount || '0'));
    }
  }, []);

  const handleGuestBooking = () => {
    if (usageCount >= 3) {
      toast({
        title: "Daily limit reached",
        description: "You've used your 3 free AI previews today. Please sign in to continue with unlimited access.",
        variant: "destructive",
      });
      return;
    }
    
    // Increment usage and allow access
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    localStorage.setItem('booking_usage_count', newCount.toString());
    localStorage.setItem('booking_usage_date', new Date().toDateString());
    setCanProceed(true);
  };

  const handleAuthSuccess = (user: any) => {
    toast({
      title: "Authentication successful!",
      description: "You can now proceed with your booking.",
    });
    setCanProceed(true);
    setAuthDialogOpen(false);
  };

  const handleTrackBooking = () => {
    if (!trackingCode.trim()) {
      toast({
        title: "Please enter a tracking code",
        description: "Enter your QR code or booking reference to track your installation.",
        variant: "destructive",
      });
      return;
    }
    
    // Redirect to booking tracker with the code
    setLocation(`/booking-tracker?code=${encodeURIComponent(trackingCode)}`);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated or guest has proceeded, show booking flow directly
  if (isAuthenticated || canProceed) {
    return <>{children}</>;
  }

  // If not authenticated, show booking faster than ever authentication options
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50">
      <Navigation />
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Book Your TV Installation
            </h1>
            <p className="text-xl text-gray-600">
              Choose your preferred way to sign in and start booking
            </p>
          </div>

          {/* Authentication Options Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
              <CardContent className="p-8 text-center flex flex-col h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Receipt className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Harvey Norman Invoice</h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  Enter your Harvey Norman receipt number to book instantly. No account needed.
                </p>
                <Button 
                  onClick={() => {
                    setAuthDialogTab('invoice');
                    setAuthDialogOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 mt-auto"
                >
                  Use Invoice Number
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
              <CardContent className="p-8 text-center flex flex-col h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Quick Guest Booking</h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  Skip registration. Just provide your email for booking updates.
                </p>
                <Button 
                  onClick={() => {
                    setAuthDialogTab('guest');
                    setAuthDialogOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 mt-auto"
                >
                  Book as Guest
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
              <CardContent className="p-8 text-center flex flex-col h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Full Account</h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  Create an account for booking history, dashboard access, and more.
                </p>
                <Button 
                  onClick={() => {
                    setAuthDialogTab('oauth');
                    setAuthDialogOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 mt-auto"
                >
                  Create Account
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mb-12">
            <div className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                All options include email updates and booking tracking
              </span>
            </div>
          </div>

          {/* Tracking Section */}
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-center">
                  <Search className="w-5 h-5 mr-2 text-blue-600" />
                  Track Existing Installation
                </CardTitle>
                <CardDescription className="text-center">
                  Check the status of your existing booking with QR code or reference
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter QR code or booking reference"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      className="text-center"
                    />
                  </div>
                  <Button 
                    onClick={handleTrackBooking}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Track Installation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Simplified Authentication Dialog */}
      <SimplifiedAuthDialog
        isOpen={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        onSuccess={handleAuthSuccess}
        title="Sign In to Continue"
        description="Choose your preferred way to sign in and complete your TV installation booking"
        defaultTab={authDialogTab}
      />
    </div>
  );
}