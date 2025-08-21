import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Shield, UserCheck, FileText, Eye, Trash2, Download } from "lucide-react";

export default function GDPRCompliance() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">GDPR Compliance</h1>
        <p className="text-gray-600 mt-2">Your rights under the General Data Protection Regulation</p>
        <p className="text-gray-600">Last updated: June 26, 2025</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Our Commitment to GDPR
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              tradesbook.ie is committed to protecting your personal data and respecting your privacy rights 
              under the General Data Protection Regulation (GDPR). This page explains your rights and how 
              we ensure compliance with GDPR requirements.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What Personal Data We Collect</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h4 className="font-semibold">Customer Information</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>Name and contact details (email, phone, address)</li>
              <li>Booking preferences and service history</li>
              <li>Payment information (processed securely by Stripe)</li>
              <li>Room photos for AI analysis (with your explicit consent)</li>
              <li>Communication records and support interactions</li>
            </ul>

            <h4 className="font-semibold mt-4">Installer Information</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>Business details and professional qualifications</li>
              <li>Contact information and service areas</li>
              <li>Performance metrics and customer reviews</li>
              <li>Payment and commission information</li>
            </ul>

            <h4 className="font-semibold mt-4">Technical Data</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>IP address and browser information</li>
              <li>Cookie data and website usage analytics</li>
              <li>Device information and session data</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              Your GDPR Rights
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold">Right to Access</h4>
                </div>
                <p className="text-sm">
                  You can request a copy of all personal data we hold about you, 
                  including how it's used and who it's shared with.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <h4 className="font-semibold">Right to Rectification</h4>
                </div>
                <p className="text-sm">
                  You can request correction of inaccurate or incomplete personal data 
                  that we hold about you.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <h4 className="font-semibold">Right to Erasure</h4>
                </div>
                <p className="text-sm">
                  You can request deletion of your personal data, subject to certain 
                  legal obligations we may have to retain it.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="w-4 h-4 text-purple-600" />
                  <h4 className="font-semibold">Right to Portability</h4>
                </div>
                <p className="text-sm">
                  You can request your personal data in a structured, 
                  machine-readable format to transfer to another service.
                </p>
              </div>
            </div>

            <h4 className="font-semibold mt-4">Additional Rights</h4>
            <ul className="list-disc pl-6 mt-2">
              <li><strong>Right to Restrict Processing:</strong> Limit how we use your data in certain circumstances</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or direct marketing</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for processing where consent is the legal basis</li>
              <li><strong>Right to Lodge a Complaint:</strong> File a complaint with the Data Protection Commission if you're not satisfied</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Legal Basis for Processing</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>We process your personal data under the following legal bases:</p>
            
            <h4 className="font-semibold mt-4">Contractual Necessity</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>Processing booking requests and service delivery</li>
              <li>Payment processing and transaction records</li>
              <li>Customer support and communication</li>
            </ul>

            <h4 className="font-semibold mt-4">Legitimate Interest</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>Website analytics and performance improvement</li>
              <li>Fraud prevention and security</li>
              <li>Business development and service enhancement</li>
            </ul>

            <h4 className="font-semibold mt-4">Consent</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>AI room analysis using uploaded photos</li>
              <li>Marketing communications (where applicable)</li>
              <li>Non-essential cookies</li>
            </ul>

            <h4 className="font-semibold mt-4">Legal Obligation</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>Tax and accounting records</li>
              <li>Compliance with financial regulations</li>
              <li>Response to legal requests</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>We retain personal data only as long as necessary for the purposes outlined:</p>
            
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Customer account data</span>
                <span className="text-sm text-gray-600">Active account + 3 years after closure</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Booking and transaction records</span>
                <span className="text-sm text-gray-600">7 years (legal requirement)</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Room photos for AI analysis</span>
                <span className="text-sm text-gray-600">Deleted after service completion</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Marketing communications</span>
                <span className="text-sm text-gray-600">Until consent withdrawn</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Website analytics</span>
                <span className="text-sm text-gray-600">26 months</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Security Measures</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>We implement comprehensive security measures to protect your personal data:</p>
            
            <h4 className="font-semibold mt-4">Technical Safeguards</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>End-to-end encryption for data transmission</li>
              <li>Secure database storage with access controls</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Multi-factor authentication for staff accounts</li>
            </ul>

            <h4 className="font-semibold mt-4">Organizational Measures</h4>
            <ul className="list-disc pl-6 mt-2">
              <li>Staff training on data protection principles</li>
              <li>Data processing agreements with third parties</li>
              <li>Privacy by design in system development</li>
              <li>Regular review of data processing activities</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>International Data Transfers</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              We primarily process data within the European Economic Area (EEA). 
              When we transfer data outside the EEA, we ensure appropriate safeguards:
            </p>
            
            <h4 className="font-semibold mt-4">Third-Party Services</h4>
            <ul className="list-disc pl-6 mt-2">
              <li><strong>Stripe (Payment Processing):</strong> Adequate protection under Privacy Shield successor frameworks</li>
              <li><strong>OpenAI (AI Services):</strong> Data processing agreements with EU Standard Contractual Clauses</li>
              <li><strong>Google (Analytics):</strong> Google Analytics 4 with data residency controls</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Exercise Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>To exercise any of your GDPR rights, please contact us using the following methods:</p>
            
            <div className="mt-4 space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold">Data Protection Officer</h4>
                <p className="text-sm mt-2">
                  <strong>Email:</strong> dpo@tradesbook.ie<br />
                  <strong>Subject Line:</strong> "GDPR Request - [Type of Request]"
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold">General Privacy Inquiries</h4>
                <p className="text-sm mt-2">
                  <strong>Email:</strong> support@tradesbook.ie<br />
                  <strong>Response Time:</strong> Within 30 days
                </p>
              </div>
            </div>

            <h4 className="font-semibold mt-4">Information Required</h4>
            <p>When making a request, please provide:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Your full name and email address associated with your account</li>
              <li>Specific details of your request</li>
              <li>Proof of identity (for security purposes)</li>
              <li>Any relevant dates or reference numbers</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supervisory Authority</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              If you're not satisfied with how we handle your personal data or respond to your requests, 
              you have the right to lodge a complaint with the Irish Data Protection Commission:
            </p>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold">Data Protection Commission (Ireland)</h4>
              <div className="mt-2 space-y-1 text-sm">
                <p><strong>Website:</strong> <a href="https://www.dataprotection.ie" className="text-blue-600 hover:text-blue-800 underline">www.dataprotection.ie</a></p>
                <p><strong>Email:</strong> info@dataprotection.ie</p>
                <p><strong>Phone:</strong> +353 578 684 800</p>
                <p><strong>Address:</strong> 21 Fitzwilliam Square South, Dublin 2, D02 RD28, Ireland</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Updates to GDPR Compliance</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              We regularly review and update our GDPR compliance measures. Any significant changes 
              will be communicated through:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Updates to this page with revised dates</li>
              <li>Email notifications to registered users</li>
              <li>Platform notifications for active users</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">Your Privacy Matters</h3>
        <p className="text-sm text-green-700">
          We're committed to transparency and giving you full control over your personal data. 
          If you have any questions about GDPR compliance or your privacy rights, 
          don't hesitate to contact us at support@tradesbook.ie.
        </p>
      </div>
    </div>
  );
}