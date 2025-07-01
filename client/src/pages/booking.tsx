import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, ArrowLeft, Camera, User, Receipt, Star } from 'lucide-react';
import { useBooking } from '@/hooks/use-booking';
import { useToast } from '@/hooks/use-toast';
import SimplifiedAuthDialog from '@/components/SimplifiedAuthDialog';
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
  const { bookingData, nextStep, prevStep, resetBooking, updateBookingData } = useBooking();
  const { toast } = useToast();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authDialogTab, setAuthDialogTab] = useState<'invoice' | 'guest' | 'oauth'>('invoice');
  const [currentUser, setCurrentUser] = useState(null);

  // Check authentication status
  const { data: authUser, isLoading: authLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Fetch service tiers and addons
  const { data: serviceTiers = [] } = useQuery({
    queryKey: ['/api/service-tiers'],
  });

  const { data: addons = [] } = useQuery({
    queryKey: ['/api/addons'],
  });

  useEffect(() => {
    if (!authLoading && authUser) {
      setCurrentUser(authUser);
      // Auto-populate user data in booking
      updateBookingData({
        userId: authUser.id,
        customerName: authUser.firstName && authUser.lastName ? 
          `${authUser.firstName} ${authUser.lastName}` : authUser.email,
        customerEmail: authUser.email,
        customerPhone: authUser.phone || ''
      });
    }
  }, [authUser, authLoading, updateBookingData]);

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
        return bookingData.mountType !== ''; // Mount type selection includes wall mount options
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
        return <MountTypeSelection onNext={nextStep} onBack={prevStep} />;
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

  // Show authentication options if user is not logged in
  if (!authLoading && !currentUser) {
    return (
      <div className="min-h-screen gradient-background">
        <div className="flex items-center justify-center min-h-screen py-8">
          <div className="max-w-4xl w-full mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Book Your TV Installation
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Try our AI room preview for free or sign in for unlimited access
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free AI Preview Card */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <Camera className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Free AI Preview</h2>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Try our AI room visualization with 3 daily previews
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2">Daily AI previews:</span>
                    <span className="font-medium">2/3 used</span>
                  </div>
                </div>

                <Button
                  onClick={() => setShowAuthDialog(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg mb-4"
                >
                  Start Free Preview (1 left today)
                </Button>
                
                <p className="text-xs text-gray-500 text-center">
                  Visual AI generation only - full booking requires sign in
                </p>
              </div>

              {/* Full Access Card */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Full Access Account</h2>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Create an account for unlimited AI previews and complete booking features
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    <span className="text-sm">Unlimited AI room visualizations</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    <span className="text-sm">Complete booking and payment process</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    <span className="text-sm">Booking history & QR tracking</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    <span className="text-sm">Priority customer support</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    <span className="text-sm">Exclusive discounts & referral rewards</span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setAuthDialogTab('oauth');
                    setShowAuthDialog(true);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg"
                >
                  <User className="w-4 h-4 mr-2" />
                  Create Account / Sign In
                </Button>
              </div>
            </div>

            {/* Book Faster Than Ever Section */}
            <div className="mt-16 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Book Faster Than Ever
              </h2>
              <p className="text-xl text-gray-600 mb-12">
                Choose your preferred way to get started
              </p>

              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {/* Harvey Norman Invoice */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 border border-blue-200">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Receipt className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Harvey Norman Receipt</h3>
                  <p className="text-gray-600 mb-6">
                    Already bought a TV? Use your receipt number for instant access
                  </p>
                  <div className="bg-white/70 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600 mb-2">Example format:</p>
                    <code className="text-blue-600 font-mono text-sm">HN-DUB-2024-001234</code>
                  </div>
                  <Button
                    onClick={() => {
                      setAuthDialogTab('invoice');
                      setShowAuthDialog(true);
                    }}
                    variant="outline"
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    Use Receipt Number
                  </Button>
                </div>

                {/* Guest Booking */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 border border-green-200">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Quick Guest Booking</h3>
                  <p className="text-gray-600 mb-6">
                    Start booking immediately with just email and phone
                  </p>
                  <div className="bg-white/70 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600">Required:</p>
                    <ul className="text-sm text-gray-600 mt-2 space-y-1">
                      <li>• Email address</li>
                      <li>• Phone number</li>
                    </ul>
                  </div>
                  <Button
                    onClick={() => {
                      setAuthDialogTab('guest');
                      setShowAuthDialog(true);
                    }}
                    variant="outline"
                    className="w-full border-green-300 text-green-700 hover:bg-green-50"
                  >
                    Start Guest Booking
                  </Button>
                </div>

                {/* Full Registration */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-8 border border-purple-200">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Complete Account</h3>
                  <p className="text-gray-600 mb-6">
                    Full account with unlimited features and premium support
                  </p>
                  <div className="bg-white/70 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600">Includes:</p>
                    <ul className="text-sm text-gray-600 mt-2 space-y-1">
                      <li>• Booking history</li>
                      <li>• Exclusive discounts</li>
                      <li>• Priority support</li>
                    </ul>
                  </div>
                  <Button
                    onClick={() => {
                      setAuthDialogTab('oauth');
                      setShowAuthDialog(true);
                    }}
                    variant="outline"
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    Create Full Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <SimplifiedAuthDialog
          isOpen={showAuthDialog}
          onClose={() => setShowAuthDialog(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setShowAuthDialog(false);
            toast({
              title: "Welcome!",
              description: "You can now proceed with your booking.",
            });
          }}
          defaultTab={authDialogTab}
        />
      </div>
    );
  }

  // Show booking flow if user is authenticated
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
