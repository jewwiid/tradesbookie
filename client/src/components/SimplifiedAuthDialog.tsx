import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Receipt, User, Mail, Phone, Star, Shield } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
    window.location.href = '/api/signup';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'invoice' | 'guest' | 'oauth')} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="invoice" className="text-xs">Harvey Norman</TabsTrigger>
            <TabsTrigger value="guest" className="text-xs">Quick Start</TabsTrigger>
            <TabsTrigger value="oauth" className="text-xs">Full Account</TabsTrigger>
          </TabsList>

          <TabsContent value="invoice" className="space-y-4">
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
                    placeholder="HN-CRK-2576597"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: HN-[STORE]-[NUMBER] (e.g., HN-CRK-2576597 for Carrickmines)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Store codes: CRK (Carrickmines), DUB (Dublin), COR (Cork), GAL (Galway), LIM (Limerick)
                  </p>
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

          <TabsContent value="guest" className="space-y-4">
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

          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-lg">Full Account</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create a secure account for complete access and history
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleOAuthSignup}
                  variant="outline"
                  className="w-full"
                >
                  <User className="w-4 h-4 mr-2" />
                  Create New Account
                </Button>
                <Button 
                  onClick={handleOAuthLogin}
                  variant="outline"
                  className="w-full"
                >
                  Sign In to Existing Account
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Secure sign-in using your existing Replit account
                </p>
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