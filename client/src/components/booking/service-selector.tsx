import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { getServicesForTVSize, formatPrice } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';

interface ServiceSelectorProps {
  tvSize: number;
  selectedService: string;
  onServiceSelect: (serviceKey: string, price: number) => void;
}

export default function ServiceSelector({ tvSize, selectedService, onServiceSelect }: ServiceSelectorProps) {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['/api/services'],
    queryFn: () => api.getServices(),
  });

  if (isLoading) {
    return <div className="text-center">Loading services...</div>;
  }

  const availableServiceKeys = getServicesForTVSize(tvSize);
  const availableServices = services.filter(service => 
    availableServiceKeys.includes(service.key)
  );

  const getServiceGradient = (key: string) => {
    if (key.includes('table-top')) return 'pricing-gradient-blue';
    if (key.includes('bronze')) return 'pricing-gradient-amber';
    if (key.includes('silver')) return 'pricing-gradient-gray';
    if (key.includes('gold')) return 'pricing-gradient-yellow';
    return 'bg-white';
  };

  const isPopular = (key: string) => key.includes('silver') && !key.includes('large');

  return (
    <div className="space-y-4">
      {availableServices.map((service) => (
        <Card 
          key={service.key} 
          className={`${getServiceGradient(service.key)} border-2 transition-all duration-300 cursor-pointer relative ${
            selectedService === service.key 
              ? 'border-primary bg-blue-50' 
              : 'border-gray-200 hover:border-primary hover:bg-blue-50'
          }`}
          onClick={() => onServiceSelect(service.key, parseFloat(service.basePrice))}
        >
          {isPopular(service.key) && (
            <Badge className="absolute top-4 right-4 bg-primary">
              Popular
            </Badge>
          )}
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {service.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {service.description || 'Professional installation service'}
                </p>
                {service.sizeRange && (
                  <p className="text-xs text-gray-500 mt-1">
                    Size range: {service.sizeRange}
                  </p>
                )}
              </div>
              <div className="text-right ml-4">
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(service.basePrice)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
