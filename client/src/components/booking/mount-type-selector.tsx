import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Square, ChevronDown, Move, Check, X } from "lucide-react";
import { BookingData } from "@/lib/booking-utils";
import { useQuery } from '@tanstack/react-query';

interface MountTypeSelectorProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
}

// Interface for wall mount pricing from database
interface WallMountPricing {
  id: number;
  key: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date | null;
  updatedAt: Date | null;
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
  const [needsWallMount, setNeedsWallMount] = useState<boolean | undefined>(bookingData.needsWallMount);
  const [selectedWallMount, setSelectedWallMount] = useState<string>(bookingData.wallMountOption || '');

  // Fetch wall mount pricing from database
  const { data: wallMountPricing, isLoading: isLoadingPricing } = useQuery<WallMountPricing[]>({
    queryKey: ['/api/wall-mount-pricing'],
    enabled: needsWallMount === true, // Only fetch when user wants wall mount
  });

  const handleMountTypeSelect = (mountType: string) => {
    updateBookingData({ mountType });
    // Reset wall mount selection when mount type changes
    setSelectedWallMount('');
    updateBookingData({ wallMountOption: undefined, needsWallMount: undefined });
  };

  const handleWallMountSelect = (needs: boolean) => {
    setNeedsWallMount(needs);
    updateBookingData({ needsWallMount: needs });
    if (!needs) {
      setSelectedWallMount('');
      updateBookingData({ wallMountOption: undefined });
    }
  };

  const handleWallMountOptionSelect = (wallMountKey: string) => {
    setSelectedWallMount(wallMountKey);
    updateBookingData({ wallMountOption: wallMountKey });
  };

  const getAvailableWallMounts = () => {
    if (!wallMountPricing) return [];
    
    // Return all active wall mount options from database
    // The database handles the filtering by active status
    return wallMountPricing;
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

      {/* Mount Type Selection */}
      <div className="space-y-4 mb-8">
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

      {/* Wall Mount Question - appears after mount type is selected */}
      {bookingData.mountType && (
        <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Do you need a wall mount?</h3>
          <p className="text-gray-600 mb-6">
            Let us know if you need us to supply a wall mount bracket for your TV installation.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleWallMountSelect(true)}
              className={`p-4 border-2 rounded-xl transition-all duration-300 ${
                needsWallMount === true
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
              }`}
            >
              <div className="flex items-center justify-center">
                <Check className="w-6 h-6 mr-2" />
                <span className="font-medium">Yes, provide wall mount</span>
              </div>
            </button>
            
            <button
              onClick={() => handleWallMountSelect(false)}
              className={`p-4 border-2 rounded-xl transition-all duration-300 ${
                needsWallMount === false
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-red-400 hover:bg-red-50'
              }`}
            >
              <div className="flex items-center justify-center">
                <X className="w-6 h-6 mr-2" />
                <span className="font-medium">No, I have one</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Wall Mount Options Selection */}
      {needsWallMount === true && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Wall Mount</h3>
          <p className="text-gray-600 mb-6">Select the wall mount that best fits your TV and viewing needs</p>
          
          {isLoadingPricing ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading wall mount options...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {getAvailableWallMounts().map((mount) => (
                <button
                  key={mount.key}
                  onClick={() => handleWallMountOptionSelect(mount.key)}
                  className={`p-4 border-2 rounded-xl transition-all duration-300 text-left ${
                    selectedWallMount === mount.key
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{mount.name}</h4>
                      {mount.description && (
                        <p className="text-sm text-gray-600 mb-2">{mount.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        €{Number(mount.price).toFixed(0)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}


    </div>
  );
}
