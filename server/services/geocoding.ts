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

// Extract Eircode from Irish address
function extractEircode(address: string): string | null {
  // Irish Eircode pattern: 1 letter + 2 digits + 4 characters (letter/digit mix)
  const eircodePattern = /([A-Z]\d{2}[A-Z0-9]{4})/i;
  const match = address.match(eircodePattern);
  return match ? match[1].toUpperCase() : null;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    // Extract Eircode if present for more accurate geocoding
    const eircode = extractEircode(address);
    
    // Try multiple search strategies for better accuracy
    const searchQueries = [];
    
    // Strategy 1: Use Eircode if available (most accurate)
    if (eircode) {
      searchQueries.push(`${eircode}, Ireland`);
      console.log(`Found Eircode ${eircode} in address: ${address}`);
    }
    
    // Strategy 2: Full address
    const fullAddress = address.includes('Ireland') ? address : `${address}, Ireland`;
    searchQueries.push(fullAddress);
    
    // Strategy 3: Simplified address (remove apartment details)
    const simplifiedAddress = address
      .replace(/apartment \d+/i, '')
      .replace(/apt \d+/i, '')
      .replace(/unit \d+/i, '')
      .trim();
    if (simplifiedAddress !== address) {
      const simpleSearch = simplifiedAddress.includes('Ireland') ? simplifiedAddress : `${simplifiedAddress}, Ireland`;
      searchQueries.push(simpleSearch);
    }
    
    console.log(`Geocoding address via Nominatim API: ${address} (${searchQueries.length} strategies)`);
    
    // Try each search strategy
    for (const searchQuery of searchQueries) {
      const encodedAddress = encodeURIComponent(searchQuery);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=ie&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'tradesbook.ie/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.length > 0) {
          // Pick the most specific result that matches our criteria
          const result = data.find(item => {
            // Prefer results with higher accuracy (house, building level)
            const type = item.type || '';
            const category = item.category || '';
            return ['house', 'building', 'residential'].includes(type) || 
                   ['building', 'place'].includes(category);
          }) || data[0]; // Fallback to first result
          
          const addressDetails = result.address || {};
          
          // Extract county and city from address details
          const county = addressDetails.county || addressDetails.state || 
                        extractCountyFromAddress(result.display_name);
          const city = addressDetails.city || addressDetails.town || 
                      addressDetails.village || addressDetails.hamlet;

          console.log(`Successfully geocoded via API: ${address} -> ${result.lat}, ${result.lon} (using query: "${searchQuery}")`);

          return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            formattedAddress: result.display_name,
            county: county || 'Unknown',
            city: city || undefined
          };
        }
      } else {
        console.warn(`Nominatim API error for query "${searchQuery}":`, response.status, response.statusText);
      }
      
      // Small delay between queries to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // If all API attempts fail, try city/town matching as fallback
    const cityMatch = findCityMatch(address);
    if (cityMatch) {
      console.log(`All API strategies failed, using city match for address: ${address} -> ${cityMatch.formattedAddress}`);
      return cityMatch;
    }

    // Final fallback with random offset
    console.log(`No geocoding results for address: ${address} - using fallback with offset`);
    return getFallbackLocationWithRandomOffset(address);

  } catch (error) {
    console.error('Geocoding error:', error);
    return getFallbackLocationWithRandomOffset(address);
  }
}

function findCityMatch(address: string): GeocodeResult | null {
  const addressLower = address.toLowerCase();
  
  // Find all matches and prioritize the longest/most specific one
  const matches = [];
  for (const [cityName, location] of Object.entries(IRISH_CITIES_TOWNS)) {
    if (addressLower.includes(cityName)) {
      matches.push({ cityName, location, length: cityName.length });
    }
  }
  
  // Sort by length (descending) to get the most specific match first
  matches.sort((a, b) => b.length - a.length);
  
  return matches.length > 0 ? matches[0].location : null;
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

// Detect if an address is likely a test/fake address
function isTestAddress(address: string): boolean {
  const testIndicators = [
    'test street', 'test road', 'test avenue',
    'dummy', 'fake', 'example',
    '123 shop street', '456 o\'connell', '789 test'
  ];
  
  const addressLower = address.toLowerCase();
  return testIndicators.some(indicator => addressLower.includes(indicator));
}

// Enhanced fallback that adds small random offsets to avoid overlapping markers
export function getFallbackLocationWithRandomOffset(address: string): GeocodeResult | null {
  const baseLocation = getFallbackLocation(address);
  
  if (!baseLocation) {
    return null;
  }
  
  // For test addresses, add more variety to the offset
  const isTest = isTestAddress(address);
  const offsetMultiplier = isTest ? 2.5 : 1.0; // Larger spread for test addresses
  
  // Add small random offset (up to ~500m radius for real, ~1.2km for test addresses)
  const latOffset = (Math.random() - 0.5) * 0.008 * offsetMultiplier;
  const lngOffset = (Math.random() - 0.5) * 0.012 * offsetMultiplier;
  
  console.log(`Using fallback with offset for ${isTest ? 'test' : 'real'} address: ${address} -> ${baseLocation.formattedAddress} + offset`);
  
  return {
    ...baseLocation,
    lat: baseLocation.lat + latOffset,
    lng: baseLocation.lng + lngOffset,
    formattedAddress: `${address} (estimated location)`,
  };
}