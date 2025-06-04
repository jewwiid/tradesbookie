import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import QRCodeComponent from "@/components/qr-code";
import { Home, CheckCircle, Clock, Wrench } from "lucide-react";
import { useLocation } from "wouter";

export default function CustomerDashboard() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();

  const { data: customerData, isLoading, error } = useQuery({
    queryKey: [`/api/customer/${token}`],
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your booking...</p>
        </div>
      </div>
    );
  }

  if (error || !customerData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
            <p className="text-gray-600 mb-4">The booking access link may be invalid or expired.</p>
            <Button onClick={() => setLocation('/')}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { booking, qrCode } = customerData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeSlotText = (timeSlot: string) => {
    const timeSlots: Record<string, string> = {
      '09:00': '9:00 AM - 11:00 AM',
      '11:00': '11:00 AM - 1:00 PM',
      '13:00': '1:00 PM - 3:00 PM',
      '15:00': '3:00 PM - 5:00 PM',
      '17:00': '5:00 PM - 7:00 PM'
    };
    return timeSlots[timeSlot] || timeSlot;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                <Home className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Customer Dashboard</span>
            </div>
            <Button variant="ghost" onClick={() => setLocation('/')}>
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* QR Code Access */}
        <Card className="mb-8">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Booking QR Code</h2>
            <p className="text-gray-600 mb-6">Save this QR code to quickly access your booking details</p>
            <div className="flex justify-center mb-4">
              <QRCodeComponent value={qrCode.qrCode} size={200} />
            </div>
            <p className="text-sm text-gray-500">
              Booking ID: <span className="font-mono">{booking.bookingId}</span>
            </p>
          </CardContent>
        </Card>

        {/* Booking Status */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Booking Status</CardTitle>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-4">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Booking Confirmed</div>
                  <div className="text-sm text-gray-600">Your installation has been scheduled</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  ['assigned', 'in-progress', 'completed'].includes(booking.status) 
                    ? 'bg-green-600' 
                    : 'bg-yellow-500'
                }`}>
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Installer Assigned</div>
                  <div className="text-sm text-gray-600">Professional installer will contact you</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  booking.status === 'completed' ? 'bg-green-600' : 'bg-gray-300'
                }`}>
                  <Wrench className={`h-4 w-4 ${booking.status === 'completed' ? 'text-white' : 'text-gray-600'}`} />
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
            <CardTitle className="text-2xl">Installation Details</CardTitle>
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
                    <span className="font-medium">{booking.serviceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wall Type:</span>
                    <span className="font-medium">{booking.wallType}</span>
                  </div>
                  {booking.mountType && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mount Type:</span>
                      <span className="font-medium">{booking.mountType}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Schedule & Contact</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{formatDate(booking.scheduledDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{getTimeSlotText(booking.timeSlot)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="font-medium text-lg">€{Number(booking.totalPrice).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Preview Section */}
            {booking.roomPhotoUrl && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">AI Room Preview</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Original Room</p>
                    <img 
                      src={booking.roomPhotoUrl} 
                      alt="Room before TV installation" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  {booking.aiPreviewUrl && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">AI Preview</p>
                      <img 
                        src={booking.aiPreviewUrl} 
                        alt="AI preview of TV installation" 
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
