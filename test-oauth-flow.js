// Test script to verify OAuth role-based authentication and admin notifications
const axios = require('axios');

async function testOAuthFlow() {
  const baseURL = 'http://localhost:5000';
  
  console.log('Testing OAuth Role-Based Authentication Flow\n');
  
  // Test 1: Customer login URL
  console.log('1. Testing customer login URL...');
  try {
    const response = await axios.get(`${baseURL}/api/login`, {
      maxRedirects: 0,
      validateStatus: () => true
    });
    console.log(`   Status: ${response.status}`);
    console.log(`   Location header: ${response.headers.location || 'None'}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 2: Installer login URL
  console.log('\n2. Testing installer login URL...');
  try {
    const response = await axios.get(`${baseURL}/api/login?role=installer`, {
      maxRedirects: 0,
      validateStatus: () => true
    });
    console.log(`   Status: ${response.status}`);
    console.log(`   Location header: ${response.headers.location || 'None'}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 3: Admin login URL
  console.log('\n3. Testing admin login URL...');
  try {
    const response = await axios.get(`${baseURL}/api/login?role=admin`, {
      maxRedirects: 0,
      validateStatus: () => true
    });
    console.log(`   Status: ${response.status}`);
    console.log(`   Location header: ${response.headers.location || 'None'}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 4: Check auth status
  console.log('\n4. Testing auth status endpoint...');
  try {
    const response = await axios.get(`${baseURL}/api/auth/user`);
    console.log(`   Status: ${response.status}`);
    console.log(`   User data: ${JSON.stringify(response.data)}`);
  } catch (error) {
    console.log(`   Status: ${error.response?.status || 'Error'}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
  }
}

testOAuthFlow();