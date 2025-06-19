import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tv, User, Clock } from "lucide-react";

interface ProtectedBookingProps {
  children: React.ReactNode;
}

export function ProtectedBooking({ children }: ProtectedBookingProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [usageCount, setUsageCount] = useState(0);
  const [canProceed, setCanProceed] = useState(false);

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
    if (usageCount >= 2) {
      toast({
        title: "Daily limit reached",
        description: "You've used your 2 free tries today. Please sign in to continue booking.",
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

  // If not authenticated, show guest booking option with limits
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Book Your TV Installation
          </h1>
          <p className="text-xl text-gray-600">
            Try our service for free or sign in for unlimited access
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Guest Booking Option */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tv className="w-5 h-5 mr-2 text-indigo-600" />
                Guest Booking
              </CardTitle>
              <CardDescription>
                Try our AI preview service with limited access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-600">Daily usage:</span>
                <span className="font-medium text-gray-900">{usageCount}/2 tries used</span>
              </div>
              
              {usageCount < 2 ? (
                <div>
                  <Button 
                    onClick={handleGuestBooking}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Try Free Booking ({2 - usageCount} tries left)
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    You've reached your daily limit of 2 free tries.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Resets tomorrow or sign in for unlimited access.
                  </p>
                  <a
                    href="/admin-login"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Sign In
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sign In Option */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2 text-green-600" />
                Full Access
              </CardTitle>
              <CardDescription>
                Sign in for unlimited bookings and additional features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Unlimited AI previews
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Booking history & tracking
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Priority customer support
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Exclusive discounts
                </li>
              </ul>
              
              <div className="pt-4">
                <a
                  href="/admin-login"
                  className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <User className="w-4 h-4 mr-2" />
                  Sign In Now
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}