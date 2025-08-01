import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import AIHelpWidget from "@/components/AIHelpWidget";
import { MessageCircle, Zap, Clock, CheckCircle } from "lucide-react";

export default function AIHelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            AI Help Assistant
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
            Get instant answers to your questions about TV installation, electronics setup, streaming services, and more. 
            Our AI assistant is available 24/7 with expert knowledge to help you quickly.
          </p>
          
          {/* Feature Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mb-8 sm:mb-12 px-4">
            <div className="flex items-center justify-center text-gray-600">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mr-2 sm:mr-3 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base">Instant Responses</span>
            </div>
            <div className="flex items-center justify-center text-gray-600">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base">Available 24/7</span>
            </div>
            <div className="flex items-center justify-center text-gray-600">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 mr-2 sm:mr-3 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base">Expert Knowledge</span>
            </div>
          </div>
        </div>

        {/* AI Help Widget */}
        <div className="max-w-4xl mx-auto px-4 sm:px-0">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
              Ask me anything about TV installation & electronics
            </h2>
            <AIHelpWidget />
          </div>
        </div>

        {/* Help Topics */}
        <div className="max-w-6xl mx-auto mt-12 sm:mt-16 px-4">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
            Popular Help Topics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <h4 className="font-semibold text-gray-900 mb-3">TV Installation</h4>
              <ul className="text-gray-600 text-sm space-y-2">
                <li>• Wall mounting requirements</li>
                <li>• Cable management</li>
                <li>• Bracket selection</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <h4 className="font-semibold text-gray-900 mb-3">Streaming Setup</h4>
              <ul className="text-gray-600 text-sm space-y-2">
                <li>• App installation</li>
                <li>• WiFi connectivity</li>
                <li>• Account setup</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <h4 className="font-semibold text-gray-900 mb-3">Technical Issues</h4>
              <ul className="text-gray-600 text-sm space-y-2">
                <li>• Picture quality problems</li>
                <li>• Audio troubleshooting</li>
                <li>• Remote control setup</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <h4 className="font-semibold text-gray-900 mb-3">Smart TV Features</h4>
              <ul className="text-gray-600 text-sm space-y-2">
                <li>• Voice control setup</li>
                <li>• Screen mirroring</li>
                <li>• Gaming mode</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <h4 className="font-semibold text-gray-900 mb-3">Irish Services</h4>
              <ul className="text-gray-600 text-sm space-y-2">
                <li>• RTÉ Player setup</li>
                <li>• SaorView configuration</li>
                <li>• Virgin Media services</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <h4 className="font-semibold text-gray-900 mb-3">Hardware Questions</h4>
              <ul className="text-gray-600 text-sm space-y-2">
                <li>• HDMI connections</li>
                <li>• Sound system setup</li>
                <li>• Cable requirements</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Need More Help */}
        <div className="max-w-4xl mx-auto mt-12 sm:mt-16 text-center px-4">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 sm:p-8 border border-orange-200">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Need More Help?
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              If our AI assistant can't solve your issue, our professional installation services 
              provide hands-on help to get everything working perfectly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <a
                href="/booking"
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base"
              >
                Book Professional Installation
              </a>
              <a
                href="mailto:support@tradesbook.ie"
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}