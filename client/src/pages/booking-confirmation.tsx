import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, MapPin, Calendar, Tv, Wrench, Euro, Phone, Mail, User } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function BookingConfirmation() {
  const [, setLocation] = useLocation();
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('bookingId');
    setBookingId(id);
  }, []);

  const { data: booking, isLoading, error } = useQuery({
    queryKey: [`/api/bookings/${bookingId}`],
    enabled: !!bookingId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading your booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Booking Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              We couldn't find your booking details. Please check your booking ID or contact support.
            </p>
            <Button onClick={() => setLocation('/')} variant="outline" className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
      case "open":
        return { 
          icon: Clock, 
          color: "bg-yellow-500", 
          text: "Awaiting Installer", 
          description: "We're finding the perfect installer for your job" 
        };
      case "assigned":
        return { 
          icon: CheckCircle, 
          color: "bg-purple-500", 
          text: "Installer Assigned", 
          description: "An installer has been assigned to your request" 
        };
      case "confirmed":
        return { 
          icon: CheckCircle, 
          color: "bg-blue-500", 
          text: "Installer Confirmed", 
          description: "Your installer has confirmed and will contact you soon" 
        };
      case "in_progress":
        return { 
          icon: CheckCircle, 
          color: "bg-orange-500", 
          text: "Installation in Progress", 
          description: "Your TV installation is currently underway" 
        };
      case "completed":
        return { 
          icon: CheckCircle, 
          color: "bg-green-500", 
          text: "Installation Complete", 
          description: "Your TV installation has been completed successfully" 
        };
      default:
        return { 
          icon: Clock, 
          color: "bg-gray-500", 
          text: "Processing", 
          description: "Processing your request" 
        };
    }
  };

  const statusInfo = getStatusInfo(booking.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Booking Submitted Successfully!</h1>
          <p className="text-lg text-muted-foreground">
            Your TV installation request has been received. We'll notify you when an installer accepts your job.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Booking Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StatusIcon className="w-5 h-5" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}></div>
                <div>
                  <div className="font-semibold">{statusInfo.text}</div>
                  <div className="text-sm text-muted-foreground">{statusInfo.description}</div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-900">What happens next?</div>
                    <div className="text-sm text-blue-700 mt-1">
                      1. We'll notify qualified installers in your area<br/>
                      2. An installer will accept your request<br/>
                      3. You'll receive payment details once confirmed<br/>
                      4. Schedule the installation at your convenience
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tv className="w-5 h-5" />
                Service Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">TV Size:</span>
                <span className="font-medium">{booking.tvSize}"</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-medium">{booking.serviceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wall Type:</span>
                <span className="font-medium">{booking.wallType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mount Type:</span>
                <span className="font-medium">{booking.mountType}</span>
              </div>
              {booking.addons && booking.addons.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground">Add-ons:</span>
                    <div className="mt-1 space-y-1">
                      {booking.addons.map((addon: any, index: number) => (
                        <Badge key={index} variant="secondary" className="mr-1">
                          {addon.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Installation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Installation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <div className="text-sm text-muted-foreground">Location:</div>
                  <div className="font-medium">{booking.address}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <div className="text-sm text-muted-foreground">Preferred Date:</div>
                  <div className="font-medium">
                    {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'Flexible'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <div className="text-sm text-muted-foreground">Preferred Time:</div>
                  <div className="font-medium">{booking.timeSlot || 'Flexible'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="w-5 h-5" />
                Pricing Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Service:</span>
                <span className="font-medium">{formatPrice(parseFloat(booking.estimatedPrice || '0'))}</span>
              </div>
              {booking.estimatedAddonsPrice && parseFloat(booking.estimatedAddonsPrice) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Add-ons:</span>
                  <span className="font-medium">{formatPrice(parseFloat(booking.estimatedAddonsPrice))}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>{formatPrice(parseFloat(booking.estimatedTotal || '0'))}</span>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-sm text-yellow-800">
                  <strong>Payment Note:</strong> You'll only be charged once an installer accepts your request and the installation is confirmed.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button onClick={() => setLocation('/customer-dashboard')} className="gradient-bg">
            <User className="w-4 h-4 mr-2" />
            View My Bookings
          </Button>
          <Button onClick={() => setLocation('/')} variant="outline">
            Return Home
          </Button>
        </div>

        {/* Contact Info */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>01 234 5678</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>support@tradesbook.ie</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}