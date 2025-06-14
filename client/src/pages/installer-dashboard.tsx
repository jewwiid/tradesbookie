import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bolt, 
  Hammer, 
  Star,
  MapPin,
  Clock,
  CheckCircle,
  User,
  LogOut,
  Navigation,
  Zap,
  AlertCircle,
  DollarSign
} from "lucide-react";

interface InstallerStats {
  monthlyJobs: number;
  earnings: number;
  rating: number;
  activeRequests: number;
}

interface ClientRequest {
  id: number;
  customerId: number;
  tvSize: string;
  serviceType: string;
  address: string;
  county: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  totalPrice: string;
  installerEarnings: string;
  preferredDate?: string;
  preferredTime?: string;
  urgency: 'standard' | 'urgent' | 'emergency';
  timePosted: string;
  estimatedDuration: string;
  customerRating: number;
  distance?: number;
  roomPhotoUrl?: string;
  aiPreviewUrl?: string;
  customerNotes?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed';
  customer: {
    name: string;
    phone: string;
    email: string;
  };
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
          <Navigation className="w-5 h-5 text-green-600" />
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

      {/* Simplified Ireland outline */}
      <svg viewBox="0 0 400 300" className="w-full h-full">
        {/* Ireland outline (simplified) */}
        <path
          d="M80 50 Q90 40 120 45 Q160 50 180 70 Q200 90 195 120 Q190 150 170 180 Q150 200 120 195 Q90 190 70 170 Q50 150 55 120 Q60 90 80 50Z"
          fill="#e8f5e8"
          stroke="#22c55e"
          strokeWidth="2"
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

  const urgencyInfo = getUrgencyInfo(request.urgency);
  const timeAgo = new Date(request.timePosted).toLocaleTimeString();

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
            <div className="text-2xl font-bold text-green-600">€{request.installerEarnings}</div>
            <div className="text-sm text-gray-500">Est. {request.estimatedDuration}</div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">{request.tvSize}" TV Installation</span>
            <div className="flex items-center space-x-1 text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm">{request.customerRating}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{request.address}, {request.county}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Posted {timeAgo}</span>
            {request.preferredDate && (
              <span className="text-sm">• Preferred: {request.preferredDate}</span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-gray-600">
            <User className="w-4 h-4" />
            <span className="text-sm">{request.customer.name}</span>
          </div>
        </div>

        {request.customerNotes && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700">"{request.customerNotes}"</p>
          </div>
        )}

        <div className="flex space-x-3">
          <Button 
            onClick={() => onAccept(request.id)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Accept Job
          </Button>
          <Button 
            variant="outline"
            onClick={() => onDecline(request.id)}
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InstallerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Fetch available requests from API
  const { data: availableRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/installer/available-requests'],
    enabled: isOnline,
    refetchInterval: 30000, // Refresh every 30 seconds when online
  });

  // Accept request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest(`/api/installer/accept-request/${requestId}`, 'POST', {
        installerId: 1 // Demo installer ID
      });
    },
    onSuccess: (data: any, requestId) => {
      toast({
        title: "Request Accepted!",
        description: data?.notifications?.emailSent 
          ? "Customer notified via email and SMS. Check your active jobs."
          : "Request accepted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/installer/available-requests'] });
      
      // Remove the accepted request from selected state
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept request",
        variant: "destructive",
      });
    }
  });

  // Decline request mutation
  const declineRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest(`/api/installer/decline-request/${requestId}`, 'POST');
    },
    onSuccess: (data, requestId) => {
      toast({
        title: "Request Declined",
        description: "Request removed from your list",
      });
      
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

  const stats: InstallerStats = {
    monthlyJobs: 24,
    earnings: 2850,
    rating: 4.9,
    activeRequests: mockRequests.length
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      toast({
        title: "Request Accepted!",
        description: "Customer will be notified via email and SMS. Check your active jobs.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = async (requestId: number) => {
    try {
      toast({
        title: "Request Declined",
        description: "Request removed from your list",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to decline request",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Bolt className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">SmartTVMount Pro</h1>
              </div>
              <Badge variant={isOnline ? "default" : "secondary"} className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Available for Jobs</span>
                <Switch 
                  checked={isOnline} 
                  onCheckedChange={setIsOnline}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
              <Button variant="ghost" size="sm">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                  <p className="text-3xl font-bold text-gray-900">{stats.activeRequests}</p>
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
                  <p className="text-3xl font-bold text-gray-900">{stats.monthlyJobs}</p>
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
                  <p className="text-3xl font-bold text-gray-900">€{stats.earnings}</p>
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
                  <p className="text-3xl font-bold text-gray-900">{stats.rating}</p>
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
              <Navigation className="w-4 h-4 mr-2" />
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
                requests={mockRequests}
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
            {mockRequests.map((request) => (
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
        {mockRequests.length === 0 && (
          <Card className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Requests</h3>
            <p className="text-gray-500 mb-6">
              Turn on "Available for Jobs" to start receiving installation requests
            </p>
            <Button onClick={() => setIsOnline(true)} disabled={isOnline}>
              Go Online
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}