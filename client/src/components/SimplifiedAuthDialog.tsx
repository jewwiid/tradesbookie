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

interface SimplifiedAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  title?: string;
  description?: string;
  defaultTab?: 'invoice' | 'guest' | 'oauth';
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
        title: data.isNewRegistration ? "Welcome!" : "Welcome back!",
        description: data.message,
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

  const handleOAuthLoginWithAccountSelection = async () => {
    if (isAuthenticated) {
      try {
        // Show realistic expectations
        toast({
          title: "Account Switching Instructions",
          description: "Logging you out. For a different account, please use an incognito window or clear browser data.",
          duration: 5000,
        });

        // Force logout with session clearing
        await fetch('/api/logout', { 
          method: 'POST',
          credentials: 'include'
        });

        // Clear any local storage or session storage
        localStorage.clear();
        sessionStorage.clear();

        // Clear any cached authentication data
        queryClient.removeQueries({ queryKey: ['/api/auth/user'] });

        // Redirect to home page instead of immediate login
        setTimeout(() => {
          window.location.href = '/?logged_out=true';
        }, 1000);
      } catch (error) {
        console.error('Logout error:', error);
        toast({
          title: "Error",
          description: "Unable to log out. Please try using the profile menu.",
          variant: "destructive",
        });
      }
    } else {
      // User is not logged in, proceed with normal login
      window.location.href = '/api/login';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto" aria-describedby="simplified-auth-description">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription id="simplified-auth-description" className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'invoice' | 'guest' | 'oauth')} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="invoice" className="text-xs">Harvey Norman</TabsTrigger>
            <TabsTrigger value="guest" className="text-xs">Quick Start</TabsTrigger>
            <TabsTrigger value="oauth" className="text-xs">Full Account</TabsTrigger>
          </TabsList>

          <TabsContent value="invoice" className="space-y-4 min-h-[300px]">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-lg">Harvey Norman Customer</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Already purchased a TV? Use your receipt to sign in instantly
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
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                    <p className="font-medium mb-2">Format: HN-[STORE]-[NUMBER]</p>
                    <p className="mb-2">Store codes:</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <span>BLA (Blanchardstown)</span>
                      <span>CRK (Carrickmines)</span>
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
                  {invoiceLoginMutation.isPending ? 'Signing In...' : 'Sign In with Receipt'}
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
                <Button 
                  onClick={handleOAuthLogin}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <User className="w-4 h-4 mr-2" />
                  Sign In with Social Account
                </Button>
                
                {isAuthenticated && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Already Signed In
                        </span>
                      </div>
                    </div>
                    <Button 
                      onClick={handleOAuthLoginWithAccountSelection}
                      variant="outline"
                      className="w-full border-blue-200 hover:bg-blue-50"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Switch Account
                    </Button>
                  </>
                )}
                
                <p className="text-xs text-center text-muted-foreground">
                  {isAuthenticated 
                    ? `Currently signed in as ${user?.email || 'your account'}. To switch accounts, you'll need to log out and manually clear your browser's OAuth session with Replit.`
                    : "Sign in using your Replit account. Account creation happens automatically on first sign-in."
                  }
                </p>
                
                {isAuthenticated && (
                  <div className="text-xs text-center text-amber-600 bg-amber-50 p-2 rounded border">
                    <strong>Note:</strong> OAuth account switching is limited by Replit's authentication system. For a different account, try logging out and using an incognito/private browser window.
                  </div>
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