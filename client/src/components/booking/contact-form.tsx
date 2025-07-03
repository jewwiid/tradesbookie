import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, CheckCircle, Sparkles, Loader2, Tag } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BookingData, calculateTotalPrice } from "@/lib/booking-utils";
import { useAuth } from "@/hooks/useAuth";
import SimplifiedAuthDialog from "@/components/SimplifiedAuthDialog";

interface ContactFormProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  onComplete: () => void;
}

export default function ContactForm({ bookingData, updateBookingData, onComplete }: ContactFormProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAfterPreview, setShowAfterPreview] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState('');
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [referralMessage, setReferralMessage] = useState('');
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Harvey Norman referral validation mutation
  const validateReferralMutation = useMutation({
    mutationFn: async (code: string) => {
      const totalPrice = calculateTotalPrice(bookingData);
      const response = await apiRequest('POST', '/api/harvey-norman/validate', {
        referralCode: code,
        bookingAmount: totalPrice
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setReferralDiscount(data.discountAmount);
        setReferralMessage(`✓ ${data.discountPercentage}% discount applied! Save €${data.discountAmount.toFixed(2)} from ${data.salesStaffName} at Harvey Norman ${data.salesStaffStore}`);
        updateBookingData({ 
          referralCode: referralCode,
          referralDiscount: data.discountAmount,
          referralCodeId: data.referralCodeId
        });
      } else {
        setReferralDiscount(0);
        setReferralMessage(data.message || 'Invalid referral code');
        updateBookingData({ 
          referralCode: '',
          referralDiscount: 0,
          referralCodeId: undefined
        });
      }
    },
    onError: (error) => {
      setReferralDiscount(0);
      setReferralMessage('Error validating referral code');
      updateBookingData({ 
        referralCode: '',
        referralDiscount: 0,
        referralCodeId: undefined
      });
    }
  });

  // AI Preview generation mutation for final step
  const aiPreviewMutation = useMutation({
    mutationFn: async () => {
      if (!bookingData.roomPhotoBase64) {
        throw new Error('No room photo available');
      }
      
      const response = await apiRequest('POST', '/api/generate-ai-preview', {
        imageBase64: bookingData.roomPhotoBase64,
        tvSize: bookingData.tvSize,
        mountType: bookingData.mountType,
        wallType: bookingData.wallType,
        selectedAddons: bookingData.addons || []
      });
      return response.json();
    },
    onSuccess: (data) => {
      updateBookingData({ aiPreviewUrl: data.imageUrl });
      toast({
        title: "AI Preview Generated!",
        description: "See how your TV will look installed."
      });
    },
    onError: (error) => {
      console.error('AI preview generation failed:', error);
      // Continue without AI preview - not blocking
    }
  });

  // Generate AI preview when component mounts (final step)
  useEffect(() => {
    if (bookingData.roomPhotoBase64 && !bookingData.aiPreviewUrl && !aiPreviewMutation.isPending) {
      aiPreviewMutation.mutate();
    }
  }, [bookingData.roomPhotoBase64, bookingData.aiPreviewUrl]);

  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      // First create or get user
      const userResponse = await apiRequest('POST', '/api/users', {
        name: data.contact.name,
        email: data.contact.email,
        phone: data.contact.phone
      });
      const user = await userResponse.json();

      // Then create booking with proper schema mapping
      const bookingResponse = await apiRequest('POST', '/api/bookings', {
        userId: user.id.toString(),
        contactName: data.contact.name,
        contactPhone: data.contact.phone,
        contactEmail: data.contact.email,
        tvSize: data.tvSize.toString(),
        serviceType: data.serviceType || 'bronze',
        wallType: data.wallType,
        mountType: data.mountType,
        needsWallMount: data.needsWallMount || false,
        wallMountOption: data.wallMountOption || null,
        addons: data.addons || [],
        preferredDate: data.preferredDate || null,
        preferredTime: data.preferredTime || null,
        address: data.contact.address,
        roomPhotoUrl: data.roomPhotoBase64 ? `data:image/jpeg;base64,${data.roomPhotoBase64}` : null,
        aiPreviewUrl: data.aiPreviewUrl || null,
        roomAnalysis: data.roomAnalysis || null,
        photoStorageConsent: data.photoStorageConsent || false,
        estimatedPrice: data.totalPrice ? data.totalPrice.toFixed(2) : "0.00",
        estimatedAddonsPrice: data.addonTotal ? data.addonTotal.toFixed(2) : "0.00",
        estimatedTotal: data.totalPrice ? data.totalPrice.toFixed(2) : "0.00",
        customerNotes: data.customerNotes || null,
        referralCode: data.referralCode || null,
        referralDiscount: data.referralDiscount || 0
      });
      
      return bookingResponse.json();
    },
    onSuccess: (response) => {
      const booking = response.booking || response;
      toast({
        title: "Booking Created!",
        description: "Your request has been submitted. We'll find an installer for you."
      });
      // Redirect to booking confirmation page instead of payment
      setLocation(`/booking-confirmation?bookingId=${booking.id}`);
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: string, value: string) => {
    updateBookingData({
      contact: {
        name: bookingData.contact?.name || '',
        email: bookingData.contact?.email || '',
        phone: bookingData.contact?.phone || '',
        address: bookingData.contact?.address || '',
        streetAddress: bookingData.contact?.streetAddress || '',
        town: bookingData.contact?.town || '',
        county: bookingData.contact?.county || '',
        eircode: bookingData.contact?.eircode || '',
        [field]: value
      }
    });
  };

  const handleComplete = () => {
    if (!bookingData.contact?.name || !bookingData.contact?.email || 
        !bookingData.contact?.phone || !bookingData.contact?.streetAddress ||
        !bookingData.contact?.town || !bookingData.contact?.county || 
        !bookingData.contact?.eircode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Ensure all required contact fields are defined
    const contact = bookingData.contact;
    if (!contact.name || !contact.email || !contact.phone || 
        !contact.streetAddress || !contact.town || !contact.county || !contact.eircode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Combine address components before creating booking
    const combinedAddress = `${contact.streetAddress}, ${contact.town}, ${contact.county}, ${contact.eircode}`;
    const bookingDataWithAddress = {
      ...bookingData,
      contact: {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        address: combinedAddress,
        streetAddress: contact.streetAddress,
        town: contact.town,
        county: contact.county,
        eircode: contact.eircode
      }
    };

    createBookingMutation.mutate(bookingDataWithAddress);
  };

  const totalPrice = calculateTotalPrice(bookingData);

  if (showSuccess) {
    return (
      <div className="text-center">
        <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">Booking Confirmed!</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Your TV installation has been scheduled. We'll send you a confirmation email with all the details.
        </p>
        <div className="animate-pulse text-muted-foreground">
          Redirecting to your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="step-indicator">
        <User className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-foreground mb-4">Contact Information</h2>
      <p className="text-lg text-muted-foreground mb-4">
        Please provide your current contact details for installer communication
      </p>
      
      {user?.registrationMethod === 'invoice' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Harvey Norman Customer Verified</p>
              <p className="text-sm text-blue-700 mt-1">
                Welcome back! Please confirm your contact details below so installers can reach you after accepting your request.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <Label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
            Full Name *
          </Label>
          <Input
            id="name"
            type="text"
            value={bookingData.contact?.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="John Smith"
            required
          />
        </div>
        <div>
          <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            value={bookingData.contact?.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="john@example.com"
            required
          />
        </div>
        <div>
          <Label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
            Phone Number *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={bookingData.contact?.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+353 1 234 5678"
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label className="block text-sm font-medium text-foreground mb-4">
            Installation Address *
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="streetAddress" className="block text-sm text-muted-foreground mb-1">
                Street Address
              </Label>
              <Input
                id="streetAddress"
                type="text"
                value={bookingData.contact?.streetAddress || ''}
                onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                placeholder="123 Main Street"
                required
              />
            </div>
            <div>
              <Label htmlFor="town" className="block text-sm text-muted-foreground mb-1">
                Town/City
              </Label>
              <Input
                id="town"
                type="text"
                value={bookingData.contact?.town || ''}
                onChange={(e) => handleInputChange('town', e.target.value)}
                placeholder="Dublin"
                required
              />
            </div>
            <div>
              <Label htmlFor="county" className="block text-sm text-muted-foreground mb-1">
                County
              </Label>
              <Input
                id="county"
                type="text"
                value={bookingData.contact?.county || ''}
                onChange={(e) => handleInputChange('county', e.target.value)}
                placeholder="County Dublin"
                required
              />
            </div>
            <div>
              <Label htmlFor="eircode" className="block text-sm text-muted-foreground mb-1">
                Eircode
              </Label>
              <Input
                id="eircode"
                type="text"
                value={bookingData.contact?.eircode || ''}
                onChange={(e) => handleInputChange('eircode', e.target.value.toUpperCase())}
                placeholder="D02 X285"
                pattern="[A-Z]\d{2}\s?[A-Z0-9]{4}"
                title="Eircode format: 3-character Routing Key + 4-character Unique Identifier (e.g., D02 X285)"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: D02 X285 or D02X285
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Harvey Norman Referral Code Section */}
      <Card className="mb-8 border-2 border-dashed border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
              <Tag className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Harvey Norman Referral Code</h3>
              <p className="text-sm text-muted-foreground">Got a code from Harvey Norman sales staff? Save 10%!</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter referral code (e.g., HNCKMDOUG)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
            <Button
              onClick={() => {
                if (referralCode.trim()) {
                  validateReferralMutation.mutate(referralCode.trim());
                }
              }}
              disabled={!referralCode.trim() || validateReferralMutation.isPending}
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              {validateReferralMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Apply'
              )}
            </Button>
          </div>
          
          {referralMessage && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${
              referralDiscount > 0 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {referralMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Preview Section - Only shows at final step */}
      {bookingData.roomPhotoBase64 && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center mr-3">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">AI Preview</h3>
              </div>
              {bookingData.aiPreviewUrl && (
                <div className="flex bg-white rounded-lg p-1 border">
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
              {aiPreviewMutation.isPending ? (
                <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Generating AI preview...</p>
                  </div>
                </div>
              ) : bookingData.aiPreviewUrl && showAfterPreview ? (
                <div className="relative">
                  <img
                    src={bookingData.aiPreviewUrl}
                    alt="Room with mounted TV preview"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <div className="absolute top-4 right-4 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>AI Generated</span>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={`data:image/jpeg;base64,${bookingData.roomPhotoBase64}`}
                    alt="Your room"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  {!bookingData.aiPreviewUrl && !aiPreviewMutation.isPending && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-black/70 rounded-lg p-3 text-white text-center">
                        <p className="text-sm">AI preview generation in progress...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Summary */}
      <Card className="bg-muted/50 mb-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Booking Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">TV Size:</span>
              <span className="font-medium">{bookingData.tvSize}"</span>
            </div>
            {bookingData.serviceType && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-medium">€{bookingData.basePrice}</span>
              </div>
            )}
            {bookingData.addons?.map((addon) => (
              <div key={addon.key} className="flex justify-between">
                <span className="text-muted-foreground">{addon.name}:</span>
                <span className="font-medium">€{addon.price}</span>
              </div>
            ))}
            {bookingData.referralDiscount && bookingData.referralDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="text-muted-foreground">Harvey Norman Discount (10%):</span>
                <span className="font-medium">-€{bookingData.referralDiscount.toFixed(2)}</span>
              </div>
            )}
            {bookingData.preferredDate && bookingData.preferredTime && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{new Date(bookingData.preferredDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium">
                    {bookingData.preferredTime === "09:00" && "9:00 AM - 11:00 AM"}
                    {bookingData.preferredTime === "11:00" && "11:00 AM - 1:00 PM"}
                    {bookingData.preferredTime === "13:00" && "1:00 PM - 3:00 PM"}
                    {bookingData.preferredTime === "15:00" && "3:00 PM - 5:00 PM"}
                    {bookingData.preferredTime === "17:00" && "5:00 PM - 7:00 PM"}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="border-t border-border mt-4 pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total</span>
              <span className="text-primary">€{totalPrice}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleComplete}
        disabled={createBookingMutation.isPending}
        className="gradient-bg w-full text-lg px-8 py-4 h-auto"
      >
        {createBookingMutation.isPending ? (
          <>Creating Booking...</>
        ) : (
          <>
            <CheckCircle className="w-5 h-5 mr-2" />
            Submit Installation Request
          </>
        )}
      </Button>
    </div>
  );
}
