import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Settings, Square, ChevronDown, Move } from 'lucide-react';
import { useBookingStore } from '@/lib/booking-store';
import { MOUNT_TYPES } from '@/lib/constants';

interface MountTypeProps {
  onNext: () => void;
  onBack: () => void;
}

export default function MountType({ onNext, onBack }: MountTypeProps) {
  const { data, updateData } = useBookingStore();

  const handleMountTypeSelect = (mountType: string) => {
    updateData({ mountType });
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

        <div className="flex justify-between">
          <Button variant="ghost" onClick={onBack} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!data.mountType}
            className="btn-primary"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
