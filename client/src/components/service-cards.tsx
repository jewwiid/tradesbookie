import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tv, Award, Medal, Crown } from "lucide-react";
import type { ServiceTierOption } from "@/lib/types";

interface ServiceCardsProps {
  serviceTiers: ServiceTierOption[];
  tvSize: number;
  selectedService?: number;
  onSelectService: (serviceId: number, price: number) => void;
}

export default function ServiceCards({
  serviceTiers,
  tvSize,
  selectedService,
  onSelectService,
}: ServiceCardsProps) {
  // Filter services based on TV size
  const availableServices = serviceTiers.filter(service => {
    if (!service.tvSizeMin && !service.tvSizeMax) return true;
    if (service.tvSizeMin && tvSize < service.tvSizeMin) return false;
    if (service.tvSizeMax && tvSize > service.tvSizeMax) return false;
    return true;
  });

  const getServiceIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "table-top":
        return <Tv className="w-6 h-6" />;
      case "bronze":
        return <Medal className="w-6 h-6 text-amber-600" />;
      case "silver":
        return <Award className="w-6 h-6 text-gray-600" />;
      case "gold":
        return <Crown className="w-6 h-6 text-yellow-600" />;
      default:
        return <Tv className="w-6 h-6" />;
    }
  };

  const getServiceGradient = (category: string) => {
    switch (category.toLowerCase()) {
      case "table-top":
        return "from-blue-50 to-indigo-50 border-blue-100";
      case "bronze":
        return "from-amber-50 to-orange-50 border-amber-100";
      case "silver":
        return "from-gray-50 to-slate-50 border-gray-200";
      case "gold":
        return "from-yellow-50 to-amber-50 border-yellow-200";
      default:
        return "from-gray-50 to-gray-100 border-gray-200";
    }
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {availableServices.map((service) => (
        <Card
          key={service.id}
          className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
            selectedService === service.id
              ? "border-primary shadow-lg ring-2 ring-primary/20"
              : `bg-gradient-to-br ${getServiceGradient(service.category)} hover:border-primary`
          }`}
          onClick={() => onSelectService(service.id, service.basePrice)}
        >
          <CardContent className="p-6">
            <div className="text-center">
              <div className={`w-16 h-16 ${getServiceGradient(service.category).includes('blue') ? 'bg-blue-100' : 
                getServiceGradient(service.category).includes('amber') ? 'bg-amber-100' :
                getServiceGradient(service.category).includes('gray') ? 'bg-gray-200' :
                'bg-yellow-100'
              } rounded-full flex items-center justify-center mx-auto mb-4`}>
                {getServiceIcon(service.category)}
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {service.name}
              </h3>
              
              {service.description && (
                <p className="text-gray-600 mb-4 text-sm">
                  {service.description}
                </p>
              )}

              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  €{service.basePrice}
                </div>
                
                {service.category === "silver" && (
                  <Badge variant="secondary" className="bg-primary text-white">
                    Popular
                  </Badge>
                )}
              </div>

              {service.tvSizeMin && service.tvSizeMax && (
                <div className="mt-4 text-sm text-gray-500">
                  For {service.tvSizeMin}" - {service.tvSizeMax}" TVs
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
