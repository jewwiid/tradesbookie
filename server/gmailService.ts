import { google } from 'googleapis';
import QRCode from 'qrcode';
import { getInstallerNotificationEmail, getValidFromEmail } from './emailConfig';
import { storage } from './storage';

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.warn('Gmail service not configured - missing required environment variables');
}

// Generate QR code as base64 data URL for email embedding
async function generateQRCodeDataURL(text: string): Promise<string> {
  try {
    console.log('Generating QR code for:', text);
    const qrDataURL = await QRCode.toDataURL(text, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    console.log('QR code generated successfully, length:', qrDataURL.length);
    return qrDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN,
});

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export async function sendReviewRequest(booking: any, installer: any, customerEmail: string, customerName: string): Promise<boolean> {
  const subject = `How was your TV installation? - Leave a review for ${installer.businessName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">How was your installation?</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Share your experience with ${installer.businessName}</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9ff;">
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-bottom: 15px;">Installation Completed</h2>
          <p style="color: #666; line-height: 1.6;">
            Hi ${customerName},<br><br>
            Thank you for choosing ${installer.businessName} for your TV installation. We hope you're enjoying your newly installed TV!
          </p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #667eea; margin-top: 0;">Installation Details</h3>
          <p><strong>Service:</strong> ${booking.serviceDescription || booking.serviceType}</p>
          <p><strong>Address:</strong> ${booking.address}</p>
          <p><strong>Completed:</strong> ${new Date(booking.completedDate).toLocaleDateString()}</p>
          <p><strong>Installer:</strong> ${installer.businessName}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h3 style="color: #667eea; margin-top: 0;">Rate Your Experience</h3>
          <p style="color: #666; margin-bottom: 20px;">
            Your feedback helps us improve our service and helps other customers make informed decisions.
          </p>
          
          <a href="https://tradesbook.ie/review/${booking.id}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 10px;">
            ⭐ Leave a Review
          </a>
        </div>
        
        <div style="background: #e8f2ff; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px; color: #555;">
            <strong>💡 Your review matters:</strong> Help other customers by sharing your experience with the installation quality, professionalism, and overall service.
          </p>
        </div>
        
        <div style="text-center; color: #888; font-size: 12px; margin-top: 30px;">
          <p>This email was sent by Tradesbook on behalf of ${installer.businessName}</p>
          <p>If you have any issues with your installation, please contact ${installer.businessName} directly.</p>
        </div>
      </div>
    </div>
  `;

  const text = `
    How was your TV installation?
    
    Hi ${customerName},
    
    Thank you for choosing ${installer.businessName} for your TV installation. We hope you're enjoying your newly installed TV!
    
    Installation Details:
    - Service: ${booking.serviceDescription || booking.serviceType}
    - Address: ${booking.address}
    - Completed: ${new Date(booking.completedDate).toLocaleDateString()}
    - Installer: ${installer.businessName}
    
    We'd love to hear about your experience! Please take a moment to leave a review at:
    https://tradesbook.ie/review/${booking.id}
    
    Your feedback helps us improve our service and helps other customers make informed decisions.
    
    Best regards,
    The Tradesbook Team
  `;

  return await sendGmailEmail({
    to: customerEmail,
    subject,
    html,
    text
  });
}

export async function sendTvSetupBookingConfirmation(booking: any): Promise<boolean> {
  const subject = `TV Setup Assistance Booking Confirmation - ${booking.fullName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">TV Setup Assistance Booked!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your remote TV setup service is confirmed</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9ff;">
        <h2 style="color: #333; margin-bottom: 20px;">Booking Details</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #667eea; margin-top: 0;">Customer Information</h3>
          <p><strong>Name:</strong> ${booking.fullName}</p>
          <p><strong>Email:</strong> ${booking.email}</p>
          <p><strong>Mobile:</strong> ${booking.mobile}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #667eea; margin-top: 0;">TV Information</h3>
          <p><strong>Brand:</strong> ${booking.tvBrand}</p>
          <p><strong>Model:</strong> ${booking.tvModel}</p>
          <p><strong>Operating System:</strong> ${booking.tvOs}</p>
          <p><strong>Year of Purchase:</strong> ${booking.yearOfPurchase}</p>
          <p><strong>Apps to Setup:</strong> ${Array.isArray(booking.streamingApps) ? booking.streamingApps.join(', ') : booking.streamingApps}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #667eea; margin-top: 0;">Service Details</h3>
          <p><strong>Service:</strong> Remote TV Setup Assistance</p>
          <p><strong>Fee:</strong> €100.00 (One-time payment)</p>
          <p><strong>Preferred Date:</strong> ${booking.preferredSetupDate ? new Date(booking.preferredSetupDate).toLocaleDateString() : 'To be scheduled'}</p>
          ${booking.additionalNotes ? `<p><strong>Notes:</strong> ${booking.additionalNotes}</p>` : ''}
        </div>
        
        <div style="background: #667eea; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h3 style="margin-top: 0;">What's Next?</h3>
          <p style="margin-bottom: 15px;">Our technical team will contact you within 24 hours to schedule your remote setup session.</p>
          <p style="margin-bottom: 0;"><strong>Contact:</strong> support@tradesbook.ie | +353851159264</p>
        </div>
      </div>
      
      <div style="background: #333; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 14px;">© 2025 tradesbook.ie - TV Setup Assistance Service</p>
      </div>
    </div>
  `;

  return sendGmailEmail({
    to: booking.email,
    subject,
    html,
    from: 'noreply@tradesbook.ie',
    replyTo: 'support@tradesbook.ie'
  });
}

export async function sendTvSetupAdminNotification(booking: any): Promise<boolean> {
  const subject = `New TV Setup Booking - ${booking.fullName} (#${booking.id})`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🚨 New TV Setup Booking</h1>
        <p style="margin: 10px 0 0 0;">Requires immediate attention</p>
      </div>
      
      <div style="padding: 20px; background: #fef2f2;">
        <h2 style="color: #333; margin-bottom: 15px;">Booking #${booking.id}</h2>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #dc2626;">
          <h3 style="color: #dc2626; margin-top: 0; font-size: 16px;">Customer Details</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${booking.fullName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${booking.email}</p>
          <p style="margin: 5px 0;"><strong>Mobile:</strong> ${booking.mobile}</p>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #333; margin-top: 0; font-size: 16px;">TV Specifications</h3>
          <p style="margin: 5px 0;"><strong>Brand & Model:</strong> ${booking.tvBrand} ${booking.tvModel}</p>
          <p style="margin: 5px 0;"><strong>OS:</strong> ${booking.tvOs}</p>
          <p style="margin: 5px 0;"><strong>Year:</strong> ${booking.yearOfPurchase}</p>
          <p style="margin: 5px 0;"><strong>Apps Needed:</strong> ${Array.isArray(booking.streamingApps) ? booking.streamingApps.join(', ') : booking.streamingApps}</p>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 8px;">
          <h3 style="color: #333; margin-top: 0; font-size: 16px;">Scheduling</h3>
          <p style="margin: 5px 0;"><strong>Preferred Date:</strong> ${booking.preferredSetupDate ? new Date(booking.preferredSetupDate).toLocaleDateString() : 'Flexible'}</p>
          <p style="margin: 5px 0;"><strong>Payment:</strong> €100.00 (Paid via Stripe)</p>
          ${booking.additionalNotes ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${booking.additionalNotes}</p>` : ''}
        </div>
        
        <div style="background: #dc2626; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-top: 20px;">
          <p style="margin: 0; font-weight: bold;">Action Required: Contact customer within 24 hours</p>
        </div>
      </div>
    </div>
  `;

  return sendGmailEmail({
    to: 'admin@tradesbook.ie',
    subject,
    html,
    from: 'support@tradesbook.ie',
    replyTo: 'support@tradesbook.ie'
  });
}

export async function sendGmailEmail(options: EmailOptions): Promise<boolean> {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.log(`EMAIL SIMULATION: To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}, Subject: ${options.subject}`);
    return true;
  }

  try {
    // Check OAuth token status
    console.log('Gmail service: Checking OAuth token...');
    const tokenInfo = await oauth2Client.getAccessToken();
    console.log('Gmail service: Access token obtained successfully');

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const fromEmail = process.env.GMAIL_USER || 'noreply@tradesbook.ie';
    const replyToEmail = process.env.GMAIL_USER || 'support@tradesbook.ie';

    console.log(`Gmail service: Sending email to ${recipients} with subject "${options.subject}"`);

    // Create proper MIME message with correct headers
    const emailContent = [
      `MIME-Version: 1.0`,
      `To: ${recipients}`,
      `From: TradesBook.ie <${fromEmail}>`,
      `Reply-To: ${replyToEmail}`,
      `Subject: ${options.subject}`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      options.html || options.text || ''
    ].join('\r\n');

    const encodedMessage = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log('Gmail API response:', {
      id: response.data.id,
      threadId: response.data.threadId,
      labelIds: response.data.labelIds
    });

    // Verify the message was sent by checking sent folder
    try {
      const sentMessage = await gmail.users.messages.get({
        userId: 'me',
        id: response.data.id!,
        format: 'metadata'
      });
      console.log('Gmail verification: Message found in sent items');
      
      // Additional delivery troubleshooting
      console.log('Gmail delivery troubleshooting:');
      console.log(`- Check ${recipients} inbox and spam folder`);
      console.log(`- Search Gmail for message ID: ${response.data.id}`);
      console.log(`- Look for sender: ${fromEmail}`);
      console.log(`- Subject line: ${options.subject}`);
    } catch (verifyError) {
      console.warn('Gmail verification: Could not verify message in sent items');
    }

    return true;
  } catch (error) {
    console.error('Gmail send error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: error && typeof error === 'object' && 'code' in error ? error.code : 'unknown',
      status: error && typeof error === 'object' && 'status' in error ? error.status : 'unknown',
      details: error && typeof error === 'object' && 'details' in error ? error.details : 'unknown'
    });
    return false;
  }
}

export async function sendBookingConfirmation(customerEmail: string, customerName: string, bookingDetails: any): Promise<boolean> {
  const subject = `Booking Confirmation - ${bookingDetails.qrCode}`;
  
  // Generate QR code image for email
  const qrCodeURL = `https://tradesbook.ie/track/${bookingDetails.qrCode}`;
  console.log('QR tracking URL:', qrCodeURL);
  const qrCodeImage = await generateQRCodeDataURL(qrCodeURL);
  console.log('QR code image generated for email:', qrCodeImage ? 'SUCCESS' : 'FAILED');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #666; }
        .qr-section { text-align: center; margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmed!</h1>
          <p>Your TV installation is scheduled</p>
        </div>
        
        <div class="content">
          <p>Dear ${customerName},</p>
          
          <p>Thank you for choosing tradesbook.ie! Your TV installation booking has been confirmed and will be processed shortly.</p>
          
          <div class="booking-details">
            <h3>Booking Details</h3>
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
              <span>${bookingDetails.qrCode}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Service:</span>
              <span>${bookingDetails.serviceType}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">TV Size:</span>
              <span>${bookingDetails.tvSize}"</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Address:</span>
              <span>${bookingDetails.address}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total Cost:</span>
              <span>€${bookingDetails.estimatedTotal || bookingDetails.totalPrice || 'N/A'}</span>
            </div>
          </div>
          
          <div class="qr-section">
            <h3>Track Your Installation</h3>
            <p>Use this QR code to track your installation progress:</p>
            ${qrCodeImage ? `<div style="text-align: center; margin: 20px 0;"><img src="${qrCodeImage}" alt="QR Code for ${bookingDetails.qrCode}" style="border: 2px solid #ddd; border-radius: 8px; max-width: 200px; height: auto;" /></div>` : '<div style="text-align: center; margin: 20px 0; padding: 20px; background: #f0f0f0; border-radius: 8px;"><p>QR Code will be available shortly</p></div>'}
            <p style="text-align: center; font-family: monospace; font-size: 14px; color: #666;"><strong>${bookingDetails.qrCode}</strong></p>
            <p style="text-align: center;"><a href="${qrCodeURL}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Online</a></p>
          </div>
          
          <h3>What happens next?</h3>
          <ol>
            <li>We'll match you with a qualified installer in your area</li>
            <li>The installer will contact you within 24 hours to schedule</li>
            <li>You'll receive updates via email and SMS</li>
            <li>Installation completed with quality guarantee</li>
          </ol>
          
          <div class="footer">
            <p><strong>This is an automated confirmation email - please do not reply to this address.</strong></p>
            <p>Need help? Contact us at <a href="mailto:support@tradesbook.ie">support@tradesbook.ie</a> or call 01-XXX-XXXX</p>
            <p>tradesbook.ie - Professional TV Installation Service</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendGmailEmail({
    to: customerEmail,
    subject,
    html,
    from: 'noreply@tradesbook.ie',
    replyTo: 'support@tradesbook.ie' // Still allows support contact if needed
  });
}

export async function sendInstallerNotification(installerEmail: string, installerName: string, bookingDetails: any): Promise<boolean> {
  // Use valid email address for testing
  const validInstallerEmail = getInstallerNotificationEmail(installerEmail);
  const subject = `💰 New Lead Available - ${bookingDetails.qrCode}`;
  
  // Generate QR code image for installer email
  const qrCodeURL = `https://tradesbook.ie/track/${bookingDetails.qrCode}`;
  const qrCodeImage = await generateQRCodeDataURL(qrCodeURL);
  
  // Calculate lead fee based on service type
  const leadFeeMap: { [key: string]: number } = {
    'table-top-small': 12,
    'bronze': 20,
    'silver': 25,
    'gold': 35
  };
  const leadFee = leadFeeMap[bookingDetails.serviceType] || 20;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Lead Available</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .lead-alert { background: #dcfce7; border: 2px solid #16a34a; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #666; }
        .earnings-highlight { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .action-buttons { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 15px 30px; margin: 0 10px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
        .primary-btn { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 New Lead Available</h1>
          <p>Premium installation opportunity in your area</p>
        </div>
        
        <div class="content">
          <div class="lead-alert">
            <h2 style="color: #16a34a; margin: 0 0 10px 0;">🎯 New Customer Request</h2>
            <p style="color: #16a34a; margin: 0; font-size: 16px;">
              A customer is looking for a TV installer in your area. Purchase this lead to get their contact details and secure the job.
            </p>
          </div>
          
          <p>Hello ${installerName},</p>
          
          <p>A new TV installation request matching your service area is now available for purchase. Review the opportunity details below:</p>
          
          <div class="booking-details">
            <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">💼 Lead Details</h3>
            <div class="detail-row">
              <span class="detail-label">Lead ID:</span>
              <span>${bookingDetails.qrCode}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Service Type:</span>
              <span>${bookingDetails.serviceType}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">TV Size:</span>
              <span>${bookingDetails.tvSize}"</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Location:</span>
              <span>${bookingDetails.address}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Difficulty Level:</span>
              <span>${bookingDetails.difficulty || 'Standard'}</span>
            </div>
          </div>

          <div class="earnings-highlight">
            <h3 style="color: #92400e; margin: 0 0 10px 0;">💰 Earnings Breakdown</h3>
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span style="color: #92400e; font-weight: bold;">Customer Pays You Directly:</span>
              <span style="color: #92400e; font-weight: bold;">€${bookingDetails.installerEarnings}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 8px 0; padding-top: 8px; border-top: 1px solid #f59e0b;">
              <span style="color: #92400e;">Lead Access Fee:</span>
              <span style="color: #92400e;">€${leadFee}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 8px 0; font-weight: bold; padding-top: 8px; border-top: 2px solid #f59e0b;">
              <span style="color: #92400e;">Your Net Profit:</span>
              <span style="color: #16a34a; font-size: 18px;">€${bookingDetails.installerEarnings - leadFee}</span>
            </div>
          </div>
          
          <div style="background: #e0f2fe; border: 1px solid #0369a1; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0369a1; margin: 0 0 10px 0;">🔐 How Lead Generation Works</h3>
            <ul style="color: #0369a1; margin: 0; padding-left: 20px;">
              <li>Customer pays you directly (cash, card, or bank transfer)</li>
              <li>No commission deducted from your earnings</li>
              <li>Purchase lead access to get customer contact details</li>
              <li>Lead fee is one-time payment for customer information</li>
            </ul>
          </div>
          
          <div class="action-buttons">
            <a href="https://tradesbook.ie/installer-dashboard" class="button primary-btn">🎯 Purchase Lead Access</a>
          </div>
          
          <p style="text-align: center; font-weight: bold; color: #dc2626;">⚡ Act Fast: Leads are available on first-come, first-served basis!</p>
          
          <div class="footer">
            <p>Dashboard: <a href="https://tradesbook.ie/installer-dashboard">tradesbook.ie/installer-dashboard</a></p>
            <p>Support: <a href="mailto:support@tradesbook.ie">support@tradesbook.ie</a></p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
              This lead notification was sent to approved installers in the service area.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendGmailEmail({
    to: validInstallerEmail,
    subject,
    html,
    from: 'support@tradesbook.ie',
    replyTo: 'admin@tradesbook.ie' // Installer replies go to admin
  });
}

export async function sendAdminNotification(subject: string, content: string, data?: any): Promise<boolean> {
  // Format data if provided - could be booking data, user registration, or installer registration
  let formattedDataSection = '';
  if (data) {
    // Handle installer registration data
    if (data.businessName && data.yearsExperience !== undefined) {
      formattedDataSection = `
        <div class="booking-details">
          <h3>Installer Registration Details</h3>
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span>${data.name || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span>${data.email || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Business Name:</span>
            <span>${data.businessName || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span>${data.phone || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Address:</span>
            <span>${data.address || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Service Area:</span>
            <span>${data.serviceArea || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Years Experience:</span>
            <span>${data.yearsExperience || 0} years</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Selected Service:</span>
            <span>${data.selectedServiceType || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Registration Date:</span>
            <span>${new Date(data.registrationDate).toLocaleString() || 'N/A'}</span>
          </div>
        </div>
      `;
    }
    // Handle user registration data
    else if (data.role && data.registrationDate) {
      formattedDataSection = `
        <div class="booking-details">
          <h3>User Registration Details</h3>
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span>${data.name || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span>${data.email || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Role:</span>
            <span>${data.role || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Registration Date:</span>
            <span>${new Date(data.registrationDate).toLocaleString() || 'N/A'}</span>
          </div>
        </div>
      `;
    }
    // Handle booking data (existing)
    else if (data.qrCode || data.totalPrice || data.estimatedTotal) {
      formattedDataSection = `
        <div class="booking-details">
          <h3>Booking Details</h3>
          <div class="detail-row">
            <span class="detail-label">Booking ID:</span>
            <span>${data.qrCode || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Service Type:</span>
            <span>${data.serviceType || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">TV Size:</span>
            <span>${data.tvSize || 'N/A'}"</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Address:</span>
            <span>${data.address || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total Price:</span>
            <span>€${data.totalPrice || data.estimatedTotal || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Installer Earnings:</span>
            <span>€${data.installerEarnings || data.estimatedPrice || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Difficulty:</span>
            <span>${data.difficulty || 'Standard'}</span>
          </div>
        </div>
      `;
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #343a46; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #666; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${subject}</h2>
          <p>tradesbook.ie Admin Notification</p>
        </div>
        
        <div class="content">
          <div style="white-space: pre-wrap;">${content}</div>
          
          ${formattedDataSection}
          
          <div class="footer">
            <p>Admin Dashboard: <a href="https://tradesbook.ie/admin">https://tradesbook.ie/admin</a></p>
            <p>Timestamp: ${new Date().toISOString()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendGmailEmail({
    to: 'jude.okun@gmail.com',
    subject: `[tradesbook.ie] ${subject}`,
    html,
    from: 'system@tradesbook.ie'
  });
}

export async function sendLeadPurchaseNotification(
  customerEmail: string,
  customerName: string,
  leadDetails: any,
  installerDetails: any
): Promise<boolean> {
  try {
    const trackingUrl = `https://tradesbook.ie/track/${leadDetails.qrCode}`;
    const qrCodeDataURL = await generateQRCodeDataURL(trackingUrl);
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Your Installation Request Has Been Accepted!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">tradesbook.ie</p>
        </div>

        <div style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h2 style="color: #155724; margin: 0 0 10px 0; font-size: 18px;">✅ Installer Assigned</h2>
            <p style="color: #155724; margin: 0;">Your TV installation request has been accepted by a professional installer.</p>
          </div>

          <div style="background-color: white; border-radius: 8px; padding: 25px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #1a202c; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              📋 Installation Details
            </h3>
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: 600; color: #4a5568;">TV Size:</span>
                <span style="color: #2d3748;">${leadDetails.tvSize}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: 600; color: #4a5568;">Service:</span>
                <span style="color: #2d3748;">${leadDetails.serviceType}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: 600; color: #4a5568;">Wall Type:</span>
                <span style="color: #2d3748;">${leadDetails.wallType}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: 600; color: #4a5568;">Address:</span>
                <span style="color: #2d3748;">${leadDetails.address}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="font-weight: 600; color: #4a5568;">Status:</span>
                <span style="color: #059669; font-weight: 600;">Installation Scheduled</span>
              </div>
            </div>
          </div>

          <div style="background-color: white; border-radius: 8px; padding: 25px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #1a202c; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              👨‍🔧 Your Installer
            </h3>
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: 600; color: #4a5568;">Name:</span>
                <span style="color: #2d3748;">${installerDetails.contactName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: 600; color: #4a5568;">Business:</span>
                <span style="color: #2d3748;">${installerDetails.businessName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: 600; color: #4a5568;">Email:</span>
                <span style="color: #2d3748;">${installerDetails.email}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: 600; color: #4a5568;">Phone:</span>
                <span style="color: #2d3748;">${installerDetails.phone}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="font-weight: 600; color: #4a5568;">Experience:</span>
                <span style="color: #2d3748;">${installerDetails.yearsExperience} years</span>
              </div>
            </div>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">📞 Next Steps</h3>
            <p style="color: #856404; margin: 0; line-height: 1.5;">
              Your installer will contact you within 24 hours to schedule the installation. 
              Please ensure you are available to discuss timing and answer any questions about your setup.
            </p>
          </div>

          ${qrCodeDataURL ? `
            <div style="text-align: center; margin-bottom: 25px;">
              <h3 style="color: #1a202c; margin: 0 0 15px 0;">📱 Track Your Installation</h3>
              <img src="${qrCodeDataURL}" alt="QR Code" style="max-width: 150px; height: auto; border: 2px solid #e2e8f0; border-radius: 8px; padding: 10px; background-color: white;" />
              <p style="color: #718096; font-size: 14px; margin: 10px 0 0 0;">
                Scan this QR code to track your installation progress
              </p>
              <p style="color: #718096; font-size: 12px; margin: 5px 0 0 0;">
                Or visit: <a href="${trackingUrl}" style="color: #3182ce;">${trackingUrl}</a>
              </p>
            </div>
          ` : ''}

          <div style="background-color: white; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <a href="${trackingUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-bottom: 15px;">
              View Installation Details
            </a>
            <p style="color: #718096; font-size: 14px; margin: 15px 0 0 0;">
              You can update the status or communicate with your installer through the tracking page.
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 12px; text-align: center;">
            <p style="margin: 0;">© 2025 tradesbook.ie - Professional TV Installation Services</p>
            <p style="margin: 5px 0 0 0;">This email was sent regarding your installation request #${leadDetails.qrCode}</p>
          </div>
        </div>
      </div>
    `;

    return await sendGmailEmail({
      to: customerEmail,
      subject: `🎯 Your TV Installation Has Been Scheduled! - tradesbook.ie`,
      html: htmlContent,
      from: getValidFromEmail('booking')
    });
  } catch (error) {
    console.error('Error sending lead purchase notification:', error);
    return false;
  }
}

export async function sendStatusUpdateNotification(
  recipientEmail: string,
  recipientName: string,
  leadDetails: any,
  newStatus: string,
  updatedBy: 'customer' | 'installer',
  message?: string
): Promise<boolean> {
  try {
    const trackingUrl = `https://tradesbook.ie/track/${leadDetails.qrCode}`;
    const statusDisplayMap = {
      'pending': 'Pending',
      'installation_scheduled': 'Installation Scheduled',
      'customer_confirmed': 'Customer Confirmed',
      'work_in_progress': 'Work in Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };

    const statusDisplay = statusDisplayMap[newStatus as keyof typeof statusDisplayMap] || newStatus;
    const updatedByDisplay = updatedBy === 'customer' ? 'Customer' : 'Installer';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Installation Status Update</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">tradesbook.ie</p>
        </div>

        <div style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h2 style="color: #0c5460; margin: 0 0 10px 0; font-size: 18px;">📋 Status Updated</h2>
            <p style="color: #0c5460; margin: 0; font-size: 16px;">
              <strong>New Status:</strong> ${statusDisplay}
            </p>
            <p style="color: #0c5460; margin: 10px 0 0 0; font-size: 14px;">
              Updated by: ${updatedByDisplay}
            </p>
          </div>

          ${message ? `
            <div style="background-color: white; border-radius: 8px; padding: 20px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #1a202c; margin: 0 0 15px 0; font-size: 16px;">💬 Message</h3>
              <p style="color: #4a5568; margin: 0; line-height: 1.5;">${message}</p>
            </div>
          ` : ''}

          <div style="background-color: white; border-radius: 8px; padding: 25px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #1a202c; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              📋 Installation Details
            </h3>
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: 600; color: #4a5568;">TV Size:</span>
                <span style="color: #2d3748;">${leadDetails.tvSize}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: 600; color: #4a5568;">Service:</span>
                <span style="color: #2d3748;">${leadDetails.serviceType}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-weight: 600; color: #4a5568;">Address:</span>
                <span style="color: #2d3748;">${leadDetails.address}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="font-weight: 600; color: #4a5568;">Current Status:</span>
                <span style="color: #059669; font-weight: 600;">${statusDisplay}</span>
              </div>
            </div>
          </div>

          <div style="background-color: white; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <a href="${trackingUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-bottom: 15px;">
              View Full Details
            </a>
            <p style="color: #718096; font-size: 14px; margin: 15px 0 0 0;">
              Click above to view the complete installation details and communicate with the other party.
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 12px; text-align: center;">
            <p style="margin: 0;">© 2025 tradesbook.ie - Professional TV Installation Services</p>
            <p style="margin: 5px 0 0 0;">This email was sent regarding your installation request #${leadDetails.qrCode}</p>
          </div>
        </div>
      </div>
    `;

    return await sendGmailEmail({
      to: recipientEmail,
      subject: `Installation Status Update: ${statusDisplay} - tradesbook.ie`,
      html: htmlContent,
      from: getValidFromEmail('booking')
    });
  } catch (error) {
    console.error('Error sending status update notification:', error);
    return false;
  }
}

export async function sendScheduleProposalNotification(
  recipientEmail: string,
  booking: any,
  negotiation: any
): Promise<boolean> {
  try {
    const proposedBy = negotiation.proposedBy === 'customer' ? 'Customer' : 'Installer';
    const proposedDate = new Date(negotiation.proposedDate).toLocaleDateString('en-IE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const trackingUrl = `https://tradesbook.ie/track/${booking.qrCode}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">📅 New Schedule Proposal</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">tradesbook.ie</p>
        </div>

        <div style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
          <div style="background-color: #e7f3ff; border: 1px solid #b6d7ff; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h2 style="color: #0056b3; margin: 0 0 10px 0; font-size: 18px;">📅 Schedule Proposal Details</h2>
            <p style="color: #0056b3; margin: 0; font-size: 16px;">
              <strong>Proposed Date:</strong> ${proposedDate}
            </p>
            <p style="color: #0056b3; margin: 10px 0 0 0; font-size: 14px;">
              <strong>Time Slot:</strong> ${negotiation.proposedTimeSlot || 'To be discussed'}
            </p>
            <p style="color: #0056b3; margin: 10px 0 0 0; font-size: 14px;">
              <strong>Proposed by:</strong> ${proposedBy}
            </p>
          </div>

          ${negotiation.proposalMessage ? `
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">💬 Message</h3>
              <p style="color: #856404; margin: 0; font-style: italic;">"${negotiation.proposalMessage}"</p>
            </div>
          ` : ''}

          <div style="background-color: white; border-radius: 8px; padding: 20px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">📋 Installation Details</h3>
            <p style="color: #4a5568; margin: 5px 0;"><strong>Service:</strong> ${booking.serviceType}</p>
            <p style="color: #4a5568; margin: 5px 0;"><strong>TV Size:</strong> ${booking.tvSize}</p>
            <p style="color: #4a5568; margin: 5px 0;"><strong>Address:</strong> ${booking.address}</p>
            <p style="color: #4a5568; margin: 5px 0;"><strong>Contact:</strong> ${booking.contactName}</p>
          </div>

          <div style="background-color: white; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <a href="${trackingUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-bottom: 15px;">
              Respond to Proposal
            </a>
            <p style="color: #718096; font-size: 14px; margin: 15px 0 0 0;">
              Click above to accept, decline, or counter-propose a different time.
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 12px; text-align: center;">
            <p style="margin: 0;">© 2025 tradesbook.ie - Professional TV Installation Services</p>
            <p style="margin: 5px 0 0 0;">This email was sent regarding your installation request #${booking.qrCode}</p>
          </div>
        </div>
      </div>
    `;

    return await sendGmailEmail({
      to: recipientEmail,
      subject: `New Schedule Proposal for TV Installation - ${proposedDate}`,
      html: htmlContent,
      from: getValidFromEmail('booking')
    });
  } catch (error) {
    console.error('Error sending schedule proposal notification:', error);
    return false;
  }
}

// Job cancellation notification
export async function sendJobCancellationNotification(booking: any, cancelledBy: string, reason?: string) {
  try {
    console.log(`Sending job cancellation notification for booking ${booking.id}`);
    
    const customerEmail = booking.contact?.email || booking.userId?.toString().includes('@') ? booking.userId : null;
    const installerEmail = booking.installer?.email;
    
    // Customer notification
    if (customerEmail) {
      const customerSubject = `TV Installation Cancelled - Booking ${booking.qrCode}`;
      const customerMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Installation Cancelled</h2>
          
          <p>Your TV installation booking has been cancelled.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
            <strong>Cancellation Details:</strong><br>
            Cancelled by: ${cancelledBy === 'customer' ? 'You' : 'The installer'}<br>
            ${reason ? `Reason: ${reason}<br>` : ''}
            Booking Reference: ${booking.qrCode}
          </div>
          
          <p><strong>What happens next:</strong></p>
          <ul>
            <li>Your booking is now available for other installers to take</li>
            <li>You'll receive new installer proposals automatically</li>
            <li>No additional charges apply</li>
          </ul>
          
          <p>We apologize for any inconvenience. You can track your booking status at any time using your QR code.</p>
          
          <p>Best regards,<br>The Tradesbook Team</p>
        </div>
      `;
      
      await sendGmailEmail({
        to: customerEmail,
        subject: customerSubject,
        html: customerMessage,
        from: getValidFromEmail('booking')
      });
      console.log(`Job cancellation email sent to customer: ${customerEmail}`);
    }
    
    // Installer notification  
    if (installerEmail) {
      const installerSubject = `Job Cancelled - Booking ${booking.qrCode}`;
      const installerMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Job Assignment Cancelled</h2>
          
          <p>The job assignment for booking ${booking.qrCode} has been cancelled.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
            <strong>Cancellation Details:</strong><br>
            Cancelled by: ${cancelledBy === 'installer' ? 'You' : 'The customer'}<br>
            ${reason ? `Reason: ${reason}<br>` : ''}
            Customer: ${booking.contact?.name || 'Customer'}<br>
            Location: ${booking.address}
          </div>
          
          <p><strong>Lead fee refund:</strong> Your lead fee has been automatically refunded to your wallet.</p>
          
          <p>This job is now available for other installers. You can find new opportunities in your dashboard.</p>
          
          <p>Best regards,<br>The Tradesbook Team</p>
        </div>
      `;
      
      await sendGmailEmail({
        to: installerEmail,
        subject: installerSubject,
        html: installerMessage,
        from: getValidFromEmail('booking')
      });
      console.log(`Job cancellation email sent to installer: ${installerEmail}`);
    }
    
  } catch (error) {
    console.error('Error sending job cancellation notification:', error);
    throw error;
  }
}

export async function sendPreInstallationReminder(
  booking: any,
  recipientType: 'customer' | 'installer'
): Promise<boolean> {
  try {
    const installationDate = new Date(booking.scheduledDate).toLocaleDateString('en-IE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const trackingUrl = `https://tradesbook.ie/track/${booking.qrCode}`;
    
    if (recipientType === 'customer') {
      // Customer reminder
      const subject = `🔔 Installation Reminder - Tomorrow at ${booking.preferredTime || 'TBD'}`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🔔 Installation Tomorrow!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">tradesbook.ie</p>
          </div>

          <div style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h2 style="color: #856404; margin: 0 0 10px 0; font-size: 18px;">⏰ Reminder: Installation Tomorrow</h2>
              <p style="color: #856404; margin: 0; font-size: 16px;">
                <strong>Date:</strong> ${installationDate}
              </p>
              <p style="color: #856404; margin: 10px 0 0 0; font-size: 14px;">
                <strong>Time:</strong> ${booking.preferredTime || 'To be confirmed by installer'}
              </p>
            </div>

            <div style="background-color: white; border-radius: 8px; padding: 20px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">📋 Installation Details</h3>
              <p style="color: #4a5568; margin: 5px 0;"><strong>Service:</strong> ${booking.serviceType}</p>
              <p style="color: #4a5568; margin: 5px 0;"><strong>TV Size:</strong> ${booking.tvSize}</p>
              <p style="color: #4a5568; margin: 5px 0;"><strong>Address:</strong> ${booking.address}</p>
              <p style="color: #4a5568; margin: 5px 0;"><strong>Contact:</strong> ${booking.contactName}</p>
              <p style="color: #4a5568; margin: 5px 0;"><strong>Phone:</strong> ${booking.contactPhone}</p>
            </div>

            <div style="background-color: #e3f2fd; border: 1px solid #2196f3; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 16px;">📝 Preparation Checklist</h3>
              <ul style="color: #1976d2; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Ensure someone is home during the installation window</li>
                <li style="margin-bottom: 8px;">Clear the wall area where the TV will be mounted</li>
                <li style="margin-bottom: 8px;">Have your TV and any purchased equipment ready</li>
                <li style="margin-bottom: 8px;">Prepare payment method for the installer</li>
                <li style="margin-bottom: 8px;">Our installer will call 30 minutes before arrival</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${trackingUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Track Your Installation</a>
            </div>

            <div style="background-color: #f1f1f1; border-radius: 8px; padding: 15px; text-align: center; margin-top: 25px;">
              <p style="color: #666; margin: 0; font-size: 12px;">Need to reschedule? Contact us or your installer immediately.</p>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 12px;">📞 Support: support@tradesbook.ie</p>
            </div>
          </div>
        </div>
      `;

      const customerEmail = await sendGmailEmail({
        to: booking.contactEmail,
        subject,
        html: htmlContent,
        from: getValidFromEmail('booking')
      });

      return customerEmail;
      
    } else {
      // Installer reminder
      const subject = `🔧 Installation Reminder - Tomorrow at ${booking.preferredTime || 'TBD'}`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🔧 Job Tomorrow!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">tradesbook.ie</p>
          </div>

          <div style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
            <div style="background-color: #dcfce7; border: 1px solid #16a34a; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h2 style="color: #15803d; margin: 0 0 10px 0; font-size: 18px;">⏰ Installation Scheduled: Tomorrow</h2>
              <p style="color: #15803d; margin: 0; font-size: 16px;">
                <strong>Date:</strong> ${installationDate}
              </p>
              <p style="color: #15803d; margin: 10px 0 0 0; font-size: 14px;">
                <strong>Time:</strong> ${booking.preferredTime || 'Please confirm with customer'}
              </p>
            </div>

            <div style="background-color: white; border-radius: 8px; padding: 20px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">📋 Job Details</h3>
              <p style="color: #4a5568; margin: 5px 0;"><strong>Service:</strong> ${booking.serviceType}</p>
              <p style="color: #4a5568; margin: 5px 0;"><strong>TV Size:</strong> ${booking.tvSize}</p>
              <p style="color: #4a5568; margin: 5px 0;"><strong>Wall Type:</strong> ${booking.wallType}</p>
              <p style="color: #4a5568; margin: 5px 0;"><strong>Address:</strong> ${booking.address}</p>
              <p style="color: #4a5568; margin: 5px 0;"><strong>Customer:</strong> ${booking.contactName}</p>
              <p style="color: #4a5568; margin: 5px 0;"><strong>Phone:</strong> ${booking.contactPhone}</p>
              ${booking.customerNotes ? `<p style="color: #4a5568; margin: 5px 0;"><strong>Notes:</strong> ${booking.customerNotes}</p>` : ''}
            </div>

            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px;">🔧 Pre-Installation Checklist</h3>
              <ul style="color: #92400e; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Confirm exact installation time with customer</li>
                <li style="margin-bottom: 8px;">Review wall type and mounting requirements</li>
                <li style="margin-bottom: 8px;">Ensure you have all necessary tools and hardware</li>
                <li style="margin-bottom: 8px;">Call customer 30 minutes before arrival</li>
                <li style="margin-bottom: 8px;">Bring payment processing equipment if needed</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tradesbook.ie/installer-dashboard" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Job Details</a>
            </div>

            <div style="background-color: #f1f1f1; border-radius: 8px; padding: 15px; text-align: center; margin-top: 25px;">
              <p style="color: #666; margin: 0; font-size: 12px;">Need to reschedule? Contact the customer and update the job status.</p>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 12px;">📞 Support: support@tradesbook.ie</p>
            </div>
          </div>
        </div>
      `;

      const installer = await storage.getInstaller(booking.installerId);
      const installerEmail = installer ? await sendGmailEmail({
        to: installer.email,
        subject,
        html: htmlContent,
        from: getValidFromEmail('installer')
      }) : false;

      return installerEmail;
    }
    
  } catch (error) {
    console.error(`Error sending pre-installation reminder to ${recipientType}:`, error);
    return false;
  }
}

export async function sendScheduleConfirmationNotification(
  booking: any,
  negotiation: any
): Promise<boolean> {
  try {
    const confirmedDate = new Date(negotiation.proposedDate).toLocaleDateString('en-IE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const trackingUrl = `https://tradesbook.ie/track/${booking.qrCode}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">✅ Installation Scheduled!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">tradesbook.ie</p>
        </div>

        <div style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h2 style="color: #155724; margin: 0 0 10px 0; font-size: 18px;">🎉 Schedule Confirmed</h2>
            <p style="color: #155724; margin: 0; font-size: 16px;">
              <strong>Installation Date:</strong> ${confirmedDate}
            </p>
            <p style="color: #155724; margin: 10px 0 0 0; font-size: 14px;">
              <strong>Time Slot:</strong> ${negotiation.proposedTimeSlot || 'To be confirmed'}
            </p>
          </div>

          <div style="background-color: white; border-radius: 8px; padding: 20px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">📋 Installation Details</h3>
            <p style="color: #4a5568; margin: 5px 0;"><strong>Service:</strong> ${booking.serviceType}</p>
            <p style="color: #4a5568; margin: 5px 0;"><strong>TV Size:</strong> ${booking.tvSize}</p>
            <p style="color: #4a5568; margin: 5px 0;"><strong>Address:</strong> ${booking.address}</p>
            <p style="color: #4a5568; margin: 5px 0;"><strong>Contact:</strong> ${booking.contactName}</p>
            <p style="color: #4a5568; margin: 5px 0;"><strong>Phone:</strong> ${booking.contactPhone}</p>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">📝 Next Steps</h3>
            <ul style="color: #856404; margin: 0; padding-left: 20px;">
              <li>Both parties will receive confirmation details</li>
              <li>Customer should prepare the installation area</li>
              <li>Installer will arrive at the agreed time</li>
              <li>Any changes should be communicated through the platform</li>
            </ul>
          </div>

          <div style="background-color: white; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <a href="${trackingUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-bottom: 15px;">
              View Installation Details
            </a>
            <p style="color: #718096; font-size: 14px; margin: 15px 0 0 0;">
              Click above to view full details and communicate with the other party if needed.
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 12px; text-align: center;">
            <p style="margin: 0;">© 2025 tradesbook.ie - Professional TV Installation Services</p>
            <p style="margin: 5px 0 0 0;">This email was sent regarding your installation request #${booking.qrCode}</p>
          </div>
        </div>
      </div>
    `;

    // Send to both customer and installer
    const customerEmail = await sendGmailEmail({
      to: booking.contactEmail,
      subject: `TV Installation Scheduled - ${confirmedDate}`,
      html: htmlContent,
      from: getValidFromEmail('booking')
    });

    const installer = await storage.getInstaller(booking.installerId);
    const installerEmail = installer ? await sendGmailEmail({
      to: installer.email,
      subject: `Installation Confirmed - ${confirmedDate}`,
      html: htmlContent,
      from: getValidFromEmail('installer')
    }) : true;

    return customerEmail && installerEmail;
  } catch (error) {
    console.error('Error sending schedule confirmation notification:', error);
    return false;
  }
}



export async function sendInstallerRejectionEmail(installerEmail: string, installerName: string, businessName: string, adminComments?: string): Promise<boolean> {
  try {
    console.log(`Sending installer rejection email to: ${installerEmail}`);
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Application Status Update</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">tradesbook.ie</p>
        </div>

        <div style="padding: 30px; background-color: #fef2f2; border-radius: 0 0 8px 8px;">
          <div style="background-color: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h2 style="color: #dc2626; margin: 0 0 15px 0; font-size: 20px;">Application Not Approved</h2>
            <p style="color: #dc2626; margin: 0; font-size: 16px; line-height: 1.5;">
              Dear ${installerName}, thank you for your interest in joining tradesbook.ie as an installer for <strong>${businessName}</strong>. 
              After careful review, we are unable to approve your application at this time.
            </p>
          </div>

          ${adminComments ? `
            <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #d97706; margin: 0 0 10px 0; font-size: 16px;">💬 Feedback from Our Review Team</h3>
              <p style="color: #d97706; margin: 0; font-style: italic;">"${adminComments}"</p>
            </div>
          ` : ''}

          <div style="background-color: white; border-radius: 8px; padding: 25px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px;">📋 What This Means</h3>
            
            <div style="margin-bottom: 15px;">
              <h4 style="color: #4a5568; margin: 0 0 8px 0; font-size: 16px;">1. Application Requirements</h4>
              <p style="color: #718096; margin: 0; line-height: 1.4;">
                Our platform maintains high standards to ensure quality service for customers. Applications are reviewed based on experience, credentials, and service area coverage.
              </p>
            </div>
            
            <div style="margin-bottom: 15px;">
              <h4 style="color: #4a5568; margin: 0 0 8px 0; font-size: 16px;">2. Future Opportunities</h4>
              <p style="color: #718096; margin: 0; line-height: 1.4;">
                You may reapply in the future if your business circumstances change or if you gain additional experience and certifications.
              </p>
            </div>
          </div>

          <div style="background-color: white; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="color: #4a5568; font-size: 16px; margin: 0 0 15px 0; line-height: 1.5;">
              If you have questions about this decision or would like guidance on strengthening a future application, please contact our support team.
            </p>
            <a href="mailto:support@tradesbook.ie" style="display: inline-block; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Contact Support Team
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 12px; text-align: center;">
            <p style="margin: 0;">© 2025 tradesbook.ie - Professional TV Installation Services</p>
            <p style="margin: 5px 0 0 0;">Thank you for your interest in our platform</p>
          </div>
        </div>
      </div>
    `;

    return await sendGmailEmail({
      to: installerEmail,
      subject: "Application Status Update - tradesbook.ie",
      html: htmlContent,
      from: getValidFromEmail('installer')
    });
  } catch (error) {
    console.error('Error sending installer rejection email:', error);
    return false;
  }
}

export async function sendInstallerApprovalEmail(
  installerEmail: string, 
  installerName: string, 
  businessName: string,
  adminScore?: number,
  adminComments?: string
): Promise<boolean> {
  try {
    console.log(`Sending installer approval email to: ${installerEmail}`);
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Application Approved!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Welcome to tradesbook.ie</p>
        </div>

        <div style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h2 style="color: #155724; margin: 0 0 10px 0; font-size: 20px;">Congratulations!</h2>
            <p style="color: #155724; margin: 0; font-size: 16px;">
              ${installerName}, your installer application for <strong>${businessName}</strong> has been approved and you can now access the platform.
            </p>
          </div>

          ${adminScore ? `
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">Application Score</h3>
              <p style="color: #856404; margin: 0; font-size: 18px; font-weight: bold;">${adminScore}/10</p>
            </div>
          ` : ''}

          ${adminComments ? `
            <div style="background-color: #e7f3ff; border: 1px solid #b6d7ff; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #0056b3; margin: 0 0 10px 0; font-size: 16px;">Admin Feedback</h3>
              <p style="color: #0056b3; margin: 0; font-style: italic;">"${adminComments}"</p>
            </div>
          ` : ''}

          <div style="background-color: white; border-radius: 8px; padding: 20px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">Getting Started</h3>
            <ol style="color: #4a5568; padding-left: 20px;">
              <li style="margin-bottom: 10px;">Log into your installer dashboard using your registered email and password</li>
              <li style="margin-bottom: 10px;">Browse available installation requests in your service area</li>
              <li style="margin-bottom: 10px;">Purchase leads that match your expertise and availability</li>
              <li style="margin-bottom: 10px;">Contact customers directly after purchasing their contact details</li>
              <li>Complete installations and build your reputation with customer reviews</li>
            </ol>
          </div>

          <div style="background-color: white; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <a href="https://tradesbook.ie/installer-login" style="display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin-bottom: 15px;">
              Access Dashboard Now
            </a>
            <p style="color: #718096; font-size: 14px; margin: 15px 0 0 0;">
              Start earning with installation requests immediately!
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 12px; text-align: center;">
            <p style="margin: 0;">© 2025 tradesbook.ie - Professional TV Installation Services</p>
            <p style="margin: 5px 0 0 0;">Welcome to Ireland's leading TV installation platform</p>
          </div>
        </div>
      </div>
    `;

    return await sendGmailEmail({
      to: installerEmail,
      subject: "Application Approved - Welcome to tradesbook.ie!",
      html: htmlContent,
      from: getValidFromEmail('installer')
    });
  } catch (error) {
    console.error('Error sending installer approval email:', error);
    return false;
  }
}

export async function sendInstallerWelcomeEmail(installerEmail: string, installerName: string, businessName: string): Promise<boolean> {
  try {
    console.log(`Sending installer welcome email to: ${installerEmail}`);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to tradesbook.ie - Installer Registration Confirmed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .welcome-card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .steps-list { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .step-item { padding: 12px 0; border-bottom: 1px solid #eee; display: flex; align-items: flex-start; }
            .step-number { background: #667eea; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 15px; flex-shrink: 0; }
            .step-content { flex: 1; }
            .step-title { font-weight: bold; color: #333; margin-bottom: 4px; }
            .step-desc { color: #666; font-size: 14px; }
            .highlight-box { background: #e3f2fd; border: 1px solid #2196f3; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to tradesbook.ie!</h1>
              <p>Your installer account has been created successfully</p>
            </div>
            
            <div class="content">
              <div class="welcome-card">
                <h2>Hello ${installerName}!</h2>
                <p>Thank you for registering <strong>${businessName}</strong> with tradesbook.ie. Your installer account has been created and is now pending admin approval.</p>
              </div>

              <div class="highlight-box">
                <strong>⏰ Approval Timeline:</strong> Your account will be reviewed and approved within 24-48 hours. You'll receive another email once you're approved to start receiving job leads.
              </div>

              <div class="steps-list">
                <h3>Next Steps:</h3>
                
                <div class="step-item">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <div class="step-title">Sign In & Complete Profile</div>
                    <div class="step-desc">Use your email and password to sign in and complete your installer profile with service areas and specialties.</div>
                  </div>
                </div>

                <div class="step-item">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <div class="step-title">Wait for Admin Approval</div>
                    <div class="step-desc">Our team will review your registration and approve your account within 24-48 hours.</div>
                  </div>
                </div>

                <div class="step-item">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <div class="step-title">Start Receiving Job Leads</div>
                    <div class="step-desc">Once approved, you'll receive real-time job notifications and can purchase leads for €12-€35 per job.</div>
                  </div>
                </div>

                <div class="step-item">
                  <div class="step-number">4</div>
                  <div class="step-content">
                    <div class="step-title">Earn Your Full Rate</div>
                    <div class="step-desc">Customers pay you directly (cash, card, or bank transfer) for the full installation amount.</div>
                  </div>
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://tradesbook.ie/installer-login" class="button">Sign In to Your Dashboard</a>
              </div>

              <div class="highlight-box">
                <strong>Need Help?</strong> If you have any questions about the registration process or platform features, please contact us at <a href="mailto:support@tradesbook.ie">support@tradesbook.ie</a>
              </div>
            </div>

            <div class="footer">
              <p>© 2025 tradesbook.ie - Professional TV Installation Platform</p>
              <p>This email was sent to confirm your installer registration for ${businessName}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const success = await sendGmailEmail({
      to: installerEmail,
      subject: 'Welcome to tradesbook.ie - Registration Confirmed',
      html: htmlContent,
      from: getValidFromEmail('installer'),
      replyTo: 'support@tradesbook.ie'
    });

    if (success) {
      console.log(`Installer welcome email sent successfully to: ${installerEmail}`);
    }

    return success;
  } catch (error) {
    console.error('Error sending installer welcome email:', error);
    return false;
  }
}

export async function sendInstallerInvitationEmail(
  email: string,
  name: string,
  businessName: string,
  password: string,
  invitationDetails: any
): Promise<boolean> {
  try {
    const subject = `Invitation to Join TradesBook.ie - Professional TV Installation Platform`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">You're Invited to TradesBook.ie!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Professional TV Installation Platform</p>
        </div>

        <div style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
          <div style="background-color: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h2 style="color: #2e7d32; margin: 0 0 10px 0; font-size: 18px;">Join Our Network</h2>
            <p style="color: #2e7d32; margin: 0; font-size: 16px;">
              <strong>Hello ${name},</strong><br>
              You've been invited to join TradesBook.ie as a professional TV installer for ${businessName || 'your business'}.
            </p>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 16px;">Your Login Credentials</h3>
            <div style="background-color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #f39c12;">
              <p style="color: #2d3748; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
              <p style="color: #2d3748; margin: 5px 0;"><strong>Password:</strong> <code style="background: #f1f1f1; padding: 2px 6px; border-radius: 3px; font-weight: bold;">${password}</code></p>
            </div>
            <p style="color: #856404; margin: 15px 0 0 0; font-size: 14px;">
              <em>💡 You can change this password after logging in or contact admin for assistance.</em>
            </p>
          </div>

          <div style="background-color: white; border-radius: 8px; padding: 20px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px;">💼 Why Join TradesBook.ie?</h3>
            <ul style="color: #4a5568; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Access to verified TV installation leads in your area</li>
              <li style="margin-bottom: 8px;">Secure payment processing and lead management</li>
              <li style="margin-bottom: 8px;">Professional platform to grow your business</li>
              <li style="margin-bottom: 8px;">Tools to communicate with customers efficiently</li>
            </ul>
          </div>

          <div style="background-color: white; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <a href="https://tradesbook.ie/installer-login" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-bottom: 15px;">
              Login to Your Account
            </a>
            <p style="color: #718096; font-size: 14px; margin: 15px 0 0 0;">
              Click above to access your installer dashboard and start receiving leads.
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 12px; text-align: center;">
            <p style="margin: 0;">© 2025 tradesbook.ie - Professional TV Installation Services</p>
            <p style="margin: 5px 0 0 0;">Need help? Contact us at support@tradesbook.ie</p>
          </div>
        </div>
      </div>
    `;

    return await sendGmailEmail({
      to: email,
      subject,
      html,
      from: getValidFromEmail('admin'),
      replyTo: 'support@tradesbook.ie'
    });
  } catch (error) {
    console.error('Error sending installer invitation email:', error);
    return false;
  }
}

export async function sendProfileCompletionInvitationEmail(
  email: string,
  name: string,
  completionToken: string,
  invitationDetails: any
): Promise<boolean> {
  try {
    const subject = `Complete Your TradesBook.ie Professional Profile - Action Required`;
    
    const completionUrl = `https://tradesbook.ie/complete-profile/${completionToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🚀 Complete Your Professional Profile</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">TradesBook.ie - TV Installation Professional Network</p>
        </div>

        <div style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
          <div style="background-color: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h2 style="color: #2e7d32; margin: 0 0 10px 0; font-size: 18px;">👋 Hello ${name}!</h2>
            <p style="color: #2e7d32; margin: 0; font-size: 16px;">
              An admin has created a basic profile for you on TradesBook.ie. To start receiving TV installation leads, please complete your full professional profile.
            </p>
          </div>

          <div style="background-color: white; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <a href="${completionUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-bottom: 15px; font-size: 16px;">
              Complete My Profile Now
            </a>
            <p style="color: #718096; font-size: 14px; margin: 15px 0 0 0;">
              This secure link is unique to you and will expire in 7 days.
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 12px; text-align: center;">
            <p style="margin: 0;">© 2025 tradesbook.ie - Professional TV Installation Services</p>
            <p style="margin: 5px 0 0 0;">Need help? Contact us at support@tradesbook.ie</p>
            <p style="margin: 10px 0 0 0;">Created by: ${invitationDetails.createdBy}</p>
          </div>
        </div>
      </div>
    `;

    return await sendGmailEmail({
      to: email,
      subject,
      html,
      from: getValidFromEmail('admin'),
      replyTo: 'support@tradesbook.ie'
    });
  } catch (error) {
    console.error('Error sending profile completion invitation email:', error);
    return false;
  }
}