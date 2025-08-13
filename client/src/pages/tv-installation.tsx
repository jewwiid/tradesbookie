import { useState, useEffect } from "react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import ServiceTierCard from "@/components/ServiceTierCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tv, Camera, Calendar, Bolt, CheckCircle, Star, Medal, Award, Crown, MapPin, Wrench, Shield, AlertTriangle, Home as HomeIcon, Clock, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Footer from "@/components/Footer";

export default function TVInstallation() {
  // Fetch dynamic pricing from backend
  const { data: apiServiceTiers, isLoading } = useQuery({
    queryKey: ['/api/service-tiers'],
  });

  // Calculate prices with commission included (fallback for loading state)
  const calculateCustomerPrice = (installerPrice: number, feePercentage: number = 15) => {
    const appFee = installerPrice * (feePercentage / 100);
    return Math.round(installerPrice + appFee);
  };

  // Map API data to display format or use fallback
  const serviceTiers = isLoading || !apiServiceTiers || !Array.isArray(apiServiceTiers) ? [
    {
      key: "table-top",
      name: "Table Top Setup",
      description: "Perfect for smaller TVs and simple setups",
      icon: <Tv className="text-2xl text-blue-600" />,
      gradient: "from-blue-50 to-indigo-50",
      border: "border-blue-100",
      pricing: [
        { label: "Up to 43\"", price: calculateCustomerPrice(89) },
        { label: "43\" and above", price: calculateCustomerPrice(109) }
      ]
    },
    {
      key: "bronze",
      name: "Bronze Mount",
      description: "Fixed wall mounting for medium TVs",
      icon: <Medal className="text-2xl text-amber-600" />,
      gradient: "from-amber-50 to-orange-50",
      border: "border-amber-100",
      pricing: [
        { label: "Up to 42\"", price: calculateCustomerPrice(109) }
      ]
    },
    {
      key: "silver",
      name: "Silver Mount",
      description: "Tilting mount with cable management",
      detailedDescription: "Professional wall mounting service for TVs 43 inches and larger. Includes cable concealment up to 2 meters, connection to power socket and up to 3 sources including Wi-Fi setup. Basic feature demonstration provided. Wall brackets and cables are not included in this service. Available for private homes only.",
      icon: <Award className="text-2xl text-gray-600" />,
      gradient: "from-gray-50 to-slate-50",
      border: "border-gray-200",
      popular: true,
      pricing: [
        { label: "43\"-85\"", price: calculateCustomerPrice(159) },
        { label: "85\"+ Large", price: calculateCustomerPrice(259) }
      ]
    },
    {
      key: "gold",
      name: "Gold Mount",
      description: "Full motion mount with premium features",
      detailedDescription: "Premium full motion wall mounting service with advanced cable concealment up to 2 meters. Includes connection to power socket and up to 3 sources including Wi-Fi setup. Comprehensive feature demonstration and setup included. Wall brackets and cables are not included in this service. Available for private homes only.",
      icon: <Crown className="text-2xl text-yellow-600" />,
      gradient: "from-yellow-50 to-amber-50",
      border: "border-yellow-200",
      pricing: [
        { label: "Standard Size", price: calculateCustomerPrice(259) },
        { label: "85\"+ Premium", price: calculateCustomerPrice(359) }
      ]
    }
  ] : [
    {
      key: "table-top",
      name: "Table Top TV Setup",
      description: "Basic Home Table Top TV Setup",
      detailedDescription: "You Must Have Your WIFI User Name and Password Ready for the Installer. No Cables are included in this package.",
      icon: <Tv className="text-2xl text-blue-600" />,
      gradient: "from-blue-50 to-indigo-50",
      border: "border-blue-100",
      pricing: [
        { 
          label: "Up to 43\"", 
          price: apiServiceTiers.find((t: any) => t.key === 'table-top-small')?.customerPrice || calculateCustomerPrice(89)
        },
        { 
          label: "Above 43\"", 
          price: apiServiceTiers.find((t: any) => t.key === 'table-top-large')?.customerPrice || calculateCustomerPrice(109)
        }
      ]
    },
    {
      key: "bronze",
      name: "Bronze TV Mounting Up To 42\" Only",
      description: "Professional wall mounting service",
      detailedDescription: "• Up To 43\" Only\n• Unbox and install a wall mounting bracket to a structurally sound wall Bracket not Inc\n• Connect TV to a local power socket and connect 3 existing sources including Wi-Fi\n• A basic demonstration of features will be provided.\n• No cables or brackets are included in this package.\n• Private homes only, not a commercial installation",
      icon: <Medal className="text-2xl text-amber-600" />,
      gradient: "from-amber-50 to-orange-50",
      border: "border-amber-100",
      pricing: [
        { 
          label: "Up to 42\"", 
          price: apiServiceTiers.find((t: any) => t.key === 'bronze')?.customerPrice || calculateCustomerPrice(109)
        }
      ]
    },
    {
      key: "silver",
      name: "Silver TV Mounting From 43\" & UP",
      description: "Advanced mounting service",
      detailedDescription: "• From 43\" & UP\n• Unbox and install a wall mounting bracket to a structurally sound wall Bracket not Inc\n• Connect the TV to a local power socket and connect 3 existing sources including Wi-Fi\n• A basic demonstration of features will be provided.\n• No cables or brackets are included in this package.\n• Private homes only, not a commercial installation",
      icon: <Award className="text-2xl text-gray-600" />,
      gradient: "from-gray-50 to-slate-50",
      border: "border-gray-200",
      popular: true,
      pricing: [
        { 
          label: "43\"-85\"", 
          price: apiServiceTiers.find((t: any) => t.key === 'silver')?.customerPrice || calculateCustomerPrice(159)
        },
        { 
          label: "85\"+ Large", 
          price: apiServiceTiers.find((t: any) => t.key === 'silver-large')?.customerPrice || calculateCustomerPrice(259)
        }
      ]
    },
    {
      key: "gold",
      name: "Gold TV Mounting From 32\" & 85''",
      description: "Premium installation with in-wall cable hiding",
      detailedDescription: "• From 32\" & 85\"\n• Unbox and install a wall mounting bracket to a structurally sound wall Bracket not Inc\n• TV Hide cables in Wall Plasterboard Only (Does not include concrete)\n• Connect the TV to a local power socket and connect 3 existing sources including Wi-Fi\n• A basic demonstration of features will be provided.\n• No cables or brackets are included in this package.\n• Private homes only, not a commercial installation",
      icon: <Crown className="text-2xl text-yellow-600" />,
      gradient: "from-yellow-50 to-amber-50",
      border: "border-yellow-200",
      pricing: [
        { 
          label: "32\"-85\"", 
          price: apiServiceTiers.find((t: any) => t.key === 'gold')?.customerPrice || calculateCustomerPrice(259)
        }
      ]
    },
    {
      key: "platinum",
      name: "Platinum Premium Service",
      description: "Ultimate TV installation with all premium features",
      detailedDescription: "• All TV sizes supported (32\" to 100\"+)\n• Professional in-wall cable concealment (up to 4M)\n• Smart home integration setup\n• Premium full-motion mount installation\n• Soundbar/surround sound system setup\n• Complete TV calibration and optimization\n• 2-year installation warranty\n• Follow-up service visit included\n• Available for both residential and commercial properties",
      icon: <Star className="text-2xl text-indigo-600" />,
      gradient: "from-indigo-50 to-purple-50",
      border: "border-indigo-200",
      pricing: [
        { 
          label: "Premium Service", 
          price: calculateCustomerPrice(449)
        },
        { 
          label: "Ultra Large 85\"+", 
          price: calculateCustomerPrice(599)
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16 lg:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Professional{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                TV Installation
              </span>{" "}
              Services
            </h1>
            <p className="text-lg lg:text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              Get your TV professionally mounted by Ireland's certified installation experts. From table-top setup to premium wall mounting with in-wall cable concealment.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-8 py-4 text-lg"
                onClick={() => window.location.href = '/booking'}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book Installation Now
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-4 text-lg border-2"
                onClick={() => window.location.href = '/pricing'}
              >
                View All Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Choose Your Installation Service Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Installation Service
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Select the perfect installation service for your TV size and mounting preferences
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceTiers.map((tier) => (
              <ServiceTierCard
                key={tier.key}
                name={tier.name}
                description={tier.description}
                detailedDescription={tier.detailedDescription}
                icon={tier.icon}
                gradient={tier.gradient}
                border={tier.border}
                popular={tier.popular}
                pricing={tier.pricing}
                className="h-full"
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-8 py-4"
              onClick={() => window.location.href = '/booking'}
            >
              Start Your Booking
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Professional TV Installation Section */}
      <section className="py-16 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Professional TV Installation?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Modern TVs present unique challenges that catch even experienced DIYers off guard
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Weight & Physics</h3>
                <p className="text-gray-600">
                  Today's 65" and 75" TVs weigh 30-40kg with massive leverage forces. Small mounting errors can cause catastrophic failure months later.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <HomeIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">New Build Complexity</h3>
                <p className="text-gray-600">
                  Modern homes have metal studs, irregular spacing, hidden pipes, and cables that require professional detection tools.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Insurance Protection</h3>
                <p className="text-gray-600">
                  Our vetted installers carry full liability insurance. If something goes wrong, you're completely protected.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Time Reality Check</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Clock className="h-6 w-6 text-red-500 mr-3" />
                    <div>
                      <span className="font-semibold text-gray-900">DIY Installation:</span>
                      <span className="text-gray-600 ml-2">8-15 hours (research, shopping, installation, troubleshooting)</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                    <div>
                      <span className="font-semibold text-gray-900">Professional Installation:</span>
                      <span className="text-gray-600 ml-2">1-2 hours, done right the first time</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="h-6 w-6 text-blue-500 mr-3" />
                    <div>
                      <span className="font-semibold text-gray-900">Total Cost Comparison:</span>
                      <span className="text-gray-600 ml-2">Professional often costs less than DIY mistakes</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Common DIY Disasters</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• TV falls off wall (€500-2000 damage)</li>
                  <li>• Wrong wall type detected (€200+ repair)</li>
                  <li>• Cables run incorrectly (€150+ rewiring)</li>
                  <li>• Mount purchased wrong size (€100+ waste)</li>
                  <li>• Weekend lost to troubleshooting</li>
                </ul>
              </div>
            </div>
            <div className="text-center mt-8">
              <p className="text-lg font-medium text-gray-900">
                Don't risk your expensive TV or waste your weekend. Get it done right the first time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-indigo-50">
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
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Upload & Preview</h3>
              <p className="text-gray-600">
                Take a photo of your room and let our AI show you how your TV will look mounted on the wall
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Book & Schedule</h3>
              <p className="text-gray-600">
                Choose your service tier, select your preferred date and time, and complete your booking
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bolt className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Professional Install</h3>
              <p className="text-gray-600">
                Our certified installer arrives on time and mounts your TV exactly as previewed
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white px-8 py-4"
              onClick={() => window.location.href = '/booking'}
            >
              <Bolt className="w-5 h-5 mr-2" />
              Get Started Now
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            Ready to Get Your TV Professionally Installed?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who chose professional installation over DIY hassles.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-8 py-4 text-lg"
              onClick={() => window.location.href = '/booking'}
            >
              Book Your Installation
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg border-2"
              onClick={() => window.location.href = '/ai-help'}
            >
              Ask Our AI Assistant
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}