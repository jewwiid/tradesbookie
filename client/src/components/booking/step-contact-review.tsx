import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { User, Check, Tag, CheckCircle, XCircle } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import { SERVICE_TIERS, TIME_SLOTS } from '@/lib/constants';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface StepContactReviewProps {
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function StepContactReview({ onSubmit, onBack, isSubmitting = false }: StepContactReviewProps) {
  const { state, dispatch } = useBooking();
  const [contact, setContact] = useState(state.contact);
  const [notes, setNotes] = useState(state.customerNotes || '');
  const [referralCode, setReferralCode] = useState('');
  const [referralValidation, setReferralValidation] = useState<{ valid: boolean; discount: number; message: string } | null>(null);

  const validateReferralMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('/api/referral/validate', {
        method: 'POST',
        body: { code }
      });
      return response;
    },
    onSuccess: (data) => {
      if (data.valid) {
        setReferralValidation({
          valid: true,
          discount: data.discount,
          message: `Valid! You'll save ${data.discount}% on this booking.`
        });
        dispatch({ type: 'SET_REFERRAL', referralCode, discount: data.discount });
      } else {
        setReferralValidation({
          valid: false,
          discount: 0,
          message: 'Invalid referral code. Please check and try again.'
        });
      }
    },
    onError: () => {
      setReferralValidation({
        valid: false,
        discount: 0,
        message: 'Error validating referral code. Please try again.'
      });
    }
  });

  const handleContactChange = (field: string, value: string) => {
    const newContact = { ...contact, [field]: value };
    setContact(newContact);
    dispatch({ type: 'SET_CONTACT', contact: newContact });
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    dispatch({ type: 'SET_NOTES', customerNotes: value });
  };

  const handleReferralCodeChange = (value: string) => {
    setReferralCode(value.toUpperCase());
    setReferralValidation(null);
    if (value.length >= 6) {
      validateReferralMutation.mutate(value.toUpperCase());
    }
  };

  const isValid = contact.name && contact.email && contact.phone && contact.address;

  const getServiceName = () => {
    if (!state.serviceKey) return '';
    return SERVICE_TIERS[state.serviceKey as keyof typeof SERVICE_TIERS]?.name || '';
  };

  const getTimeSlotLabel = () => {
    if (!state.timeSlot) return '';
    return TIME_SLOTS.find(slot => slot.value === state.timeSlot)?.label || '';
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardContent className="p-8 lg:p-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Information</h2>
          <p className="text-lg text-gray-600">We need your details to confirm the booking</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={contact.name || ''}
              onChange={(e) => handleContactChange('name', e.target.value)}
              placeholder="John Smith"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={contact.email || ''}
              onChange={(e) => handleContactChange('email', e.target.value)}
              placeholder="john@example.com"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={contact.phone || ''}
              onChange={(e) => handleContactChange('phone', e.target.value)}
              placeholder="+353 1 234 5678"
            />
          </div>
          
          <div>
            <Label htmlFor="address">Installation Address *</Label>
            <Input
              id="address"
              value={contact.address || ''}
              onChange={(e) => handleContactChange('address', e.target.value)}
              placeholder="123 Main Street, Dublin"
            />
          </div>
        </div>

        <div className="mb-8">
          <Label htmlFor="referral">Referral Code (Optional)</Label>
          <div className="relative mt-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              id="referral"
              value={referralCode}
              onChange={(e) => handleReferralCodeChange(e.target.value)}
              placeholder="Enter referral code (e.g., TB1234ABCD)"
              className="pl-10"
              maxLength={12}
            />
            {referralValidation && (
              <div className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                referralValidation.valid ? 'text-green-500' : 'text-red-500'
              }`}>
                {referralValidation.valid ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
              </div>
            )}
          </div>
          {referralValidation && (
            <p className={`text-sm mt-1 ${
              referralValidation.valid ? 'text-green-600' : 'text-red-600'
            }`}>
              {referralValidation.message}
            </p>
          )}
        </div>

        <div className="mb-8">
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Any special instructions or requirements..."
            className="mt-2"
          />
        </div>

        {/* Booking Summary */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Service Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">TV Size:</span>
                  <span>{state.tvSize}"</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span>{getServiceName()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Wall Type:</span>
                  <span className="capitalize">{state.wallType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mount Type:</span>
                  <span className="capitalize">{state.mountType?.replace('-', ' ')}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Schedule & Pricing</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span>{state.scheduledDate ? new Date(state.scheduledDate).toLocaleDateString() : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span>{getTimeSlotLabel()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Service:</span>
                  <span>€{state.basePrice}</span>
                </div>
                {state.addons.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Add-ons:</span>
                    <span>€{state.addonTotal}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {state.addons.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Selected Add-ons:</h4>
              <div className="space-y-1 text-sm">
                {state.addons.map((addon) => (
                  <div key={addon.key} className="flex justify-between">
                    <span className="text-gray-600">{addon.name}</span>
                    <span>€{addon.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-4" />
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Price:</span>
            <span className="text-indigo-600">€{state.totalPrice}</span>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={!isValid || isSubmitting}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Complete Booking
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
