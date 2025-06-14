import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X } from 'lucide-react';
import { useBookingStore } from '@/lib/booking-store';
import PhotoUpload from '@/components/booking-steps/photo-upload';
import TvSizeSelection from '@/components/booking-steps/tv-size-selection';
import ServiceSelection from '@/components/booking-steps/service-selection';
import WallType from '@/components/booking-steps/wall-type';
import MountType from '@/components/booking-steps/mount-type';
import Addons from '@/components/booking-steps/addons';
import Schedule from '@/components/booking-steps/schedule';
import ContactReview from '@/components/booking-steps/contact-review';

const TOTAL_STEPS = 8;

export default function BookingFlow() {
  const [location, navigate] = useLocation();
  const { data, setStep, reset } = useBookingStore();
  const currentStep = data.step;

  const handleExit = () => {
    if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
      reset();
      navigate('/');
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setStep(currentStep - 1);
    }
  };

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PhotoUpload onNext={handleNext} />;
      case 2:
        return <TvSizeSelection onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <ServiceSelection onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <WallType onNext={handleNext} onBack={handleBack} />;
      case 5:
        return <MountType onNext={handleNext} onBack={handleBack} />;
      case 6:
        return <Addons onNext={handleNext} onBack={handleBack} />;
      case 7:
        return <Schedule onNext={handleNext} onBack={handleBack} />;
      case 8:
        return <ContactReview onBack={handleBack} />;
      default:
        return <PhotoUpload onNext={handleNext} />;
    }
  };

  return (
    <div className="min-h-screen typeform-gradient-bg">
      {/* Progress Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <Button variant="ghost" size="icon" onClick={handleExit}>
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </Button>
          </div>
          <Progress value={progressPercentage} className="w-full h-2" />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] py-8">
        <div className="max-w-2xl w-full mx-auto px-4">
          <div className="animate-fade-in">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}
