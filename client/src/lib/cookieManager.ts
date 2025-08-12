// Cookie management utility for the platform

export interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  advertising: boolean;
}

const COOKIE_CONSENT_KEY = 'tradesbook_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'tradesbook_cookie_preferences';

// Default preferences (only essential cookies enabled)
const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
  advertising: false,
};

/**
 * Get current cookie preferences from localStorage
 */
export const getCookiePreferences = (): CookiePreferences => {
  const preferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
  
  if (!preferences) {
    return DEFAULT_PREFERENCES;
  }
  
  try {
    const parsed = JSON.parse(preferences);
    // Ensure all required properties exist
    return {
      essential: true, // Always true
      functional: parsed.functional || false,
      analytics: parsed.analytics || false,
      advertising: parsed.advertising || false,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

/**
 * Check if user has given cookie consent
 */
export const hasCookieConsent = (): boolean => {
  return !!localStorage.getItem(COOKIE_CONSENT_KEY);
};

/**
 * Save cookie preferences to localStorage
 */
export const saveCookiePreferences = (preferences: CookiePreferences): void => {
  localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
  localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences));
  
  // Dispatch event for components to listen to
  window.dispatchEvent(new CustomEvent('cookiePreferencesUpdated', { 
    detail: preferences 
  }));
};

/**
 * Reset cookie consent (for testing or user request)
 */
export const resetCookieConsent = (): void => {
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  localStorage.removeItem(COOKIE_PREFERENCES_KEY);
  
  // Dispatch event
  window.dispatchEvent(new CustomEvent('cookieConsentReset'));
};

/**
 * Check if a specific cookie category is enabled
 */
export const isCookieCategoryEnabled = (category: keyof CookiePreferences): boolean => {
  const preferences = getCookiePreferences();
  return preferences[category];
};

/**
 * Get consent timestamp
 */
export const getConsentTimestamp = (): Date | null => {
  const timestamp = localStorage.getItem(`${COOKIE_CONSENT_KEY}_timestamp`);
  return timestamp ? new Date(timestamp) : null;
};

/**
 * Set consent timestamp
 */
export const setConsentTimestamp = (): void => {
  localStorage.setItem(`${COOKIE_CONSENT_KEY}_timestamp`, new Date().toISOString());
};

/**
 * Helper to conditionally load analytics/tracking scripts
 */
export const loadAnalyticsScript = (callback: () => void): void => {
  if (isCookieCategoryEnabled('analytics')) {
    callback();
  }
};

/**
 * Helper to conditionally load advertising scripts
 */
export const loadAdvertisingScript = (callback: () => void): void => {
  if (isCookieCategoryEnabled('advertising')) {
    callback();
  }
};

/**
 * Check if cookies need refresh (e.g., after policy update)
 * Returns true if consent is older than specified days
 */
export const needsCookieRefresh = (daysThreshold: number = 365): boolean => {
  const consentTimestamp = getConsentTimestamp();
  if (!consentTimestamp) return true;
  
  const daysSinceConsent = (Date.now() - consentTimestamp.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceConsent > daysThreshold;
};

/**
 * Get cookie consent summary for display
 */
export const getConsentSummary = () => {
  const preferences = getCookiePreferences();
  const hasConsent = hasCookieConsent();
  const timestamp = getConsentTimestamp();
  
  return {
    hasConsent,
    preferences,
    timestamp,
    enabledCategories: Object.entries(preferences)
      .filter(([_, enabled]) => enabled)
      .map(([category, _]) => category),
    totalEnabled: Object.values(preferences).filter(Boolean).length
  };
};