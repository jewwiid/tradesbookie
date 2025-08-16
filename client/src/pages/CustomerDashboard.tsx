import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import QRCode from "@/components/QRCode";
import ExpandableQRCode from "@/components/ExpandableQRCode";
import { Tv, Home, CheckCircle, Clock, Wrench } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";

export default function CustomerDashboard() {
  const { qrCode } = useParams();
  const [, setLocation] = useLocation();

  const { data: booking, isLoading } = useQuery({
    queryKey: [`/api/bookings/qr/${qrCode}`],
    enabled: !!qrCode,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your booking...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
            <p className="text-gray-600 mb-6">
              We couldn't find a booking with this QR code.
            </p>
            <Button onClick={() => setLocation('/')}>
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { color: 'bg-blue-100 text-blue-800', icon: CheckCircle };
      case 'assigned':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'in_progress':
        return { color: 'bg-orange-100 text-orange-800', icon: Wrench };
      case 'completed':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: Clock };
    }
  };

  const statusInfo = getStatusInfo(booking.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Tv className="h-8 w-8 text-primary mr-3" />
              <span className="text-xl font-bold text-gray-900">Customer Dashboard</span>
            </div>
            <Button variant="ghost" onClick={() => setLocation('/')}>
              <Home className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* QR Code Access */}
        <Card className="mb-8">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Booking QR Code</h2>
            <p className="text-gray-600 mb-6">Save this QR code to quickly access your booking details and track installation progress</p>
            <div className="flex justify-center mb-4">
              <QRCode value={`${window.location.origin}/qr-tracking/${booking.qrCode}`} size={200} />
            </div>
            <p className="text-sm text-gray-500 mb-4">Booking ID: {booking.id}</p>
            <div className="flex justify-center">
              <ExpandableQRCode 
                qrCode={booking.qrCode}
                bookingId={booking.id}
                title="Download Booking QR Code"
                description="Download or share this QR code for easy installation tracking"
              />
            </div>
          </CardContent>
        </Card>

        {/* Request Status */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Request Status</CardTitle>
              <Badge className={statusInfo.color}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  ['confirmed', 'assigned', 'in_progress', 'completed'].includes(booking.status) 
                    ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Request Submitted</div>
                  <div className="text-sm text-gray-600">Your installation request is live on our platform</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  ['assigned', 'in_progress', 'completed'].includes(booking.status) 
                    ? 'bg-green-500' : 'bg-yellow-500'
                }`}>
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Installer Assigned</div>
                  <div className="text-sm text-gray-600">Professional installer will contact you</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  booking.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className={`font-semibold ${booking.status === 'completed' ? 'text-gray-900' : 'text-gray-500'}`}>
                    Installation Day
                  </div>
                  <div className={`text-sm ${booking.status === 'completed' ? 'text-gray-600' : 'text-gray-500'}`}>
                    We'll arrive at your scheduled time
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Installation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Service Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">TV Size:</span>
                    <span className="font-medium">{booking.tvSize}"</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium">{booking.serviceTier?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wall Type:</span>
                    <span className="font-medium">{booking.wallType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mount Type:</span>
                    <span className="font-medium">{booking.mountType}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Schedule & Contact</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {booking.scheduledDate ? formatDate(booking.scheduledDate) : 'Not scheduled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{booking.scheduledTime || 'Not scheduled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-medium">{booking.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Cost:</span>
                    <span className="font-medium text-lg">{formatPrice(booking.totalPrice)}</span>
                  </div>
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-green-800 text-sm font-medium">Pay Installer Directly</div>
                    <div className="text-green-600 text-xs mt-1">Cash • Card • Bank Transfer</div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Preview */}
            {(booking.originalImageUrl || booking.aiPreviewUrl) && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">AI Room Preview</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {booking.originalImageUrl && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Before</p>
                      <img 
                        src={booking.originalImageUrl} 
                        alt="Room before installation"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  {booking.aiPreviewUrl && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">After (AI Preview)</p>
                      <img 
                        src={booking.aiPreviewUrl} 
                        alt="AI preview with TV"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
