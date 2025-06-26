// Test booking confirmation email with QR code
import axios from 'axios';

async function testBookingEmailWithQR() {
  console.log('Testing booking confirmation email with QR code...\n');
  
  try {
    const response = await axios.post('http://localhost:5000/api/test-booking-emails', {
      customerEmail: 'admin@tradesbook.ie',
      customerName: 'QR Test Customer',
      bookingDetails: {
        qrCode: 'TEST-QR-EMAIL-001',
        address: '123 QR Test Street, Dublin 1, Ireland',
        tvSize: '65"',
        serviceType: 'Premium Wall Mount',
        wallType: 'Drywall',
        mountType: 'Tilting',
        totalPrice: '€249',
        installerEarnings: '€179',
        scheduledDate: '2025-06-27',
        timeSlot: '10:00 AM - 12:00 PM',
        difficulty: 'Moderate'
      }
    });

    console.log('✓ Test booking confirmation emails sent');
    console.log('Response:', response.data);
    console.log('\nCheck your email for:');
    console.log('1. Customer booking confirmation from noreply@tradesbook.ie');
    console.log('2. Installer notification from installer@tradesbook.ie');
    console.log('3. Both emails should include QR code: TEST-QR-EMAIL-001');
    
  } catch (error) {
    console.error('❌ Test email failed:', error.response?.data || error.message);
  }
}

testBookingEmailWithQR();