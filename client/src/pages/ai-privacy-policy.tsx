import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Cpu, Database, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function AIPrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/ai-help">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to AI Tools
            </Button>
          </Link>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Tools Privacy & Usage Policy</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Understanding how our AI assistance works and protecting your privacy
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-6 h-6 mr-3 text-green-600" />
                Privacy First Approach
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Our AI tools are designed with privacy and transparency at their core. We believe you should understand 
                exactly how these tools work and what happens to your information.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">✓ What We DON'T Collect:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• No personal identifying information (name, address, phone)</li>
                  <li>• No payment or financial information</li>
                  <li>• No browsing history or website tracking</li>
                  <li>• No location data beyond store context (if accessed via QR code)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How AI Tools Work */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cpu className="w-6 h-6 mr-3 text-blue-600" />
                How Our AI Tools Work
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">1. TV Recommendation Engine</h4>
                  <p className="text-sm text-gray-700">
                    Analyzes your viewing preferences, room setup, and budget to suggest compatible TV models. 
                    Uses machine learning to match features with your specific needs.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900">2. Product Information Assistant</h4>
                  <p className="text-sm text-gray-700">
                    Searches product databases and specifications to provide detailed, accurate information 
                    about electronics and appliances.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">3. Product Comparison Tool</h4>
                  <p className="text-sm text-gray-700">
                    Compares technical specifications, features, and value propositions between different 
                    products to help you make informed decisions.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900">4. Smart FAQ System</h4>
                  <p className="text-sm text-gray-700">
                    Answers common questions about products, services, and policies using natural language 
                    processing to understand your specific query.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Flow */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-6 h-6 mr-3 text-purple-600" />
                Data Flow & Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">Information Processing Flow:</h4>
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-200 text-blue-900 px-2 py-1 rounded text-xs font-medium">1</span>
                    <span>You provide preferences or ask questions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-200 text-blue-900 px-2 py-1 rounded text-xs font-medium">2</span>
                    <span>AI processes your input to understand your needs</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-200 text-blue-900 px-2 py-1 rounded text-xs font-medium">3</span>
                    <span>System searches product databases for relevant information</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-200 text-blue-900 px-2 py-1 rounded text-xs font-medium">4</span>
                    <span>AI generates personalized recommendations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-200 text-blue-900 px-2 py-1 rounded text-xs font-medium">5</span>
                    <span>Results are presented to you instantly</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Session Data (Temporary):</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Your preferences and questions during the current session</li>
                  <li>• AI responses and recommendations generated for you</li>
                  <li>• Technical usage metrics for improving our service</li>
                  <li>• Session automatically expires after 24 hours</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Store Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-6 h-6 mr-3 text-orange-600" />
                Store Analytics & QR Codes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                When you access AI tools via QR codes in Harvey Norman stores, we collect limited analytics 
                to help stores understand which tools are most helpful to customers.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-2">What We Track:</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• Which AI tool was used</li>
                    <li>• Store location (e.g., "Harvey Norman Carrickmines")</li>
                    <li>• Time and date of access</li>
                    <li>• General usage patterns</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Benefits to You:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Stores can improve AI tool placement</li>
                    <li>• Better understanding of customer needs</li>
                    <li>• Continuous improvement of AI assistance</li>
                    <li>• Enhanced in-store experience</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety & Limitations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-6 h-6 mr-3 text-red-600" />
                AI Safety & Limitations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">Important Limitations:</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• AI recommendations are suggestions, not guarantees</li>
                  <li>• Always verify product specifications before purchase</li>
                  <li>• Prices and availability may change</li>
                  <li>• AI cannot access real-time inventory or pricing</li>
                  <li>• Consider consulting with store staff for complex needs</li>
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Safety Measures:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• No malicious capabilities or harmful content generation</li>
                  <li>• Content is filtered for appropriateness</li>
                  <li>• AI cannot make purchases or access payment systems</li>
                  <li>• No access to customer accounts or personal data</li>
                  <li>• All interactions are logged for quality assurance</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Questions or Concerns?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                If you have questions about our AI tools, data usage, or privacy practices, 
                please don't hesitate to contact us.
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Customer Service:</strong> Available in-store or through Harvey Norman's 
                  official customer service channels.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}