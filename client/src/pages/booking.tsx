import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, ArrowLeft } from 'lucide-react';
import { useBooking } from '@/hooks/use-booking';
import { useToast } from '@/hooks/use-toast';
import PhotoUpload from '@/components/booking-steps/photo-upload';
import TVSizeSelection from '@/components/booking-steps/tv-size-selection';
import ServiceSelection from '@/components/booking-steps/service-selection';
import WallType from '@/components/booking-steps/wall-type';
import MountTypeSelection from '@/components/booking-steps/mount-type-selection';
import Addons from '@/components/booking-steps/addons';
import Schedule from '@/components/booking-steps/schedule';
import ContactReview from '@/components/booking-steps/contact-review';

const TOTAL_STEPS = 8;

export default function Booking() {
  const { bookingData, nextStep, prevStep, resetBooking } = useBooking();
  const { toast } = useToast();

  // Fetch service tiers and addons
  const { data: serviceTiers = [] } = useQuery({
    queryKey: ['/api/service-tiers'],
  });

  const { data: addons = [] } = useQuery({
    queryKey: ['/api/addons'],
  });

  const progressPercentage = (bookingData.step / TOTAL_STEPS) * 100;

  const handleExitBooking = () => {
    if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
      resetBooking();
      window.location.href = '/';
    }
  };

  const canProceedToNext = () => {
    switch (bookingData.step) {
      case 1:
        return true; // Photo upload is optional
      case 2:
        return bookingData.tvSize > 0;
      case 3:
        return bookingData.serviceTierId !== undefined;
      case 4:
        return bookingData.wallType !== '';
      case 5:
        return true; // Mount type is optional - users can skip to decide later
      case 6:
        return true; // Addons are optional
      case 7:
        return bookingData.scheduledDate !== '' && bookingData.scheduledTime !== '';
      case 8:
        return bookingData.customerName !== '' && 
               bookingData.customerEmail !== '' && 
               bookingData.customerPhone !== '' && 
               bookingData.address !== '';
      default:
        return false;
    }
  };

  const renderCurrentStep = () => {
    switch (bookingData.step) {
      case 1:
        return <PhotoUpload />;
      case 2:
        return <TVSizeSelection serviceTiers={serviceTiers} />;
      case 3:
        return <ServiceSelection serviceTiers={serviceTiers} />;
      case 4:
        return <WallType onNext={nextStep} onBack={prevStep} />;
      case 5:
        return <MountTypeSelection />;
      case 6:
        return <Addons onNext={nextStep} onBack={prevStep} />;
      case 7:
        return <Schedule onNext={nextStep} onBack={prevStep} />;
      case 8:
        return <ContactReview onNext={nextStep} onBack={prevStep} />;
      default:
        return <PhotoUpload />;
    }
  };

  return (
    <div className="min-h-screen gradient-background">
      {/* Progress Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {bookingData.step} of {TOTAL_STEPS}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExitBooking}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)] py-8">
        <div className="max-w-2xl w-full mx-auto px-4">
          <div className="booking-step">
            {renderCurrentStep()}
          </div>

          {/* Navigation Controls - Hide for steps that have their own navigation */}
          {![4, 6, 7, 8].includes(bookingData.step) && (
            <div className="flex justify-between mt-8">
              {bookingData.step > 1 ? (
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : (
                <Link href="/">
                  <Button variant="outline" className="flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                </Link>
              )}

              {bookingData.step < TOTAL_STEPS ? (
                <Button
                  onClick={nextStep}
                  disabled={!canProceedToNext()}
                  className="gradient-primary text-white"
                >
                  Continue
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
