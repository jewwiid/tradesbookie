import axios from 'axios';

async function testFixedEmailSystem() {
  const baseURL = 'http://localhost:5000';
  const testEmail = 'admin@tradesbook.ie';
  
  console.log('Testing fixed email system with complete job details...\n');
  
  try {
    const response = await axios.post(`${baseURL}/api/test-booking-emails`, {
      customerEmail: testEmail,
      customerName: 'Complete Test Customer'
    });
    
    console.log('✓ Fixed booking confirmation emails sent');
    console.log('Response:', response.data);
    
    console.log('\nExpected emails:');
    console.log('1. Customer booking confirmation with total cost €249');
    console.log('2. Installer notification with earnings €179 and complete job details');
    console.log('\nBoth emails should now be sent to your email address for testing.');
    
  } catch (error) {
    console.log('✗ Email test failed:', error.response?.data?.message || error.message);
  }
}

testFixedEmailSystem();