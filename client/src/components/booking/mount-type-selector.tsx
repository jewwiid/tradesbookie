import { Card, CardContent } from "@/components/ui/card";
import { Settings, Square, ChevronDown, Move } from "lucide-react";
import { BookingData } from "@/lib/booking-utils";

interface MountTypeSelectorProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
}

const MOUNT_TYPES = [
  {
    type: "fixed",
    name: "Fixed Mount",
    description: "TV sits flat against the wall (most secure)",
    icon: <Square className="w-8 h-8" />
  },
  {
    type: "tilting",
    name: "Tilting Mount",
    description: "TV can tilt up and down for better viewing angles",
    icon: <ChevronDown className="w-8 h-8" />
  },
  {
    type: "full-motion",
    name: "Full Motion Mount",
    description: "TV can swivel, tilt, and extend from wall",
    icon: <Move className="w-8 h-8" />
  }
];

export default function MountTypeSelector({ bookingData, updateBookingData }: MountTypeSelectorProps) {
  const handleMountTypeSelect = (mountType: string) => {
    updateBookingData({ mountType });
  };

  return (
    <div className="text-center">
      <div className="step-indicator">
        <Settings className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-foreground mb-4">Choose Mount Type</h2>
      <p className="text-lg text-muted-foreground mb-8">
        Select how you want your TV to be positioned
      </p>

      <div className="space-y-4">
        {MOUNT_TYPES.map((mount) => (
          <Card
            key={mount.type}
            className={`service-tile cursor-pointer ${
              bookingData.mountType === mount.type ? 'selected' : ''
            }`}
            onClick={() => handleMountTypeSelect(mount.type)}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mr-4">
                  <div className="text-muted-foreground">{mount.icon}</div>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-foreground mb-1">{mount.name}</h3>
                  <p className="text-sm text-muted-foreground">{mount.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
