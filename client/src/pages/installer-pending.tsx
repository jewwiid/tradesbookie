import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Clock, CheckCircle, XCircle, AlertCircle, Mail, Phone, MapPin, User, Building, FileText, Edit, Shield, Wrench, Star } from "lucide-react";
import { useLocation } from "wouter";

interface InstallerProfile {
  id: number;
  email: string;
  contactName: string;
  businessName: string;
  phone: string;
  address: string;
  county: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  adminComments?: string;
  profileCompleted: boolean;
  createdAt: string;
}

export default function InstallerPending() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<InstallerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Enhanced profile form state
  const [profileForm, setProfileForm] = useState({
    // Basic Information (editable when rejected)
    businessName: "",
    contactName: "",
    phone: "",
    address: "",
    county: "",
    vatNumber: "",
    insurance: "",
    maxTravelDistance: "",
    yearsExperience: "",
    emergencyCallout: false,
    weekendAvailable: false
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  // Populate form when profile is loaded
  useEffect(() => {
    if (profile) {
      setProfileForm({
        // Basic Information
        businessName: profile.businessName || "",
        contactName: profile.contactName || "",
        phone: profile.phone || "",
        address: profile.address || "",
        county: profile.county || "",
        
        // Enhanced Information (will be populated from extended profile data)
        bio: "",
        yearsExperience: "",
        certifications: "",
        expertise: [],
        serviceAreas: [profile.county].filter(Boolean),
        emergencyCallout: false,
        weekendAvailable: false,
        insurance: "",
        vatNumber: "",
        maxTravelDistance: "",
        languages: [],
        teamSize: "",
        vehicleType: "",
        responseTime: "",
        
        // Service capabilities
        wallTypes: [],
        mountTypes: [],
        deviceTypes: [],
        specialServices: []
      });
    }
  }, [profile]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/installer/profile/${profile?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated Successfully",
        description: "Your profile has been updated and resubmitted for review.",
      });
      setShowEditDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/installer/profile"] });
      // Refresh the profile data
      fetchProfile();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only send basic info if rejected, enhanced info if approved
    const updateData = profile?.approvalStatus === 'rejected' 
      ? {
          businessName: profileForm.businessName,
          contactName: profileForm.contactName,
          phone: profileForm.phone,
          address: profileForm.address,
          county: profileForm.county
        }
      : profileForm; // Send all data for approved installers
    
    updateProfileMutation.mutate(updateData);
  };

  const handleArrayFieldChange = (field: string, value: string, checked: boolean) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field as keyof typeof prev] as string[]), value]
        : (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
    }));
  };

  const fetchProfile = async () => {
    try {
      // First check authentication status
      const authResponse = await fetch('/api/installer/auth/status', {
        credentials: 'include'
      });
      
      if (!authResponse.ok) {
        console.log('Not authenticated, redirecting to login');
        setLocation('/installer-login');
        return;
      }

      const authData = await authResponse.json();
      if (!authData.authenticated) {
        console.log('Authentication failed, redirecting to login');
        setLocation('/installer-login');
        return;
      }

      // If authenticated, get full profile
      const response = await fetch('/api/installer/profile', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else if (response.status === 401) {
        setLocation('/installer-login');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLocation('/installer-login');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">Not Approved</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          title: "Application Under Review",
          message: "Your installer application is currently being reviewed by our admin team. This process typically takes 24-48 hours.",
          action: "Please wait for admin approval before accessing your dashboard."
        };
      case 'approved':
        return {
          title: "Welcome to tradesbook.ie!",
          message: "Congratulations! Your installer application has been approved. You can now access your dashboard and start receiving leads.",
          action: "Click below to access your installer dashboard."
        };
      case 'rejected':
        return {
          title: "Application Not Approved",
          message: "Unfortunately, your application was not approved at this time. Please review the feedback below and consider reapplying in the future.",
          action: "You may create a new application with updated information if circumstances change."
        };
      default:
        return {
          title: "Application Status Unknown",
          message: "We're unable to determine your application status. Please contact support.",
          action: "Contact our support team for assistance."
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-gray-600 mb-4">Unable to load your installer profile.</p>
            <Button onClick={() => setLocation('/installer-login')} className="w-full">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusMessage(profile.approvalStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Installer Application Status</h1>
            <p className="text-gray-600">Track your application progress and next steps</p>
          </div>

          {/* Status Overview */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  {getStatusIcon(profile.approvalStatus)}
                  <span>{statusInfo.title}</span>
                </CardTitle>
                {getStatusBadge(profile.approvalStatus)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">{statusInfo.message}</p>
                <p className="text-sm text-gray-600">{statusInfo.action}</p>
                
                {profile.adminComments && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Admin Feedback
                    </h4>
                    <p className="text-gray-700 italic">"{profile.adminComments}"</p>
                  </div>
                )}

                {profile.approvalStatus === 'approved' && (
                  <div className="pt-4">
                    <Button 
                      onClick={() => setLocation('/installer-dashboard')} 
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Access Installer Dashboard
                    </Button>
                  </div>
                )}

                {profile.approvalStatus === 'pending' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">What Happens Next?</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Our admin team will review your application details</li>
                      <li>• You'll receive an email notification with the decision</li>
                      <li>• If approved, you'll get immediate access to your dashboard</li>
                      <li>• If not approved, you'll receive feedback for future applications</li>
                    </ul>
                  </div>
                )}

                {profile.approvalStatus === 'rejected' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-orange-900 mb-2 flex items-center">
                      <Edit className="w-4 h-4 mr-2" />
                      Update Your Profile
                    </h4>
                    <p className="text-sm text-orange-800 mb-3">
                      You can now update your profile information based on the admin feedback and resubmit for review.
                    </p>
                    <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-orange-600 hover:bg-orange-700">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile & Resubmit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            <Edit className="w-5 h-5" />
                            <span>Update Your Profile</span>
                          </DialogTitle>
                          <DialogDescription>
                            Update your basic information and resubmit for admin review. Enhanced profile features will be available after approval.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                          {/* Basic Information Section */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2 pb-2 border-b">
                              <Building className="w-5 h-5 text-primary" />
                              <h3 className="text-lg font-semibold">Basic Information</h3>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="businessName">Business Name *</Label>
                                <Input
                                  id="businessName"
                                  value={profileForm.businessName}
                                  onChange={(e) => setProfileForm({...profileForm, businessName: e.target.value})}
                                  placeholder="Your business or company name"
                                  required
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="contactName">Contact Person *</Label>
                                <Input
                                  id="contactName"
                                  value={profileForm.contactName}
                                  onChange={(e) => setProfileForm({...profileForm, contactName: e.target.value})}
                                  placeholder="Your full name"
                                  required
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="phone">Phone Number *</Label>
                                <Input
                                  id="phone"
                                  value={profileForm.phone}
                                  onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                                  placeholder="+353 XX XXX XXXX"
                                  required
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="county">Primary County *</Label>
                                <Select 
                                  value={profileForm.county} 
                                  onValueChange={(value) => setProfileForm({...profileForm, county: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your primary county" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {["Dublin", "Cork", "Galway", "Limerick", "Waterford", "Kerry", "Clare", "Mayo", "Donegal", "Wicklow", "Meath", "Kildare", "Wexford", "Kilkenny", "Laois", "Offaly", "Westmeath", "Longford", "Louth", "Monaghan", "Cavan", "Sligo", "Leitrim", "Roscommon", "Tipperary", "Carlow"].map(county => (
                                      <SelectItem key={county} value={county}>{county}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label htmlFor="vatNumber">VAT Number</Label>
                                <Input
                                  id="vatNumber"
                                  value={profileForm.vatNumber}
                                  onChange={(e) => setProfileForm({...profileForm, vatNumber: e.target.value})}
                                  placeholder="IE1234567X (if applicable)"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="insurance">Public Liability Insurance *</Label>
                                <Input
                                  id="insurance"
                                  value={profileForm.insurance}
                                  onChange={(e) => setProfileForm({...profileForm, insurance: e.target.value})}
                                  placeholder="Insurance provider & policy details"
                                  required
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="address">Business Address *</Label>
                              <Textarea
                                id="address"
                                value={profileForm.address}
                                onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                                placeholder="Complete business address including street, city, and postal code"
                                rows={3}
                                required
                              />
                            </div>
                            
                            {/* Service Coverage Section */}
                            <div className="space-y-4 pt-4 border-t">
                              <h4 className="font-medium text-gray-900">Service Coverage</h4>
                              
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="maxTravelDistance">Maximum Travel Distance *</Label>
                                  <Select 
                                    value={profileForm.maxTravelDistance} 
                                    onValueChange={(value) => setProfileForm({...profileForm, maxTravelDistance: value})}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select travel distance" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="10km">Within 10km</SelectItem>
                                      <SelectItem value="25km">Within 25km</SelectItem>
                                      <SelectItem value="50km">Within 50km</SelectItem>
                                      <SelectItem value="county">County-wide</SelectItem>
                                      <SelectItem value="regional">Regional (multi-county)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label htmlFor="yearsExperience">Years of Experience *</Label>
                                  <Select 
                                    value={profileForm.yearsExperience} 
                                    onValueChange={(value) => setProfileForm({...profileForm, yearsExperience: value})}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select experience level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1">1 year</SelectItem>
                                      <SelectItem value="2">2 years</SelectItem>
                                      <SelectItem value="3-5">3-5 years</SelectItem>
                                      <SelectItem value="5-10">5-10 years</SelectItem>
                                      <SelectItem value="10+">10+ years</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              <div className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="emergencyCallout"
                                    checked={profileForm.emergencyCallout}
                                    onCheckedChange={(checked) => setProfileForm({...profileForm, emergencyCallout: !!checked})}
                                  />
                                  <Label htmlFor="emergencyCallout">Emergency callout available</Label>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="weekendAvailable"
                                    checked={profileForm.weekendAvailable}
                                    onCheckedChange={(checked) => setProfileForm({...profileForm, weekendAvailable: !!checked})}
                                  />
                                  <Label htmlFor="weekendAvailable">Weekend availability</Label>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end space-x-4 pt-4 border-t">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setShowEditDialog(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={updateProfileMutation.isPending}
                              className="bg-primary hover:bg-primary/90"
                            >
                              {updateProfileMutation.isPending ? "Updating..." : "Update & Resubmit"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Your Application Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Building className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{profile.businessName}</p>
                      <p className="text-sm text-gray-600">Business Name</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{profile.contactName}</p>
                      <p className="text-sm text-gray-600">Contact Person</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{profile.email}</p>
                      <p className="text-sm text-gray-600">Email Address</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{profile.phone}</p>
                      <p className="text-sm text-gray-600">Phone Number</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{profile.address}</p>
                      <p className="text-sm text-gray-600">Service Address</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{profile.county}</p>
                      <p className="text-sm text-gray-600">County</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Application Submitted</span>
                  <span>{new Date(profile.createdAt).toLocaleDateString('en-IE', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/installer-login')}
            >
              Return to Login
            </Button>
            
            {profile.approvalStatus === 'rejected' && (
              <Button 
                variant="default" 
                onClick={() => setLocation('/installer-registration')}
              >
                Create New Application
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}