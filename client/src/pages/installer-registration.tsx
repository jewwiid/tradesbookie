import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, CheckCircle, AlertCircle, ArrowLeft, Tv, Home, Car, Lightbulb, Wind } from "lucide-react";
import { PasswordStrengthMeter, PasswordMatchIndicator } from "@/components/PasswordStrengthMeter";
import { calculatePasswordStrength } from "@/utils/passwordStrength";

const serviceTypes: Record<string, { name: string; icon: React.ComponentType<any>; color: string }> = {
  'tv-installation': { name: 'TV Installation', icon: Tv, color: 'text-blue-600' },
  'home-security': { name: 'Home Security Systems', icon: Shield, color: 'text-green-600' },
  'smart-home': { name: 'Smart Home Setup', icon: Home, color: 'text-purple-600' },
  'electrical': { name: 'Electrical Services', icon: Lightbulb, color: 'text-yellow-600' },
  'hvac': { name: 'HVAC Installation', icon: Wind, color: 'text-cyan-600' },
  'automotive': { name: 'Automotive Electronics', icon: Car, color: 'text-red-600' }
};

export default function InstallerRegistration() {
  const [, setLocation] = useLocation();
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    businessName: "",
    email: "",
    phone: "",
    streetAddress: "",
    town: "",
    county: "",
    eircode: "",
    yearsExperience: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  // Get service type from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');
    if (serviceParam && serviceTypes[serviceParam]) {
      setSelectedServiceType(serviceParam);
    }
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.businessName) {
      newErrors.businessName = "Business name is required";
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    }

    if (!formData.streetAddress) {
      newErrors.streetAddress = "Street address is required";
    }

    if (!formData.town) {
      newErrors.town = "Town is required";
    }

    if (!formData.eircode) {
      newErrors.eircode = "Eircode is required";
    } else {
      // Validate Eircode format: 3 characters + space + 4 characters OR 7 characters without space
      const eircodeRegex = /^[A-Z0-9]{3}\s?[A-Z0-9]{4}$/i;
      if (!eircodeRegex.test(formData.eircode)) {
        newErrors.eircode = "Invalid Eircode format (e.g., D02 X285 or D02X285)";
      }
    }

    if (!formData.county) {
      newErrors.county = "County is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const passwordStrength = calculatePasswordStrength(formData.password);
      if (passwordStrength.score === 0) {
        newErrors.password = "Password must be at least 8 characters";
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/installers/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          businessName: formData.businessName,
          email: formData.email,
          phone: formData.phone,
          address: `${formData.streetAddress}, ${formData.town}, ${formData.county}, ${formData.eircode}`,
          county: formData.county,
          yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : 0,
          password: formData.password,
          selectedServiceType: selectedServiceType, // Add the selected service type
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast({
          title: "Registration Successful",
          description: "Your account has been created. Redirecting to login page...",
        });
        
        // Redirect to installer login page after 2 seconds
        setTimeout(() => {
          window.location.href = '/installer-login';
        }, 2000);
      } else {
        toast({
          title: "Registration Failed",
          description: data.error || "An error occurred during registration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Network error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Registration Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your installer account has been created successfully! Please sign in to access your dashboard and wait for admin approval.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Next steps:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Sign in with your email and password</li>
                  <li>Complete your installer profile</li>
                  <li>Wait for admin approval (typically 24-48 hours)</li>
                  <li>Start receiving job leads!</li>
                </ol>
              </div>
              
              <Button asChild className="w-full">
                <Link href="/installer-login">
                  Sign In Now
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedService = selectedServiceType ? serviceTypes[selectedServiceType] : null;
  const ServiceIcon = selectedService?.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/installer-service-selection" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Service Selection
          </Link>
          
          {selectedService && ServiceIcon && (
            <div className="flex items-center justify-center mb-6">
              <div className={`w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mr-4`}>
                <ServiceIcon className={`w-8 h-8 ${selectedService.color}`} />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold text-gray-900">{selectedService.name}</h1>
                <p className="text-gray-600">Installer Registration</p>
              </div>
            </div>
          )}
          
          {!selectedService && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Installer Registration</h1>
              <p className="text-gray-600">Join our network of professional installers</p>
            </div>
          )}
        </div>

        {/* Registration Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-xl">Create Your Installer Account</CardTitle>
            <p className="text-center text-gray-600 text-sm">
              Complete all fields to register as a professional installer
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Service Type Display */}
              {selectedService && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <Badge className="bg-blue-100 text-blue-800">Selected Service</Badge>
                    <span className="ml-3 font-semibold text-blue-900">{selectedService.name}</span>
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange("firstName")}
                      className={`h-11 ${errors.firstName ? "border-red-500" : ""}`}
                      placeholder="John"
                      disabled={isLoading}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange("lastName")}
                      className={`h-11 ${errors.lastName ? "border-red-500" : ""}`}
                      placeholder="Smith"
                      disabled={isLoading}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange("email")}
                    className={`h-11 ${errors.email ? "border-red-500" : ""}`}
                    placeholder="your.email@example.com"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm font-medium">Business Name</Label>
                    <Input
                      id="businessName"
                      type="text"
                      value={formData.businessName}
                      onChange={handleInputChange("businessName")}
                      className={`h-11 ${errors.businessName ? "border-red-500" : ""}`}
                      placeholder="e.g. Smith Installation Services"
                      disabled={isLoading}
                    />
                    {errors.businessName && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.businessName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange("phone")}
                      className={`h-11 ${errors.phone ? "border-red-500" : ""}`}
                      placeholder="087 123 4567"
                      disabled={isLoading}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Business Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Business Address</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="streetAddress" className="text-sm font-medium">Street Address</Label>
                  <Input
                    id="streetAddress"
                    type="text"
                    value={formData.streetAddress}
                    onChange={handleInputChange("streetAddress")}
                    className={`h-11 ${errors.streetAddress ? "border-red-500" : ""}`}
                    placeholder="123 Main Street"
                    disabled={isLoading}
                  />
                  {errors.streetAddress && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.streetAddress}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="town" className="text-sm font-medium">Town/City</Label>
                    <Input
                      id="town"
                      type="text"
                      value={formData.town}
                      onChange={handleInputChange("town")}
                      className={`h-11 ${errors.town ? "border-red-500" : ""}`}
                      placeholder="Dublin"
                      disabled={isLoading}
                    />
                    {errors.town && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.town}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="county" className="text-sm font-medium">County</Label>
                    <Input
                      id="county"
                      type="text"
                      value={formData.county}
                      onChange={handleInputChange("county")}
                      className={`h-11 ${errors.county ? "border-red-500" : ""}`}
                      placeholder="Dublin"
                      disabled={isLoading}
                    />
                    {errors.county && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.county}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eircode" className="text-sm font-medium">Eircode</Label>
                    <Input
                      id="eircode"
                      type="text"
                      value={formData.eircode}
                      onChange={handleInputChange("eircode")}
                      className={`h-11 ${errors.eircode ? "border-red-500" : ""}`}
                      placeholder="D02 X285"
                      disabled={isLoading}
                      maxLength={8}
                    />
                    {errors.eircode && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.eircode}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Experience */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Professional Experience</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="yearsExperience" className="text-sm font-medium">Years of Experience</Label>
                  <select
                    id="yearsExperience"
                    value={formData.yearsExperience}
                    onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: e.target.value }))}
                    className={`h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.yearsExperience ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  >
                    <option value="">Select years of experience</option>
                    <option value="0">Less than 1 year</option>
                    <option value="1">1 year</option>
                    <option value="2">2 years</option>
                    <option value="3">3 years</option>
                    <option value="4">4 years</option>
                    <option value="5">5 years</option>
                    <option value="6">6 years</option>
                    <option value="7">7 years</option>
                    <option value="8">8 years</option>
                    <option value="9">9 years</option>
                    <option value="10">10+ years</option>
                    <option value="15">15+ years</option>
                    <option value="20">20+ years</option>
                  </select>
                  {errors.yearsExperience && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.yearsExperience}
                    </p>
                  )}
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Account Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange("password")}
                      className={`h-11 ${errors.password ? "border-red-500" : ""}`}
                      placeholder="Minimum 8 characters"
                      disabled={isLoading}
                    />
                    {errors.password && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.password}
                      </p>
                    )}
                    {formData.password && (
                      <PasswordStrengthMeter 
                        password={formData.password} 
                        showRequirements={true}
                        className="mt-2"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange("confirmPassword")}
                      className={`h-11 ${errors.confirmPassword ? "border-red-500" : ""}`}
                      placeholder="Re-enter your password"
                      disabled={isLoading}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.confirmPassword}
                      </p>
                    )}
                    <PasswordMatchIndicator 
                      password={formData.password}
                      confirmPassword={formData.confirmPassword}
                      showMatch={formData.password.length > 0 && formData.confirmPassword.length > 0}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-lg font-semibold disabled:opacity-50" 
                  disabled={isLoading || 
                    (!formData.firstName || !formData.lastName || !formData.businessName || 
                     !formData.email || !formData.password || !formData.confirmPassword ||
                     formData.password !== formData.confirmPassword ||
                     calculatePasswordStrength(formData.password).score === 0)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Installer Account"
                  )}
                </Button>
              </div>
            </form>

            {/* Footer Links */}
            <div className="mt-8 pt-6 border-t text-center space-y-4">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/installer-login" className="text-primary hover:underline font-semibold">
                  Sign in here
                </Link>
              </p>
              
              <Alert className="text-left">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Next Steps:</strong> After registration, complete your profile and wait for admin approval (typically 24-48 hours) before accessing the installer dashboard.
                </AlertDescription>
              </Alert>
            </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}