import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ArrowLeft } from "lucide-react";
import ProgressBar from "@/components/booking/progress-bar";
import PhotoUpload from "@/components/booking/photo-upload";
import TVSizeSelector from "@/components/booking/tv-size-selector";
import ServiceSelector from "@/components/booking/service-selector";
import WallTypeSelector from "@/components/booking/wall-type-selector";
import MountTypeSelector from "@/components/booking/mount-type-selector";
import AddonSelector from "@/components/booking/addon-selector";
import ScheduleSelector from "@/components/booking/schedule-selector";
import ContactForm from "@/components/booking/contact-form";
import { useBookingData } from "@/lib/booking-utils";
import Navigation from "@/components/navigation";

const TOTAL_STEPS = 8;

export default function BookingFlow() {
  const [, setLocation] = useLocation();
  const { bookingData, updateBookingData, resetBookingData } = useBookingData();
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
        return bookingData.tvSize !== "";
      case 3:
        return bookingData.serviceType !== "";
      case 4:
        return bookingData.wallType !== "";
      case 5:
        return bookingData.mountType !== "" && 
               (bookingData.needsWallMount === false || 
                (bookingData.needsWallMount === true && bookingData.wallMountOption));
      case 6:
        return true; // Addons are optional
      case 7:
        return bookingData.preferredDate && bookingData.preferredTime;
      case 8:
        return bookingData.contact?.name && bookingData.contact?.email && bookingData.contact?.phone && bookingData.contact?.address;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PhotoUpload bookingData={bookingData} updateBookingData={updateBookingData} />;
      case 2:
        return <TVSizeSelector bookingData={bookingData} updateBookingData={updateBookingData} />;
      case 3:
        return <ServiceSelector bookingData={bookingData} updateBookingData={updateBookingData} />;
      case 4:
        return <WallTypeSelector bookingData={bookingData} updateBookingData={updateBookingData} />;
      case 5:
        return <MountTypeSelector bookingData={bookingData} updateBookingData={updateBookingData} />;
      case 6:
        return <AddonSelector bookingData={bookingData} updateBookingData={updateBookingData} />;
      case 7:
        return <ScheduleSelector bookingData={bookingData} updateBookingData={updateBookingData} />;
      case 8:
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
    </div>
  );
}
