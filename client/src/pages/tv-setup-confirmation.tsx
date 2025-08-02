import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Calendar, Phone, Mail, Tv, User } from "lucide-react";
import { format } from "date-fns";

// Type for TV Setup Booking based on the API response
interface TvSetupBooking {
  id: number;
  name: string;
  email: string;
  mobile: string;
  tvBrand: string;
  tvModel: string;
  isSmartTv: string;
  tvOs: string;
  yearOfPurchase: number;
  streamingApps: string[];
  preferredSetupDate?: string;
  additionalNotes?: string;
  setupStatus: string;
  paymentAmount: string;
  paymentStatus: string;
  createdAt: string;
}

export default function TvSetupConfirmation() {
  const [, setLocation] = useLocation();
  const [bookingId, setBookingId] = useState<string>("");

  useEffect(() => {
    // Get booking ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('booking_id');
    if (id) {
      setBookingId(id);
    } else {
      // Redirect to main page if no booking ID
      setLocation('/tv-setup-assist');
    }
  }, [setLocation]);

  const { data: booking, isLoading } = useQuery<TvSetupBooking>({
    queryKey: ['/api/tv-setup-booking', bookingId],
    enabled: !!bookingId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-8">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Booking Not Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find your booking details. Please contact support if you believe this is an error.
            </p>
            <Button onClick={() => setLocation('/tv-setup-assist')}>
              Back to Booking
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Booking Submitted Successfully!
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Your TV Setup Assistance request has been received
          </p>
          <Badge className="bg-green-600 text-white px-4 py-2 text-lg">
            Booking ID: {booking.id}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Booking Details */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Booking Details
              </CardTitle>
              <CardDescription>
                Your TV setup assistance information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="font-semibold">{booking.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="font-semibold">{booking.email}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Mobile</p>
                <p className="font-semibold">{booking.mobile}</p>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">TV Brand</p>
                    <p className="font-semibold">{booking.tvBrand}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">TV Model</p>
                    <p className="font-semibold">{booking.tvModel}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">TV OS</p>
                  <p className="font-semibold">{booking.tvOs}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Year Purchased</p>
                  <p className="font-semibold">{booking.yearOfPurchase}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Streaming Apps</p>
                <div className="flex flex-wrap gap-2">
                  {booking.streamingApps?.map((app: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {app.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>

              {booking.preferredSetupDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Preferred Setup Date</p>
                  <p className="font-semibold">
                    {format(new Date(booking.preferredSetupDate), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
              )}

              {booking.additionalNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Additional Notes</p>
                  <p className="text-gray-700">{booking.additionalNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                What Happens Next?
              </CardTitle>
              <CardDescription>
                We'll be in touch soon to schedule your setup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Confirmation Email</h4>
                    <p className="text-gray-600">
                      You'll receive a confirmation email with all your booking details within the next few minutes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Credentials Preparation</h4>
                    <p className="text-gray-600">
                      Our team will prepare your login credentials for streaming apps within 24 hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Payment Instructions</h4>
                    <p className="text-gray-600">
                      Once your credentials are ready, you'll receive an email with payment instructions (€100).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Professional Setup</h4>
                    <p className="text-gray-600">
                      After payment, receive your login credentials and setup assistance for all streaming apps.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Mail className="w-4 h-4" />
                    <span>support@tradesbook.ie</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-700">
                    <Phone className="w-4 h-4" />
                    <span>01-XXX-XXXX</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-900">Payment Status</h4>
                </div>
                <p className="text-yellow-700 text-sm">
                  {booking.paymentStatus === 'not_required' 
                    ? 'No payment required yet. You\'ll receive payment instructions once your login credentials are prepared.'
                    : `Payment Status: ${booking.paymentStatus}`
                  }
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                <h4 className="font-semibold text-blue-900 mb-2">Track Your Booking</h4>
                <p className="text-blue-700 text-sm mb-3">
                  You can track the progress of your TV setup booking at any time using the link below:
                </p>
                <Button 
                  onClick={() => setLocation(`/tv-setup-tracker?bookingId=${booking.id}`)}
                  variant="outline"
                  size="sm"
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  Track Your Setup Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Button 
            onClick={() => setLocation('/')}
            variant="outline"
            size="lg"
          >
            Return to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
}