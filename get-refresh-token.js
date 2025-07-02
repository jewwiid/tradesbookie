#!/usr/bin/env node

// Quick Google OAuth Refresh Token Generator
// Run this once to get a new refresh token

import https from 'https';
import url from 'url';
import readline from 'readline';

const CLIENT_ID = '276784219000-dhs7ns07aq97p479v2rvr1qen5od4.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const SCOPE = 'https://www.googleapis.com/auth/gmail.send';

if (!CLIENT_SECRET) {
  console.error('Please set GOOGLE_CLIENT_SECRET environment variable');
  process.exit(1);
}

console.log('🔑 Google OAuth Refresh Token Generator\n');

// Step 1: Generate authorization URL
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `scope=${encodeURIComponent(SCOPE)}&` +
  `response_type=code&` +
  `access_type=offline&` +
  `prompt=consent`;

console.log('1. Open this URL in your browser:');
console.log('\n' + authUrl + '\n');

console.log('2. Complete the authorization process');
console.log('3. You will be redirected to OAuth Playground');
console.log('4. In the URL bar, find the "code" parameter');
console.log('5. Copy the authorization code and paste it below\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the authorization code: ', (authCode) => {
  if (!authCode) {
    console.error('Authorization code is required');
    rl.close();
    return;
  }

  // Step 2: Exchange code for tokens
  const postData = `code=${encodeURIComponent(authCode)}&` +
    `client_id=${CLIENT_ID}&` +
    `client_secret=${CLIENT_SECRET}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `grant_type=authorization_code`;

  const options = {
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('\n🔄 Exchanging code for tokens...\n');

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const tokens = JSON.parse(data);
        
        if (tokens.error) {
          console.error('❌ Error:', tokens.error_description || tokens.error);
          rl.close();
          return;
        }

        console.log('✅ Success! Here are your tokens:\n');
        console.log('REFRESH TOKEN (save this):');
        console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
        console.log('\nACCESS TOKEN (temporary):');
        console.log('GOOGLE_ACCESS_TOKEN=' + tokens.access_token);
        console.log('\nExpires in:', tokens.expires_in, 'seconds');
        
        console.log('\n📝 Next steps:');
        console.log('1. Copy the GOOGLE_REFRESH_TOKEN value');
        console.log('2. Update your environment variables');
        console.log('3. Restart your application');
        
      } catch (error) {
        console.error('❌ Error parsing response:', error.message);
        console.log('Raw response:', data);
      }
      rl.close();
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
    rl.close();
  });

  req.write(postData);
  req.end();
});