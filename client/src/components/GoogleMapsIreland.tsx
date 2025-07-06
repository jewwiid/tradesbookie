import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, Euro, Tv } from 'lucide-react';

interface Installation {
  id: number;
  address: string;
  county: string;
  lat: number;
  lng: number;
  serviceType: string;
  totalPrice: string;
  status: string;
  createdAt: string;
  tvSize: string;
}

interface GoogleMapsIrelandProps {
  installations: Installation[];
  isLoading?: boolean;
  showLegend?: boolean;
  height?: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function GoogleMapsIreland({ 
  installations, 
  isLoading = false, 
  showLegend = true,
  height = "500px"
}: GoogleMapsIrelandProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);

  // Ireland center coordinates
  const irelandCenter = { lat: 53.4129, lng: -8.2439 };

  // Load Google Maps script
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsMapLoaded(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !window.google) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: irelandCenter,
      zoom: 6.5,
      styles: [
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
        },
        {
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [{ color: '#f5f5f5' }, { lightness: 20 }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.fill',
          stylers: [{ color: '#ffffff' }, { lightness: 17 }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#ffffff' }, { lightness: 29 }, { weight: 0.2 }]
        },
        {
          featureType: 'road.arterial',
          elementType: 'geometry',
          stylers: [{ color: '#ffffff' }, { lightness: 18 }]
        },
        {
          featureType: 'road.local',
          elementType: 'geometry',
          stylers: [{ color: '#ffffff' }, { lightness: 16 }]
        },
        {
          featureType: 'poi',
          elementType: 'geometry',
          stylers: [{ color: '#f5f5f5' }, { lightness: 21 }]
        },
        {
          featureType: 'poi.park',
          elementType: 'geometry',
          stylers: [{ color: '#dedede' }, { lightness: 21 }]
        },
        {
          elementType: 'labels.text.stroke',
          stylers: [{ visibility: 'on' }, { color: '#ffffff' }, { lightness: 16 }]
        },
        {
          elementType: 'labels.text.fill',
          stylers: [{ saturation: 36 }, { color: '#333333' }, { lightness: 40 }]
        },
        {
          elementType: 'labels.icon',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit',
          elementType: 'geometry',
          stylers: [{ color: '#f2f2f2' }, { lightness: 19 }]
        },
        {
          featureType: 'administrative',
          elementType: 'geometry.fill',
          stylers: [{ color: '#fefefe' }, { lightness: 20 }]
        },
        {
          featureType: 'administrative',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#fefefe' }, { lightness: 17 }, { weight: 1.2 }]
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      restriction: {
        latLngBounds: {
          north: 55.5,
          south: 51.0,
          east: -5.5,
          west: -11.0
        },
        strictBounds: false
      }
    });

    setMap(mapInstance);
  }, [isMapLoaded]);

  // Add markers when installations data changes
  useEffect(() => {
    if (!map || !installations.length) return;

    // Clear existing markers
    const markers: any[] = [];
    const infoWindows: any[] = [];

    installations.forEach((installation) => {
      const marker = new window.google.maps.Marker({
        position: { lat: installation.lat, lng: installation.lng },
        map: map,
        title: `${installation.address} - ${installation.serviceType}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: getMarkerColor(installation.serviceType),
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 300px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
              ${installation.address}
            </h3>
            <div style="margin-bottom: 6px;">
              <span style="font-weight: 500;">Service:</span> ${installation.serviceType}
            </div>
            <div style="margin-bottom: 6px;">
              <span style="font-weight: 500;">TV Size:</span> ${installation.tvSize}
            </div>
            <div style="margin-bottom: 6px;">
              <span style="font-weight: 500;">Price:</span> €${installation.totalPrice}
            </div>
            <div style="margin-bottom: 6px;">
              <span style="font-weight: 500;">Status:</span> 
              <span style="color: ${getStatusColor(installation.status)}; font-weight: 500;">
                ${installation.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div style="font-size: 12px; color: #666;">
              ${new Date(installation.createdAt).toLocaleDateString()}
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        // Close all other info windows
        infoWindows.forEach(iw => iw.close());
        infoWindow.open(map, marker);
        setSelectedInstallation(installation);
      });

      markers.push(marker);
      infoWindows.push(infoWindow);
    });

    // Cleanup function
    return () => {
      markers.forEach(marker => marker.setMap(null));
      infoWindows.forEach(infoWindow => infoWindow.close());
    };
  }, [map, installations]);

  const getMarkerColor = (serviceType: string) => {
    switch (serviceType.toLowerCase()) {
      case 'table-top':
      case 'table-top-small':
        return '#3b82f6'; // Blue
      case 'bronze':
        return '#f59e0b'; // Amber
      case 'silver':
        return '#6b7280'; // Gray
      case 'gold':
        return '#fbbf24'; // Yellow
      default:
        return '#10b981'; // Green
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#10b981'; // Green
      case 'in_progress':
        return '#f59e0b'; // Amber
      case 'pending':
        return '#3b82f6'; // Blue
      case 'cancelled':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const getServiceTypeStats = () => {
    const stats = installations.reduce((acc, installation) => {
      const type = installation.serviceType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stats).map(([type, count]) => ({
      type,
      count,
      color: getMarkerColor(type)
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Installation Coverage Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height }}>
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Installation Coverage Map - Ireland
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={mapRef}
            style={{ height, width: '100%' }}
            className="rounded-lg border"
          />
        </CardContent>
      </Card>

      {showLegend && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getServiceTypeStats().map(({ type, count, color }) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm capitalize">{type.replace('-', ' ')}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Installation Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Installations</span>
                  <Badge variant="outline">{installations.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Counties Covered</span>
                  <Badge variant="outline">
                    {new Set(installations.map(i => i.county)).size}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <Badge variant="outline">
                    €{installations.reduce((sum, i) => sum + parseFloat(i.totalPrice), 0).toFixed(2)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedInstallation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selected Installation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Location Details</h4>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Address:</strong> {selectedInstallation.address}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>County:</strong> {selectedInstallation.county}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Service Details</h4>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Service:</strong> {selectedInstallation.serviceType}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>TV Size:</strong> {selectedInstallation.tvSize}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Price:</strong> €{selectedInstallation.totalPrice}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Date:</strong> {new Date(selectedInstallation.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}