import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { BookingData } from "@/lib/booking-utils";

interface AddonSelectorProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
}

const ADDONS = [
  {
    key: "cable-concealment",
    name: "Cable Concealment",
    description: "Hide cables inside the wall for a clean look",
    price: 49
  },
  {
    key: "soundbar-install",
    name: "Soundbar Installation",
    description: "Mount your soundbar below the TV",
    price: 39
  },
  {
    key: "calibration",
    name: "TV Calibration",
    description: "Professional picture and sound optimization",
    price: 29
  }
];

export default function AddonSelector({ bookingData, updateBookingData }: AddonSelectorProps) {
  const handleAddonToggle = (addonKey: string, checked: boolean) => {
    const currentAddons = bookingData.addons || [];
    
    if (checked) {
      const addon = ADDONS.find(a => a.key === addonKey);
      if (addon) {
        const newAddons = [...currentAddons, {
          key: addon.key,
          name: addon.name,
          price: addon.price
        }];
        updateBookingData({ addons: newAddons });
      }
    } else {
      const newAddons = currentAddons.filter(addon => addon.key !== addonKey);
      updateBookingData({ addons: newAddons });
    }
  };

  const isAddonSelected = (addonKey: string) => {
    return bookingData.addons?.some(addon => addon.key === addonKey) || false;
  };

  return (
    <div className="text-center">
      <div className="step-indicator">
        <Plus className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-foreground mb-4">Add-on Services</h2>
      <p className="text-lg text-muted-foreground mb-8">
        Enhance your installation with these optional services
      </p>

      <div className="space-y-4">
        {ADDONS.map((addon) => (
          <Card
            key={addon.key}
            className={`service-tile cursor-pointer ${
              isAddonSelected(addon.key) ? 'selected' : ''
            }`}
            onClick={() => handleAddonToggle(addon.key, !isAddonSelected(addon.key))}
          >
            <CardContent className="p-4">
              <div className="flex items-center">
                <Checkbox
                  checked={isAddonSelected(addon.key)}
                  onChange={() => {}} // Handled by card click
                  className="mr-4"
                />
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-semibold text-foreground">{addon.name}</h3>
                  <p className="text-sm text-muted-foreground">{addon.description}</p>
                </div>
                <div className="text-lg font-semibold text-foreground">+€{addon.price}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
