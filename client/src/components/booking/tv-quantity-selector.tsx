import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tv, Plus, Minus } from "lucide-react";
import { BookingData } from "@/lib/booking-utils";

interface TVQuantitySelectorProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  addTvInstallation: (tvData?: Partial<any>) => void;
  removeTvInstallation: (index: number) => void;
}

const QUANTITY_OPTIONS = [
  { value: 1, label: "1 TV", description: "Single TV installation" },
  { value: 2, label: "2 TVs", description: "Perfect for living room + bedroom" },
  { value: 3, label: "3 TVs", description: "Great for multiple rooms" },
  { value: 4, label: "4+ TVs", description: "Whole home setup" }
];

export default function TVQuantitySelector({ 
  bookingData, 
  updateBookingData, 
  addTvInstallation, 
  removeTvInstallation 
}: TVQuantitySelectorProps) {
  const [selectedQuantity, setSelectedQuantity] = useState(bookingData.tvQuantity || 1);

  const handleQuantitySelect = (quantity: number) => {
    setSelectedQuantity(quantity);
    
    // Initialize TV installations array based on quantity
    const currentLength = bookingData.tvInstallations.length;
    
    if (quantity > currentLength) {
      // Add new TV installations
      for (let i = currentLength; i < quantity; i++) {
        addTvInstallation({
          location: `TV ${i + 1}`,
          tvSize: "",
          serviceType: "",
          wallType: "",
          mountType: "",
          addons: []
        });
      }
    } else if (quantity < currentLength) {
      // Remove excess TV installations
      for (let i = currentLength - 1; i >= quantity; i--) {
        removeTvInstallation(i);
      }
    }
    
    updateBookingData({ 
      tvQuantity: quantity,
      currentTvIndex: 0
    });
  };

  return (
    <div className="text-center">
      <div className="step-indicator">
        <Tv className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-foreground mb-4">How Many TVs Need Installing?</h2>
      <p className="text-lg text-muted-foreground mb-8">
        Select the number of TVs you'd like to have professionally installed
      </p>

      {/* Quantity Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {QUANTITY_OPTIONS.map((option) => (
          <Card
            key={option.value}
            className={`service-tile cursor-pointer transition-all hover:shadow-lg ${
              selectedQuantity === option.value ? 'selected ring-2 ring-primary' : ''
            }`}
            onClick={() => handleQuantitySelect(option.value)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex">
                    {Array.from({ length: Math.min(option.value, 4) }).map((_, i) => (
                      <Tv key={i} className="w-6 h-6 text-primary" />
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="text-xl font-semibold text-foreground">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </div>
                </div>
                {selectedQuantity === option.value && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Quantity Selector for 4+ TVs */}
      {selectedQuantity >= 4 && (
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Specify Exact Number of TVs
            </h3>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantitySelect(Math.max(1, selectedQuantity - 1))}
                disabled={selectedQuantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              
              <div className="text-2xl font-bold text-foreground bg-white rounded-lg px-4 py-2 min-w-[80px]">
                {selectedQuantity}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantitySelect(selectedQuantity + 1)}
                disabled={selectedQuantity >= 10}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Maximum 10 TVs per booking. For larger projects, please contact us directly.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Multi-TV Benefits */}
      {selectedQuantity > 1 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              🎉 Multi-TV Installation Benefits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Volume discount pricing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Single appointment for all TVs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Consistent installation quality</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Professional cable management</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}