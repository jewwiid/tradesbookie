import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
        <p className="text-gray-600 mt-2">Last updated: June 26, 2025</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              By accessing and using tradesbook.ie ("Service"), you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Service Description</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              tradesbook.ie is a platform that connects customers with professional TV installation services. We provide:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>AI-powered room analysis and installation recommendations</li>
              <li>Booking and scheduling services</li>
              <li>Payment processing</li>
              <li>Quality assurance and customer support</li>
              <li>Installer network management</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. User Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h4 className="font-semibold">3.1 Customer Responsibilities</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>Provide accurate information during booking</li>
              <li>Ensure safe access to installation location</li>
              <li>Be present during scheduled installation</li>
              <li>Make payment as agreed</li>
              <li>Treat installers with respect</li>
            </ul>
            
            <h4 className="font-semibold mt-4">3.2 Installer Responsibilities</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>Maintain professional qualifications and insurance</li>
              <li>Provide services to agreed standards</li>
              <li>Respect customer property and privacy</li>
              <li>Follow safety protocols</li>
              <li>Maintain confidentiality</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Booking and Payment Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h4 className="font-semibold">4.1 Booking Process</h4>
            <p>
              All bookings are subject to installer availability and confirmation. 
              We reserve the right to decline bookings that do not meet our service criteria.
            </p>
            
            <h4 className="font-semibold mt-4">4.2 Payment Terms</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>Payment is required at the time of booking</li>
              <li>All prices include applicable taxes</li>
              <li>Refunds are subject to our cancellation policy</li>
              <li>We use Stripe for secure payment processing</li>
            </ul>

            <h4 className="font-semibold mt-4">4.3 Cancellation Policy</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>Cancellations more than 24 hours before appointment: Full refund minus processing fee</li>
              <li>Cancellations within 24 hours: 50% refund</li>
              <li>No-shows or same-day cancellations: No refund</li>
              <li>Weather-related cancellations: Full refund or rescheduling</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Liability and Insurance</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h4 className="font-semibold">5.1 Service Limitation</h4>
            <p>
              Our liability is limited to the cost of the service provided. We are not liable for:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Damage to existing property or equipment</li>
              <li>Consequential or indirect damages</li>
              <li>Loss of use or enjoyment</li>
              <li>Acts beyond our reasonable control</li>
            </ul>

            <h4 className="font-semibold mt-4">5.2 Insurance Requirements</h4>
            <p>
              All installers in our network maintain appropriate public liability insurance. 
              Details available upon request.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              The tradesbook.ie platform, including all content, features, and functionality, 
              is owned by us and protected by intellectual property laws. Users may not:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Copy, modify, or distribute our content</li>
              <li>Use our platform for competing services</li>
              <li>Reverse engineer our technology</li>
              <li>Remove copyright or proprietary notices</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Privacy and Data Protection</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              Your privacy is important to us. Our collection and use of personal information 
              is governed by our Privacy Policy, which forms part of these Terms of Service.
            </p>
            <p className="mt-2">
              <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline">
                View our Privacy Policy
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Dispute Resolution</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h4 className="font-semibold">8.1 Initial Resolution</h4>
            <p>
              We encourage direct communication to resolve any issues. 
              Please contact us at support@tradesbook.ie for assistance.
            </p>

            <h4 className="font-semibold mt-4">8.2 Formal Disputes</h4>
            <p>
              Any disputes that cannot be resolved informally will be subject to the 
              jurisdiction of Irish courts and governed by Irish law.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              We reserve the right to modify these terms at any time. 
              Users will be notified of significant changes via email or platform notification. 
              Continued use of the service constitutes acceptance of modified terms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10. Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              For questions about these Terms of Service, please contact us:
            </p>
            <div className="mt-4 space-y-2">
              <p><strong>Email:</strong> legal@tradesbook.ie</p>
              <p><strong>Support:</strong> support@tradesbook.ie</p>
              <p><strong>Address:</strong> Dublin, Ireland</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          By using tradesbook.ie, you acknowledge that you have read, understood, 
          and agree to be bound by these Terms of Service.
        </p>
      </div>
    </div>
  );
}