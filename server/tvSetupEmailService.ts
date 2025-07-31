import { sendGmailEmail } from './gmailService';
import { EMAIL_CONFIG } from './emailConfig';
import type { TvSetupBooking } from '@shared/schema';

export async function sendTvSetupConfirmationEmail(booking: TvSetupBooking): Promise<boolean> {
  try {
    const subject = `TV Setup Service Booking Confirmed - Booking #${booking.id}`;
    
    const streamingAppsText = Array.isArray(booking.streamingApps) 
      ? booking.streamingApps.join(', ') 
      : 'None specified';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">TV Setup Service Confirmed</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your booking has been successfully confirmed</p>
        </div>
        
        <div style="padding: 30px; background: #fff;">
          <h2 style="color: #1E40AF; margin: 0 0 20px 0;">Hello ${booking.name}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Thank you for booking our TV Setup Assistance service. We've received your request and our team will contact you within 24 hours to schedule your setup session.
          </p>
          
          <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1E40AF; margin: 0 0 15px 0;">Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Booking ID:</td><td style="padding: 8px 0; color: #6B7280;">#${booking.id}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">TV Brand:</td><td style="padding: 8px 0; color: #6B7280;">${booking.tvBrand}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">TV Model:</td><td style="padding: 8px 0; color: #6B7280;">${booking.tvModel}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Smart TV:</td><td style="padding: 8px 0; color: #6B7280;">${booking.isSmartTv}</td></tr>
              ${booking.tvOs ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">TV OS:</td><td style="padding: 8px 0; color: #6B7280;">${booking.tvOs}</td></tr>` : ''}
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Streaming Apps:</td><td style="padding: 8px 0; color: #6B7280;">${streamingAppsText}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Payment Status:</td><td style="padding: 8px 0; color: #10B981; font-weight: bold;">€100.00 - Completed</td></tr>
            </table>
          </div>

          <div style="background: #EEF2FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1E40AF; margin: 0 0 15px 0;">What Happens Next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.6;">
              <li>Our team will contact you within 24 hours to schedule your setup session</li>
              <li>We'll prepare your streaming app login credentials</li>
              <li>You'll receive login details via email after setup is completed</li>
              <li>Professional remote assistance for all app installations and configurations</li>
            </ul>
          </div>

          <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <h3 style="color: #92400E; margin: 0 0 10px 0;">📞 Contact Information</h3>
            <p style="margin: 0; color: #92400E; line-height: 1.6;">
              If you have any questions or need to reschedule, please contact us at:<br>
              <strong>Email:</strong> support@tradesbook.ie<br>
              <strong>Phone:</strong> Available in your confirmation email
            </p>
          </div>

          <p style="font-size: 14px; color: #6B7280; margin: 30px 0 0 0; text-align: center;">
            Thank you for choosing TradesBook.ie for your TV setup needs!
          </p>
        </div>
      </div>
    `;

    await sendGmailEmail(booking.email, subject, htmlContent, EMAIL_CONFIG.SUPPORT);
    return true;
  } catch (error) {
    console.error('Failed to send TV setup confirmation email:', error);
    return false;
  }
}

export async function sendTvSetupAdminNotification(booking: TvSetupBooking): Promise<boolean> {
  try {
    const subject = `New TV Setup Booking - Requires Admin Action #${booking.id}`;
    
    const streamingAppsText = Array.isArray(booking.streamingApps) 
      ? booking.streamingApps.join(', ') 
      : 'None specified';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #DC2626, #B91C1C); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🚨 New TV Setup Booking</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Action Required - Login Credentials Needed</p>
        </div>
        
        <div style="padding: 30px; background: #fff;">
          <h2 style="color: #DC2626; margin: 0 0 20px 0;">Admin Action Required</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            A new TV setup booking has been confirmed and requires admin preparation of login credentials.
          </p>
          
          <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
            <h3 style="color: #DC2626; margin: 0 0 15px 0;">Customer Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Booking ID:</td><td style="padding: 8px 0; color: #6B7280;">#${booking.id}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Customer:</td><td style="padding: 8px 0; color: #6B7280;">${booking.name}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td><td style="padding: 8px 0; color: #6B7280;">${booking.email}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Mobile:</td><td style="padding: 8px 0; color: #6B7280;">${booking.mobile}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">TV Brand:</td><td style="padding: 8px 0; color: #6B7280;">${booking.tvBrand}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">TV Model:</td><td style="padding: 8px 0; color: #6B7280;">${booking.tvModel}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Smart TV:</td><td style="padding: 8px 0; color: #6B7280;">${booking.isSmartTv}</td></tr>
              ${booking.tvOs ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">TV OS:</td><td style="padding: 8px 0; color: #6B7280;">${booking.tvOs}</td></tr>` : ''}
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Year:</td><td style="padding: 8px 0; color: #6B7280;">${booking.yearOfPurchase}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Apps Requested:</td><td style="padding: 8px 0; color: #6B7280;">${streamingAppsText}</td></tr>
              ${booking.additionalNotes ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Notes:</td><td style="padding: 8px 0; color: #6B7280;">${booking.additionalNotes}</td></tr>` : ''}
            </table>
          </div>

          <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <h3 style="color: #92400E; margin: 0 0 15px 0;">📋 Required Actions</h3>
            <ol style="margin: 0; padding-left: 20px; color: #92400E; line-height: 1.8;">
              <li>Contact customer to schedule setup session</li>
              <li>Prepare login credentials for requested streaming apps</li>
              <li>Update booking status in admin dashboard</li>
              <li>Add login credentials to booking record</li>
              <li>Send credentials to customer after setup completion</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://tradesbook.ie/admin/tv-setup" style="background: #DC2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Manage This Booking
            </a>
          </div>

          <p style="font-size: 14px; color: #6B7280; margin: 30px 0 0 0; text-align: center;">
            Please process this booking within 24 hours to maintain service quality.
          </p>
        </div>
      </div>
    `;

    await sendGmailEmail(EMAIL_CONFIG.ADMIN, subject, htmlContent, EMAIL_CONFIG.NOREPLY);
    return true;
  } catch (error) {
    console.error('Failed to send TV setup admin notification:', error);
    return false;
  }
}

export async function sendTvSetupStatusUpdateEmail(booking: TvSetupBooking, newStatus: string): Promise<boolean> {
  try {
    const statusMessages: Record<string, string> = {
      'pending': 'Your booking is being processed',
      'scheduled': 'Your setup session has been scheduled',
      'in_progress': 'Your TV setup is currently in progress',
      'completed': 'Your TV setup has been completed successfully',
      'cancelled': 'Your booking has been cancelled'
    };

    const statusColors: Record<string, string> = {
      'pending': '#F59E0B',
      'scheduled': '#3B82F6',
      'in_progress': '#10B981',
      'completed': '#059669',
      'cancelled': '#EF4444'
    };

    const subject = `TV Setup Status Update - Booking #${booking.id}`;
    
    const streamingAppsText = Array.isArray(booking.streamingApps) 
      ? booking.streamingApps.join(', ') 
      : 'None specified';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">TV Setup Status Update</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Booking #${booking.id}</p>
        </div>
        
        <div style="padding: 30px; background: #fff;">
          <h2 style="color: #1E40AF; margin: 0 0 20px 0;">Hello ${booking.name}!</h2>
          
          <div style="background: ${statusColors[newStatus] || '#F59E0B'}; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0; font-size: 20px;">Status: ${newStatus.toUpperCase()}</h3>
            <p style="margin: 10px 0 0 0; font-size: 16px;">${statusMessages[newStatus] || 'Status updated'}</p>
          </div>
          
          <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1E40AF; margin: 0 0 15px 0;">Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Booking ID:</td><td style="padding: 8px 0; color: #6B7280;">#${booking.id}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">TV Brand:</td><td style="padding: 8px 0; color: #6B7280;">${booking.tvBrand}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">TV Model:</td><td style="padding: 8px 0; color: #6B7280;">${booking.tvModel}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Streaming Apps:</td><td style="padding: 8px 0; color: #6B7280;">${streamingAppsText}</td></tr>
            </table>
          </div>

          ${newStatus === 'completed' && booking.appUsername && booking.appPassword ? `
          <div style="background: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
            <h3 style="color: #065F46; margin: 0 0 15px 0;">🎉 Your Login Credentials</h3>
            <p style="margin: 0 0 15px 0; color: #065F46; line-height: 1.6;">
              Your TV setup is complete! Here are your streaming app login credentials:
            </p>
            <div style="background: white; padding: 15px; border-radius: 6px; font-family: monospace;">
              <p style="margin: 0 0 10px 0; color: #374151;"><strong>Username:</strong> ${booking.appUsername}</p>
              <p style="margin: 0; color: #374151;"><strong>Password:</strong> ${booking.appPassword}</p>
            </div>
            <p style="margin: 15px 0 0 0; color: #065F46; font-size: 14px;">
              Please save these credentials in a secure location. You can now enjoy all your streaming apps!
            </p>
          </div>
          ` : ''}

          ${newStatus === 'completed' ? `
          <div style="background: #EEF2FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1E40AF; margin: 0 0 15px 0;">🎯 Setup Complete!</h3>
            <p style="margin: 0; color: #374151; line-height: 1.6;">
              Your TV setup is now complete. All requested streaming apps have been configured and are ready to use. 
              If you experience any issues, please contact our support team.
            </p>
          </div>
          ` : ''}

          <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <h3 style="color: #92400E; margin: 0 0 10px 0;">📞 Need Help?</h3>
            <p style="margin: 0; color: #92400E; line-height: 1.6;">
              If you have any questions, please contact us at:<br>
              <strong>Email:</strong> support@tradesbook.ie
            </p>
          </div>

          <p style="font-size: 14px; color: #6B7280; margin: 30px 0 0 0; text-align: center;">
            Thank you for choosing TradesBook.ie for your TV setup needs!
          </p>
        </div>
      </div>
    `;

    await sendGmailEmail(booking.email, subject, htmlContent, EMAIL_CONFIG.SUPPORT);
    return true;
  } catch (error) {
    console.error('Failed to send TV setup status update email:', error);
    return false;
  }
}

export async function sendTvSetupCredentialsEmail(booking: TvSetupBooking): Promise<boolean> {
  try {
    if (!booking.appUsername || !booking.appPassword) {
      throw new Error('Login credentials not available for booking');
    }

    const subject = `Your TV Setup Login Credentials - Booking #${booking.id}`;
    
    const streamingAppsText = Array.isArray(booking.streamingApps) 
      ? booking.streamingApps.join(', ') 
      : 'None specified';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🔐 Your Login Credentials</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your TV setup is complete!</p>
        </div>
        
        <div style="padding: 30px; background: #fff;">
          <h2 style="color: #10B981; margin: 0 0 20px 0;">Hello ${booking.name}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Your TV setup has been completed successfully! Below are your login credentials for the streaming apps that were configured on your TV.
          </p>
          
          <div style="background: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
            <h3 style="color: #065F46; margin: 0 0 15px 0;">🔑 Your Login Credentials</h3>
            <table style="width: 100%; border-collapse: collapse; background: white; padding: 15px; border-radius: 6px;">
              <tr><td style="padding: 12px; font-weight: bold; color: #374151; border-bottom: 1px solid #E5E7EB;">Username:</td><td style="padding: 12px; color: #6B7280; border-bottom: 1px solid #E5E7EB; font-family: monospace; font-size: 16px; font-weight: bold;">${booking.appUsername}</td></tr>
              <tr><td style="padding: 12px; font-weight: bold; color: #374151;">Password:</td><td style="padding: 12px; color: #6B7280; font-family: monospace; font-size: 16px; font-weight: bold;">${booking.appPassword}</td></tr>
            </table>
          </div>

          <div style="background: #EEF2FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1E40AF; margin: 0 0 15px 0;">📱 Configured Apps</h3>
            <p style="margin: 0; color: #1E40AF; font-weight: bold;">${streamingAppsText}</p>
          </div>

          <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <h3 style="color: #92400E; margin: 0 0 15px 0;">⚠️ Important Security Notes</h3>
            <ul style="margin: 0; padding-left: 20px; color: #92400E; line-height: 1.6;">
              <li>Keep these credentials secure and do not share them</li>
              <li>These credentials work for the apps configured on your TV</li>
              <li>If you forget these details, contact support for assistance</li>
              <li>You can now enjoy your streaming services!</li>
            </ul>
          </div>

          <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin: 0 0 15px 0;">📞 Need Help?</h3>
            <p style="margin: 0; color: #6B7280; line-height: 1.6;">
              If you experience any issues with your apps or login credentials, please contact our support team:<br>
              <strong>Email:</strong> support@tradesbook.ie<br>
              <strong>Hours:</strong> Monday - Friday, 9AM - 6PM
            </p>
          </div>

          <p style="font-size: 14px; color: #6B7280; margin: 30px 0 0 0; text-align: center;">
            Thank you for choosing TradesBook.ie! Enjoy your streaming experience.
          </p>
        </div>
      </div>
    `;

    await sendGmailEmail(booking.email, subject, htmlContent, EMAIL_CONFIG.SUPPORT);
    return true;
  } catch (error) {
    console.error('Failed to send TV setup credentials email:', error);
    return false;
  }
}