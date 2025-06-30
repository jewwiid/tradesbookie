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
    description: "Most common interior wall type"
  },
  {
    type: "concrete",
    name: "Concrete",
    description: "Solid masonry wall"
  },
  {
    type: "brick",
    name: "Brick",
    description: "Traditional brick construction"
  },
  {
    type: "other",
    name: "Other",
    description: "We'll assess on-site"
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
              <h3 className="text-lg font-semibold text-foreground mb-2">{wall.name}</h3>
              <p className="text-sm text-muted-foreground">{wall.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
