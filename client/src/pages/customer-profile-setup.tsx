import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { User, Mail, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  registrationMethod?: string;
}

export default function CustomerProfileSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get current user info
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  const [isFormValid, setIsFormValid] = useState(false);

  // Update form data when user data loads
  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        phone: currentUser.phone || '',
        email: currentUser.email || ''
      });
    }
  }, [currentUser]);

  // Check if form is valid
  useEffect(() => {
    const isValid = formData.firstName.trim() !== '' && 
                   formData.lastName.trim() !== '' && 
                   formData.phone.trim() !== '' && 
                   formData.email.trim() !== '';
    setIsFormValid(isValid);
  }, [formData]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: typeof formData) => {
      const response = await apiRequest('PUT', '/api/auth/profile', profileData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated!",
        description: "Your profile has been successfully updated. You can now access all platform features.",
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Redirect to customer dashboard
      setLocation('/customer-dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid && !updateProfileMutation.isPending) {
      updateProfileMutation.mutate(formData);
    }
  };

  const handleSkip = () => {
    setLocation('/customer-dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              You need to be signed in to complete your profile setup.
            </p>
            <Button 
              onClick={() => setLocation('/')}
              className="w-full"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if profile is already complete
  const isProfileComplete = currentUser.firstName && currentUser.lastName && currentUser.phone;
  
  if (isProfileComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle>Profile Complete</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Your profile is already complete! You can access all platform features.
            </p>
            <Button 
              onClick={() => setLocation('/customer-dashboard')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Add a few details to complete your account setup
          </p>
          
          {/* Show current authentication method */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <div className="flex items-center justify-center gap-2 text-blue-800">
              <Mail className="w-4 h-4" />
              <span className="font-medium">
                {currentUser.registrationMethod === 'invoice' 
                  ? `Signed in via retailer invoice: ${currentUser.email}`
                  : `Signed in as: ${currentUser.email}`
                }
              </span>
            </div>
          </div>
        </div>

        {/* Profile Completion Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name */}
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter your first name"
                  className="mt-1"
                />
              </div>
              
              {/* Last Name */}
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter your last name"
                  className="mt-1"
                />
              </div>
              
              {/* Email (readonly for invoice users) */}
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  readOnly={currentUser.registrationMethod === 'invoice'}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 bg-gray-50"
                />
                {currentUser.registrationMethod === 'invoice' && (
                  <p className="text-sm text-gray-500 mt-1">
                    Email address from your retailer invoice
                  </p>
                )}
              </div>
              
              {/* Phone Number */}
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  We'll use this to contact you about your bookings
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1"
                >
                  Skip for Now
                </Button>
                <Button 
                  type="submit" 
                  disabled={!isFormValid || updateProfileMutation.isPending}
                  className="flex-1"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Profile
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Benefits of completing profile */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800 mb-2">Why complete your profile?</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Faster booking process for future installations</li>
            <li>• Installers can contact you directly about your booking</li>
            <li>• Receive SMS updates about booking status</li>
            <li>• Access to booking history and tracking</li>
          </ul>
        </div>
      </div>
    </div>
  );
}