import { useState, useEffect, useRef } from "react";
import L from 'leaflet';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import Footer from "@/components/Footer";
import InstallerWalletDashboard from "@/components/installer/InstallerWalletDashboard";
import PastLeadsManagement from "@/components/installer/PastLeadsManagement";
import InstallerReviews from "@/components/installer/InstallerReviews";
import VoucherStatus from "@/components/installer/VoucherStatus";
import AdminPromotionBanner from "@/components/installer/AdminPromotionBanner";
import LeadPurchaseDialog from "@/components/installer/LeadPurchaseDialog";
import QRScanner from "@/components/installer/QRScanner";
import CompletionPhotoCapture from "@/components/installer/CompletionPhotoCapture";
import BeforeAfterPhotoCapture from "@/components/installer/BeforeAfterPhotoCapture";
import FlexiblePhotoCapture from "@/components/installer/FlexiblePhotoCapture";
import ScheduleProposalForm from "@/components/ScheduleProposalForm";
import ScheduleNegotiation from "@/components/ScheduleNegotiation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth } from "date-fns";

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
  Lock,
  Camera,
  Home,
  Mail,
  Phone,
  Shield,
  Edit,
  Tv,
  Calendar,
  ArrowLeft,
  Wrench,
  Eye,
  X,
  Check,
  Target,
  RotateCcw,
  Info,
  Monitor,
  Euro,
  ChevronDown,
  ChevronUp,
  Play
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
  status: 'pending' | 'urgent' | 'emergency' | 'accepted' | 'in_progress' | 'completed' | 'open' | 'confirmed';
  scheduledDate?: string;
  createdAt: string;
  qrCode: string;
  notes?: string;
  difficulty: string;
  referralCode?: string;
  referralDiscount?: string;
  referralInfo?: {
    referralCode: string;
    referralType: string;
    salesStaffName?: string;
    salesStaffStore?: string;
    isStaffReferral: boolean;
  };
  distance?: number;
  // Additional fields for complete booking details
  customerName?: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerNotes?: string;
  needsWallMount?: boolean;
  totalPrice?: string;
  customerTotal?: string;
  preferredDate?: string;
  preferredTime?: string;
  // Multi-TV support
  tvInstallations?: any[];
  tvQuantity?: number;
}

// Interactive Map Component for Ireland
function IrelandMap({ requests, onRequestSelect, selectedRequest }: {
  requests: ClientRequest[];
  onRequestSelect: (request: ClientRequest) => void;
  selectedRequest?: ClientRequest;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // County coordinate mapping for Ireland
  const countyCoordinates: { [key: string]: [number, number] } = {
    'dublin': [53.3498, -6.2603],
    'cork': [51.8985, -8.4756],
    'galway': [53.2707, -9.0568],
    'limerick': [52.6638, -8.6267],
    'waterford': [52.2583, -7.1119],
    'kilkenny': [52.6541, -7.2448],
    'wexford': [52.3369, -6.4633],
    'carlow': [52.8406, -6.9267],
    'laois': [53.0344, -7.3019],
    'offaly': [53.2734, -7.7940],
    'kildare': [53.1639, -6.9111],
    'wicklow': [52.9810, -6.0448],
    'meath': [53.6055, -6.6802],
    'louth': [53.9474, -6.5372],
    'monaghan': [54.2497, -6.9681],
    'cavan': [53.9901, -7.3601],
    'longford': [53.7244, -7.7956],
    'westmeath': [53.5362, -7.3386],
    'roscommon': [53.6279, -8.1951],
    'sligo': [54.2766, -8.4761],
    'leitrim': [54.0239, -8.0658],
    'donegal': [54.9896, -8.1306],
    'mayo': [53.8580, -9.2957],
    'clare': [52.8466, -8.9860],
    'tipperary': [52.4731, -8.1600],
    'kerry': [52.1662, -9.7024]
  };

  const getCoordinatesFromAddress = (address: string): [number, number] => {
    const lowerAddress = address.toLowerCase();
    
    // Check for specific cities/towns first for better accuracy
    const cityMappings: { [key: string]: [number, number] } = {
      'blanchardstown': [53.3928, -6.3764],
      'tallaght': [53.2859, -6.3733],
      'swords': [53.4597, -6.2178],
      'carrickmines': [53.2769, -6.1522],
      'fonthill': [53.3433, -6.4286],
      'rathfarnham': [53.2925, -6.2794],
      'dun laoghaire': [53.2936, -6.1347],
      'rathmines': [53.3258, -6.2594],
      'ballymun': [53.3956, -6.2642],
      'carrigaline': [51.8139, -8.3989],
      'little island': [51.9028, -8.3467],
      'tuam': [53.5147, -8.8564],
      'athenry': [53.2983, -8.7439],
      'drogheda': [53.7178, -6.3478],
      'dundalk': [54.0019, -6.4058],
      'bray': [53.2028, -6.0989],
      'naas': [53.2167, -6.6667],
      'navan': [53.6548, -6.6978],
      'athlone': [53.4239, -7.9406],
      'tullamore': [53.2738, -7.4901],
      'portlaoise': [53.0344, -7.3016],
      'ennis': [52.8454, -8.9831],
      'tralee': [52.2706, -9.7002],
      'killarney': [52.0599, -9.5040],
      'clonmel': [52.3558, -7.7003],
      'castlebar': [53.8547, -9.2977],
      'letterkenny': [54.9539, -7.7338],
      'kinsale road': [51.8833, -8.5167]
    };
    
    // Check for city/town matches first
    for (const [cityName, coords] of Object.entries(cityMappings)) {
      if (lowerAddress.includes(cityName)) {
        return coords;
      }
    }
    
    // Fallback to county-level coordinates
    for (const [county, coords] of Object.entries(countyCoordinates)) {
      if (lowerAddress.includes(county)) {
        return coords;
      }
    }
    
    return [53.3441, -6.2675]; // Dublin default
  };

  const getMarkerColor = (status: string): string => {
    switch (status) {
      case 'urgent': return '#fb923c'; // orange-400 to match legend
      case 'emergency': return '#f87171'; // red-400 to match legend
      case 'standard': return '#60a5fa'; // blue-400 to match legend
      default: return '#6b7280';
    }
  };

  // Initialize map with proper DOM readiness checks
  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        // Ensure container has dimensions before initializing
        if (mapRef.current.offsetWidth === 0 || mapRef.current.offsetHeight === 0) {
          setTimeout(initializeMap, 100);
          return;
        }

        // Fix for default markers in Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Initialize map centered on Ireland with mobile optimization
        const map = L.map(mapRef.current, {
          center: [53.1424, -7.6921], // Center of Ireland
          zoom: 7,
          minZoom: 6,
          maxZoom: 12,
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          dragging: true,
          touchZoom: true // Enable touch zoom
        } as L.MapOptions);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(map);

        // Set bounds to Ireland
        const irelandBounds = L.latLngBounds(
          L.latLng(51.222, -10.669), // Southwest corner
          L.latLng(55.636, -5.452)   // Northeast corner
        );
        map.setMaxBounds(irelandBounds);

        mapInstanceRef.current = map;
      } catch (error) {
        console.error('Map initialization error:', error);
      }
    };

    // Small delay to ensure DOM is fully ready
    const timeoutId = setTimeout(initializeMap, 100);

    return () => {
      clearTimeout(timeoutId);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Map cleanup warning:', e);
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Geocode addresses using real API for better accuracy
  const geocodeAddressAPI = async (address: string): Promise<[number, number] | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        if (result.lat && result.lng) {
          return [result.lat, result.lng];
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn('Geocoding API error for', address, '- using fallback coordinates');
      }
    }
    
    // Fallback to local coordinates if API fails
    return getCoordinatesFromAddress(address);
  };

  // Update markers when requests change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current!.removeLayer(marker);
    });
    markersRef.current = [];

    // Add markers for each request with improved geocoding
    const addMarkersWithGeocoding = async () => {
      for (const request of requests) {
        const coordinates = await geocodeAddressAPI(request.address);
        
        if (coordinates) {
          // Create custom icon with larger size for mobile touch
          const customIcon = L.divIcon({
            html: `<div style="
              background-color: ${getMarkerColor(request.status)};
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              color: white;
              font-weight: bold;
              cursor: pointer;
              z-index: 1000;
            ">€${request.leadFee}</div>`,
            className: 'custom-marker mobile-friendly-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const marker = L.marker(coordinates, { 
            icon: customIcon,
            interactive: true,
            bubblingMouseEvents: false
          })
            .addTo(mapInstanceRef.current!)
            .bindPopup(`
              <div style="font-size: 14px; line-height: 1.4;">
                <strong>${request.address}</strong><br>
                <span style="color: #666;">€${request.leadFee} lead fee</span><br>
                <span style="color: #666;">${request.tvInstallations && Array.isArray(request.tvInstallations) && request.tvInstallations.length > 1 ? `${request.tvInstallations.length} TVs` : `${request.tvSize}" ${request.serviceType}`}</span><br>
                <span style="color: ${getMarkerColor(request.status)}; font-weight: bold; text-transform: uppercase;">${request.status}</span>
              </div>
            `)
            .on('click', (e: any) => {
              if (e.originalEvent) {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();
              }
              
              // Zoom to the marker location
              mapInstanceRef.current!.setView(coordinates, 14, { animate: true });
              
              if (onRequestSelect) {
                onRequestSelect(request);
              }
            });

          markersRef.current.push(marker);

          // Highlight selected request with zoom
          if (selectedRequest?.id === request.id) {
            marker.openPopup();
            mapInstanceRef.current!.setView(coordinates, 14, { animate: true });
          }
        }
      }
      
      // If no request is selected, fit all markers in view
      if (!selectedRequest && markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        mapInstanceRef.current!.fitBounds(group.getBounds(), { padding: [20, 20] });
      } else if (!selectedRequest) {
        // Reset to Ireland view if no markers
        mapInstanceRef.current!.setView([53.1424, -7.6921], 7);
      }
    };

    addMarkersWithGeocoding();
  }, [requests, selectedRequest, onRequestSelect]);

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
      {/* Enhanced Header with Statistics */}
      <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Title Section */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <NavigationIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Live Lead Map</h2>
              <p className="text-emerald-100 text-sm">Real-time installation requests across Ireland</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <div className="text-white text-lg font-bold">{requests.length}</div>
              <div className="text-emerald-100 text-xs">Available Leads</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <div className="text-white text-lg font-bold">€{requests.reduce((sum, r) => sum + (Number(r.estimatedEarnings) || 0), 0)}</div>
              <div className="text-emerald-100 text-xs">Net Potential Revenue</div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <span className="text-emerald-100 font-medium">Priority Levels:</span>
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full ring-2 ring-white"></div>
              <span className="text-white">Standard</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-400 rounded-full ring-2 ring-white"></div>
              <span className="text-white">Urgent</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-400 rounded-full ring-2 ring-white"></div>
              <span className="text-white">Emergency</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section with Enhanced Design */}
      <div className="p-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-lg ring-1 ring-slate-200">
          {/* Interactive Controls Overlay */}
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Ireland • {requests.length} Active Leads</span>
              </div>
            </div>
            
            {/* Map Actions */}
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  if (mapInstanceRef.current && markersRef.current.length > 0) {
                    const group = L.featureGroup(markersRef.current);
                    mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
                  }
                }}
                className="bg-white/95 backdrop-blur-sm rounded-xl p-2 shadow-lg hover:bg-white transition-all duration-200"
                title="Fit all leads in view"
              >
                <Target className="w-4 h-4 text-slate-600" />
              </button>
              <button 
                onClick={() => {
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.setView([53.1424, -7.6921], 7);
                  }
                }}
                className="bg-white/95 backdrop-blur-sm rounded-xl p-2 shadow-lg hover:bg-white transition-all duration-200"
                title="Reset to Ireland view"
              >
                <RotateCcw className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
          
          {/* Interactive Ireland Map */}
          <div ref={mapRef} className="w-full h-full" />
          
          {/* Empty State */}
          {requests.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/90 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Active Leads</h3>
                <p className="text-slate-500 text-sm max-w-sm">
                  Lead markers will appear on the map when customers book TV installations.
                </p>
              </div>
            </div>
          )}
        </div>
        

      </div>

      {/* Desktop Lead List - Enhanced Design */}
      <div className="hidden lg:block max-h-80 overflow-y-auto bg-white border-t border-slate-200">
        {requests.length > 0 ? (
          <div className="divide-y divide-slate-100">
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Available Leads ({requests.length})</h3>
              <p className="text-sm text-slate-600">Click on any lead to view on map</p>
            </div>
            {requests.map((request) => (
              <div
                key={request.id}
                className={`p-4 cursor-pointer transition-all duration-200 hover:bg-slate-50 ${
                  selectedRequest?.id === request.id ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''
                }`}
                onClick={() => onRequestSelect(request)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full ring-2 ring-white"
                        style={{ backgroundColor: getMarkerColor(request.status) }}
                      />
                      <span className="text-base font-medium text-slate-900 truncate">{request.address}</span>
                      <Badge 
                        variant={request.status === 'urgent' || request.status === 'emergency' ? 'destructive' : 'default'}
                        className="text-xs"
                      >
                        {request.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        <span>
                          {request.tvInstallations && Array.isArray(request.tvInstallations) && request.tvInstallations.length > 1 
                            ? `${request.tvInstallations.length} TVs (${request.tvInstallations.map((tv: any) => `${tv.tvSize}" ${tv.location || tv.roomName || ''}`).join(', ')})` 
                            : `${request.tvSize}" ${request.serviceType}`
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Euro className="w-4 h-4" />
                        <span>€{request.leadFee} lead fee</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-gray-900">{Math.round(request.profitMargin)}%</div>
                    <div className="text-xs text-gray-500">margin</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No leads available</p>
            <p className="text-sm">New installation requests will appear here when customers book services</p>
          </div>
        )}
      </div>
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
  const [showDetails, setShowDetails] = useState(false);
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

  // Priority system: Emergency > Urgent > Standard
  // Auto-determine urgency based on scheduling and manual status
  const getUrgencyLevel = (status: string, scheduledDate?: string) => {
    // Manual override for emergency/urgent status
    if (status === 'emergency') return 'emergency';
    if (status === 'urgent') return 'urgent';
    
    // Auto-determine based on scheduling timeline
    if (scheduledDate) {
      const scheduled = new Date(scheduledDate);
      const now = new Date();
      const hoursDiff = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Same day or within 24 hours = Emergency
      if (hoursDiff <= 24) return 'emergency';
      // Within 48 hours = Urgent  
      if (hoursDiff <= 48) return 'urgent';
    }
    
    return 'standard';
  };

  const urgency = getUrgencyLevel(request.status, request.scheduledDate);
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
            <div className="text-sm text-gray-500">Cost: {request.leadFee} Credits</div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">
              {request.tvInstallations && Array.isArray(request.tvInstallations) && request.tvInstallations.length > 1 
                ? `${request.tvInstallations.length} TV Installation` 
                : `${request.tvSize}" TV Installation`
              }
            </span>
            <div className="flex items-center space-x-1 text-green-600">
              <span className="text-sm font-medium">{Math.round(request.profitMargin)}% margin</span>
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

          {request.tvInstallations && Array.isArray(request.tvInstallations) && request.tvInstallations.length > 1 ? (
            // Multi-TV display
            <div className="mt-2">
              <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Tv className="w-4 h-4" />
                Multi-TV Installation ({request.tvInstallations.length} TVs)
              </div>
              <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                {request.tvInstallations.map((tv: any, index: number) => (
                  <div key={index} className="bg-white p-2 rounded border text-sm">
                    <div className="font-medium text-gray-800">
                      {tv.location || tv.roomName || `TV ${index + 1}`}
                    </div>
                    <div className="text-gray-600 text-xs mt-1">
                      {tv.tvSize}" • {tv.serviceType} • {tv.wallType} • {tv.mountType}
                    </div>
                    {tv.addons && tv.addons.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Add-ons: {tv.addons.map((addon: any) => addon.name).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-sm font-medium text-gray-700 mt-2">
                <span className="font-medium">Difficulty:</span> {request.difficulty} • 
                <span className="font-medium"> Total:</span> €{request.estimatedTotal}
              </div>
            </div>
          ) : (
            // Single TV display
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
              <div><span className="font-medium">Wall:</span> {request.wallType}</div>
              <div><span className="font-medium">Mount:</span> {request.mountType}</div>
              <div><span className="font-medium">Difficulty:</span> {request.difficulty}</div>
              <div><span className="font-medium">Total:</span> €{request.estimatedTotal}</div>
            </div>
          )}

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
        
        {/* Referral Information Section */}
        {request.referralInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900 text-sm">Customer Referral Source</span>
            </div>
            {request.referralInfo.isStaffReferral ? (
              <div className="space-y-1">
                <p className="text-xs text-blue-700">
                  <span className="font-medium">Referred by:</span> {request.referralInfo.salesStaffName}
                </p>
                <p className="text-xs text-blue-700">
                  <span className="font-medium">Store:</span> {request.referralInfo.salesStaffStore}
                </p>
                <p className="text-xs text-blue-700">
                  <span className="font-medium">Code:</span> {request.referralInfo.referralCode}
                </p>
                <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800">
                  💡 <strong>Staff referral:</strong> Customer was referred by retail staff - may need specific service approach
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-blue-700">
                  <span className="font-medium">Customer referral code:</span> {request.referralInfo.referralCode}
                </p>
                <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800">
                  💡 <strong>Customer referral:</strong> Regular customer-to-customer referral
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => setShowDetails(true)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Eye className="w-4 h-4 mr-1" />
              View Full Details
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDecline(request.id)}
              className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            >
              <X className="w-4 h-4 mr-1" />
              Pass
            </Button>
          </div>
          <Button
            size="sm"
            onClick={() => onAccept(request.id)}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="w-4 h-4 mr-1" />
            Purchase Lead (€{request.leadFee})
          </Button>
        </div>

        {/* Detailed Booking Information Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full" aria-describedby="booking-details-description">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Complete Booking Details</DialogTitle>
              <DialogDescription id="booking-details-description" className="text-sm sm:text-base">
                Comprehensive information about this installation request
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Customer Information */}
              <div className="border rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold mb-3 text-base sm:text-lg">Customer Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Customer Name</label>
                    <p className="text-sm sm:text-base break-words">{request.customerName || 'Customer details available after lead purchase'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Contact Phone</label>
                    <p className="text-sm sm:text-base break-words">{request.customerPhone || 'Customer details available after lead purchase'}</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Installation Address</label>
                    <p className="text-sm sm:text-base break-words">{request.address}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Distance from You</label>
                    <p className="text-sm sm:text-base">{(distance || request.distance) ? `${distance || request.distance}km away` : 'Calculating...'}</p>
                  </div>
                </div>
              </div>
              
              {/* Referral Information Section - Detailed View */}
              {request.referralInfo && (
                <div className="border rounded-lg p-3 sm:p-4 bg-blue-50 border-blue-200">
                  <h3 className="font-semibold mb-3 text-base sm:text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Customer Acquisition Source
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-blue-600">Referral Type</label>
                      <p className="text-sm sm:text-base text-blue-900 font-medium">
                        {request.referralInfo.isStaffReferral ? 'Staff Referral' : 'Customer Referral'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-blue-600">Referral Code</label>
                      <p className="text-sm sm:text-base text-blue-900 font-mono">{request.referralInfo.referralCode}</p>
                    </div>
                    {request.referralInfo.isStaffReferral && (
                      <>
                        <div className="space-y-1">
                          <label className="text-xs sm:text-sm font-medium text-blue-600">Sales Staff Member</label>
                          <p className="text-sm sm:text-base text-blue-900">{request.referralInfo.salesStaffName}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs sm:text-sm font-medium text-blue-600">Store Location</label>
                          <p className="text-sm sm:text-base text-blue-900">{request.referralInfo.salesStaffStore}</p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Service Considerations */}
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <h4 className="font-medium text-blue-900 text-sm mb-2">Service Considerations</h4>
                    {request.referralInfo.isStaffReferral ? (
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• Customer referred by retail staff - may have specific expectations</li>
                        <li>• Consider following up with referring store for any special instructions</li>
                        <li>• Higher service standards expected due to staff relationship</li>
                        <li>• Potential for future business through this referral channel</li>
                      </ul>
                    ) : (
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• Customer-to-customer referral - may have heard positive reviews</li>
                        <li>• Good opportunity to maintain referral chain quality</li>
                        <li>• Consider asking about referring customer for feedback</li>
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Service Details */}
              <div className="border rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold mb-3 text-base sm:text-lg">Service Specifications</h3>
                
                {request.tvInstallations && Array.isArray(request.tvInstallations) && request.tvInstallations.length > 1 ? (
                  /* Multi-TV Installation Details */
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Tv className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-base">Multiple TV Installation ({request.tvInstallations.length} TVs)</span>
                    </div>
                    
                    {request.tvInstallations.map((tv: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border-l-4 border-primary">
                        <div className="flex flex-col sm:flex-row gap-3">
                          {/* TV Details */}
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              {tv.location || `TV ${index + 1}`}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="font-medium text-gray-600">Size:</span> {tv.tvSize}"
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Service:</span> {tv.serviceType}
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Wall:</span> {tv.wallType}
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Mount:</span> {tv.mountType}
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Wall Mount:</span> {tv.needsWallMount ? 'Required' : 'Not needed'}
                              </div>
                              {tv.basePrice && (
                                <div>
                                  <span className="font-medium text-gray-600">Price:</span> €{tv.basePrice}
                                </div>
                              )}
                            </div>
                            {tv.addons && tv.addons.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <span className="font-medium text-gray-600 text-xs">Add-ons:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {tv.addons.map((addon: any, addonIndex: number) => (
                                    <Badge key={addonIndex} variant="outline" className="text-xs">
                                      {addon.name} {addon.price > 0 ? `(+€${addon.price})` : ''}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Room Photo */}
                          {(tv.roomPhotoBase64 || tv.roomPhotoUrl) && (
                            <div className="flex-shrink-0">
                              <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-lg overflow-hidden border border-gray-200">
                                <img 
                                  src={tv.roomPhotoBase64 ? `data:image/jpeg;base64,${tv.roomPhotoBase64}` : tv.roomPhotoUrl} 
                                  alt={`Room photo for ${tv.location || `TV ${index + 1}`}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1 text-center">Room photo</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-2 border-t">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs sm:text-sm font-medium text-gray-600">Installation Difficulty</label>
                          <p className="text-sm sm:text-base capitalize">{request.difficulty}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Single TV Installation Details */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-600">TV Size</label>
                      <p className="text-sm sm:text-base font-bold">{request.tvSize}" Television</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-600">Service Type</label>
                      <p className="text-sm sm:text-base capitalize break-words">{request.serviceType?.replace('-', ' ') || 'Standard Installation'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-600">Wall Type</label>
                      <p className="text-sm sm:text-base capitalize">{request.wallType}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-600">Mount Type</label>
                      <p className="text-sm sm:text-base capitalize">{request.mountType}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-600">Installation Difficulty</label>
                      <p className="text-sm sm:text-base capitalize">{request.difficulty}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-600">Wall Mount Required</label>
                      <p className="text-sm sm:text-base">{request.needsWallMount ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="border rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold mb-3 text-base sm:text-lg">Pricing & Earnings</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Customer Total:</span>
                      <span className="font-medium text-sm sm:text-base">€{request.estimatedTotal || request.customerTotal || request.totalPrice}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Lead Fee (You Pay):</span>
                      <span className="font-medium text-red-600 text-sm sm:text-base">-€{request.leadFee}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="font-medium text-gray-900 text-sm sm:text-base">Your Earnings:</span>
                      <span className="font-bold text-base sm:text-lg text-green-600">€{request.estimatedEarnings}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Profit Margin:</span>
                      <span className="font-medium text-green-600 text-sm sm:text-base">{Math.round(request.profitMargin)}%</span>
                    </div>
                    <div className="p-2 sm:p-3 bg-green-50 rounded">
                      <p className="text-xs sm:text-sm text-green-800">
                        Customer pays you directly: €{request.estimatedEarnings}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scheduling Information */}
              <div className="border rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold mb-3 text-base sm:text-lg">Scheduling Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Preferred Date</label>
                    <p className="text-sm sm:text-base break-words">
                      {request.preferredDate ? 
                        new Date(request.preferredDate).toLocaleDateString('en-IE', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : request.scheduledDate ? 
                        new Date(request.scheduledDate).toLocaleDateString('en-IE', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'Flexible'
                      }
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Preferred Time</label>
                    <p className="text-sm sm:text-base">
                      {request.preferredTime ? 
                        `${request.preferredTime} - ${
                          request.preferredTime === '09:00' ? '11:00' :
                          request.preferredTime === '11:00' ? '13:00' :
                          request.preferredTime === '13:00' ? '15:00' :
                          request.preferredTime === '15:00' ? '17:00' :
                          request.preferredTime === '17:00' ? '19:00' : 
                          '2 hour window'
                        }` : 'Flexible'
                      }
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Request Created</label>
                    <p className="text-sm sm:text-base">
                      {request.createdAt && new Date(request.createdAt).toLocaleDateString('en-IE')} {request.createdAt && new Date(request.createdAt).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Urgency Level</label>
                    <div className="flex items-center">
                      <Badge className={`text-xs sm:text-sm ${
                        request.status === 'emergency' ? 'bg-red-500 text-white' : 
                        request.status === 'urgent' ? 'bg-orange-500 text-white' : 
                        request.status === 'confirmed' ? 'bg-green-500 text-white' : 
                        request.status === 'open' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                      }`}>
                        {request.status === 'emergency' ? 'Emergency' :
                         request.status === 'urgent' ? 'Urgent' : 
                         request.status === 'confirmed' ? 'Confirmed' :
                         request.status === 'open' ? 'Standard' : 
                         request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Notes */}
              {request.notes && (
                <div className="border rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold mb-3 text-base sm:text-lg">Customer Notes</h3>
                  <p className="text-xs sm:text-sm bg-gray-50 p-2 sm:p-3 rounded break-words">{request.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t">
                {/* Mobile: Stack buttons vertically, Desktop: Side by side */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDetails(false)}
                      className="w-full sm:w-auto text-sm"
                    >
                      Close
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const encodedAddress = encodeURIComponent(request.address);
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                      }}
                      className="w-full sm:w-auto text-sm"
                    >
                      <MapPin className="w-4 h-4 mr-1" />
                      View on Map
                    </Button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDetails(false);
                        onDecline(request.id);
                      }}
                      className="w-full sm:w-auto text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Pass on This Lead
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDetails(false);
                        onAccept(request.id);
                      }}
                      className="w-full sm:w-auto text-sm bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Purchase Lead (€{request.leadFee})
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Job Completion Section Component
// Active Jobs Calendar Component
function ActiveJobsCalendar({ activeBookings }: { activeBookings: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get calendar days for current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fetch pending proposals to include in calendar
  const { data: pendingProposals = [] } = useQuery({
    queryKey: [`/api/installer/${activeBookings[0]?.installerId}/schedule-negotiations`],
    enabled: activeBookings.length > 0,
    refetchInterval: 30000
  });

  // Group active bookings by scheduled date AND include pending proposals
  const jobsByDate = activeBookings.reduce((acc: Record<string, any[]>, job: any) => {
    // Use scheduledDate if available, otherwise use created date for pending jobs
    const jobDate = job.scheduledDate || job.createdAt;
    if (jobDate) {
      // Handle both string dates and date objects
      const dateKey = typeof jobDate === 'string' && jobDate.includes(' ')
        ? jobDate.split(' ')[0]  // Extract just the date part from "2025-08-23 00:00:00"
        : format(new Date(jobDate), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push({...job, isConfirmed: true});
    }
    return acc;
  }, {});

  // Add pending proposals to the calendar
  pendingProposals
    .filter((proposal: any) => proposal.status === 'pending' && proposal.proposedBy === 'installer')
    .forEach((proposal: any) => {
      // Handle both string dates and date objects  
      const dateKey = typeof proposal.proposedDate === 'string' && proposal.proposedDate.includes('T')
        ? proposal.proposedDate.split('T')[0]  // Extract date from ISO string "2025-08-24T00:00:00.000Z"
        : format(new Date(proposal.proposedDate), 'yyyy-MM-dd');
      if (!jobsByDate[dateKey]) {
        jobsByDate[dateKey] = [];
      }
      jobsByDate[dateKey].push({
        ...proposal,
        isProposed: true,
        contactName: proposal.customerName || 'Customer',
        status: 'proposed'
      });
    });

  // Get jobs for selected date
  const selectedDateJobs = selectedDate 
    ? jobsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  const getStatusColor = (job: any) => {
    if (job.isProposed) {
      return 'bg-amber-100 text-amber-800 border-amber-300'; // Proposed dates
    }
    switch (job.status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'competing': return 'bg-purple-100 text-purple-800';
      case 'scheduled': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const hasJobs = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return jobsByDate[dateKey]?.length > 0;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar View */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Active Jobs Calendar</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                ←
              </Button>
              <span className="text-lg font-medium min-w-[140px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                →
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map(date => {
              const dateJobs = jobsByDate[format(date, 'yyyy-MM-dd')] || [];
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isTodayDate = isToday(date);
              
              return (
                <button
                  key={date.toString()}
                  onClick={() => setSelectedDate(isSelected ? null : date)}
                  className={`
                    relative h-20 p-2 rounded border text-left transition-all hover:bg-gray-50
                    ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                    ${isTodayDate ? 'bg-blue-100 border-blue-300' : 'border-gray-200'}
                    ${!isSameMonth(date, currentDate) ? 'opacity-30' : ''}
                  `}
                >
                  <div className={`text-sm font-medium ${
                    isTodayDate ? 'text-blue-700' : 
                    !isSameMonth(date, currentDate) ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {format(date, 'd')}
                  </div>
                  
                  {/* Job indicators */}
                  {dateJobs.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dateJobs.slice(0, 2).map((job, idx) => (
                        <div
                          key={job.id}
                          className={`text-xs px-1 py-0.5 rounded truncate ${
                            job.isProposed ? 'bg-amber-500 text-white' :
                            job.status === 'confirmed' ? 'bg-green-500 text-white' :
                            job.status === 'competing' ? 'bg-purple-500 text-white' :
                            'bg-blue-500 text-white'
                          }`}
                          title={`${job.contactName} - ${job.serviceType}${job.isProposed ? ' (Proposed)' : ''}`}
                        >
                          {job.isProposed ? '⏰ ' : ''}{job.contactName}
                        </div>
                      ))}
                      {dateJobs.length > 2 && (
                        <div className="text-xs text-gray-500 font-medium">
                          +{dateJobs.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Job Details Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>
              {selectedDate 
                ? format(selectedDate, 'MMM dd, yyyy')
                : 'Select a Date'
              }
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDate ? (
            selectedDateJobs.length > 0 ? (
              <div className="space-y-4">
                {selectedDateJobs.map(job => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{job.contactName}</span>
                      </div>
                      <Badge className={getStatusColor(job)}>
                        {job.isProposed ? '⏰ Proposed Schedule' :
                         job.status === 'competing' ? 'Bidding' : 
                         job.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs">{job.address}</span>
                      </div>
                      
                      {job.tvInstallations && Array.isArray(job.tvInstallations) && job.tvInstallations.length > 1 ? (
                        <div className="flex items-center space-x-2">
                          <Tv className="w-4 h-4" />
                          <span>Multi-TV Installation ({job.tvInstallations.length} TVs)</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Tv className="w-4 h-4" />
                          <span>{job.tvSize}" {job.serviceType}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Euro className="w-4 h-4" />
                          <span>Job Value: €{job.estimatedTotal}</span>
                        </div>
                        {job.leadFee && (
                          <span className="text-xs text-gray-500">
                            Lead Fee: €{job.leadFee}
                          </span>
                        )}
                      </div>

                      {job.customerNotes && (
                        <div className="bg-blue-50 p-2 rounded text-xs">
                          <strong>Notes:</strong> {job.customerNotes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No active jobs for this date</p>
              </div>
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Click on a calendar date to view active jobs</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Active Jobs Section - where installers manage their assigned bookings and communicate with customers
function ActiveJobsSection({ installerId }: { installerId?: number }) {
  const { toast } = useToast();
  const [expandedDetails, setExpandedDetails] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const queryClient = useQueryClient();

  // Fetch installer's assigned bookings
  const { data: activeBookings = [], isLoading, refetch } = useQuery({
    queryKey: [`/api/installer/bookings`],
    enabled: !!installerId,
    refetchInterval: 30000, // Refresh every 30 seconds for new messages
  });

  const toggleDetails = (bookingId: number) => {
    setExpandedDetails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  // Mutation to cancel job assignment
  const cancelJobAssignment = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: number; reason: string }) => {
      const response = await fetch(`/api/bookings/${bookingId}/cancel-assignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason, cancelledBy: 'installer' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel job assignment');
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Job Cancelled",
        description: `Job successfully cancelled. Lead fee of €${data.refundAmount || '0'} has been refunded to your wallet.`,
      });
      refetch(); // Refresh the active jobs list
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel job assignment",
        variant: "destructive",
      });
    }
  });

  if (!installerId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Please complete your profile setup to access active jobs.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeBookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wrench className="w-5 h-5" />
            <span>Active Jobs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <Wrench className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-gray-600 font-medium">No active jobs yet</p>
              <p className="text-sm text-gray-500">When customers accept your proposals, they'll appear here.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'competing': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="w-5 h-5" />
                <span>Active Jobs ({activeBookings.length})</span>
              </CardTitle>
              <CardDescription>
                Active installations requiring your attention
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center space-x-1"
              >
                <span>List</span>
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="flex items-center space-x-1"
              >
                <Calendar className="w-4 h-4" />
                <span>Calendar</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {viewMode === 'list' ? (
            activeBookings.map((booking: any) => (
            <Card key={booking.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-6 space-y-4">
                {/* Booking Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg">{booking.contactName}</h3>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status === 'competing' ? 'Bidding' : booking.status.replace('_', ' ')}
                      </Badge>
                      {booking.isSelected && (
                        <Badge className="bg-green-100 text-green-800">
                          ✓ Selected
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{booking.address}</span>
                    </div>
                    {booking.leadFee && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Euro className="w-3 h-3" />
                        <span>Lead Fee: €{booking.leadFee}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">Job Value</div>
                      <div className="font-semibold text-green-600">€{booking.estimatedTotal}</div>
                    </div>
                    {booking.createdAt && (
                      <div className="text-sm text-gray-500">
                        Created: {formatDate(booking.createdAt)}
                      </div>
                    )}
                    {booking.status === 'competing' && (
                      <div className="text-xs text-purple-600 font-medium">
                        Multiple installers bidding
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Service Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {booking.tvInstallations && Array.isArray(booking.tvInstallations) && booking.tvInstallations.length > 1 ? (
                      <>
                        <span><Tv className="w-4 h-4 inline mr-1" />Multi-TV Installation</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          {booking.tvInstallations.length} TVs
                        </span>
                        <span className="text-xs text-gray-500">
                          ({booking.tvInstallations.map(tv => tv.location || 'Room').join(', ')})
                        </span>
                      </>
                    ) : (
                      <>
                        <span><Tv className="w-4 h-4 inline mr-1" />{booking.tvSize}"</span>
                        <span><Monitor className="w-4 h-4 inline mr-1" />{booking.serviceType}</span>
                      </>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleDetails(booking.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {expandedDetails.has(booking.id) ? (
                      <><ChevronUp className="w-4 h-4 mr-1" />Hide Details</>
                    ) : (
                      <><ChevronDown className="w-4 h-4 mr-1" />Show Details</>
                    )}
                  </Button>
                </div>

                {/* Expandable Service Details */}
                {expandedDetails.has(booking.id) && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-900 border-b pb-1">Contact Details</h5>
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="w-4 h-4 text-blue-600" />
                          <span>{booking.contactPhone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span>{booking.contactEmail}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-900 border-b pb-1">Service Details</h5>
                        <div className="flex items-center space-x-2 text-sm">
                          <Tv className="w-4 h-4 text-blue-600" />
                          <span>{booking.tvSize}" TV - {booking.serviceType}</span>
                        </div>
                        {booking.wallType && (
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="font-medium">Wall Type:</span>
                            <span>{booking.wallType}</span>
                          </div>
                        )}
                        {booking.mountType && (
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="font-medium">Mount Type:</span>
                            <span>{booking.mountType}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Multi-TV Information */}
                    {booking.tvInstallations && Array.isArray(booking.tvInstallations) && booking.tvInstallations.length > 1 && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-900 border-b pb-1">Multiple TV Installation ({booking.tvInstallations.length} TVs)</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {booking.tvInstallations.map((tv: any, index: number) => (
                            <div key={index} className="bg-white p-3 rounded border text-sm">
                              <div className="font-medium">{tv.location || tv.roomName || `TV ${index + 1}`}</div>
                              <div className="text-gray-600">{tv.tvSize}" • {tv.wallType} • {tv.mountType}</div>
                              <div className="text-xs text-gray-500">Service: {tv.serviceType}</div>
                              {tv.addons && tv.addons.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Add-ons: {tv.addons.map((addon: any) => addon.name).join(', ')}
                                </div>
                              )}
                              {tv.estimatedTotal && (
                                <div className="text-xs font-medium text-green-600 mt-1">
                                  €{tv.estimatedTotal}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Single TV Installation Details */}
                    {(!booking.tvInstallations || !Array.isArray(booking.tvInstallations) || booking.tvInstallations.length <= 1) && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-900 border-b pb-1">Installation Details</h5>
                        <div className="bg-white p-3 rounded border text-sm">
                          <div className="font-medium">Single TV Installation</div>
                          <div className="text-gray-600">{booking.tvSize}" TV • {booking.wallType} • {booking.mountType}</div>
                          <div className="text-gray-600">Service: {booking.serviceType}</div>
                        </div>
                      </div>
                    )}

                    {/* Add-ons */}
                    {(() => {
                      // Aggregate addons from all TVs for multi-TV installations
                      let allAddons: any[] = [];
                      
                      if (booking.tvInstallations && booking.tvInstallations.length > 0) {
                        // Multi-TV installation: collect addons from all TVs
                        booking.tvInstallations.forEach((tv: any) => {
                          if (tv.addons && tv.addons.length > 0) {
                            allAddons.push(...tv.addons);
                          }
                        });
                      } else if (booking.addons && booking.addons.length > 0) {
                        // Single TV installation: use booking.addons
                        allAddons = booking.addons;
                      }
                      
                      return allAddons.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900 border-b pb-1">Add-ons</h5>
                          <div className="flex flex-wrap gap-2">
                            {allAddons.map((addon: any, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {addon.name} - €{addon.price}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Customer Notes */}
                    {booking.customerNotes && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-900 border-b pb-1">Customer Notes</h5>
                        <div className="bg-blue-50 p-3 rounded text-sm text-blue-900">
                          {booking.customerNotes}
                        </div>
                      </div>
                    )}

                    {/* Preferred Schedule */}
                    {(booking.preferredDate || booking.preferredTime) && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-900 border-b pb-1">Customer Preferences</h5>
                        <div className="text-sm text-gray-600">
                          {booking.preferredDate && (
                            <div>
                              Preferred Date: {new Date(booking.preferredDate).toLocaleDateString('en-IE', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          )}
                          {booking.preferredTime && <div>Preferred Time: {booking.preferredTime}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Job Actions Section */}
                <div className="border-t pt-4 space-y-4">
                  {/* Start Work Button for scheduled jobs with confirmed schedule OR in progress jobs */}
                  {(((booking.status === 'confirmed' || booking.status === 'assigned') || 
                    (booking.status === 'scheduled' && (booking.negotiationStatus === 'accept' || booking.negotiationStatus === 'accepted'))) 
                    || booking.assignmentStatus === 'in_progress') && booking.isSelected && (
                    <>
                      <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-yellow-800">
                            {booking.assignmentStatus === 'in_progress' ? 'Work in Progress' : 'Ready to Start Installation'}
                          </h4>
                          <p className="text-sm text-yellow-600 mt-1">
                            {booking.assignmentStatus === 'in_progress' ? (
                              'Installation work has begun. Scan the customer\'s QR code to access the Job Completion tab and finish the job.'
                            ) : (
                              'This job is scheduled and ready to begin. Click "Start Work" when you arrive on-site.'
                            )}
                          </p>
                        </div>
                        {booking.assignmentStatus === 'in_progress' ? (
                          <div className="flex items-center space-x-2">
                            <div className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium flex items-center space-x-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                              <span>In Progress</span>
                            </div>
                          </div>
                        ) : (
                          <StartWorkButton
                            bookingId={booking.id}
                            installerId={installerId}
                            customerName={booking.contactName}
                            onStatusUpdated={() => refetch()}
                          />
                        )}
                      </div>

                      {/* Reschedule Option for confirmed jobs */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-800 text-sm">Need to Reschedule?</h4>
                          <p className="text-xs text-gray-600 mt-1">
                            If you can't make the scheduled time, propose a new date to the customer.
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleDetails(booking.id + 2000)} // Different offset for reschedule section
                            className="text-gray-600 hover:text-gray-800 text-xs"
                          >
                            {expandedDetails.has(booking.id + 2000) ? (
                              <><ChevronUp className="w-3 h-3 mr-1" />Hide</>
                            ) : (
                              <><ChevronDown className="w-3 h-3 mr-1" />Reschedule</>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Reschedule proposal form when expanded */}
                      {expandedDetails.has(booking.id + 2000) && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="mb-3">
                            <h5 className="font-medium text-gray-800 text-sm mb-1">Request Reschedule</h5>
                            <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                              ⚠️ This will notify the customer that you need to change the confirmed schedule. Use only if necessary.
                            </p>
                          </div>
                          <ScheduleProposalForm
                            bookingId={booking.id}
                            installerId={installerId}
                            customerName={booking.contactName}
                            customerAddress={booking.address}
                            onProposalSent={() => {
                              refetch();
                              setExpandedDetails(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(booking.id + 2000);
                                return newSet;
                              });
                            }}
                            isReschedule={true}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Schedule Communication Section - Only show if schedule not confirmed */}
                  {!((booking.status === 'confirmed' || booking.status === 'assigned') || 
                     (booking.status === 'scheduled' && (booking.negotiationStatus === 'accept' || booking.negotiationStatus === 'accepted'))) && (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Schedule Communication</h4>
                          {booking.status === 'competing' && (
                            <p className="text-sm text-purple-600 mt-1">
                              Send your best proposal to win this job
                            </p>
                          )}
                          {booking.isSelected && (
                            <p className="text-sm text-green-600 mt-1">
                              Customer selected you! Coordinate the final details.
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleDetails(booking.id + 1000)} // Use offset to avoid collision
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {expandedDetails.has(booking.id + 1000) ? (
                              <><ChevronUp className="w-4 h-4 mr-1" />Hide History</>
                            ) : (
                              <><ChevronDown className="w-4 h-4 mr-1" />Show History</>
                            )}
                          </Button>
                          <ScheduleProposalForm
                            bookingId={booking.id}
                            installerId={installerId}
                            customerName={booking.contactName}
                            customerAddress={booking.address}
                            onProposalSent={() => refetch()}
                          />
                          {!booking.scheduledDate && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm('Are you sure you want to cancel this job? The lead fee will be refunded to your wallet and this booking will be available for other installers.')) {
                                  cancelJobAssignment.mutate({
                                    bookingId: booking.id,
                                    reason: 'Unable to coordinate schedule with customer'
                                  });
                                }
                              }}
                              disabled={cancelJobAssignment.isPending}
                              className="text-xs"
                            >
                              {cancelJobAssignment.isPending ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Cancelling...
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3 mr-1" />
                                  Cancel Job
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Only show full schedule negotiation when expanded */}
                      {expandedDetails.has(booking.id + 1000) && (
                        <ScheduleNegotiation
                          bookingId={booking.id}
                          installerId={installerId}
                          userType="installer"
                          customerName={booking.contactName}
                        />
                      )}
                    </>
                  )}

                  {/* Confirmed Schedule Info - Only show if schedule is confirmed */}
                  {((booking.status === 'confirmed' || booking.status === 'assigned') || 
                    (booking.status === 'scheduled' && (booking.negotiationStatus === 'accept' || booking.negotiationStatus === 'accepted'))) && booking.scheduledDate && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h4 className="font-medium text-green-800">Schedule Confirmed</h4>
                      </div>
                      <p className="text-sm text-green-700">
                        Installation scheduled for {new Date(booking.scheduledDate).toLocaleDateString('en-IE', {
                          weekday: 'long',
                          year: 'numeric', 
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))) : (
            <ActiveJobsCalendar activeBookings={activeBookings} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function JobCompletionSection({ installerId }: { installerId?: number }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [completionSuccess, setCompletionSuccess] = useState('');
  const [verificationData, setVerificationData] = useState<any>(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showBeforeAfterCapture, setShowBeforeAfterCapture] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [clearScanner, setClearScanner] = useState(false);
  const [capturedAfterPhotos, setCapturedAfterPhotos] = useState<any[]>([]);
  const [showAfterPhotoReview, setShowAfterPhotoReview] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null); // Job selected for before photos
  const [showBeforePhotos, setShowBeforePhotos] = useState(false); // Show before photo capture first
  const [beforePhotosCompleted, setBeforePhotosCompleted] = useState(false); // Track if before photos are done
  const [takingAfterPhotos, setTakingAfterPhotos] = useState(false); // Track if currently taking after photos
  const { toast } = useToast();

  // Persist workflow state to localStorage
  const saveWorkflowState = (state: {
    selectedJobId?: number;
    showBeforePhotos?: boolean;
    beforePhotosCompleted?: boolean;
    takingAfterPhotos?: boolean;
    verificationData?: any;
  }) => {
    if (!installerId) return;
    const stateKey = `installer_${installerId}_workflow_state`;
    const currentState = JSON.parse(localStorage.getItem(stateKey) || '{}');
    const newState = { ...currentState, ...state };
    localStorage.setItem(stateKey, JSON.stringify(newState));
  };

  // Restore workflow state from localStorage
  const getWorkflowState = () => {
    if (!installerId) return null;
    const stateKey = `installer_${installerId}_workflow_state`;
    try {
      return JSON.parse(localStorage.getItem(stateKey) || '{}');
    } catch {
      return {};
    }
  };

  // Clear workflow state
  const clearWorkflowState = () => {
    if (!installerId) return;
    const stateKey = `installer_${installerId}_workflow_state`;
    localStorage.removeItem(stateKey);
  };

  // Clear temporary UI state when component initially mounts (but preserve workflow state)
  useEffect(() => {
    setScanError('');
    setCompletionSuccess('');
    setCurrentBooking(null);
    setShowBeforeAfterCapture(false);
    // Don't reset workflow state here - it will be restored by the other useEffect
    setClearScanner(true); // Trigger QR scanner clear
    
    // Reset the clear flag after a brief delay
    const timer = setTimeout(() => {
      setClearScanner(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Fetch in-progress jobs for this installer
  const { data: inProgressJobs = [], refetch: refetchInProgressJobs } = useQuery({
    queryKey: ['/api/installer/bookings'],
    retry: false,
    enabled: !!installerId,
    select: (data: any) => {
      // Filter only jobs that are in-progress status
      return data?.filter((job: any) => job.assignmentStatus === 'in_progress') || [];
    }
  });

  // Fetch completed jobs
  const { data: completedJobs = [], refetch: refetchCompletedJobs } = useQuery({
    queryKey: [`/api/installer/${installerId}/completed-jobs`],
    enabled: !!installerId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch photo progress for displaying completed photos
  const { data: photoProgressData } = useQuery({
    queryKey: [`/api/installer/photo-progress/${inProgressJobs[0]?.id}`],
    enabled: inProgressJobs.length > 0 && beforePhotosCompleted,
    refetchInterval: 10000, // Refresh every 10 seconds to get latest photos
  });

  // Restore workflow state when component mounts and after data is loaded
  useEffect(() => {
    if (!installerId || !inProgressJobs || inProgressJobs.length === 0) return;

    const restoreWorkflowState = async () => {
      const savedState = getWorkflowState();
      
      // Check for active job with photo progress from server data
      for (const job of inProgressJobs) {
        try {
          const photoProgressResponse = await fetch(`/api/installer/photo-progress/${job.id}`, {
            method: 'GET',
            credentials: 'include'
          });
          
          if (photoProgressResponse.ok) {
            const photoData = await photoProgressResponse.json();
            const hasBeforePhotos = photoData?.progress?.some((p: any) => p.beforePhotoUrl);
            
            if (hasBeforePhotos) {
              // Job has before photos - restore appropriate state
              setSelectedJob(job);
              setBeforePhotosCompleted(true);
              
              // If there's saved state indicating QR scan or after photos, restore that too
              if (savedState?.selectedJobId === job.id) {
                if (savedState.verificationData) setVerificationData(savedState.verificationData);
                if (savedState.takingAfterPhotos) setTakingAfterPhotos(true);
              }
              
              return; // Exit after restoring first job with progress
            }
          }
        } catch (error) {
          console.log(`Error checking photo progress for job ${job.id}:`, error);
        }
      }
      
      // Fallback to saved state if no server data found
      if (savedState && savedState.selectedJobId) {
        const savedJob = inProgressJobs.find((job: any) => job.id === savedState.selectedJobId);
        if (savedJob) {
          setSelectedJob(savedJob);
          if (savedState.showBeforePhotos) setShowBeforePhotos(true);
          if (savedState.beforePhotosCompleted) setBeforePhotosCompleted(true);
          if (savedState.takingAfterPhotos) setTakingAfterPhotos(true);
          if (savedState.verificationData) setVerificationData(savedState.verificationData);
        } else {
          clearWorkflowState(); // Clear if job no longer exists
        }
      }
    };

    restoreWorkflowState();
  }, [installerId, inProgressJobs]);

  // QR verification mutation
  const verifyQRMutation = useMutation({
    mutationFn: async (qrCode: string) => {
      const response = await apiRequest('POST', '/api/installer/verify-qr-code', {
        qrCode,
        installerId
      });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setVerificationData(data);
      setCurrentBooking(data.booking);
      setScanError('');
      
      // Get TV count to determine if photos are needed
      const tvInstallations = Array.isArray(data.booking?.tvInstallations) ? data.booking.tvInstallations : [];
      const tvCount = tvInstallations.length || 1; // Default to 1 for legacy bookings
      
      // Smart workflow detection: Check if work was started more than 30 minutes ago
      const now = new Date();
      const jobStartTime = data.jobAssignment?.acceptedDate ? new Date(data.jobAssignment.acceptedDate) : null;
      const timeElapsedMinutes = jobStartTime ? (now.getTime() - jobStartTime.getTime()) / (1000 * 60) : 0;
      const isPostWorkScan = timeElapsedMinutes > 30; // If more than 30 minutes, assume work is done
      
      // Store the timing context in verification data
      const verificationDataWithTiming = { ...data, isPostWorkScan };
      setVerificationData(verificationDataWithTiming);
      
      // Save verification data to localStorage
      saveWorkflowState({
        verificationData: verificationDataWithTiming
      });
      
      if (tvCount > 0) {
        // For post-work QR scans, show after photo capture
        if (isPostWorkScan) {
          setShowBeforeAfterCapture(true);
          toast({
            title: "Job Unlocked!",
            description: `Work completed! Please capture installation photos to document your quality work and earn stars.`,
          });
        } else {
          // For pre-work QR scans, the job is now "unlocked" but should transition to completion workflow
          toast({
            title: "Job Unlocked!",
            description: `Job ready to start! You can now begin work. Come back here to capture after photos when complete.`,
          });
          // Don't show photo capture yet - this unlocks the job for starting
        }
      } else {
        // Fallback for legacy bookings without TV installations
        toast({
          title: "Job Unlocked!",
          description: `Found booking for ${data.booking.customerName} at ${data.booking.address}`,
        });
      }
    },
    onError: (error: any) => {
      setScanError(error.message || 'Failed to verify QR code');
      setVerificationData(null);
      toast({
        title: "QR Verification Failed",
        description: error.message || 'Failed to verify QR code',
        variant: "destructive",
      });
    }
  });

  // Job completion mutation (updated to include photos)
  const completeJobMutation = useMutation({
    mutationFn: async (beforeAfterPhotos?: any[]) => {
      if (!verificationData) throw new Error('No verification data available');
      
      const response = await apiRequest('POST', '/api/installer/complete-installation', {
        qrCode: verificationData.booking.qrCode,
        installerId,
        jobAssignmentId: verificationData.jobAssignmentId,
        beforeAfterPhotos: beforeAfterPhotos || []
      });
      return response;
    },
    onSuccess: (data) => {
      setCompletionSuccess('Installation completed successfully! Payment will be handled directly with the customer.');
      setVerificationData(null);
      setShowBeforeAfterCapture(false);
      setCurrentBooking(null);
      setScanError('');
      // Clear all workflow state
      setSelectedJob(null);
      setShowBeforePhotos(false);
      setBeforePhotosCompleted(false);
      setTakingAfterPhotos(false);
      setCapturedAfterPhotos([]);
      setShowAfterPhotoReview(false);
      clearWorkflowState(); // Clear localStorage state
      refetchCompletedJobs(); // Refresh completed jobs list
      refetchInProgressJobs(); // Refresh in-progress jobs list to remove completed job
      toast({
        title: "Installation Completed!",
        description: "Job marked as complete with photos. Payment handled directly with customer.",
      });
    },
    onError: (error: any) => {
      setScanError(error.message || 'Failed to complete installation');
      toast({
        title: "Completion Failed",
        description: error.message || 'Failed to complete installation',
        variant: "destructive",
      });
    }
  });

  const handleQRScan = (qrCode: string) => {
    setIsScanning(false);
    setScanError('');
    setCompletionSuccess('');
    
    // Workflow validation: Check if user has started job workflow properly
    if (!beforePhotosCompleted && !verificationData && inProgressJobs.length > 0) {
      setScanError('Please start a job by taking before photos first, then scan the QR code to unlock it.');
      toast({
        title: "Workflow Error",
        description: "Start by clicking 'Start Job' to take before photos, then scan the QR code to unlock the job.",
        variant: "destructive",
      });
      return;
    }
    
    verifyQRMutation.mutate(qrCode);
  };

  const handleCompleteJob = async (afterPhotos?: any[]) => {
    if (!currentBooking) {
      toast({
        title: "Error",
        description: "No current booking data available",
        variant: "destructive",
      });
      return;
    }

    try {
      // Fetch existing photo progress to get before photos
      const photoProgressResponse = await fetch(`/api/installer/photo-progress/${currentBooking.id}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!photoProgressResponse.ok) {
        throw new Error('Failed to fetch existing photo progress');
      }

      const photoData = await photoProgressResponse.json();
      const existingProgress = photoData.progress || [];
      
      // Get TV count
      const tvCount = Array.isArray(currentBooking.tvInstallations) 
        ? currentBooking.tvInstallations.length 
        : 1;

      // Combine before and after photos for all TVs
      const combinedPhotos = [];
      for (let i = 0; i < tvCount; i++) {
        const existingTvProgress = existingProgress.find((p: any) => p.tvIndex === i);
        const afterPhotoForTv = afterPhotos?.find((p: any) => p.tvIndex === i);
        
        combinedPhotos.push({
          tvIndex: i,
          beforePhoto: existingTvProgress?.beforePhotoUrl || '',
          afterPhoto: afterPhotoForTv?.afterPhoto || ''
        });
      }

      // Validate that we have all required photos
      const missingPhotos = combinedPhotos.filter(tv => !tv.beforePhoto || !tv.afterPhoto);
      if (missingPhotos.length > 0) {
        toast({
          title: "Missing Photos",
          description: `Missing photos for ${missingPhotos.length} TV(s). Please ensure all before and after photos are captured.`,
          variant: "destructive",
        });
        return;
      }

      completeJobMutation.mutate(combinedPhotos);
    } catch (error) {
      console.error('Error preparing completion data:', error);
      toast({
        title: "Error",
        description: "Failed to prepare completion data. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleStartJob = (job: any) => {
    setSelectedJob(job);
    setShowBeforePhotos(true);
    // Save to localStorage
    saveWorkflowState({
      selectedJobId: job.id,
      showBeforePhotos: true,
      beforePhotosCompleted: false,
      takingAfterPhotos: false
    });
    toast({
      title: "Starting Job",
      description: `Take before photos first, then scan QR code to unlock the job.`,
    });
  };

  const handleEditPhotos = (job: any) => {
    setSelectedJob(job);
    setBeforePhotosCompleted(false); // Allow retaking photos
    setShowBeforePhotos(true);
    // Save to localStorage
    saveWorkflowState({
      selectedJobId: job.id,
      showBeforePhotos: true,
      beforePhotosCompleted: false,
      takingAfterPhotos: false
    });
    toast({
      title: "Edit Photos",
      description: `Retake before photos for this installation.`,
    });
  };

  const handleBeforePhotosCompleted = (photos: any[]) => {
    setBeforePhotosCompleted(true);
    setShowBeforePhotos(false);
    // Save to localStorage
    saveWorkflowState({
      showBeforePhotos: false,
      beforePhotosCompleted: true
    });
    toast({
      title: "Before Photos Complete!",
      description: `Now scan the customer's QR code to unlock and start the job.`,
    });
  };

  const handleBeforePhotosCancelled = () => {
    setShowBeforePhotos(false);
    setSelectedJob(null);
    setBeforePhotosCompleted(false);
    // Clear workflow state since job was cancelled
    clearWorkflowState();
    toast({
      title: "Photo capture cancelled",
      description: "Job start cancelled. You can try again anytime.",
      variant: "destructive",
    });
  };

  const handleAfterPhotosCompleted = (photos: any[]) => {
    // Store captured photos and show review interface instead of auto-completing
    setCapturedAfterPhotos(photos);
    setShowBeforeAfterCapture(false);
    setShowAfterPhotoReview(true);
    setTakingAfterPhotos(false);
    
    // Save state for persistence
    saveWorkflowState({
      takingAfterPhotos: false
    });
    
    toast({
      title: "After Photos Captured",
      description: "Review your photos and submit when ready, or retake if needed.",
    });
  };
  
  const handleAfterPhotosCancelled = () => {
    setShowBeforeAfterCapture(false);
    setVerificationData(null);
    setCurrentBooking(null);
    setTakingAfterPhotos(false);
    setScanError('');
    toast({
      title: "Photo capture cancelled",
      description: "Job completion cancelled. You can scan the QR code again to retry.",
      variant: "destructive",
    });
  };

  if (!installerId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Please complete your profile setup to access job completion features.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Before Photos Workflow - Step 1 */}
      {showBeforePhotos && selectedJob ? (
        <FlexiblePhotoCapture
          bookingId={selectedJob.id}
          tvCount={Array.isArray(selectedJob.tvInstallations) ? selectedJob.tvInstallations.length : 1}
          tvNames={Array.isArray(selectedJob.tvInstallations) ? 
            selectedJob.tvInstallations.map((tv: any) => tv.location || `TV ${tv.tvIndex + 1}`) : 
            [`TV 1`]
          }
          workflowStage="before" // Only before photos
          allowBeforeUpload={true}
          onPhotosComplete={handleBeforePhotosCompleted}
          onCancel={handleBeforePhotosCancelled}
          onProgressSave={(tvIndex, progress) => {
            toast({
              title: "Progress Saved",
              description: `Before photo progress saved for ${selectedJob.tvInstallations?.[tvIndex]?.location || `TV ${tvIndex + 1}`}`,
            });
          }}
        />
      ) : showBeforeAfterCapture && currentBooking ? (
        /* After Photos Workflow - Step 3 */
        <FlexiblePhotoCapture
          bookingId={currentBooking.id}
          tvCount={Array.isArray(currentBooking.tvInstallations) ? currentBooking.tvInstallations.length : 1}
          tvNames={Array.isArray(currentBooking.tvInstallations) ? 
            currentBooking.tvInstallations.map((tv: any) => tv.location || `TV ${tv.tvIndex + 1}`) : 
            [`TV 1`]
          }
          workflowStage="after" // Only after photos
          allowBeforeUpload={false}
          onPhotosComplete={handleAfterPhotosCompleted}
          onCancel={handleAfterPhotosCancelled}
          onProgressSave={(tvIndex, progress) => {
            toast({
              title: "Progress Saved",
              description: `After photo progress saved for ${currentBooking.tvInstallations?.[tvIndex]?.location || `TV ${tvIndex + 1}`}`,
            });
          }}
        />
      ) : showAfterPhotoReview && capturedAfterPhotos.length > 0 && currentBooking ? (
        /* After Photo Review and Submit Interface */
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <CheckCircle className="w-5 h-5" />
              <span>Review After Photos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-blue-700">
              Review your after photos below. Compare with the before photos and submit when satisfied, or retake if needed.
            </p>
            
            {/* Photo Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {capturedAfterPhotos.map((afterPhoto, index) => {
                const tvName = currentBooking.tvInstallations?.[index]?.location || `TV ${index + 1}`;
                return (
                  <div key={index} className="space-y-3">
                    <h4 className="font-medium text-gray-900">{tvName}</h4>
                    
                    {/* Before Photo */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">Before Photo</h5>
                      <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        {photoProgressData?.progress?.find((p: any) => p.tvIndex === index)?.beforePhotoUrl ? (
                          <img 
                            src={photoProgressData.progress.find((p: any) => p.tvIndex === index).beforePhotoUrl}
                            alt={`${tvName} Before`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Camera className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* After Photo */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">After Photo</h5>
                      <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        {afterPhoto.afterPhoto ? (
                          <img 
                            src={afterPhoto.afterPhoto}
                            alt={`${tvName} After`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Camera className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={() => handleCompleteJob(capturedAfterPhotos)}
                className="bg-green-600 hover:bg-green-700 flex-1"
                disabled={completeJobMutation.isPending}
              >
                {completeJobMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit & Complete Job
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  setCapturedAfterPhotos([]);
                  setShowAfterPhotoReview(false);
                  setShowBeforeAfterCapture(true);
                  setTakingAfterPhotos(true);
                }}
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                Retake After Photos
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* QR Scanner - Step 2 (After Before Photos) */}
          {(beforePhotosCompleted || verificationData) && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span>
                    {beforePhotosCompleted ? 'Scan QR Code to Unlock Job' : 'Job Unlocked - Complete When Ready'}
                  </span>
                </CardTitle>
                <p className="text-sm text-green-700">
                  {beforePhotosCompleted 
                    ? 'Before photos complete! Now scan the customer\'s QR code to unlock and start the installation.'
                    : 'Job is unlocked and ready. Come back here to take after photos when work is complete.'
                  }
                </p>
              </CardHeader>
            </Card>
          )}

          {/* Side-by-side layout: Ready to Start Installation and QR Scanner */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Ready to Start Installation */}
            <div>
              {inProgressJobs.length > 0 && !verificationData ? (
                <Card className={`h-full ${beforePhotosCompleted ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center space-x-2 ${beforePhotosCompleted ? 'text-green-800' : 'text-blue-800'}`}>
                      {beforePhotosCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                      <span>
                        {beforePhotosCompleted 
                          ? `Before Photos Complete (${inProgressJobs.length})`
                          : `Ready to Start Installation (${inProgressJobs.length})`
                        }
                      </span>
                    </CardTitle>
                    <p className={`text-sm ${beforePhotosCompleted ? 'text-green-700' : 'text-blue-700'}`}>
                      {beforePhotosCompleted 
                        ? 'Before photos uploaded! Now scan the QR code to verify location and unlock the job.'
                        : 'Start by taking before photos, then scan the customer\'s QR code to unlock the job.'
                      }
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {inProgressJobs.map((job: any) => {
                      const tvCount = Array.isArray(job.tvInstallations) ? job.tvInstallations.length : 1;
                      return (
                        <div key={job.id} className={`flex items-center justify-between p-4 bg-white border rounded-lg ${beforePhotosCompleted ? 'border-green-200' : 'border-blue-200'}`}>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900">{job.contactName}</h4>
                              <Badge className={beforePhotosCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                                <div className={`w-2 h-2 rounded-full mr-1 ${beforePhotosCompleted ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                {beforePhotosCompleted ? 'Photos Complete' : 'Ready to Start'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div className="flex items-center space-x-2 mb-1">
                                <MapPin className="w-4 h-4" />
                                <span>{job.address}</span>
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span className="flex items-center space-x-1">
                                  {beforePhotosCompleted ? (
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                  ) : (
                                    <Camera className="w-3 h-3" />
                                  )}
                                  <span>
                                    {beforePhotosCompleted 
                                      ? `${tvCount} TV${tvCount > 1 ? 's' : ''} - Ready for QR Scan`
                                      : `${tvCount} TV${tvCount > 1 ? 's' : ''} - Before Photos First`
                                    }
                                  </span>
                                </span>
                                <span>€{job.estimatedTotal}</span>
                              </div>
                              {tvCount > 1 && job.tvInstallations && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Rooms: {job.tvInstallations.map((tv: any) => tv.location || 'Room').join(', ')}
                                </div>
                              )}
                              
                              {/* Display Before Photos Thumbnails */}
                              {beforePhotosCompleted && photoProgressData?.progress && Array.isArray(photoProgressData.progress) && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <h5 className="text-xs font-medium text-gray-700 mb-2">Before Photos:</h5>
                                  <div className="grid grid-cols-2 gap-2">
                                    {job.tvInstallations?.map((tv: any, index: number) => {
                                      const progressItem = photoProgressData.progress.find((p: any) => p.tvIndex === index);
                                      const beforePhoto = progressItem?.beforePhotoUrl;
                                      return (
                                        <div key={index} className="text-center">
                                          <div className="relative w-16 h-12 mx-auto mb-1 bg-gray-100 rounded overflow-hidden">
                                            {beforePhoto ? (
                                              <img 
                                                src={beforePhoto} 
                                                alt={`${tv.location || `TV ${index + 1}`} Before`}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Camera className="w-4 h-4" />
                                              </div>
                                            )}
                                          </div>
                                          <span className="text-xs text-gray-600">{tv.location || `TV ${index + 1}`}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {!beforePhotosCompleted ? (
                              <Button 
                                onClick={() => handleStartJob(job)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Camera className="w-4 h-4 mr-2" />
                                Start Job
                              </Button>
                            ) : (
                              <Button 
                                onClick={() => handleEditPhotos(job)}
                                variant="outline"
                                className="border-green-300 text-green-700 hover:bg-green-50"
                                size="sm"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Photos
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ) : verificationData ? (
                <Card className="border-orange-200 bg-orange-50 h-full">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <Wrench className="w-12 h-12 mx-auto mb-4 text-orange-400" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Unlocked - Work in Progress</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Location verified! Complete the installation work, then return here to take after photos and finish the job.
                      </p>
                      <Button 
                        onClick={() => {
                          setTakingAfterPhotos(true);
                          setShowBeforeAfterCapture(true);
                          // Save to localStorage
                          saveWorkflowState({
                            takingAfterPhotos: true
                          });
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Take After Photos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-gray-200 bg-gray-50 h-full">
                  <CardContent className="p-8">
                    <div className="text-center text-gray-500">
                      <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Ready to Start</h3>
                      <p className="text-sm">
                        In-progress jobs will appear here when they're ready to begin.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: QR Scanner */}
            <div>
              <QRScanner 
                onScanSuccess={handleQRScan}
                onError={(error) => setScanError(error)}
                isLoading={verifyQRMutation.isPending || completeJobMutation.isPending}
                clearResult={clearScanner}
              />
          
          {/* Success/Error Messages */}
          {completionSuccess && (
            <Card className="mt-4 border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800">{completionSuccess}</span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {scanError && (
            <Card className="mt-4 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800">{scanError}</span>
                </div>
              </CardContent>
            </Card>
          )}
            </div>
          </div>
        </>
      )}
      
      {/* Recently Completed Jobs - Always Visible */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Recently Completed Jobs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!completedJobs || completedJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Completed Jobs Yet</h3>
              <p className="text-sm">
                Complete your first installation to see it here!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedJobs.slice(0, 5).map((job: any) => {
                const isExpanded = expandedJobId === job.id;
                const beforeAfterPhotos = job.booking?.beforeAfterPhotos || [];
                
                return (
                  <div key={job.id} className={`border rounded-lg transition-all duration-200 ${isExpanded ? 'border-blue-300 shadow-md' : 'border-gray-200'}`}>
                    {/* Main Job Summary */}
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium">{job.booking?.customerName}</div>
                          <div className="text-sm text-gray-500">{job.booking?.address}</div>
                          <div className="text-xs text-gray-400">
                            Completed: {new Date(job.completedDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">€{job.booking?.estimatedTotal}</div>
                          <div className="text-xs text-gray-500">{job.booking?.qrCode}</div>
                        </div>
                        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 p-4 bg-gray-50">
                        <div className="space-y-6">
                          {/* Job Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-900">Installation Details</h4>
                              <div className="space-y-1 text-sm">
                                <div><span className="font-medium">Customer:</span> {job.booking?.customerName}</div>
                                <div><span className="font-medium">Phone:</span> {job.booking?.phone}</div>
                                <div><span className="font-medium">Email:</span> {job.booking?.customerEmail}</div>
                                <div><span className="font-medium">Address:</span> {job.booking?.address}</div>
                                <div><span className="font-medium">Service:</span> {job.booking?.serviceDescription || 'TV Installation'}</div>
                                {job.booking?.tvInstallations?.length > 0 && (
                                  <div><span className="font-medium">TVs Installed:</span> {job.booking.tvInstallations.length} TV{job.booking.tvInstallations.length > 1 ? 's' : ''}</div>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-900">Completion Summary</h4>
                              <div className="space-y-1 text-sm">
                                <div><span className="font-medium">Completed:</span> {new Date(job.completedDate).toLocaleString()}</div>
                                <div><span className="font-medium">Booking ID:</span> {job.booking?.qrCode}</div>
                                <div><span className="font-medium">Total Value:</span> €{job.booking?.estimatedTotal}</div>
                                <div><span className="font-medium">Photos Taken:</span> {beforeAfterPhotos.length} sets</div>
                                {job.booking?.photoStars && (
                                  <div className="flex items-center space-x-1">
                                    <span className="font-medium">Photo Quality:</span>
                                    <div className="flex">
                                      {[...Array(3)].map((_, i) => (
                                        <Star 
                                          key={i} 
                                          className={`w-3 h-3 ${i < job.booking.photoStars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Before & After Photos */}
                          {beforeAfterPhotos.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="font-semibold text-gray-900">Before & After Photos</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {beforeAfterPhotos.map((photoSet: any, index: number) => {
                                  const tvLocation = job.booking?.tvInstallations?.[index]?.location || `TV ${index + 1}`;
                                  return (
                                    <div key={index} className="space-y-2">
                                      <h5 className="text-sm font-medium text-gray-700">{tvLocation}</h5>
                                      <div className="grid grid-cols-2 gap-2">
                                        {/* Before Photo */}
                                        <div className="space-y-1">
                                          <div className="text-xs font-medium text-gray-600">Before</div>
                                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                            {photoSet.beforePhoto ? (
                                              <img 
                                                src={photoSet.beforePhoto}
                                                alt={`${tvLocation} Before`}
                                                className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                                                onClick={() => window.open(photoSet.beforePhoto, '_blank')}
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Camera className="w-4 h-4" />
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* After Photo */}
                                        <div className="space-y-1">
                                          <div className="text-xs font-medium text-gray-600">After</div>
                                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                            {photoSet.afterPhoto ? (
                                              <img 
                                                src={photoSet.afterPhoto}
                                                alt={`${tvLocation} After`}
                                                className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                                                onClick={() => window.open(photoSet.afterPhoto, '_blank')}
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Camera className="w-4 h-4" />
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Room Details */}
                          {job.booking?.tvInstallations && job.booking.tvInstallations.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="font-semibold text-gray-900">Installation Rooms</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {job.booking.tvInstallations.map((tv: any, index: number) => (
                                  <div key={index} className="p-3 bg-white rounded-lg border">
                                    <div className="space-y-1 text-sm">
                                      <div><span className="font-medium">Room:</span> {tv.location}</div>
                                      <div><span className="font-medium">TV Size:</span> {tv.tvSize}"</div>
                                      <div><span className="font-medium">Mount Type:</span> {tv.mountType}</div>
                                      {tv.wallType && <div><span className="font-medium">Wall Type:</span> {tv.wallType}</div>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Gallery Showcase Toggle */}
                          <div className="pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">Gallery Showcase</h4>
                                <p className="text-sm text-gray-600">
                                  Add this installation to the public gallery to showcase your work
                                  {(!beforeAfterPhotos || beforeAfterPhotos.length === 0) && (
                                    <span className="text-orange-600"> (requires before/after photos)</span>
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center space-x-3">
                                <Switch
                                  checked={job.booking?.showcaseInGallery || false}
                                  disabled={!beforeAfterPhotos || beforeAfterPhotos.length === 0}
                                  onCheckedChange={async (checked) => {
                                    try {
                                      const response = await fetch(`/api/booking/${job.booking.id}/showcase`, {
                                        method: 'PUT',
                                        body: JSON.stringify({ showcaseInGallery: checked }),
                                        headers: { 
                                          'Content-Type': 'application/json',
                                        }
                                      });
                                      
                                      if (response.ok) {
                                        const result = await response.json();
                                        // Update the local state optimistically
                                        job.booking.showcaseInGallery = checked;
                                        
                                        toast({
                                          title: checked ? "Added to Gallery" : "Removed from Gallery",
                                          description: result.message,
                                        });
                                      } else {
                                        throw new Error('Failed to update showcase status');
                                      }
                                    } catch (error: any) {
                                      toast({
                                        title: "Error",
                                        description: error.message || "Failed to update showcase status",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                />
                                <Badge variant={job.booking?.showcaseInGallery ? "default" : "secondary"}>
                                  {job.booking?.showcaseInGallery ? "In Gallery" : "Not Showcased"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function InstallerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string>('');
  const [completionSuccess, setCompletionSuccess] = useState<string>('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [selectedLeadForPurchase, setSelectedLeadForPurchase] = useState<ClientRequest | null>(null);
  const [showMapHelp, setShowMapHelp] = useState(false);
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
  const { data: installerProfile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ["/api/installers/profile"],
    retry: false
  });

  // Fetch current user to check for admin status
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Check if current user is admin viewing installer dashboard
  const isAdminView = currentUser?.role === 'admin' || 
                      currentUser?.email === 'admin@tradesbook.ie' || 
                      currentUser?.email === 'jude.okun@gmail.com';
  
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
    queryFn: async () => {
      const res = await fetch(`/api/installer/${installerProfile?.id}/available-leads`);
      if (!res.ok) {
        console.error('Failed to fetch available leads:', res.status);
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
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
      
      // Update local stats to reflect accepted job - refresh queries to get updated data
      queryClient.invalidateQueries({ queryKey: [`/api/installer/${installerProfile?.id}/past-leads`] });
      queryClient.invalidateQueries({ queryKey: [`/api/installer/${installerProfile?.id}/reviews`] });
      
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
              // Open purchase dialog instead of showing error
              setSelectedLeadForPurchase(selectedRequest);
              setShowPurchaseDialog(true);
              return;
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
  // Handle authentication errors
  if (profileError && (profileError as any)?.status === 401) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Wrench className="h-6 w-6 text-blue-600" />
              Installer Login Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-center">
              You need to be logged in as an installer to access this dashboard.
            </p>
            <div className="space-y-2">
              <Link href="/installer-login">
                <Button className="w-full" size="lg">
                  <User className="h-4 w-4 mr-2" />
                  Sign in as Installer
                </Button>
              </Link>
              <Link href="/installer-registration">
                <Button variant="outline" className="w-full" size="lg">
                  Register as New Installer
                </Button>
              </Link>
            </div>
            <div className="pt-4 border-t">
              <Link href="/">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  // Toggle function for request selection
  const handleRequestToggle = (request: ClientRequest) => {
    if (selectedRequest?.id === request.id) {
      // If the same request is clicked, deselect it
      setSelectedRequest(null);
    } else {
      // Otherwise, select the new request
      setSelectedRequest(request);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 relative">
      {/* Navigation */}
      <Navigation isInstallerContext={true} installerProfile={installerProfile} />
      
      {/* Installer Dashboard Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-0 sm:h-16 gap-3 sm:gap-0">
            <div className="flex items-center space-x-3">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Installer Dashboard</h1>
              {isAdminView && (
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                  Admin View
                </Badge>
              )}
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
              
              {isAdminView && (
                <Button variant="ghost" size="sm" onClick={() => window.location.href = '/admin'}>
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Back to Admin</span>
                </Button>
              )}
              
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/installer-login'}>
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        <Tabs defaultValue="requests" className="w-full">
          {/* Mobile-first responsive tabs */}
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 mb-6 h-auto p-1">
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
            <TabsTrigger value="active-jobs" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 text-xs sm:text-sm">
              <Wrench className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Active Jobs</span>
              <span className="sm:hidden">Jobs</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 text-xs sm:text-sm">
              <Star className="w-4 h-4 flex-shrink-0" />
              <span>Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 text-xs sm:text-sm">
              <Euro className="w-4 h-4 flex-shrink-0" />
              <span className="hidden lg:inline">Wallet & Credits</span>
              <span className="lg:hidden">Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="job-completion" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 text-xs sm:text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span className="hidden lg:inline">Job Completion</span>
              <span className="lg:hidden">Complete</span>
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
                      <Euro className="w-8 h-8 text-green-600" />
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

            {/* Admin Promotion Banner */}
            <AdminPromotionBanner installerId={installerProfile?.id} />
            
            {/* Voucher Status Display */}
            <VoucherStatus installerId={installerProfile?.id} />

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

            {/* No Requests State - Show Before Main Content */}
            {availableRequests.length === 0 && !requestsLoading ? (
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
            ) : (
              /* Main Content - Only show when there are requests */
              <>
                {viewMode === 'map' ? (
                  <div className="space-y-6">
                    {/* Desktop Layout */}
                    <div className="hidden lg:grid lg:grid-cols-3 gap-6">
                      {/* Map */}
                      <div className="lg:col-span-2">
                        <div className="h-[600px] relative z-0">
                          <IrelandMap 
                            requests={availableRequests}
                            onRequestSelect={handleRequestToggle}
                            selectedRequest={selectedRequest || undefined}
                            className="h-full"
                          />
                        </div>
                        
                        {/* Map Instructions - Collapsible */}
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-1 bg-blue-100 rounded-lg">
                                <Info className="w-4 h-4 text-blue-600" />
                              </div>
                              <h4 className="font-medium text-blue-900">How to use the map</h4>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowMapHelp(!showMapHelp)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 p-1"
                            >
                              {showMapHelp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </div>
                          {showMapHelp && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <ul className="text-blue-700 text-sm space-y-1">
                                <li>• Click on any marker to view lead details and select it</li>
                                <li>• Use the control buttons to fit all leads or reset the view</li>
                                <li>• Larger markers indicate higher priority or urgent requests</li>
                                <li>• Selected leads are highlighted and show detailed information below</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Selected Request Details - Desktop */}
                      <div className="space-y-4">
                        {selectedRequest ? (
                          <RequestCard
                            request={selectedRequest}
                            onAccept={handleAcceptRequest}
                            onDecline={handleDeclineRequest}
                            distance={selectedRequest.distance}
                          />
                        ) : (
                          <Card className="h-full flex items-center justify-center min-h-[200px]">
                            <CardContent className="text-center p-6">
                              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500">Select a request on the map to view details</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="lg:hidden space-y-6">
                      {/* Mobile Map Instructions - Only when no request selected */}
                      {!selectedRequest && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-blue-900 text-sm">Tap any marker to view lead details</span>
                          </div>
                          <p className="text-blue-700 text-xs">Use control buttons to fit all leads or reset view</p>
                        </div>
                      )}
                      
                      {/* Map Section */}
                      <div className="h-[85vh] sm:h-[500px] relative z-0 mb-4 rounded-lg overflow-hidden border border-gray-200">
                        <IrelandMap 
                          requests={availableRequests}
                          onRequestSelect={handleRequestToggle}
                          selectedRequest={selectedRequest || undefined}
                          className="h-full w-full"
                        />
                      </div>
                      
                      {/* Lead Details Section - Always positioned below map */}
                      <div className="relative z-10 bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
                        {selectedRequest ? (
                          /* Show only selected lead */
                          <div className="space-y-4">
                            <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                Selected Lead Details
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">Tap the lead again on the map to see all leads</p>
                            </div>
                            <RequestCard
                              request={selectedRequest}
                              onAccept={handleAcceptRequest}
                              onDecline={handleDeclineRequest}
                              distance={selectedRequest.distance}
                            />
                          </div>
                        ) : (
                          /* Show all leads when none selected */
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-semibold text-gray-900">Available Leads</h3>
                              <Badge variant="secondary" className="text-xs">{availableRequests.length} leads</Badge>
                            </div>
                            <div className="space-y-4">
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
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* List View */
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 relative z-0 mb-8">
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
              </>
            )}
          </TabsContent>

          <TabsContent value="past-leads" className="space-y-6">
            <PastLeadsManagement installerId={installerProfile?.id} />
          </TabsContent>

          <TabsContent value="active-jobs" className="space-y-6">
            <ActiveJobsSection installerId={installerProfile?.id} />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <InstallerReviews installerId={installerProfile?.id} />
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            {installerProfile && (
              <InstallerWalletDashboard installerId={installerProfile.id} />
            )}
          </TabsContent>

          <TabsContent value="job-completion" className="space-y-6">
            <JobCompletionSection installerId={installerProfile?.id} />
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-50" aria-describedby="profile-dialog-description">
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

      {/* Lead Purchase Dialog */}
      <LeadPurchaseDialog
        lead={selectedLeadForPurchase}
        installerId={installerProfile?.id || 0}
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        onPurchaseSuccess={() => {
          // Refresh all relevant data
          queryClient.invalidateQueries({ queryKey: ['/api/installer', installerProfile?.id, 'available-leads'] });
          queryClient.invalidateQueries({ queryKey: ['/api/installer', installerProfile?.id, 'stats'] });
          queryClient.invalidateQueries({ queryKey: [`/api/installer/${installerProfile?.id}/wallet`] });
          setSelectedLeadForPurchase(null);
          setSelectedRequest(null);
        }}
      />

    </div>
  );
}

// StartWorkButton Component
function StartWorkButton({ 
  bookingId, 
  installerId, 
  customerName, 
  onStatusUpdated 
}: { 
  bookingId: number;
  installerId: number;
  customerName: string;
  onStatusUpdated: () => void;
}) {
  const { toast } = useToast();
  
  const startWorkMutation = useMutation({
    mutationFn: async () => {
      // Find the job assignment for this booking and installer
      try {
        const response = await apiRequest('GET', `/api/installer/${installerId}/job-assignments`);
        const jobAssignments = await response.json();
        
        // Check if response is an array
        if (!Array.isArray(jobAssignments)) {
          throw new Error('Failed to fetch job assignments - invalid response format');
        }
        
        const jobAssignment = jobAssignments.find((job: any) => job.bookingId === bookingId);
        
        if (!jobAssignment) {
          throw new Error('Job assignment not found');
        }
        
        // Update job status to in_progress
        const updateResponse = await apiRequest('POST', `/api/installer/update-job-status/${jobAssignment.id}`, {
          status: 'in_progress'
        });
        return updateResponse;
      } catch (error: any) {
        // Provide more specific error messages
        if (error.message?.includes('Not authenticated')) {
          throw new Error('Authentication required - please refresh the page and try again');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Work Started",
        description: `You've started working on ${customerName}'s installation. The job is now active.`,
      });
      onStatusUpdated();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Start Work",
        description: error.message || 'Unable to start work on this job',
        variant: "destructive",
      });
    }
  });

  return (
    <Button
      onClick={() => startWorkMutation.mutate()}
      disabled={startWorkMutation.isPending}
      className="bg-yellow-600 hover:bg-yellow-700 text-white"
    >
      {startWorkMutation.isPending ? (
        <>
          <Clock className="w-4 h-4 mr-2 animate-spin" />
          Starting...
        </>
      ) : (
        <>
          <Play className="w-4 h-4 mr-2" />
          Start Work
        </>
      )}
    </Button>
  );
}