import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Phone, Mail, Package, CreditCard, User, Plus, ArrowRight, Tv, Zap, Wrench, Droplets, Hammer } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navigation from '@/components/navigation';
import Footer from '@/components/Footer';
import { Link } from 'wouter';

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
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Request Submitted' },
      'open': { color: 'bg-yellow-100 text-yellow-800', text: 'Request Submitted' },
      'assigned': { color: 'bg-purple-100 text-purple-800', text: 'Installer Assigned' },
      'confirmed': { color: 'bg-blue-100 text-blue-800', text: 'Installer Confirmed' },
      'in_progress': { color: 'bg-orange-100 text-orange-800', text: 'Installation in Progress' },
      'completed': { color: 'bg-green-100 text-green-800', text: 'Installation Complete' },
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
            Enter your QR code (e.g., BK-abc123xyz9), retailer invoice (e.g., HN-GAL-009876, CR-DUB-123456), or booking reference number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="BK-abc123xyz9, HN-GAL-009876, CR-DUB-123456, or booking reference"
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
            <div className="space-y-6">
              <Alert className="mb-6">
                <AlertDescription>
                  Booking not found. Please check your QR code or booking reference and try again.
                </AlertDescription>
              </Alert>
              
              {/* No Booking Found - CTA Section */}
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl text-blue-900">No Booking Found</CardTitle>
                  <CardDescription className="text-blue-700">
                    Don't worry! You can easily create a new booking or try different tracking methods.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Create New Booking */}
                    <div className="p-4 bg-white rounded-lg border">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-green-600" />
                        Create New Booking
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Book your TV installation in minutes with our easy booking system.
                      </p>
                      <Link href="/book-installation">
                        <Button className="w-full gradient-bg">
                          Book Now <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                    
                    {/* Alternative Tracking Methods */}
                    <div className="p-4 bg-white rounded-lg border">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        Alternative Tracking
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Try these other ways to find your booking:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1 mb-3">
                        <li>• Retailer invoice number</li>
                        <li>• Email confirmation code</li>
                        <li>• Phone number used for booking</li>
                      </ul>
                      <Button variant="outline" className="w-full" onClick={() => setTrackingCode('')}>
                        Try Different Code
                      </Button>
                    </div>
                  </div>
                  
                  {/* Contact Support */}
                  <div className="mt-6 p-4 bg-gray-100 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Still can't find your booking?
                    </p>
                    <p className="text-sm">
                      Contact us at <a href="mailto:support@tradesbook.ie" className="text-blue-600 hover:underline font-medium">support@tradesbook.ie</a> or call <a href="tel:+35312345678" className="text-blue-600 hover:underline font-medium">01 234 5678</a>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
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

      {/* Book Service Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Book a Service
          </CardTitle>
          <CardDescription>
            Ready to book a new service? TV Installation is available now, with more trades coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* TV Installation - Active */}
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tv className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">TV Installation</h3>
                </div>
                <Badge className="bg-green-100 text-green-800">Available</Badge>
              </div>
              <p className="text-sm text-blue-700 mb-4">Professional TV wall mounting and setup services by certified installers.</p>
              <Link href="/booking?service=tv-installation">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Book TV Installation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Electrical - Coming Soon */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-700">Electrical Services</h3>
                </div>
                <Badge className="bg-gray-100 text-gray-600">Coming Soon</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-4">Electrical repairs, installations, and safety inspections.</p>
              <Button disabled className="w-full">
                Coming Soon
              </Button>
            </div>

            {/* Plumbing - Coming Soon */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-700">Plumbing</h3>
                </div>
                <Badge className="bg-gray-100 text-gray-600">Coming Soon</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-4">Pipe repairs, fixture installations, and emergency callouts.</p>
              <Button disabled className="w-full">
                Coming Soon
              </Button>
            </div>

            {/* General Maintenance - Coming Soon */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-700">General Maintenance</h3>
                </div>
                <Badge className="bg-gray-100 text-gray-600">Coming Soon</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-4">Home repairs, furniture assembly, and maintenance tasks.</p>
              <Button disabled className="w-full">
                Coming Soon
              </Button>
            </div>

            {/* Home Improvement - Coming Soon */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Hammer className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-700">Home Improvement</h3>
                </div>
                <Badge className="bg-gray-100 text-gray-600">Coming Soon</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-4">Kitchen fitting, bathroom renovations, and home upgrades.</p>
              <Button disabled className="w-full">
                Coming Soon
              </Button>
            </div>

            {/* More Services - Coming Soon */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-700">More Services</h3>
                </div>
                <Badge className="bg-gray-100 text-gray-600">Coming Soon</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-4">Expanding to cover all your home service needs.</p>
              <Button disabled className="w-full">
                Coming Soon
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">How to find your tracking code:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li><strong>Retailer Invoice:</strong> Use your receipt number (e.g., HN-GAL-009876, CR-DUB-123456, RT-BLA-555666)</li>
              <li><strong>QR Code:</strong> Check your booking confirmation email for the QR code (e.g., BK-abc123xyz9)</li>
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
      <Footer />
    </div>
  );
}