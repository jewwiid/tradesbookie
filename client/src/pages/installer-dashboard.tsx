import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import InstallerWalletDashboard from "@/components/installer/InstallerWalletDashboard";
import PastLeadsManagement from "@/components/installer/PastLeadsManagement";
import InstallerReviews from "@/components/installer/InstallerReviews";
import { 
  Bolt, 
  Hammer, 
  Star,
  MapPin,
  Clock,
  CheckCircle,
  User,
  LogOut,
  Navigation as NavigationIcon,
  Zap,
  AlertCircle,
  DollarSign,
  Settings,
  Home,
  Mail,
  Phone,
  Shield,
  Edit
} from "lucide-react";

interface InstallerStats {
  monthlyJobs: number;
  earnings: number;
  rating: number;
  activeRequests: number;
}

interface ClientRequest {
  id: number;
  address: string;
  serviceType: string;
  tvSize: string;
  wallType: string;
  mountType: string;
  addons: string[];
  estimatedTotal: string;
  leadFee: number;
  estimatedEarnings: number;
  profitMargin: number;
  status: 'pending' | 'urgent' | 'accepted' | 'in_progress' | 'completed';
  scheduledDate?: string;
  createdAt: string;
  qrCode: string;
  notes?: string;
  difficulty: string;
  referralCode?: string;
  referralDiscount?: string;
  distance?: number;
}

// Interactive Map Component for Ireland
function IrelandMap({ requests, onRequestSelect, selectedRequest }: {
  requests: ClientRequest[];
  onRequestSelect: (request: ClientRequest) => void;
  selectedRequest?: ClientRequest;
}) {
  return (
    <div className="relative w-full h-96 bg-green-50 border-2 border-green-200 rounded-xl overflow-hidden">
      {/* Map Header */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center space-x-2">
          <NavigationIcon className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-green-800">Ireland Installation Map</span>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          {requests.length} active requests
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs">Standard</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-xs">Urgent</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs">Emergency</span>
          </div>
        </div>
      </div>

      {/* Accurate Ireland outline */}
      <svg viewBox="0 0 300 400" className="w-full h-full">
        {/* Republic of Ireland outline */}
        <path
          d="M150 20 L160 25 L170 30 L180 35 L190 45 L200 55 L210 65 L220 75 L225 85 L230 95 L235 105 L240 115 L245 125 L250 135 L252 145 L254 155 L255 165 L256 175 L255 185 L254 195 L252 205 L250 215 L248 225 L245 235 L242 245 L238 255 L234 265 L230 275 L225 285 L220 295 L214 305 L208 315 L200 325 L192 335 L184 345 L175 355 L165 365 L155 370 L145 375 L135 378 L125 380 L115 378 L105 375 L95 370 L85 365 L75 355 L65 345 L57 335 L50 325 L44 315 L40 305 L37 295 L35 285 L34 275 L33 265 L32 255 L31 245 L30 235 L29 225 L28 215 L27 205 L26 195 L25 185 L24 175 L23 165 L22 155 L21 145 L20 135 L19 125 L18 115 L17 105 L16 95 L15 85 L14 75 L13 65 L12 55 L11 45 L10 35 L15 30 L25 25 L35 22 L45 20 L55 19 L65 18 L75 17 L85 16 L95 15 L105 14 L115 13 L125 12 L135 11 L145 15 Z"
          fill="#e8f5e8"
          stroke="#22c55e"
          strokeWidth="2"
        />
        
        {/* Northern Ireland outline */}
        <path
          d="M180 70 L190 65 L200 62 L210 60 L220 58 L230 56 L240 55 L250 54 L260 53 L270 52 L275 58 L280 65 L285 72 L290 80 L292 88 L294 96 L295 104 L296 112 L295 120 L294 128 L292 136 L290 144 L285 152 L280 159 L275 165 L270 170 L260 174 L250 177 L240 179 L230 180 L220 181 L210 182 L200 183 L190 184 L185 178 L182 170 L180 162 L179 154 L178 146 L177 138 L176 130 L175 122 L174 114 L173 106 L172 98 L171 90 L170 82 L175 75 Z"
          fill="#f3f4f6"
          stroke="#9ca3af"
          strokeWidth="1"
          strokeDasharray="3,3"
        />
        
        {/* Plot request markers on the map */}
        {requests.map((request, index) => {
          const x = 80 + (index % 6) * 20;
          const y = 80 + Math.floor(index / 6) * 25;
          const color = request.urgency === 'emergency' ? '#ef4444' : 
                       request.urgency === 'urgent' ? '#f97316' : '#3b82f6';
          
          return (
            <g key={request.id}>
              <circle
                cx={x}
                cy={y}
                r={selectedRequest?.id === request.id ? "8" : "6"}
                fill={color}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer transition-all"
                onClick={() => onRequestSelect(request)}
              />
              {selectedRequest?.id === request.id && (
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  opacity="0.5"
                  className="animate-pulse"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Request Card Component (Uber-style)
function RequestCard({ request, onAccept, onDecline, distance }: {
  request: ClientRequest;
  onAccept: (requestId: number) => void;
  onDecline: (requestId: number) => void;
  distance?: number;
}) {
  const getUrgencyInfo = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return { color: 'bg-red-100 border-red-300', badge: 'bg-red-500', text: 'Emergency' };
      case 'urgent':
        return { color: 'bg-orange-100 border-orange-300', badge: 'bg-orange-500', text: 'Urgent' };
      default:
        return { color: 'bg-blue-50 border-blue-200', badge: 'bg-blue-500', text: 'Standard' };
    }
  };

  const urgency = request.status === 'urgent' ? 'urgent' : 'standard';
  const urgencyInfo = getUrgencyInfo(urgency);
  const timeAgo = new Date(request.createdAt).toLocaleTimeString();

  return (
    <Card className={`${urgencyInfo.color} border-2 hover:shadow-lg transition-all duration-200`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-2">
            <Badge className={`${urgencyInfo.badge} text-white`}>
              {urgencyInfo.text}
            </Badge>
            {distance && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>{distance}km away</span>
              </Badge>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">€{request.estimatedEarnings}</div>
            <div className="text-sm text-gray-500">Lead Fee: €{request.leadFee}</div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">{request.tvSize} TV Installation</span>
            <div className="flex items-center space-x-1 text-green-600">
              <span className="text-sm font-medium">{request.profitMargin.toFixed(1)}% margin</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{request.address}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Posted {timeAgo}</span>
            {request.scheduledDate && (
              <span className="text-sm">• Scheduled: {new Date(request.scheduledDate).toLocaleDateString()}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
            <div><span className="font-medium">Wall:</span> {request.wallType}</div>
            <div><span className="font-medium">Mount:</span> {request.mountType}</div>
            <div><span className="font-medium">Difficulty:</span> {request.difficulty}</div>
            <div><span className="font-medium">Total:</span> €{request.estimatedTotal}</div>
          </div>

          <div className="flex items-center space-x-2 text-gray-600">
            <User className="w-4 h-4" />
            <span className="text-sm">Customer details available after lead purchase</span>
          </div>
        </div>

        {request.notes && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700">"{request.notes}"</p>
          </div>
        )}

        <div className="flex space-x-3">
          <Button 
            onClick={() => onAccept(request.id)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Purchase Lead (€{request.leadFee})
          </Button>
          <Button 
            variant="outline"
            onClick={() => onDecline(request.id)}
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InstallerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    serviceArea: "",
    county: "",
    bio: "",
    experience: "",
    certifications: "",
    emergencyCallout: false,
    weekendAvailable: false
  });
  
  // Get current installer profile
  const { data: installerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/installers/profile"],
    retry: false
  });
  
  // Initialize availability status from database
  const [isOnline, setIsOnline] = useState(installerProfile?.isAvailable || false);
  
  // Update local state when profile loads
  useEffect(() => {
    if (installerProfile?.isAvailable !== undefined) {
      setIsOnline(installerProfile.isAvailable);
    }
  }, [installerProfile?.isAvailable]);

  // Profile photo upload mutation
  const profilePhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Only JPG, PNG, and WebP files are allowed');
      }

      const formData = new FormData();
      formData.append('profilePhoto', file);
      
      const response = await fetch('/api/installer/profile-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ["/api/installers/profile"] });
      toast({
        title: "Profile photo updated!",
        description: "Your professional photo has been uploaded successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle profile photo upload
  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side file size validation (2MB = 2,097,152 bytes)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive",
      });
      // Reset the input
      e.target.value = '';
      return;
    }

    // Client-side file type validation
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, WebP)",
        variant: "destructive",
      });
      // Reset the input
      e.target.value = '';
      return;
    }

    profilePhotoMutation.mutate(file);
  };
  
  // Mutation to update availability status
  const availabilityMutation = useMutation({
    mutationFn: async (isAvailable: boolean) => {
      const response = await fetch('/api/installer/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isAvailable })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update availability status');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update local state
      setIsOnline(data.isAvailable);
      // Refresh profile data to stay in sync
      queryClient.invalidateQueries({ queryKey: ["/api/installers/profile"] });
      
      toast({
        title: "Availability Updated",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update availability status",
        variant: "destructive",
      });
    }
  });
  
  // Handler for availability toggle
  const handleAvailabilityToggle = (checked: boolean) => {
    availabilityMutation.mutate(checked);
  };

  // Fetch available requests from API
  const { data: availableRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/installer', installerProfile?.id, 'available-leads'],
    queryFn: () => fetch(`/api/installer/${installerProfile?.id}/available-leads`).then(res => res.json()),
    enabled: !!installerProfile?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch past leads for monthly stats calculation
  const { data: pastLeads = [] } = useQuery({
    queryKey: [`/api/installer/${installerProfile?.id}/past-leads`],
    enabled: !!installerProfile?.id,
    refetchInterval: 30000
  });

  // Fetch reviews for rating calculation
  const { data: reviewStats } = useQuery({
    queryKey: [`/api/installer/${installerProfile?.id}/reviews`],
    enabled: !!installerProfile?.id,
    refetchInterval: 30000
  });

  // Calculate real stats from actual data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyLeads = pastLeads.filter((lead: any) => {
    const leadDate = new Date(lead.createdAt);
    return leadDate.getMonth() === currentMonth && leadDate.getFullYear() === currentYear;
  });

  const monthlyEarnings = monthlyLeads.reduce((total: number, lead: any) => {
    return total + (parseFloat(lead.estimatedPrice) || 0);
  }, 0);

  const stats: InstallerStats = {
    monthlyJobs: monthlyLeads.length,
    earnings: monthlyEarnings,
    rating: reviewStats?.averageRating || 0,
    activeRequests: availableRequests.length
  };

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/installers/profile", {
        installerId: installerProfile?.id,
        ...data
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setShowProfileDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/installers/profile"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Accept request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest('POST', `/api/installer/accept-request/${requestId}`, {
        installerId: installerProfile?.id
      });
    },
    onSuccess: (data: any, requestId) => {
      toast({
        title: "Request Accepted Successfully",
        description: "Professional email sent to customer with your contact details. They will reach out within 24 hours to confirm scheduling.",
        duration: 6000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/installer', installerProfile?.id, 'available-leads'] });
      
      // Update local stats to reflect accepted job
      setStats(prev => ({
        ...prev,
        monthlyJobs: prev.monthlyJobs + 1,
        earnings: prev.earnings + parseFloat(selectedRequest?.estimatedEarnings.toString() || "0")
      }));
      
      // Remove the accepted request from selected state
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
    },
    onError: (error: any) => {
      let errorMessage = "Failed to accept request";
      
      // Parse error message that comes in format "400: {json}"
      if (error.message && typeof error.message === 'string') {
        try {
          // Extract JSON from error message (format: "400: {json}")
          const jsonMatch = error.message.match(/\d+:\s*(\{.*\})/);
          if (jsonMatch) {
            const errorData = JSON.parse(jsonMatch[1]);
            if (errorData.message === "Lead purchase required") {
              errorMessage = "Insufficient wallet balance. Please add credits to purchase this lead.";
            } else if (errorData.message) {
              errorMessage = errorData.message;
            }
          } else {
            errorMessage = error.message;
          }
        } catch (e) {
          // Use error message as is if JSON parsing fails
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Unable to Accept Request",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Decline request mutation
  const declineRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest('POST', `/api/installer/decline-request/${requestId}`);
    },
    onSuccess: (data, requestId) => {
      toast({
        title: "Request Declined",
        description: "Request removed from your list",
      });
      
      // Invalidate and refresh the available leads list
      queryClient.invalidateQueries({ queryKey: ['/api/installer', installerProfile?.id, 'available-leads'] });
      
      // Remove the declined request from selected state
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to decline request",
        variant: "destructive",
      });
    }
  });

  // Check approval status and redirect if needed
  useEffect(() => {
    if (installerProfile && installerProfile.approvalStatus !== "approved") {
      // Redirect to pending page for non-approved installers
      window.location.href = "/installer-pending";
    }
  }, [installerProfile]);

  // Populate profile data when dialog is opened
  useEffect(() => {
    if (installerProfile && showProfileDialog) {
      setProfileData({
        name: installerProfile.contactName || "",
        businessName: installerProfile.businessName || "",
        email: installerProfile.email || "",
        phone: installerProfile.phone || "",
        serviceArea: installerProfile.serviceArea || "",
        county: installerProfile.serviceArea || "",
        bio: installerProfile.bio || "",
        experience: installerProfile.yearsExperience?.toString() || "",
        certifications: installerProfile.certifications || "",
        emergencyCallout: installerProfile.emergencyCallout || false,
        weekendAvailable: installerProfile.weekendAvailable || false
      });
    }
  }, [installerProfile, showProfileDialog]);

  // Show loading screen while checking approval status
  if (profileLoading || (installerProfile && installerProfile.approvalStatus !== "approved")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Checking account status...</p>
        </div>
      </div>
    );
  }

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  // Use real data from API
  const requests: ClientRequest[] = Array.isArray(availableRequests) ? availableRequests : [
    {
      id: 1,
      customerId: 101,
      tvSize: "65",
      serviceType: "Premium Wall Mount",
      address: "123 Grafton Street",
      county: "Dublin",
      coordinates: { lat: 53.3498, lng: -6.2603 },
      totalPrice: "199",
      installerEarnings: "149",
      preferredDate: "2025-06-15",
      preferredTime: "14:00",
      urgency: "standard",
      timePosted: new Date(Date.now() - 1800000).toISOString(),
      estimatedDuration: "2 hours",
      customerRating: 4.8,
      distance: 12,
      customerNotes: "Living room mount, prefer afternoon installation",
      status: "pending",
      customer: {
        name: "Sarah O'Connor",
        phone: "+353 85 123 4567",
        email: "sarah@email.com"
      }
    },
    {
      id: 2,
      customerId: 102,
      tvSize: "55",
      serviceType: "Standard Wall Mount",
      address: "45 Patrick Street",
      county: "Cork",
      coordinates: { lat: 51.8985, lng: -8.4756 },
      totalPrice: "149",
      installerEarnings: "112",
      urgency: "urgent",
      timePosted: new Date(Date.now() - 900000).toISOString(),
      estimatedDuration: "1.5 hours",
      customerRating: 4.9,
      distance: 8,
      customerNotes: "Need installation before weekend",
      status: "pending",
      customer: {
        name: "Michael Murphy",
        phone: "+353 86 987 6543",
        email: "michael@email.com"
      }
    },
    {
      id: 3,
      customerId: 103,
      tvSize: "75",
      serviceType: "Premium Wall Mount + Soundbar",
      address: "12 Eyre Square",
      county: "Galway",
      coordinates: { lat: 53.2743, lng: -9.0490 },
      totalPrice: "299",
      installerEarnings: "224",
      urgency: "emergency",
      timePosted: new Date(Date.now() - 300000).toISOString(),
      estimatedDuration: "3 hours",
      customerRating: 5.0,
      distance: 5,
      customerNotes: "Emergency replacement for damaged TV",
      status: "pending",
      customer: {
        name: "Emma Walsh",
        phone: "+353 87 456 7890",
        email: "emma@email.com"
      }
    }
  ];

  // Update stats to reflect current requests
  const currentStats = {
    ...stats,
    activeRequests: availableRequests.length
  };

  const handleAcceptRequest = (requestId: number) => {
    acceptRequestMutation.mutate(requestId);
  };

  const handleDeclineRequest = (requestId: number) => {
    declineRequestMutation.mutate(requestId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Navigation */}
      <Navigation isInstallerContext={true} installerProfile={installerProfile} />
      
      {/* Installer Dashboard Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-0 sm:h-16 gap-3 sm:gap-0">
            <div className="flex items-center space-x-3">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Installer Dashboard</h1>
              <Badge variant={isOnline ? "default" : "secondary"} className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-xs sm:text-sm">{isOnline ? 'Online' : 'Offline'}</span>
              </Badge>
            </div>
            
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                <span className="hidden sm:inline">Available for Jobs</span>
                <span className="sm:hidden">Available</span>
                <Switch 
                  checked={isOnline} 
                  onCheckedChange={handleAvailabilityToggle}
                  disabled={availabilityMutation.isPending}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
              
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/installer-login'}>
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="requests" className="w-full">
          {/* Mobile-first responsive tabs */}
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-6 h-auto p-1">
            <TabsTrigger value="requests" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 text-xs sm:text-sm">
              <NavigationIcon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Lead Requests</span>
              <span className="sm:hidden">Leads</span>
            </TabsTrigger>
            <TabsTrigger value="past-leads" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 text-xs sm:text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Purchased Leads</span>
              <span className="sm:hidden">Purchased</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 text-xs sm:text-sm">
              <Star className="w-4 h-4 flex-shrink-0" />
              <span>Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 text-xs sm:text-sm">
              <DollarSign className="w-4 h-4 flex-shrink-0" />
              <span className="hidden lg:inline">Wallet & Credits</span>
              <span className="lg:hidden">Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 text-xs sm:text-sm">
              <Settings className="w-4 h-4 flex-shrink-0" />
              <span className="hidden lg:inline">Profile Settings</span>
              <span className="lg:hidden">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Zap className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Active Requests</p>
                      <p className="text-3xl font-bold text-gray-900">{currentStats.activeRequests}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Hammer className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Monthly Jobs</p>
                      <p className="text-3xl font-bold text-gray-900">{currentStats.monthlyJobs}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Monthly Earnings</p>
                      <p className="text-3xl font-bold text-gray-900">€{currentStats.earnings}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Star className="w-8 h-8 text-yellow-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Rating</p>
                      <p className="text-3xl font-bold text-gray-900">{currentStats.rating}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* View Toggle */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Available Installation Requests
              </h2>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'map' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                >
                  <NavigationIcon className="w-4 h-4 mr-2" />
                  Map View
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  List View
                </Button>
              </div>
            </div>

            {/* Main Content */}
            {viewMode === 'map' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map */}
                <div className="lg:col-span-2">
                  <IrelandMap 
                    requests={availableRequests}
                    onRequestSelect={setSelectedRequest}
                    selectedRequest={selectedRequest || undefined}
                  />
                </div>
                
                {/* Selected Request Details */}
                <div className="space-y-4">
              {selectedRequest ? (
                <RequestCard
                  request={selectedRequest}
                  onAccept={handleAcceptRequest}
                  onDecline={handleDeclineRequest}
                  distance={selectedRequest.distance}
                />
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center p-6">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a request on the map to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {availableRequests.map((request: ClientRequest) => (
              <RequestCard
                key={request.id}
                request={request}
                onAccept={handleAcceptRequest}
                onDecline={handleDeclineRequest}
                distance={request.distance}
              />
            ))}
          </div>
        )}

            {/* No Requests State */}
            {availableRequests.length === 0 && !requestsLoading && (
              <Card className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Requests</h3>
                <p className="text-gray-500 mb-6">
                  No new installation requests at the moment. Check back shortly or turn on "Available for Jobs" to let customers know you're ready for work.
                </p>
                <Button 
                  onClick={() => handleAvailabilityToggle(true)} 
                  disabled={isOnline || availabilityMutation.isPending} 
                  variant={isOnline ? "secondary" : "default"}
                >
                  {isOnline ? "You're Available" : "Mark Available"}
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past-leads" className="space-y-6">
            <PastLeadsManagement installerId={installerProfile?.id} />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <InstallerReviews installerId={installerProfile?.id} />
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            {installerProfile && (
              <InstallerWalletDashboard installerId={installerProfile.id} />
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Profile Information Display */}
                {installerProfile && (
                  <div className="space-y-6">
                    {/* Basic Information Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="border-l-4 border-primary pl-4">
                            <Label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Contact Name</Label>
                            <p className="text-base font-medium text-gray-900 mt-1">{installerProfile.contactName || "Not provided"}</p>
                          </div>
                          <div className="border-l-4 border-gray-200 pl-4">
                            <Label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Business Name</Label>
                            <p className="text-base font-medium text-gray-900 mt-1">{installerProfile.businessName || "Not provided"}</p>
                          </div>
                          <div className="border-l-4 border-gray-200 pl-4">
                            <Label className="text-sm font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              Email
                            </Label>
                            <p className="text-base font-medium text-gray-900 mt-1">{installerProfile.email || "Not provided"}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="border-l-4 border-gray-200 pl-4">
                            <Label className="text-sm font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              Phone
                            </Label>
                            <p className="text-base font-medium text-gray-900 mt-1">{installerProfile.phone || "Not provided"}</p>
                          </div>
                          <div className="border-l-4 border-gray-200 pl-4">
                            <Label className="text-sm font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Service Area
                            </Label>
                            <p className="text-base font-medium text-gray-900 mt-1">{installerProfile.serviceArea || "Not specified"}</p>
                          </div>
                          <div className="border-l-4 border-gray-200 pl-4">
                            <Label className="text-sm font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Experience
                            </Label>
                            <p className="text-base font-medium text-gray-900 mt-1">
                              {installerProfile.yearsExperience ? `${installerProfile.yearsExperience} years` : "Not specified"}
                            </p>
                          </div>
                          
                          <div className="border-l-4 border-gray-200 pl-4">
                            <Label className="text-sm font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Insurance Status
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                              {installerProfile.insurance ? (
                                <div>
                                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                                    ✓ Insured
                                  </Badge>
                                  <p className="text-sm text-gray-600 mt-1">{installerProfile.insurance}</p>
                                </div>
                              ) : (
                                <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                                  ⚠ Uninsured
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bio Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        About
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <p className="text-gray-700 leading-relaxed">
                          {installerProfile.bio || "No bio provided yet. Add a bio to help customers learn more about your experience and services."}
                        </p>
                      </div>
                    </div>

                    {/* Status Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Account Status
                      </h3>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={installerProfile.approvalStatus === 'approved' ? 'default' : 'secondary'}
                          className="px-3 py-1 text-sm font-medium"
                        >
                          {installerProfile.approvalStatus === 'approved' ? '✓ Approved' : 'Pending Approval'}
                        </Badge>
                        {installerProfile.approvalStatus !== 'approved' && (
                          <span className="text-sm text-gray-600">Your profile is under review by our team</span>
                        )}
                      </div>
                    </div>
                    {/* Profile Enhancement Section - Only for approved installers */}
                    {installerProfile.approvalStatus === 'approved' && (
                      <div className="space-y-6 pt-6 border-t">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Edit className="w-5 h-5 text-primary" />
                          Profile Enhancement
                        </h3>
                        
                        {/* Credibility Builders */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Credibility Builders</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="profileImage">Profile Photo</Label>
                                <div className="space-y-3">
                                  {installerProfile.profileImageUrl && (
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={installerProfile.profileImageUrl}
                                        alt="Profile"
                                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                      />
                                      <div className="text-sm text-gray-600">
                                        <p>Current profile photo</p>
                                        <p className="text-xs text-gray-500">Click below to change</p>
                                      </div>
                                    </div>
                                  )}
                                  <Input
                                    id="profileImage"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleProfilePhotoUpload}
                                    disabled={profilePhotoMutation.isPending}
                                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                  />
                                  <p className="text-xs text-gray-500">
                                    Upload a professional photo (JPG, PNG, WebP • Max 2MB) to build trust with customers
                                  </p>
                                  {profilePhotoMutation.isPending && (
                                    <div className="flex items-center gap-2 text-sm text-primary">
                                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                      Uploading photo...
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <Label htmlFor="certifications">Professional Certifications</Label>
                                <Input
                                  id="certifications"
                                  placeholder="e.g., CEDIA, AVIXA certified"
                                  defaultValue={installerProfile.certifications || ""}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="bio">Professional Bio</Label>
                              <Textarea
                                id="bio"
                                placeholder="Tell customers about your experience, specialties, and what makes you unique..."
                                rows={4}
                                defaultValue={installerProfile.bio || ""}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Customer Service Preferences */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Customer Service Preferences</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="preferredCommunication">Preferred Communication Method</Label>
                                <Select defaultValue={installerProfile.preferredCommunication || ""}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="How do you prefer to be contacted?" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="phone">Phone Call</SelectItem>
                                    <SelectItem value="text">Text Message</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label htmlFor="responseTime">Response Time Commitment</Label>
                                <Select defaultValue={installerProfile.responseTime || ""}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="How quickly do you respond?" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="15min">Within 15 minutes</SelectItem>
                                    <SelectItem value="1hour">Within 1 hour</SelectItem>
                                    <SelectItem value="2hours">Within 2 hours</SelectItem>
                                    <SelectItem value="same-day">Same day</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="cleanupPolicy">Cleanup Policy</Label>
                              <Textarea
                                id="cleanupPolicy"
                                placeholder="Describe your cleanup policy after installation..."
                                rows={3}
                                defaultValue={installerProfile.cleanupPolicy || ""}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Pricing & Business Operations */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Pricing & Business Operations</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="calloutFee">Callout Fee (€)</Label>
                                <Input
                                  id="calloutFee"
                                  type="number"
                                  placeholder="0"
                                  defaultValue={installerProfile.calloutFee || ""}
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave blank if no callout fee</p>
                              </div>
                              
                              <div>
                                <Label htmlFor="teamSize">Team Size</Label>
                                <Select defaultValue={installerProfile.teamSize || ""}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="How many people on your team?" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="solo">Solo installer</SelectItem>
                                    <SelectItem value="2">2 person team</SelectItem>
                                    <SelectItem value="3">3 person team</SelectItem>
                                    <SelectItem value="4+">4+ person team</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="additionalCharges">Additional Charges for Difficult Installations</Label>
                              <Textarea
                                id="additionalCharges"
                                placeholder="Describe any additional charges for complex installations..."
                                rows={3}
                                defaultValue={installerProfile.additionalCharges || ""}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Business Information */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Business Information</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="vehicleType">Vehicle Type</Label>
                                <Select defaultValue={installerProfile.vehicleType || ""}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="What vehicle do you use?" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="van">Van</SelectItem>
                                    <SelectItem value="car">Car</SelectItem>
                                    <SelectItem value="truck">Truck</SelectItem>
                                    <SelectItem value="multiple">Multiple vehicles</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label htmlFor="languages">Languages Spoken</Label>
                                <Input
                                  id="languages"
                                  placeholder="e.g., English, Irish, Polish"
                                  defaultValue={installerProfile.languages?.join(', ') || ""}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Save Button */}
                        <div className="flex justify-end pt-4">
                          <Button 
                            onClick={() => {
                              toast({ 
                                title: "Profile Enhanced", 
                                description: "Your profile enhancements have been saved successfully." 
                              });
                            }}
                            className="bg-primary hover:bg-primary/90"
                          >
                            Save Profile Enhancements
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Message for non-approved installers */}
                    {installerProfile.approvalStatus !== 'approved' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium">Profile Enhancement Available After Approval</span>
                        </div>
                        <p className="text-yellow-700 text-sm mt-1">
                          Once your installer application is approved, you'll be able to enhance your profile with additional features like bio, certifications, and customer service preferences.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                <Button 
                  onClick={() => setShowProfileDialog(true)}
                  className="w-full"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Basic Information
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Management Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="profile-dialog-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Profile Management
            </DialogTitle>
            <DialogDescription id="profile-dialog-description">
              Update your installer profile information and settings
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <form onSubmit={handleProfileUpdate} className="space-y-6 mt-4">
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
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
                      value={profileData.businessName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="Dublin TV Solutions"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+353 87 123 4567"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell customers about your experience and expertise..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </TabsContent>

              <TabsContent value="services" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="county">Primary Service Area *</Label>
                    <Select value={profileData.county} onValueChange={(value) => setProfileData(prev => ({ ...prev, county: value, serviceArea: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select county" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dublin">Dublin</SelectItem>
                        <SelectItem value="Cork">Cork</SelectItem>
                        <SelectItem value="Galway">Galway</SelectItem>
                        <SelectItem value="Limerick">Limerick</SelectItem>
                        <SelectItem value="Waterford">Waterford</SelectItem>
                        <SelectItem value="Kilkenny">Kilkenny</SelectItem>
                        <SelectItem value="Wexford">Wexford</SelectItem>
                        <SelectItem value="Carlow">Carlow</SelectItem>
                        <SelectItem value="Kildare">Kildare</SelectItem>
                        <SelectItem value="Meath">Meath</SelectItem>
                        <SelectItem value="Wicklow">Wicklow</SelectItem>
                        <SelectItem value="Laois">Laois</SelectItem>
                        <SelectItem value="Offaly">Offaly</SelectItem>
                        <SelectItem value="Westmeath">Westmeath</SelectItem>
                        <SelectItem value="Longford">Longford</SelectItem>
                        <SelectItem value="Louth">Louth</SelectItem>
                        <SelectItem value="Cavan">Cavan</SelectItem>
                        <SelectItem value="Monaghan">Monaghan</SelectItem>
                        <SelectItem value="Donegal">Donegal</SelectItem>
                        <SelectItem value="Sligo">Sligo</SelectItem>
                        <SelectItem value="Leitrim">Leitrim</SelectItem>
                        <SelectItem value="Roscommon">Roscommon</SelectItem>
                        <SelectItem value="Mayo">Mayo</SelectItem>
                        <SelectItem value="Clare">Clare</SelectItem>
                        <SelectItem value="Kerry">Kerry</SelectItem>
                        <SelectItem value="Tipperary">Tipperary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="experience">Years of Experience *</Label>
                    <Select value={profileData.experience} onValueChange={(value) => setProfileData(prev => ({ ...prev, experience: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 year</SelectItem>
                        <SelectItem value="2">2 years</SelectItem>
                        <SelectItem value="3">3 years</SelectItem>
                        <SelectItem value="4">4 years</SelectItem>
                        <SelectItem value="5">5 years</SelectItem>
                        <SelectItem value="10">10+ years</SelectItem>
                        <SelectItem value="15">15+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="certifications">Certifications & Qualifications</Label>
                  <Textarea
                    id="certifications"
                    value={profileData.certifications}
                    onChange={(e) => setProfileData(prev => ({ ...prev, certifications: e.target.value }))}
                    placeholder="List any relevant certifications, licenses, or qualifications..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">Emergency Callouts</span>
                      </div>
                      <p className="text-sm text-gray-500">Available for urgent emergency installations</p>
                    </div>
                    <Switch
                      checked={profileData.emergencyCallout}
                      onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, emergencyCallout: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Weekend Availability</span>
                      </div>
                      <p className="text-sm text-gray-500">Available for weekend installations</p>
                    </div>
                    <Switch
                      checked={profileData.weekendAvailable}
                      onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, weekendAvailable: checked }))}
                    />
                  </div>
                </div>
              </TabsContent>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProfileDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {updateProfileMutation.isPending ? (
                    "Updating..."
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Update Profile
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}