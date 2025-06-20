import { Link } from "wouter";
import Navigation from "@/components/navigation";
import ServiceTierCard from "@/components/ServiceTierCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Medal, Award, Crown, Tv, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Pricing() {
  // Fetch dynamic pricing from backend
  const { data: apiServiceTiers, isLoading } = useQuery({
    queryKey: ['/api/service-tiers'],
  });

  // Fallback static tiers if API is loading
  const calculateCustomerPrice = (installerPrice: number, feePercentage: number = 15) => {
    const appFee = installerPrice * (feePercentage / 100);
    return Math.round(installerPrice + appFee);
  };

  const staticServiceTiers = [
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
      border: "border-blue-100",
      pricing: [
        { label: "Up to 42\"", price: calculateCustomerPrice(109) }
      ]
    },
    {
      key: "silver",
      name: "Silver Mount",
      description: "Tilting mount with cable management",
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
      icon: <Crown className="text-2xl text-yellow-600" />,
      gradient: "from-yellow-50 to-amber-50",
      border: "border-yellow-200",
      pricing: [
        { label: "Standard Size", price: calculateCustomerPrice(259) },
        { label: "85\"+ Premium", price: calculateCustomerPrice(359) }
      ]
    }
  ];

  // Map API data to display format
  const serviceTiers = isLoading || !apiServiceTiers ? staticServiceTiers : [
    {
      key: "table-top",
      name: "Table Top Setup",
      description: "Perfect for smaller TVs and simple setups",
      icon: <Tv className="text-2xl text-blue-600" />,
      gradient: "from-blue-50 to-indigo-50",
      border: "border-blue-100",
      pricing: [
        { 
          label: "Up to 43\"", 
          price: apiServiceTiers.find((t: any) => t.key === 'table-top-small')?.customerPrice || calculateCustomerPrice(89)
        },
        { 
          label: "43\" and above", 
          price: apiServiceTiers.find((t: any) => t.key === 'table-top-large')?.customerPrice || calculateCustomerPrice(109)
        }
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
        { 
          label: "Up to 42\"", 
          price: apiServiceTiers.find((t: any) => t.key === 'bronze')?.customerPrice || calculateCustomerPrice(109)
        }
      ]
    },
    {
      key: "silver",
      name: "Silver Mount",
      description: "Tilting mount with cable management",
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
      name: "Gold Mount",
      description: "Full motion mount with premium features",
      icon: <Crown className="text-2xl text-yellow-600" />,
      gradient: "from-yellow-50 to-amber-50",
      border: "border-yellow-200",
      pricing: [
        { 
          label: "Standard Size", 
          price: apiServiceTiers.find((t: any) => t.key === 'gold')?.customerPrice || calculateCustomerPrice(259)
        },
        { 
          label: "85\"+ Premium", 
          price: apiServiceTiers.find((t: any) => t.key === 'gold-large')?.customerPrice || calculateCustomerPrice(359)
        }
      ]
    }
  ];

  const addOnServices = [
    { name: "Cable Concealment", price: 49, description: "Hide all cables inside the wall for a clean look" },
    { name: "Multi-Device Setup", price: 79, description: "Connect and configure multiple devices (soundbar, gaming console, etc.)" },
    { name: "Smart TV Configuration", price: 39, description: "Complete setup of smart TV features and apps" },
    { name: "Wall Repair & Paint Touch-up", price: 69, description: "Minor wall repairs and paint matching" },
    { name: "Same-Day Service", price: 99, description: "Priority booking for same-day installation" },
    { name: "Weekend Installation", price: 49, description: "Saturday and Sunday installation availability" },
    { name: "Evening Installation", price: 39, description: "After 6 PM installation service" },
  ];

  const included = [
    "Professional site assessment",
    "All mounting hardware included",
    "Cable management system",
    "Level and secure installation",
    "Connection testing",
    "90-day installation warranty",
    "Clean-up after installation",
    "Safety inspection"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Transparent Pricing
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Professional TV installation with upfront pricing. No hidden fees, no surprises.
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span>All hardware included</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span>90-day warranty</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span>Same-day available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Service Tiers */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Service Level
            </h2>
            <p className="text-lg text-gray-600">
              From simple table setups to premium wall mounting solutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {serviceTiers.map((tier) => (
              <ServiceTierCard
                key={tier.key}
                name={tier.name}
                description={tier.description}
                icon={tier.icon}
                gradient={tier.gradient}
                border={tier.border}
                popular={tier.popular}
                pricing={tier.pricing}
                className="h-full"
              />
            ))}
          </div>

          <div className="text-center">
            <Link href="/booking">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* What's Included */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What's Included in Every Service
            </h2>
            <p className="text-lg text-gray-600">
              Professional installation with comprehensive service
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {included.map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add-On Services */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Optional Add-On Services
            </h2>
            <p className="text-lg text-gray-600">
              Enhance your installation with additional services
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addOnServices.map((addon, index) => (
              <Card key={index} className="h-full">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900">{addon.name}</h3>
                    <Badge variant="secondary" className="ml-2">
                      €{addon.price}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{addon.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing FAQ */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pricing Questions
            </h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Are there any hidden fees?
              </h3>
              <p className="text-gray-600">
                No hidden fees. The price you see includes all mounting hardware, basic cable management, and professional installation. Add-on services are clearly listed with upfront pricing.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What's included in the app fee?
              </h3>
              <p className="text-gray-600">
                The app fee covers AI room analysis, booking platform usage, QR tracking system, customer support, and secure payment processing.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer any guarantees?
              </h3>
              <p className="text-gray-600">
                Yes! Every installation comes with a 90-day warranty covering workmanship and mounting security. We also offer a satisfaction guarantee.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I reschedule my appointment?
              </h3>
              <p className="text-gray-600">
                Absolutely. You can reschedule up to 24 hours before your appointment through your customer dashboard or by contacting support.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Book Your Installation?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get AI-powered room analysis and professional installation
          </p>
          <Link href="/booking">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              Start Your Booking
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}