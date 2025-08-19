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
        <Badge className="absolute -top-2 right-3 bg-primary text-white text-xs px-2 py-1">
          Popular
        </Badge>
      )}
      <CardContent className={`p-4 bg-gradient-to-r ${displayGradient} ${displayBorder} rounded-lg border`}>
        <div className="flex items-start gap-4">
          {/* Icon and Title Section */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/60 shadow-sm">
              {displayIcon}
            </div>
          </div>
          
          {/* Content Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
                <p className="text-sm text-gray-600 mb-2 leading-relaxed">{description}</p>
                
                {/* Pricing - Compact Display */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {pricing.slice(0, 2).map((tier, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs bg-white/70 px-2 py-1 rounded-full">
                      <span className="text-gray-600">{tier.label}:</span>
                      <span className="font-semibold text-primary">{formatPrice(tier.price)}</span>
                    </div>
                  ))}
                  {pricing.length > 2 && (
                    <span className="text-xs text-gray-500 px-2 py-1">+{pricing.length - 2} more</span>
                  )}
                </div>
                
                {/* Detailed Description Toggle */}
                {detailedDescription && (
                  <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs text-primary hover:text-primary/80 hover:bg-white/20"
                      >
                        {isExpanded ? (
                          <>
                            Less <ChevronUp className="ml-1 h-3 w-3" />
                          </>
                        ) : (
                          <>
                            Details <ChevronDown className="ml-1 h-3 w-3" />
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="p-3 bg-white/80 rounded-lg">
                        <div className="text-xs text-gray-700 leading-relaxed">
                          {detailedDescription.split('\n').map((line, index) => {
                            if (line.trim().startsWith('•')) {
                              return (
                                <span key={index} className="inline-block mr-3 mb-1">
                                  {line.trim()}
                                </span>
                              );
                            }
                            return line.trim() ? (
                              <span key={index} className="inline-block mr-3 mb-1">
                                {line.trim()}
                              </span>
                            ) : null;
                          })}
                        </div>
                        
                        {/* Full Pricing List in Details */}
                        {pricing.length > 2 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs font-medium text-gray-700 mb-2">All Pricing:</div>
                            <div className="space-y-1">
                              {pricing.map((tier, index) => (
                                <div key={index} className="flex justify-between items-center text-xs">
                                  <span className="text-gray-600">{tier.label}</span>
                                  <span className="font-semibold text-primary">{formatPrice(tier.price)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
