import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ArrowLeft, CheckCircle, Tv, Medal, Award, Crown, Building, Shield, Wrench, Clock } from "lucide-react";
import ProgressBar from "@/components/booking/progress-bar";
import PhotoUpload from "@/components/booking/photo-upload";
import TVQuantitySelector from "@/components/booking/tv-quantity-selector";
import TVSizeSelector from "@/components/booking/tv-size-selector";
import ServiceSelector from "@/components/booking/service-selector";
import WallTypeSelector from "@/components/booking/wall-type-selector";
import MountTypeSelector from "@/components/booking/mount-type-selector";
import AddonSelector from "@/components/booking/addon-selector";
import ScheduleSelector from "@/components/booking/schedule-selector";
import ContactForm from "@/components/booking/contact-form";
import MultiTVNavigation from "@/components/booking/multi-tv-navigation";
import ServiceTierCard from "@/components/ServiceTierCard";
import CollapsibleSection from "@/components/CollapsibleSection";
import { useBookingData } from "@/lib/booking-utils";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";

const TOTAL_STEPS = 9; // Total steps: 0 (intro) + 1-8 (booking steps) = 9 total

export default function BookingFlow() {
  const [, setLocation] = useLocation();
  const { 
    bookingData, 
    updateBookingData, 
    resetBookingData, 
    updateTvInstallation, 
    addTvInstallation, 
    removeTvInstallation 
  } = useBookingData();
  const [currentStep, setCurrentStep] = useState(0); // Start from intro step

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
        { label: "Standard Rate", price: apiServiceTiers.find((t: any) => t.key === 'commercial')?.customerPrice || calculateCustomerPrice(199) }
      ]
    }
  ];

  const handleExit = () => {
    if (confirm("Are you sure you want to exit? Your progress will be lost.")) {
      resetBookingData();
      setLocation("/");
    }
  };

  const nextStep = () => {
    // For multi-TV mode, handle automatic TV navigation
    if (bookingData.tvQuantity > 1 && currentStep >= 3 && currentStep <= 8) {
      // If current TV is complete but not all TVs are complete
      if (isCurrentTvComplete() && !areAllTvsComplete()) {
        const nextIncompleteIndex = getNextIncompleteTvIndex();
        if (nextIncompleteIndex !== -1) {
          // Move to next incomplete TV and reset to first TV-specific step (photo upload)
          updateBookingData({ currentTvIndex: nextIncompleteIndex });
          setCurrentStep(3); // Start from photo upload for each TV (now step 3 instead of 2)
          return;
        }
      }
    }
    
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isCurrentTvComplete = () => {
    if (bookingData.tvQuantity > 1 && bookingData.tvInstallations?.length > 0) {
      const currentTv = bookingData.tvInstallations[bookingData.currentTvIndex];
      return currentTv && currentTv.tvSize && currentTv.serviceType && currentTv.wallType && currentTv.mountType &&
        (currentTv.needsWallMount === false || (currentTv.needsWallMount === true && currentTv.wallMountOption)) &&
        currentTv.location; // Include location as part of TV completion
    }
    return false;
  };

  const areAllTvsComplete = () => {
    if (bookingData.tvQuantity <= 1) return true;
    if (!bookingData.tvInstallations || bookingData.tvInstallations.length !== bookingData.tvQuantity) return false;
    
    return bookingData.tvInstallations.every(tv => 
      tv.tvSize && tv.serviceType && tv.wallType && tv.mountType &&
      (tv.needsWallMount === false || (tv.needsWallMount === true && tv.wallMountOption)) &&
      tv.location
    );
  };

  const getNextIncompleteTvIndex = () => {
    if (bookingData.tvQuantity <= 1 || !bookingData.tvInstallations) return -1;
    
    return bookingData.tvInstallations.findIndex(tv => 
      !tv.tvSize || !tv.serviceType || !tv.wallType || !tv.mountType ||
      (tv.needsWallMount === true && !tv.wallMountOption) || !tv.location
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true; // Intro step, always can proceed
      case 1:
        return bookingData.tvQuantity > 0;
      case 2:
        return true; // Photo is optional
      case 3:
        // For multi-TV, check current TV's size; for single TV, check legacy field
        if (bookingData.tvQuantity > 1) {
          const currentTv = bookingData.tvInstallations?.[bookingData.currentTvIndex];
          return currentTv && currentTv.tvSize !== "";
        }
        return bookingData.tvSize !== "";
      case 4:
        // For multi-TV, check current TV's service; for single TV, check legacy field
        if (bookingData.tvQuantity > 1) {
          const currentTv = bookingData.tvInstallations?.[bookingData.currentTvIndex];
          return currentTv && currentTv.serviceType !== "";
        }
        return bookingData.serviceType !== "";
      case 5:
        // For multi-TV, check current TV's wall type; for single TV, check legacy field
        if (bookingData.tvQuantity > 1) {
          const currentTv = bookingData.tvInstallations?.[bookingData.currentTvIndex];
          return currentTv && currentTv.wallType !== "";
        }
        return bookingData.wallType !== "";
      case 6:
        // For multi-TV, check current TV's mount type only (nextStep will handle navigation)
        if (bookingData.tvQuantity > 1) {
          const currentTv = bookingData.tvInstallations?.[bookingData.currentTvIndex];
          return currentTv && currentTv.mountType !== "" && 
                 (currentTv.needsWallMount === false || 
                  (currentTv.needsWallMount === true && currentTv.wallMountOption));
        }
        return bookingData.mountType !== "" && 
               (bookingData.needsWallMount === false || 
                (bookingData.needsWallMount === true && bookingData.wallMountOption));
      case 7:
        return true; // Addons are optional
      case 8:
        return bookingData.preferredDate && bookingData.preferredTime;
      case 9:
        return bookingData.contact?.name && bookingData.contact?.email && bookingData.contact?.phone && bookingData.contact?.address;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                TV Installation Services
              </h1>
              <p className="text-xl text-gray-600">
                Professional TV mounting and installation services with transparent pricing
              </p>
            </div>
            
            {/* TV Installation Options */}
            <CollapsibleSection 
              title="TV Installation Options" 
              subtitle="Choose the service that best fits your needs"
              className="mb-8"
              defaultOpen={true}
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
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
                  />
                ))}
              </div>
            </CollapsibleSection>

            {/* Why Choose Professional TV Installation */}
            <CollapsibleSection 
              title="Why Choose Professional TV Installation?" 
              subtitle="The benefits of professional installation services"
              className="mb-8"
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center p-6 bg-blue-50 rounded-lg">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Safety First</h3>
                  <p className="text-gray-600">Professional installers ensure secure mounting and proper cable management for your safety.</p>
                </div>

                <div className="flex flex-col items-center text-center p-6 bg-green-50 rounded-lg">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                    <Wrench className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Installation</h3>
                  <p className="text-gray-600">Our certified technicians have the tools and expertise for perfect installation every time.</p>
                </div>

                <div className="flex flex-col items-center text-center p-6 bg-purple-50 rounded-lg">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Time Saving</h3>
                  <p className="text-gray-600">Skip the hassle and potential mistakes. Let professionals handle the installation efficiently.</p>
                </div>

                <div className="flex flex-col items-center text-center p-6 bg-yellow-50 rounded-lg">
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Warranty Included</h3>
                  <p className="text-gray-600">All installations come with warranty coverage for peace of mind.</p>
                </div>

                <div className="flex flex-col items-center text-center p-6 bg-red-50 rounded-lg">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
                    <Tv className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Perfect Placement</h3>
                  <p className="text-gray-600">Optimal viewing angle and height calculation for the best entertainment experience.</p>
                </div>

                <div className="flex flex-col items-center text-center p-6 bg-indigo-50 rounded-lg">
                  <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mb-4">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Insurance Coverage</h3>
                  <p className="text-gray-600">All our installers are fully insured, protecting your property during installation.</p>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        );
      case 1:
        return (
          <TVQuantitySelector 
            bookingData={bookingData} 
            updateBookingData={updateBookingData}
            addTvInstallation={addTvInstallation}
            removeTvInstallation={removeTvInstallation}
          />
        );
      case 2:
        return <PhotoUpload bookingData={bookingData} updateBookingData={updateBookingData} onNext={nextStep} />;
      case 3:
        return <TVSizeSelector bookingData={bookingData} updateBookingData={updateBookingData} updateTvInstallation={updateTvInstallation} />;
      case 4:
        return <ServiceSelector bookingData={bookingData} updateBookingData={updateBookingData} updateTvInstallation={updateTvInstallation} />;
      case 5:
        return <WallTypeSelector bookingData={bookingData} updateBookingData={updateBookingData} updateTvInstallation={updateTvInstallation} />;
      case 6:
        return <MountTypeSelector bookingData={bookingData} updateBookingData={updateBookingData} updateTvInstallation={updateTvInstallation} />;
      case 7:
        return <AddonSelector bookingData={bookingData} updateBookingData={updateBookingData} updateTvInstallation={updateTvInstallation} />;
      case 8:
        return <ScheduleSelector bookingData={bookingData} updateBookingData={updateBookingData} />;
      case 9:
        return <ContactForm bookingData={bookingData} updateBookingData={updateBookingData} onComplete={() => setLocation("/customer")} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen hero-gradient">
      <Navigation />
      {/* Progress Bar */}
      <div className="bg-white shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <Button variant="ghost" size="sm" onClick={handleExit}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </div>
      </div>

      {/* Step Container */}
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)] py-8">
        <div className="max-w-2xl w-full mx-auto px-4">
          {/* Multi-TV Navigation */}
          <MultiTVNavigation 
            bookingData={bookingData} 
            updateBookingData={updateBookingData}
            currentStep={currentStep}
          />
          
          <Card className="typeform-card fade-in">
            <CardContent className="p-0">
              {renderStep()}
              
              {/* Navigation */}
              <div className="flex justify-between pt-8 border-t border-border mt-8">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                {currentStep < TOTAL_STEPS ? (
                  <Button
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="gradient-bg"
                  >
                    Continue
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
