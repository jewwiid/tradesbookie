import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, MapPin, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LocationCoordinates {
  lat: number;
  lng: number;
}

interface MapMarker {
  location: LocationCoordinates;
  color?: string;
  label?: string;
}

interface StaticMapImageProps {
  center: LocationCoordinates;
  zoom?: number;
  size?: { width: number; height: number };
  markers?: MapMarker[];
  mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
  className?: string;
  alt?: string;
  customerAddress?: string;
  installerLocation?: LocationCoordinates;
}

// Component for displaying static map images (useful for emails, reports, etc.)
export default function StaticMapImage({
  center,
  zoom = 15,
  size = { width: 600, height: 400 },
  markers = [],
  mapType = 'roadmap',
  className = '',
  alt = 'Map location',
  customerAddress,
  installerLocation
}: StaticMapImageProps) {
  // Query for generating static map URL
  const { data: mapData, isLoading, error } = useQuery({
    queryKey: ['static-map', center, zoom, size, markers, mapType, customerAddress, installerLocation],
    queryFn: async () => {
      if (customerAddress) {
        // Use booking map endpoint for customer/installer scenario
        return apiRequest('/api/maps/booking-map', {
          method: 'POST',
          body: JSON.stringify({
            customerAddress,
            installerLocation
          }),
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // Use regular static map endpoint
        return apiRequest('/api/maps/static-map', {
          method: 'POST',
          body: JSON.stringify({
            center,
            zoom,
            size,
            markers,
            mapType
          }),
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    enabled: !!(center.lat && center.lng),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Generating map...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load map image. Please check the location details.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const mapUrl = customerAddress ? mapData?.mapUrl : mapData?.mapUrl;

  if (!mapUrl) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-2 text-gray-500">
            <MapPin className="h-5 w-5" />
            <span>Map not available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <img
        src={mapUrl}
        alt={alt}
        className="w-full h-auto rounded-lg shadow-sm border"
        loading="lazy"
        onError={(e) => {
          // Fallback handling
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <Card className="hidden">
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-2 text-gray-500">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load map image</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for generating map URLs programmatically
export function useStaticMapUrl(options: {
  center: LocationCoordinates;
  zoom?: number;
  size?: { width: number; height: number };
  markers?: MapMarker[];
  mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
}) {
  return useQuery({
    queryKey: ['static-map-url', options],
    queryFn: async () => {
      const response = await apiRequest('/api/maps/static-map', {
        method: 'POST',
        body: JSON.stringify(options),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.mapUrl;
    },
    enabled: !!(options.center.lat && options.center.lng),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for generating booking map URLs
export function useBookingMapUrl(customerAddress: string, installerLocation?: LocationCoordinates) {
  return useQuery({
    queryKey: ['booking-map-url', customerAddress, installerLocation],
    queryFn: async () => {
      const response = await apiRequest('/api/maps/booking-map', {
        method: 'POST',
        body: JSON.stringify({
          customerAddress,
          installerLocation
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.mapUrl;
    },
    enabled: !!customerAddress,
    staleTime: 5 * 60 * 1000,
  });
}