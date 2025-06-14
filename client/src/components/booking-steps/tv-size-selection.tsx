import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tv, ArrowLeft } from 'lucide-react';
import { useBookingStore } from '@/lib/booking-store';
import { TV_SIZES } from '@/lib/constants';
import AIPreview from '@/components/ai-preview';

interface TvSizeSelectionProps {
  onNext: () => void;
  onBack: () => void;
}

export default function TvSizeSelection({ onNext, onBack }: TvSizeSelectionProps) {
  const { data, updateData } = useBookingStore();

  const handleSizeSelect = (size: number) => {
    updateData({ tvSize: size });
  };

  const getSizeLabel = (size: number) => {
    if (size <= 43) return 'Small';
    if (size <= 55) return 'Medium';
    if (size <= 65) return 'Large';
    if (size <= 75) return 'X-Large';
    return 'XX-Large';
  };

  return (
    <Card className="typeform-card">
      <CardContent>
        <div className="text-center mb-8">
          <div className="w-20 h-20 typeform-gradient rounded-full flex items-center justify-center mx-auto mb-6">
            <Tv className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What's Your TV Size?</h2>
          <p className="text-lg text-gray-600">Select your TV size to see the accurate preview</p>
        </div>
        
        {/* AI Preview Section */}
        {data.photo && data.tvSize && (
          <AIPreview className="mb-8" />
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {TV_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => handleSizeSelect(size)}
              className={`tile-option ${data.tvSize === size ? 'selected' : ''}`}
            >
              <Tv className="h-8 w-8 text-gray-600 mx-auto mb-3" />
              <div className="text-lg font-semibold text-gray-900">{size}"</div>
              <div className="text-sm text-gray-500">{getSizeLabel(size)}</div>
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
            disabled={!data.tvSize}
            className="btn-primary"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
