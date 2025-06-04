import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, ArrowLeft } from "lucide-react";
import { PhotoUpload } from "@/components/booking/photo-upload";
import { TVSizeSelection } from "@/components/booking/tv-size-selection";
import { ServiceSelection } from "@/components/booking/service-selection";
import { ContactForm } from "@/components/booking/contact-form";
import { BookingFormData, BookingStep } from "@/lib/types";
import { WALL_TYPES, MOUNT_TYPES, TIME_SLOTS } from "@/lib/constants";

const TOTAL_STEPS = 8;

const stepTitles = {
  1: "Upload Your Room Photo",
  2: "What's Your TV Size?",
  3: "Choose Your Service",
  4: "What's Your Wall Type?",
  5: "Choose Mount Type",
  6: "Add-on Services",
  7: "Schedule Your Installation",
  8: "Contact Information"
};

export default function BookingFlow() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<BookingStep>(1);
  const [formData, setFormData] = useState<BookingFormData>({
    tvSize: 0,
    serviceTierId: 0,
    basePrice: 0,
    wallType: 'drywall',
    mountType: 'fixed',
    selectedAddOns: [],
    addOnTotal: 0,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    totalPrice: 0
  });

  const updateFormData = (data: Partial<BookingFormData>) => {
    setFormData(prev => {
      const updated = { ...prev, ...data };
      // Recalculate total price
      updated.totalPrice = updated.basePrice + updated.addOnTotal;
      return updated;
    });
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => (prev + 1) as BookingStep);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as BookingStep);
    }
  };

  const handleExit = () => {
    if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
      navigate('/');
    }
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 1: return true; // Photo upload is optional
      case 2: return formData.tvSize > 0;
      case 3: return formData.serviceTierId > 0;
      case 4: return Boolean(formData.wallType);
      case 5: return Boolean(formData.mountType);
      case 6: return true; // Add-ons are optional
      case 7: return Boolean(formData.scheduledDate && formData.scheduledTime);
      case 8: return Boolean(formData.customerName && formData.customerEmail && formData.customerPhone && formData.address);
      default: return false;
    }
  };

  const renderStep = () => {
    const stepProps = {
      formData,
      updateFormData,
      onNext: handleNext,
      onPrev: handlePrev,
      isValid: isStepValid()
    };

    switch (currentStep) {
      case 1:
        return <PhotoUpload {...stepProps} />;
      case 2:
        return <TVSizeSelection {...stepProps} />;
      case 3:
        return <ServiceSelection {...stepProps} />;
      case 4:
        return <WallTypeStep {...stepProps} />;
      case 5:
        return <MountTypeStep {...stepProps} />;
      case 6:
        return <AddOnStep {...stepProps} />;
      case 7:
        return <ScheduleStep {...stepProps} />;
      case 8:
        return <ContactForm {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      {/* Progress Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExit}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)] py-8">
        <div className="max-w-2xl w-full mx-auto px-4">
          <Card className="card-gradient shadow-xl">
            <CardHeader className="text-center pb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                {stepTitles[currentStep]}
              </h2>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              {renderStep()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Wall Type Step Component
function WallTypeStep({ formData, updateFormData, onNext, onPrev }: any) {
  const handleSelect = (wallType: string) => {
    updateFormData({ wallType });
  };

  return (
    <div className="space-y-6">
      <p className="text-lg text-gray-600 text-center mb-8">
        This helps us prepare the right tools and mounting hardware
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {WALL_TYPES.map((wall) => (
          <Button
            key={wall.id}
            variant="outline"
            className={`p-6 h-auto text-left hover:border-primary hover:bg-blue-50 transition-all duration-300 ${
              formData.wallType === wall.id ? 'border-primary bg-blue-50' : ''
            }`}
            onClick={() => handleSelect(wall.id)}
          >
            <div className="space-y-4">
              <img 
                src={wall.image} 
                alt={wall.name}
                className="w-full h-32 object-cover rounded-lg"
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{wall.name}</h3>
                <p className="text-sm text-gray-600">{wall.description}</p>
              </div>
            </div>
          </Button>
        ))}
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!formData.wallType} className="btn-primary">
          Continue
        </Button>
      </div>
    </div>
  );
}

// Mount Type Step Component
function MountTypeStep({ formData, updateFormData, onNext, onPrev }: any) {
  const handleSelect = (mountType: string) => {
    updateFormData({ mountType });
  };

  return (
    <div className="space-y-6">
      <p className="text-lg text-gray-600 text-center mb-8">
        Select how you want your TV to be positioned
      </p>

      <div className="space-y-4">
        {MOUNT_TYPES.map((mount) => (
          <Button
            key={mount.id}
            variant="outline"
            className={`w-full p-6 text-left hover:border-primary hover:bg-blue-50 transition-all duration-300 ${
              formData.mountType === mount.id ? 'border-primary bg-blue-50' : ''
            }`}
            onClick={() => handleSelect(mount.id)}
          >
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                <i className={`${mount.icon} text-2xl text-gray-600`}></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{mount.name}</h3>
                <p className="text-sm text-gray-600">{mount.description}</p>
              </div>
            </div>
          </Button>
        ))}
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!formData.mountType} className="btn-primary">
          Continue
        </Button>
      </div>
    </div>
  );
}

// Add-on Step Component
function AddOnStep({ formData, updateFormData, onNext, onPrev }: any) {
  const addOns = [
    { id: 1, name: 'Cable Concealment', description: 'Hide cables inside the wall for a clean look', price: 49 },
    { id: 2, name: 'Soundbar Installation', description: 'Mount your soundbar below the TV', price: 39 },
    { id: 3, name: 'TV Calibration', description: 'Professional picture and sound optimization', price: 29 }
  ];

  const handleToggleAddOn = (addOn: any) => {
    const isSelected = formData.selectedAddOns.some((item: any) => item.id === addOn.id);
    let newAddOns;
    
    if (isSelected) {
      newAddOns = formData.selectedAddOns.filter((item: any) => item.id !== addOn.id);
    } else {
      newAddOns = [...formData.selectedAddOns, addOn];
    }
    
    const addOnTotal = newAddOns.reduce((sum: number, item: any) => sum + item.price, 0);
    
    updateFormData({ 
      selectedAddOns: newAddOns,
      addOnTotal
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-lg text-gray-600 text-center mb-8">
        Enhance your installation with these optional services
      </p>

      <div className="space-y-4">
        {addOns.map((addOn) => {
          const isSelected = formData.selectedAddOns.some((item: any) => item.id === addOn.id);
          
          return (
            <label
              key={addOn.id}
              className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                isSelected ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-primary hover:bg-blue-50'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={isSelected}
                onChange={() => handleToggleAddOn(addOn)}
              />
              <div className="flex items-center w-full">
                <div className={`w-6 h-6 border-2 rounded mr-4 flex items-center justify-center ${
                  isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                }`}>
                  {isSelected && <i className="fas fa-check text-white text-sm"></i>}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{addOn.name}</h3>
                  <p className="text-sm text-gray-600">{addOn.description}</p>
                </div>
                <div className="text-lg font-semibold text-gray-900">+€{addOn.price}</div>
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} className="btn-primary">
          Continue
        </Button>
      </div>
    </div>
  );
}

// Schedule Step Component
function ScheduleStep({ formData, updateFormData, onNext, onPrev }: any) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleDateChange = (date: string) => {
    updateFormData({ scheduledDate: date });
  };

  const handleTimeChange = (time: string) => {
    updateFormData({ scheduledTime: time });
  };

  return (
    <div className="space-y-6">
      <p className="text-lg text-gray-600 text-center mb-8">
        Choose your preferred date and time
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Date
          </label>
          <input
            type="date"
            min={minDate}
            value={formData.scheduledDate || ''}
            onChange={(e) => handleDateChange(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Time
          </label>
          <select
            value={formData.scheduledTime || ''}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="input-field"
          >
            <option value="">Select time</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start">
            <i className="fas fa-info-circle text-primary text-xl mr-3 mt-1"></i>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Installation Notes</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Installation typically takes 1-2 hours</li>
                <li>• Please ensure someone is home during the scheduled time</li>
                <li>• We'll call 30 minutes before arrival</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!formData.scheduledDate || !formData.scheduledTime}
          className="btn-primary"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
