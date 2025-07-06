import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  county?: string;
}

// Irish counties mapping for better geocoding
const IRISH_COUNTIES = [
  'Dublin', 'Cork', 'Galway', 'Kerry', 'Mayo', 'Donegal', 'Tipperary',
  'Antrim', 'Limerick', 'Derry', 'Wexford', 'Kilkenny', 'Waterford',
  'Clare', 'Tyrone', 'Down', 'Westmeath', 'Meath', 'Kildare', 'Wicklow',
  'Offaly', 'Cavan', 'Laois', 'Sligo', 'Fermanagh', 'Armagh', 'Monaghan',
  'Roscommon', 'Louth', 'Carlow', 'Longford', 'Leitrim'
];

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY not configured');
      return null;
    }

    // Ensure address includes Ireland for better geocoding
    const searchAddress = address.includes('Ireland') ? address : `${address}, Ireland`;

    const response = await client.geocode({
      params: {
        address: searchAddress,
        key: apiKey,
        region: 'ie', // Ireland region bias
        components: 'country:IE' // Restrict to Ireland only
      }
    });

    if (response.data.results.length === 0) {
      console.log(`No geocoding results for address: ${address}`);
      return null;
    }

    const result = response.data.results[0];
    const location = result.geometry.location;

    // Extract county from address components
    let county: string | undefined;
    const addressComponents = result.address_components;
    
    for (const component of addressComponents) {
      if (component.types.includes('administrative_area_level_1')) {
        county = component.long_name;
        break;
      }
    }

    // If no county found in components, try to extract from formatted address
    if (!county) {
      const formattedAddress = result.formatted_address;
      county = IRISH_COUNTIES.find(c => 
        formattedAddress.toLowerCase().includes(c.toLowerCase())
      );
    }

    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: result.formatted_address,
      county: county || 'Unknown'
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export async function geocodeMultipleAddresses(addresses: string[]): Promise<Map<string, GeocodeResult>> {
  const results = new Map<string, GeocodeResult>();
  
  // Process in batches to avoid rate limiting
  const batchSize = 10;
  
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    
    const promises = batch.map(async (address) => {
      const result = await geocodeAddress(address);
      if (result) {
        results.set(address, result);
      }
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    await Promise.all(promises);
    
    // Larger delay between batches
    if (i + batchSize < addresses.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// Common Irish locations with coordinates for fallback
export const IRISH_LOCATION_FALLBACKS: Record<string, GeocodeResult> = {
  'Dublin': { lat: 53.3441, lng: -6.2675, formattedAddress: 'Dublin, Ireland', county: 'Dublin' },
  'Cork': { lat: 51.8985, lng: -8.4756, formattedAddress: 'Cork, Ireland', county: 'Cork' },
  'Galway': { lat: 53.2707, lng: -9.0568, formattedAddress: 'Galway, Ireland', county: 'Galway' },
  'Limerick': { lat: 52.6638, lng: -8.6267, formattedAddress: 'Limerick, Ireland', county: 'Limerick' },
  'Waterford': { lat: 52.2593, lng: -7.1101, formattedAddress: 'Waterford, Ireland', county: 'Waterford' },
  'Kilkenny': { lat: 52.6541, lng: -7.2448, formattedAddress: 'Kilkenny, Ireland', county: 'Kilkenny' },
  'Wexford': { lat: 52.3369, lng: -6.4633, formattedAddress: 'Wexford, Ireland', county: 'Wexford' },
  'Carlow': { lat: 52.8417, lng: -6.9264, formattedAddress: 'Carlow, Ireland', county: 'Carlow' },
  'Laois': { lat: 53.0344, lng: -7.3016, formattedAddress: 'Portlaoise, Co. Laois, Ireland', county: 'Laois' },
  'Kildare': { lat: 53.1639, lng: -6.9113, formattedAddress: 'Kildare, Ireland', county: 'Kildare' },
  'Meath': { lat: 53.6548, lng: -6.6978, formattedAddress: 'Navan, Co. Meath, Ireland', county: 'Meath' },
  'Louth': { lat: 53.8578, lng: -6.3981, formattedAddress: 'Drogheda, Co. Louth, Ireland', county: 'Louth' },
  'Monaghan': { lat: 54.2489, lng: -6.9683, formattedAddress: 'Monaghan, Ireland', county: 'Monaghan' },
  'Cavan': { lat: 53.9909, lng: -7.3609, formattedAddress: 'Cavan, Ireland', county: 'Cavan' },
  'Longford': { lat: 53.7236, lng: -7.7929, formattedAddress: 'Longford, Ireland', county: 'Longford' },
  'Westmeath': { lat: 53.5232, lng: -7.3430, formattedAddress: 'Athlone, Co. Westmeath, Ireland', county: 'Westmeath' },
  'Offaly': { lat: 53.2738, lng: -7.4901, formattedAddress: 'Tullamore, Co. Offaly, Ireland', county: 'Offaly' },
  'Clare': { lat: 52.8454, lng: -8.9831, formattedAddress: 'Ennis, Co. Clare, Ireland', county: 'Clare' },
  'Kerry': { lat: 52.1602, lng: -9.5238, formattedAddress: 'Killarney, Co. Kerry, Ireland', county: 'Kerry' },
  'Tipperary': { lat: 52.4731, lng: -8.1600, formattedAddress: 'Clonmel, Co. Tipperary, Ireland', county: 'Tipperary' },
  'Roscommon': { lat: 53.6279, lng: -8.1951, formattedAddress: 'Roscommon, Ireland', county: 'Roscommon' },
  'Sligo': { lat: 54.2766, lng: -8.4761, formattedAddress: 'Sligo, Ireland', county: 'Sligo' },
  'Leitrim': { lat: 54.0667, lng: -7.8833, formattedAddress: 'Carrick-on-Shannon, Co. Leitrim, Ireland', county: 'Leitrim' },
  'Mayo': { lat: 53.8547, lng: -9.2977, formattedAddress: 'Castlebar, Co. Mayo, Ireland', county: 'Mayo' },
  'Donegal': { lat: 54.6572, lng: -8.1104, formattedAddress: 'Letterkenny, Co. Donegal, Ireland', county: 'Donegal' },
  'Wicklow': { lat: 52.9804, lng: -6.0437, formattedAddress: 'Wicklow, Ireland', county: 'Wicklow' }
};

export function getFallbackLocation(address: string): GeocodeResult | null {
  const addressLower = address.toLowerCase();
  
  for (const [county, location] of Object.entries(IRISH_LOCATION_FALLBACKS)) {
    if (addressLower.includes(county.toLowerCase())) {
      return location;
    }
  }
  
  return null;
}