import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import { WALL_TYPES } from '@/lib/constants';

interface StepWallTypeProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepWallType({ onNext, onBack }: StepWallTypeProps) {
  const { state, dispatch } = useBooking();
  const [selectedWallType, setSelectedWallType] = useState<string | undefined>(state.wallType);

  const handleWallTypeSelect = (wallType: string) => {
    setSelectedWallType(wallType);
    dispatch({ type: 'SET_WALL_TYPE', wallType });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-8 lg:p-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What's Your Wall Type?</h2>
          <p className="text-lg text-gray-600">
            This helps us prepare the right tools and mounting hardware
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {WALL_TYPES.map((wallType) => (
            <button
              key={wallType.value}
              onClick={() => handleWallTypeSelect(wallType.value)}
              className={`p-6 border-2 rounded-2xl transition-all duration-300 text-left ${
                selectedWallType === wallType.value
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
              }`}
            >
              <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-4xl">🧱</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{wallType.label}</h3>
              <p className="text-sm text-gray-600">{wallType.description}</p>
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!selectedWallType}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
