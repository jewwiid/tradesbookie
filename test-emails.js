// Test script for all email types
import axios from 'axios';

const baseURL = 'http://localhost:5000';

async function testEmailTypes() {
  console.log('Testing all email notification types...\n');

  // Test 1: TV Recommendation Contact Form (Admin + Customer emails)
  try {
    console.log('1. Testing TV Recommendation Contact Form...');
    const tvResponse = await axios.post(`${baseURL}/api/tv-recommendation/contact`, {
      name: "Email Test - TV Recommendation",
      email: "tvtest@example.com",
      phone: "+353 1 234 5678",
      message: "Testing TV recommendation email notifications",
      recommendation: {
        type: "OLED TV",
        model: "Samsung S95C 65OLED"
      },
      preferences: {
        usage: "Movies and Gaming",
        budget: "€1500-2500",
        room: "Living Room",
        gaming: "Very Important",
        features: "Picture Quality"
      }
    });
    console.log('✓ TV Recommendation emails sent successfully');
  } catch (error) {
    console.log('✗ TV Recommendation email failed:', error.response?.data || error.message);
  }

  // Test 2: Admin Notification Email
  try {
    console.log('\n2. Testing Admin Notification...');
    const adminResponse = await axios.post(`${baseURL}/api/test-email`, {
      to: "admin@tradesbook.ie",
      subject: "Email Test - Admin Notification",
      message: "Testing admin notification email functionality"
    });
    console.log('✓ Admin notification email sent successfully');
  } catch (error) {
    console.log('✗ Admin notification email failed:', error.response?.data || error.message);
  }

  // Test 3: Solar Enquiry (if endpoint exists)
  try {
    console.log('\n3. Testing Solar Enquiry...');
    const solarResponse = await axios.post(`${baseURL}/api/solar-enquiries`, {
      name: "Email Test - Solar Enquiry",
      email: "solartest@example.com",
      phone: "+353 1 987 6543",
      address: "456 Solar Avenue, Cork, Ireland",
      propertyType: "detached",
      roofType: "pitched",
      electricityBill: "€150-200",
      seaiGrant: "yes",
      timeline: "within-6-months",
      additionalInfo: "Testing solar enquiry email notifications"
    });
    console.log('✓ Solar enquiry emails sent successfully');
  } catch (error) {
    console.log('✗ Solar enquiry email failed:', error.response?.data || error.message);
  }

  console.log('\nEmail testing completed. Check your inbox for the test emails.');
}

testEmailTypes();