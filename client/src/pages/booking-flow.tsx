import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, ArrowLeft, UserCheck } from "lucide-react";
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
import { useBookingData } from "@/hooks/use-booking-data";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";

const TOTAL_STEPS = 9; // Updated to include TV quantity step

export default function BookingFlow() {
  const [, setLocation] = useLocation();
  const { 
    bookingData: rawBookingData, 
    updateBookingData, 
    resetBookingData, 
    updateTvInstallation, 
    updateCurrentTvInstallation,
    addTvInstallation,
    removeTvInstallation,
    initializeMultiTvBooking,
    setDirectInstaller,
    isDirectBooking,
    markStepCompleted,
    isStepCompleted,
    getCompletedStepsCount,
    resetStepCompletion
  } = useBookingData();
  
  // Ensure bookingData has default values for type compatibility
  const bookingData = {
    tvQuantity: 1,
    tvInstallations: [],
    currentTvIndex: 0,
    ...rawBookingData
  } as any;
  const [currentStep, setCurrentStep] = useState(1);
  
  // Check URL parameters for direct installer booking
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const installerId = urlParams.get('installer');
    const isDirect = urlParams.get('direct') === 'true';
    
    if (installerId && isDirect && !isDirectBooking()) {
      // Fetch installer info and set direct booking
      fetch(`/api/installers/${installerId}`)
        .then(res => res.json())
        .then(installer => {
          setDirectInstaller(parseInt(installerId), installer);
        })
        .catch(err => console.error('Failed to fetch installer:', err));
    }
  }, [setDirectInstaller, isDirectBooking]);

  const handleExit = () => {
    if (confirm("Are you sure you want to exit? Your progress will be lost.")) {
      resetBookingData();
      resetStepCompletion();
      setLocation("/");
    }
  };

  const nextStep = () => {
    // Mark current step as completed before proceeding
    const tvIndex = (bookingData.tvQuantity || 0) > 1 ? bookingData.currentTvIndex : undefined;
    if (canProceed() && !isStepCompleted(currentStep, tvIndex)) {
      markStepCompleted(currentStep, tvIndex);
    }
    
    // For multi-TV mode, handle automatic TV navigation
    if ((bookingData.tvQuantity || 0) > 1 && currentStep >= 2 && currentStep <= 7) {
      // If current TV is complete but not all TVs are complete
      if (isCurrentTvComplete() && !areAllTvsComplete()) {
        const nextIncompleteIndex = getNextIncompleteTvIndex();
        if (nextIncompleteIndex !== -1) {
          // Move to next incomplete TV and reset to first TV-specific step (photo upload)
          updateBookingData({ currentTvIndex: nextIncompleteIndex });
          setCurrentStep(2); // Start from photo upload for each TV
          return;
        }
      }
    }
    
    // Prevent moving to steps 8-9 (scheduling and contact) unless all TVs are complete
    if (currentStep === 7 && (bookingData.tvQuantity || 0) > 1 && !areAllTvsComplete()) {
      // Don't allow progression to scheduling/contact until all TVs are complete
      console.log("Cannot proceed to scheduling - not all TVs have completed required steps");
      return;
    }
    
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isCurrentTvComplete = () => {
    if ((bookingData.tvQuantity || 0) > 1 && bookingData.tvInstallations?.length > 0) {
      const currentTv = bookingData.tvInstallations[bookingData.currentTvIndex];
      return currentTv && currentTv.tvSize && currentTv.serviceType && currentTv.wallType && currentTv.mountType &&
        (currentTv.needsWallMount === false || (currentTv.needsWallMount === true && currentTv.wallMountOption)) &&
        currentTv.location && currentTv.addonsConfirmed; // Include add-ons confirmation as part of TV completion
    }
    return false;
  };

  const areAllTvsComplete = () => {
    if ((bookingData.tvQuantity || 0) <= 1) return true;
    if (!bookingData.tvInstallations || bookingData.tvInstallations.length !== bookingData.tvQuantity) return false;
    
    return bookingData.tvInstallations.every(tv => 
      tv.tvSize && tv.serviceType && tv.wallType && tv.mountType &&
      (tv.needsWallMount === false || (tv.needsWallMount === true && tv.wallMountOption)) &&
      tv.location && tv.addonsConfirmed // Ensure add-ons have been confirmed for each TV
    );
  };

  const getNextIncompleteTvIndex = () => {
    if ((bookingData.tvQuantity || 0) <= 1 || !bookingData.tvInstallations) return -1;
    
    return bookingData.tvInstallations.findIndex(tv => 
      !tv.tvSize || !tv.serviceType || !tv.wallType || !tv.mountType ||
      (tv.needsWallMount === true && !tv.wallMountOption) || !tv.location
    );
  };

  const canProceed = () => {
    const tvIndex = (bookingData.tvQuantity || 0) > 1 ? bookingData.currentTvIndex : undefined;
    let stepComplete = false;
    
    switch (currentStep) {
      case 1:
        stepComplete = bookingData.tvQuantity > 0;
        break;
      case 2:
        stepComplete = true; // Photo is optional
        break;
      case 3:
        // For multi-TV, check current TV's size; for single TV, check legacy field
        if ((bookingData.tvQuantity || 0) > 1) {
          const currentTv = bookingData.tvInstallations?.[bookingData.currentTvIndex];
          stepComplete = !!(currentTv && currentTv.tvSize !== "");
        } else {
          stepComplete = bookingData.tvSize !== "";
        }
        break;
      case 4:
        // For multi-TV, check current TV's service; for single TV, check legacy field
        if ((bookingData.tvQuantity || 0) > 1) {
          const currentTv = bookingData.tvInstallations?.[bookingData.currentTvIndex];
          stepComplete = !!(currentTv && currentTv.serviceType !== "");
        } else {
          stepComplete = bookingData.serviceType !== "";
        }
        break;
      case 5:
        // For multi-TV, check current TV's wall type; for single TV, check legacy field
        if ((bookingData.tvQuantity || 0) > 1) {
          const currentTv = bookingData.tvInstallations?.[bookingData.currentTvIndex];
          stepComplete = !!(currentTv && currentTv.wallType !== "");
        } else {
          stepComplete = bookingData.wallType !== "";
        }
        break;
      case 6:
        // For multi-TV, check current TV's mount type only (nextStep will handle navigation)
        if ((bookingData.tvQuantity || 0) > 1) {
          const currentTv = bookingData.tvInstallations?.[bookingData.currentTvIndex];
          stepComplete = !!(currentTv && currentTv.mountType !== "" && 
                 (currentTv.needsWallMount === false || 
                  (currentTv.needsWallMount === true && currentTv.wallMountOption)));
        } else {
          stepComplete = bookingData.mountType !== "" && 
               (bookingData.needsWallMount === false || 
                (bookingData.needsWallMount === true && bookingData.wallMountOption));
        }
        break;
      case 7:
        // For multi-TV bookings, ensure ALL TVs are complete before allowing progression to step 8
        if ((bookingData.tvQuantity || 0) > 1) {
          stepComplete = areAllTvsComplete();
        } else {
          stepComplete = true; // Addons are optional for single TV
        }
        break;
      case 8:
        stepComplete = !!(bookingData.preferredDate && bookingData.preferredTime);
        break;
      case 9:
        stepComplete = !!(
          bookingData.contact?.name &&
          bookingData.contact?.email &&
          bookingData.contact?.phone &&
          bookingData.contact?.streetAddress &&
          bookingData.contact?.town &&
          bookingData.contact?.county
        );
        break;
      default:
        stepComplete = false;
    }
    
    // Mark step as completed if it meets requirements
    if (stepComplete && !isStepCompleted(currentStep, tvIndex)) {
      markStepCompleted(currentStep, tvIndex);
    }
    
    return stepComplete;
  };

  const renderStep = () => {
    switch (currentStep) {
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
        return <AddonSelector bookingData={bookingData} updateBookingData={updateBookingData} updateTvInstallation={updateTvInstallation} updateCurrentTvInstallation={updateCurrentTvInstallation} />;
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
          <ProgressBar 
            currentStep={currentStep} 
            totalSteps={TOTAL_STEPS} 
            completedSteps={getCompletedStepsCount((bookingData.tvQuantity || 0) > 1 ? bookingData.currentTvIndex : undefined)}
          />
        </div>
      </div>

      {/* Direct Installer Booking Banner */}
      {isDirectBooking() && bookingData.installerInfo && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {bookingData.installerInfo.profileImageUrl ? (
                  <img
                    src={bookingData.installerInfo.profileImageUrl}
                    alt={bookingData.installerInfo.businessName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-green-300"
                  />
                ) : (
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-600 text-white">Direct Booking</Badge>
                  <h3 className="text-lg font-semibold text-green-900">
                    {bookingData.installerInfo.businessName}
                  </h3>
                </div>
                <p className="text-green-700 text-sm">
                  Booking directly with {bookingData.installerInfo.contactName} • {bookingData.installerInfo.serviceArea}
                </p>
                <p className="text-green-600 text-xs mt-1">
                  ✓ No lead fees • Direct communication • Guaranteed assignment
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step Container */}
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)] py-8">
        <div className="max-w-2xl w-full mx-auto px-4">
          {/* Multi-TV Navigation */}
          <MultiTVNavigation 
            bookingData={bookingData} 
            updateBookingData={updateBookingData}
            currentStep={currentStep}
            getCompletedStepsCount={getCompletedStepsCount}
          />
          
          <Card className="typeform-card fade-in">
            <CardContent className="p-0">
              {renderStep()}
              
              {/* Navigation */}
              <div className="flex justify-between pt-8 border-t border-border mt-8">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  disabled={currentStep === 1}
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
