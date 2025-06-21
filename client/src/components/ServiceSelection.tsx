import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface ServiceSelectionProps {
  tvSize: string;
  selectedServiceId: number | null;
  onServiceSelect: (serviceId: number) => void;
}

export default function ServiceSelection({ tvSize, selectedServiceId, onServiceSelect }: ServiceSelectionProps) {
  // Fetch services filtered by TV size
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['/api/service-tiers', { tvSize }],
    queryFn: async () => {
      const url = tvSize ? `/api/service-tiers?tvSize=${tvSize}` : '/api/service-tiers';
      const response = await fetch(url);
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-full p-6 border rounded-lg animate-pulse">
            <div className="flex justify-between">
              <div>
                <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {services.map((service: any) => (
        <Button
          key={service.id}
          variant={selectedServiceId === service.id ? "default" : "outline"}
          className="w-full p-6 h-auto justify-between"
          onClick={() => onServiceSelect(service.id)}
        >
          <div className="text-left">
            <div className="text-lg font-semibold">{service.name}</div>
            <div className="text-sm text-gray-600">{service.description}</div>
          </div>
          <div className="text-2xl font-bold text-primary">
            {formatPrice(service.customerPrice)}
          </div>
        </Button>
      ))}
    </div>
  );
}