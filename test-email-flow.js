// Test script to send complete booking flow email simulation
import { sendGmailEmail } from './server/gmailService.js';

async function sendBookingFlowSimulation() {
  const customerEmail = 'jude.okun@gmail.com';
  const customerName = 'Jude Okun';
  
  // Simulated booking details for demonstration
  const bookingDetails = {
    id: 'TEST-001',
    qrCode: 'QR-TEST-001',
    tvSize: '65"',
    serviceType: 'Professional Wall Mount',
    address: '123 Test Street, Dublin 2, Ireland',
    totalPrice: '€289',
    installerEarnings: '€231',
    scheduledDate: '2025-06-28',
    timeSlot: '10:00 AM - 12:00 PM',
    wallType: 'Drywall',
    mountType: 'Tilting Mount',
    addons: ['Cable Management', 'Soundbar Installation'],
    customerNotes: 'Please call before arrival. Parking available in driveway.',
    basePrice: '€199',
    addonTotal: '€90',
    appFee: '€58',
    referralCode: 'FRIEND25',
    referralDiscount: '10%'
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation - tradesbook.ie</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        .booking-card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #555; }
        .detail-value { color: #333; }
        .price-total { font-size: 1.2em; font-weight: bold; color: #28a745; }
        .qr-section { text-align: center; padding: 20px; background: #fff; border: 2px solid #667eea; border-radius: 8px; margin: 20px 0; }
        .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .addon-list { background: #e9ecef; padding: 15px; border-radius: 6px; margin: 10px 0; }
        .status-badge { background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔧 tradesbook.ie</h1>
          <h2>Booking Confirmation</h2>
          <p>Your TV installation has been confirmed!</p>
        </div>
        
        <div class="content">
          <h3>Hello ${customerName},</h3>
          <p>Thank you for booking with tradesbook.ie! Your TV installation request has been confirmed and our professional installer will contact you shortly.</p>
          
          <div class="booking-card">
            <h4>📋 Booking Details</h4>
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
              <span class="detail-value">${bookingDetails.id}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">TV Size:</span>
              <span class="detail-value">${bookingDetails.tvSize}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Service:</span>
              <span class="detail-value">${bookingDetails.serviceType}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Address:</span>
              <span class="detail-value">${bookingDetails.address}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Scheduled:</span>
              <span class="detail-value">${bookingDetails.scheduledDate} at ${bookingDetails.timeSlot}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Wall Type:</span>
              <span class="detail-value">${bookingDetails.wallType}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Mount Type:</span>
              <span class="detail-value">${bookingDetails.mountType}</span>
            </div>
          </div>

          <div class="addon-list">
            <h4>🔧 Additional Services</h4>
            ${bookingDetails.addons.map(addon => `<p>• ${addon}</p>`).join('')}
          </div>

          <div class="booking-card">
            <h4>💰 Pricing Breakdown</h4>
            <div class="detail-row">
              <span class="detail-label">Base Service:</span>
              <span class="detail-value">${bookingDetails.basePrice}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Additional Services:</span>
              <span class="detail-value">${bookingDetails.addonTotal}</span>
            </div>
            ${bookingDetails.referralCode ? `
            <div class="detail-row">
              <span class="detail-label">Referral Discount (${bookingDetails.referralCode}):</span>
              <span class="detail-value">-${bookingDetails.referralDiscount}</span>
            </div>
            ` : ''}
            <div class="detail-row price-total">
              <span class="detail-label">Total Amount:</span>
              <span class="detail-value">${bookingDetails.totalPrice}</span>
            </div>
          </div>

          <div class="qr-section">
            <h4>📱 Track Your Booking</h4>
            <p>Scan this QR code or click the link to track your installation progress:</p>
            <div style="margin: 20px 0;">
              <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; display: inline-block;">
                QR Code: ${bookingDetails.qrCode}
              </div>
            </div>
            <a href="https://tradesbook.ie/track/${bookingDetails.qrCode}" class="btn">Track Booking Online</a>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <h4>📝 Customer Notes</h4>
            <p>${bookingDetails.customerNotes}</p>
          </div>

          <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <h4>✅ What Happens Next?</h4>
            <ol>
              <li><strong>Installer Assignment:</strong> A qualified installer will be assigned within 2 hours</li>
              <li><strong>Contact & Confirmation:</strong> Your installer will call to confirm the appointment</li>
              <li><strong>Professional Installation:</strong> Expert TV mounting and setup</li>
              <li><strong>Quality Check:</strong> Final testing and walkthrough</li>
              <li><strong>Payment & Review:</strong> Secure payment and feedback opportunity</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://tradesbook.ie/track/${bookingDetails.qrCode}" class="btn">Track Your Booking</a>
            <a href="https://tradesbook.ie/contact" class="btn" style="background: #6c757d;">Contact Support</a>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>tradesbook.ie</strong> - Professional Trade Services</p>
          <p>📧 bookings@tradesbook.ie | 📱 +353 1 234 5678</p>
          <p style="font-size: 0.9em; color: #666;">This is a simulated booking confirmation for testing purposes.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const success = await sendGmailEmail({
      to: customerEmail,
      subject: `Booking Confirmed #${bookingDetails.id} - TV Installation Scheduled`,
      html: htmlContent,
      from: 'noreply@tradesbook.ie'
    });

    if (success) {
      console.log('✅ Booking flow simulation email sent successfully to:', customerEmail);
      console.log('📧 Email includes:');
      console.log('   - Complete booking details and pricing breakdown');
      console.log('   - QR code tracking information');
      console.log('   - Professional HTML formatting');
      console.log('   - Next steps and contact information');
      console.log('   - Referral discount display');
    } else {
      console.log('❌ Failed to send booking flow simulation email');
    }
  } catch (error) {
    console.error('Error sending booking flow simulation:', error);
  }
}

// Execute the simulation
sendBookingFlowSimulation();