export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  county?: string;
  city?: string;
}

// Irish counties mapping for better geocoding
const IRISH_COUNTIES = [
  'Dublin', 'Cork', 'Galway', 'Kerry', 'Mayo', 'Donegal', 'Tipperary',
  'Antrim', 'Limerick', 'Derry', 'Wexford', 'Kilkenny', 'Waterford',
  'Clare', 'Tyrone', 'Down', 'Westmeath', 'Meath', 'Kildare', 'Wicklow',
  'Offaly', 'Cavan', 'Laois', 'Sligo', 'Fermanagh', 'Armagh', 'Monaghan',
  'Roscommon', 'Louth', 'Carlow', 'Longford', 'Leitrim'
];

// Enhanced city/town level coordinates for better accuracy
const IRISH_CITIES_TOWNS: Record<string, GeocodeResult> = {
  // Dublin area
  'dublin': { lat: 53.3441, lng: -6.2675, formattedAddress: 'Dublin, Ireland', county: 'Dublin', city: 'Dublin' },
  'blanchardstown': { lat: 53.3928, lng: -6.3764, formattedAddress: 'Blanchardstown, Dublin, Ireland', county: 'Dublin', city: 'Blanchardstown' },
  'tallaght': { lat: 53.2859, lng: -6.3733, formattedAddress: 'Tallaght, Dublin, Ireland', county: 'Dublin', city: 'Tallaght' },
  'swords': { lat: 53.4597, lng: -6.2178, formattedAddress: 'Swords, Dublin, Ireland', county: 'Dublin', city: 'Swords' },
  'dun laoghaire': { lat: 53.2936, lng: -6.1347, formattedAddress: 'Dún Laoghaire, Dublin, Ireland', county: 'Dublin', city: 'Dún Laoghaire' },
  'rathmines': { lat: 53.3258, lng: -6.2594, formattedAddress: 'Rathmines, Dublin, Ireland', county: 'Dublin', city: 'Rathmines' },
  'ballymun': { lat: 53.3956, lng: -6.2642, formattedAddress: 'Ballymun, Dublin, Ireland', county: 'Dublin', city: 'Ballymun' },
  'rathfarnham': { lat: 53.2925, lng: -6.2794, formattedAddress: 'Rathfarnham, Dublin, Ireland', county: 'Dublin', city: 'Rathfarnham' },
  
  // Cork area
  'cork': { lat: 51.8985, lng: -8.4756, formattedAddress: 'Cork, Ireland', county: 'Cork', city: 'Cork' },
  'carrigaline': { lat: 51.8139, lng: -8.3989, formattedAddress: 'Carrigaline, Cork, Ireland', county: 'Cork', city: 'Carrigaline' },
  'little island': { lat: 51.9028, lng: -8.3467, formattedAddress: 'Little Island, Cork, Ireland', county: 'Cork', city: 'Little Island' },
  
  // Galway area
  'galway': { lat: 53.2707, lng: -9.0568, formattedAddress: 'Galway, Ireland', county: 'Galway', city: 'Galway' },
  'tuam': { lat: 53.5147, lng: -8.8564, formattedAddress: 'Tuam, Galway, Ireland', county: 'Galway', city: 'Tuam' },
  'athenry': { lat: 53.2983, lng: -8.7439, formattedAddress: 'Athenry, Galway, Ireland', county: 'Galway', city: 'Athenry' },
  
  // Other major cities/towns
  'limerick': { lat: 52.6638, lng: -8.6267, formattedAddress: 'Limerick, Ireland', county: 'Limerick', city: 'Limerick' },
  'waterford': { lat: 52.2593, lng: -7.1101, formattedAddress: 'Waterford, Ireland', county: 'Waterford', city: 'Waterford' },
  'kilkenny': { lat: 52.6541, lng: -7.2448, formattedAddress: 'Kilkenny, Ireland', county: 'Kilkenny', city: 'Kilkenny' },
  'wexford': { lat: 52.3369, lng: -6.4633, formattedAddress: 'Wexford, Ireland', county: 'Wexford', city: 'Wexford' },
  'sligo': { lat: 54.2766, lng: -8.4761, formattedAddress: 'Sligo, Ireland', county: 'Sligo', city: 'Sligo' },
  'drogheda': { lat: 53.7178, lng: -6.3478, formattedAddress: 'Drogheda, Louth, Ireland', county: 'Louth', city: 'Drogheda' },
  'dundalk': { lat: 54.0019, lng: -6.4058, formattedAddress: 'Dundalk, Louth, Ireland', county: 'Louth', city: 'Dundalk' },
  'bray': { lat: 53.2028, lng: -6.0989, formattedAddress: 'Bray, Wicklow, Ireland', county: 'Wicklow', city: 'Bray' },
  'naas': { lat: 53.2167, lng: -6.6667, formattedAddress: 'Naas, Kildare, Ireland', county: 'Kildare', city: 'Naas' },
  'navan': { lat: 53.6548, lng: -6.6978, formattedAddress: 'Navan, Meath, Ireland', county: 'Meath', city: 'Navan' },
  'athlone': { lat: 53.4239, lng: -7.9406, formattedAddress: 'Athlone, Westmeath, Ireland', county: 'Westmeath', city: 'Athlone' },
  'tullamore': { lat: 53.2738, lng: -7.4901, formattedAddress: 'Tullamore, Offaly, Ireland', county: 'Offaly', city: 'Tullamore' },
  'portlaoise': { lat: 53.0344, lng: -7.3016, formattedAddress: 'Portlaoise, Laois, Ireland', county: 'Laois', city: 'Portlaoise' },
  'carlow': { lat: 52.8417, lng: -6.9264, formattedAddress: 'Carlow, Ireland', county: 'Carlow', city: 'Carlow' },
  'ennis': { lat: 52.8454, lng: -8.9831, formattedAddress: 'Ennis, Clare, Ireland', county: 'Clare', city: 'Ennis' },
  'tralee': { lat: 52.2706, lng: -9.7002, formattedAddress: 'Tralee, Kerry, Ireland', county: 'Kerry', city: 'Tralee' },
  'killarney': { lat: 52.0599, lng: -9.5040, formattedAddress: 'Killarney, Kerry, Ireland', county: 'Kerry', city: 'Killarney' },
  'clonmel': { lat: 52.3558, lng: -7.7003, formattedAddress: 'Clonmel, Tipperary, Ireland', county: 'Tipperary', city: 'Clonmel' },
  'castlebar': { lat: 53.8547, lng: -9.2977, formattedAddress: 'Castlebar, Mayo, Ireland', county: 'Mayo', city: 'Castlebar' },
  'letterkenny': { lat: 54.9539, lng: -7.7338, formattedAddress: 'Letterkenny, Donegal, Ireland', county: 'Donegal', city: 'Letterkenny' },
  'carrickmines': { lat: 53.2769, lng: -6.1522, formattedAddress: 'Carrickmines, Dublin, Ireland', county: 'Dublin', city: 'Carrickmines' },
  'fonthill': { lat: 53.3433, lng: -6.4286, formattedAddress: 'Fonthill, Dublin, Ireland', county: 'Dublin', city: 'Fonthill' },
  'kinsale road': { lat: 51.8833, lng: -8.5167, formattedAddress: 'Kinsale Road, Cork, Ireland', county: 'Cork', city: 'Kinsale Road' },
  'castlebar': { lat: 53.8547, lng: -9.2977, formattedAddress: 'Castlebar, Mayo, Ireland', county: 'Mayo', city: 'Castlebar' }
};

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    // First try to find exact city/town match for higher accuracy
    const cityMatch = findCityMatch(address);
    if (cityMatch) {
      return cityMatch;
    }

    // Use OpenStreetMap Nominatim API (free alternative to Google Maps)
    const searchAddress = address.includes('Ireland') ? address : `${address}, Ireland`;
    const encodedAddress = encodeURIComponent(searchAddress);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=ie&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'tradesbook.ie/1.0'
        }
      }
    );

    if (!response.ok) {
      console.error('Nominatim API error:', response.status, response.statusText);
      return getFallbackLocation(address);
    }

    const data = await response.json();
    
    if (data.length === 0) {
      console.log(`No geocoding results for address: ${address}`);
      return getFallbackLocation(address);
    }

    const result = data[0];
    const addressDetails = result.address || {};
    
    // Extract county and city from address details
    const county = addressDetails.county || addressDetails.state || 
                  extractCountyFromAddress(result.display_name);
    const city = addressDetails.city || addressDetails.town || 
                addressDetails.village || addressDetails.hamlet;

    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      formattedAddress: result.display_name,
      county: county || 'Unknown',
      city: city || undefined
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return getFallbackLocation(address);
  }
}

function findCityMatch(address: string): GeocodeResult | null {
  const addressLower = address.toLowerCase();
  
  // Check for exact city/town matches first
  for (const [cityName, location] of Object.entries(IRISH_CITIES_TOWNS)) {
    if (addressLower.includes(cityName)) {
      return location;
    }
  }
  
  return null;
}

function extractCountyFromAddress(address: string): string | undefined {
  const addressLower = address.toLowerCase();
  
  for (const county of IRISH_COUNTIES) {
    if (addressLower.includes(county.toLowerCase())) {
      return county;
    }
  }
  
  return undefined;
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