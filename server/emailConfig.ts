// Email configuration for tradesbook.ie
// Maps service types to actual valid email addresses

export const EMAIL_CONFIG = {
  // Customer-facing emails (using your Google Workspace setup)
  BOOKINGS: 'bookings@tradesbook.ie', // Alias to support@tradesbook.ie
  SUPPORT: 'support@tradesbook.ie', 
  NOREPLY: 'noreply@tradesbook.ie', // Alias to admin@tradesbook.ie
  
  // Business operations (using your actual aliases)
  ADMIN: 'admin@tradesbook.ie',
  INSTALLERS: 'installer@tradesbook.ie', // Now valid - alias to admin@tradesbook.ie
  JOBS: 'admin@tradesbook.ie', // Route to admin
  
  // Production mode - use actual installer alias
  INSTALLER_NOTIFICATIONS: 'installer@tradesbook.ie' // Valid alias to admin@tradesbook.ie
};

export function getInstallerNotificationEmail(installerEmail?: string): string {
  // Use the installer alias which routes to admin@tradesbook.ie
  return EMAIL_CONFIG.INSTALLER_NOTIFICATIONS;
}

export function getValidFromEmail(serviceType: 'booking' | 'support' | 'job' | 'admin' | 'installer'): string {
  switch (serviceType) {
    case 'booking':
      return EMAIL_CONFIG.BOOKINGS;
    case 'job':
      return EMAIL_CONFIG.INSTALLERS; // Use installer alias
    case 'installer':
      return EMAIL_CONFIG.INSTALLERS; // Use installer alias
    case 'support':
      return EMAIL_CONFIG.SUPPORT;
    case 'admin':
      return EMAIL_CONFIG.ADMIN;
    default:
      return EMAIL_CONFIG.NOREPLY;
  }
}