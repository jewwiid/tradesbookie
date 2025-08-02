import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Mail, Phone, Tv, Settings, CheckCircle, Clock, AlertCircle, User, CreditCard, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navigation from '@/components/navigation';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
  
  // MAC Address fields
  macAddress?: string;
  macAddressProvided: boolean;
  macAddressProvidedAt?: string;
  recommendedApp?: string;
  appDownloadInstructions?: string;
  
  // Credentials fields
  credentialsProvided: boolean;
  credentialsEmailSent: boolean;
  credentialsSentAt?: string;
  credentialsType?: string;
  
  // IPTV credentials
  serverHostname?: string;
  serverUsername?: string;
  serverPassword?: string;
  numberOfDevices?: number;
  m3uUrl?: string;
  
  // Payment for credentials
  credentialsPaymentRequired: boolean;
  credentialsPaymentStatus: string;
  credentialsPaymentAmount?: string;
  credentialsPaidAt?: string;
  
  // Admin tracking
  adminNotes?: string;
  assignedTo?: string;
  completedAt?: string;
}

export default function TvSetupTracker() {
  const [bookingId, setBookingId] = useState('');
  const [email, setEmail] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [macAddress, setMacAddress] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();



  // Check URL parameters on component mount but don't automatically search
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlBookingId = urlParams.get('bookingId');
    const urlEmail = urlParams.get('email');
    
    if (urlBookingId) {
      setBookingId(urlBookingId);
      // Don't automatically set searchAttempted to true
    } else if (urlEmail) {
      setEmail(urlEmail);
      // Don't automatically set searchAttempted to true
    }
  }, []);

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

  // MAC Address formatting and validation
  const isValidMacAddress = (mac: string) => {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
  };

  const formatMacAddress = (value: string) => {
    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^0-9A-Fa-f]/gi, '');
    
    // Add colons every 2 characters
    const formatted = cleaned.match(/.{1,2}/g)?.join(':') || cleaned;
    
    // Limit to 17 characters (XX:XX:XX:XX:XX:XX)
    return formatted.slice(0, 17).toUpperCase();
  };

  const handleMacAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatMacAddress(e.target.value);
    setMacAddress(formatted);
  };

  const submitMacAddress = useMutation({
    mutationFn: async () => {
      if (!booking?.id || !macAddress.trim() || !isValidMacAddress(macAddress)) return;
      return apiRequest('PUT', `/api/tv-setup-bookings/${booking.id}/mac-address`, {
        macAddress: macAddress.trim()
      });
    },
    onSuccess: () => {
      toast({
        title: "MAC Address Submitted",
        description: "Your device MAC address has been submitted successfully. Admin will prepare your credentials soon.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tv-setup-tracker'] });
      setMacAddress('');
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit MAC address. Please try again.",
        variant: "destructive",
      });
    }
  });

  const initiateCredentialsPayment = useMutation({
    mutationFn: async () => {
      if (!booking?.id) return;
      return apiRequest('POST', `/api/tv-setup-bookings/${booking.id}/payment`, {});
    },
    onSuccess: (data: any) => {
      if (data.stripeUrl) {
        window.location.href = data.stripeUrl;
      } else {
        toast({
          title: "Payment Error",
          description: "Failed to create payment session. Please contact support.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Waiting for Setup', icon: Clock },
      'mac_required': { color: 'bg-blue-100 text-blue-800', text: 'MAC Address Required', icon: Tv },
      'credentials_ready': { color: 'bg-purple-100 text-purple-800', text: 'Credentials Ready', icon: Settings },
      'payment_required': { color: 'bg-orange-100 text-orange-800', text: 'Payment Required', icon: CreditCard },
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
        title: 'Booking Confirmed', 
        completed: true, 
        date: booking.createdAt,
        description: 'Your TV setup request has been received and confirmed'
      },
      { 
        title: 'MAC Address Required', 
        completed: booking.macAddressProvided, 
        date: booking.macAddressProvidedAt,
        description: booking.recommendedApp 
          ? `Please download ${booking.recommendedApp} and provide your device MAC address`
          : 'Admin will recommend the best app for your TV model'
      },
      { 
        title: 'Credentials Ready', 
        completed: booking.credentialsProvided, 
        date: booking.credentialsSentAt,
        description: booking.credentialsProvided 
          ? 'Your streaming login credentials are ready for payment'
          : 'Login credentials will be prepared after MAC address is provided'
      },
      { 
        title: 'Payment Required', 
        completed: booking.credentialsPaymentStatus === 'paid', 
        date: booking.credentialsPaidAt,
        description: booking.credentialsPaymentRequired 
          ? `Payment of €${booking.credentialsPaymentAmount || booking.paymentAmount} required to access credentials`
          : 'Complete payment to access your login credentials'
      },
      { 
        title: 'Setup Complete', 
        completed: booking.setupStatus === 'completed', 
        date: booking.completedAt,
        description: 'All streaming apps are configured and ready to use'
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

        {/* Instructions - Show when no search has been attempted */}
        {!searchAttempted && !booking && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                How to Track Your TV Setup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Enter Your Information</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use either your booking ID (from your confirmation email) or the email address you used when booking.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">View Your Setup Progress</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      See real-time updates on your TV setup status, from initial booking to completion.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Take Required Actions</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Complete any requested steps like providing MAC address or making payments.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Details - Only show after successful search */}
        {booking && searchAttempted && (
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
                        
                        {/* MAC Address Input Field - Only show for MAC Address Required step when not completed */}
                        {step.title === 'MAC Address Required' && !step.completed && (
                          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            {booking.recommendedApp && (
                              <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 rounded-md">
                                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                                  Recommended App: {booking.recommendedApp}
                                </h5>
                                {booking.appDownloadInstructions && (
                                  <div className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-line">
                                    {booking.appDownloadInstructions}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="space-y-3">
                              <div>
                                <label htmlFor="macAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  MAC Address *
                                </label>
                                <Input
                                  id="macAddress"
                                  type="text"
                                  placeholder="Enter MAC address (XX:XX:XX:XX:XX:XX)"
                                  value={macAddress}
                                  onChange={handleMacAddressChange}
                                  className="font-mono"
                                  maxLength={17}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Find this in your TV/device network settings. It's usually labeled as "MAC Address", "Wi-Fi MAC", or "Ethernet MAC".
                                </p>
                                {macAddress && !isValidMacAddress(macAddress) && (
                                  <p className="text-sm text-red-500 mt-2">
                                    Please enter a valid MAC address format (XX:XX:XX:XX:XX:XX)
                                  </p>
                                )}
                              </div>
                              <Button 
                                onClick={() => submitMacAddress.mutate()}
                                disabled={!isValidMacAddress(macAddress) || submitMacAddress.isPending}
                                className="w-full"
                                size="sm"
                              >
                                {submitMacAddress.isPending ? 'Submitting...' : 'Submit MAC Address'}
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Show MAC Address when completed */}
                        {step.title === 'MAC Address Required' && step.completed && booking.macAddress && (
                          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm">
                            <span className="text-green-700 dark:text-green-300 font-mono">{booking.macAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>



            {/* Payment for Credentials */}
            {booking && booking.setupStatus === 'payment_required' && booking.credentialsProvided && booking.credentialsPaymentStatus === 'pending' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Required
                  </CardTitle>
                  <CardDescription>
                    Your streaming credentials are ready! Complete payment to access your login details.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">✅ Credentials Ready</h4>
                      <p className="text-sm text-green-800">
                        Your {booking.credentialsType === 'iptv' ? 'IPTV server' : 'email account'} credentials have been prepared and are ready for use.
                      </p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Payment Amount</p>
                        <p className="text-sm text-gray-600">One-time payment for credentials access</p>
                      </div>
                      <p className="text-2xl font-bold">
                        €{booking.credentialsPaymentAmount || booking.paymentAmount}
                      </p>
                    </div>
                    <Button 
                      onClick={() => initiateCredentialsPayment.mutate()}
                      disabled={initiateCredentialsPayment.isPending}
                      className="w-full"
                      size="lg"
                    >
                      {initiateCredentialsPayment.isPending ? 'Processing...' : 'Pay Now'}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      Secure payment powered by Stripe. You'll be redirected to complete payment.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Credentials Access (After Payment) */}
            {booking && booking.credentialsPaymentStatus === 'paid' && booking.credentialsProvided && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Your Streaming Credentials
                  </CardTitle>
                  <CardDescription>
                    Payment confirmed! Here are your streaming login details.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Your credentials are now active and ready to use! Setup complete.
                      </AlertDescription>
                    </Alert>
                    
                    {booking.credentialsType === 'iptv' && booking.serverHostname && (
                      <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <h4 className="font-medium">IPTV Server Details</h4>
                        <div className="grid gap-2 text-sm">
                          <div>
                            <span className="font-medium">Server:</span> 
                            <code className="ml-2 px-2 py-1 bg-white rounded">{booking.serverHostname}</code>
                          </div>
                          <div>
                            <span className="font-medium">Username:</span> 
                            <code className="ml-2 px-2 py-1 bg-white rounded">{booking.serverUsername}</code>
                          </div>
                          <div>
                            <span className="font-medium">Password:</span> 
                            <code className="ml-2 px-2 py-1 bg-white rounded">{booking.serverPassword}</code>
                          </div>
                          {booking.m3uUrl && (
                            <div>
                              <span className="font-medium">M3U URL:</span> 
                              <code className="ml-2 px-2 py-1 bg-white rounded text-xs break-all">{booking.m3uUrl}</code>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {booking.credentialsType === 'm3u_url' && booking.m3uUrl && (
                      <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <h4 className="font-medium">M3U URL</h4>
                        <div className="grid gap-2 text-sm">
                          <div>
                            <span className="font-medium">M3U URL:</span> 
                            <code className="ml-2 px-2 py-1 bg-white rounded text-xs break-all">{booking.m3uUrl}</code>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• Keep these credentials safe and secure</p>
                      <p>• Use these details to log into the recommended streaming app</p>
                      <p>• Contact support if you experience any issues</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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