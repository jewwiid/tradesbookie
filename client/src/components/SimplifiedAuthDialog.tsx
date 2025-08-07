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

  // Harvey Norman Invoice Login
  const invoiceLoginMutation = useMutation({
    mutationFn: async (data: { invoiceNumber: string }) => {
      const response = await apiRequest('POST', '/api/auth/invoice-login', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invoice login failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.isNewRegistration ? "Account Created!" : "Welcome back!",
        description: data.isNewRegistration 
          ? `Your account has been created using Harvey Norman invoice ${data.invoiceNumber}. You can now book your TV installation.`
          : `Signed in using Harvey Norman invoice ${data.invoiceNumber}. Any bookings you make will be tracked to this invoice.`,
      });
      onSuccess(data.user);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Invoice Login Failed",
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
      onSuccess(data.user);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Guest Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleInvoiceLogin = () => {
    if (!invoiceNumber.trim()) {
      toast({
        title: "Invoice Number Required",
        description: "Please enter your Harvey Norman invoice number",
        variant: "destructive",
      });
      return;
    }
    invoiceLoginMutation.mutate({ invoiceNumber: invoiceNumber.trim() });
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
        onSuccess(data.user);
        onClose();
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
            <TabsTrigger value="invoice" className="text-xs">Harvey Norman</TabsTrigger>
            <TabsTrigger value="guest" className="text-xs">Quick Start</TabsTrigger>
            <TabsTrigger value="email" className="text-xs">Email</TabsTrigger>
            <TabsTrigger value="oauth" className="text-xs">Social Account</TabsTrigger>
          </TabsList>

          <TabsContent value="invoice" className="space-y-4 min-h-[300px]">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-lg">Harvey Norman Customer</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Already purchased a TV? Use your receipt to book installation instantly
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="invoice">Invoice Number</Label>
                  <Input
                    id="invoice"
                    placeholder="Enter your Harvey Norman invoice number"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="mt-1"
                  />
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg text-xs text-gray-600">
                    <p className="font-medium mb-2 text-blue-800">Format: HN-[STORE]-[NUMBER]</p>
                    <p className="mb-2">All store codes:</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <span>BLA (Blanchardstown)</span>
                      <span>CKM (Carrickmines)</span>
                      <span>CRK (Cork)</span>
                      <span>CAS (Castlebar)</span>
                      <span>DRO (Drogheda)</span>
                      <span>FON (Fonthill)</span>
                      <span>GAL (Galway)</span>
                      <span>KIN (Kinsale Road)</span>
                      <span>LIM (Limerick)</span>
                      <span>LIT (Little Island)</span>
                      <span>NAA (Naas)</span>
                      <span>RAT (Rathfarnham)</span>
                      <span>SLI (Sligo)</span>
                      <span>SWO (Swords)</span>
                      <span>TAL (Tallaght)</span>
                      <span>TRA (Tralee)</span>
                      <span>WAT (Waterford)</span>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleInvoiceLogin}
                  disabled={invoiceLoginMutation.isPending}
                  className="w-full gradient-bg"
                >
                  {invoiceLoginMutation.isPending ? 'Booking...' : 'Book with Invoice Number'}
                </Button>
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
                    placeholder="+353 1 234 5678"
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