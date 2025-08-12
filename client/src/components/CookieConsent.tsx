import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Cookie, Settings, Shield, X } from "lucide-react";
import { Link } from "wouter";
import { 
  CookiePreferences, 
  getCookiePreferences, 
  hasCookieConsent, 
  saveCookiePreferences, 
  setConsentTimestamp 
} from "@/lib/cookieManager";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(() => getCookiePreferences());

  useEffect(() => {
    // Check if user has already given consent
    if (!hasCookieConsent()) {
      // Show banner after a brief delay to not be intrusive
      setTimeout(() => setShowBanner(true), 1000);
    }

    // Listen for cookie consent reset events
    const handleConsentReset = () => {
      setPreferences(getCookiePreferences());
      setShowBanner(true);
    };

    window.addEventListener('cookieConsentReset', handleConsentReset);
    
    return () => {
      window.removeEventListener('cookieConsentReset', handleConsentReset);
    };
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    saveCookiePreferences(prefs);
    setConsentTimestamp();
    setPreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      functional: true,
      analytics: true,
      advertising: true,
    };
    saveConsent(allAccepted);
  };

  const acceptEssentialOnly = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      functional: false,
      analytics: false,
      advertising: false,
    };
    saveConsent(essentialOnly);
  };

  const saveCustomPreferences = () => {
    saveConsent(preferences);
  };

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'essential') return; // Essential cookies cannot be disabled
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Consent Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Cookie className="w-6 h-6 text-amber-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    We use cookies to enhance your experience
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    We use essential cookies to make our site work. We'd also like to set optional cookies 
                    to help us improve our website and analyze how it's used. By clicking "Accept All," 
                    you agree to our use of cookies.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex gap-2">
                      <Button onClick={acceptAll} className="bg-blue-600 hover:bg-blue-700">
                        Accept All
                      </Button>
                      <Button 
                        onClick={acceptEssentialOnly} 
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Essential Only
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 text-sm">
                      <Dialog open={showSettings} onOpenChange={setShowSettings}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                            <Settings className="w-4 h-4 mr-1" />
                            Customize
                          </Button>
                        </DialogTrigger>
                        <CookieSettingsDialog 
                          preferences={preferences}
                          onUpdatePreference={updatePreference}
                          onSave={saveCustomPreferences}
                          onClose={() => setShowSettings(false)}
                        />
                      </Dialog>
                      
                      <Link href="/cookie-policy">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          Learn More
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBanner(false)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

interface CookieSettingsDialogProps {
  preferences: CookiePreferences;
  onUpdatePreference: (key: keyof CookiePreferences, value: boolean) => void;
  onSave: () => void;
  onClose: () => void;
}

function CookieSettingsDialog({ preferences, onUpdatePreference, onSave, onClose }: CookieSettingsDialogProps) {
  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Cookie Preferences
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6 py-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          We use different types of cookies to optimize your experience on our website. 
          You can choose which categories you're comfortable with below.
        </p>
        
        {/* Essential Cookies */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Checkbox checked={true} disabled />
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Essential Cookies
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Required for basic site functionality
                </p>
              </div>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              Always Active
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 pl-6">
            These cookies are necessary for the website to function and cannot be disabled. 
            They include session management, security features, and core site functionality.
          </p>
        </div>
        
        <Separator />
        
        {/* Functional Cookies */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Checkbox 
                checked={preferences.functional}
                onCheckedChange={(checked) => onUpdatePreference('functional', !!checked)}
              />
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Functional Cookies
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Remember your preferences and settings
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 pl-6">
            These cookies allow us to remember your preferences like language, region, 
            and personalized settings to enhance your experience.
          </p>
        </div>
        
        <Separator />
        
        {/* Analytics Cookies */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Checkbox 
                checked={preferences.analytics}
                onCheckedChange={(checked) => onUpdatePreference('analytics', !!checked)}
              />
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Analytics Cookies
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Help us understand how visitors use our site
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 pl-6">
            These cookies collect anonymous information about how you use our website, 
            helping us improve performance and user experience.
          </p>
        </div>
        
        <Separator />
        
        {/* Advertising Cookies */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Checkbox 
                checked={preferences.advertising}
                onCheckedChange={(checked) => onUpdatePreference('advertising', !!checked)}
              />
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Advertising Cookies
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Deliver relevant ads and measure effectiveness
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 pl-6">
            These cookies are used to make advertising messages more relevant to you 
            and measure the effectiveness of advertising campaigns.
          </p>
        </div>
        
        <Separator />
        
        <div className="flex justify-between items-center pt-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <Link href="/cookie-policy" className="text-blue-600 hover:text-blue-700">
              Read our Cookie Policy
            </Link>
            {" • "}
            <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-700">
              Privacy Policy
            </Link>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSave} className="bg-blue-600 hover:bg-blue-700">
              Save Preferences
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

// Component is now integrated with the centralized cookie manager