import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BookingStep from "@/components/BookingStep";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Camera, 
  Tv, 
  Wrench, 
  Home, 
  Settings, 
  Plus, 
  Calendar, 
  User,
  X,
  Upload,
  CloudUpload
} from "lucide-react";
import { TV_SIZES, WALL_TYPES, MOUNT_TYPES, TIME_SLOTS } from "@/lib/constants";
import { getMinDate, getServiceTiersForTvSize, calculateBookingTotal, formatPrice } from "@/lib/utils";

interface BookingData {
  step: number;
  photo: string | null;
  aiPreview: string | null;
  tvSize: number | null;
  serviceTierId: number | null;
  wallType: string;
  mountType: string;
  addons: Array<{ id: number; name: string; price: number }>;
  date: string;
  time: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  customerNotes: string;
  basePrice: number;
  total: number;
}

export default function BookingFlow() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8;
  
  const [bookingData, setBookingData] = useState<BookingData>({
    step: 1,
    photo: null,
    aiPreview: null,
    tvSize: null,
    serviceTierId: null,
    wallType: '',
    mountType: '',
    addons: [],
    date: '',
    time: '',
    contact: {
      name: '',
      email: '',
      phone: '',
      address: ''
    },
    customerNotes: '',
    basePrice: 0,
    total: 0
  });

  const { data: serviceTiers = [] } = useQuery({
    queryKey: ["/api/service-tiers"],
  });

  const { data: addons = [] } = useQuery({
    queryKey: ["/api/addons"],
  });

  // Photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await apiRequest('POST', '/api/upload-room-image', formData);
      return response.json();
    },
    onSuccess: (data) => {
      setBookingData(prev => ({
        ...prev,
        photo: data.imageData
      }));
      toast({
        title: "Photo uploaded successfully!",
        description: "Your room photo has been analyzed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // AI preview generation mutation
  const generatePreviewMutation = useMutation({
    mutationFn: async ({ imageData, tvSize }: { imageData: string; tvSize: number }) => {
      const response = await apiRequest('POST', '/api/generate-preview', {
        imageData,
        tvSize
      });
      return response.json();
    },
    onSuccess: (data) => {
      setBookingData(prev => ({
        ...prev,
        aiPreview: data.imageUrl
      }));
      toast({
        title: "AI Preview Generated!",
        description: "See how your TV will look on the wall.",
      });
    },
    onError: (error) => {
      toast({
        title: "Preview generation failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Booking creation mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      // Create user first
      const userResponse = await apiRequest('POST', '/api/users', {
        name: bookingData.contact.name,
        email: bookingData.contact.email,
        phone: bookingData.contact.phone,
        role: 'customer'
      });
      const user = await userResponse.json();

      // Create booking
      const response = await apiRequest('POST', '/api/bookings', {
        userId: user.id,
        serviceTierId: bookingData.serviceTierId,
        tvSize: bookingData.tvSize,
        wallType: bookingData.wallType,
        mountType: bookingData.mountType,
        addons: bookingData.addons,
        originalImageUrl: bookingData.photo,
        aiPreviewUrl: bookingData.aiPreview,
        scheduledDate: new Date(bookingData.date),
        scheduledTime: bookingData.time,
        address: bookingData.contact.address,
        customerNotes: bookingData.customerNotes,
        basePrice: bookingData.basePrice.toFixed(2),
        addonsTotal: bookingData.addons.reduce((sum: number, addon: any) => sum + addon.price, 0).toFixed(2),
        totalPrice: bookingData.total.toFixed(2)
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Booking Confirmed!",
        description: "Your TV installation has been scheduled.",
      });
      setLocation(`/customer/${data.qrCode}`);
    },
    onError: (error) => {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadPhotoMutation.mutate(file);
    }
  };

  const handleTVSizeSelect = (size: number) => {
    setBookingData(prev => ({ ...prev, tvSize: size }));
    
    // Generate AI preview if photo exists
    if (bookingData.photo) {
      generatePreviewMutation.mutate({
        imageData: bookingData.photo,
        tvSize: size
      });
    }
  };

  const handleServiceSelect = (serviceTierId: number) => {
    const selectedTier = serviceTiers.find(tier => tier.id === serviceTierId);
    if (selectedTier) {
      // Use customerPrice (includes fees) for booking calculations
      const customerPrice = parseFloat(selectedTier.customerPrice || selectedTier.basePrice);
      const total = calculateBookingTotal(customerPrice, bookingData.addons);
      setBookingData(prev => ({
        ...prev,
        serviceTierId,
        basePrice: customerPrice,
        total
      }));
    }
  };

  const handleAddonToggle = (addon: any, checked: boolean) => {
    setBookingData(prev => {
      const newAddons = checked
        ? [...prev.addons, { id: addon.id, name: addon.name, price: parseFloat(addon.price) }]
        : prev.addons.filter(a => a.id !== addon.id);
      
      const total = calculateBookingTotal(prev.basePrice, newAddons);
      return { ...prev, addons: newAddons, total };
    });
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
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
      case 1: return true; // Photo upload is optional
      case 2: return bookingData.tvSize !== null;
      case 3: return bookingData.serviceTierId !== null;
      case 4: return bookingData.wallType !== '';
      case 5: return bookingData.mountType !== '';
      case 6: return true; // Addons are optional
      case 7: return bookingData.date !== '' && bookingData.time !== '';
      case 8: return Object.values(bookingData.contact).every(value => value.trim() !== '');
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BookingStep
            title="Upload Your Room Photo"
            description="Take a photo of the wall where you want your TV mounted. Our AI will show you a preview!"
            icon={<Camera className="w-8 h-8" />}
            canGoNext={canProceed()}
            canGoBack={false}
            onNext={nextStep}
            onBack={prevStep}
          >
            <div 
              className="border-2 border-dashed border-gray-300 rounded-2xl p-8 mb-6 hover:border-primary transition-colors cursor-pointer"
              onClick={() => document.getElementById('photoUpload')?.click()}
            >
              <input 
                type="file" 
                id="photoUpload" 
                className="hidden" 
                accept="image/*" 
                onChange={handlePhotoUpload}
              />
              {bookingData.photo ? (
                <div className="text-center">
                  <img 
                    src={bookingData.photo} 
                    alt="Room preview"
                    className="max-w-full h-64 object-cover rounded-xl mx-auto mb-4"
                  />
                  <p className="text-sm text-green-600">Photo uploaded successfully!</p>
                </div>
              ) : (
                <div className="text-center">
                  <CloudUpload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                </div>
              )}
            </div>
            <div className="text-center">
              <Button variant="outline" onClick={nextStep}>
                Skip this step
              </Button>
            </div>
          </BookingStep>
        );

      case 2:
        return (
          <BookingStep
            title="What's Your TV Size?"
            description="Select your TV size to see the accurate preview"
            icon={<Tv className="w-8 h-8" />}
            canGoNext={canProceed()}
            canGoBack={true}
            onNext={nextStep}
            onBack={prevStep}
          >
            {bookingData.photo && bookingData.aiPreview && (
              <div className="mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">AI Preview</h3>
                      <div className="flex bg-white rounded-lg p-1 border">
                        <Button size="sm" variant="default">Before</Button>
                        <Button size="sm" variant="outline">After</Button>
                      </div>
                    </div>
                    <img 
                      src={bookingData.aiPreview} 
                      alt="AI preview"
                      className="w-full h-64 object-cover rounded-xl"
                    />
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {TV_SIZES.map(size => (
                <Button
                  key={size}
                  variant={bookingData.tvSize === size ? "default" : "outline"}
                  className="p-6 h-auto flex-col"
                  onClick={() => handleTVSizeSelect(size)}
                >
                  <Tv className="w-8 h-8 mb-2" />
                  <div className="text-lg font-semibold">{size}"</div>
                  <div className="text-sm text-gray-500">
                    {size <= 43 ? 'Small' : size <= 65 ? 'Large' : 'X-Large'}
                  </div>
                </Button>
              ))}
            </div>
          </BookingStep>
        );

      case 3:
        const availableServices = getServiceTiersForTvSize(bookingData.tvSize || 43, serviceTiers);
        return (
          <BookingStep
            title="Choose Your Service"
            description="Select the installation service that fits your needs"
            icon={<Wrench className="w-8 h-8" />}
            canGoNext={canProceed()}
            canGoBack={true}
            onNext={nextStep}
            onBack={prevStep}
          >
            <div className="space-y-4">
              {availableServices.map(service => (
                <Button
                  key={service.id}
                  variant={bookingData.serviceTierId === service.id ? "default" : "outline"}
                  className="w-full p-6 h-auto justify-between"
                  onClick={() => handleServiceSelect(service.id)}
                >
                  <div className="text-left">
                    <div className="text-lg font-semibold">{service.name}</div>
                    <div className="text-sm text-gray-600">{service.description}</div>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {formatPrice(service.customerPrice || service.basePrice)}
                  </div>
                </Button>
              ))}
            </div>
          </BookingStep>
        );

      case 4:
        return (
          <BookingStep
            title="What's Your Wall Type?"
            description="This helps us prepare the right tools and mounting hardware"
            icon={<Home className="w-8 h-8" />}
            canGoNext={canProceed()}
            canGoBack={true}
            onNext={nextStep}
            onBack={prevStep}
          >
            <div className="grid md:grid-cols-2 gap-4">
              {WALL_TYPES.map(wall => (
                <Button
                  key={wall.value}
                  variant={bookingData.wallType === wall.value ? "default" : "outline"}
                  className="p-6 h-auto flex-col text-left"
                  onClick={() => setBookingData(prev => ({ ...prev, wallType: wall.value }))}
                >
                  <h3 className="text-lg font-semibold mb-2">{wall.label}</h3>
                  <p className="text-sm text-gray-600">{wall.description}</p>
                </Button>
              ))}
            </div>
          </BookingStep>
        );

      case 5:
        return (
          <BookingStep
            title="Choose Mount Type"
            description="Select how you want your TV to be positioned"
            icon={<Settings className="w-8 h-8" />}
            canGoNext={canProceed()}
            canGoBack={true}
            onNext={nextStep}
            onBack={prevStep}
          >
            <div className="space-y-4">
              {MOUNT_TYPES.map(mount => (
                <Button
                  key={mount.value}
                  variant={bookingData.mountType === mount.value ? "default" : "outline"}
                  className="w-full p-6 h-auto justify-start"
                  onClick={() => setBookingData(prev => ({ ...prev, mountType: mount.value }))}
                >
                  <div className="text-left">
                    <h3 className="text-lg font-semibold mb-1">{mount.label}</h3>
                    <p className="text-sm text-gray-600">{mount.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </BookingStep>
        );

      case 6:
        return (
          <BookingStep
            title="Add-on Services"
            description="Enhance your installation with these optional services"
            icon={<Plus className="w-8 h-8" />}
            canGoNext={canProceed()}
            canGoBack={true}
            onNext={nextStep}
            onBack={prevStep}
          >
            <div className="space-y-4">
              {addons.map(addon => (
                <div key={addon.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    checked={bookingData.addons.some(a => a.id === addon.id)}
                    onCheckedChange={(checked) => handleAddonToggle(addon, checked as boolean)}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{addon.name}</h3>
                    <p className="text-sm text-gray-600">{addon.description}</p>
                  </div>
                  <div className="text-lg font-semibold">{formatPrice(addon.price)}</div>
                </div>
              ))}
            </div>
            {bookingData.total > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Current Total:</span>
                  <span>{formatPrice(bookingData.total)}</span>
                </div>
              </div>
            )}
          </BookingStep>
        );

      case 7:
        return (
          <BookingStep
            title="Schedule Your Installation"
            description="Choose your preferred date and time"
            icon={<Calendar className="w-8 h-8" />}
            canGoNext={canProceed()}
            canGoBack={true}
            onNext={nextStep}
            onBack={prevStep}
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="date">Preferred Date</Label>
                <Input
                  type="date"
                  id="date"
                  min={getMinDate()}
                  value={bookingData.date}
                  onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="time">Preferred Time</Label>
                <Select value={bookingData.time} onValueChange={(value) => setBookingData(prev => ({ ...prev, time: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(slot => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-6 p-6 bg-blue-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2">Installation Notes</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Installation typically takes 1-2 hours</li>
                <li>• Please ensure someone is home during the scheduled time</li>
                <li>• We'll call 30 minutes before arrival</li>
              </ul>
            </div>
          </BookingStep>
        );

      case 8:
        return (
          <BookingStep
            title="Contact Information"
            description="We need your details to confirm the booking"
            icon={<User className="w-8 h-8" />}
            canGoNext={canProceed()}
            canGoBack={true}
            onNext={() => createBookingMutation.mutate(bookingData)}
            onBack={prevStep}
            nextLabel="Complete Booking"
          >
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={bookingData.contact.name}
                  onChange={(e) => setBookingData(prev => ({
                    ...prev,
                    contact: { ...prev.contact, name: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  value={bookingData.contact.email}
                  onChange={(e) => setBookingData(prev => ({
                    ...prev,
                    contact: { ...prev.contact, email: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  type="tel"
                  id="phone"
                  value={bookingData.contact.phone}
                  onChange={(e) => setBookingData(prev => ({
                    ...prev,
                    contact: { ...prev.contact, phone: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={bookingData.contact.address}
                  onChange={(e) => setBookingData(prev => ({
                    ...prev,
                    contact: { ...prev.contact, address: e.target.value }
                  }))}
                />
              </div>
            </div>

            {/* Customer Notes */}
            <div className="mb-6">
              <Label htmlFor="customerNotes">Additional Notes (Optional)</Label>
              <Textarea
                id="customerNotes"
                value={bookingData.customerNotes}
                onChange={(e) => setBookingData(prev => ({
                  ...prev,
                  customerNotes: e.target.value
                }))}
                placeholder="Any special instructions or requirements for the installer..."
                className="mt-2"
                rows={3}
              />
            </div>

            {/* Booking Summary */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>TV Size:</span>
                    <span>{bookingData.tvSize}"</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span>{formatPrice(bookingData.basePrice)}</span>
                  </div>
                  {bookingData.addons.map(addon => (
                    <div key={addon.id} className="flex justify-between">
                      <span>{addon.name}:</span>
                      <span>{formatPrice(addon.price)}</span>
                    </div>
                  ))}
                  {bookingData.date && (
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{new Date(bookingData.date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span>{formatPrice(bookingData.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </BookingStep>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/')}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <div className="flex items-center justify-center min-h-screen py-8">
        <div className="max-w-2xl w-full mx-auto px-4">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
