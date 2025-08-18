import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { BookingData } from "@/lib/booking-utils";

interface AddonSelectorProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  updateTvInstallation?: (index: number, tvData: Partial<any>) => void;
  updateCurrentTvInstallation?: (tvData: Partial<any>) => void;
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
    key: "tv-disassembly",
    name: "TV Disassembly from Wall",
    description: "Remove existing TV from current wall mount",
    price: 35
  },
  {
    key: "calibration",
    name: "TV Calibration",
    description: "Professional picture and sound optimization",
    price: 29
  }
];

export default function AddonSelector({ bookingData, updateBookingData, updateTvInstallation, updateCurrentTvInstallation }: AddonSelectorProps) {
  const isMultiTV = bookingData.tvQuantity > 1;
  const currentTv = isMultiTV ? bookingData.tvInstallations[bookingData.currentTvIndex] : null;
  
  const handleAddonToggle = (addonKey: string, checked: boolean) => {
    const currentAddons = isMultiTV ? (currentTv?.addons || []) : (bookingData.addons || []);
    
    if (checked) {
      const addon = ADDONS.find(a => a.key === addonKey);
      if (addon) {
        const newAddons = [...currentAddons, {
          key: addon.key,
          name: addon.name,
          price: addon.price
        }];
        
        if (isMultiTV && updateCurrentTvInstallation) {
          updateCurrentTvInstallation({ addons: newAddons });
        } else {
          updateBookingData({ addons: newAddons });
        }
      }
    } else {
      const newAddons = currentAddons.filter(addon => addon.key !== addonKey);
      
      if (isMultiTV && updateCurrentTvInstallation) {
        updateCurrentTvInstallation({ addons: newAddons });
      } else {
        updateBookingData({ addons: newAddons });
      }
    }
  };

  const isAddonSelected = (addonKey: string) => {
    const currentAddons = isMultiTV ? (currentTv?.addons || []) : (bookingData.addons || []);
    return currentAddons.some(addon => addon.key === addonKey) || false;
  };

  return (
    <div className="text-center">
      <div className="step-indicator">
        <Plus className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-foreground mb-4">
        {isMultiTV ? `Add-on Services for ${currentTv?.location || `TV ${bookingData.currentTvIndex + 1}`}` : "Add-on Services"}
      </h2>
      <p className="text-lg text-muted-foreground mb-8">
        {isMultiTV ? `Enhance the installation for ${currentTv?.location || `TV ${bookingData.currentTvIndex + 1}`}` : "Enhance your installation with these optional services"}
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
