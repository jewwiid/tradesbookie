import { Card, CardContent } from "@/components/ui/card";
import { Bolt } from "lucide-react";
import { BookingData } from "@/lib/booking-utils";
import { getAvailableServices } from "@/lib/pricing";

interface ServiceSelectorProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  updateTvInstallation?: (index: number, tvData: Partial<any>) => void;
}

export default function ServiceSelector({ bookingData, updateBookingData, updateTvInstallation }: ServiceSelectorProps) {
  const isMultiTV = bookingData.tvQuantity > 1;
  const currentTv = isMultiTV ? bookingData.tvInstallations[bookingData.currentTvIndex] : null;
  const tvSize = isMultiTV ? (currentTv?.tvSize || "") : bookingData.tvSize;
  
  const availableServices = getAvailableServices(tvSize);

  const handleServiceSelect = (serviceKey: string, customerPrice: number) => {
    if (isMultiTV && updateTvInstallation) {
      updateTvInstallation(bookingData.currentTvIndex, { 
        serviceType: serviceKey,
        basePrice: customerPrice
      });
    } else {
      updateBookingData({ 
        serviceType: serviceKey,
        basePrice: customerPrice
      });
    }
  };

  return (
    <div className="text-center">
      <div className="step-indicator">
        <Bolt className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-foreground mb-4">
        {isMultiTV ? `Choose Service for ${currentTv?.location || `TV ${bookingData.currentTvIndex + 1}`}` : "Choose Your Service"}
      </h2>
      <p className="text-lg text-muted-foreground mb-8">
        {isMultiTV ? `Select the installation service for ${currentTv?.location || `TV ${bookingData.currentTvIndex + 1}`}` : "Select the installation service that fits your needs"}
      </p>

      <div className="space-y-4">
        {availableServices.map((service) => (
          <Card
            key={service.key}
            className={`service-tile cursor-pointer ${
              (isMultiTV ? currentTv?.serviceType === service.key : bookingData.serviceType === service.key) ? 'selected' : ''
            }`}
            onClick={() => handleServiceSelect(service.key, service.customerPrice)}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{service.name}</h3>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">€{service.customerPrice}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
