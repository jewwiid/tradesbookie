import axios from 'axios';

async function comprehensiveEmailTest() {
  const baseURL = 'http://localhost:5000';
  const testEmail = 'admin@tradesbook.ie';
  
  console.log('=== COMPREHENSIVE EMAIL DELIVERY TEST ===\n');
  
  // Test 1: Simple diagnostic email
  console.log('1. Sending diagnostic email...');
  try {
    const response1 = await axios.post(`${baseURL}/api/test-email`, {
      to: testEmail,
      subject: 'Email Test #1 - Diagnostic',
      message: 'This is diagnostic email #1. Please check your Gmail inbox, spam folder, and sent items.'
    });
    console.log('✓ Diagnostic email sent - Message ID in server logs');
  } catch (error) {
    console.log('✗ Diagnostic email failed:', error.message);
  }
  
  // Test 2: TV Recommendation email
  console.log('\n2. Sending TV recommendation email...');
  try {
    const response2 = await axios.post(`${baseURL}/api/tv-recommendation/contact`, {
      name: 'Email Test User',
      email: testEmail,
      answers: {
        usage: 'entertainment',
        budget: '1000-2000',
        room: 'living-room',
        gaming: 'no',
        features: 'smart-features'
      },
      message: 'This is a test TV recommendation request to verify email delivery.'
    });
    console.log('✓ TV recommendation emails sent');
  } catch (error) {
    console.log('✗ TV recommendation email failed:', error.message);
  }
  
  // Test 3: Booking confirmation email
  console.log('\n3. Sending booking confirmation email...');
  try {
    const response3 = await axios.post(`${baseURL}/api/test-booking-emails`, {
      customerEmail: testEmail,
      customerName: 'Email Test Customer'
    });
    console.log('✓ Booking confirmation emails sent');
  } catch (error) {
    console.log('✗ Booking confirmation email failed:', error.message);
  }
  
  console.log('\n=== EMAIL TEST COMPLETE ===');
  console.log(`Check ${testEmail} for 5+ test emails:`);
  console.log('• Diagnostic email');
  console.log('• TV recommendation (admin notification)');  
  console.log('• TV recommendation (customer confirmation)');
  console.log('• Booking confirmation (customer)');
  console.log('• Booking confirmation (installer notification)');
  console.log('\nIf not received, check:');
  console.log('1. Gmail spam/junk folder');
  console.log('2. Gmail filters and labels');
  console.log('3. Gmail web interface vs mobile app');
  console.log('4. Allow 1-2 minutes for delivery');
}

comprehensiveEmailTest();