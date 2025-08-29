import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Camera, 
  Tv, 
  Settings, 
  Home, 
  Cog, 
  Plus, 
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Upload,
  ToggleLeft,
  ToggleRight,
  Sparkles
} from "lucide-react";
import { TV_SIZES, WALL_TYPES, MOUNT_TYPES, TIME_SLOTS } from "@/lib/constants";
import ServiceCards from "./service-cards";
import type { BookingFormData, ServiceTierOption, AddOnOption, PreviewResponse } from "@/lib/types";

interface BookingStepsProps {
  currentStep: number;
  totalSteps: number;
  formData: BookingFormData;
  serviceTiers: ServiceTierOption[];
  addOnServices: AddOnOption[];
  onUpdateForm: (data: Partial<BookingFormData>) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onSubmitBooking: () => void;
  onGeneratePreview: (file: File, tvSize: number) => Promise<PreviewResponse>;
  isSubmitting?: boolean;
}

export default function BookingSteps({
  currentStep,
  totalSteps,
  formData,
  serviceTiers,
  addOnServices,
  onUpdateForm,
  onNextStep,
  onPrevStep,
  onSubmitBooking,
  onGeneratePreview,
  isSubmitting = false,
}: BookingStepsProps) {
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showPreviewToggle, setShowPreviewToggle] = useState(false);
  const [showAfterPreview, setShowAfterPreview] = useState(false);

  const progress = (currentStep / totalSteps) * 100;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onUpdateForm({ roomPhoto: file });
    
    // Create preview URL for immediate display
    const previewUrl = URL.createObjectURL(file);
    onUpdateForm({ roomPhotoBase64: previewUrl });
  };

  // AI preview generation removed from intermediate steps
  // Will only occur at final booking summary step

  const handleServiceSelect = (serviceId: number, price: number) => {
    onUpdateForm({ 
      serviceTierId: serviceId, 
      basePrice: price,
      totalPrice: calculateTotal(price, formData.selectedAddOns)
    });
  };

  const handleAddOnToggle = (addOn: AddOnOption, checked: boolean) => {
    let newAddOns = [...formData.selectedAddOns];
    
    if (checked) {
      newAddOns.push({ id: addOn.id, name: addOn.name, price: addOn.price });
    } else {
      newAddOns = newAddOns.filter(item => item.id !== addOn.id);
    }

    const addOnTotal = newAddOns.reduce((sum, item) => sum + item.price, 0);
    const totalPrice = calculateTotal(formData.basePrice, newAddOns);

    onUpdateForm({ 
      selectedAddOns: newAddOns,
      addOnTotal,
      totalPrice
    });
  };

  const calculateTotal = (basePrice: number, addOns: Array<{id: number, name: string, price: number}>) => {
    const base = basePrice || 0;
    const addOnsSum = addOns.reduce((sum, addon) => sum + addon.price, 0);
    return base + addOnsSum;
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return true; // Photo upload is optional
      case 2: return formData.tvSize > 0;
      case 3: return formData.serviceTierId > 0;
      case 4: return formData.wallType !== undefined;
      case 5: return formData.mountType !== undefined;
      case 6: return true; // Add-ons are optional
      case 7: return formData.preferredDate !== "" && formData.preferredTime !== "";
      case 8: return formData.customerName !== "" && formData.customerEmail !== "" && 
                     formData.customerPhone !== "" && formData.address !== "";
      default: return false;
    }
  };

  const stepIcons = [
    <Camera className="w-6 h-6" />,
    <Tv className="w-6 h-6" />,
    <Settings className="w-6 h-6" />,
    <Home className="w-6 h-6" />,
    <Cog className="w-6 h-6" />,
    <Plus className="w-6 h-6" />,
    <Sparkles className="w-6 h-6" />,
    <Calendar className="w-6 h-6" />,
    <User className="w-6 h-6" />,
  ];

  const stepTitles = [
    "Upload Room Photo",
    "Choose TV Size", 
    "Select Service",
    "Wall Type",
    "Mount Type",
    "Add-on Services",
    "Product Assistance",
    "Schedule Installation",
    "Contact Information"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Progress Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {stepTitles[currentStep - 1]}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)] py-8">
        <div className="max-w-2xl w-full mx-auto px-4">
          <Card className="bg-white rounded-3xl shadow-xl">
            <CardContent className="p-8 lg:p-12">
              
              {/* Step 1: Photo Upload */}
              {currentStep === 1 && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                    {stepIcons[0]}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Room Photo</h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Take a photo of the wall where you want your TV mounted. Our AI will show you a preview!
                  </p>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 mb-6 hover:border-primary transition-colors">
                    <input
                      type="file"
                      id="photoUpload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    
                    {!formData.roomPhotoBase64 ? (
                      <label htmlFor="photoUpload" className="cursor-pointer block">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg text-gray-600 mb-2">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-500">PNG, JPG up to 2MB</p>
                      </label>
                    ) : (
                      <div>
                        <img
                          src={formData.roomPhotoBase64}
                          alt="Room preview"
                          className="max-w-full h-64 object-cover rounded-xl mx-auto mb-3"
                        />
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Photo uploaded successfully!
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button variant="ghost" disabled>
                      Skip this step
                    </Button>
                    <Button 
                      onClick={onNextStep}
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: TV Size */}
              {currentStep === 2 && (
                <div>
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                      {stepIcons[1]}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">What's Your TV Size?</h2>
                    <p className="text-lg text-gray-600">Help us determine the best installation approach for your space</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {TV_SIZES.map((tvSize) => (
                      <Button
                        key={tvSize}
                        variant={formData.tvSize === tvSize ? "default" : "outline"}
                        className="p-6 h-auto flex-col space-y-3 hover:border-primary hover:bg-blue-50"
                        onClick={() => {
                          onUpdateForm({ tvSize: tvSize });
                        }}
                      >
                        <Tv className="w-8 h-8" />
                        <div>
                          <div className="text-lg font-semibold">{tvSize}"</div>
                          <div className="text-sm text-gray-500">TV Size</div>
                        </div>
                      </Button>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={onPrevStep}>
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={onNextStep}
                      disabled={!isStepValid()}
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Service Selection */}
              {currentStep === 3 && (
                <div>
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                      {stepIcons[2]}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Service</h2>
                    <p className="text-lg text-gray-600">Select the installation service that fits your needs</p>
                  </div>

                  <ServiceCards
                    serviceTiers={serviceTiers}
                    tvSize={formData.tvSize}
                    selectedService={formData.serviceTierId}
                    onSelectService={handleServiceSelect}
                  />

                  <div className="flex justify-between mt-8">
                    <Button variant="ghost" onClick={onPrevStep}>
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={onNextStep}
                      disabled={!isStepValid()}
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Wall Type */}
              {currentStep === 4 && (
                <div>
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                      {stepIcons[3]}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">What's Your Wall Type?</h2>
                    <p className="text-lg text-gray-600">This helps us prepare the right tools and mounting hardware</p>
                  </div>

                  {/* Progressive AI Preview Teaser */}
                  {formData.roomPhotoBase64 && (
                    <div className="mb-8">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-3">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">AI Preview</h3>
                        </div>
                        
                        <div className="relative">
                          <img
                            src={formData.roomPhotoBase64}
                            alt="Your room"
                            className="w-full h-64 object-cover rounded-xl"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl flex items-end">
                            <div className="p-4 text-white w-full">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                                  <span className="text-sm font-medium">Analyzing wall structure...</span>
                                </div>
                                <div className="text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                                  75% complete
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {WALL_TYPES.map((wall) => (
                      <Button
                        key={wall.key}
                        variant={formData.wallType === wall.key ? "default" : "outline"}
                        className="p-6 h-auto text-left hover:border-primary hover:bg-blue-50"
                        onClick={() => onUpdateForm({ wallType: wall.key as 'drywall' | 'concrete' | 'brick' | 'other' })}
                      >
                        <div className="w-full">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{wall.name}</h3>
                          <p className="text-sm text-gray-600">{wall.description}</p>
                        </div>
                      </Button>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={onPrevStep}>
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={onNextStep}
                      disabled={!isStepValid()}
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 5: Mount Type */}
              {currentStep === 5 && (
                <div>
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                      {stepIcons[4]}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Mount Type</h2>
                    <p className="text-lg text-gray-600">Select how you want your TV to be positioned</p>
                  </div>

                  {/* Progressive AI Preview Teaser */}
                  {formData.roomPhotoBase64 && (
                    <div className="mb-8">
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mr-3">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">AI Preview</h3>
                        </div>
                        
                        <div className="relative">
                          <img
                            src={formData.roomPhotoBase64}
                            alt="Your room"
                            className="w-full h-64 object-cover rounded-xl"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl flex items-end">
                            <div className="p-4 text-white w-full">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                                  <span className="text-sm font-medium">Calculating mount placement...</span>
                                </div>
                                <div className="text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                                  90% complete
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 mb-8">
                    {MOUNT_TYPES.map((mount) => (
                      <Button
                        key={mount.key}
                        variant={formData.mountType === mount.key ? "default" : "outline"}
                        className="w-full p-6 text-left hover:border-primary hover:bg-blue-50"
                        onClick={() => onUpdateForm({ mountType: mount.key as 'fixed' | 'tilting' | 'full-motion' })}
                      >
                        <div className="flex items-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                            <Cog className="w-8 h-8 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{mount.name}</h3>
                            <p className="text-sm text-gray-600">{mount.description}</p>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={onPrevStep}>
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={onNextStep}
                      disabled={!isStepValid()}
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 6: Add-ons */}
              {currentStep === 6 && (
                <div>
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                      {stepIcons[5]}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Add-on Services</h2>
                    <p className="text-lg text-gray-600">Enhance your installation with these optional services</p>
                  </div>

                  <div className="space-y-4 mb-8">
                    {addOnServices.map((addon) => (
                      <Card
                        key={addon.id}
                        className="p-4 cursor-pointer hover:border-primary hover:bg-blue-50 transition-all"
                      >
                        <div className="flex items-center space-x-4">
                          <Checkbox
                            id={`addon-${addon.id}`}
                            checked={formData.selectedAddOns.some(item => item.id === addon.id)}
                            onCheckedChange={(checked) => handleAddOnToggle(addon, checked as boolean)}
                          />
                          <div className="flex-1">
                            <Label htmlFor={`addon-${addon.id}`} className="text-lg font-semibold text-gray-900 cursor-pointer">
                              {addon.name}
                            </Label>
                            <p className="text-sm text-gray-600">{addon.description}</p>
                          </div>
                          <div className="text-lg font-semibold text-gray-900">+€{addon.price}</div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={onPrevStep}>
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={onNextStep}
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 7: Product Assistance */}
              {currentStep === 7 && (
                <div>
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                      {stepIcons[6]}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Product Sourcing Assistance</h2>
                    <p className="text-lg text-gray-600 mb-6">
                      Need help selecting the perfect TV or accessories? We offer comprehensive guidance and work closely with Harvey Norman retailers in Ireland.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Product Assistance Options */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional Product Selection</h3>
                          <p className="text-gray-600 mb-4">
                            Our experts provide personalized recommendations based on your room size, viewing preferences, and budget.
                          </p>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-4 border">
                              <h4 className="font-medium text-gray-900 mb-2">TV Selection Guide</h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Room size optimization</li>
                                <li>• Technology comparison (OLED, QLED, LED)</li>
                                <li>• Brand recommendations</li>
                                <li>• Smart features assessment</li>
                              </ul>
                            </div>
                            <div className="bg-white rounded-lg p-4 border">
                              <h4 className="font-medium text-gray-900 mb-2">Accessory Recommendations</h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Sound system pairing</li>
                                <li>• Gaming console setup</li>
                                <li>• Streaming device options</li>
                                <li>• Cable management solutions</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Harvey Norman Partnership */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Home className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Harvey Norman Partnership</h3>
                          <p className="text-gray-600 mb-4">
                            We work closely with Harvey Norman retailers across Ireland to ensure you get the best products at competitive prices.
                          </p>
                          <div className="bg-white rounded-lg p-4 border">
                            <h4 className="font-medium text-gray-900 mb-2">Partnership Benefits</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Exclusive installer discounts</li>
                                <li>• Extended warranty options</li>
                                <li>• Priority delivery scheduling</li>
                              </ul>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Professional setup coordination</li>
                                <li>• Quality assurance guarantee</li>
                                <li>• Local store support</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Assistance Selection */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Do you need product sourcing assistance?</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id="assistance-yes"
                            name="productAssistance"
                            value="yes"
                            checked={formData.productAssistance === "yes"}
                            onChange={(e) => onUpdateForm({ productAssistance: e.target.value })}
                            className="w-4 h-4 text-primary"
                          />
                          <label htmlFor="assistance-yes" className="text-gray-700 font-medium">
                            Yes, I need help selecting products
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id="assistance-partial"
                            name="productAssistance"
                            value="partial"
                            checked={formData.productAssistance === "partial"}
                            onChange={(e) => onUpdateForm({ productAssistance: e.target.value })}
                            className="w-4 h-4 text-primary"
                          />
                          <label htmlFor="assistance-partial" className="text-gray-700 font-medium">
                            I need advice on specific items only
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id="assistance-no"
                            name="productAssistance"
                            value="no"
                            checked={formData.productAssistance === "no"}
                            onChange={(e) => onUpdateForm({ productAssistance: e.target.value })}
                            className="w-4 h-4 text-primary"
                          />
                          <label htmlFor="assistance-no" className="text-gray-700 font-medium">
                            No, I already have my products
                          </label>
                        </div>
                      </div>

                      {formData.productAssistance && formData.productAssistance !== "no" && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-gray-900 mb-2">Additional Information</h4>
                          <Textarea
                            placeholder="Tell us about your preferences, budget range, or specific questions about products..."
                            value={formData.productNotes || ""}
                            onChange={(e) => onUpdateForm({ productNotes: e.target.value })}
                            className="w-full"
                            rows={3}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <Button 
                      variant="outline" 
                      onClick={onPrevStep}
                      className="flex items-center"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={onNextStep}
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 8: Schedule */}
              {currentStep === 8 && (
                <div>
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                      {stepIcons[7]}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Schedule Your Installation</h2>
                    <p className="text-lg text-gray-600">Choose your preferred date and time</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <Label htmlFor="preferredDate" className="text-sm font-medium text-gray-700 mb-2 block">
                        Preferred Date
                      </Label>
                      <Input
                        id="preferredDate"
                        type="date"
                        value={formData.preferredDate}
                        onChange={(e) => onUpdateForm({ preferredDate: e.target.value })}
                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="preferredTime" className="text-sm font-medium text-gray-700 mb-2 block">
                        Preferred Time
                      </Label>
                      <Select
                        value={formData.preferredTime}
                        onValueChange={(value) => onUpdateForm({ preferredTime: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Card className="bg-blue-50 border-blue-200 p-6 mb-8">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white text-xs font-bold">i</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Installation Notes</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Installation typically takes 1-2 hours</li>
                          <li>• Please ensure someone is home during the scheduled time</li>
                          <li>• We'll call 30 minutes before arrival</li>
                        </ul>
                      </div>
                    </div>
                  </Card>

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={onPrevStep}>
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={onNextStep}
                      disabled={!isStepValid()}
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 9: Contact & Review */}
              {currentStep === 9 && (
                <div>
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                      {stepIcons[7]}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Information</h2>
                    <p className="text-lg text-gray-600">We need your details to confirm the booking</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <Label htmlFor="customerName">Full Name</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => onUpdateForm({ customerName: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => onUpdateForm({ customerEmail: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerPhone">Phone Number</Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => onUpdateForm({ customerPhone: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => onUpdateForm({ address: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="mb-8">
                    <Label htmlFor="customerNotes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="customerNotes"
                      value={formData.customerNotes || ""}
                      onChange={(e) => onUpdateForm({ customerNotes: e.target.value })}
                      placeholder="Any special instructions or requirements..."
                      className="mt-1"
                    />
                  </div>

                  {/* Final AI Preview */}
                  {formData.roomPhotoBase64 && (
                    <div className="mb-8">
                      <div className="bg-gradient-to-br from-gold-50 to-yellow-50 rounded-2xl p-6 border border-yellow-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center mr-3">
                              <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">AI Preview</h3>
                          </div>
                          {formData.aiPreviewUrl && (
                            <div className="flex bg-white rounded-lg p-1">
                              <Button
                                size="sm"
                                variant={!showAfterPreview ? "default" : "ghost"}
                                onClick={() => setShowAfterPreview(false)}
                              >
                                Before
                              </Button>
                              <Button
                                size="sm"
                                variant={showAfterPreview ? "default" : "ghost"}
                                onClick={() => setShowAfterPreview(true)}
                              >
                                After
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <div className="relative">
                          {!formData.aiPreviewUrl ? (
                            <>
                              <img
                                src={formData.roomPhotoBase64}
                                alt="Your room"
                                className="w-full h-64 object-cover rounded-xl"
                              />
                              <div className="absolute bottom-4 left-4 right-4">
                                <div className="bg-black/70 rounded-lg p-3 text-white text-center">
                                  <p className="text-sm">AI preview will be generated at the final booking step</p>
                                </div>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Booking Summary */}
                  <Card className="bg-gray-50 p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">TV Size:</span>
                        <span>{formData.tvSize}"</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service:</span>
                        <span>€{formData.basePrice}</span>
                      </div>
                      {formData.selectedAddOns.map((addon) => {
                        return (
                          <div key={addon.id} className="flex justify-between">
                            <span className="text-gray-600">{addon.name}:</span>
                            <span>€{addon.price}</span>
                          </div>
                        );
                      })}
                      {formData.preferredDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date:</span>
                          <span>{new Date(formData.preferredDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {formData.preferredTime && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Time:</span>
                          <span>{TIME_SLOTS.find(slot => slot.value === formData.preferredTime)?.label}</span>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-200 mt-4 pt-4">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Total</span>
                        <span>€{formData.totalPrice}</span>
                      </div>
                    </div>
                  </Card>

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={onPrevStep}>
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={onSubmitBooking}
                      disabled={!isStepValid() || isSubmitting}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:opacity-90"
                    >
                      {isSubmitting ? "Processing..." : "Complete Booking"}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
