import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { PasswordStrengthMeter, PasswordMatchIndicator } from "@/components/PasswordStrengthMeter";
import { calculatePasswordStrength } from "@/utils/passwordStrength";

export default function InstallerRegistration() {
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
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

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
          password: formData.password,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Installer Registration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Join our network of professional TV installers
            </p>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange("firstName")}
                  className={errors.firstName ? "border-red-500" : ""}
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
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange("lastName")}
                  className={errors.lastName ? "border-red-500" : ""}
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
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                type="text"
                value={formData.businessName}
                onChange={handleInputChange("businessName")}
                className={errors.businessName ? "border-red-500" : ""}
                placeholder="e.g. Smith TV Installation Services"
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
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange("phone")}
                className={errors.phone ? "border-red-500" : ""}
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

            <div className="space-y-4">
              <Label className="text-base font-medium">Business Address</Label>
              
              <div className="space-y-2">
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                  id="streetAddress"
                  type="text"
                  value={formData.streetAddress}
                  onChange={handleInputChange("streetAddress")}
                  className={errors.streetAddress ? "border-red-500" : ""}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="town">Town/City</Label>
                  <Input
                    id="town"
                    type="text"
                    value={formData.town}
                    onChange={handleInputChange("town")}
                    className={errors.town ? "border-red-500" : ""}
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
                  <Label htmlFor="county">County</Label>
                  <Input
                    id="county"
                    type="text"
                    value={formData.county}
                    onChange={handleInputChange("county")}
                    className={errors.county ? "border-red-500" : ""}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="eircode">Eircode</Label>
                <Input
                  id="eircode"
                  type="text"
                  value={formData.eircode}
                  onChange={handleInputChange("eircode")}
                  className={errors.eircode ? "border-red-500" : ""}
                  placeholder="D02 X285 or D02X285"
                  disabled={isLoading}
                  maxLength={8}
                />
                {errors.eircode && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.eircode}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  3-character Routing Key + 4-character Unique Identifier
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange("email")}
                className={errors.email ? "border-red-500" : ""}
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

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange("password")}
                className={errors.password ? "border-red-500" : ""}
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
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange("confirmPassword")}
                className={errors.confirmPassword ? "border-red-500" : ""}
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

            <Button 
              type="submit" 
              className="w-full disabled:opacity-50" 
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
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/installer-login" className="text-primary hover:underline">
                Sign in here
              </Link>
            </p>
          </div>

          <Alert className="mt-4">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-xs">
              After registration, you'll need to complete your profile and wait for admin approval before accessing the installer dashboard.
            </AlertDescription>
          </Alert>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}