import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Home } from 'lucide-react';
import { useBookingStore } from '@/lib/booking-store';
import { WALL_TYPES } from '@/lib/constants';

interface WallTypeProps {
  onNext: () => void;
  onBack: () => void;
}

export default function WallType({ onNext, onBack }: WallTypeProps) {
  const { data, updateData } = useBookingStore();

  const handleWallTypeSelect = (wallType: string) => {
    updateData({ wallType });
  };

  return (
    <Card className="typeform-card">
      <CardContent>
        <div className="text-center mb-8">
          <div className="w-20 h-20 typeform-gradient rounded-full flex items-center justify-center mx-auto mb-6">
            <Home className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What's Your Wall Type?</h2>
          <p className="text-lg text-gray-600">This helps us prepare the right tools and mounting hardware</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {WALL_TYPES.map((wall) => (
            <button
              key={wall.key}
              onClick={() => handleWallTypeSelect(wall.key)}
              className={`tile-option text-left ${data.wallType === wall.key ? 'selected' : ''}`}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{wall.name}</h3>
              <p className="text-sm text-gray-600">{wall.description}</p>
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
            disabled={!data.wallType}
            className="btn-primary"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
