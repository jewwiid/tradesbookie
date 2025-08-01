import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import AIHelpWidget from "@/components/AIHelpWidget";
import { MessageCircle, Zap, Clock, CheckCircle } from "lucide-react";

export default function AIHelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <div className="flex-1 flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 w-full">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8 flex-shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            AI Help Assistant
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto mb-4 sm:mb-6 px-4">
            Get instant answers to your questions about TV installation, electronics setup, streaming services, and more. 
            Our AI assistant is available 24/7 with expert knowledge to help you quickly.
          </p>
          
          {/* Feature Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto mb-6 sm:mb-8 px-4">
            <div className="flex items-center justify-center text-gray-600">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2 flex-shrink-0" />
              <span className="font-medium text-sm">Instant Responses</span>
            </div>
            <div className="flex items-center justify-center text-gray-600">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 flex-shrink-0" />
              <span className="font-medium text-sm">Available 24/7</span>
            </div>
            <div className="flex items-center justify-center text-gray-600">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mr-2 flex-shrink-0" />
              <span className="font-medium text-sm">Expert Knowledge</span>
            </div>
          </div>
        </div>

        {/* AI Help Widget - Full Height */}
        <div className="flex-1 max-w-4xl mx-auto px-2 sm:px-4 w-full min-h-0">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-6 h-full flex flex-col">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 text-center px-2 flex-shrink-0">
              Ask me anything about TV installation & electronics
            </h2>
            <div className="flex-1 min-h-0">
              <AIHelpWidget />
            </div>
          </div>
        </div>

        {/* Help Topics - Moved Outside Flex Container */}
        <div className="max-w-6xl mx-auto mt-8 sm:mt-12 px-4 pb-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
            Popular Help Topics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">TV Installation</h4>
              <ul className="text-gray-600 text-xs space-y-1">
                <li>• Wall mounting requirements</li>
                <li>• Cable management</li>
                <li>• Bracket selection</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Streaming Setup</h4>
              <ul className="text-gray-600 text-xs space-y-1">
                <li>• App installation</li>
                <li>• WiFi connectivity</li>
                <li>• Account setup</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Technical Issues</h4>
              <ul className="text-gray-600 text-xs space-y-1">
                <li>• Picture quality problems</li>
                <li>• Audio troubleshooting</li>
                <li>• Remote control setup</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Smart TV Features</h4>
              <ul className="text-gray-600 text-xs space-y-1">
                <li>• Voice control setup</li>
                <li>• Screen mirroring</li>
                <li>• Gaming mode</li>  
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Irish Services</h4>
              <ul className="text-gray-600 text-xs space-y-1">
                <li>• RTÉ Player setup</li>
                <li>• SaorView configuration</li>
                <li>• Virgin Media services</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Hardware Questions</h4>
              <ul className="text-gray-600 text-xs space-y-1">
                <li>• HDMI connections</li>
                <li>• Sound system setup</li>
                <li>• Cable requirements</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Need More Help - Moved Outside Flex Container */}
        <div className="max-w-4xl mx-auto mt-6 text-center px-4 pb-8">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 sm:p-6 border border-orange-200">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
              Need More Help?
            </h3>
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm">
              If our AI assistant can't solve your issue, our professional installation services 
              provide hands-on help to get everything working perfectly.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <a
                href="/booking"
                className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors text-sm"
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
        
        <Footer />
      </div>
    </div>
  );
}