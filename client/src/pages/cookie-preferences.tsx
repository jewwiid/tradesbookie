import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowLeft, Shield, Save, RotateCcw, CheckCircle } from "lucide-react";
import { 
  CookiePreferences, 
  getCookiePreferences, 
  saveCookiePreferences, 
  getConsentSummary, 
  setConsentTimestamp 
} from "@/lib/cookieManager";
import { useToast } from "@/hooks/use-toast";

export default function CookiePreferencesPage() {
  const [preferences, setPreferences] = useState<CookiePreferences>(() => getCookiePreferences());
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const consentSummary = getConsentSummary();

  useEffect(() => {
    const originalPreferences = getCookiePreferences();
    const hasChanges = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
    setHasChanges(hasChanges);
  }, [preferences]);

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'essential') return; // Essential cookies cannot be disabled
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      saveCookiePreferences(preferences);
      setConsentTimestamp();
      setHasChanges(false);
      
      toast({
        title: "Preferences Saved",
        description: "Your cookie preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const originalPreferences = getCookiePreferences();
    setPreferences(originalPreferences);
  };

  const acceptAll = () => {
    setPreferences({
      essential: true,
      functional: true,
      analytics: true,
      advertising: true,
    });
  };

  const rejectAll = () => {
    setPreferences({
      essential: true,
      functional: false,
      analytics: false,
      advertising: false,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cookie Preferences</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage your cookie preferences and control how we use cookies on our website
            </p>
          </div>
          <div className="flex items-center gap-2">
            {consentSummary.hasConsent && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Consent Given
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Consent Summary */}
      {consentSummary.hasConsent && (
        <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Current Consent Status
                </p>
                <p className="text-xs text-green-600 dark:text-green-300">
                  {consentSummary.enabledCategories.length} of 4 cookie categories enabled
                  {consentSummary.timestamp && (
                    <span className="ml-2">
                      • Last updated: {consentSummary.timestamp.toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-1">
                {consentSummary.enabledCategories.map(category => (
                  <Badge key={category} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button onClick={acceptAll} className="bg-blue-600 hover:bg-blue-700">
              Accept All Cookies
            </Button>
            <Button onClick={rejectAll} variant="outline">
              Reject Non-Essential
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cookie Categories */}
      <div className="space-y-6">
        {/* Essential Cookies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox checked={true} disabled />
                <div>
                  <h3 className="text-lg font-semibold">Essential Cookies</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                    Required for basic site functionality
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Always Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              These cookies are necessary for the website to function and cannot be disabled. 
              They include session management, security features, and core site functionality.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <h4 className="font-medium text-sm mb-2">What we use essential cookies for:</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <li>• User authentication and session management</li>
                <li>• Security features and CSRF protection</li>
                <li>• Load balancing and basic site functionality</li>
                <li>• Cookie consent preferences storage</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Functional Cookies */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={preferences.functional}
                  onCheckedChange={(checked) => updatePreference('functional', !!checked)}
                />
                <div>
                  <h3 className="text-lg font-semibold">Functional Cookies</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                    Remember your preferences and enhance functionality
                  </p>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              These cookies allow us to remember your preferences and provide enhanced features 
              for a more personalized experience.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <h4 className="font-medium text-sm mb-2">What we use functional cookies for:</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Language and region preferences</li>
                <li>• Theme and display preferences</li>
                <li>• Form data and user interface settings</li>
                <li>• Accessibility options and customizations</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Cookies */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => updatePreference('analytics', !!checked)}
                />
                <div>
                  <h3 className="text-lg font-semibold">Analytics Cookies</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                    Help us understand how visitors use our site
                  </p>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              These cookies collect anonymous information about how you use our website, 
              helping us improve performance and user experience.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <h4 className="font-medium text-sm mb-2">What we use analytics cookies for:</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Page views and navigation patterns</li>
                <li>• Performance monitoring and error tracking</li>
                <li>• User behavior analysis (anonymized)</li>
                <li>• A/B testing and feature usage statistics</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Advertising Cookies */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={preferences.advertising}
                  onCheckedChange={(checked) => updatePreference('advertising', !!checked)}
                />
                <div>
                  <h3 className="text-lg font-semibold">Advertising Cookies</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                    Deliver relevant ads and measure effectiveness
                  </p>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              These cookies are used to make advertising messages more relevant to you 
              and measure the effectiveness of advertising campaigns.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <h4 className="font-medium text-sm mb-2">What we use advertising cookies for:</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Personalized advertisement delivery</li>
                <li>• Cross-site tracking for relevant ads</li>
                <li>• Campaign effectiveness measurement</li>
                <li>• Frequency capping and ad optimization</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <Link href="/cookie-policy" className="text-blue-600 hover:text-blue-700">
            Read our Cookie Policy
          </Link>
          {" • "}
          <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-700">
            Privacy Policy
          </Link>
          {" • "}
          <Link href="/gdpr-compliance" className="text-blue-600 hover:text-blue-700">
            GDPR Rights
          </Link>
        </div>
        
        <div className="flex gap-3">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </div>
  );
}