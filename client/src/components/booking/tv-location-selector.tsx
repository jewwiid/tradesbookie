import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Home, Bed, ChefHat, Sofa, Baby, Plus } from "lucide-react";
import { useBookingData } from "@/hooks/use-booking-data";

interface TvLocationSelectorProps {
  onNext: () => void;
}

const COMMON_LOCATIONS = [
  { id: "living-room", name: "Living Room", icon: Sofa },
  { id: "bedroom", name: "Bedroom", icon: Bed },
  { id: "kitchen", name: "Kitchen", icon: ChefHat },
  { id: "dining-room", name: "Dining Room", icon: Home },
  { id: "nursery", name: "Nursery", icon: Baby },
  { id: "custom", name: "Other", icon: Plus },
];

export default function TvLocationSelector({ onNext }: TvLocationSelectorProps) {
  const { bookingData, updateTvInstallation, getCurrentTv } = useBookingData();
  const currentTv = getCurrentTv();
  const currentIndex = bookingData.currentTvIndex || 0;
  
  const [selectedLocation, setSelectedLocation] = useState(currentTv?.location || "");
  const [customLocation, setCustomLocation] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleLocationSelect = (locationId: string, locationName: string) => {
    if (locationId === "custom") {
      setShowCustomInput(true);
      setSelectedLocation("");
    } else {
      setSelectedLocation(locationName);
      setShowCustomInput(false);
      setCustomLocation("");
    }
  };

  const handleNext = () => {
    const finalLocation = showCustomInput ? customLocation : selectedLocation;
    if (!finalLocation.trim()) return;
    
    updateTvInstallation(currentIndex, { location: finalLocation });
    onNext();
  };

  const canProceed = selectedLocation || (showCustomInput && customLocation.trim());

  return (
    <div className="text-center">
      <div className="step-indicator">
        <MapPin className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-foreground mb-4">
        Where is TV {currentIndex + 1} Located?
      </h2>
      <p className="text-lg text-muted-foreground mb-8">
        Tell us the room location for better service coordination
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {COMMON_LOCATIONS.map((location) => {
          const Icon = location.icon;
          const isSelected = location.id === "custom" ? showCustomInput : selectedLocation === location.name;
          
          return (
            <Card
              key={location.id}
              className={`location-card cursor-pointer transition-all duration-200 ${
                isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
              }`}
              onClick={() => handleLocationSelect(location.id, location.name)}
            >
              <div className="p-6 text-center">
                <Icon className={`w-8 h-8 mx-auto mb-3 ${
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <h3 className={`font-semibold ${
                  isSelected ? 'text-primary' : 'text-foreground'
                }`}>
                  {location.name}
                </h3>
              </div>
            </Card>
          );
        })}
      </div>

      {showCustomInput && (
        <div className="max-w-md mx-auto mb-8">
          <Input
            placeholder="Enter custom location (e.g., Home Office, Basement)"
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            className="h-12 text-center"
            autoFocus
          />
        </div>
      )}

      {/* Progress indicator for multi-TV */}
      {bookingData.tvQuantity && bookingData.tvQuantity > 1 && (
        <div className="mb-8">
          <div className="flex justify-center space-x-2">
            {Array.from({ length: bookingData.tvQuantity }, (_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index === currentIndex
                    ? 'bg-primary'
                    : index < currentIndex
                    ? 'bg-primary/50'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            TV {currentIndex + 1} of {bookingData.tvQuantity}
          </p>
        </div>
      )}

      <Button 
        onClick={handleNext}
        disabled={!canProceed}
        className="w-full max-w-xs mx-auto text-lg py-6"
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}