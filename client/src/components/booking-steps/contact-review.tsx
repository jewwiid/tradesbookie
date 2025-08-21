import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Phone, MapPin, ArrowLeft, Tag, CheckCircle, XCircle } from 'lucide-react';
import { useBooking } from '@/hooks/use-booking';
import { apiRequest } from '@/lib/queryClient';

interface ContactReviewProps {
  onNext: () => void;
  onBack: () => void;
}

export default function ContactReview({ onNext, onBack }: ContactReviewProps) {
  const { bookingData, updateBookingData, submitBooking, isSubmitting } = useBooking();
  const [formData, setFormData] = useState({
    customerName: bookingData.customerName || '',
    customerEmail: bookingData.customerEmail || '',
    customerPhone: bookingData.customerPhone || '',
    address: bookingData.address || '',
    streetAddress: bookingData.streetAddress || '',
    town: bookingData.town || '',
    county: bookingData.county || '',
    eircode: bookingData.eircode || '',
    customerNotes: bookingData.customerNotes || '',
    referralCode: bookingData.referralCode || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [referralValidation, setReferralValidation] = useState<{
    isValid: boolean | null;
    discount: number;
    message: string;
    isValidating: boolean;
  }>({ isValid: null, discount: 0, message: '', isValidating: false });

  useEffect(() => {
    updateBookingData(formData);
  }, [formData, updateBookingData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Name is required';
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    }

    if (!formData.streetAddress.trim()) {
      newErrors.streetAddress = 'Street address is required';
    }

    if (!formData.town.trim()) {
      newErrors.town = 'Town/City is required';
    }

    if (!formData.county.trim()) {
      newErrors.county = 'County is required';
    }

    if (!formData.eircode.trim()) {
      newErrors.eircode = 'Eircode is required';
    } else if (!/^[A-Z]\d{2}\s?[A-Z0-9]{4}$/i.test(formData.eircode)) {
      newErrors.eircode = 'Invalid Eircode format (e.g., D02 X285)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Handle referral code changes with debounced validation
    if (field === 'referralCode') {
      handleReferralCodeChange(value);
    }
  };

  const handleReferralCodeChange = (code: string) => {
    // Clear previous validation state
    setReferralValidation({ isValid: null, discount: 0, message: '', isValidating: false });
    
    if (code.trim() === '') {
      // Reset discount when referral code is cleared
      updateBookingData({ referralCode: '', referralDiscount: 0 });
      return;
    }

    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateReferralCode(code.trim().toUpperCase());
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const validateReferralCode = async (code: string) => {
    if (!code) return;
    
    setReferralValidation(prev => ({ ...prev, isValidating: true }));
    
    try {
      const response = await apiRequest('POST', '/api/referral/validate', { code });
      const validation = await response.json();
      
      if (validation.valid) {
        const discountAmount = (bookingData.total * validation.discountPercentage) / 100;
        setReferralValidation({
          isValid: true,
          discount: discountAmount,
          message: `${validation.discountPercentage}% discount applied!`,
          isValidating: false
        });
        // Update booking data with referral code and discount
        updateBookingData({ 
          referralCode: code, 
          referralDiscount: discountAmount 
        });
      } else {
        setReferralValidation({
          isValid: false,
          discount: 0,
          message: validation.message || 'Invalid referral code',
          isValidating: false
        });
        // Clear referral data if invalid
        updateBookingData({ referralCode: '', referralDiscount: 0 });
      }
    } catch (error) {
      console.error('Referral validation error:', error);
      setReferralValidation({
        isValid: false,
        discount: 0,
        message: 'Error validating referral code',
        isValidating: false
      });
      updateBookingData({ referralCode: '', referralDiscount: 0 });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Combine address components into single address string for storage
    const combinedAddress = `${formData.streetAddress}, ${formData.town}, ${formData.county}, ${formData.eircode}`;
    
    // Update the address in the form data before submitting
    const updatedFormData = {
      ...formData,
      address: combinedAddress
    };

    updateBookingData(updatedFormData);

    const result = await submitBooking();
    if (result.success) {
      // Redirect to payment or success page
      window.location.href = `/booking-success?booking=${result.booking?.id}`;
    } else {
      alert(result.error || 'Failed to submit booking');
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-8 lg:p-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Details</h2>
          <p className="text-lg text-gray-600">Almost done! Your request will be sent to local installers.</p>
        </div>

        {/* Booking Summary */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">TV Size:</span>
              <span className="font-medium">{bookingData.tvSize}"</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Wall Type:</span>
              <span className="font-medium capitalize">{bookingData.wallType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mount Type:</span>
              <span className="font-medium capitalize">{bookingData.mountType}</span>
            </div>
            {bookingData.selectedAddons.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Add-ons:</span>
                <span className="font-medium">{bookingData.selectedAddons.length} selected</span>
              </div>
            )}
            <div className="border-t pt-2 mt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>€{bookingData.total.toFixed(2)}</span>
              </div>
              {bookingData.referralDiscount && bookingData.referralDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Referral Discount:</span>
                  <span>-€{bookingData.referralDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span className="text-green-600">
                  €{((bookingData.total || 0) - (bookingData.referralDiscount || 0)).toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Pay installer directly • Cash • Card • Bank Transfer
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="space-y-6">
          <div>
            <Label htmlFor="customerName" className="text-base font-medium">
              <User className="w-4 h-4 inline mr-2" />
              Full Name
            </Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              placeholder="Enter your full name"
              className={`mt-2 ${errors.customerName ? 'border-red-500' : ''}`}
            />
            {errors.customerName && (
              <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="customerEmail" className="text-base font-medium">
              <Mail className="w-4 h-4 inline mr-2" />
              Email Address
            </Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => handleInputChange('customerEmail', e.target.value)}
              placeholder="Enter your email address"
              className={`mt-2 ${errors.customerEmail ? 'border-red-500' : ''}`}
            />
            {errors.customerEmail && (
              <p className="text-red-500 text-sm mt-1">{errors.customerEmail}</p>
            )}
          </div>

          <div>
            <Label htmlFor="customerPhone" className="text-base font-medium">
              <Phone className="w-4 h-4 inline mr-2" />
              Phone Number
            </Label>
            <Input
              id="customerPhone"
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              placeholder="Enter your phone number"
              className={`mt-2 ${errors.customerPhone ? 'border-red-500' : ''}`}
            />
            {errors.customerPhone && (
              <p className="text-red-500 text-sm mt-1">{errors.customerPhone}</p>
            )}
          </div>

          <div>
            <Label className="text-base font-medium">
              <MapPin className="w-4 h-4 inline mr-2" />
              Installation Address
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <Input
                  id="streetAddress"
                  value={formData.streetAddress}
                  onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                  placeholder="123 Main Street"
                  className={`${errors.streetAddress ? 'border-red-500' : ''}`}
                />
                {errors.streetAddress && (
                  <p className="text-red-500 text-sm mt-1">{errors.streetAddress}</p>
                )}
                <Label htmlFor="streetAddress" className="text-xs text-muted-foreground mt-1">
                  Street Address
                </Label>
              </div>
              <div>
                <Input
                  id="town"
                  value={formData.town}
                  onChange={(e) => handleInputChange('town', e.target.value)}
                  placeholder="Dublin"
                  className={`${errors.town ? 'border-red-500' : ''}`}
                />
                {errors.town && (
                  <p className="text-red-500 text-sm mt-1">{errors.town}</p>
                )}
                <Label htmlFor="town" className="text-xs text-muted-foreground mt-1">
                  Town/City
                </Label>
              </div>
              <div>
                <Input
                  id="county"
                  value={formData.county}
                  onChange={(e) => handleInputChange('county', e.target.value)}
                  placeholder="County Dublin"
                  className={`${errors.county ? 'border-red-500' : ''}`}
                />
                {errors.county && (
                  <p className="text-red-500 text-sm mt-1">{errors.county}</p>
                )}
                <Label htmlFor="county" className="text-xs text-muted-foreground mt-1">
                  County
                </Label>
              </div>
              <div>
                <Input
                  id="eircode"
                  value={formData.eircode}
                  onChange={(e) => handleInputChange('eircode', e.target.value.toUpperCase())}
                  placeholder="D02 X285"
                  pattern="[A-Z]\d{2}\s?[A-Z0-9]{4}"
                  title="Eircode format: 3-character Routing Key + 4-character Unique Identifier (e.g., D02 X285)"
                  className={`${errors.eircode ? 'border-red-500' : ''}`}
                />
                {errors.eircode && (
                  <p className="text-red-500 text-sm mt-1">{errors.eircode}</p>
                )}
                <Label htmlFor="eircode" className="text-xs text-muted-foreground mt-1">
                  Eircode (e.g., D02 X285)
                </Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="referralCode" className="text-base font-medium">
              <Tag className="w-4 h-4 inline mr-2" />
              Referral Code (Optional)
            </Label>
            <div className="relative mt-2">
              <Input
                id="referralCode"
                value={formData.referralCode}
                onChange={(e) => handleInputChange('referralCode', e.target.value.toUpperCase())}
                placeholder="Enter referral code for discount"
                className={`pr-10 ${
                  referralValidation.isValid === true 
                    ? 'border-green-500 focus:ring-green-500' 
                    : referralValidation.isValid === false 
                    ? 'border-red-500 focus:ring-red-500' 
                    : ''
                }`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {referralValidation.isValidating && (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                )}
                {referralValidation.isValid === true && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {referralValidation.isValid === false && (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            {referralValidation.message && (
              <p className={`text-sm mt-1 ${
                referralValidation.isValid === true ? 'text-green-600' : 'text-red-500'
              }`}>
                {referralValidation.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="customerNotes" className="text-base font-medium">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="customerNotes"
              value={formData.customerNotes}
              onChange={(e) => handleInputChange('customerNotes', e.target.value)}
              placeholder="Any additional information for the installer..."
              className="mt-2"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={onBack} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white px-8"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}