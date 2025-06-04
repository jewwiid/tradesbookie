import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Tv, 
  Camera, 
  Calendar, 
  Bolt, 
  CheckCircle,
  Sparkles,
  Shield,
  Clock,
  Star,
  Award,
  Crown
} from "lucide-react";
import { SERVICE_TIERS } from "@/lib/constants";

export default function Home() {
  const [, navigate] = useLocation();

  const features = [
    {
      icon: <CheckCircle className="w-5 h-5 text-success" />,
      text: "AI Room Preview"
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-success" />,
      text: "Professional Install"
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-success" />,
      text: "Instant Booking"
    }
  ];

  const howItWorksSteps = [
    {
      icon: <Camera className="w-8 h-8 text-white" />,
      title: "1. Upload & Preview",
      description: "Take a photo of your room and let our AI show you how your TV will look mounted on the wall",
      bgColor: "bg-primary"
    },
    {
      icon: <Calendar className="w-8 h-8 text-white" />,
      title: "2. Book & Schedule", 
      description: "Choose your service tier, select your preferred date and time, and complete your booking",
      bgColor: "bg-secondary"
    },
    {
      icon: <Bolt className="w-8 h-8 text-white" />,
      title: "3. Professional Install",
      description: "Our certified installer arrives on time and mounts your TV exactly as previewed",
      bgColor: "bg-success"
    }
  ];

  const serviceTierCards = [
    {
      ...SERVICE_TIERS['table-top-small'],
      icon: <Tv className="w-8 h-8 text-blue-600" />,
      bgGradient: "from-blue-50 to-indigo-50",
      borderColor: "border-blue-100",
      iconBg: "bg-blue-100"
    },
    {
      ...SERVICE_TIERS['bronze'],
      icon: <Award className="w-8 h-8 text-amber-600" />,
      bgGradient: "from-amber-50 to-orange-50", 
      borderColor: "border-amber-100",
      iconBg: "bg-amber-100"
    },
    {
      ...SERVICE_TIERS['silver'],
      icon: <Shield className="w-8 h-8 text-gray-600" />,
      bgGradient: "from-gray-50 to-slate-50",
      borderColor: "border-gray-200",
      iconBg: "bg-gray-200",
      popular: true
    },
    {
      ...SERVICE_TIERS['gold'],
      icon: <Crown className="w-8 h-8 text-yellow-600" />,
      bgGradient: "from-yellow-50 to-amber-50",
      borderColor: "border-yellow-200", 
      iconBg: "bg-yellow-100"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative gradient-hero py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                See Your TV on the Wall{" "}
                <span className="text-transparent bg-clip-text gradient-primary">
                  Before You Book
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Upload a photo of your room and our AI will show you exactly how your new TV will look mounted on your wall. Professional installation guaranteed.
              </p>
              <Button 
                onClick={() => navigate("/book")}
                className="btn-primary text-lg px-8 py-4 mb-8"
              >
                <Sparkles className="w-5 h-5 mr-3" />
                Start AI Preview
              </Button>
              
              <div className="flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-500">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    {feature.icon}
                    <span className="ml-2">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative animate-float">
              <img 
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Modern living room with mounted TV" 
                className="rounded-3xl shadow-2xl w-full" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-800">AI Preview Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Tiers Section */}
      <section id="pricing" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Installation Service
            </h2>
            <p className="text-xl text-gray-600">
              Professional TV mounting and installation services with transparent pricing
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceTierCards.map((service, index) => (
              <Card 
                key={service.id}
                className={`service-card tile-hover bg-gradient-to-br ${service.bgGradient} border ${service.borderColor} relative`}
              >
                {service.popular && (
                  <Badge className="absolute top-4 right-4 bg-primary text-white">
                    Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${service.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    {service.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 mb-2">
                    {service.name.replace(/\s*\([^)]*\)/, '')}
                  </CardTitle>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-primary mb-4">
                    €{service.basePrice}
                  </div>
                  <div className="text-sm text-gray-500">
                    {service.tvSizeMin && service.tvSizeMax ? 
                      `${service.tvSizeMin}"-${service.tvSizeMax}"` :
                      service.tvSizeMin ? 
                        `${service.tvSizeMin}"+ TVs` :
                        'All sizes'
                    }
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 gradient-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple 3-step process to get your TV professionally mounted
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, index) => (
              <Card key={index} className="text-center card-gradient tile-hover">
                <CardHeader>
                  <div className={`w-20 h-20 ${step.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
                    {step.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 mb-4">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            Ready to Mount Your TV?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start with our AI preview to see exactly how your TV will look before booking your installation.
          </p>
          <Button 
            onClick={() => navigate("/book")}
            className="btn-primary text-lg px-8 py-4"
          >
            <Camera className="w-5 h-5 mr-3" />
            Start Your Preview Now
          </Button>
        </div>
      </section>
    </div>
  );
}
