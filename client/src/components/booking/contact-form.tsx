import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, CheckCircle, CreditCard } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BookingData, calculateTotalPrice } from "@/lib/booking-utils";

interface ContactFormProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  onComplete: () => void;
}

export default function ContactForm({ bookingData, updateBookingData, onComplete }: ContactFormProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      // First create or get user
      const userResponse = await apiRequest('POST', '/api/users', {
        name: data.contact.name,
        email: data.contact.email,
        phone: data.contact.phone
      });
      const user = await userResponse.json();

      // Then create booking
      const bookingResponse = await apiRequest('POST', '/api/bookings', {
        userId: user.id,
        installerId: 1, // Default installer for demo
        tvSize: data.tvSize,
        serviceType: data.serviceType,
        wallType: data.wallType,
        mountType: data.mountType,
        addons: data.addons || [],
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        address: data.contact.address,
        roomPhotoUrl: data.roomPhotoBase64 ? `data:image/jpeg;base64,${data.roomPhotoBase64}` : null,
        aiPreviewUrl: data.aiPreviewUrl,
        customerNotes: data.customerNotes
      });
      
      return bookingResponse.json();
    },
    onSuccess: (booking) => {
      toast({
        title: "Booking Created!",
        description: "Redirecting to secure payment..."
      });
      // Redirect to checkout page with booking ID
      setLocation(`/checkout?bookingId=${booking.id}`);
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
        ...bookingData.contact,
        [field]: value
      }
    });
  };

  const handleComplete = () => {
    if (!bookingData.contact?.name || !bookingData.contact?.email || 
        !bookingData.contact?.phone || !bookingData.contact?.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    createBookingMutation.mutate(bookingData);
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
      <p className="text-lg text-muted-foreground mb-8">
        We need your details to confirm the booking
      </p>

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
        <div>
          <Label htmlFor="address" className="block text-sm font-medium text-foreground mb-2">
            Address *
          </Label>
          <Input
            id="address"
            type="text"
            value={bookingData.contact?.address || ''}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="123 Main Street, Dublin"
            required
          />
        </div>
      </div>

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
            <CreditCard className="w-5 h-5 mr-2" />
            Proceed to Payment - €{totalPrice}
          </>
        )}
      </Button>
    </div>
  );
}
