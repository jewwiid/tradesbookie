import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tv, MapPin, Settings, Euro, Edit2 } from "lucide-react";
import { useBookingData } from "@/hooks/use-booking-data";
import { SERVICE_PRICING } from "@/lib/pricing";

interface MultiTvSummaryProps {
  onEditTv: (index: number) => void;
  onNext: () => void;
}

export default function MultiTvSummary({ onEditTv, onNext }: MultiTvSummaryProps) {
  const { bookingData, calculateTotalPrice } = useBookingData();
  const tvInstallations = bookingData.tvInstallations || [];
  const totalPrice = calculateTotalPrice();

  // Calculate price for individual TV
  const calculateTvPrice = (tv: any) => {
    const basePrice = tv.basePrice || SERVICE_PRICING[tv.serviceType]?.customerPrice || 0;
    const addonsPrice = tv.addons?.reduce((sum: number, addon: any) => sum + addon.price, 0) || 0;
    return basePrice + addonsPrice;
  };

  return (
    <div className="text-center">
      <div className="step-indicator">
        <Tv className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-foreground mb-4">
        Review Your TV Installations
      </h2>
      <p className="text-lg text-muted-foreground mb-8">
        Confirm the details for each TV installation
      </p>

      <div className="space-y-4 mb-8">
        {tvInstallations.map((tv, index) => (
          <Card key={index} className="p-6 border-l-4 border-l-primary">
            <div className="flex items-center justify-between">
              <div className="text-left flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-lg">{tv.location || `TV ${index + 1}`}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">TV Size:</span>
                    <div className="font-medium">{tv.tvSize}"</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Service:</span>
                    <div className="font-medium">{tv.serviceType}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mount:</span>
                    <div className="font-medium">{tv.mountType}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Wall Type:</span>
                    <div className="font-medium">{tv.wallType}</div>
                  </div>
                </div>
                
                {tv.addons && tv.addons.length > 0 && (
                  <div className="mt-3">
                    <span className="text-muted-foreground text-sm">Add-ons:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tv.addons.map((addon, addonIndex) => (
                        <Badge key={addonIndex} variant="secondary" className="text-xs">
                          {addon.name} (+€{addon.price})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-3 text-right">
                  <div className="text-2xl font-bold text-primary">
                    €{calculateTvPrice(tv).toFixed(2)}
                  </div>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditTv(index)}
                className="ml-4"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Total Summary */}
      <Card className="p-6 bg-primary/5 border-primary/20 mb-8">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h3 className="text-lg font-semibold text-foreground">
              Total for {tvInstallations.length} TV{tvInstallations.length > 1 ? 's' : ''}
            </h3>
            <p className="text-muted-foreground">
              Installation service and add-ons
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              €{totalPrice.toFixed(2)}
            </div>
          </div>
        </div>
      </Card>

      <Button 
        onClick={onNext}
        className="w-full max-w-xs mx-auto text-lg py-6"
        size="lg"
      >
        Continue to Schedule
      </Button>
    </div>
  );
}