import { randomBytes, createHash } from 'crypto';
import bcrypt from 'bcrypt';
import { storage } from './storage';
import { sendGmailEmail } from './gmailService';

export interface PasswordResetResult {
  success: boolean;
  message: string;
  token?: string;
}

export interface PasswordResetRequest {
  email: string;
  userType: 'customer' | 'installer';
}

export interface PasswordResetConfirmation {
  token: string;
  newPassword: string;
  userType: 'customer' | 'installer';
}

// Generate a secure password reset token
export async function generatePasswordResetToken(): Promise<string> {
  return randomBytes(32).toString('hex');
}

// Hash the token for secure storage
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Send password reset email
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetToken: string,
  userType: 'customer' | 'installer'
): Promise<boolean> {
  // Use production domain for reset links
  const baseUrl = 'https://tradesbook.ie';
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&type=${userType}`;
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - tradesbook.ie</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
            .reset-code { background: #fef2f2; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 16px; text-align: center; margin: 15px 0; border: 1px solid #fecaca; }
            .warning { background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #ffeaa7; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
                <p>Reset your ${userType} account password</p>
            </div>
            
            <div class="content">
                <h2>Hello ${firstName}!</h2>
                
                <p>We received a request to reset the password for your ${userType} account at tradesbook.ie.</p>
                
                <div class="warning">
                    <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.
                </div>
                
                <p>To reset your password, click the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" class="button">Reset Password</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <div class="reset-code">${resetUrl}</div>
                
                <h3>Important Security Information:</h3>
                <ul>
                    <li>🔒 This reset link will expire in 1 hour</li>
                    <li>🔐 The link can only be used once</li>
                    <li>📧 Only use this link if you requested the password reset</li>
                    <li>🛡️ Never share this link with anyone</li>
                </ul>
                
                <p>If you continue to have trouble accessing your account, please contact our support team at help@tradesbook.ie.</p>
                
                <p>Best regards,<br>
                The tradesbook.ie Team</p>
            </div>
            
            <div class="footer">
                <p>&copy; 2025 tradesbook.ie. All rights reserved.</p>
                <p>This email was sent because you requested a password reset. If you didn't make this request, please ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    await sendGmailEmail({
      to: email,
      subject: 'Password Reset Request - tradesbook.ie',
      html: emailHtml,
      from: 'noreply@tradesbook.ie'
    });
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

// Request password reset
export async function requestPasswordReset(
  email: string,
  userType: 'customer' | 'installer'
): Promise<PasswordResetResult> {
  try {
    let user;
    
    if (userType === 'customer') {
      user = await storage.getUserByEmail(email);
    } else {
      user = await storage.getInstallerByEmail(email);
    }
    
    if (!user) {
      // Don't reveal if user exists for security
      return {
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link shortly.'
      };
    }

    const resetToken = await generatePasswordResetToken();
    const hashedToken = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    if (userType === 'customer') {
      await storage.createPasswordResetToken(user.id, hashedToken, expiresAt, 'customer');
    } else {
      await storage.createPasswordResetToken(user.id, hashedToken, expiresAt, 'installer');
    }

    // Send reset email
    const firstName = userType === 'customer' 
      ? (user as any).firstName || 'User'
      : (user as any).businessName || (user as any).contactName || 'User';
    
    const emailSent = await sendPasswordResetEmail(
      user.email!,
      firstName,
      resetToken,
      userType
    );

    if (emailSent) {
      return {
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link shortly.',
        token: resetToken
      };
    } else {
      return {
        success: false,
        message: 'Failed to send password reset email. Please try again.'
      };
    }
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return {
      success: false,
      message: 'An error occurred while processing your request. Please try again.'
    };
  }
}

// Verify and reset password
export async function resetPassword(
  token: string,
  newPassword: string,
  userType: 'customer' | 'installer'
): Promise<PasswordResetResult> {
  try {
    const hashedToken = hashToken(token);
    
    // Find and validate reset token
    const resetTokenRecord = await storage.getPasswordResetToken(hashedToken, userType);
    
    if (!resetTokenRecord) {
      return {
        success: false,
        message: 'Invalid or expired reset token. Please request a new password reset.'
      };
    }

    if (resetTokenRecord.expiresAt < new Date()) {
      // Clean up expired token
      await storage.deletePasswordResetToken(hashedToken);
      return {
        success: false,
        message: 'Reset token has expired. Please request a new password reset.'
      };
    }

    if (resetTokenRecord.used) {
      return {
        success: false,
        message: 'This reset token has already been used. Please request a new password reset.'
      };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Reset password
    if (userType === 'customer') {
      await storage.updateUserPassword(resetTokenRecord.userId, hashedPassword);
    } else {
      await storage.updateInstallerPassword(resetTokenRecord.userId, hashedPassword);
    }

    // Mark token as used
    await storage.markPasswordResetTokenAsUsed(hashedToken);

    return {
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    };
  } catch (error) {
    console.error('Error resetting password:', error);
    return {
      success: false,
      message: 'An error occurred while resetting your password. Please try again.'
    };
  }
}

// Clean up expired tokens (should be called periodically)
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    await storage.deleteExpiredPasswordResetTokens();
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
}