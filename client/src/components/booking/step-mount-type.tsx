import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import { MOUNT_TYPES } from '@/lib/constants';

interface StepMountTypeProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepMountType({ onNext, onBack }: StepMountTypeProps) {
  const { state, dispatch } = useBooking();
  const [selectedMountType, setSelectedMountType] = useState<string | undefined>(state.mountType);

  const handleMountTypeSelect = (mountType: string) => {
    setSelectedMountType(mountType);
    dispatch({ type: 'SET_MOUNT_TYPE', mountType });
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

        <div className="space-y-4 mb-8">
          {MOUNT_TYPES.map((mountType) => (
            <button
              key={mountType.value}
              onClick={() => handleMountTypeSelect(mountType.value)}
              className={`w-full p-6 border-2 rounded-2xl transition-all duration-300 text-left ${
                selectedMountType === mountType.value
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">{mountType.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{mountType.label}</h3>
                  <p className="text-sm text-gray-600">{mountType.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!selectedMountType}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
