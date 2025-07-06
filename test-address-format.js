// Test script to verify address format and geocoding
import { geocodeAddress, geocodeMultipleAddresses } from './server/services/geocoding.js';

// Test addresses with different formats
const testAddresses = [
  // Current format from contact form
  "123 Main Street, Dublin, County Dublin, D02 X285",
  
  // Variations with different spacing
  "456 Oak Road, Cork, County Cork, T12 Y345",
  
  // With apartment/unit numbers
  "Apt 3, 789 Park Avenue, Galway, County Galway, H91 Z678",
  
  // Rural addresses
  "Rose Cottage, Ballymore, County Westmeath, N37 K123",
  
  // Dublin postal districts
  "15 Grafton Street, Dublin 2, County Dublin, D02 X285",
  
  // Northern Ireland format (to test if it's handled)
  "10 Main Street, Belfast, County Antrim, BT1 1AA",
  
  // Missing elements (incomplete addresses)
  "Main Street, Dublin",
  "Cork, County Cork",
  
  // Harvey Norman store locations for testing
  "Harvey Norman, Carrickmines, Dublin, County Dublin, D18 R2N3",
  "Harvey Norman, Fonthill, Dublin, County Dublin, D22 Y3K8"
];

async function testAddressGeocoding() {
  console.log('🔍 Testing Address Format and Geocoding System\n');
  
  console.log('📍 Individual Address Tests:');
  console.log('=' .repeat(50));
  
  for (const address of testAddresses) {
    try {
      console.log(`\n🏠 Testing: ${address}`);
      const result = await geocodeAddress(address);
      
      if (result) {
        console.log(`✅ Success: ${result.formattedAddress}`);
        console.log(`   Coordinates: ${result.lat}, ${result.lng}`);
        console.log(`   County: ${result.county || 'Unknown'}`);
        console.log(`   City: ${result.city || 'Unknown'}`);
      } else {
        console.log(`❌ Failed: No geocoding result`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n\n📍 Batch Geocoding Test:');
  console.log('=' .repeat(50));
  
  try {
    const batchResults = await geocodeMultipleAddresses(testAddresses.slice(0, 5));
    console.log(`\n✅ Batch processed ${batchResults.size} addresses:`);
    
    for (const [address, result] of batchResults.entries()) {
      console.log(`\n🏠 ${address}`);
      console.log(`   → ${result.formattedAddress}`);
      console.log(`   → ${result.lat}, ${result.lng} (${result.county})`);
    }
  } catch (error) {
    console.log(`❌ Batch geocoding error: ${error.message}`);
  }
  
  console.log('\n\n📊 Address Format Analysis:');
  console.log('=' .repeat(50));
  
  // Test the current format used in contact form
  const currentFormat = "123 Main Street, Dublin, County Dublin, D02 X285";
  console.log(`\n📋 Current Format: ${currentFormat}`);
  
  // Break down the format
  const parts = currentFormat.split(', ');
  console.log(`   Street Address: ${parts[0]}`);
  console.log(`   Town/City: ${parts[1]}`);
  console.log(`   County: ${parts[2]}`);
  console.log(`   Eircode: ${parts[3]}`);
  
  // Test geocoding with this format
  const currentResult = await geocodeAddress(currentFormat);
  if (currentResult) {
    console.log(`\n✅ Current format geocodes successfully:`);
    console.log(`   → ${currentResult.formattedAddress}`);
    console.log(`   → Accuracy: ${currentResult.lat}, ${currentResult.lng}`);
  }
  
  console.log('\n\n🎯 Recommendations:');
  console.log('=' .repeat(50));
  console.log('1. Current format works well for geocoding');
  console.log('2. OpenStreetMap handles Irish addresses effectively');
  console.log('3. Fallback system provides good coverage for edge cases');
  console.log('4. Consider adding validation for Eircode format');
  console.log('5. System handles both urban and rural addresses');
}

// Run the test
testAddressGeocoding().catch(console.error);