import { Card, CardContent } from "@/components/ui/card";
import { Bolt } from "lucide-react";
import { BookingData } from "@/lib/booking-utils";
import { getAvailableServices } from "@/lib/pricing";

interface ServiceSelectorProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
}

export default function ServiceSelector({ bookingData, updateBookingData }: ServiceSelectorProps) {
  const availableServices = getAvailableServices(bookingData.tvSize);

  const handleServiceSelect = (serviceKey: string, price: number) => {
    updateBookingData({ 
      serviceType: serviceKey,
      basePrice: price
    });
  };

  return (
    <div className="text-center">
      <div className="step-indicator">
        <Bolt className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-foreground mb-4">Choose Your Service</h2>
      <p className="text-lg text-muted-foreground mb-8">
        Select the installation service that fits your needs
      </p>

      <div className="space-y-4">
        {availableServices.map((service) => (
          <Card
            key={service.key}
            className={`service-tile cursor-pointer ${
              bookingData.serviceType === service.key ? 'selected' : ''
            }`}
            onClick={() => handleServiceSelect(service.key, service.price)}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{service.name}</h3>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">€{service.price}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
