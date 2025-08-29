import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Settings, Square, ChevronDown, Move, Check, X } from 'lucide-react';
import { useBookingStore } from '@/lib/booking-store';
import { MOUNT_TYPES, WALL_MOUNT_OPTIONS } from '@/lib/constants';

interface MountTypeProps {
  onNext: () => void;
  onBack: () => void;
}

export default function MountType({ onNext, onBack }: MountTypeProps) {
  const { data, updateData } = useBookingStore();

  const handleMountTypeSelect = (mountType: string) => {
    updateData({ mountType });
  };

  const handleWallMountSelect = (needsWallMount: boolean) => {
    updateData({ needsWallMount, wallMountOption: needsWallMount ? undefined : undefined });
  };

  const handleWallMountOptionSelect = (wallMountOption: string) => {
    updateData({ wallMountOption });
  };

  const getAvailableWallMounts = () => {
    const tvSize = data.tvSize;
    if (!tvSize) return Object.values(WALL_MOUNT_OPTIONS);
    
    return Object.values(WALL_MOUNT_OPTIONS).filter(mount => 
      mount.maxSize === null || tvSize <= mount.maxSize
    );
  };

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

  return (
    <Card className="typeform-card">
      <CardContent>
        <div className="text-center mb-8">
          <div className="w-20 h-20 typeform-gradient rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Mount Type</h2>
          <p className="text-lg text-gray-600">Select how you want your TV to be positioned</p>
        </div>

        <div className="space-y-4 mb-8">
          {MOUNT_TYPES.map((mount) => (
            <button
              key={mount.key}
              onClick={() => handleMountTypeSelect(mount.key)}
              className={`w-full p-6 border-2 rounded-2xl transition-all duration-300 text-left ${
                data.mountType === mount.key
                  ? 'border-primary bg-gradient-to-br from-blue-50 to-indigo-50'
                  : 'border-gray-200 hover:border-primary hover:bg-blue-50'
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
        {data.mountType && (
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Do you need a wall mount?</h3>
            <p className="text-gray-600 mb-6">
              Let us know if you need us to supply a wall mount bracket for your TV installation.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleWallMountSelect(true)}
                className={`p-4 border-2 rounded-xl transition-all duration-300 ${
                  data.needsWallMount === true
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
                  data.needsWallMount === false
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
        {data.needsWallMount === true && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Wall Mount</h3>
            <p className="text-gray-600 mb-6">Select the wall mount that best fits your TV and viewing needs</p>
            
            <div className="grid gap-4">
              {getAvailableWallMounts().map((mount) => (
                <button
                  key={mount.key}
                  onClick={() => handleWallMountOptionSelect(mount.key)}
                  className={`p-4 border-2 rounded-xl transition-all duration-300 text-left ${
                    data.wallMountOption === mount.key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
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

        <div className="flex justify-between">
          <Button variant="ghost" onClick={onBack} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={onNext} 
            disabled={
              !data.mountType || 
              data.needsWallMount === undefined ||
              (data.needsWallMount === true && !data.wallMountOption)
            }
            className="btn-primary"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
