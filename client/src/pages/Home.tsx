import { useState, useEffect } from "react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import ServiceTierCard from "@/components/ServiceTierCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tv, Camera, Calendar, Bolt, CheckCircle, Star, Medal, Award, Crown, MapPin, Wrench, Shield, LogOut, Building, Receipt, User, Zap, AlertTriangle, Home as HomeIcon, Clock, CreditCard, FileText, MessageCircle } from "lucide-react";
import tvSetupImage from "@assets/IMG_1807_1753964075870.jpeg";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Footer from "@/components/Footer";
import SimplifiedAuthDialog from "@/components/SimplifiedAuthDialog";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogTab, setAuthDialogTab] = useState<'invoice' | 'guest' | 'oauth'>('invoice');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-rotate images every 3 seconds when not hovered
  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev === 0 ? 1 : 0));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isHovered]);

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
      key: "commercial",
      name: "Commercial On-Wall TV Setup",
      description: "Professional commercial installation service",
      detailedDescription: "Un box and test your TV.\nInstall your wall mounting bracket to the TV and a structurally sound wall.\nAudio & Video cables will be placed in a white paintable track moulding (2M).\nConnect your TV to a power socket and 3 existing sources.\nA basic demonstration of features will be provided.\nNo Cables or Brackets are included in this package\nIn a commercial Building",
      icon: <Building className="text-2xl text-purple-600" />,
      gradient: "from-purple-50 to-indigo-50",
      border: "border-purple-200",
      pricing: [
        { 
          label: "Commercial Setup", 
          price: 199
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

  // Fetch installers from the database
  const { data: installers, isLoading: installersLoading } = useQuery({
    queryKey: ["/api/installers"],
    retry: false,
  });

  // Fetch review data for all installers
  const { data: allReviews } = useQuery({
    queryKey: ['/api/reviews'],
    retry: false,
  });

  // Function to get real review stats for an installer
  const getInstallerReviewStats = (installerId: number) => {
    if (!allReviews || !Array.isArray(allReviews)) {
      return { averageRating: 0, totalReviews: 0 };
    }
    
    const installerReviews = allReviews.filter((review: any) => review.installerId === installerId);
    
    if (installerReviews.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }
    
    const totalRating = installerReviews.reduce((sum: number, review: any) => sum + review.rating, 0);
    const averageRating = (totalRating / installerReviews.length);
    
    return { 
      averageRating: Math.round(averageRating * 10) / 10, 
      totalReviews: installerReviews.length 
    };
  };

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
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16 lg:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Content Column */}
            <div className="lg:col-span-5 xl:col-span-6 text-center lg:text-left lg:pr-8 xl:pr-12 relative z-20">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 leading-tight mx-auto lg:mx-0">
                Ireland's Leading{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  Home Improvement Platform
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 mb-8 leading-relaxed mx-auto lg:mx-0 max-w-none">
                Tradesbook.ie connects you with Ireland's certified TV installation professionals. Book instantly, track your service, and get expert setup for all your entertainment needs.
              </p>
              
              {/* Button Container - Stack vertically on small screens, horizontal on larger */}
              <div className="isolate relative z-50 flex flex-col gap-4 mb-8 w-full">
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link href="/tv-recommendation" className="flex-1 min-w-0">
                    <Button className="relative z-50 w-full inline-flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 shadow-lg border border-purple-500/20">
                      <span className="whitespace-nowrap">Find My Perfect TV</span>
                    </Button>
                  </Link>
                  <Link href="/tv-installation" className="flex-1 min-w-0">
                    <Button className="relative z-50 w-full inline-flex items-center justify-center bg-gradient-to-r from-primary to-secondary text-white px-4 py-3 rounded-xl text-sm font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 shadow-lg border border-blue-500/20">
                      <span className="whitespace-nowrap">View TV Installation</span>
                    </Button>
                  </Link>
                  <Link href="/tv-setup-assist" className="flex-1 min-w-0">
                    <Button className="relative z-50 w-full inline-flex items-center justify-center bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 shadow-lg border border-emerald-500/20">
                      <span className="whitespace-nowrap">TV Setup Service</span>
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Feature Highlights */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-gray-500 relative z-20">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Certified Installers</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Instant Booking</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Live Tracking</span>
                </div>
              </div>
            </div>
            
            {/* Image Column - Increased by 50% */}
            <div className="lg:col-span-7 xl:col-span-6 relative order-first lg:order-last z-10">
              <div className="relative max-w-md mx-auto lg:max-w-none hero-slideshow-container">
                <div 
                  className="relative overflow-hidden rounded-3xl shadow-2xl aspect-[3/2] cursor-pointer"
                  onMouseEnter={() => {
                    setIsHovered(true);
                    setCurrentImageIndex(1); // Show furnished room on hover
                  }}
                  onMouseLeave={() => {
                    setIsHovered(false);
                    setCurrentImageIndex(0); // Return to empty room
                  }}
                >
                  <img 
                    src="/attached_assets/1_1754160490051.png" 
                    alt="Empty room ready for TV installation" 
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                      currentImageIndex === 0 ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <img 
                    src="/attached_assets/2_1754160490051.png" 
                    alt="Modern furnished living room with TV installation preview" 
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                      currentImageIndex === 1 ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 lg:bottom-6 left-4 lg:left-6 bg-white/90 backdrop-blur-sm rounded-xl p-3 lg:p-4 z-20">
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <div className="w-2.5 lg:w-3 h-2.5 lg:h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs lg:text-sm font-medium text-gray-800">
                        {currentImageIndex === 0 ? 'Upload Your Room' : 'AI Preview Ready'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Image indicator dots */}
                  <div className="absolute bottom-4 lg:bottom-6 right-4 lg:right-6 flex space-x-2 z-20">
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      currentImageIndex === 0 ? 'bg-white' : 'bg-white/50'
                    }`}></div>
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      currentImageIndex === 1 ? 'bg-white' : 'bg-white/50'
                    }`}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Track Your Booking Section */}
      <section className="py-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Track Your Booking
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Already booked? Track your installation progress and view booking details
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/booking-tracker">
                <Button className="inline-flex items-center bg-white text-primary border-2 border-primary px-8 py-4 rounded-xl text-lg font-semibold hover:bg-primary hover:text-white transition-all duration-300 shadow-md">
                  <Calendar className="mr-3 h-5 w-5" />
                  Track My Booking
                </Button>
              </Link>
              <span className="text-gray-500 text-sm">
                Use your QR code or booking reference
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Service Access Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-xl text-gray-600">
              Professional home improvement services across Ireland
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
              <CardContent className="p-8 text-center flex flex-col h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Tv className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">TV Installation</h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  Professional TV mounting, setup, and cable management by certified installers.
                </p>
                <Link href="/tv-installation">
                  <Button className="w-full bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 mt-auto">
                    View TV Services
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
              <CardContent className="p-8 text-center flex flex-col h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bolt className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Home Setup</h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  Complete smart home integration, device setup, and home automation configuration.
                </p>
                <Button className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 mt-auto">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
              <CardContent className="p-8 text-center flex flex-col h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wrench className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">General Installation</h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  Professional installation services for appliances, fixtures, and home improvements.
                </p>
                <Button className="w-full bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 mt-auto">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Simplified Authentication Section */}
      <section className="py-16 bg-gradient-to-br from-emerald-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Book Faster Than Ever
            </h2>
            <p className="text-xl text-gray-600">
              New flexible authentication options to reduce booking friction
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
              <CardContent className="p-8 text-center flex flex-col h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Receipt className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Invoice</h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  Enter your invoice number to book instantly. No account needed.
                </p>
                <Button 
                  onClick={() => {
                    setAuthDialogTab('invoice');
                    setAuthDialogOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 mt-auto"
                >
                  Use Invoice Number
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
              <CardContent className="p-8 text-center flex flex-col h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Quick Guest Booking</h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  Skip registration. Just provide your email for booking updates.
                </p>
                <Button 
                  onClick={() => {
                    setAuthDialogTab('guest');
                    setAuthDialogOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 mt-auto"
                >
                  Book as Guest
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
              <CardContent className="p-8 text-center flex flex-col h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Full Account</h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  Create an account for booking history, dashboard access, and more.
                </p>
                <Button 
                  onClick={() => {
                    setAuthDialogTab('oauth');
                    setAuthDialogOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 mt-auto"
                >
                  Create Account
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <div className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                All options include email updates and booking tracking
              </span>
            </div>
          </div>
        </div>
      </section>





      {/* AI Help Assistant CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <MessageCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Got Questions? Ask Our AI Assistant
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Get instant answers about TV installation, electronics setup, and streaming services. 
              Our AI assistant is available 24/7 with expert knowledge to help you quickly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <div className="flex items-center text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span>Instant responses</span>
              </div>
              <div className="flex items-center text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span>24/7 availability</span>
              </div>
              <div className="flex items-center text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span>Expert knowledge</span>
              </div>
            </div>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-4 text-lg"
              onClick={() => {
                window.location.href = '/ai-help';
              }}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Try AI Assistant Now
            </Button>
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
          ) : installers && Array.isArray(installers) && installers.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {installers.map((installer: any) => (
                <Card key={installer.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Avatar className="w-16 h-16 mx-auto mb-4">
                      <AvatarImage src={installer.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                        <Wrench className="w-8 h-8" />
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {installer.name || installer.businessName}
                    </h3>
                    <div className="flex items-center justify-center mb-3">
                      <MapPin className="w-4 h-4 text-gray-500 mr-1" />
                      <span className="text-gray-600 text-sm">{installer.serviceArea}</span>
                    </div>
                    {(() => {
                      const reviewStats = getInstallerReviewStats(installer.id);
                      return reviewStats.totalReviews > 0 ? (
                        <div className="flex items-center justify-center mb-3">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="text-gray-700 font-medium">
                            {reviewStats.averageRating}/5
                          </span>
                          <span className="text-gray-500 text-sm ml-1">
                            ({reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''})
                          </span>
                        </div>
                      ) : null;
                    })()}
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

      {/* TV Setup CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-yellow-300 mb-6">
              FreeView, SaorView and more
            </h3>
            <div className="flex justify-center mb-8">
              <img 
                src={tvSetupImage} 
                alt="Professional TV setup assistance - Smart TV configuration and app installation" 
                className="max-w-md w-full h-auto rounded-2xl shadow-2xl border-4 border-white/20"
              />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Need Help Setting Up Your Smart TV Apps?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Get professional remote assistance to set up FreeView+ and SaorView-compatible streaming apps on your smart TV. Smart TV setup service with no ongoing subscriptions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-4 text-lg"
                onClick={() => {
                  window.location.href = '/tv-setup-assist';
                }}
              >
                Get TV Setup Help
              </Button>
              <Link href="/customer-resources">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white/80 text-white bg-transparent hover:bg-white hover:text-blue-600 hover:border-white px-8 py-4 text-lg font-semibold"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section id="learn-more" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Customer Resources
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Access warranty registration, cashback offers, and helpful guides for your TV installation
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Warranty Registration</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Register your new TV warranty with Sony, Samsung, LG and more
                  </p>
                  <Link href="/resources">
                    <Button variant="outline" size="sm">
                      Access Warranties
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Cashback Offers</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Claim exclusive cashback and promotional offers from top brands
                  </p>
                  <Link href="/resources">
                    <Button variant="outline" size="sm">
                      View Offers
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Installation Guides</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Get helpful tips and guides for your TV installation
                  </p>
                  <Link href="/resources">
                    <Button variant="outline" size="sm">
                      Read Guides
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
      
      {/* Simplified Authentication Dialog */}
      <SimplifiedAuthDialog
        isOpen={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        onSuccess={() => {
          setAuthDialogOpen(false);
        }}
        title="Get Started"
        description="Choose how you'd like to book your TV installation"
        defaultTab={authDialogTab}
      />
    </div>
  );
}
