import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LocationCoordinates {
  lat: number;
  lng: number;
}

interface MapMarker {
  location: LocationCoordinates;
  color?: string;
  label?: string;
  title?: string;
  info?: string;
}

interface GoogleMapProps {
  center?: LocationCoordinates;
  zoom?: number;
  markers?: MapMarker[];
  onLocationSelect?: (location: LocationCoordinates) => void;
  className?: string;
  height?: string;
  showControls?: boolean;
  enableAddressSearch?: boolean;
  customerAddress?: string;
  installerLocations?: Array<{
    id: number;
    name: string;
    location: LocationCoordinates;
    distance?: number;
  }>;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

// Google Maps component for displaying interactive maps
export default function GoogleMap({
  center = { lat: 53.3498, lng: -6.2603 }, // Default to Dublin
  zoom = 10,
  markers = [],
  onLocationSelect,
  className = "w-full",
  height = "400px",
  showControls = true,
  enableAddressSearch = false,
  customerAddress,
  installerLocations = []
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(customerAddress || '');
  const [geocodedLocation, setGeocodedLocation] = useState<LocationCoordinates | null>(null);
  const queryClient = useQueryClient();

  // Geocoding mutation
  const geocodeMutation = useMutation({
    mutationFn: async (address: string) => {
      return apiRequest('/api/maps/geocode', {
        method: 'POST',
        body: JSON.stringify({ address }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (data) => {
      setGeocodedLocation(data.coordinates);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(data.coordinates);
        mapInstanceRef.current.setZoom(15);
        
        // Add marker for geocoded location
        new window.google.maps.Marker({
          position: data.coordinates,
          map: mapInstanceRef.current,
          title: data.formattedAddress,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3B82F6"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(24, 24)
          }
        });
      }
    }
  });

  // Distance calculation mutation
  const distanceMutation = useMutation({
    mutationFn: async ({ point1, point2 }: { point1: LocationCoordinates; point2: LocationCoordinates }) => {
      return apiRequest('/api/maps/distance', {
        method: 'POST',
        body: JSON.stringify({ point1, point2 }),
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      mapTypeControl: showControls,
      streetViewControl: showControls,
      fullscreenControl: showControls,
    });

    // Add click listener for location selection
    if (onLocationSelect) {
      mapInstanceRef.current.addListener('click', (event: any) => {
        const location = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        onLocationSelect(location);
      });
    }
  }, [isLoaded, center, zoom, onLocationSelect, showControls]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    // Clear existing markers
    // (In a production app, you'd want to track markers to remove them properly)

    // Add new markers
    markers.forEach((marker, index) => {
      const googleMarker = new window.google.maps.Marker({
        position: marker.location,
        map: mapInstanceRef.current,
        title: marker.title || `Marker ${index + 1}`,
        icon: marker.color ? {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${marker.color}"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
              ${marker.label ? `<text x="12" y="13" text-anchor="middle" fill="white" font-size="8" font-weight="bold">${marker.label}</text>` : ''}
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(24, 24)
        } : undefined
      });

      if (marker.info) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: marker.info
        });

        googleMarker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, googleMarker);
        });
      }
    });
  }, [markers, isLoaded]);

  // Add installer locations
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded || !installerLocations.length) return;

    installerLocations.forEach((installer, index) => {
      const marker = new window.google.maps.Marker({
        position: installer.location,
        map: mapInstanceRef.current,
        title: installer.name,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="15" fill="#10B981" stroke="white" stroke-width="2"/>
              <path d="M16 8C13.79 8 12 9.79 12 12C12 15.5 16 20 16 20S20 15.5 20 12C20 9.79 18.21 8 16 8Z" fill="white"/>
              <circle cx="16" cy="12" r="2" fill="#10B981"/>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold text-sm">${installer.name}</h3>
            ${installer.distance ? `<p class="text-xs text-gray-600">${installer.distance}km away</p>` : ''}
            <p class="text-xs text-blue-600 mt-1">Available for installation</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
      });
    });
  }, [installerLocations, isLoaded]);

  const handleAddressSearch = () => {
    if (selectedAddress.trim()) {
      geocodeMutation.mutate(selectedAddress);
    }
  };

  const calculateDistanceForInstallers = () => {
    if (!geocodedLocation || !installerLocations.length) return;

    installerLocations.forEach(installer => {
      distanceMutation.mutate({
        point1: geocodedLocation,
        point2: installer.location
      });
    });
  };

  if (!isLoaded) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading map...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {enableAddressSearch && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Address Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <input
                type="text"
                value={selectedAddress}
                onChange={(e) => setSelectedAddress(e.target.value)}
                placeholder="Enter address to search..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
              />
              <Button 
                onClick={handleAddressSearch}
                disabled={geocodeMutation.isPending}
                className="flex items-center space-x-2"
              >
                {geocodeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                <span>Search</span>
              </Button>
            </div>
            {geocodedLocation && (
              <div className="mt-2 flex items-center space-x-2">
                <Badge variant="outline">
                  Location found: {geocodedLocation.lat.toFixed(4)}, {geocodedLocation.lng.toFixed(4)}
                </Badge>
                {installerLocations.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={calculateDistanceForInstallers}
                    disabled={distanceMutation.isPending}
                  >
                    Calculate Distances
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardContent className="p-0">
          <div
            ref={mapRef}
            style={{ height }}
            className="w-full rounded-lg"
          />
        </CardContent>
      </Card>

      {installerLocations.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Nearby Installers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {installerLocations.map((installer) => (
                <div key={installer.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">{installer.name}</span>
                    {installer.distance && (
                      <span className="text-sm text-gray-600 ml-2">
                        {installer.distance}km away
                      </span>
                    )}
                  </div>
                  <Badge variant="secondary">Available</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}