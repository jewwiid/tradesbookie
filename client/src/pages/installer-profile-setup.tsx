import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Wrench, MapPin, Star, Shield, CheckCircle, ArrowLeft, User, Mail } from "lucide-react";

interface CurrentUser {
  id: number;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export default function InstallerProfileSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get current user info from OAuth
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Type the current user data
  const typedCurrentUser = currentUser as CurrentUser;

  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    serviceArea: "",
    county: "",
    experience: "",
    specialties: [] as string[],
    deviceTypes: [] as string[],
    certifications: "",
    insurance: false,
    backgroundCheck: false,
    tools: false,
    transportation: false,
    availability: "",
    bio: "",
    maxTravelDistance: "",
    emergencyCallout: false,
    weekendAvailable: false
  });

  // Pre-populate form with OAuth user data
  useEffect(() => {
    if (typedCurrentUser) {
      setFormData(prev => ({
        ...prev,
        email: typedCurrentUser.email || "",
        name: `${typedCurrentUser.firstName || ""} ${typedCurrentUser.lastName || ""}`.trim()
      }));
    }
  }, [typedCurrentUser]);

  const createInstallerMutation = useMutation({
    mutationFn: async (data: any) => {
      // Use update endpoint for OAuth users who already have an account
      if (typedCurrentUser) {
        return await apiRequest("POST", "/api/installers/profile/update", data);
      }
      // Use register endpoint for non-OAuth users
      return await apiRequest("POST", "/api/installers/register", data);
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Setup Complete!",
        description: "Your installer profile has been submitted for admin approval.",
      });
      // Redirect to installer login page for approval status
      setLocation("/installer-login");
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to complete profile setup. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.businessName || !formData.phone || !formData.county) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createInstallerMutation.mutate(formData);
  };

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specialties: checked 
        ? [...prev.specialties, specialty]
        : prev.specialties.filter(s => s !== specialty)
    }));
  };

  const handleDeviceTypeChange = (deviceType: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      deviceTypes: checked 
        ? [...prev.deviceTypes, deviceType]
        : prev.deviceTypes.filter(d => d !== deviceType)
    }));
  };

  const counties = [
    "Dublin", "Cork", "Galway", "Limerick", "Waterford", "Kilkenny", "Wexford",
    "Kildare", "Meath", "Wicklow", "Carlow", "Laois", "Offaly", "Tipperary",
    "Clare", "Kerry", "Mayo", "Donegal", "Sligo", "Leitrim", "Roscommon",
    "Longford", "Westmeath", "Cavan", "Monaghan", "Louth", "Antrim", "Armagh",
    "Down", "Fermanagh", "Londonderry", "Tyrone"
  ];

  const specialtyOptions = [
    "Wall Mounting", "Ceiling Installation", "Cable Management", "Sound System Setup",
    "Smart TV Configuration", "Streaming Setup", "Gaming Console Installation"
  ];

  const deviceTypeOptions = [
    "LED/LCD TVs", "OLED TVs", "QLED TVs", "Projectors", "Sound Bars", 
    "Home Theater Systems", "Gaming Consoles", "Streaming Devices"
  ];

  // Redirect if not authenticated
  if (!typedCurrentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              You need to be signed in to complete your installer profile setup.
            </p>
            <Link href="/installer-login">
              <Button className="w-full">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Installer Profile
          </h1>
          <p className="text-gray-600">
            Set up your installer profile to start receiving job requests
          </p>
          
          {/* Show current user info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
            <div className="flex items-center justify-center gap-2 text-green-800">
              <Mail className="w-4 h-4" />
              <span className="font-medium">Signed in as: {typedCurrentUser.email}</span>
            </div>
          </div>
        </div>

        {/* Profile Setup Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Installer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Smith"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="Dublin TV Solutions"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="mt-1 bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email from your OAuth account</p>
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+353851159264"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Service Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="county">Primary County *</Label>
                  <Select 
                    value={formData.county} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, county: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select your primary county" />
                    </SelectTrigger>
                    <SelectContent>
                      {counties.map((county) => (
                        <SelectItem key={county} value={county}>
                          {county}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxTravelDistance">Max Travel Distance (km)</Label>
                  <Input
                    id="maxTravelDistance"
                    type="number"
                    value={formData.maxTravelDistance}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxTravelDistance: e.target.value }))}
                    placeholder="50"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Experience and Specialties */}
              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <Select 
                  value={formData.experience} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2">1-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="6-10">6-10 years</SelectItem>
                    <SelectItem value="10+">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Specialties */}
              <div>
                <Label className="text-base font-medium">Installation Specialties</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {specialtyOptions.map((specialty) => (
                    <div key={specialty} className="flex items-center space-x-2">
                      <Checkbox
                        id={specialty}
                        checked={formData.specialties.includes(specialty)}
                        onCheckedChange={(checked) => handleSpecialtyChange(specialty, checked as boolean)}
                      />
                      <Label htmlFor={specialty} className="text-sm">
                        {specialty}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Device Types */}
              <div>
                <Label className="text-base font-medium">Device Types Experience</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {deviceTypeOptions.map((deviceType) => (
                    <div key={deviceType} className="flex items-center space-x-2">
                      <Checkbox
                        id={deviceType}
                        checked={formData.deviceTypes.includes(deviceType)}
                        onCheckedChange={(checked) => handleDeviceTypeChange(deviceType, checked as boolean)}
                      />
                      <Label htmlFor={deviceType} className="text-sm">
                        {deviceType}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell customers about your experience and approach to TV installation..."
                  className="mt-1"
                  rows={4}
                />
              </div>

              {/* Availability Options */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Availability Options</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emergencyCallout"
                      checked={formData.emergencyCallout}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emergencyCallout: checked as boolean }))}
                    />
                    <Label htmlFor="emergencyCallout">Emergency Callout Service</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="weekendAvailable"
                      checked={formData.weekendAvailable}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, weekendAvailable: checked as boolean }))}
                    />
                    <Label htmlFor="weekendAvailable">Weekend Availability</Label>
                  </div>
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Label className="text-base font-medium text-blue-900 mb-3 block">
                  Professional Requirements
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="insurance"
                      checked={formData.insurance}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, insurance: checked as boolean }))}
                    />
                    <Label htmlFor="insurance" className="text-sm text-blue-800">
                      I have professional liability insurance
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tools"
                      checked={formData.tools}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, tools: checked as boolean }))}
                    />
                    <Label htmlFor="tools" className="text-sm text-blue-800">
                      I have professional installation tools and equipment
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="transportation"
                      checked={formData.transportation}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, transportation: checked as boolean }))}
                    />
                    <Label htmlFor="transportation" className="text-sm text-blue-800">
                      I have reliable transportation for service calls
                    </Label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Link href="/installer-login" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={createInstallerMutation.isPending}
                >
                  {createInstallerMutation.isPending ? (
                    "Setting up profile..."
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Setup
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}