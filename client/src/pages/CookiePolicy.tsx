import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Shield, Settings } from "lucide-react";

export default function CookiePolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Cookie Policy</h1>
        <p className="text-gray-600 mt-2">Last updated: June 26, 2025</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>What Are Cookies</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
              They are widely used to make websites work more efficiently and provide information to website owners.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How We Use Cookies</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              tradesbook.ie uses cookies to enhance your browsing experience and provide personalized services. 
              We use cookies for the following purposes:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Authentication and session management</li>
              <li>Remembering your preferences and settings</li>
              <li>Analyzing website usage and performance</li>
              <li>Providing security features</li>
              <li>Delivering relevant content and advertisements</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Types of Cookies We Use</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h4 className="font-semibold">Essential Cookies</h4>
            <p>
              These cookies are necessary for the website to function properly. They enable core functionality 
              such as security, network management, and accessibility.
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li><strong>Session cookies:</strong> Maintain your login status</li>
              <li><strong>Security cookies:</strong> Protect against fraudulent activity</li>
              <li><strong>Load balancing cookies:</strong> Distribute traffic efficiently</li>
            </ul>

            <h4 className="font-semibold mt-4">Performance Cookies</h4>
            <p>
              These cookies collect information about how visitors use our website, 
              helping us improve functionality and user experience.
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li><strong>Analytics cookies:</strong> Track website usage and performance</li>
              <li><strong>Error tracking cookies:</strong> Help identify and fix technical issues</li>
            </ul>

            <h4 className="font-semibold mt-4">Functional Cookies</h4>
            <p>
              These cookies remember choices you make and provide enhanced, personalized features.
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li><strong>Preference cookies:</strong> Remember your settings and choices</li>
              <li><strong>Language cookies:</strong> Remember your preferred language</li>
              <li><strong>Location cookies:</strong> Remember your location preferences</li>
            </ul>

            <h4 className="font-semibold mt-4">Targeting Cookies</h4>
            <p>
              These cookies may be set through our site by our advertising partners to build 
              a profile of your interests and show you relevant advertisements.
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li><strong>Advertising cookies:</strong> Deliver relevant advertisements</li>
              <li><strong>Social media cookies:</strong> Enable social media functionality</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Third-Party Cookies</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              We may allow third-party companies to place cookies on our website to provide services to us. 
              These third parties include:
            </p>
            
            <h4 className="font-semibold mt-4">Payment Processing</h4>
            <ul className="list-disc pl-6 mt-2">
              <li><strong>Stripe:</strong> Secure payment processing and fraud prevention</li>
            </ul>

            <h4 className="font-semibold mt-4">Analytics Services</h4>
            <ul className="list-disc pl-6 mt-2">
              <li><strong>Google Analytics:</strong> Website traffic and user behavior analysis</li>
            </ul>

            <h4 className="font-semibold mt-4">Communication Services</h4>
            <ul className="list-disc pl-6 mt-2">
              <li><strong>Email providers:</strong> Delivery of transactional emails</li>
              <li><strong>SMS providers:</strong> Delivery of booking notifications</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Managing Your Cookie Preferences</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h4 className="font-semibold">Browser Settings</h4>
            <p>
              Most web browsers allow you to control cookies through browser settings. 
              You can usually find these settings in the 'Options' or 'Preferences' menu.
            </p>

            <h4 className="font-semibold mt-4">Cookie Categories</h4>
            <p>
              You can choose to accept or decline different types of cookies:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li><strong>Essential cookies:</strong> Cannot be disabled as they are necessary for website functionality</li>
              <li><strong>Performance cookies:</strong> Can be disabled, but may affect website performance</li>
              <li><strong>Functional cookies:</strong> Can be disabled, but may limit website features</li>
              <li><strong>Targeting cookies:</strong> Can be disabled without affecting core functionality</li>
            </ul>

            <h4 className="font-semibold mt-4">Opting Out</h4>
            <p>
              To opt out of specific cookie types:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li><strong>Google Analytics:</strong> Visit <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:text-blue-800 underline">Google Analytics Opt-out</a></li>
              <li><strong>General advertising:</strong> Visit <a href="http://www.aboutads.info/choices/" className="text-blue-600 hover:text-blue-800 underline">Your Ad Choices</a></li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cookie Retention</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h4 className="font-semibold">Session Cookies</h4>
            <p>
              These cookies are temporary and are deleted when you close your browser.
            </p>

            <h4 className="font-semibold mt-4">Persistent Cookies</h4>
            <p>
              These cookies remain on your device for a set period or until you delete them. 
              Our persistent cookies have the following retention periods:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li><strong>Authentication cookies:</strong> 30 days</li>
              <li><strong>Preference cookies:</strong> 12 months</li>
              <li><strong>Analytics cookies:</strong> 24 months</li>
              <li><strong>Marketing cookies:</strong> 12 months</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impact of Disabling Cookies</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              If you choose to disable cookies, some features of our website may not function properly:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>You may need to log in repeatedly</li>
              <li>Your preferences may not be saved</li>
              <li>Some features may not work as expected</li>
              <li>Page load times may be slower</li>
              <li>Personalized content may not be available</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Updates to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices 
              or for other operational, legal, or regulatory reasons. When we do, we will revise 
              the "Last updated" date at the top of this policy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              If you have any questions about our use of cookies, please contact us:
            </p>
            <div className="mt-4 space-y-2">
              <p><strong>Email:</strong> privacy@tradesbook.ie</p>
              <p><strong>Support:</strong> support@tradesbook.ie</p>
              <p><strong>Address:</strong> Dublin, Ireland</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Manage Your Cookie Preferences
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
              We respect your privacy and give you full control over how cookies are used on our website. 
              You can customize your preferences at any time through our cookie management system.
            </p>
            <div className="flex gap-3">
              <Link href="/cookie-preferences">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Cookie Preferences
                </Button>
              </Link>
              <Link href="/gdpr-compliance">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900">
                  View Your Rights
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}