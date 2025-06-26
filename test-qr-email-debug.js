import QRCode from 'qrcode';

async function testQRGeneration() {
  try {
    const testURL = 'https://tradesbook.ie/qr-tracking/TEST-QR-999';
    console.log('Testing QR code generation for:', testURL);
    
    const qrDataURL = await QRCode.toDataURL(testURL, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log('QR Code generated successfully!');
    console.log('Data URL length:', qrDataURL.length);
    console.log('Data URL prefix:', qrDataURL.substring(0, 50));
    
    // Test email template with QR code
    const html = `
      <div style="text-align: center; margin: 20px 0;">
        <h3>QR Code Test</h3>
        <img src="${qrDataURL}" alt="QR Code" style="border: 2px solid #ddd; border-radius: 8px;" />
        <p>QR Code for: TEST-QR-999</p>
      </div>
    `;
    
    console.log('HTML template with QR code created');
    console.log('Template length:', html.length);
    
    // Make test API call with proper email parameters
    const response = await fetch('http://localhost:5000/api/test-booking-emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerEmail: 'admin@tradesbook.ie',
        customerName: 'Test Customer',
        qrCode: 'TEST-QR-DEBUG-001'
      })
    });
    
    const result = await response.json();
    console.log('Test email response:', result);
    
  } catch (error) {
    console.error('QR Generation test failed:', error);
  }
}

testQRGeneration();