import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ArrowLeft } from "lucide-react";
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
import { useBookingData } from "@/lib/booking-utils";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";

const TOTAL_STEPS = 9; // Updated to include TV quantity step

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
  const [currentStep, setCurrentStep] = useState(1);

  const handleExit = () => {
    if (confirm("Are you sure you want to exit? Your progress will be lost.")) {
      resetBookingData();
      setLocation("/");
    }
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true; // Photo is optional
      case 2:
        return bookingData.tvQuantity > 0;
      case 3:
        // For multi-TV, check current TV's size; for single TV, check legacy field
        if (bookingData.tvQuantity > 1) {
          const currentTv = bookingData.tvInstallations[bookingData.currentTvIndex];
          return currentTv && currentTv.tvSize !== "";
        }
        return bookingData.tvSize !== "";
      case 4:
        // For multi-TV, check current TV's service; for single TV, check legacy field
        if (bookingData.tvQuantity > 1) {
          const currentTv = bookingData.tvInstallations[bookingData.currentTvIndex];
          return currentTv && currentTv.serviceType !== "";
        }
        return bookingData.serviceType !== "";
      case 5:
        // For multi-TV, check current TV's wall type; for single TV, check legacy field
        if (bookingData.tvQuantity > 1) {
          const currentTv = bookingData.tvInstallations[bookingData.currentTvIndex];
          return currentTv && currentTv.wallType !== "";
        }
        return bookingData.wallType !== "";
      case 6:
        // For multi-TV, check current TV's mount type; for single TV, check legacy field
        if (bookingData.tvQuantity > 1) {
          const currentTv = bookingData.tvInstallations[bookingData.currentTvIndex];
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
      case 1:
        return <PhotoUpload bookingData={bookingData} updateBookingData={updateBookingData} onNext={nextStep} />;
      case 2:
        return (
          <TVQuantitySelector 
            bookingData={bookingData} 
            updateBookingData={updateBookingData}
            addTvInstallation={addTvInstallation}
            removeTvInstallation={removeTvInstallation}
          />
        );
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
