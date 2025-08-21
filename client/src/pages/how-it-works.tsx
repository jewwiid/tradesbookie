import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Tv, Calendar, CheckCircle, ArrowRight, Upload, Sparkles, CreditCard } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      step: 1,
      title: "Customer Uploads Photo",
      description: "Customers upload photos of their space. Our AI analyzes the room and provides professional installation recommendations.",
      icon: <Camera className="w-8 h-8 text-blue-600" />,
      color: "blue"
    },
    {
      step: 2,
      title: "AI Analysis & Matching",
      description: "Our AI analyzes the job requirements and matches customers with the most suitable tradespeople in their area.",
      icon: <Sparkles className="w-8 h-8 text-purple-600" />,
      color: "purple"
    },
    {
      step: 3,
      title: "Service Selection & Quote",
      description: "Customers select from Bronze, Silver, or Gold mounting options. You receive detailed job requirements with transparent pricing.",
      icon: <Tv className="w-8 h-8 text-green-600" />,
      color: "green"
    },
    {
      step: 4,
      title: "Accept & Schedule",
      description: "Accept the job, schedule your preferred date and time, and receive instant booking confirmation with customer details.",
      icon: <Calendar className="w-8 h-8 text-orange-600" />,
      color: "orange"
    }
  ];

  const features = [
    "AI-powered room analysis and safety recommendations",
    "Live preview of your TV installation before booking",
    "Vetted tradespeople with 5+ years experience",
    "Quality leads with transparent pricing",
    "Low lead fees - only pay for accepted jobs",
    "Real-time job tracking and communication",
    "Secure payment processing and protection",
    "Growing customer base across Ireland"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How tradesbook.ie Works
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Ireland's leading booking platform connecting tradespeople with customers. Get quality leads with AI-powered matching and instant booking.
          </p>
          <Link href="/booking">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Start Your Installation
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Step-by-Step Process */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple Process for Quality Leads
            </h2>
            <p className="text-lg text-gray-600">
              From customer request to confirmed booking in just a few clicks
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Card key={step.step} className="relative overflow-hidden">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 bg-${step.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    {step.icon}
                  </div>
                  <div className={`w-8 h-8 bg-${step.color}-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3`}>
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {step.description}
                  </p>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Tradesbook.ie?
            </h2>
            <p className="text-lg text-gray-600">
              Advanced technology meets professional trades services
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Join Our Network?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start receiving quality leads for TV installation and other trade services
          </p>
          <Link href="/booking">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              Join as Tradesperson
              <Upload className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}