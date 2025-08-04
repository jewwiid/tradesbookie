import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tv, Plus, Minus } from "lucide-react";
import { useBookingData } from "@/hooks/use-booking-data";

interface TvQuantitySelectorProps {
  onNext: () => void;
}

export default function TvQuantitySelector({ onNext }: TvQuantitySelectorProps) {
  const { bookingData, updateBookingData, initializeMultiTvBooking } = useBookingData();
  const [selectedQuantity, setSelectedQuantity] = useState(bookingData.tvQuantity || 1);

  const handleQuantityChange = (quantity: number) => {
    if (quantity < 1 || quantity > 5) return; // Limit to reasonable range
    setSelectedQuantity(quantity);
  };

  const handleNext = () => {
    if (selectedQuantity === 1) {
      // Single TV booking - use legacy flow
      updateBookingData({ tvQuantity: 1 });
    } else {
      // Multi-TV booking - initialize TV installations array
      initializeMultiTvBooking(selectedQuantity);
    }
    onNext();
  };

  return (
    <div className="text-center">
      <div className="step-indicator">
        <Tv className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-foreground mb-4">
        How Many TVs Need Installation?
      </h2>
      <p className="text-lg text-muted-foreground mb-8">
        Select the number of TVs you'd like us to install
      </p>

      <div className="max-w-md mx-auto mb-8">
        <Card className="p-6 border-2 border-primary/20">
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="icon" 
              onClick={() => handleQuantityChange(selectedQuantity - 1)}
              disabled={selectedQuantity <= 1}
              className="h-12 w-12"
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {selectedQuantity}
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedQuantity === 1 ? 'TV' : 'TVs'}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(selectedQuantity + 1)}
              disabled={selectedQuantity >= 5}
              className="h-12 w-12"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {selectedQuantity > 1 && (
              <p>You'll configure each TV individually in the next steps</p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Selection Buttons */}
      <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto mb-8">
        {[1, 2, 3, 4, 5].map((quantity) => (
          <Button
            key={quantity}
            variant={selectedQuantity === quantity ? "default" : "outline"}
            onClick={() => setSelectedQuantity(quantity)}
            className="h-12"
          >
            {quantity}
          </Button>
        ))}
      </div>

      <Button 
        onClick={handleNext}
        className="w-full max-w-xs mx-auto text-lg py-6"
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}