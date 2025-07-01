import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Square, ChevronDown, Move, Check, X, ArrowLeft } from 'lucide-react';
import { useBooking } from '@/hooks/use-booking';
import { useQuery } from '@tanstack/react-query';

const MOUNT_TYPES = [
  {
    key: "fixed",
    name: "Fixed Mount",
    description: "TV sits flat against the wall (most secure)",
    icon: "square"
  },
  {
    key: "tilting",
    name: "Tilting Mount",
    description: "TV can tilt up and down for better viewing angles",
    icon: "angle-down"
  },
  {
    key: "full-motion",
    name: "Full Motion Mount",
    description: "TV can swivel, tilt, and extend from wall",
    icon: "arrows-alt"
  }
];

// Interface for wall mount pricing from database
interface WallMountPricing {
  id: number;
  key: string;
  name: string;
  description: string | null;
  price: string;
  mountType: string;
  maxTvSize: number | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface MountTypeSelectionProps {
  onNext?: () => void;
  onBack?: () => void;
}

export default function MountTypeSelectionNew({ onNext, onBack }: MountTypeSelectionProps) {
  console.log("🚀 NEW MountTypeSelection component is rendering");
  
  const { bookingData, updateBookingData } = useBooking();
  const [selectedMountType, setSelectedMountType] = useState(bookingData.mountType || '');
  const [needsWallMount, setNeedsWallMount] = useState<boolean>(bookingData.needsWallMount ?? false);

  // Fetch wall mount pricing from database
  const { data: wallMountPricing = [], isLoading: isLoadingPricing, error: pricingError } = useQuery<WallMountPricing[]>({
    queryKey: ['/api/wall-mount-pricing'],
    enabled: needsWallMount,
  });

  console.log("🔧 Wall mount pricing data:", wallMountPricing);
  console.log("🔧 Is loading pricing:", isLoadingPricing);
  console.log("🔧 Pricing error:", pricingError);

  const handleMountTypeSelect = (mountType: string) => {
    console.log("🔧 Mount type selected:", mountType);
    setSelectedMountType(mountType);
    updateBookingData({ mountType });
  };

  const handleWallMountNeeded = (needed: boolean) => {
    console.log("🔧 Wall mount needed changed:", needed);
    setNeedsWallMount(needed);
    updateBookingData({ needsWallMount: needed });
    
    if (!needed) {
      // Clear wall mount selection if not needed
      updateBookingData({ wallMountOption: undefined });
    }
  };

  const handleWallMountSelect = (option: string) => {
    console.log("🔧 Wall mount option selected:", option);
    updateBookingData({ wallMountOption: option });
  };

  const handleContinue = () => {
    if (!selectedMountType) {
      alert('Please select a mount type');
      return;
    }
    
    if (needsWallMount && !bookingData.wallMountOption) {
      alert('Please select a wall mount option');
      return;
    }
    
    onNext?.();
  };

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case 'square': return <Square className="w-6 h-6" />;
      case 'angle-down': return <ChevronDown className="w-6 h-6" />;
      case 'arrows-alt': return <Move className="w-6 h-6" />;
      default: return <Settings className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      
      {/* 🔴 CRITICAL TEST BANNER */}
      <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-4 text-center font-bold z-50">
        🔴 NEW COMPONENT LOADED - CACHE BYPASS SUCCESSFUL 🔴
      </div>

      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden" style={{ marginTop: '80px' }}>
        <div className="p-8 md:p-12">
          
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Mount Type</h2>
          <p className="text-lg text-gray-600">Select how you want your TV to be positioned</p>
        </div>

        {/* Mount Type Selection */}
        <div className="space-y-4 mb-8">
          {MOUNT_TYPES.map((type) => (
            <Card 
              key={type.key}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedMountType === type.key 
                  ? 'ring-2 ring-indigo-500 bg-indigo-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleMountTypeSelect(type.key)}
            >
              <CardContent className="flex items-center p-6">
                <div className="mr-4">
                  {renderIcon(type.icon)}
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                  <p className="text-gray-600">{type.description}</p>
                </div>
                <div className="ml-4">
                  {selectedMountType === type.key ? (
                    <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Wall Mount Question */}
        <div className="mb-8 p-6 bg-blue-50 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Do you need a wall mount bracket?</h3>
          <p className="text-gray-600 mb-4">If you don't already have a compatible wall mount, we can provide one for an additional cost.</p>
          
          <div className="flex gap-4">
            <Button
              variant={needsWallMount ? "default" : "outline"}
              onClick={() => handleWallMountNeeded(true)}
              className="flex-1"
            >
              Yes, I need a wall mount
            </Button>
            <Button
              variant={!needsWallMount ? "default" : "outline"}
              onClick={() => handleWallMountNeeded(false)}
              className="flex-1"
            >
              No, I have one already
            </Button>
          </div>
        </div>

        {/* Wall Mount Pricing Options */}
        {needsWallMount && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Select Wall Mount Type</h3>
            
            {isLoadingPricing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading wall mount options...</p>
              </div>
            ) : pricingError ? (
              <div className="text-center py-8 text-red-600">
                <X className="w-12 h-12 mx-auto mb-4" />
                <p>Error loading wall mount options. Please try again.</p>
                <p className="text-sm mt-2">Error: {pricingError.message}</p>
              </div>
            ) : wallMountPricing.length === 0 ? (
              <div className="text-center py-8 text-yellow-600">
                <p>No wall mount options currently available. Please contact support.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {wallMountPricing
                  .filter(mount => mount.isActive)
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((mount) => (
                    <Card 
                      key={mount.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        bookingData.wallMountOption === mount.key
                          ? 'ring-2 ring-indigo-500 bg-indigo-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleWallMountSelect(mount.key)}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{mount.name}</h4>
                          <span className="text-lg font-bold text-indigo-600">€{mount.price}</span>
                        </div>
                        {mount.description && (
                          <p className="text-gray-600 text-sm mb-3">{mount.description}</p>
                        )}
                        {mount.maxTvSize && (
                          <p className="text-xs text-gray-500">Suitable for TVs up to {mount.maxTvSize}"</p>
                        )}
                        <div className="mt-4 flex justify-end">
                          {bookingData.wallMountOption === mount.key ? (
                            <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <Button 
            onClick={handleContinue}
            disabled={!selectedMountType || (needsWallMount && !bookingData.wallMountOption)}
            className="px-8"
          >
            Continue
          </Button>
        </div>

        </div>
      </div>
    </div>
  );
}