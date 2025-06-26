// Test QR code generation and booking system
import axios from 'axios';

async function testQRCodeSystem() {
  console.log('Testing QR code system...\n');
  
  try {
    // Test creating a booking to get a QR code
    const booking = await axios.post('http://localhost:5000/api/bookings', {
      address: '123 Test Street, Dublin 1, Ireland',
      tvSize: '65',
      serviceType: 'Premium Wall Mount',
      wallType: 'drywall',
      mountType: 'tilting',
      cableConcealment: true,
      soundbarInstallation: false,
      preferredDate: '2025-06-27',
      timeSlot: '10:00 AM - 12:00 PM',
      customerName: 'QR Test Customer',
      customerPhone: '+353 1 234 5678',
      customerEmail: 'admin@tradesbook.ie',
      specialRequirements: 'Testing QR code generation'
    });

    console.log('✓ Booking created successfully');
    console.log('Booking ID:', booking.data.id);
    console.log('QR Code:', booking.data.qrCode);
    console.log('QR URL:', `${process.env.REPL_SLUG || 'localhost:5000'}/qr-tracking/${booking.data.qrCode}`);
    
    // Test fetching booking by QR code
    const qrBooking = await axios.get(`http://localhost:5000/api/bookings/qr/${booking.data.qrCode}`);
    console.log('✓ QR code lookup successful');
    console.log('Retrieved booking:', qrBooking.data.id);
    
    console.log('\nQR code system is working correctly!');
    console.log('Admin dashboard should now display QR codes properly.');
    
  } catch (error) {
    console.error('❌ QR code system test failed:', error.response?.data || error.message);
  }
}

testQRCodeSystem();