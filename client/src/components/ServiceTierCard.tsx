import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Monitor, Award, Crown, Star } from "lucide-react";

interface ServiceTierCardProps {
  key?: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  gradient?: string;
  border?: string;
  popular?: boolean;
  pricing: Array<{
    label: string;
    price: number;
  }>;
  className?: string;
}

export default function ServiceTierCard({ name, description, icon, gradient, border, popular, pricing, className }: ServiceTierCardProps) {
  const getDefaultIcon = (tierName: string) => {
    if (tierName.includes('Table Top')) return <Monitor className="h-6 w-6" />;
    if (tierName.includes('Bronze')) return <Award className="h-6 w-6 text-amber-600" />;
    if (tierName.includes('Silver')) return <Star className="h-6 w-6 text-gray-600" />;
    if (tierName.includes('Gold')) return <Crown className="h-6 w-6 text-yellow-600" />;
    return <Monitor className="h-6 w-6" />;
  };

  const getDefaultGradient = (tierName: string) => {
    if (tierName.includes('Table Top')) return 'from-blue-50 to-indigo-50 border-blue-100';
    if (tierName.includes('Bronze')) return 'from-amber-50 to-orange-50 border-amber-100';
    if (tierName.includes('Silver')) return 'from-gray-50 to-slate-50 border-gray-200';
    if (tierName.includes('Gold')) return 'from-yellow-50 to-amber-50 border-yellow-200';
    return 'from-blue-50 to-indigo-50 border-blue-100';
  };

  const displayIcon = icon || getDefaultIcon(name);
  const displayGradient = gradient || getDefaultGradient(name);
  const displayBorder = border || '';

  return (
    <Card className={`relative hover:shadow-lg transition-all duration-300 ${className || ''}`}>
      {popular && (
        <Badge className="absolute -top-3 right-4 bg-primary text-white">
          Popular
        </Badge>
      )}
      <CardContent className={`p-6 bg-gradient-to-br ${displayGradient} ${displayBorder} rounded-lg border`}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/50">
            {displayIcon}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{name}</h3>
          <p className="text-gray-600 mb-4">{description}</p>
          
          <div className="space-y-2 mb-4">
            {pricing.map((tier, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{tier.label}</span>
                <span className="font-semibold text-primary">{formatPrice(tier.price)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
