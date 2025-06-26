import fetch from 'node-fetch';

async function testCompleteBookingFlow() {
  console.log('Testing complete booking flow...\n');
  
  try {
    // Step 1: Test TV size service tiers
    console.log('1. Testing service tiers for 65" TV...');
    const tiersResponse = await fetch('http://localhost:5000/api/service-tiers');
    const tiers = await tiersResponse.json();
    console.log(`   Found ${tiers.length} service tiers available`);
    
    // Step 2: Test AI room analysis
    console.log('2. Testing AI room analysis...');
    const analysisResponse = await fetch('http://localhost:5000/api/analyze-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVR...' // Mock base64
      })
    });
    const analysis = await analysisResponse.json();
    console.log(`   Room analysis: ${analysis.analysis ? 'SUCCESS' : 'FAILED'}`);
    
    // Step 3: Test booking creation
    console.log('3. Testing booking creation...');
    const bookingData = {
      contactName: 'Test Customer',
      contactEmail: 'admin@tradesbook.ie',
      contactPhone: '+353 85 123 4567',
      address: '123 Test Street, Dublin, Ireland',
      tvSize: '65',
      serviceType: 'wall-mount-large',
      wallType: 'drywall',
      mountType: 'tilting',
      cableConcealment: true,
      soundbarInstallation: false,
      scheduledDate: new Date().toISOString().split('T')[0],
      customerNotes: 'Living room installation, prefer afternoon'
    };
    
    const bookingResponse = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    
    if (bookingResponse.ok) {
      const booking = await bookingResponse.json();
      console.log(`   Booking created: ${booking.booking?.qrCode}`);
      
      // Step 4: Test QR tracking
      console.log('4. Testing QR tracking page...');
      const trackingResponse = await fetch(`http://localhost:5000/qr-tracking/${booking.booking.qrCode}`);
      const trackingPage = await trackingResponse.text();
      console.log(`   QR tracking page: ${trackingPage.includes('Installation Tracking') ? 'SUCCESS' : 'FAILED'}`);
      
      // Step 5: Test installer dashboard requests
      console.log('5. Testing installer available requests...');
      const requestsResponse = await fetch('http://localhost:5000/api/installer/available-requests');
      const requests = await requestsResponse.json();
      console.log(`   Available requests: ${Array.isArray(requests) ? requests.length : 'FAILED'}`);
      
      // Step 6: Test request acceptance
      console.log('6. Testing request acceptance...');
      const acceptResponse = await fetch(`http://localhost:5000/api/installer/accept-request/${booking.booking.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installerId: 1 })
      });
      
      if (acceptResponse.ok) {
        const acceptResult = await acceptResponse.json();
        console.log(`   Request acceptance: ${acceptResult.message ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   Customer notification: ${acceptResult.notifications ? 'SENT' : 'NOT SENT'}`);
      } else {
        console.log('   Request acceptance: FAILED');
      }
      
    } else {
      const error = await bookingResponse.json();
      console.log(`   Booking creation failed: ${error.message}`);
    }
    
    console.log('\n=== Booking Flow Test Complete ===');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testCompleteBookingFlow();