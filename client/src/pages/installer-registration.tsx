import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Wrench, MapPin, Star, Shield, CheckCircle, ArrowLeft } from "lucide-react";

export default function InstallerRegistration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
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
    hourlyRate: "",
    bio: "",
    maxTravelDistance: "",
    emergencyCallout: false,
    weekendAvailable: false
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/installers/register", "POST", data);
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful!",
        description: "Welcome to the SmartTVMount installer network. You can now access your dashboard.",
      });
      // Redirect to installer dashboard with their ID
      setLocation(`/installer-login`);
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.insurance || !formData.backgroundCheck || !formData.tools || !formData.transportation) {
      toast({
        title: "Requirements Not Met",
        description: "Please ensure all requirements are checked.",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate(formData);
  };

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specialties: checked 
        ? [...prev.specialties, specialty]
        : prev.specialties.filter(s => s !== specialty)
    }));
  };

  const specialtyOptions = [
    "Wall Mounting", "Ceiling Mounting", "Cable Management", 
    "Home Theater Setup", "Sound System Installation", "Smart TV Configuration",
    "Soundbar Installation", "Gaming Console Setup", "Streaming Device Setup"
  ];

  const deviceOptions = [
    "LED TVs", "OLED TVs", "QLED TVs", "Plasma TVs", "Projectors",
    "Soundbars", "Home Theater Systems", "Gaming Consoles", 
    "Streaming Devices", "Digital Set-top Boxes", "Smart Home Integration"
  ];

  const countyOptions = [
    "Antrim", "Armagh", "Carlow", "Cavan", "Clare", "Cork", "Derry", 
    "Donegal", "Down", "Dublin", "Fermanagh", "Galway", "Kerry", 
    "Kildare", "Kilkenny", "Laois", "Leitrim", "Limerick", "Longford", 
    "Louth", "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", 
    "Sligo", "Tipperary", "Tyrone", "Waterford", "Westmeath", "Wexford", "Wicklow"
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Join Our Installer Network
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Become a certified SmartTVMount installer and connect with customers in your area
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wrench className="w-5 h-5 mr-2 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="Smith TV Installations"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary" />
                Service Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="county">Primary County *</Label>
                  <Select value={formData.county} onValueChange={(value) => setFormData(prev => ({ ...prev, county: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your primary county" />
                    </SelectTrigger>
                    <SelectContent>
                      {countyOptions.map((county) => (
                        <SelectItem key={county} value={county}>{county}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="serviceArea">Service Area (Towns/Cities) *</Label>
                  <Input
                    id="serviceArea"
                    required
                    value={formData.serviceArea}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceArea: e.target.value }))}
                    placeholder="Dublin, Cork, Galway"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxTravelDistance">Maximum Travel Distance (km) *</Label>
                  <Select value={formData.maxTravelDistance} onValueChange={(value) => setFormData(prev => ({ ...prev, maxTravelDistance: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select travel distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">Up to 25km</SelectItem>
                      <SelectItem value="50">Up to 50km</SelectItem>
                      <SelectItem value="100">Up to 100km</SelectItem>
                      <SelectItem value="150">Up to 150km</SelectItem>
                      <SelectItem value="nationwide">Nationwide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Select value={formData.experience} onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2">1-2 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="6-10">6-10 years</SelectItem>
                      <SelectItem value="10+">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Installation Specialties</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {specialtyOptions.map((specialty) => (
                    <div key={specialty} className="flex items-center space-x-2">
                      <Checkbox
                        id={specialty}
                        checked={formData.specialties.includes(specialty)}
                        onCheckedChange={(checked) => handleSpecialtyChange(specialty, checked as boolean)}
                      />
                      <Label htmlFor={specialty} className="text-sm">{specialty}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Device Types & Expertise</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {deviceOptions.map((device) => (
                    <div key={device} className="flex items-center space-x-2">
                      <Checkbox
                        id={device}
                        checked={formData.deviceTypes.includes(device)}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            deviceTypes: checked 
                              ? [...prev.deviceTypes, device]
                              : prev.deviceTypes.filter(d => d !== device)
                          }));
                        }}
                      />
                      <Label htmlFor={device} className="text-sm">{device}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate *</Label>
                  <Input
                    id="hourlyRate"
                    required
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                    placeholder="$50/hour"
                  />
                </div>
                <div>
                  <Label htmlFor="availability">Availability</Label>
                  <Select value={formData.availability} onValueChange={(value) => setFormData(prev => ({ ...prev, availability: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekdays">Weekdays only</SelectItem>
                      <SelectItem value="weekends">Weekends only</SelectItem>
                      <SelectItem value="flexible">Flexible schedule</SelectItem>
                      <SelectItem value="evenings">Evenings available</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell customers about your experience and what makes you a great installer..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Requirements & Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-primary" />
                Requirements & Certifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="certifications">Certifications & Licenses</Label>
                <Textarea
                  id="certifications"
                  value={formData.certifications}
                  onChange={(e) => setFormData(prev => ({ ...prev, certifications: e.target.value }))}
                  placeholder="List any relevant certifications, licenses, or training..."
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="insurance"
                    checked={formData.insurance}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, insurance: checked as boolean }))}
                  />
                  <Label htmlFor="insurance">I have current liability insurance *</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="backgroundCheck"
                    checked={formData.backgroundCheck}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, backgroundCheck: checked as boolean }))}
                  />
                  <Label htmlFor="backgroundCheck">I consent to a background check *</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tools"
                    checked={formData.tools}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, tools: checked as boolean }))}
                  />
                  <Label htmlFor="tools">I have professional installation tools *</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="transportation"
                    checked={formData.transportation}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, transportation: checked as boolean }))}
                  />
                  <Label htmlFor="transportation">I have reliable transportation *</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emergencyCallout"
                    checked={formData.emergencyCallout}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emergencyCallout: checked as boolean }))}
                  />
                  <Label htmlFor="emergencyCallout">Available for emergency callouts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="weekendAvailable"
                    checked={formData.weekendAvailable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, weekendAvailable: checked as boolean }))}
                  />
                  <Label htmlFor="weekendAvailable">Available for weekend installations</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-center">
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 px-8 py-3"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}