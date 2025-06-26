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
        title: "Request Accepted Successfully",
        description: "Professional email sent to customer with your contact details. They will reach out within 24 hours to confirm scheduling.",
        duration: 6000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/installer/available-requests'] });
      
      // Update local stats to reflect accepted job
      setStats(prev => ({
        ...prev,
        monthlyJobs: prev.monthlyJobs + 1,
        earnings: prev.earnings + parseFloat(selectedRequest?.installerEarnings || "0")
      }));
      
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
    activeRequests: requests.length
  };

  const handleAcceptRequest = (requestId: number) => {
    acceptRequestMutation.mutate(requestId);
  };

  const handleDeclineRequest = (requestId: number) => {
    declineRequestMutation.mutate(requestId);
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
                <h1 className="text-xl font-bold text-gray-900">tradesbook.ie Pro</h1>
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
            {requests.map((request: ClientRequest) => (
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
        {requests.length === 0 && !requestsLoading && (
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