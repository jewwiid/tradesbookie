import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Clock, User, Phone, Mail, CheckCircle, AlertCircle, Star, Home, Tv, Calendar, Euro, QrCode, AlertTriangle, LogIn, UserPlus, RefreshCw, Edit3, Save, X, Users, Award, ChevronRight, Bot, Gift, HelpCircle, Settings, Zap, Search, MessageSquare, Bell, Wallet, CreditCard, Send } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';
import ReviewInterface from '@/components/customer/ReviewInterface';
import InstallerMiniProfile from '@/components/installer/InstallerMiniProfile';
import ScheduleNegotiation from '@/components/ScheduleNegotiation';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  emailVerified?: boolean;
  registrationMethod?: string;
}

interface Booking {
  id: number;
  qrCode: string;
  address: string;
  tvSize: string;
  serviceType: string;
  estimatedPrice: string;
  estimatedTotal?: string;
  status: string;
  contactName: string;
  installerId?: number;
  createdAt?: string;
  // Multi-TV support
  tvInstallations?: Array<{
    tvSize: string;
    serviceType: string;
    location: string;
    mountType?: string;
    needsWallMount?: boolean;
    wallMountOption?: string;
    addons?: any[];
    price?: string;
  }>;
  installer?: {
    id: number;
    businessName: string;
    contactName: string;
    phone: string;
    profileImageUrl?: string;
    averageRating: number;
    totalReviews: number;
    serviceArea: string;
    isVip?: boolean;
  };
  // Star system fields
  qualityStars?: number;
  photoStars?: number;
  reviewStars?: number;
}

interface InterestedInstaller {
  id: number;
  bookingId: number;
  status: string;
  leadFee: string;
  installer: {
    id: number;
    businessName: string;
    contactName?: string;
    phone?: string;
    serviceArea: string;
    yearsExperience: number;
    profileImageUrl?: string;
    rating?: number;
    averageRating: number;
    totalReviews: number;
  };
}

interface TvSetupBooking {
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
  
  // IPTV credentials (only shown after payment)
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

export default function CustomerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [sendingVerification, setSendingVerification] = useState(false);
  const [showGuestUpgradeDialog, setShowGuestUpgradeDialog] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [showInstallerSelection, setShowInstallerSelection] = useState<number | null>(null);
  const [selectedBookingInstallers, setSelectedBookingInstallers] = useState<InterestedInstaller[]>([]);
  const [selectingInstaller, setSelectingInstaller] = useState(false);

  // AI Services states
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Referral states
  const [referralCode, setReferralCode] = useState('');
  const [referralEarnings, setReferralEarnings] = useState(0);
  
  // Support states
  const [supportMessage, setSupportMessage] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('bookings');
  
  // Messaging states
  const [messageText, setMessageText] = useState('');
  const [selectedInstaller, setSelectedInstaller] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
  // Wallet states
  const [walletBalance, setWalletBalance] = useState(0);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);

  // Get current user
  const { data: user, isLoading: userLoading, error: userError } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Get user's bookings only if user exists (including invoice-authenticated users)
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/auth/user/bookings'],
    enabled: !!user,
  });

  // Get user's TV setup bookings
  const { data: tvSetupBookings = [], isLoading: tvSetupLoading } = useQuery<TvSetupBooking[]>({
    queryKey: ['/api/auth/user/tv-setup-bookings'],
    enabled: !!user,
  });

  const handleResendVerification = async () => {
    if (!verificationEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address to resend verification.",
        variant: "destructive"
      });
      return;
    }

    setSendingVerification(true);
    try {
      const response = await apiRequest('POST', '/api/auth/send-verification', { email: verificationEmail }) as { message?: string };
      
      if (response.message) {
        toast({
          title: "Verification email sent",
          description: response.message
        });
        setShowVerificationDialog(false);
        setVerificationEmail('');
      }
    } catch (error) {
      toast({
        title: "Failed to send verification",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setSendingVerification(false);
    }
  };

  const handleSignUp = () => {
    setLocation('/api/signup?returnTo=/customer-dashboard');
  };

  const handleSignIn = () => {
    setLocation('/api/login?returnTo=/customer-dashboard');
  };

  const handleUpgradeAccount = () => {
    setShowGuestUpgradeDialog(false);
    setLocation('/api/signup?returnTo=/customer-dashboard');
  };

  const handleEditProfile = () => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      });
      setShowProfileEdit(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setEditingProfile(true);
    try {
      const response = await apiRequest('PATCH', '/api/auth/profile', profileData) as { message?: string };
      
      if (response.message) {
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated."
        });
        
        // Invalidate user query to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        setShowProfileEdit(false);
      }
    } catch (error) {
      toast({
        title: "Failed to update profile",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setEditingProfile(false);
    }
  };

  const handleViewInstallers = async (bookingId: number) => {
    try {
      const installers = await apiRequest('GET', `/api/booking/${bookingId}/interested-installers`) as InterestedInstaller[];
      setSelectedBookingInstallers(installers);
      setShowInstallerSelection(bookingId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load interested installers.",
        variant: "destructive"
      });
    }
  };

  const handleSelectInstaller = async (bookingId: number, installerId: number) => {
    setSelectingInstaller(true);
    try {
      const response = await apiRequest('POST', `/api/booking/${bookingId}/select-installer`, {
        installerId
      }) as { success: boolean; message: string; selectedInstaller: any; refundedInstallers: number };
      
      if (response.success) {
        toast({
          title: "Installer Selected",
          description: response.message
        });
        
        // Refresh bookings data
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user/bookings'] });
        setShowInstallerSelection(null);
        setSelectedBookingInstallers([]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to select installer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSelectingInstaller(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Handle different user states
  if (userError || !user) {
    // User is not authenticated - show authentication options
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
          <div className="text-center mb-8">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Required</h2>
            <p className="text-gray-600">Sign in to access your customer dashboard and view your bookings.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Sign In Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <LogIn className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Access your existing account and view your bookings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">Sign in if you have:</p>
                  <ul className="space-y-1">
                    <li>• Existing bookings</li>
                    <li>• A verified email account</li>
                    <li>• Retailer invoice</li>
                  </ul>
                </div>
                <Button onClick={handleSignIn} className="w-full">
                  Sign In to Dashboard
                </Button>
              </CardContent>
            </Card>

            {/* Sign Up Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <UserPlus className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  New customer? Create an account to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">Sign up to get:</p>
                  <ul className="space-y-1">
                    <li>• Full booking history</li>
                    <li>• Email notifications</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
                <Button onClick={handleSignUp} className="w-full" variant="outline">
                  Create New Account
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Track Booking Alternative */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <QrCode className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <h3 className="font-semibold mb-2">Track Your Booking</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Have a QR code or booking ID? Track your installation without signing in.
                </p>
                <Button onClick={() => setLocation('/booking-tracker')} variant="outline">
                  Track Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // User is authenticated but email not verified
  if (user.emailVerified === false) {
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
          <div className="text-center mb-8">
            <Mail className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verification Required</h2>
            <p className="text-gray-600">Please verify your email address to access your full dashboard.</p>
          </div>

          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your email <strong>{user.email}</strong> needs to be verified to access all features.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Check your email inbox for a verification link, or click below to send a new one.
                </p>
                
                <Button 
                  onClick={() => {
                    setVerificationEmail(user.email || '');
                    setShowVerificationDialog(true);
                  }} 
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verification Dialog */}
        <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resend Verification Email</DialogTitle>
              <DialogDescription>
                Enter your email address to receive a new verification link.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="verification-email">Email Address</Label>
                <Input
                  id="verification-email"
                  type="email"
                  placeholder="Your email address"
                  value={verificationEmail}
                  onChange={(e) => setVerificationEmail(e.target.value)}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowVerificationDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleResendVerification}
                  disabled={sendingVerification}
                >
                  {sendingVerification && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  Send Verification
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Guest user - show upgrade prompt
  if (user.registrationMethod === 'guest') {
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
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Guest Access:</strong> You're viewing a limited dashboard. 
              <button 
                onClick={() => setShowGuestUpgradeDialog(true)}
                className="ml-1 text-blue-600 hover:underline"
              >
                Upgrade to full account
              </button> for complete access.
            </AlertDescription>
          </Alert>

          {/* Show bookings for guest user */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Your Bookings</h2>
              <Button onClick={() => setLocation('/booking')} className="gradient-bg">
                <Calendar className="w-4 h-4 mr-2" />
                Book Installation
              </Button>
            </div>

            {bookingsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Tv className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Bookings Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start by booking your first TV installation.
                  </p>
                  <Button onClick={() => setLocation('/booking')} className="gradient-bg">
                    Book Your First Installation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {bookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} onViewInstallers={handleViewInstallers} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Guest Upgrade Dialog */}
        <Dialog open={showGuestUpgradeDialog} onOpenChange={setShowGuestUpgradeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upgrade to Full Account</DialogTitle>
              <DialogDescription>
                Get the complete tradesbook.ie experience with a full account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Guest Access</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Limited bookings</li>
                    <li>• Basic tracking</li>
                    <li>• No email notifications</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Full Account</h4>
                  <ul className="text-green-600 space-y-1">
                    <li>• Unlimited bookings</li>
                    <li>• Complete history</li>
                    <li>• Email notifications</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowGuestUpgradeDialog(false)}
                >
                  Continue as Guest
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleUpgradeAccount}
                >
                  Upgrade Account
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Installer Selection Dialog */}
        <Dialog open={showInstallerSelection !== null} onOpenChange={() => setShowInstallerSelection(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Select Your Installer</DialogTitle>
              <DialogDescription>
                {selectedBookingInstallers.length} installer{selectedBookingInstallers.length !== 1 ? 's have' : ' has'} purchased your lead. Choose your preferred installer to proceed.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedBookingInstallers.map((item) => (
                <Card key={item.installer.id} className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          {item.installer.profileImageUrl ? (
                            <img 
                              src={item.installer.profileImageUrl} 
                              alt={item.installer.businessName}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <User className="w-8 h-8 text-white" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{item.installer.businessName}</h3>
                            {item.installer.contactName && (
                              <p className="text-gray-600">{item.installer.contactName}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2">
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{item.installer.serviceArea}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{item.installer.yearsExperience} years experience</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Rating & Reviews</h4>
                            <div className="flex items-center space-x-2">
                              {item.installer.averageRating > 0 ? (
                                <>
                                  <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star <= Math.round(item.installer.averageRating)
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">
                                    {item.installer.averageRating.toFixed(1)}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    ({item.installer.totalReviews} review{item.installer.totalReviews !== 1 ? 's' : ''})
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm text-gray-500">No reviews yet</span>
                              )}
                            </div>
                            {item.installer.rating && (
                              <div className="mt-2 flex items-center space-x-2">
                                <Award className="w-4 h-4 text-blue-500" />
                                <span className="text-sm text-gray-600">Admin Score: {item.installer.rating}/10</span>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Lead Details</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Lead Fee Paid:</span>
                                <span className="font-medium">€{item.leadFee}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Status:</span>
                                <Badge variant="outline" className="text-xs">
                                  {item.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <Button
                          onClick={() => showInstallerSelection && handleSelectInstaller(showInstallerSelection, item.installer.id)}
                          disabled={selectingInstaller}
                          className="gradient-bg min-w-[120px]"
                        >
                          {selectingInstaller ? (
                            <>Loading...</>
                          ) : (
                            <>Select <ChevronRight className="w-4 h-4 ml-1" /></>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {selectedBookingInstallers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Installers Yet</h3>
                  <p className="text-gray-600">
                    No installers have purchased your lead yet. Please check back later.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowInstallerSelection(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Full authenticated user - show complete dashboard
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
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.firstName || user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleEditProfile}>
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" onClick={() => setLocation('/')}>
                <Home className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Email Verification Banner */}
        <EmailVerificationBanner user={{
          id: String(user.id),
          email: user.email,
          emailVerified: user.emailVerified || false,
          firstName: user.firstName
        }} />
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to your Dashboard</h2>
              <p className="text-blue-100">
                Manage bookings, use AI services, track referrals, and get support.
              </p>
            </div>
            <div className="hidden md:block">
              <User className="h-16 w-16 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="ai-services" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI Services
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="messaging" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Wallet
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Support
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                      <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {bookings.filter(b => b.status === 'completed').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-orange-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">In Progress</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {bookings.filter(b => ['open', 'confirmed', 'in-progress'].includes(b.status)).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bookings Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Your Bookings</h2>
                <Button onClick={() => setLocation('/booking')} className="gradient-bg">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Installation
                </Button>
              </div>

              {bookingsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Tv className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Bookings Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Start by booking your first TV installation.
                    </p>
                    <Button onClick={() => setLocation('/booking')} className="gradient-bg">
                      Book Your First Installation
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {bookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} onViewInstallers={handleViewInstallers} />
                  ))}
                </div>
              )}
        </div>

        {/* TV Setup Section */}
        <div className="space-y-6 mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Your TV Setup Bookings</h2>
            <Button onClick={() => setLocation('/tv-setup-assist')} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Tv className="w-4 h-4 mr-2" />
              Book TV Setup
            </Button>
          </div>

          {tvSetupLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your TV setup bookings...</p>
            </div>
          ) : tvSetupBookings.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Tv className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No TV Setup Bookings Yet</h3>
                <p className="text-gray-600 mb-4">
                  Book your TV setup assistance to get help with streaming apps and IPTV login credentials.
                </p>
                <Button onClick={() => setLocation('/tv-setup-assist')} className="bg-orange-500 hover:bg-orange-600 text-white">
                  Book TV Setup Assistance
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {tvSetupBookings.map((booking) => (
                <TvSetupCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>
      </TabsContent>

            {/* AI Services Tab */}
            <TabsContent value="ai-services" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* AI Help Assistant */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-blue-500" />
                      AI Help Assistant
                    </CardTitle>
                    <CardDescription>
                      Get instant answers to your TV and electronics questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea 
                      placeholder="Ask any question about TV installation, setup, or troubleshooting..."
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button 
                      onClick={async () => {
                        if (!aiQuery.trim()) return;
                        setAiLoading(true);
                        try {
                          const response = await apiRequest('POST', '/api/ai/help', { question: aiQuery }) as any;
                          setAiResponse(response.answer || 'AI response received');
                        } catch (error) {
                          toast({ title: "Error", description: "Failed to get AI response", variant: "destructive" });
                        } finally {
                          setAiLoading(false);
                        }
                      }}
                      disabled={aiLoading || !aiQuery.trim()}
                      className="w-full"
                    >
                      {aiLoading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                      Ask AI Assistant
                    </Button>
                    {aiResponse && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900">{aiResponse}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* TV Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tv className="w-5 h-5 text-purple-500" />
                      TV Recommendations
                    </CardTitle>
                    <CardDescription>
                      Get personalized TV recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => setLocation('/tv-recommendation')}
                      className="w-full bg-purple-500 hover:bg-purple-600"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Get Recommendations
                    </Button>
                  </CardContent>
                </Card>

                {/* Product Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="w-5 h-5 text-green-500" />
                      Product Information
                    </CardTitle>
                    <CardDescription>
                      Look up electronics and TV details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => setLocation('/product-info')}
                      className="w-full bg-green-500 hover:bg-green-600"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search Products
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Referrals Tab */}
            <TabsContent value="referrals" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-green-500" />
                      Your Referral Code
                    </CardTitle>
                    <CardDescription>
                      Share your code and earn rewards
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Input 
                        value={`TB${user.id}-${user.id.toString().slice(-6).toUpperCase()}`}
                        readOnly
                        className="bg-gray-50"
                      />
                      <Button 
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`TB${user.id}-${user.id.toString().slice(-6).toUpperCase()}`);
                          toast({ title: "Copied!", description: "Referral code copied" });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">How it works:</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Share code with friends</li>
                        <li>• They get discounts</li>
                        <li>• You earn €10 per referral</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Euro className="w-5 h-5 text-blue-500" />
                      Referral Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">€{referralEarnings.toFixed(2)}</div>
                      <p className="text-blue-700">Total Earnings</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      Contact Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea 
                      placeholder="Describe your issue..."
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                    />
                    <Button 
                      onClick={async () => {
                        if (!supportMessage.trim()) return;
                        setSupportLoading(true);
                        try {
                          toast({ title: "Message sent!", description: "Support will contact you soon." });
                          setSupportMessage('');
                        } finally {
                          setSupportLoading(false);
                        }
                      }}
                      disabled={supportLoading}
                      className="w-full"
                    >
                      {supportLoading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                      Send Message
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-purple-500" />
                      Quick Help
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">📧 support@tradesbook.ie</p>
                      <p className="text-sm text-gray-600">🕘 9 AM - 6 PM, Mon-Fri</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Messaging Tab */}
            <TabsContent value="messaging" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      Installer Messages
                    </CardTitle>
                    <CardDescription>
                      Chat with your assigned installers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedInstaller ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-800">Chatting with: {selectedInstaller.businessName}</p>
                        </div>
                        <div className="h-64 border rounded-lg p-4 overflow-y-auto bg-gray-50">
                          {messages.length === 0 ? (
                            <p className="text-gray-500 text-center mt-8">No messages yet. Start the conversation!</p>
                          ) : (
                            messages.map((message, index) => (
                              <div key={index} className="mb-2 p-2 bg-white rounded border">
                                <p className="text-sm">{message.text}</p>
                                <p className="text-xs text-gray-500">{message.timestamp}</p>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type your message..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && messageText.trim()) {
                                setMessages(prev => [...prev, { text: messageText, timestamp: new Date().toLocaleString(), sender: 'customer' }]);
                                setMessageText('');
                              }
                            }}
                          />
                          <Button
                            onClick={() => {
                              if (messageText.trim()) {
                                setMessages(prev => [...prev, { text: messageText, timestamp: new Date().toLocaleString(), sender: 'customer' }]);
                                setMessageText('');
                              }
                            }}
                            disabled={!messageText.trim()}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Chats</h3>
                        <p className="text-gray-600 mb-4">
                          Start messaging when you have an assigned installer
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-orange-500" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600">Booking created successfully</span>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">Email verification completed</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Wallet Tab */}
            <TabsContent value="wallet" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-green-500" />
                      Account Wallet
                    </CardTitle>
                    <CardDescription>
                      Manage your account credits and payments
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        €{walletBalance.toFixed(2)}
                      </div>
                      <p className="text-green-700 text-sm">Available Balance</p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="topup-amount">Top-up Amount</Label>
                      <Input
                        id="topup-amount"
                        type="number"
                        placeholder="Enter amount (€)"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                        min="10"
                        step="10"
                      />
                      <Button 
                        onClick={async () => {
                          if (!topUpAmount || parseFloat(topUpAmount) < 10) {
                            toast({ title: "Invalid amount", description: "Minimum top-up is €10", variant: "destructive" });
                            return;
                          }
                          setTopUpLoading(true);
                          try {
                            // Simulate payment processing
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            setWalletBalance(prev => prev + parseFloat(topUpAmount));
                            setTopUpAmount('');
                            toast({ title: "Success!", description: `€${topUpAmount} added to your wallet` });
                          } catch (error) {
                            toast({ title: "Payment failed", description: "Please try again", variant: "destructive" });
                          } finally {
                            setTopUpLoading(false);
                          }
                        }}
                        disabled={topUpLoading || !topUpAmount || parseFloat(topUpAmount) < 10}
                        className="w-full bg-green-500 hover:bg-green-600"
                      >
                        {topUpLoading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                        <CreditCard className="w-4 h-4 mr-2" />
                        Top Up Wallet
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-500" />
                      Transaction History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions</h3>
                        <p className="text-gray-600">
                          Your transaction history will appear here
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-500" />
                      Account Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={handleEditProfile}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        Email: {user.emailVerified ? '✅ Verified' : '❌ Not Verified'}
                      </p>
                      <p className="text-sm text-blue-700">
                        Role: {user.role === 'admin' ? 'Administrator' : 'Customer'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-green-500" />
                      Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <p>Email notifications: Enabled</p>
                      <p>Booking updates: Enabled</p>
                      <p>Marketing emails: Disabled</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );

    return (
      <div>
      {/* Profile Edit Dialog */}
      <Dialog open={showProfileEdit} onOpenChange={setShowProfileEdit}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information. Make sure to keep your details current for better service.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowProfileEdit(false)}
                disabled={editingProfile}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handleSaveProfile}
                disabled={editingProfile}
              >
                {editingProfile && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// TV Setup Card Component
function TvSetupCard({ booking }: { booking: TvSetupBooking }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'mac_address_requested': return 'bg-blue-100 text-blue-800';
      case 'credentials_ready': return 'bg-green-100 text-green-800';
      case 'payment_required': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'mac_address_requested': return 'MAC Address Required';
      case 'credentials_ready': return 'Credentials Ready';
      case 'payment_required': return 'Payment Required';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const isPaidSetup = booking.credentialsPaymentStatus === 'paid' || booking.setupStatus === 'completed';
  const showCredentials = isPaidSetup && booking.credentialsProvided;

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Tv className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">TV Setup Assistance</h3>
                <p className="text-sm text-gray-600">
                  {booking.tvBrand} {booking.tvModel} ({booking.yearOfPurchase})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center text-sm">
                <User className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Customer:</span>
                <span className="ml-1 font-medium">{booking.name}</span>
              </div>
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Mobile:</span>
                <span className="ml-1 font-medium">{booking.mobile}</span>
              </div>
              <div className="flex items-center text-sm">
                <Euro className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Amount:</span>
                <span className="ml-1 font-medium">€{booking.paymentAmount}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Created:</span>
                <span className="ml-1 font-medium">
                  {new Date(booking.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* MAC Address Status */}
            {booking.macAddressProvided && booking.macAddress && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <div className="flex items-center text-sm text-blue-800">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="font-medium">MAC Address Provided:</span>
                  <span className="ml-2 font-mono">{booking.macAddress}</span>
                </div>
              </div>
            )}

            {/* Show credentials if payment completed */}
            {showCredentials && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                <h4 className="font-medium text-green-800 mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  IPTV Login Credentials
                </h4>
                <div className="space-y-2 text-sm">
                  {booking.credentialsType === 'iptv' && (
                    <>
                      <div className="flex flex-wrap items-center">
                        <span className="text-green-700 font-medium w-32">Server Hostname:</span>
                        <span className="font-mono text-green-900 bg-white px-2 py-1 rounded border">
                          {booking.serverHostname || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center">
                        <span className="text-green-700 font-medium w-32">Username:</span>
                        <span className="font-mono text-green-900 bg-white px-2 py-1 rounded border">
                          {booking.serverUsername || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center">
                        <span className="text-green-700 font-medium w-32">Password:</span>
                        <span className="font-mono text-green-900 bg-white px-2 py-1 rounded border">
                          {booking.serverPassword || 'Not provided'}
                        </span>
                      </div>
                      {booking.numberOfDevices && (
                        <div className="flex flex-wrap items-center">
                          <span className="text-green-700 font-medium w-32">Devices:</span>
                          <span className="text-green-900">{booking.numberOfDevices} device(s)</span>
                        </div>
                      )}
                    </>
                  )}
                  {booking.credentialsType === 'm3u' && booking.m3uUrl && (
                    <div className="flex flex-wrap items-center">
                      <span className="text-green-700 font-medium w-32">M3U URL:</span>
                      <span className="font-mono text-green-900 bg-white px-2 py-1 rounded border break-all">
                        {booking.m3uUrl}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment required notice */}
            {booking.credentialsPaymentRequired && booking.credentialsPaymentStatus !== 'paid' && (
              <div className="mb-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Payment of €{booking.credentialsPaymentAmount || booking.paymentAmount} is required to access your IPTV credentials.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge className={getStatusColor(booking.setupStatus)}>
              {getStatusText(booking.setupStatus)}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(`/tv-setup-tracker?bookingId=${booking.id}&email=${booking.email}`, '_blank')}
            >
              Track Progress
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Booking Card Component
function BookingCard({ booking, onViewInstallers }: { booking: Booking; onViewInstallers?: (bookingId: number) => void }) {
  const [, setLocation] = useLocation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      case 'open':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
      case 'pending':
        return 'Request Submitted';
      case 'assigned':
        return 'Installer Assigned';
      case 'confirmed':
        return 'Installer Confirmed';
      case 'in_progress':
        return 'Installation in Progress';
      case 'completed':
        return 'Installation Complete';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <div>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              {booking.tvInstallations && Array.isArray(booking.tvInstallations) && booking.tvInstallations.length > 1 ? (
                `${booking.tvInstallations.length} TV Installation`
              ) : (
                `${booking.tvSize}" TV Installation`
              )}
            </h3>
            <p className="text-sm text-gray-600">{booking.address}</p>
          </div>
          <Badge className={getStatusColor(booking.status)}>
            {getStatusText(booking.status)}
          </Badge>
        </div>

        {/* Installer Information - Show when installer is assigned */}
        {booking.installer && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {booking.installer.profileImageUrl ? (
                  <img 
                    src={booking.installer.profileImageUrl} 
                    alt={booking.installer.businessName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 truncate">
                      {booking.installer.businessName}
                    </h4>
                    <p className="text-sm text-gray-600 truncate">
                      {booking.installer.contactName}
                    </p>
                    {booking.installer.totalReviews > 0 && (
                      <div className="flex items-center mt-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">
                          {booking.installer.averageRating.toFixed(1)} ({booking.installer.totalReviews} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {booking.installer.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`tel:${booking.installer!.phone}`, '_self')}
                        className="text-xs"
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/installer/${booking.installer!.id}`)}
                      className="text-xs"
                    >
                      <ChevronRight className="w-3 h-3 mr-1" />
                      Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Negotiation - Show when installer is assigned and booking is active */}
        {booking.installer && ['confirmed', 'assigned', 'in_progress'].includes(booking.status) && (
          <div className="mb-4">
            <ScheduleNegotiation
              bookingId={booking.id}
              installerId={booking.installer.id}
              userType="customer"
              installerName={booking.installer.businessName}
            />
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center">
            <Tv className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              {booking.tvInstallations && Array.isArray(booking.tvInstallations) && booking.tvInstallations.length > 1 ? (
                `${booking.tvInstallations.length} TVs`
              ) : (
                booking.serviceType
              )}
            </span>
          </div>
          <div className="flex items-center">
            <Euro className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              €{booking.estimatedTotal || booking.estimatedPrice}
            </span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex items-center">
            <User className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">{booking.contactName}</span>
          </div>
        </div>

        {/* Multi-TV Details Section */}
        {booking.tvInstallations && Array.isArray(booking.tvInstallations) && booking.tvInstallations.length > 1 && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">TV Installation Details</h4>
            <div className="space-y-2">
              {booking.tvInstallations.map((tv: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Tv className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">
                      {tv.location}: {tv.tvSize}" {tv.serviceType.replace('-', ' ')}
                    </span>
                    {tv.needsWallMount && (
                      <Badge variant="outline" className="text-xs">
                        Wall Mount
                      </Badge>
                    )}
                  </div>
                  {tv.price && (
                    <span className="text-gray-600 font-medium">€{tv.price}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {booking.qrCode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(`/track/${booking.qrCode}`)}
              >
                <QrCode className="w-4 h-4 mr-2" />
                Track
              </Button>
            )}
            
            {/* Show installer selection button for pending bookings */}
            {booking.status === 'open' && !booking.installerId && onViewInstallers && (
              <Button size="sm" onClick={() => onViewInstallers(booking.id)} className="gradient-bg">
                <Users className="w-4 h-4 mr-2" />
                Select Installer
              </Button>
            )}
          </div>
          <div className="text-xs text-gray-500">
            ID: {booking.qrCode || booking.id}
          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Review Interface for Completed Bookings */}
    {booking.status === 'completed' && booking.installer && (
      <ReviewInterface 
        booking={booking}
        onReviewSubmitted={() => {
          // Refresh bookings to show updated stars
          queryClient.invalidateQueries({ queryKey: ['/api/auth/user/bookings'] });
        }}
      />
    )}
  </div>
  );
}