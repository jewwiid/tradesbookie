import { Client } from '@googlemaps/google-maps-services-js';

const googleMapsClient = new Client({});

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface AddressGeocodeResult {
  coordinates: LocationCoordinates;
  formattedAddress: string;
  components: {
    county?: string;
    country?: string;
    postalCode?: string;
  };
}

export interface StaticMapOptions {
  center: LocationCoordinates;
  zoom?: number;
  size?: { width: number; height: number };
  markers?: Array<{
    location: LocationCoordinates;
    color?: string;
    label?: string;
  }>;
  mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
}

/**
 * Geocode an address to get coordinates and formatted address
 */
export async function geocodeAddress(address: string): Promise<AddressGeocodeResult | null> {
  try {
    const response = await googleMapsClient.geocode({
      params: {
        address: address,
        key: process.env.GOOGLE_MAPS_API_KEY!,
        region: 'ie', // Bias results towards Ireland
      },
    });

    if (response.data.results.length === 0) {
      return null;
    }

    const result = response.data.results[0];
    const location = result.geometry.location;

    // Extract address components
    const components = result.address_components;
    let county = '';
    let country = '';
    let postalCode = '';

    components.forEach(component => {
      if (component.types.includes('administrative_area_level_1' as any)) {
        county = component.long_name;
      }
      if (component.types.includes('country' as any)) {
        country = component.long_name;
      }
      if (component.types.includes('postal_code' as any)) {
        postalCode = component.long_name;
      }
    });

    return {
      coordinates: {
        lat: location.lat,
        lng: location.lng,
      },
      formattedAddress: result.formatted_address,
      components: {
        county,
        country,
        postalCode,
      },
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Generate a static map image URL
 */
export function generateStaticMapUrl(options: StaticMapOptions): string {
  const {
    center,
    zoom = 15,
    size = { width: 600, height: 400 },
    markers = [],
    mapType = 'roadmap',
  } = options;

  const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
  const params = new URLSearchParams({
    center: `${center.lat},${center.lng}`,
    zoom: zoom.toString(),
    size: `${size.width}x${size.height}`,
    maptype: mapType,
    key: process.env.GOOGLE_MAPS_API_KEY!,
  });

  // Add markers
  markers.forEach((marker, index) => {
    const markerParam = `color:${marker.color || 'red'}|label:${marker.label || (index + 1).toString()}|${marker.location.lat},${marker.location.lng}`;
    params.append('markers', markerParam);
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Calculate distance between two coordinates (in kilometers)
 */
export function calculateDistance(
  point1: LocationCoordinates,
  point2: LocationCoordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
    Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get coordinates for multiple addresses (batch geocoding)
 */
export async function batchGeocodeAddresses(
  addresses: string[]
): Promise<Array<{ address: string; result: AddressGeocodeResult | null }>> {
  const results = [];
  
  for (const address of addresses) {
    const result = await geocodeAddress(address);
    results.push({ address, result });
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

/**
 * Find nearby installers based on location
 */
export async function findNearbyInstallers(
  customerLocation: LocationCoordinates,
  installerLocations: Array<{ id: number; location: LocationCoordinates; serviceArea: string[] }>
): Promise<Array<{ installerId: number; distance: number }>> {
  const nearby = installerLocations
    .map(installer => ({
      installerId: installer.id,
      distance: calculateDistance(customerLocation, installer.location),
    }))
    .sort((a, b) => a.distance - b.distance)
    .filter(installer => installer.distance <= 50); // Within 50km

  return nearby;
}

/**
 * Generate map image for email templates
 */
export async function generateBookingMapImage(
  customerAddress: string,
  installerLocation?: LocationCoordinates
): Promise<string | null> {
  try {
    const geocoded = await geocodeAddress(customerAddress);
    if (!geocoded) return null;

    const markers = [
      {
        location: geocoded.coordinates,
        color: 'blue',
        label: 'C', // Customer
      },
    ];

    if (installerLocation) {
      markers.push({
        location: installerLocation,
        color: 'green',
        label: 'I', // Installer
      });
    }

    return generateStaticMapUrl({
      center: geocoded.coordinates,
      zoom: installerLocation ? 12 : 15,
      size: { width: 600, height: 300 },
      markers,
    });
  } catch (error) {
    console.error('Error generating booking map image:', error);
    return null;
  }
}

/**
 * Validate if address is within Ireland
 */
export async function validateIrishAddress(address: string): Promise<boolean> {
  try {
    const result = await geocodeAddress(address);
    if (!result) return false;
    
    return result.components.country === 'Ireland' || 
           result.formattedAddress.toLowerCase().includes('ireland');
  } catch (error) {
    console.error('Error validating Irish address:', error);
    return false;
  }
}