import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Phone, Mail, Package, CreditCard, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navigation from '@/components/navigation';

interface BookingDetails {
  id: number;
  qrCode: string;
  status: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  tvSize: string;
  serviceType: string;
  wallType: string;
  mountType: string;
  addons: string[];
  estimatedTotal: string;
  scheduledDate: string | null;
  createdAt: string;
  installerName?: string;
  installerPhone?: string;
  difficulty?: string;
  notes?: string;
}

export default function BookingTracker() {
  const [trackingCode, setTrackingCode] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false);

  const { data: booking, isLoading, error } = useQuery<BookingDetails>({
    queryKey: ['/api/booking-tracker', trackingCode],
    queryFn: async () => {
      const response = await fetch(`/api/booking-tracker?code=${encodeURIComponent(trackingCode)}`);
      if (!response.ok) {
        throw new Error('Booking not found');
      }
      return response.json();
    },
    enabled: searchAttempted && trackingCode.length > 0,
    retry: false,
  });

  const handleSearch = () => {
    if (trackingCode.trim()) {
      // Redirect to the detailed tracking page for unified experience
      window.location.href = `/track/${trackingCode.trim()}`;
      return;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'confirmed': { color: 'bg-blue-100 text-blue-800', text: 'Confirmed' },
      'assigned': { color: 'bg-purple-100 text-purple-800', text: 'Installer Assigned' },
      'in_progress': { color: 'bg-orange-100 text-orange-800', text: 'In Progress' },
      'completed': { color: 'bg-green-100 text-green-800', text: 'Completed' },
      'cancelled': { color: 'bg-red-100 text-red-800', text: 'Cancelled' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge className={statusInfo.color}>{statusInfo.text}</Badge>;
  };

  const getDifficultyBadge = (difficulty: string | undefined) => {
    if (!difficulty) return null;
    
    const difficultyMap = {
      'easy': { color: 'bg-green-100 text-green-800', text: 'Easy' },
      'moderate': { color: 'bg-yellow-100 text-yellow-800', text: 'Moderate' },
      'difficult': { color: 'bg-orange-100 text-orange-800', text: 'Difficult' },
      'expert': { color: 'bg-red-100 text-red-800', text: 'Expert' },
    };
    
    const diffInfo = difficultyMap[difficulty as keyof typeof difficultyMap] || difficultyMap.moderate;
    return <Badge className={diffInfo.color}>{diffInfo.text}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Installation</h1>
        <p className="text-gray-600">Enter your QR code or booking reference to view your installation details and status</p>
      </div>

      {/* Search Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Find Your Booking
          </CardTitle>
          <CardDescription>
            Enter your QR code (e.g., BK-abc123xyz9) or booking reference number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="BK-abc123xyz9 or booking reference"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={!trackingCode.trim() || isLoading}>
              {isLoading ? 'Searching...' : 'Track Booking'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {searchAttempted && (
        <>
          {error && (
            <Alert className="mb-6">
              <AlertDescription>
                Booking not found. Please check your QR code or booking reference and try again.
              </AlertDescription>
            </Alert>
          )}

          {booking && (
            <div className="space-y-6">
              {/* Status Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Booking #{booking.qrCode}</CardTitle>
                      <CardDescription>Created on {new Date(booking.createdAt).toLocaleDateString()}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(booking.status)}
                      {getDifficultyBadge(booking.difficulty)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Customer Information */}
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Customer Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>Name:</strong> {booking.contactName}</p>
                        <p className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {booking.contactEmail}
                        </p>
                        <p className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {booking.contactPhone}
                        </p>
                        <p className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {booking.address}
                        </p>
                      </div>
                    </div>

                    {/* Installation Details */}
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Installation Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>TV Size:</strong> {booking.tvSize}</p>
                        <p><strong>Service:</strong> {booking.serviceType}</p>
                        <p><strong>Wall Type:</strong> {booking.wallType}</p>
                        <p><strong>Mount Type:</strong> {booking.mountType}</p>
                        {booking.addons && booking.addons.length > 0 && (
                          <p><strong>Add-ons:</strong> {
                            Array.isArray(booking.addons) 
                              ? booking.addons.map((addon: any) => 
                                  typeof addon === 'string' ? addon : addon.name || addon.key
                                ).join(', ')
                              : booking.addons
                          }</p>
                        )}
                        <p className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          <strong>Total:</strong> €{booking.estimatedTotal}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Scheduled Date */}
                  {booking.scheduledDate && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        Scheduled Installation
                      </h3>
                      <p className="text-sm">
                        {new Date(booking.scheduledDate).toLocaleDateString('en-IE', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  {/* Installer Information */}
                  {booking.installerName && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg">
                      <h3 className="font-semibold mb-2">Assigned Installer</h3>
                      <div className="text-sm">
                        <p><strong>Name:</strong> {booking.installerName}</p>
                        {booking.installerPhone && (
                          <p className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.installerPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {booking.notes && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold mb-2">Installation Notes</h3>
                      <p className="text-sm">{booking.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {booking.status === 'pending' && (
                      <p>Your booking is being reviewed. You'll receive confirmation within 24 hours.</p>
                    )}
                    {booking.status === 'confirmed' && (
                      <p>Your booking is confirmed. An installer will be assigned soon.</p>
                    )}
                    {booking.status === 'assigned' && (
                      <p>An installer has been assigned to your booking. They will contact you to schedule the installation.</p>
                    )}
                    {booking.status === 'in_progress' && (
                      <p>Your installation is currently in progress.</p>
                    )}
                    {booking.status === 'completed' && (
                      <p>Your installation has been completed. Thank you for choosing tradesbook.ie!</p>
                    )}
                    
                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-500">
                        For questions or updates, contact us at <strong>support@tradesbook.ie</strong> or call <strong>01 234 5678</strong>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">How to find your tracking code:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li><strong>QR Code:</strong> Check your booking confirmation email for the QR code (e.g., BK-abc123xyz9)</li>
              <li><strong>Invoice Users:</strong> Use your Harvey Norman invoice number (e.g., HN-CRK-2576597)</li>
              <li><strong>Guest Users:</strong> Check your email for the booking reference sent after confirmation</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Different ways to track:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li><strong>OAuth Users:</strong> Sign in to view your bookings in your dashboard</li>
              <li><strong>Invoice/Guest Users:</strong> Use this tracking page with your reference number</li>
              <li><strong>Manual Users:</strong> Contact support with your booking details</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}