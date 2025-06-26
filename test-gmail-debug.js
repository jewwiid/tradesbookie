import axios from 'axios';

async function testGmailDelivery() {
  const baseURL = 'http://localhost:5000';
  const testEmail = 'admin@tradesbook.ie'; // Your actual email
  
  console.log('Testing Gmail API delivery diagnostics...\n');
  
  try {
    // Test basic Gmail API functionality
    console.log('1. Testing basic email delivery...');
    const response = await axios.post(`${baseURL}/api/test-email`, {
      to: testEmail,
      subject: 'Gmail API Diagnostic Test',
      message: 'This is a test email to verify Gmail API delivery. If you receive this, the API is working correctly.'
    });
    
    console.log('API Response:', response.data);
    
    // Check if we're getting message IDs
    if (response.data.success) {
      console.log('✓ Gmail API returned success');
      console.log('Note: Check your email inbox, spam folder, and Gmail sent items');
    } else {
      console.log('✗ Gmail API returned failure');
    }
    
  } catch (error) {
    console.error('Error testing Gmail:', error.response?.data || error.message);
  }
  
  console.log('\n=== GMAIL DIAGNOSTIC COMPLETE ===');
  console.log('If API shows success but no email received, check:');
  console.log('1. Gmail spam/junk folder');
  console.log('2. Gmail sent items folder');
  console.log('3. OAuth permissions and scopes');
  console.log('4. Gmail API delivery settings');
}

testGmailDelivery();