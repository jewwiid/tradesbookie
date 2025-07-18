import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Wrench, ArrowLeft, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, KeyboardIcon } from "lucide-react";

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Alt + D for demo credentials
      if (e.altKey && e.key === 'd') {
        e.preventDefault();
        setFormData({
          email: "test@tradesbook.ie",
          password: "demo123"
        });
        setValidationErrors({});
        toast({
          title: "Demo Credentials Loaded",
          description: "Press Enter to sign in with demo account",
        });
      }
      // Alt + R for registration
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        setLocation('/installer-registration');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [setLocation, toast]);

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Installer Login
          </h2>
          <p className="text-gray-600 mb-4">
            Access your dashboard to manage bookings and track progress
          </p>
          
          {/* Help Text */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <strong>Looking for customer access?</strong> 
                <p className="mt-1">
                  Customer bookings use the main site login. 
                  <Link href="/" className="text-yellow-700 hover:text-yellow-900 underline ml-1">
                    Return to homepage
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign In to Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Email Address
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="installer@example.com"
                    className={`pr-10 ${validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
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
                <Label htmlFor="password" className="flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    className={`pr-10 ${validationErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>
            
            {/* Forgot Password Link */}
            <div className="text-center mt-4">
              <Link href="/forgot-password">
                <Button 
                  variant="link" 
                  className="text-sm text-gray-600 hover:text-primary"
                >
                  Forgot your password?
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Approval Status Display */}
        {pendingApproval && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-orange-900 mb-2">
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
        )}

        {/* Registration Link */}
        <div className="text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 text-sm font-medium mb-2">
              New to our platform?
            </p>
            <Button asChild variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
              <Link href="/installer-registration">
                Create New Installer Account
              </Link>
            </Button>
            <p className="text-green-600 text-xs mt-2">
              Create account → Complete profile → Wait for admin approval
            </p>
          </div>
        </div>

        {/* Demo Access */}
        <div className="text-center">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <h3 className="font-semibold text-blue-900 mb-2">Try Demo Access</h3>
              <p className="text-blue-700 text-sm mb-3">
                Explore the installer dashboard without registration
              </p>
              <div className="bg-blue-100 rounded-lg p-3 mb-3 text-xs">
                <p className="font-medium text-blue-800">Demo credentials:</p>
                <p className="text-blue-700">Email: test@tradesbook.ie</p>
                <p className="text-blue-700">Password: demo123</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => {
                  setFormData({
                    email: "test@tradesbook.ie",
                    password: "demo123"
                  });
                  setValidationErrors({});
                }}
              >
                Fill Demo Credentials
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="text-center">
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-center mb-2">
                <KeyboardIcon className="w-4 h-4 text-gray-500 mr-2" />
                <h4 className="text-sm font-medium text-gray-700">Keyboard Shortcuts</h4>
              </div>
              <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
                <div className="flex justify-between items-center">
                  <span>Load demo credentials</span>
                  <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Alt + D</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>Go to registration</span>
                  <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Alt + R</kbd>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}