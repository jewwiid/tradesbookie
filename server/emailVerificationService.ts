import crypto from 'crypto';
import { sendGmailEmail } from './gmailService';
import { storage } from './storage';

export interface EmailVerificationResult {
  success: boolean;
  message: string;
  verificationToken?: string;
}

export async function generateVerificationToken(): Promise<string> {
  return crypto.randomBytes(32).toString('hex');
}

export async function sendVerificationEmail(
  email: string, 
  firstName: string, 
  verificationToken: string
): Promise<boolean> {
  const verificationUrl = `https://tradesbook.ie/verify-email?token=${verificationToken}`;
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - tradesbook.ie</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
            .verification-code { background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 16px; text-align: center; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to tradesbook.ie!</h1>
                <p>Verify your email to get started</p>
            </div>
            
            <div class="content">
                <h2>Hello ${firstName}!</h2>
                
                <p>Thank you for creating an account with tradesbook.ie. To complete your registration and start using our AI-powered TV installation booking service, please verify your email address.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <div class="verification-code">${verificationUrl}</div>
                
                <h3>What happens after verification?</h3>
                <ul>
                    <li>✅ Unlimited AI room visualizations</li>
                    <li>✅ Complete booking and payment process</li>
                    <li>✅ Booking history & QR tracking</li>
                    <li>✅ Priority customer support</li>
                    <li>✅ Exclusive discounts & referral rewards</li>
                </ul>
                
                <p><strong>This verification link will expire in 24 hours.</strong></p>
                
                <p>If you didn't create an account with us, please ignore this email.</p>
                
                <p>Welcome to the future of TV installation!</p>
                
                <p>Best regards,<br>
                The tradesbook.ie Team</p>
            </div>
            
            <div class="footer">
                <p>© 2025 tradesbook.ie - Professional TV Installation Services</p>
                <p>This email was sent to ${email}</p>
                <p><a href="mailto:support@tradesbook.ie">Contact Support</a> | <a href="https://tradesbook.ie/privacy">Privacy Policy</a></p>
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    return await sendGmailEmail({
      to: email,
      subject: 'Verify Your Email - Welcome to tradesbook.ie',
      html: emailHtml,
      from: 'noreply@tradesbook.ie'
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

export async function verifyEmailToken(token: string): Promise<EmailVerificationResult> {
  try {
    // Find user by verification token
    const users = await storage.getAllUsers();
    const user = users.find(u => u.emailVerificationToken === token);
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid verification token'
      };
    }

    // Check if token has expired (24 hours)
    if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
      return {
        success: false,
        message: 'Verification token has expired'
      };
    }

    // Mark email as verified
    await storage.verifyUserEmail(user.id);
    
    return {
      success: true,
      message: 'Email verified successfully! You can now access all features.'
    };
  } catch (error) {
    console.error('Error verifying email token:', error);
    return {
      success: false,
      message: 'Verification failed. Please try again.'
    };
  }
}

export async function resendVerificationEmail(email: string): Promise<EmailVerificationResult> {
  try {
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    if (user.emailVerified) {
      return {
        success: false,
        message: 'Email is already verified'
      };
    }

    const verificationToken = await generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await storage.updateEmailVerificationToken(user.id, verificationToken, expiresAt);
    
    const emailSent = await sendVerificationEmail(
      user.email!, 
      user.firstName || 'User', 
      verificationToken
    );

    if (emailSent) {
      return {
        success: true,
        message: 'Verification email sent successfully',
        verificationToken
      };
    } else {
      return {
        success: false,
        message: 'Failed to send verification email'
      };
    }
  } catch (error) {
    console.error('Error resending verification email:', error);
    return {
      success: false,
      message: 'Failed to resend verification email'
    };
  }
}