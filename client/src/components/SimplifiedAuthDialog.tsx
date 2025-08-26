import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Receipt, User, Mail, Phone, Star, Shield } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { PasswordStrengthMeter, PasswordMatchIndicator } from '@/components/PasswordStrengthMeter';
import { calculatePasswordStrength } from '@/utils/passwordStrength';
import { Link } from 'wouter';

interface SimplifiedAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  title?: string;
  description?: string;
  defaultTab?: 'invoice' | 'guest' | 'email' | 'oauth';
}

export default function SimplifiedAuthDialog({ 
  isOpen, 
  onClose, 
  onSuccess, 
  title = "Quick Sign In",
  description = "Choose your preferred way to sign in or continue as guest",
  defaultTab = 'invoice'
}: SimplifiedAuthDialogProps) {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Invoice flow states
  const [invoiceStep, setInvoiceStep] = useState<'initial' | 'profile-completion' | 'email-login'>('initial');
  const [currentInvoiceInfo, setCurrentInvoiceInfo] = useState<any>(null);
  
  // Email/Password authentication states
  const [emailAuthMode, setEmailAuthMode] = useState<'login' | 'register'>('login');
  const [emailAuthEmail, setEmailAuthEmail] = useState('');
  const [emailAuthPassword, setEmailAuthPassword] = useState('');
  const [emailAuthConfirmPassword, setEmailAuthConfirmPassword] = useState('');
  const [emailAuthFirstName, setEmailAuthFirstName] = useState('');
  const [emailAuthLastName, setEmailAuthLastName] = useState('');
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  // Update active tab when defaultTab prop changes
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Initial Invoice Check
  const invoiceCheckMutation = useMutation({
    mutationFn: async (data: { invoiceNumber: string; email?: string }) => {
      const response = await apiRequest('POST', '/api/auth/invoice-login', data);
      const responseData = await response.json();
      
      if (!response.ok) {
        // Handle specific security-related status codes as "successful" responses
        if (response.status === 424 && responseData.requiresEmailVerification) {
          // User needs email verification - return as success to trigger email-login step
          return { 
            ...responseData, 
            requiresEmailVerification: true, 
            statusCode: 424,
            userEmail: responseData.userEmail 
          };
        }
        
        if (response.status === 423 && responseData.requiresPassword) {
          // User has password set - return as success to trigger password login
          return { 
            ...responseData, 
            requiresPassword: true, 
            statusCode: 423,
            userEmail: responseData.userEmail 
          };
        }
        
        if (response.status === 422 && responseData.emailMismatch) {
          // Email provided doesn't match account - return as success to show error
          return { 
            ...responseData, 
            emailMismatch: true, 
            statusCode: 422 
          };
        }
        
        // Only throw errors for actual failures
        throw new Error(responseData.error || 'Invoice login failed');
      }
      
      return responseData;
    },
    onSuccess: (data) => {
      // Handle security-related responses
      if (data.requiresEmailVerification) {
        // User needs email verification for security
        setCurrentInvoiceInfo(data);
        setEmail(data.userEmail || ''); // Pre-fill email for user convenience
        setInvoiceStep('email-login');
        toast({
          title: "Security Verification Required",
          description: data.error || "Please verify your email address to access this account.",
        });
        return;
      }
      
      if (data.requiresPassword) {
        // User has password set - redirect to standard login
        toast({
          title: "Password Required",
          description: data.error || "This account has a password set. Please use the standard login.",
          variant: "destructive",
        });
        setActiveTab('email'); // Switch to email tab for password login
        setEmailAuthEmail(data.userEmail || '');
        return;
      }
      
      if (data.emailMismatch) {
        // Email provided doesn't match account
        toast({
          title: "Email Mismatch",
          description: data.error || "The email address provided does not match the account.",
          variant: "destructive",
        });
        return;
      }
      
      // Normal successful login responses
      if (data.user?.isTemporaryAccount) {
        // New invoice - show profile completion form
        setCurrentInvoiceInfo(data);
        setInvoiceStep('profile-completion');
        toast({
          title: "New Invoice Detected!",
          description: data.message,
        });
      } else if (data.user?.profileCompleted) {
        // Existing completed account - login successful
        toast({
          title: "Welcome back!",
          description: `Signed in using invoice ${data.invoiceNumber}.`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/installers/profile'] });
        // Small delay to ensure queries invalidate before success callback
        setTimeout(() => {
          onSuccess(data.user);
          onClose();
        }, 100);
      } else {
        // Existing account but profile not completed - show email login
        setCurrentInvoiceInfo(data);
        setInvoiceStep('email-login');
        toast({
          title: "Profile Setup Required",
          description: "Please enter your email to continue with your account.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Invoice Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Profile Completion for New Invoices
  const profileCompletionMutation = useMutation({
    mutationFn: async (data: { invoiceNumber: string; email: string; firstName: string; lastName: string; phone?: string }) => {
      const response = await apiRequest('POST', '/api/auth/complete-invoice-profile', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Profile completion failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Completed!",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/installers/profile'] });
      // Small delay to ensure queries invalidate before success callback
      setTimeout(() => {
        onSuccess(data.user);
        onClose();
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Profile Completion Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Invoice + Email Login for Existing Users
  const invoiceEmailLoginMutation = useMutation({
    mutationFn: async (data: { invoiceNumber: string; email: string }) => {
      const response = await apiRequest('POST', '/api/auth/invoice-email-login', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Welcome back!",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/installers/profile'] });
      // Small delay to ensure queries invalidate before success callback
      setTimeout(() => {
        onSuccess(data.user);
        onClose();
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Guest Booking
  const guestBookingMutation = useMutation({
    mutationFn: async (data: { email: string; phone: string; firstName?: string; lastName?: string }) => {
      const response = await apiRequest('POST', '/api/auth/guest-booking', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Guest registration failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Guest Account Created",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/installers/profile'] });
      // Small delay to ensure queries invalidate before success callback
      setTimeout(() => {
        onSuccess(data.user);
        onClose();
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Guest Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleInvoiceCheck = () => {
    if (!invoiceNumber.trim()) {
      toast({
        title: "Invoice Number Required",
        description: "Please enter your invoice number",
        variant: "destructive",
      });
      return;
    }
    invoiceCheckMutation.mutate({ invoiceNumber: invoiceNumber.trim() });
  };

  const handleProfileCompletion = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast({
        title: "Required Information Missing",
        description: "Please fill in your name and email address",
        variant: "destructive",
      });
      return;
    }
    profileCompletionMutation.mutate({
      invoiceNumber: invoiceNumber.trim(),
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined
    });
  };

  const handleInvoiceEmailLogin = () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    // Use the same mutation but with email parameter for verification
    invoiceCheckMutation.mutate({
      invoiceNumber: invoiceNumber.trim(),
      email: email.trim()
    });
  };

  const resetInvoiceFlow = () => {
    setInvoiceStep('initial');
    setCurrentInvoiceInfo(null);
    setEmail('');
    setFirstName('');
    setLastName('');
    setPhone('');
  };

  const handleGuestBooking = () => {
    if (!email.trim() || !phone.trim()) {
      toast({
        title: "Required Information",
        description: "Please provide your email and phone number",
        variant: "destructive",
      });
      return;
    }
    guestBookingMutation.mutate({ 
      email: email.trim(), 
      phone: phone.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim()
    });
  };

  const handleOAuthLogin = () => {
    window.location.href = '/api/login';
  };

  const handleOAuthSignup = () => {
    window.location.href = '/api/login';
  };

  // Email authentication mutation
  const emailAuthMutation = useMutation({
    mutationFn: async (data: { mode: 'login' | 'register', email: string, password: string, firstName?: string, lastName?: string }) => {
      const endpoint = data.mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload: any = {
        email: data.email,
        password: data.password,
      };

      if (data.mode === 'register') {
        payload.firstName = data.firstName;
        payload.lastName = data.lastName;
      }

      return apiRequest('POST', endpoint, payload);
    },
    onSuccess: (data: any) => {
      if (data.success) {
        toast({
          title: "Success",
          description: emailAuthMode === 'register' ? "Account created successfully!" : "Signed in successfully!",
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/installers/profile'] });
        // Small delay to ensure queries invalidate before success callback
        setTimeout(() => {
          onSuccess(data.user);
          onClose();
        }, 100);
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleEmailAuth = () => {
    if (!emailAuthEmail || !emailAuthPassword) {
      toast({
        title: "Error",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }

    // Validation for registration mode
    if (emailAuthMode === 'register') {
      const passwordStrength = calculatePasswordStrength(emailAuthPassword);
      
      // Check if password meets minimum requirements
      if (passwordStrength.score === 0) {
        toast({
          title: "Password Too Weak",
          description: "Password must be at least 8 characters long",
          variant: "destructive",
        });
        return;
      }

      // Optional: Warn if password is very weak (score 1) but still allow it
      if (passwordStrength.score === 1) {
        toast({
          title: "Weak Password",
          description: "Consider adding uppercase, numbers, or special characters for better security",
          variant: "default",
        });
      }

      if (!emailAuthConfirmPassword) {
        toast({
          title: "Password Confirmation Required",
          description: "Please confirm your password",
          variant: "destructive",
        });
        return;
      }

      if (emailAuthPassword !== emailAuthConfirmPassword) {
        toast({
          title: "Passwords Don't Match",
          description: "Please make sure both passwords are identical",
          variant: "destructive",
        });
        return;
      }
    }

    emailAuthMutation.mutate({
      mode: emailAuthMode,
      email: emailAuthEmail,
      password: emailAuthPassword,
      firstName: emailAuthFirstName,
      lastName: emailAuthLastName
    });
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="simplified-auth-description">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription id="simplified-auth-description" className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'invoice' | 'guest' | 'email' | 'oauth')} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="invoice" className="text-xs">Invoice</TabsTrigger>
            <TabsTrigger value="guest" className="text-xs">Quick Start</TabsTrigger>
            <TabsTrigger value="email" className="text-xs">Email</TabsTrigger>
            <TabsTrigger value="oauth" className="text-xs">Social Account</TabsTrigger>
          </TabsList>

          <TabsContent value="invoice" className="space-y-4 min-h-[300px]">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-lg">
                    {invoiceStep === 'initial' && 'Invoice Customer'}
                    {invoiceStep === 'profile-completion' && 'Complete Your Profile'}
                    {invoiceStep === 'email-login' && 'Enter Your Email'}
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  {invoiceStep === 'initial' && 'Already purchased a TV? Use your receipt to book installation instantly'}
                  {invoiceStep === 'profile-completion' && 'Please provide your contact details to complete your account setup'}
                  {invoiceStep === 'email-login' && 'Enter the email address associated with your account'}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoiceStep === 'initial' && (
                  <>
                    <div>
                      <Label htmlFor="invoice">Invoice Number</Label>
                      <Input
                        id="invoice"
                        placeholder="e.g. HN-GAL-009876, CR-DUB-123456, or RT-BLA-555666"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="mt-1"
                      />
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg text-xs text-gray-600">
                        <p className="font-medium mb-1 text-blue-800">Supported Retailers & Format Examples:</p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <p>• <span className="font-semibold">Harvey Norman:</span> HN-GAL-009876</p>
                          <p>• <span className="font-semibold">Currys:</span> CR-DUB-123456</p>
                          <p>• <span className="font-semibold">RTV:</span> RT-BLA-555666</p>
                          <p>• <span className="font-semibold">DID Electrical:</span> DD-COR-789012</p>
                        </div>
                        <p className="text-xs">Find your invoice number on your receipt or order confirmation email</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleInvoiceCheck}
                      disabled={invoiceCheckMutation.isPending}
                      className="w-full gradient-bg"
                    >
                      {invoiceCheckMutation.isPending ? 'Checking...' : 'Continue with Invoice'}
                    </Button>
                  </>
                )}

                {invoiceStep === 'profile-completion' && (
                  <>
                    <div className="mb-4 p-3 bg-green-50 rounded-lg text-sm">
                      <p className="font-medium text-green-800">Invoice: {invoiceNumber}</p>
                      <p className="text-green-600 text-xs mt-1">Your {currentInvoiceInfo?.retailerInfo?.name} purchase has been verified!</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="profile-firstName">First Name *</Label>
                        <Input
                          id="profile-firstName"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="profile-lastName">Last Name *</Label>
                        <Input
                          id="profile-lastName"
                          placeholder="Smith"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="profile-email">Email Address *</Label>
                      <Input
                        id="profile-email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="profile-phone">Phone Number</Label>
                      <Input
                        id="profile-phone"
                        type="tel"
                        placeholder="+353851159264"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        onClick={resetInvoiceFlow}
                        variant="outline"
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={handleProfileCompletion}
                        disabled={profileCompletionMutation.isPending}
                        className="flex-1 gradient-bg"
                      >
                        {profileCompletionMutation.isPending ? 'Creating Account...' : 'Complete Profile'}
                      </Button>
                    </div>
                  </>
                )}

                {invoiceStep === 'email-login' && (
                  <>
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
                      <p className="font-medium text-blue-800">Invoice: {invoiceNumber}</p>
                      <p className="text-blue-600 text-xs mt-1">Please enter your email to sign in</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="login-email">Email Address</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Use the email address you provided when completing your profile
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        onClick={resetInvoiceFlow}
                        variant="outline"
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={handleInvoiceEmailLogin}
                        disabled={invoiceCheckMutation.isPending}
                        className="flex-1 gradient-bg"
                      >
                        {invoiceCheckMutation.isPending ? 'Verifying...' : 'Verify Email'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guest" className="space-y-4 min-h-[300px]">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">Quick Booking</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Start booking immediately with just your contact details
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Smith"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+353851159264"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleGuestBooking}
                  disabled={guestBookingMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {guestBookingMutation.isPending ? 'Creating Account...' : 'Continue as Guest'}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  We'll send booking updates to your email and phone
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 min-h-[300px]">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">Email & Password</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  {emailAuthMode === 'login' ? 'Sign in with your email and password' : 'Create a new account with email and password'}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2 mb-4">
                  <Button
                    variant={emailAuthMode === 'login' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setEmailAuthMode('login');
                      setEmailAuthConfirmPassword(''); // Clear confirm password when switching to login
                    }}
                    className="flex-1"
                  >
                    Sign In
                  </Button>
                  <Button
                    variant={emailAuthMode === 'register' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEmailAuthMode('register')}
                    className="flex-1"
                  >
                    Create Account
                  </Button>
                </div>

                {emailAuthMode === 'register' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="email-first-name">First Name</Label>
                      <Input
                        id="email-first-name"
                        placeholder="John"
                        value={emailAuthFirstName}
                        onChange={(e) => setEmailAuthFirstName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email-last-name">Last Name</Label>
                      <Input
                        id="email-last-name"
                        placeholder="Doe"
                        value={emailAuthLastName}
                        onChange={(e) => setEmailAuthLastName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="email-auth-email">Email Address *</Label>
                  <Input
                    id="email-auth-email"
                    type="email"
                    placeholder="john@example.com"
                    value={emailAuthEmail}
                    onChange={(e) => setEmailAuthEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email-auth-password">Password *</Label>
                  <Input
                    id="email-auth-password"
                    type="password"
                    placeholder={emailAuthMode === 'register' ? 'Create a strong password (min 8 characters)' : 'Your password'}
                    value={emailAuthPassword}
                    onChange={(e) => setEmailAuthPassword(e.target.value)}
                    className="mt-1"
                  />
                  {emailAuthMode === 'register' && emailAuthPassword && (
                    <PasswordStrengthMeter 
                      password={emailAuthPassword} 
                      showRequirements={true}
                      className="mt-2"
                    />
                  )}
                </div>

                {emailAuthMode === 'register' && (
                  <div>
                    <Label htmlFor="email-auth-confirm-password">Confirm Password *</Label>
                    <Input
                      id="email-auth-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={emailAuthConfirmPassword}
                      onChange={(e) => setEmailAuthConfirmPassword(e.target.value)}
                      className="mt-1"
                    />
                    <PasswordMatchIndicator 
                      password={emailAuthPassword}
                      confirmPassword={emailAuthConfirmPassword}
                      showMatch={emailAuthPassword.length > 0 && emailAuthConfirmPassword.length > 0}
                    />
                  </div>
                )}

                <Button 
                  onClick={handleEmailAuth}
                  disabled={emailAuthMutation.isPending || (emailAuthMode === 'register' && 
                    (!emailAuthEmail || !emailAuthPassword || !emailAuthConfirmPassword || 
                     emailAuthPassword !== emailAuthConfirmPassword || 
                     calculatePasswordStrength(emailAuthPassword).score === 0))}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {emailAuthMutation.isPending 
                    ? (emailAuthMode === 'login' ? 'Signing In...' : 'Creating Account...') 
                    : (emailAuthMode === 'login' ? 'Sign In' : 'Create Account')
                  }
                </Button>

                {emailAuthMode === 'login' && (
                  <div className="text-center">
                    <Link href="/forgot-password">
                      <Button 
                        variant="link" 
                        className="text-sm text-gray-600 hover:text-blue-600 p-0"
                      >
                        Forgot your password?
                      </Button>
                    </Link>
                  </div>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  {emailAuthMode === 'login' 
                    ? 'Sign in to access your account and booking history'
                    : 'Create an account to manage your bookings and access all features'
                  }
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="oauth" className="space-y-4 min-h-[300px]">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-lg">Full Account</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create a secure social account for complete access and history
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isAuthenticated ? (
                  <>
                    <Button 
                      onClick={handleOAuthLogin}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Sign In with Social Account
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Sign in using your social account. Account creation happens automatically on first sign-in.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-center p-4 bg-green-50 rounded border border-green-200">
                      <User className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="text-sm font-medium text-green-800">Already Signed In</p>
                      <p className="text-xs text-green-600 mt-1">
                        Currently signed in as {user?.email || 'your account'}
                      </p>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      You're already authenticated and can access all platform features.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onClose()}
            className="text-muted-foreground"
          >
            I'll sign in later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}