// Test script for all email types with valid email
import axios from 'axios';

const baseURL = 'http://localhost:5000';
const validEmail = 'admin@tradesbook.ie'; // Using your actual email

async function testAllEmailTypes() {
  console.log('Testing all email notification types with valid email...\n');

  // Test 1: TV Recommendation Contact Form
  try {
    console.log('1. Testing TV Recommendation Contact Form...');
    const tvResponse = await axios.post(`${baseURL}/api/tv-recommendation/contact`, {
      name: "Test Customer - TV Recommendation",
      email: validEmail,
      phone: "+353 87 123 4567",
      message: "I need help choosing the right TV for my living room. Looking for something around 65 inches with excellent picture quality for movies and gaming.",
      recommendation: {
        type: "OLED TV",
        model: "Samsung S95C 65\" OLED",
        reasons: ["Perfect for dark room viewing", "Excellent gaming performance", "Premium picture quality"],
        priceRange: "€2000-2500"
      },
      preferences: {
        usage: "Movies and Gaming",
        budget: "€2000-2500",
        room: "Living Room",
        gaming: "Very Important",
        features: "Picture Quality and HDR"
      }
    });
    console.log('✓ TV Recommendation emails sent successfully');
  } catch (error) {
    console.log('✗ TV Recommendation email failed:', error.response?.data?.message || error.message);
  }

  // Test 2: Solar Enquiry (fix the database issue first)
  try {
    console.log('\n2. Testing Solar Enquiry...');
    const solarResponse = await axios.post(`${baseURL}/api/solar-enquiries`, {
      firstName: "Test Customer",
      lastName: "Solar Enquiry", 
      email: validEmail,
      phone: "+353 87 987 6543",
      address: "123 Green Energy Lane, Dublin 4, Ireland",
      county: "Dublin",
      propertyType: "detached",
      roofType: "pitched",
      electricityBill: "€150-200",
      timeframe: "within-6-months",
      grants: true,
      additionalInfo: "Interested in solar panel installation with battery storage. Looking for SEAI grant information."
    });
    console.log('✓ Solar enquiry emails sent successfully');
  } catch (error) {
    console.log('✗ Solar enquiry email failed:', error.response?.data?.message || error.message);
  }

  // Test 3: Booking Creation (requires authentication)
  try {
    console.log('\n3. Testing Booking Creation...');
    const bookingData = {
      address: "456 Installation Avenue, Cork, Ireland",
      tvSize: "65",
      serviceType: "wall-mount-medium",
      wallType: "drywall",
      mountType: "tilting",
      cableConceal: "conduit",
      soundbarInstall: "yes",
      aiPreviewUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    };
    
    const bookingResponse = await axios.post(`${baseURL}/api/bookings`, bookingData);
    console.log('✓ Booking creation emails sent successfully');
  } catch (error) {
    console.log('✗ Booking creation email failed:', error.response?.data?.message || error.message);
  }

  // Test 4: Direct Admin Notification
  try {
    console.log('\n4. Testing Direct Admin Notification...');
    const adminResponse = await axios.post(`${baseURL}/api/test-email`, {
      to: validEmail,
      subject: "Test Admin Alert - All Systems Working",
      message: "This is a test of the admin notification system. All email types are being validated."
    });
    console.log('✓ Admin notification email sent successfully');
  } catch (error) {
    console.log('✗ Admin notification email failed:', error.response?.data?.message || error.message);
  }

  console.log('\n=== EMAIL TESTING COMPLETED ===');
  console.log(`Check ${validEmail} for all test emails.`);
  console.log('Expected emails:');
  console.log('1. TV Recommendation - Admin notification');
  console.log('2. TV Recommendation - Customer confirmation');
  console.log('3. Solar Enquiry - Admin notification (if database fixed)');
  console.log('4. Solar Enquiry - Customer confirmation (if database fixed)');
  console.log('5. Booking Confirmation (if authentication works)');
  console.log('6. Direct Admin Alert');
}

testAllEmailTypes();