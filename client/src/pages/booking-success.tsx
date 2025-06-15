import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, MapPin, Phone, Mail, Download, Home } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import QRCodeGenerator from "@/components/qr-code-generator";

interface BookingDetails {
  id: number;
  qrCode: string;
  tvSize: string;
  serviceType: string;
  wallType: string;
  mountType: string;
  totalPrice: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  address: string;
  scheduledDate: string;
  status: string;
}

export default function BookingSuccess() {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Get booking ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('bookingId');

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiRequest("GET", `/api/bookings/${bookingId}`);
        const bookingData = await response.json();
        
        if (response.ok) {
          setBooking(bookingData);
          
          // Generate QR code for booking tracking
          if (bookingData.qrCode) {
            setQrCodeUrl(bookingData.qrCode);
          }
        }
      } catch (error) {
        console.error("Failed to fetch booking details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Booking Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Unable to find your booking details.
            </p>
            <Button onClick={() => setLocation('/')} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
          <p className="text-lg text-muted-foreground">
            Your TV installation has been booked and confirmed
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Booking ID: #{booking.id}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Booking Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Installation Details
                </CardTitle>
                <CardDescription>Your TV installation service summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">TV Size:</span>
                    <p className="text-muted-foreground">{booking.tvSize}"</p>
                  </div>
                  <div>
                    <span className="font-medium">Service Type:</span>
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
                    <span className="font-medium">Installation Address:</span>
                    <p className="text-muted-foreground flex items-start gap-1">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {booking.address}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Scheduled Date:</span>
                    <p className="text-muted-foreground">
                      {new Date(booking.scheduledDate).toLocaleDateString('en-IE', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Paid:</span>
                    <span className="text-green-600">€{parseFloat(booking.totalPrice).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>Your details for this booking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{booking.customerEmail}</span>
                </div>
                {booking.customerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{booking.customerPhone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* QR Code and Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking QR Code</CardTitle>
                <CardDescription>
                  Save this QR code for easy booking tracking and installer verification
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {qrCodeUrl ? (
                  <div className="flex justify-center">
                    <QRCodeGenerator 
                      text={booking.qrCode || `BOOKING-${booking.id}`}
                      size={200}
                      className="border rounded-lg p-4 bg-white"
                    />
                  </div>
                ) : (
                  <div className="w-[200px] h-[200px] mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">QR Code Generating...</p>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Show this QR code to your installer for quick booking verification
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What's Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-blue-600">1</span>
                    </div>
                    <p>You'll receive a confirmation email with all booking details</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-blue-600">2</span>
                    </div>
                    <p>A professional installer will be assigned to your job</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-blue-600">3</span>
                    </div>
                    <p>You'll receive contact details and final scheduling confirmation</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-blue-600">4</span>
                    </div>
                    <p>Professional installation on your scheduled date</p>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Button 
                    onClick={() => setLocation('/customer-dashboard')} 
                    className="w-full"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    View My Bookings
                  </Button>
                  
                  <Button 
                    onClick={() => setLocation('/')} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Return Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Information */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>Need help?</strong> Contact our support team at support@smarttvmount.ie
              </p>
              <p>
                Keep your booking ID #{booking.id} for reference
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}