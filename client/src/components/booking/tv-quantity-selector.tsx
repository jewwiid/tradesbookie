import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tv, Plus, Minus, MapPin } from "lucide-react";
import { BookingData, TVInstallation } from "@/lib/booking-utils";

interface TvQuantitySelectorProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  addTvInstallation: (tvData?: Partial<TVInstallation>) => void;
  removeTvInstallation: (index: number) => void;
}

export default function TvQuantitySelector({ bookingData, updateBookingData, addTvInstallation, removeTvInstallation }: TvQuantitySelectorProps) {
  const [selectedQuantity, setSelectedQuantity] = useState(bookingData.tvQuantity || 1);
  
  // Update room name for a specific TV installation
  const updateTvLocation = (index: number, location: string) => {
    if (!bookingData.tvInstallations) return;
    
    const updatedInstallations = [...bookingData.tvInstallations];
    updatedInstallations[index] = {
      ...updatedInstallations[index],
      location
    };
    updateBookingData({ tvInstallations: updatedInstallations });
  };

  const handleQuantityChange = (quantity: number) => {
    if (quantity < 1 || quantity > 5) return; // Limit to reasonable range
    setSelectedQuantity(quantity);
  };

  // Update booking data when quantity changes
  const handleQuantityUpdate = () => {
    if (selectedQuantity === 1) {
      // Single TV booking - use legacy flow
      updateBookingData({ 
        tvQuantity: 1,
        tvInstallations: [],
        currentTvIndex: 0
      });
    } else {
      // Multi-TV booking - initialize TV installations array
      const currentInstallations = bookingData.tvInstallations || [];
      
      // Add missing TV installations
      for (let i = currentInstallations.length; i < selectedQuantity; i++) {
        addTvInstallation();
      }
      
      // Remove excess TV installations  
      for (let i = currentInstallations.length; i > selectedQuantity; i--) {
        removeTvInstallation(i - 1);
      }
      
      updateBookingData({ 
        tvQuantity: selectedQuantity,
        currentTvIndex: 0
      });
    }
  };

  // Update when selectedQuantity changes
  useEffect(() => {
    if (bookingData.tvQuantity !== selectedQuantity) {
      handleQuantityUpdate();
    }
  }, [selectedQuantity]);

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

      {/* Room Names Section - Only show for multi-TV bookings */}
      {selectedQuantity > 1 && bookingData.tvInstallations && (
        <div className="max-w-md mx-auto mb-8">
          <Card className="p-6">
            <div className="text-center mb-4">
              <MapPin className="w-6 h-6 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-foreground">Name Your Rooms</h3>
              <p className="text-sm text-muted-foreground">
                Help us identify where each TV will be installed
              </p>
            </div>
            
            <div className="space-y-4">
              {bookingData.tvInstallations.map((installation, index) => (
                <div key={index}>
                  <Label htmlFor={`room-${index}`} className="text-sm font-medium">
                    TV {index + 1} Location
                  </Label>
                  <Input
                    id={`room-${index}`}
                    placeholder="e.g., Living Room, Bedroom, Kitchen"
                    value={installation.location || ''}
                    onChange={(e) => updateTvLocation(index, e.target.value)}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Tip:</strong> Room names help your installer prepare better and make it easier to track each installation's progress.
              </p>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}