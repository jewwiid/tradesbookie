import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Wrench, ArrowLeft, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export default function InstallerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const [pendingApproval, setPendingApproval] = useState<{ 
    approvalStatus: string; 
    profileCompleted: boolean 
  } | null>(null);



  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address";
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const loginMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/installers/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        if (response.status === 403) {
          // Account pending approval
          setPendingApproval({
            approvalStatus: responseData.approvalStatus,
            profileCompleted: responseData.profileCompleted
          });
          throw new Error("Account pending approval");
        }
        throw new Error(responseData.error || "Login failed");
      }
      
      return responseData;
    },
    onSuccess: (data: any) => {
      // Store installer data in localStorage for session management
      localStorage.setItem("installer", JSON.stringify(data.installer));
      localStorage.setItem("installerId", data.installer.id.toString());
      
      // Check approval status and redirect accordingly
      if (data.installer.approvalStatus === "approved") {
        toast({
          title: "Login Successful",
          description: "Welcome back to your installer dashboard.",
        });
        setLocation(`/installer-dashboard/${data.installer.id}`);
      } else {
        // Redirect to pending page regardless of specific status
        toast({
          title: "Login Successful",
          description: "Redirecting to your application status page.",
        });
        setLocation("/installer-pending");
      }
    },
    onError: (error: any) => {
      if (error.message === "Account pending approval") {
        // Redirect to pending page for approval status
        toast({
          title: "Application Under Review",
          description: "Your installer application is being reviewed by our admin team.",
          variant: "default",
        });
        setLocation("/installer-pending");
      } else {
        toast({
          title: "Login Failed",
          description: error.message || "Please check your email and password.",
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setValidationErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    loginMutation.mutate(formData);
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Installer Access Portal
          </h2>
          <p className="text-gray-600 mb-4 text-lg">
            Access your dashboard to manage bookings and track progress
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          
          {/* Left Column - Login Form */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">Sign In to Your Account</CardTitle>
                <p className="text-gray-600 text-sm">Access your installer dashboard</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="flex items-center text-sm font-medium">
                      <User className="w-4 h-4 mr-2" />
                      Email Address
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="installer@example.com"
                        className={`h-12 ${validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                      />
                      {validationErrors.email && (
                        <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                      )}
                    </div>
                    {validationErrors.email && (
                      <p className="text-sm text-red-600 mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {validationErrors.email}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="password" className="flex items-center text-sm font-medium">
                      <Lock className="w-4 h-4 mr-2" />
                      Password
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="••••••••"
                        className={`h-12 pr-12 ${validationErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-sm text-red-600 mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {validationErrors.password}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-lg font-semibold"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
                
                {/* Demo Access & Forgot Password */}
                <div className="space-y-3">
                  <div className="text-center">
                    <Button 
                      type="button"
                      variant="outline" 
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        setFormData({
                          email: "test@tradesbook.ie",
                          password: "demo123"
                        });
                        setValidationErrors({});
                        toast({
                          title: "Demo Credentials Loaded",
                          description: "Click Sign In to access the demo account",
                        });
                      }}
                    >
                      Try Demo Access
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <Link href="/forgot-password">
                      <Button 
                        variant="link" 
                        className="text-sm text-gray-600 hover:text-primary"
                      >
                        Forgot your password?
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Registration & Info */}
          <div className="space-y-6">
            {/* Registration */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-900 mb-2 text-lg">
                    New to our platform?
                  </h3>
                  <p className="text-green-700 text-sm mb-4">
                    Join our network of professional installers and start earning
                  </p>
                  <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                    <Link href="/installer-service-selection">
                      Create New Installer Account
                    </Link>
                  </Button>
                  <p className="text-green-600 text-xs mt-3">
                    Select service → Register → Complete profile → Get approved
                  </p>
                </div>
              </CardContent>
            </Card>


          </div>

        </div>

        {/* Professional Platform Info - Full Width */}
        <div className="max-w-5xl mx-auto mt-12">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Professional Installer Platform</h3>
                <p className="text-lg text-gray-600">
                  Join Ireland's leading installation service network and grow your business
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-green-600">€12-30</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Low Lead Fees</h4>
                  <p className="text-sm text-gray-600">Pay only per qualified lead</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-blue-600">€400+</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">High Earnings</h4>
                  <p className="text-sm text-gray-600">Per installation potential</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Wrench className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">AI Matching</h4>
                  <p className="text-sm text-gray-600">Smart job recommendations</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Secure Payments</h4>
                  <p className="text-sm text-gray-600">Protected by Stripe</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Platform Features</h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-900">Real-time Lead Updates</span>
                        <p className="text-sm text-gray-600">Get instant notifications for new jobs via WebSockets</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-900">Digital Wallet System</span>
                        <p className="text-sm text-gray-600">Manage credits, track earnings, and view transaction history</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-900">Customer Reviews & Ratings</span>
                        <p className="text-sm text-gray-600">Build your reputation with verified customer feedback</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-900">Professional Profile</span>
                        <p className="text-sm text-gray-600">Showcase your expertise, experience, and service areas</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h4>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600">1</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Register & Get Approved</span>
                        <p className="text-sm text-gray-600">Complete your profile and wait for admin approval</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600">2</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Browse Available Leads</span>
                        <p className="text-sm text-gray-600">View customer requests matching your skills and location</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600">3</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Purchase & Accept Jobs</span>
                        <p className="text-sm text-gray-600">Buy leads that interest you and accept job assignments</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600">4</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Complete & Get Paid</span>
                        <p className="text-sm text-gray-600">Finish the installation and receive secure payment</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Approval Status Display - Full Width */}
        {pendingApproval && (
          <div className="max-w-2xl mx-auto mt-8">
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-orange-900 mb-2 text-lg">
                    Account Pending Approval
                  </h3>
                  <p className="text-sm text-orange-700 mb-4">
                    {!pendingApproval.profileCompleted 
                      ? "Please complete your profile first, then wait for admin approval to access the dashboard."
                      : "Your profile is complete. Please wait for admin approval to access the dashboard."
                    }
                  </p>
                  <div className="space-y-2">
                    {!pendingApproval.profileCompleted && (
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/installer-profile-setup">
                          Complete Profile
                        </Link>
                      </Button>
                    )}
                    <p className="text-xs text-orange-600">
                      Status: {pendingApproval.approvalStatus}
                    </p>
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