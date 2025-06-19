import { Link } from "wouter";
import Navigation from "@/components/navigation";
import ServiceTierCard from "@/components/ServiceTierCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tv, Camera, Calendar, Bolt, CheckCircle, Star, Medal, Award, Crown, MapPin, Wrench, Shield, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  const serviceTiers = [
    {
      key: "table-top",
      name: "Table Top Setup",
      description: "Perfect for smaller TVs and simple setups",
      icon: <Tv className="text-2xl text-blue-600" />,
      gradient: "from-blue-50 to-indigo-50",
      border: "border-blue-100",
      pricing: [
        { label: "Up to 43\"", price: 89 },
        { label: "43\" and above", price: 109 }
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
        { label: "Up to 42\"", price: 109 }
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
        { label: "43\"-85\"", price: 159 },
        { label: "85\"+ Large", price: 259 }
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
        { label: "Standard Size", price: 259 },
        { label: "85\"+ Premium", price: 359 }
      ]
    }
  ];

  // Fetch installers from the database
  const { data: installers, isLoading: installersLoading } = useQuery({
    queryKey: ["/api/installers"],
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* User Authentication Header - only show if authenticated */}
      {isAuthenticated && user && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-center">
            <div className="flex items-center space-x-3">
              {user?.profileImageUrl && (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <span className="text-sm text-gray-700">
                Welcome, {user?.firstName || user?.email}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                See Your TV on the Wall{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  Before You Book
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Get personalized TV recommendations and see exactly how your new TV will look mounted on your wall. Professional installation guaranteed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center lg:justify-start">
                <Link href="/tv-recommendation">
                  <Button className="inline-flex items-center bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                    <Tv className="mr-3 h-5 w-5" />
                    Find My Perfect TV
                  </Button>
                </Link>
                <Link href="/booking">
                  <Button className="inline-flex items-center bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                    <Camera className="mr-3 h-5 w-5" />
                    Start AI Preview
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  AI Room Preview
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Professional Install
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Instant Booking
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/images/hero-room.jpg" 
                alt="Modern living room with mounted TV" 
                className="rounded-3xl shadow-2xl w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-800">AI Preview Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Tiers Section */}
      <section className="py-16 bg-white">
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
              />
            ))}
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
        </div>
      </section>

      {/* Our Installers Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Professional Installers
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our certified technicians are experienced professionals who ensure quality installations with guaranteed satisfaction.
            </p>
          </div>

          {installersLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : installers && installers.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {installers.map((installer: any) => (
                <Card key={installer.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wrench className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {installer.name || installer.businessName}
                    </h3>
                    <div className="flex items-center justify-center mb-3">
                      <MapPin className="w-4 h-4 text-gray-500 mr-1" />
                      <span className="text-gray-600 text-sm">{installer.serviceArea}</span>
                    </div>
                    <div className="flex items-center justify-center mb-3">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-gray-700 font-medium">4.9/5</span>
                      <span className="text-gray-500 text-sm ml-1">(50+ reviews)</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <Shield className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-green-600 text-sm font-medium">Certified & Insured</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Our Installer Network</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                We work with certified professionals in your area to provide quality TV installation services.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
