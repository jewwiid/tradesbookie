// Email configuration for tradesbook.ie
// Maps service types to actual valid email addresses

export const EMAIL_CONFIG = {
  // Customer-facing emails
  BOOKINGS: 'bookings@tradesbook.ie',
  SUPPORT: 'support@tradesbook.ie', 
  NOREPLY: 'noreply@tradesbook.ie',
  
  // Business operations (all route to admin for now)
  ADMIN: 'admin@tradesbook.ie',
  INSTALLERS: 'admin@tradesbook.ie', // Route to admin since installers@ doesn't exist
  JOBS: 'admin@tradesbook.ie', // Route to admin since jobs@ doesn't exist
  
  // Test mode - route installer emails to admin for testing
  TEST_INSTALLER_EMAIL: 'admin@tradesbook.ie'
};

export function getInstallerNotificationEmail(installerEmail?: string): string {
  // For testing, always use admin email since installer emails don't exist yet
  return EMAIL_CONFIG.TEST_INSTALLER_EMAIL;
}

export function getValidFromEmail(serviceType: 'booking' | 'support' | 'job' | 'admin'): string {
  switch (serviceType) {
    case 'booking':
      return EMAIL_CONFIG.BOOKINGS;
    case 'job':
      return EMAIL_CONFIG.ADMIN; // Use admin instead of non-existent jobs@
    case 'support':
      return EMAIL_CONFIG.SUPPORT;
    case 'admin':
      return EMAIL_CONFIG.ADMIN;
    default:
      return EMAIL_CONFIG.NOREPLY;
  }
}