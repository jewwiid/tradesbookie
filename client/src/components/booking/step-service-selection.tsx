import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ServiceCard } from '@/components/ui/service-card';
import { Wrench } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import { SERVICE_TIERS } from '@/lib/constants.tsx';

interface StepServiceSelectionProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepServiceSelection({ onNext, onBack }: StepServiceSelectionProps) {
  const { state, dispatch } = useBooking();
  const [selectedService, setSelectedService] = useState<string | undefined>(state.serviceKey);

  const getAvailableServices = () => {
    const tvSize = state.tvSize || 0;
    const services = [];

    if (tvSize <= 43) {
      services.push('table-top-small', 'table-top-large', 'bronze', 'silver');
    } else if (tvSize <= 85) {
      services.push('table-top-large', 'silver', 'gold');
    } else {
      services.push('silver-large', 'gold-large');
    }

    return services;
  };

  const handleServiceSelect = (serviceKey: string) => {
    const service = SERVICE_TIERS[serviceKey as keyof typeof SERVICE_TIERS];
    setSelectedService(serviceKey);
    dispatch({ 
      type: 'SET_SERVICE', 
      serviceKey, 
      basePrice: service.price 
    });
  };

  const availableServices = getAvailableServices();

  return (
    <Card className="max-w-3xl mx-auto">
      <CardContent className="p-8 lg:p-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Service</h2>
          <p className="text-lg text-gray-600">
            Select the installation service that fits your {state.tvSize}" TV
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {availableServices.map((serviceKey) => {
            const service = SERVICE_TIERS[serviceKey as keyof typeof SERVICE_TIERS];
            return (
              <ServiceCard
                key={serviceKey}
                title={service.name}
                description={service.description}
                price={service.price}
                icon={service.icon}
                popular={serviceKey === 'silver'}
                selected={selectedService === serviceKey}
                onClick={() => handleServiceSelect(serviceKey)}
              />
            );
          })}
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!selectedService}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
