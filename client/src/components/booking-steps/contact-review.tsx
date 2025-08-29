import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Phone, MapPin, ArrowLeft } from 'lucide-react';
import { useBooking } from '@/hooks/use-booking';

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
    streetAddress: (bookingData as any).streetAddress || '',
    town: (bookingData as any).town || '',
    county: (bookingData as any).county || '',
    eircode: (bookingData as any).eircode || '',
    customerNotes: bookingData.customerNotes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
              <div className="flex justify-between font-semibold">
                <span>Estimated Total:</span>
                <span className="text-green-600">€{bookingData.total.toFixed(2)}</span>
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