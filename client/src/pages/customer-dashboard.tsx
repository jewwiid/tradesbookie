import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Clock, User, Phone, Mail, CheckCircle, AlertCircle, Star, Home, Tv, Calendar, Euro, QrCode, AlertTriangle, LogIn, UserPlus, RefreshCw, Edit3, Save, X, Users, Award, ChevronRight, Bot, Gift, HelpCircle, Settings, Zap, Search, MessageSquare, Bell, Wallet, CreditCard, Send, Lock, Eye, EyeOff, ChevronDown, Monitor, Sparkles, FileText } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51QSj2vLGZvKUWZLCtQl8HfOyevF4qPOJmcWjnF4bXgCgZLx8FDJKY0uAhklZjMvs3dz80jvQVgvJgjOcqvxQKFPw00Hf7N8Flv');
import { Link, useLocation } from 'wouter';
import { useState, useEffect } from 'react';
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
  phone?: string;
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

// Credit Card Payment Component
function CreditCardPaymentForm({ amount, onSuccess, onCancel, onError }: {
  amount: string;
  onSuccess: (result: any) => void;
  onCancel: () => void;
  onError: (error: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');

  // Create payment intent when component mounts
  useEffect(() => {
    if (!amount || parseFloat(amount) < 5) return;
    
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest('POST', '/api/customer/wallet/create-payment-intent', {
          amount: parseFloat(amount)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create payment intent');
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      } catch (error: any) {
        onError(error.message);
      }
    };
    
    createPaymentIntent();
  }, [amount]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);

    const card = elements.getElement(CardElement);
    if (!card) {
      setProcessing(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: card,
        billing_details: {
          // Add billing details if needed
        },
      }
    });

    if (error) {
      console.error('Payment failed:', error);
      onError(error.message || 'Payment failed');
      setProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      // Payment succeeded, confirm with backend
      try {
        const confirmResponse = await apiRequest('POST', '/api/customer/wallet/confirm-payment', {
          paymentIntentId: paymentIntent.id
        });
        
        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json();
          throw new Error(errorData.message || 'Payment confirmation failed');
        }
        
        const confirmData = await confirmResponse.json();
        onSuccess(confirmData);
      } catch (confirmError: any) {
        onError(confirmError.message);
      }
    }
    
    setProcessing(false);
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <Label className="block text-sm font-medium mb-2">Card Information</Label>
        <div className="p-3 border rounded bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>
      
      <div className="flex space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={processing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || processing || !clientSecret}
          className="flex-1 bg-green-500 hover:bg-green-600"
        >
          {processing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay €{amount}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default function CustomerDashboard() {
  const locationData = useLocation();
  const setLocation = locationData?.[1];
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
    email: '',
    phone: ''
  });

  // User preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    bookingUpdates: true,
    marketingEmails: false
  });
  const [updatingPreferences, setUpdatingPreferences] = useState(false);
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
  const [generatingCode, setGeneratingCode] = useState(false);
  
  // Support states
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportCategory, setSupportCategory] = useState('general');
  const [supportPriority, setSupportPriority] = useState('medium');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('bookings');
  
  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Messaging states
  const [messageText, setMessageText] = useState('');
  const [selectedInstaller, setSelectedInstaller] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
  // Wallet states
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');

  // Get current user
  const { data: user, isLoading: userLoading, error: userError } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Check if current user is admin viewing customer dashboard
  const isAdminView = user?.role === 'admin' || 
                      user?.email === 'admin@tradesbook.ie' || 
                      user?.email === 'jude.okun@gmail.com';

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

  // Get user's referral code from database
  const { data: userReferralCode, isLoading: referralLoading } = useQuery<{id: number, referralCode: string, totalReferrals: number, totalEarnings: string}>(
    {
      queryKey: ['/api/referral/generate', user?.id],
      enabled: !!user?.id,
    }
  );

  // Get customer wallet data
  const { data: walletData, isLoading: walletLoading, refetch: refetchWallet } = useQuery<{
    wallet: { balance: string; totalSpent: string; totalTopUps: string };
    transactions: Array<{ id: number; type: string; amount: string; description: string; createdAt: string }>;
  }>({
    queryKey: ['/api/customer/wallet'],
    enabled: !!user && user.role !== 'admin', // Only fetch for customer users
  });

  // Get user's support tickets
  const { data: supportTickets = [], isLoading: ticketsLoading, refetch: refetchTickets } = useQuery<any[]>({
    queryKey: ['/api/support/tickets'],
    enabled: !!user && user.role !== 'admin', // Only fetch for customer users
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
    if (setLocation) {
      setLocation('/api/signup?returnTo=/customer-dashboard');
    }
  };

  const handleSignIn = () => {
    if (setLocation) {
      setLocation('/api/login?returnTo=/customer-dashboard');
    }
  };

  const handleUpgradeAccount = () => {
    setShowGuestUpgradeDialog(false);
    if (setLocation) {
      setLocation('/api/signup?returnTo=/customer-dashboard');
    }
  };

  const handleEditProfile = () => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      setShowProfileEdit(true);
    } else {
      // Try to open dialog anyway with empty data
      setProfileData({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      });
      setShowProfileEdit(true);
    }
  };

  // Handle preference changes
  const handlePreferenceChange = async (preferenceKey: keyof typeof preferences, checked: boolean) => {
    setUpdatingPreferences(true);
    try {
      // Update local state immediately for UI responsiveness
      setPreferences(prev => ({ ...prev, [preferenceKey]: checked }));
      
      // Send update to backend
      await apiRequest('PATCH', '/api/auth/preferences', { [preferenceKey]: checked });
      
      // Show success toast
      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been saved.",
      });
      
      // Invalidate user query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    } catch (error) {
      // Revert local state on error
      setPreferences(prev => ({ ...prev, [preferenceKey]: !checked }));
      
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingPreferences(false);
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
    console.log('handleViewInstallers called with bookingId:', bookingId);
    
    // Show dialog immediately
    setShowInstallerSelection(bookingId);
    setSelectedBookingInstallers([]); // Start with empty array to show loading
    
    try {
      // Fetch available installers for TV installation service
      const response = await fetch('/api/installers', {
        credentials: 'include'
      });
      
      console.log('Installer fetch response:', response.ok, response.status);
      
      if (!response.ok) throw new Error('Failed to fetch installers');
      
      const installers = await response.json();
      console.log('Fetched installers:', installers.length);
      console.log('Sample installer data:', installers[0]);
      
      // Filter for available installers - show all active installers
      const tvInstallers = installers.filter((installer: any) => {
        console.log('Checking installer:', installer.businessName, {
          isActive: installer.isActive,
          approvalStatus: installer.approvalStatus || 'undefined',
          isAvailable: installer.isAvailable || 'undefined'
        });
        
        // Show all installers that aren't explicitly inactive
        return installer.isActive !== false && installer.businessName;
      });
      
      console.log('Filtered TV installers:', tvInstallers.length);
      if (tvInstallers.length === 0) {
        toast({ 
          title: "No installers available", 
          description: "All installers are currently busy or inactive. Please try again later." 
        });
        return;
      }
      
      // Transform installers to match the expected dialog format
      const formattedInstallers = tvInstallers.map((installer: any) => ({
        installer: installer
      }));
      
      // Update the dialog with installer data
      setSelectedBookingInstallers(formattedInstallers);
      
      console.log('Installers loaded into dialog:', {
        bookingId,
        installersCount: formattedInstallers.length,
        dialogVisible: true
      });
      
      toast({ 
        title: "Installers loaded", 
        description: `Found ${tvInstallers.length} available installers` 
      });
    } catch (error) {
      console.error('Error fetching installers:', error);
      toast({ title: "Failed to load installers", variant: "destructive" });
      // Don't reset the dialog state on error - let user close it manually
    }
  };

  const handleSelectInstaller = async (installerId: number) => {
    if (!showInstallerSelection) return;
    
    setSelectingInstaller(true);
    try {
      // Direct assignment of installer to booking
      const response = await fetch(`/api/bookings/${showInstallerSelection}/assign-installer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          installerId,
          assignmentType: 'direct' // Mark as direct assignment, not a bid
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign installer');
      }
      
      const result = await response.json();
      toast({ 
        title: "Installer assigned successfully", 
        description: `${result.installer?.businessName || 'Selected installer'} has been directly assigned to your booking.` 
      });
      
      // Refresh bookings data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user/bookings'] });
      
      // Close dialog
      setShowInstallerSelection(null);
      setSelectedBookingInstallers([]);
    } catch (error: any) {
      console.error('Error assigning installer:', error);
      toast({ 
        title: "Failed to assign installer", 
        description: error.message || "Please try again or contact support.",
        variant: "destructive" 
      });
    } finally {
      setSelectingInstaller(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setChangingPassword(true);
    try {
      await apiRequest('POST', '/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully."
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordChange(false);
    } catch (error: any) {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password. Please check your current password.",
        variant: "destructive"
      });
    } finally {
      setChangingPassword(false);
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

  // Update preferences state when user data loads
  if (user && typeof (user as any).emailNotifications !== 'undefined') {
    if (preferences.emailNotifications !== (user as any).emailNotifications ||
        preferences.bookingUpdates !== (user as any).bookingUpdates ||
        preferences.marketingEmails !== (user as any).marketingEmails) {
      setPreferences({
        emailNotifications: (user as any).emailNotifications ?? true,
        bookingUpdates: (user as any).bookingUpdates ?? true,
        marketingEmails: (user as any).marketingEmails ?? false
      });
    }
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
                <span className="text-sm sm:text-lg md:text-xl font-bold text-gray-900">Customer Dashboard</span>
              </div>
              <Button variant="ghost" onClick={() => setLocation && setLocation('/')}>
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
                <Button onClick={() => setLocation && setLocation('/booking-tracker')} variant="outline">
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
                <span className="text-sm sm:text-lg md:text-xl font-bold text-gray-900">Customer Dashboard</span>
              </div>
              <Button variant="ghost" onClick={() => setLocation && setLocation('/')}>
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
                <span className="text-sm sm:text-lg md:text-xl font-bold text-gray-900">Customer Dashboard</span>
              </div>
              <Button variant="ghost" onClick={() => setLocation && setLocation('/')}>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Bookings</h2>
              <Button onClick={() => setLocation && setLocation('/booking')} className="gradient-bg shrink-0">
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
                  <Button onClick={() => setLocation && setLocation('/booking')} className="gradient-bg">
                    Book Your First Installation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {bookings.map((booking) => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    onViewInstallers={handleViewInstallers}
                    showInstallerSelection={showInstallerSelection}
                    setShowInstallerSelection={setShowInstallerSelection}
                    selectedBookingInstallers={selectedBookingInstallers}
                    handleSelectInstaller={handleSelectInstaller}
                  />
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
        {showInstallerSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Select Your Installer</h2>
                  <button 
                    onClick={() => setShowInstallerSelection(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <p className="text-gray-600 mb-4">
                  {selectedBookingInstallers.length} installer{selectedBookingInstallers.length !== 1 ? 's are' : ' is'} available for direct assignment.
                </p>
            
            <div className="space-y-4">
              {selectedBookingInstallers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading installers...</p>
                </div>
              ) : (
                selectedBookingInstallers.map((item) => (
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
                          onClick={() => handleSelectInstaller(item.installer.id)}
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
                ))
              )}
              
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
            
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full authenticated user - show complete dashboard
  return (
    <>
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 overflow-x-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Tv className="h-8 w-8 text-primary mr-3" />
              <span className="text-xl font-bold text-gray-900">Customer Dashboard</span>
              {isAdminView && (
                <Badge className="ml-3 bg-orange-100 text-orange-800 border-orange-200">
                  Admin View
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.firstName || user.email}</span>
              {isAdminView && (
                <Button variant="ghost" onClick={() => setLocation && setLocation('/admin')} size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Back to Admin
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleEditProfile}>
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" onClick={() => setLocation && setLocation('/')}>
                <Home className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 overflow-x-hidden">
        {/* Email Verification Banner */}
        <EmailVerificationBanner user={{
          id: String(user.id),
          email: user.email,
          emailVerified: user.emailVerified || false,
          firstName: user.firstName
        }} />
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 sm:p-6 rounded-lg mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-4">
              <h2 className="text-lg sm:text-2xl font-bold mb-2">Welcome to your Dashboard</h2>
              <p className="text-blue-100 text-sm sm:text-base">
                Manage bookings, use AI services, track referrals, and get support.
              </p>
            </div>
            <div className="hidden md:block flex-shrink-0">
              <User className="h-16 w-16 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile-first scrollable tabs */}
          <div className="mb-6 sm:mb-8 w-full">
            <div className="w-full overflow-x-auto scrollbar-hide">
              <TabsList className="flex h-auto items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground min-w-max w-full">
                <div className="flex space-x-1 w-full">
                  <TabsTrigger 
                    value="bookings" 
                    className="inline-flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex-shrink-0"
                  >
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="hidden xs:inline sm:inline">Bookings</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ai-services" 
                    className="inline-flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex-shrink-0"
                  >
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="hidden xs:inline sm:inline">AI Services</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="referrals" 
                    className="inline-flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex-shrink-0"
                  >
                    <Gift className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="hidden xs:inline sm:inline">Referrals</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="messaging" 
                    className="inline-flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex-shrink-0"
                  >
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="hidden xs:inline sm:inline">Messages</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="wallet" 
                    className="inline-flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex-shrink-0"
                  >
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="hidden xs:inline sm:inline">Wallet</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="support" 
                    className="inline-flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex-shrink-0"
                  >
                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="hidden xs:inline sm:inline">Support</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings" 
                    className="inline-flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex-shrink-0"
                  >
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="hidden xs:inline sm:inline">Settings</span>
                  </TabsTrigger>
                </div>
              </TabsList>
            </div>
          </div>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center">
                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mr-2 sm:mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Bookings</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{bookings.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Completed</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {bookings.filter(b => b.status === 'completed').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center">
                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 mr-2 sm:mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">In Progress</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {bookings.filter(b => ['open', 'confirmed', 'in-progress'].includes(b.status)).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bookings Section */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Bookings</h2>
                <Button onClick={() => setLocation('/booking')} className="gradient-bg shrink-0">
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
                    <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    onViewInstallers={handleViewInstallers}
                    showInstallerSelection={showInstallerSelection}
                    setShowInstallerSelection={setShowInstallerSelection}
                    selectedBookingInstallers={selectedBookingInstallers}
                    handleSelectInstaller={handleSelectInstaller}
                  />
                  ))}
                </div>
              )}
        </div>

        {/* TV Setup Section */}
        <div className="space-y-6 mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your TV Setup Bookings</h2>
            <Button onClick={() => setLocation('/tv-setup-assist')} className="bg-orange-500 hover:bg-orange-600 text-white shrink-0">
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
                      AI Chat Assistant
                    </CardTitle>
                    <CardDescription>
                      Get instant answers to your TV and electronics questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => setLocation('/ai-help?tab=chat')}
                      className="w-full bg-blue-500 hover:bg-blue-600"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      Start Chat
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
                      onClick={() => setLocation('/ai-help?tab=compare')}
                      className="w-full bg-green-500 hover:bg-green-600"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search Products
                    </Button>
                  </CardContent>
                </Card>

                {/* Product Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-purple-500" />
                      Product Compare
                    </CardTitle>
                    <CardDescription>
                      Compare different TV models and electronics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => setLocation('/ai-help?tab=electronics')}
                      className="w-full bg-purple-500 hover:bg-purple-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Compare Products
                    </Button>
                  </CardContent>
                </Card>

                {/* Find My Product */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-orange-500" />
                      Find My Product
                    </CardTitle>
                    <CardDescription>
                      Get personalized product recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => setLocation('/ai-help?tab=find')}
                      className="w-full bg-orange-500 hover:bg-orange-600"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Get Recommendations
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
                    {referralLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Loading referral code...</p>
                      </div>
                    ) : userReferralCode ? (
                      <div className="flex items-center space-x-2">
                        <Input 
                          value={userReferralCode.referralCode}
                          readOnly
                          className="bg-gray-50 font-mono"
                        />
                        <Button 
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(userReferralCode.referralCode);
                            toast({ title: "Copied!", description: "Referral code copied to clipboard" });
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600 mb-4">You don't have a referral code yet.</p>
                        <Button 
                          onClick={async () => {
                            setGeneratingCode(true);
                            try {
                              await apiRequest('POST', '/api/referral/generate');
                              // Refetch the referral code
                              queryClient.invalidateQueries({ queryKey: ['/api/referral/generate', user?.id] });
                              toast({ title: "Success!", description: "Your referral code has been generated" });
                            } catch (error) {
                              toast({ title: "Error", description: "Failed to generate referral code", variant: "destructive" });
                            } finally {
                              setGeneratingCode(false);
                            }
                          }}
                          disabled={generatingCode}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          {generatingCode ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Gift className="w-4 h-4 mr-2" />
                          )}
                          Generate My Referral Code
                        </Button>
                      </div>
                    )}
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
                      <div className="text-3xl font-bold text-blue-600">
                        €{userReferralCode ? parseFloat(userReferralCode.totalEarnings).toFixed(2) : '0.00'}
                      </div>
                      <p className="text-blue-700">Total Earnings</p>
                      {userReferralCode && (
                        <p className="text-sm text-blue-600 mt-2">
                          {userReferralCode.totalReferrals} successful referral{userReferralCode.totalReferrals !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              {/* Existing Support Tickets */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                    Your Support Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ticketsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                      <span className="ml-2 text-gray-600">Loading tickets...</span>
                    </div>
                  ) : supportTickets && supportTickets.length > 0 ? (
                    <div className="space-y-4">
                      {supportTickets.map((ticket: any) => (
                        <div key={ticket.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-lg">#{ticket.id}: {ticket.subject}</h4>
                              <div className="flex items-center gap-4 mt-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  ticket.status === 'open' ? 'bg-green-100 text-green-800' :
                                  ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('_', ' ')}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                  ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  ticket.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
                                </span>
                                <span className="text-sm text-gray-500">
                                  {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              setSelectedTicket(ticket);
                              // Fetch ticket messages
                              try {
                                const response = await apiRequest('GET', `/api/support/tickets/${ticket.id}/messages`);
                                const messages = await response.json();
                                setTicketMessages(messages);
                              } catch (error) {
                                console.error('Failed to fetch ticket messages:', error);
                                setTicketMessages([]);
                              }
                            }}
                          >
                            <ChevronRight className="w-4 h-4 mr-1" />
                            View Conversation
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Support Tickets</h3>
                      <p className="text-gray-600">
                        You haven't created any support tickets yet. Use the form below to contact support.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      Contact Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="support-subject">Subject</Label>
                        <Input
                          id="support-subject"
                          placeholder="Brief description of your issue"
                          value={supportSubject}
                          onChange={(e) => setSupportSubject(e.target.value)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="support-category">Category</Label>
                          <select 
                            id="support-category"
                            value={supportCategory}
                            onChange={(e) => setSupportCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="general">General</option>
                            <option value="booking">Booking Issue</option>
                            <option value="payment">Payment Issue</option>
                            <option value="technical">Technical Problem</option>
                          </select>
                        </div>
                        
                        <div>
                          <Label htmlFor="support-priority">Priority</Label>
                          <select 
                            id="support-priority"
                            value={supportPriority}
                            onChange={(e) => setSupportPriority(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="support-message">Message</Label>
                        <Textarea 
                          id="support-message"
                          placeholder="Describe your issue in detail..."
                          value={supportMessage}
                          onChange={(e) => setSupportMessage(e.target.value)}
                          rows={4}
                        />
                      </div>
                      
                      <Button 
                        onClick={async () => {
                          if (!supportSubject.trim() || !supportMessage.trim()) {
                            toast({ 
                              title: "Missing information", 
                              description: "Please provide both subject and message", 
                              variant: "destructive" 
                            });
                            return;
                          }
                          setSupportLoading(true);
                          try {
                            const response = await apiRequest('POST', '/api/support/tickets', {
                              subject: supportSubject,
                              message: supportMessage,
                              category: supportCategory,
                              priority: supportPriority
                            });
                            
                            if (response.ok) {
                              const data = await response.json();
                              toast({ 
                                title: "Ticket created!", 
                                description: `Your support ticket #${data.ticket.id} has been created. We'll respond soon.`
                              });
                              setSupportSubject('');
                              setSupportMessage('');
                              setSupportCategory('general');
                              setSupportPriority('medium');
                              await refetchTickets();
                            } else {
                              throw new Error('Failed to create ticket');
                            }
                          } catch (error: any) {
                            toast({ 
                              title: "Failed to create ticket", 
                              description: error.message || "Please try again", 
                              variant: "destructive" 
                            });
                          } finally {
                            setSupportLoading(false);
                          }
                        }}
                        disabled={supportLoading || !supportSubject.trim() || !supportMessage.trim()}
                        className="w-full"
                      >
                        {supportLoading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                        Create Support Ticket
                      </Button>
                    </div>
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

              {/* Support Ticket Conversation Dialog */}
              <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>
                      Support Ticket #{selectedTicket?.id}: {selectedTicket?.subject}
                    </DialogTitle>
                    <DialogDescription>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          selectedTicket?.status === 'open' ? 'bg-green-100 text-green-800' :
                          selectedTicket?.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedTicket?.status?.charAt(0).toUpperCase() + selectedTicket?.status?.slice(1).replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          selectedTicket?.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          selectedTicket?.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          selectedTicket?.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedTicket?.priority?.charAt(0).toUpperCase() + selectedTicket?.priority?.slice(1)} Priority
                        </span>
                        <span className="text-sm text-gray-500">
                          Created: {new Date(selectedTicket?.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* Messages */}
                    <div className="max-h-96 overflow-y-auto space-y-3 border rounded-lg p-4 bg-gray-50">
                      {ticketMessages.map((message: any) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg max-w-[80%] ${
                            message.isAdminReply 
                              ? 'bg-blue-100 border-blue-200 ml-auto text-right' 
                              : 'bg-white border-gray-200 mr-auto'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {message.isAdminReply ? (
                              <>
                                <span className="text-sm font-medium text-blue-700">Support Team</span>
                                <span className="text-xs text-blue-600">
                                  {new Date(message.createdAt).toLocaleString()}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-sm font-medium text-gray-700">You</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(message.createdAt).toLocaleString()}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        </div>
                      ))}
                    </div>

                    {/* Reply Form */}
                    {selectedTicket?.status !== 'closed' && (
                      <div className="space-y-3">
                        <Label htmlFor="new-message">Add Reply</Label>
                        <Textarea
                          id="new-message"
                          placeholder="Type your reply..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          rows={3}
                        />
                        <Button
                          onClick={async () => {
                            if (!newMessage.trim()) {
                              toast({
                                title: "Missing Message",
                                description: "Please enter a message to send.",
                                variant: "destructive"
                              });
                              return;
                            }

                            try {
                              const response = await apiRequest('POST', `/api/support/tickets/${selectedTicket.id}/messages`, {
                                message: newMessage
                              });
                              
                              const data = await response.json();
                              if (data.success) {
                                toast({
                                  title: "Message Sent",
                                  description: "Your reply has been sent to our support team."
                                });
                                
                                // Add the new message to the local state
                                setTicketMessages(prev => [...prev, data.message]);
                                setNewMessage('');
                                
                                // Refresh tickets list to update status
                                refetchTickets();
                              }
                            } catch (error: any) {
                              toast({
                                title: "Error",
                                description: error.message || "Failed to send message",
                                variant: "destructive"
                              });
                            }
                          }}
                          disabled={!newMessage.trim()}
                          className="w-full"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Reply
                        </Button>
                      </div>
                    )}

                    {selectedTicket?.status === 'closed' && (
                      <div className="p-4 bg-gray-100 rounded-lg text-center">
                        <p className="text-sm text-gray-600">
                          This ticket has been closed. Create a new ticket if you need further assistance.
                        </p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
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
                        {walletLoading ? (
                          <div className="animate-pulse bg-gray-200 h-8 w-20 mx-auto rounded"></div>
                        ) : (
                          `€${parseFloat(walletData?.wallet?.balance || '0').toFixed(2)}`
                        )}
                      </div>
                      <p className="text-green-700 text-sm">Available Balance</p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Top-up Amount</Label>
                      
                      {/* Predefined amounts */}
                      <div className="grid grid-cols-2 gap-2">
                        {[5, 10, 15, 25].map((amount) => (
                          <Button
                            key={amount}
                            variant={topUpAmount === amount.toString() ? "default" : "outline"}
                            onClick={() => setTopUpAmount(amount.toString())}
                            className="text-sm"
                          >
                            €{amount}
                          </Button>
                        ))}
                      </div>
                      
                      {/* Custom amount input */}
                      <div className="space-y-2">
                        <Label htmlFor="topup-amount" className="text-sm text-gray-600">Or enter custom amount</Label>
                        <Input
                          id="topup-amount"
                          type="number"
                          placeholder="Enter amount (€)"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                          min="5"
                          step="1"
                        />
                      </div>
                      
                      <Button 
                        onClick={() => {
                          if (!topUpAmount || parseFloat(topUpAmount) < 5) {
                            toast({ title: "Invalid amount", description: "Minimum top-up is €5", variant: "destructive" });
                            return;
                          }
                          setShowPaymentForm(true);
                        }}
                        disabled={!topUpAmount || parseFloat(topUpAmount) < 5}
                        className="w-full bg-green-500 hover:bg-green-600"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Continue to Payment
                      </Button>
                      
                      {/* Stripe Payment Form Dialog */}
                      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Add Credits to Wallet</DialogTitle>
                            <DialogDescription>
                              Securely add €{topUpAmount} to your TradesBook wallet using your credit card.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Elements stripe={stripePromise}>
                            <CreditCardPaymentForm
                              amount={topUpAmount}
                              onSuccess={async (result) => {
                                setShowPaymentForm(false);
                                setTopUpAmount('');
                                await refetchWallet();
                                toast({ 
                                  title: "Success!", 
                                  description: result.message || `€${topUpAmount} added to your wallet` 
                                });
                              }}
                              onCancel={() => setShowPaymentForm(false)}
                              onError={(error) => {
                                toast({ 
                                  title: "Payment failed", 
                                  description: error, 
                                  variant: "destructive" 
                                });
                              }}
                            />
                          </Elements>
                        </DialogContent>
                      </Dialog>
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
                      {walletLoading ? (
                        <div className="space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-16 bg-gray-200 rounded-lg"></div>
                            </div>
                          ))}
                        </div>
                      ) : walletData?.transactions && walletData.transactions.length > 0 ? (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {walletData.transactions.map((transaction) => (
                            <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${
                                  transaction.type === 'credit_purchase' ? 'bg-green-100 text-green-600' :
                                  transaction.type === 'booking_payment' ? 'bg-blue-100 text-blue-600' :
                                  transaction.type === 'refund' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {transaction.type === 'credit_purchase' ? (<CreditCard className="w-4 h-4" />) :
                                   transaction.type === 'booking_payment' ? (<Tv className="w-4 h-4" />) :
                                   transaction.type === 'refund' ? (<RefreshCw className="w-4 h-4" />) :
                                   (<Euro className="w-4 h-4" />)}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{transaction.description}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(transaction.createdAt).toLocaleDateString('en-IE', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className={`font-semibold ${
                                parseFloat(transaction.amount) > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {parseFloat(transaction.amount) > 0 ? '+' : ''}€{Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions</h3>
                          <p className="text-gray-600">
                            Your transaction history will appear here
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Email Notifications</Label>
                          <p className="text-xs text-gray-500">General service and account notifications</p>
                        </div>
                        <Switch 
                          checked={preferences.emailNotifications}
                          onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                          disabled={updatingPreferences}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Booking Updates</Label>
                          <p className="text-xs text-gray-500">Installation status and scheduling updates</p>
                        </div>
                        <Switch 
                          checked={preferences.bookingUpdates}
                          onCheckedChange={(checked) => handlePreferenceChange('bookingUpdates', checked)}
                          disabled={updatingPreferences}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Marketing Emails</Label>
                          <p className="text-xs text-gray-500">Promotional offers and service updates</p>
                        </div>
                        <Switch 
                          checked={preferences.marketingEmails}
                          onCheckedChange={(checked) => handlePreferenceChange('marketingEmails', checked)}
                          disabled={updatingPreferences}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-red-500" />
                      Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={() => setShowPasswordChange(true)}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-700">
                        Keep your account secure by using a strong password and changing it regularly.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Dialog open={showProfileEdit} onOpenChange={setShowProfileEdit}>
        <DialogContent className="max-w-md" style={{ zIndex: 9999 }}>
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email"
                disabled
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div className="flex space-x-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowProfileEdit(false)}
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

      {/* Password Change Dialog */}
      <Dialog open={showPasswordChange} onOpenChange={setShowPasswordChange}>
        <DialogContent className="max-w-md" style={{ zIndex: 9999 }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Update your account password. Make sure to use a strong password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter current password"
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password (min 6 characters)"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
            </div>
            {passwordData.newPassword && passwordData.confirmPassword && 
             passwordData.newPassword !== passwordData.confirmPassword && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Passwords do not match.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex space-x-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowPasswordChange(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handlePasswordChange}
                disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
              >
                {changingPassword && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                <Lock className="w-4 h-4 mr-2" />
                Update Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
function BookingCard({ 
  booking, 
  onViewInstallers, 
  showInstallerSelection, 
  setShowInstallerSelection, 
  selectedBookingInstallers, 
  handleSelectInstaller 
}: { 
  booking: Booking; 
  onViewInstallers?: (bookingId: number) => void;
  showInstallerSelection: number | null;
  setShowInstallerSelection: (id: number | null) => void;
  selectedBookingInstallers: any[];
  handleSelectInstaller: (installerId: number) => void;
}) {
  const locationData = useLocation();
  const setLocation = locationData?.[1];
  const [showDetails, setShowDetails] = useState(false);

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
    <div className="w-full min-w-0">
      <Card className="hover:shadow-lg transition-shadow w-full min-w-0 overflow-visible">
        <CardContent className="pt-6 w-full min-w-0 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 break-words">
              {booking.tvInstallations && Array.isArray(booking.tvInstallations) && booking.tvInstallations.length > 1 ? (
                `${booking.tvInstallations.length} TV Installation`
              ) : (
                `${booking.tvSize}" TV Installation`
              )}
            </h3>
            <p className="text-sm text-gray-600 break-words">{booking.address}</p>
          </div>
          <div className="flex-shrink-0 self-start">
            <Badge className={getStatusColor(booking.status)}>
              {getStatusText(booking.status)}
            </Badge>
          </div>
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
        {booking.installer && ['confirmed', 'assigned', 'scheduled', 'in_progress'].includes(booking.status) && (
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
          <div className="mb-4 p-2 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg w-full min-w-0 overflow-hidden">
            <h4 className="font-medium text-gray-900 mb-3">TV Installation Details</h4>
            <div className="space-y-3 w-full min-w-0">
              {booking.tvInstallations.map((tv: any, index: number) => (
                <div key={index} className="w-full min-w-0">
                  <div className="flex items-center space-x-2 min-w-0 text-sm">
                    <Tv className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-900 break-words block">
                        <span className="font-medium">{tv.location}:</span> {tv.tvSize}" {tv.serviceType.replace('-', ' ')}
                      </span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {tv.needsWallMount && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            Wall Mount
                          </Badge>
                        )}
                        {tv.price && (
                          <span className="text-gray-600 font-medium flex-shrink-0">€{tv.price}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="flex-shrink-0"
            >
              <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
              {showDetails ? 'Hide' : 'View'} Details
            </Button>
            {booking.qrCode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation && setLocation(`/track/${booking.qrCode}`)}
                className="flex-shrink-0"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Track
              </Button>
            )}
            
            {/* Show installer selection dropdown for pending bookings */}
            {booking.status === 'open' && !booking.installerId && onViewInstallers && (
              <div className="relative">
                <Button 
                  size="sm" 
                  onClick={() => {
                    console.log('Select Installer button clicked for booking:', booking.id);
                    setShowInstallerSelection(showInstallerSelection === booking.id ? null : booking.id);
                    if (onViewInstallers) {
                      onViewInstallers(booking.id);
                    }
                  }} 
                  className="gradient-bg flex-shrink-0 flex items-center"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Select Installer
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
                
                {/* Dropdown List */}
                {showInstallerSelection === booking.id && selectedBookingInstallers.length > 0 && (
                  <div className="absolute top-full left-0 bg-white border border-gray-200 rounded-md shadow-xl z-[9999] min-w-80 max-w-96 max-h-96 overflow-y-auto" style={{ transform: 'translateZ(0)' }}>
                    {selectedBookingInstallers.map((item) => (
                      <div
                        key={item.installer.id}
                        onClick={() => {
                          handleSelectInstaller(item.installer.id);
                          setShowInstallerSelection(null);
                        }}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{item.installer.businessName}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{item.installer.serviceArea}</span>
                            {item.installer.averageRating > 0 && (
                              <>
                                <span>•</span>
                                <div className="flex items-center space-x-1">
                                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                  <span>{item.installer.averageRating.toFixed(1)}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500 flex-shrink-0">
            ID: {booking.qrCode || booking.id}
          </div>
        </div>

        {/* Expandable Details Section */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-4">
              {/* TV Installation Details */}
              {booking.tvInstallations && Array.isArray(booking.tvInstallations) && booking.tvInstallations.length > 0 ? (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Tv className="w-4 h-4 mr-2" />
                    TV Installation Details
                  </h4>
                  <div className="space-y-4">
                    {booking.tvInstallations.map((tv: any, index: number) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">
                            {tv.location || `TV ${index + 1}`}
                          </h5>
                          <Badge variant="outline">
                            {tv.tvSize}" TV
                          </Badge>
                        </div>
                        
                        {/* TV Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3">
                          <div className="flex items-center text-sm min-w-0">
                            <Monitor className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <span className="text-gray-600 flex-shrink-0">Service:</span>
                            <span className="ml-1 font-medium break-words truncate">
                              {tv.serviceType?.replace('-', ' ') || 'Not specified'}
                            </span>
                          </div>
                          <div className="flex items-center text-sm min-w-0">
                            <Home className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <span className="text-gray-600 flex-shrink-0">Wall Type:</span>
                            <span className="ml-1 font-medium break-words truncate">
                              {tv.wallType || 'Not specified'}
                            </span>
                          </div>
                          <div className="flex items-center text-sm min-w-0">
                            <Settings className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <span className="text-gray-600 flex-shrink-0">Mount Type:</span>
                            <span className="ml-1 font-medium break-words truncate">
                              {tv.mountType || 'Not specified'}
                            </span>
                          </div>
                          <div className="flex items-center text-sm min-w-0">
                            <Euro className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <span className="text-gray-600 flex-shrink-0">Price:</span>
                            <span className="ml-1 font-medium break-words">
                              €{tv.estimatedTotal || tv.estimatedPrice || tv.price || 'TBD'}
                            </span>
                          </div>
                        </div>

                        {/* Add-ons */}
                        {tv.addons && tv.addons.length > 0 && (
                          <div className="mb-3">
                            <h6 className="text-sm font-medium text-gray-700 mb-2">Add-ons Selected:</h6>
                            <div className="flex flex-wrap gap-2">
                              {tv.addons.map((addon: any, addonIndex: number) => (
                                <Badge key={addonIndex} variant="secondary" className="text-xs">
                                  {addon.name}
                                  {addon.price > 0 && ` (+€${addon.price})`}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Room Photo */}
                        {(tv.roomPhotoBase64 || tv.roomPhotoUrl) && (
                          <div className="mb-3">
                            <h6 className="text-sm font-medium text-gray-700 mb-2">Room Photo:</h6>
                            <div className="relative w-32 h-24 rounded-lg overflow-hidden">
                              <img
                                src={tv.roomPhotoBase64 ? `data:image/jpeg;base64,${tv.roomPhotoBase64}` : tv.roomPhotoUrl}
                                alt={`Room photo for ${tv.location || `TV ${index + 1}`}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}

                        {/* AI Preview */}
                        {tv.aiPreviewUrl && (
                          <div className="mb-3">
                            <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <Sparkles className="w-4 h-4 mr-1" />
                              AI Installation Preview:
                            </h6>
                            <div className="relative w-32 h-24 rounded-lg overflow-hidden">
                              <img
                                src={tv.aiPreviewUrl}
                                alt={`AI preview for ${tv.location || `TV ${index + 1}`}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded flex items-center">
                                <Sparkles className="w-3 h-3 mr-1" />
                                AI
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Single TV Installation (Legacy Format) */
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Tv className="w-4 h-4 mr-2" />
                    Installation Details
                  </h4>
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <div className="flex items-center text-sm min-w-0">
                        <Monitor className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                        <span className="text-gray-600 flex-shrink-0">TV Size:</span>
                        <span className="ml-1 font-medium">{booking.tvSize}"</span>
                      </div>
                      <div className="flex items-center text-sm min-w-0">
                        <Settings className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                        <span className="text-gray-600 flex-shrink-0">Service:</span>
                        <span className="ml-1 font-medium break-words truncate">{booking.serviceType}</span>
                      </div>
                      <div className="flex items-center text-sm min-w-0">
                        <Home className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                        <span className="text-gray-600 flex-shrink-0">Wall Type:</span>
                        <span className="ml-1 font-medium break-words truncate">{(booking as any).wallType || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center text-sm min-w-0">
                        <Euro className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                        <span className="text-gray-600 flex-shrink-0">Mount Type:</span>
                        <span className="ml-1 font-medium break-words truncate">{(booking as any).mountType || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Contact Information
                </h4>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center text-sm">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-1 font-medium">{booking.contactName}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-1 font-medium">{(booking as any).contactEmail}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-1 font-medium">{(booking as any).contactPhone}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Address:</span>
                      <span className="ml-1 font-medium">{booking.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Euro className="w-4 h-4 mr-2" />
                  Pricing Summary
                </h4>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Service Total:</span>
                      <span className="font-medium">€{booking.estimatedPrice}</span>
                    </div>
                    {(booking as any).estimatedAddonsPrice && parseFloat((booking as any).estimatedAddonsPrice) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Add-ons:</span>
                        <span className="font-medium">€{(booking as any).estimatedAddonsPrice}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-300 pt-2 flex items-center justify-between font-semibold">
                      <span className="text-gray-900">Total Estimate:</span>
                      <span className="text-gray-900">€{booking.estimatedTotal || booking.estimatedPrice}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {((booking as any).roomAnalysis || (booking as any).preferredDate) && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Additional Information
                  </h4>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                    {(booking as any).preferredDate && (
                      <div>
                        <span className="text-sm text-gray-600 block">Preferred Date:</span>
                        <span className="font-medium">
                          {new Date((booking as any).preferredDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {(booking as any).roomAnalysis && (
                      <div>
                        <span className="text-sm text-gray-600 block mb-1">Room Analysis:</span>
                        <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                          {(booking as any).roomAnalysis}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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