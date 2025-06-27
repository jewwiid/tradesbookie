import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, MapPin, Phone, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HarveyNormanBookingProps {
  recommendation: any;
  preferences: any;
  onClose: () => void;
}

export default function HarveyNormanBooking({ recommendation, preferences, onClose }: HarveyNormanBookingProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    preferredDate: '',
    preferredTime: '',
    specialRequests: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingData.customerName || !bookingData.customerEmail || !bookingData.preferredDate || !bookingData.preferredTime) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/consultation-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingData,
          tvRecommendation: recommendation,
          customerPreferences: preferences
        })
      });

      if (!response.ok) throw new Error('Failed to book consultation');

      toast({
        title: "Consultation Booked!",
        description: "We'll contact you within 24 hours to confirm your appointment.",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "Failed to book consultation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Book Your Harvey Norman Consultation</h1>
          <p className="text-gray-600">Meet with a TV expert in-store to discuss your recommendation</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Store Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Harvey Norman Carrickmines
              </CardTitle>
              <CardDescription>
                Premium TV showroom with expert consultation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-sm text-gray-600">The Park, Carrickmines, Dublin 18, D18 R9P0</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-sm text-gray-600">01 294 7000</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Opening Hours</p>
                  <p className="text-sm text-gray-600">
                    Mon-Sat: 9:00 AM - 9:00 PM<br />
                    Sun: 11:00 AM - 6:00 PM
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">What to Expect:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    View your recommended TV in person
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Expert installation consultation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Competitive pricing and financing options
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Professional installation booking
                  </li>
                </ul>
              </div>

              {/* Google Maps Embed */}
              <div className="mt-4">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2385.5647788697997!2d-6.2067843!3d53.2866577!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48670867df6784f3%3A0xcbe652f4b5921d22!2sHarvey%20Norman%20Carrickmines!5e0!3m2!1sen!2sie!4v1635000000000!5m2!1sen!2sie"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-green-600" />
                Book Your Consultation
              </CardTitle>
              <CardDescription>
                Schedule a meeting with our TV installation expert
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      value={bookingData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email Address *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={bookingData.customerEmail}
                      onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="customerPhone">Phone Number</Label>
                  <Input
                    id="customerPhone"
                    value={bookingData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    placeholder="+353 XX XXX XXXX"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredDate">Preferred Date *</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      value={bookingData.preferredDate}
                      onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                      min={minDate}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="preferredTime">Preferred Time *</Label>
                    <Select value={bookingData.preferredTime} onValueChange={(value) => handleInputChange('preferredTime', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (9:00 AM - 12:00 PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12:00 PM - 5:00 PM)</SelectItem>
                        <SelectItem value="evening">Evening (5:00 PM - 8:00 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialRequests">Special Requests</Label>
                  <Textarea
                    id="specialRequests"
                    value={bookingData.specialRequests}
                    onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    rows={4}
                    placeholder="Any specific questions or requirements for your consultation..."
                  />
                </div>

                {/* Recommendation Summary */}
                {recommendation && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Your TV Recommendation:</h4>
                    <p className="text-sm text-gray-600">
                      {recommendation.type} - {recommendation.model}
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                    className="flex-1"
                  >
                    Back to Recommendation
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? "Booking..." : "Book Consultation"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}