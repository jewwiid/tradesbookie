import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Mail, Phone, Tv, Settings, CheckCircle, Clock, AlertCircle, User, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navigation from '@/components/navigation';
import { formatDate } from '@/lib/utils';

interface TvSetupBookingDetails {
  id: number;
  name: string;
  email: string;
  mobile: string;
  tvBrand: string;
  tvModel: string;
  isSmartTv: string;
  tvOs?: string;
  yearOfPurchase: number;
  setupStatus: string;
  paymentAmount: string;
  originalAmount?: string;
  discountAmount?: string;
  referralCode?: string;
  salesStaffName?: string;
  salesStaffStore?: string;
  additionalNotes?: string;
  preferredSetupDate?: string;
  createdAt: string;
  updatedAt: string;
  credentialsProvided: boolean;
  credentialsEmailSent: boolean;
  credentialsSentAt?: string;
  adminNotes?: string;
  assignedTo?: string;
  completedAt?: string;
}

export default function TvSetupTracker() {
  const [bookingId, setBookingId] = useState('');
  const [email, setEmail] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false);

  const { data: booking, isLoading, error } = useQuery<TvSetupBookingDetails>({
    queryKey: ['/api/tv-setup-tracker', bookingId, email],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (bookingId) params.append('bookingId', bookingId);
      if (email) params.append('email', email);
      
      const response = await fetch(`/api/tv-setup-tracker?${params.toString()}`);
      if (!response.ok) {
        throw new Error('TV setup booking not found');
      }
      return response.json();
    },
    enabled: searchAttempted && (bookingId.length > 0 || email.length > 0),
    retry: false,
  });

  const handleSearch = () => {
    if (bookingId.trim() || email.trim()) {
      setSearchAttempted(true);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Setup', icon: Clock },
      'scheduled': { color: 'bg-blue-100 text-blue-800', text: 'Scheduled', icon: CalendarDays },
      'in_progress': { color: 'bg-orange-100 text-orange-800', text: 'Setup in Progress', icon: Settings },
      'completed': { color: 'bg-green-100 text-green-800', text: 'Setup Complete', icon: CheckCircle },
      'cancelled': { color: 'bg-red-100 text-red-800', text: 'Cancelled', icon: AlertCircle },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const IconComponent = statusInfo.icon;
    
    return (
      <div className="flex items-center gap-2">
        <IconComponent className="w-4 h-4" />
        <Badge className={statusInfo.color}>{statusInfo.text}</Badge>
      </div>
    );
  };

  const getSetupProgress = (booking: TvSetupBookingDetails) => {
    const steps = [
      { 
        title: 'Booking Received', 
        completed: true, 
        date: booking.createdAt,
        description: 'Your TV setup request has been received and confirmed'
      },
      { 
        title: 'Credentials Prepared', 
        completed: booking.credentialsProvided, 
        date: booking.credentialsSentAt,
        description: 'Login credentials for streaming apps are being prepared'
      },
      { 
        title: 'Setup Session', 
        completed: booking.setupStatus === 'in_progress' || booking.setupStatus === 'completed', 
        date: booking.preferredSetupDate,
        description: 'Remote assistance session to configure your TV and apps'
      },
      { 
        title: 'Setup Complete', 
        completed: booking.setupStatus === 'completed', 
        date: booking.completedAt,
        description: 'All apps configured and ready to use on your TV'
      }
    ];

    return steps;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            TV Setup Tracker
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Track the progress of your smart TV setup and streaming app configuration
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tv className="w-5 h-5" />
              Find Your TV Setup Booking
            </CardTitle>
            <CardDescription>
              Enter your booking ID or email address to track your setup progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bookingId" className="block text-sm font-medium mb-2">
                  Booking ID (Optional)
                </label>
                <Input
                  id="bookingId"
                  type="text"
                  placeholder="e.g., 12345"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <Button 
              onClick={handleSearch} 
              className="w-full mt-4"
              disabled={isLoading || (!bookingId.trim() && !email.trim())}
            >
              {isLoading ? 'Searching...' : 'Track My Setup'}
            </Button>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && searchAttempted && (
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No TV setup booking found with the provided information. Please check your booking ID or email address.
            </AlertDescription>
          </Alert>
        )}

        {/* Booking Details */}
        {booking && (
          <div className="space-y-6">
            {/* Status Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      TV Setup Booking #{booking.id}
                    </CardTitle>
                    <CardDescription>
                      Created on {formatDate(booking.createdAt)}
                    </CardDescription>
                  </div>
                  {getStatusBadge(booking.setupStatus)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium">{booking.name}</p>
                        <p className="text-sm text-gray-600">{booking.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <p className="font-medium">{booking.mobile}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Tv className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium">{booking.tvBrand} {booking.tvModel}</p>
                        <p className="text-sm text-gray-600">
                          {booking.isSmartTv === 'yes' ? 'Smart TV' : 'Regular TV'} 
                          {booking.tvOs && ` • ${booking.tvOs}`} 
                          • {booking.yearOfPurchase}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium">€{booking.paymentAmount}</p>
                        {booking.referralCode && (
                          <p className="text-sm text-green-600">
                            Referral discount applied: €{booking.discountAmount}
                          </p>
                        )}
                      </div>
                    </div>
                    {booking.referralCode && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-green-800">
                          Harvey Norman Referral: {booking.referralCode}
                        </p>
                        <p className="text-xs text-green-600">
                          {booking.salesStaffName} • {booking.salesStaffStore}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {booking.additionalNotes && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Notes:</strong> {booking.additionalNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Setup Progress</CardTitle>
                <CardDescription>
                  Track the current status of your TV setup process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {getSetupProgress(booking).map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium ${
                            step.completed ? 'text-green-900' : 'text-gray-600'
                          }`}>
                            {step.title}
                          </h4>
                          {step.date && (
                            <span className="text-sm text-gray-500">
                              {formatDate(step.date)}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${
                          step.completed ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Admin Updates */}
            {booking.adminNotes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Setup Updates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-800">{booking.adminNotes}</p>
                    {booking.assignedTo && (
                      <p className="text-sm text-blue-600 mt-2">
                        Assigned to: {booking.assignedTo}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a href="mailto:support@tradesbook.ie" className="text-blue-600 hover:underline">
                      support@tradesbook.ie
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>Available in your confirmation email</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}