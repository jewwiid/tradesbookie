import { Card, CardContent } from "@/components/ui/card";
import { Home } from "lucide-react";
import { BookingData } from "@/lib/booking-utils";

interface WallTypeSelectorProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
}

const WALL_TYPES = [
  {
    type: "drywall",
    name: "Drywall",
    description: "Most common interior wall type",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
  },
  {
    type: "concrete",
    name: "Concrete",
    description: "Solid masonry wall",
    image: "https://images.unsplash.com/photo-1486172278538-a683b1c9b34c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
  },
  {
    type: "brick",
    name: "Brick",
    description: "Traditional brick construction",
    image: "https://images.unsplash.com/photo-1507701943804-5b7c8e8d0ffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
  },
  {
    type: "other",
    name: "Other",
    description: "We'll assess on-site",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
  }
];

export default function WallTypeSelector({ bookingData, updateBookingData }: WallTypeSelectorProps) {
  const handleWallTypeSelect = (wallType: string) => {
    updateBookingData({ wallType });
  };

  return (
    <div className="text-center">
      <div className="step-indicator">
        <Home className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-foreground mb-4">What's Your Wall Type?</h2>
      <p className="text-lg text-muted-foreground mb-8">
        This helps us prepare the right tools and mounting hardware
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {WALL_TYPES.map((wall) => (
          <Card
            key={wall.type}
            className={`service-tile cursor-pointer ${
              bookingData.wallType === wall.type ? 'selected' : ''
            }`}
            onClick={() => handleWallTypeSelect(wall.type)}
          >
            <CardContent className="p-6 text-left">
              <img 
                src={wall.image} 
                alt={`${wall.name} surface`} 
                className="w-full h-32 object-cover rounded-lg mb-4"
              />
              <h3 className="text-lg font-semibold text-foreground mb-2">{wall.name}</h3>
              <p className="text-sm text-muted-foreground">{wall.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
