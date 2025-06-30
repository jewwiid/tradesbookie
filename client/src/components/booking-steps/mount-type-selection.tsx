import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Square, ChevronDown, Move, Check, X } from 'lucide-react';
import { useBooking } from '@/hooks/use-booking';

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

const WALL_MOUNT_OPTIONS = [
  {
    key: "basic-fixed",
    name: "Basic Fixed Mount",
    description: "Simple, sturdy fixed mounting bracket",
    type: "Fixed",
    price: 2500, // €25.00 in cents
    maxSize: 65
  },
  {
    key: "premium-fixed",
    name: "Premium Fixed Mount",
    description: "Heavy-duty fixed mount for larger TVs",
    type: "Fixed", 
    price: 4000, // €40.00 in cents
    maxSize: null
  },
  {
    key: "basic-tilting",
    name: "Basic Tilting Mount",
    description: "Allows up/down tilt adjustment",
    type: "Tilting",
    price: 3500, // €35.00 in cents
    maxSize: 65
  },
  {
    key: "premium-tilting",
    name: "Premium Tilting Mount", 
    description: "Heavy-duty tilting mount for larger TVs",
    type: "Tilting",
    price: 5000, // €50.00 in cents  
    maxSize: null
  },
  {
    key: "basic-full-motion",
    name: "Basic Full Motion Mount",
    description: "Swivel, tilt, and extend functionality",
    type: "Full Motion",
    price: 6000, // €60.00 in cents
    maxSize: 55
  },
  {
    key: "premium-full-motion", 
    name: "Premium Full Motion Mount",
    description: "Heavy-duty full motion mount for larger TVs",
    type: "Full Motion",
    price: 8500, // €85.00 in cents
    maxSize: null
  }
];

export default function MountTypeSelection() {
  const { bookingData, updateBookingData } = useBooking();
  const [needsWallMount, setNeedsWallMount] = useState<boolean | undefined>(undefined);
  const [selectedWallMount, setSelectedWallMount] = useState<string>('');

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'square':
        return <Square className="h-8 w-8 text-gray-600" />;
      case 'angle-down':
        return <ChevronDown className="h-8 w-8 text-gray-600" />;
      case 'arrows-alt':
        return <Move className="h-8 w-8 text-gray-600" />;
      default:
        return <Settings className="h-8 w-8 text-gray-600" />;
    }
  };

  const getAvailableWallMounts = () => {
    const tvSize = bookingData.tvSize;
    if (!tvSize) return WALL_MOUNT_OPTIONS;
    
    return WALL_MOUNT_OPTIONS.filter(mount => 
      mount.maxSize === null || tvSize <= mount.maxSize
    ).filter(mount => {
      // Filter by selected mount type
      if (!bookingData.mountType) return true;
      const mountTypeName = MOUNT_TYPES.find(t => t.key === bookingData.mountType)?.name || '';
      return mount.type === mountTypeName;
    });
  };

  const handleMountTypeSelect = (mountType: string) => {
    updateBookingData({ mountType });
    // Reset wall mount selection when mount type changes
    setSelectedWallMount('');
  };

  const handleWallMountSelect = (needs: boolean) => {
    setNeedsWallMount(needs);
    if (!needs) {
      setSelectedWallMount('');
      // Update total price by removing wall mount cost
      updateBookingData({ 
        addonTotal: bookingData.addonTotal,
        total: bookingData.subtotal + bookingData.addonTotal
      });
    }
  };

  const handleWallMountOptionSelect = (wallMountKey: string) => {
    setSelectedWallMount(wallMountKey);
    
    // Find the selected wall mount and add its price
    const selectedMount = WALL_MOUNT_OPTIONS.find(mount => mount.key === wallMountKey);
    if (selectedMount) {
      const wallMountPrice = selectedMount.price / 100; // Convert cents to euros
      const newTotal = bookingData.subtotal + bookingData.addonTotal + wallMountPrice;
      updateBookingData({ 
        total: newTotal
      });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-8 lg:p-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Mount Type</h2>
          <p className="text-lg text-gray-600">Select how you want your TV to be positioned</p>
        </div>

        {/* Mount Type Selection */}
        <div className="space-y-4 mb-8">
          {MOUNT_TYPES.map((mount) => (
            <button
              key={mount.key}
              onClick={() => handleMountTypeSelect(mount.key)}
              className={`w-full p-6 border-2 rounded-2xl transition-all duration-300 text-left ${
                bookingData.mountType === mount.key
                  ? 'border-indigo-500 bg-gradient-to-br from-blue-50 to-indigo-50'
                  : 'border-gray-200 hover:border-indigo-400 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  {getIcon(mount.icon)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{mount.name}</h3>
                  <p className="text-sm text-gray-600">{mount.description}</p>
                </div>
              </div>
            </button>
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
                      <p className="text-sm text-gray-600 mb-2">{mount.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {mount.type}
                        </span>
                        {mount.maxSize && (
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            Up to {mount.maxSize}"
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        €{(mount.price / 100).toFixed(0)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current Total Display */}
        {needsWallMount === true && selectedWallMount && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Updated Total:</span>
              <span className="text-xl font-bold text-indigo-600">€{bookingData.total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}