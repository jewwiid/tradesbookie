import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Monitor, Award, Crown, Star } from "lucide-react";

interface ServiceTierCardProps {
  tier: {
    id: number;
    name: string;
    description: string;
    basePrice: string;
    features: string[];
  };
  isPopular?: boolean;
  className?: string;
}

export default function ServiceTierCard({ tier, isPopular, className }: ServiceTierCardProps) {
  const getIcon = (name: string) => {
    if (name.includes('Table Top')) return <Monitor className="h-6 w-6" />;
    if (name.includes('Bronze')) return <Award className="h-6 w-6 text-amber-600" />;
    if (name.includes('Silver')) return <Star className="h-6 w-6 text-gray-600" />;
    if (name.includes('Gold')) return <Crown className="h-6 w-6 text-yellow-600" />;
    return <Monitor className="h-6 w-6" />;
  };

  const getGradient = (name: string) => {
    if (name.includes('Table Top')) return 'from-blue-50 to-indigo-50 border-blue-100';
    if (name.includes('Bronze')) return 'from-amber-50 to-orange-50 border-amber-100';
    if (name.includes('Silver')) return 'from-gray-50 to-slate-50 border-gray-200';
    if (name.includes('Gold')) return 'from-yellow-50 to-amber-50 border-yellow-200';
    return 'from-blue-50 to-indigo-50 border-blue-100';
  };

  return (
    <Card className={`relative hover:shadow-lg transition-all duration-300 ${className}`}>
      {isPopular && (
        <Badge className="absolute -top-3 right-4 bg-primary text-white">
          Popular
        </Badge>
      )}
      <CardContent className={`p-6 bg-gradient-to-br ${getGradient(tier.name)} rounded-lg border`}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/50">
            {getIcon(tier.name)}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{tier.name}</h3>
          <p className="text-gray-600 mb-4">{tier.description}</p>
          
          <div className="text-2xl font-bold text-primary mb-4">
            {formatPrice(tier.basePrice)}
          </div>

          {tier.features && tier.features.length > 0 && (
            <div className="space-y-1">
              {tier.features.map((feature, index) => (
                <div key={index} className="text-sm text-gray-600">
                  • {feature}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
