import { google } from 'googleapis';
import QRCode from 'qrcode';
import { getInstallerNotificationEmail, getValidFromEmail } from './emailConfig';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

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
    const fromEmail = options.from || 'noreply@tradesbook.ie';
    const replyToEmail = options.replyTo || 'support@tradesbook.ie';

    console.log(`Gmail service: Sending email to ${recipients} with subject "${options.subject}"`);

    // Create proper MIME message with correct headers
    const emailContent = [
      `MIME-Version: 1.0`,
      `To: ${recipients}`,
      `From: ${fromEmail}`,
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
        id: response.data.id,
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
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details
    });
    return false;
  }
}

export async function sendBookingConfirmation(customerEmail: string, customerName: string, bookingDetails: any): Promise<boolean> {
  const subject = `Booking Confirmation - ${bookingDetails.qrCode}`;
  
  // Generate QR code image for email
  const qrCodeURL = `${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.replit.app` : 'http://localhost:5000'}/track/${bookingDetails.qrCode}`;
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
              <span>€${bookingDetails.totalPrice}</span>
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
  const subject = `New Installation Request - ${bookingDetails.qrCode}`;
  
  // Generate QR code image for installer email
  const qrCodeURL = `${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.replit.app` : 'http://localhost:5000'}/track/${bookingDetails.qrCode}`;
  const qrCodeImage = await generateQRCodeDataURL(qrCodeURL);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Installation Request</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #666; }
        .action-buttons { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 12px 24px; margin: 0 10px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .accept-btn { background: #28a745; color: white; }
        .decline-btn { background: #dc3545; color: white; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Installation Request</h1>
          <p>Job opportunity in your area</p>
        </div>
        
        <div class="content">
          <p>Hello ${installerName},</p>
          
          <p>A new TV installation request has been submitted in your service area. Review the details below and respond quickly to secure this job.</p>
          
          <div class="booking-details">
            <h3>Job Details</h3>
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
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
              <span class="detail-label">Your Earnings:</span>
              <span>€${bookingDetails.installerEarnings}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Difficulty:</span>
              <span>${bookingDetails.difficulty || 'Standard'}</span>
            </div>
          </div>
          
          <div class="qr-section" style="text-align: center; margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h3>Job QR Code</h3>
            <p>Scan this QR code on-site for quick job verification:</p>
            ${qrCodeImage ? `<div style="margin: 15px 0;"><img src="${qrCodeImage}" alt="QR Code for ${bookingDetails.qrCode}" style="border: 2px solid #ddd; border-radius: 8px; max-width: 200px; height: auto;" /></div>` : '<div style="margin: 15px 0; padding: 20px; background: #f0f0f0; border-radius: 8px;"><p>QR Code will be available shortly</p></div>'}
            <p style="font-family: monospace; font-size: 14px; color: #666;"><strong>${bookingDetails.qrCode}</strong></p>
          </div>
          
          <div class="action-buttons">
            <a href="https://tradesbook.ie/installer-dashboard" class="button accept-btn">View Dashboard</a>
          </div>
          
          <p><strong>Response Time:</strong> First-come, first-served basis. Login to your dashboard to accept or decline this request.</p>
          
          <div class="footer">
            <p>Login: <a href="https://tradesbook.ie/installer-login">tradesbook.ie/installer-login</a></p>
            <p>Support: <a href="mailto:installers@tradesbook.ie">installers@tradesbook.ie</a></p>
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
    from: 'installer@tradesbook.ie',
    replyTo: 'admin@tradesbook.ie' // Installer replies go to admin
  });
}

export async function sendAdminNotification(subject: string, content: string, data?: any): Promise<boolean> {
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
        .data-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap; font-family: monospace; font-size: 12px; }
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
          
          ${data ? `<div class="data-section">${JSON.stringify(data, null, 2)}</div>` : ''}
          
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
    to: 'admin@tradesbook.ie',
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
      subject: `📋 Installation Status Update: ${statusDisplay} - tradesbook.ie`,
      html: htmlContent,
      from: getValidFromEmail('booking')
    });
  } catch (error) {
    console.error('Error sending status update notification:', error);
    return false;
  }
}