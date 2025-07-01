import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Wrench, Tv, Medal, Award, Crown } from 'lucide-react';
import { useBookingStore } from '@/lib/booking-store';
import { useQuery } from '@tanstack/react-query';
import { formatPrice } from '@/lib/constants';
import { getServiceTiers, getServiceTiersForTvSize, ServiceTier } from '@/lib/pricingService';

interface ServiceSelectionProps {
  onNext: () => void;
  onBack: () => void;
}

export default function ServiceSelection({ onNext, onBack }: ServiceSelectionProps) {
  const { data, updateData } = useBookingStore();
  const [availableServices, setAvailableServices] = useState<ServiceTier[]>([]);

  const { data: serviceTiers, isLoading } = useQuery({
    queryKey: ['/api/service-tiers', data.tvSize],
    queryFn: () => getServiceTiers(data.tvSize),
  });

  useEffect(() => {
    if (serviceTiers && data.tvSize) {
      const filtered = getServiceTiersForTvSize(data.tvSize, serviceTiers);
      setAvailableServices(filtered);
    }
  }, [serviceTiers, data.tvSize]);

  const handleServiceSelect = (service: ServiceTier) => {
    updateData({ 
      serviceTierId: service.id,
      serviceType: service.key,
      basePrice: service.customerPrice 
    });
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'desktop':
        return <Tv className="h-8 w-8 text-blue-600" />;
      case 'medal':
        return <Medal className="h-8 w-8 text-amber-600" />;
      case 'award':
        return <Award className="h-8 w-8 text-gray-600" />;
      case 'crown':
        return <Crown className="h-8 w-8 text-yellow-600" />;
      default:
        return <Wrench className="h-8 w-8 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="typeform-card">
        <CardContent className="text-center">
          <div className="animate-pulse">Loading services...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="typeform-card">
      <CardContent>
        <div className="text-center mb-8">
          <div className="w-20 h-20 typeform-gradient rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Service</h2>
          <p className="text-lg text-gray-600">Select the installation service that fits your needs</p>
        </div>

        <div className="space-y-4 mb-8">
          {availableServices.map((service) => (
            <button
              key={service.key}
              onClick={() => handleServiceSelect(service)}
              className={`w-full p-6 border-2 rounded-2xl transition-all duration-300 text-left ${
                data.serviceTierId === service.id
                  ? 'border-primary bg-gradient-to-br from-blue-50 to-indigo-50'
                  : 'border-gray-200 hover:border-primary hover:bg-blue-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                    {getIcon(service.icon || 'wrench')}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
                    <p className="text-sm text-gray-600">{service.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{formatPrice(service.customerPrice)}</div>
                  <div className="text-xs text-gray-500">Estimated cost</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={onBack} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!data.serviceTierId}
            className="btn-primary"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
