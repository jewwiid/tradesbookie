import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, Mail, Phone } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600">How we protect and handle your personal information</p>
          <p className="text-sm text-gray-500 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                At tradesbook.ie, we are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, store, and protect your information when you use our TV installation 
                booking platform and related services.
              </p>
              <p>
                By using our services, you agree to the collection and use of information in accordance with this policy. 
                If you do not agree with our policies and practices, do not use our services.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Personal Information</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Name, email address, and phone number</li>
                  <li>Address and location information for service delivery</li>
                  <li>Payment information (processed securely through Stripe)</li>
                  <li>Account credentials and authentication data</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Service Information</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Room photos for AI analysis and installation planning</li>
                  <li>TV size, mount type, and installation preferences</li>
                  <li>Booking details, scheduling, and service requirements</li>
                  <li>Communication history with installers and support</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Technical Information</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>IP address, browser type, and device information</li>
                  <li>Website usage patterns and interaction data</li>
                  <li>Cookies and similar tracking technologies</li>
                  <li>Location data (with your permission)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Service Delivery</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Process and fulfill installation bookings</li>
                    <li>Match you with qualified installers</li>
                    <li>Generate AI-powered room previews</li>
                    <li>Facilitate communication between customers and installers</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Business Operations</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Process payments and manage transactions</li>
                    <li>Send booking confirmations and updates</li>
                    <li>Provide customer support and assistance</li>
                    <li>Analyze service quality and performance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                Information Sharing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">With Service Providers</h4>
                <p className="text-gray-700">
                  We share necessary information with our trusted installers to complete your service requests, 
                  including your contact details, address, and installation requirements.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">With Third-Party Services</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li><strong>Stripe:</strong> For secure payment processing</li>
                  <li><strong>OpenAI:</strong> For AI-powered room analysis (images only)</li>
                  <li><strong>Email Services:</strong> For transactional communications</li>
                  <li><strong>Analytics:</strong> For website performance and user experience</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Legal Requirements</h4>
                <p className="text-gray-700">
                  We may disclose your information when required by law, court order, or to protect our rights, 
                  property, or safety, or that of others.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Technical Safeguards</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>SSL/TLS encryption for data transmission</li>
                    <li>Secure database storage with access controls</li>
                    <li>Regular security audits and updates</li>
                    <li>Restricted access to personal data</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Organizational Measures</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Employee privacy training and agreements</li>
                    <li>Incident response and breach notification procedures</li>
                    <li>Regular privacy impact assessments</li>
                    <li>Data retention and disposal policies</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Access & Control</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Access your personal data</li>
                    <li>Correct inaccurate information</li>
                    <li>Delete your account and data</li>
                    <li>Download your data</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Privacy Controls</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Opt-out of marketing communications</li>
                    <li>Restrict data processing</li>
                    <li>Object to automated decision-making</li>
                    <li>Lodge complaints with supervisory authorities</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>How to Exercise Your Rights:</strong> Contact us at{" "}
                  <a href="mailto:privacy@tradesbook.ie" className="text-indigo-600 hover:underline">
                    privacy@tradesbook.ie
                  </a>{" "}
                  or use the contact information below.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cookies & Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                Cookies & Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Essential Cookies</h4>
                <p className="text-gray-700">
                  Required for website functionality, user authentication, and security. 
                  These cannot be disabled without affecting site performance.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Analytics Cookies</h4>
                <p className="text-gray-700">
                  Help us understand how users interact with our website to improve user experience. 
                  You can opt-out through your browser settings.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Marketing Cookies</h4>
                <p className="text-gray-700">
                  Used to deliver relevant advertisements and track campaign effectiveness. 
                  These require your consent and can be managed in your privacy preferences.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-indigo-600" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Privacy Inquiries</h4>
                  <div className="space-y-2 text-gray-700">
                    <p>
                      <strong>Email:</strong>{" "}
                      <a href="mailto:privacy@tradesbook.ie" className="text-indigo-600 hover:underline">
                        privacy@tradesbook.ie
                      </a>
                    </p>
                    <p>
                      <strong>Data Protection Officer:</strong>{" "}
                      <a href="mailto:dpo@tradesbook.ie" className="text-indigo-600 hover:underline">
                        dpo@tradesbook.ie
                      </a>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">General Contact</h4>
                  <div className="space-y-2 text-gray-700">
                    <p>
                      <strong>Support:</strong>{" "}
                      <a href="mailto:support@tradesbook.ie" className="text-indigo-600 hover:underline">
                        support@tradesbook.ie
                      </a>
                    </p>
                    <p>
                      <strong>Address:</strong> Dublin, Ireland
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Updates */}
          <Card>
            <CardHeader>
              <CardTitle>Policy Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
                We will notify you of any material changes by posting the new Privacy Policy on this page and updating the 
                "Last updated" date. Your continued use of our services after such modifications constitutes acceptance of the updated policy.
              </p>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Version:</strong> 1.0 | <strong>Effective Date:</strong> {new Date().toLocaleDateString()} | 
                  <strong>Next Review:</strong> {new Date(new Date().setMonth(new Date().getMonth() + 6)).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}