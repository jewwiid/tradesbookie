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
  'castlebar': { lat: 53.8547, lng: -9.2977, formattedAddress: 'Castlebar, Mayo, Ireland', county: 'Mayo', city: 'Castlebar' },
  
  // Dublin postcodes for better accuracy
  'dublin 4': { lat: 53.3244, lng: -6.2297, formattedAddress: 'Dublin 4, Ireland', county: 'Dublin', city: 'Dublin 4' },
  'dublin 2': { lat: 53.3381, lng: -6.2592, formattedAddress: 'Dublin 2, Ireland', county: 'Dublin', city: 'Dublin 2' },
  'dublin 1': { lat: 53.3515, lng: -6.2602, formattedAddress: 'Dublin 1, Ireland', county: 'Dublin', city: 'Dublin 1' },
  'dublin 6': { lat: 53.3147, lng: -6.2706, formattedAddress: 'Dublin 6, Ireland', county: 'Dublin', city: 'Dublin 6' },
  'dublin 8': { lat: 53.3308, lng: -6.2906, formattedAddress: 'Dublin 8, Ireland', county: 'Dublin', city: 'Dublin 8' },
  'd18': { lat: 53.2769, lng: -6.1522, formattedAddress: 'D18, Dublin, Ireland', county: 'Dublin', city: 'D18' },
  'sandyford': { lat: 53.2778, lng: -6.2269, formattedAddress: 'Sandyford, Dublin, Ireland', county: 'Dublin', city: 'Sandyford' },
  'ballsbridge': { lat: 53.3306, lng: -6.2339, formattedAddress: 'Ballsbridge, Dublin, Ireland', county: 'Dublin', city: 'Ballsbridge' },
  'rathmines': { lat: 53.3225, lng: -6.2653, formattedAddress: 'Rathmines, Dublin, Ireland', county: 'Dublin', city: 'Rathmines' },
  'dun laoghaire': { lat: 53.2941, lng: -6.1378, formattedAddress: 'Dun Laoghaire, Dublin, Ireland', county: 'Dublin', city: 'Dun Laoghaire' },
  'blackrock': { lat: 53.3017, lng: -6.1786, formattedAddress: 'Blackrock, Dublin, Ireland', county: 'Dublin', city: 'Blackrock' },
  'stillorgan': { lat: 53.2794, lng: -6.2072, formattedAddress: 'Stillorgan, Dublin, Ireland', county: 'Dublin', city: 'Stillorgan' }
};

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    // Clean and normalize the address for better geocoding
    const cleanedAddress = cleanIrishAddress(address);
    
    // Try multiple search strategies for better results
    const searchStrategies = [
      cleanedAddress,
      `${cleanedAddress}, Ireland`,
      `${cleanedAddress}, Republic of Ireland`,
      // Remove postal codes and try again if original had them
      cleanedAddress.replace(/[A-Z]\d{2}[A-Z]\d{3}/g, '').trim() + ', Ireland'
    ];

    for (const searchAddress of searchStrategies) {
      if (!searchAddress.trim()) continue;
      
      const encodedAddress = encodeURIComponent(searchAddress);
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=ie&limit=3&addressdetails=1&extratags=1`,
          {
            headers: {
              'User-Agent': 'tradesbook.ie/1.0'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          
          if (data.length > 0) {
            // Find the best match based on address components
            const bestResult = findBestAddressMatch(data, address);
            
            if (bestResult) {
              const addressDetails = bestResult.address || {};
              
              // Extract county and city from address details
              const county = addressDetails.county || addressDetails.state || 
                            extractCountyFromAddress(bestResult.display_name);
              const city = addressDetails.city || addressDetails.town || 
                          addressDetails.village || addressDetails.hamlet ||
                          addressDetails.suburb || addressDetails.neighbourhood;

              return {
                lat: parseFloat(bestResult.lat),
                lng: parseFloat(bestResult.lon),
                formattedAddress: bestResult.display_name,
                county: county || 'Unknown',
                city: city || undefined
              };
            }
          }
        }
        
        // Small delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (fetchError) {
        console.warn('Geocoding request failed:', fetchError);
        continue; // Try next strategy
      }
    }

    // If all API attempts fail, try city/town match
    const cityMatch = findCityMatch(address);
    if (cityMatch) {
      return cityMatch;
    }

    console.log(`No geocoding results for address: ${address}`);
    return getFallbackLocation(address);
  } catch (error) {
    console.error('Geocoding error:', error);
    return getFallbackLocation(address);
  }
}

function cleanIrishAddress(address: string): string {
  // Remove common formatting issues and normalize
  return address
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/,\s*,/g, ',') // Remove double commas
    .replace(/^\s*,|,\s*$/g, '') // Remove leading/trailing commas
    .trim();
}

function findBestAddressMatch(results: any[], originalAddress: string): any | null {
  if (results.length === 0) return null;
  if (results.length === 1) return results[0];
  
  // Score results based on how well they match the original address
  const scoredResults = results.map(result => {
    let score = 0;
    const displayName = result.display_name.toLowerCase();
    const original = originalAddress.toLowerCase();
    
    // Prefer results with higher importance
    if (result.importance) {
      score += result.importance * 10;
    }
    
    // Prefer results that contain parts of the original address
    const addressParts = original.split(/[,\s]+/).filter(part => part.length > 2);
    addressParts.forEach(part => {
      if (displayName.includes(part)) {
        score += 5;
      }
    });
    
    // Prefer results with detailed address components
    if (result.address) {
      if (result.address.house_number) score += 3;
      if (result.address.road) score += 2;
      if (result.address.suburb || result.address.neighbourhood) score += 1;
    }
    
    return { result, score };
  });
  
  // Return the highest scoring result
  scoredResults.sort((a, b) => b.score - a.score);
  return scoredResults[0].result;
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
  
  // First use the detailed Irish location fallbacks (cities/towns/areas)
  const cityMatch = findCityMatch(address);
  if (cityMatch) {
    return cityMatch;
  }
  
  // Check for Dublin postcodes (D18, D04, etc.)
  const dublinPostcodeMatch = addressLower.match(/d\d{2}/);
  if (dublinPostcodeMatch) {
    const postcode = dublinPostcodeMatch[0];
    // Map common postcodes to areas
    const postcodeAreas: Record<string, string> = {
      'd18': 'carrickmines',
      'd04': 'ballsbridge', 
      'd06': 'rathmines',
      'd02': 'dublin 2',
      'd01': 'dublin 1',
      'd08': 'dublin 8'
    };
    if (postcodeAreas[postcode]) {
      const cityLocation = findCityMatch(postcodeAreas[postcode]);
      if (cityLocation) return cityLocation;
    }
  }
  
  // Check for numbered Dublin areas (Dublin 4, Dublin 2, etc.)
  const dublinNumberMatch = addressLower.match(/dublin\s*(\d+)/);
  if (dublinNumberMatch) {
    const dublinArea = `dublin ${dublinNumberMatch[1]}`;
    const cityLocation = findCityMatch(dublinArea);
    if (cityLocation) return cityLocation;
  }
  
  // Fallback to county-level coordinates from IRISH_LOCATION_FALLBACKS
  for (const [county, location] of Object.entries(IRISH_LOCATION_FALLBACKS)) {
    if (addressLower.includes(county.toLowerCase())) {
      return location;
    }
  }
  
  // Default to Dublin if no match found
  return IRISH_LOCATION_FALLBACKS['Dublin'] || null;
}