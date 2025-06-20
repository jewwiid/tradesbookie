import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatPrice } from "@/lib/utils";
import { Monitor, Award, Crown, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ServiceTierCardProps {
  key?: string;
  name: string;
  description: string;
  detailedDescription?: string;
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

export default function ServiceTierCard({ name, description, detailedDescription, icon, gradient, border, popular, pricing, className }: ServiceTierCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
          
          {detailedDescription && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mb-4 text-primary hover:text-primary/80"
                >
                  {isExpanded ? (
                    <>
                      Less Details <ChevronUp className="ml-1 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      More Details <ChevronDown className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2">
                <div className="p-3 bg-white/80 rounded-lg mb-4">
                  <p className="text-sm text-gray-700 text-left leading-relaxed">
                    {detailedDescription}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
          
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
