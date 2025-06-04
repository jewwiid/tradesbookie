import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tv, Sparkles } from 'lucide-react';
import { useBooking } from '@/hooks/use-booking';
import AIPreview from '@/components/ai-preview';
import { getTVSizeCategory } from '@/lib/service-pricing';

const TV_SIZES = [
  { size: 32, label: "32\"", category: "Small" },
  { size: 43, label: "43\"", category: "Medium" },
  { size: 55, label: "55\"", category: "Large" },
  { size: 65, label: "65\"", category: "X-Large" },
  { size: 75, label: "75\"", category: "XX-Large" },
  { size: 85, label: "85\"", category: "Premium" },
];

interface TVSizeSelectionProps {
  serviceTiers: any[];
}

export default function TVSizeSelection({ serviceTiers }: TVSizeSelectionProps) {
  const { bookingData, updateBookingData, generateAIPreview } = useBooking();
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const handleSizeSelect = (size: number) => {
    updateBookingData({ tvSize: size });
  };

  const handleGeneratePreview = async () => {
    if (!bookingData.roomPhotoFile || !bookingData.tvSize || !bookingData.wallType || !bookingData.mountType) {
      return;
    }

    setIsGeneratingPreview(true);
    try {
      await generateAIPreview();
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Auto-generate preview when conditions are met
  useEffect(() => {
    if (bookingData.roomPhotoFile && bookingData.tvSize && bookingData.wallType && bookingData.mountType && !bookingData.aiPreviewUrl && !isGeneratingPreview) {
      handleGeneratePreview();
    }
  }, [bookingData.tvSize, bookingData.wallType, bookingData.mountType]);

  return (
    <div className="space-y-6">
      <Card className="bg-white rounded-3xl shadow-xl">
        <CardHeader className="text-center">
          <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Tv className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
            What's Your TV Size?
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Select your TV size to see the accurate preview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TV_SIZES.map((tvSize) => (
              <Button
                key={tvSize.size}
                variant={bookingData.tvSize === tvSize.size ? "default" : "outline"}
                className={`tv-size-option p-6 h-auto flex-col space-y-2 ${
                  bookingData.tvSize === tvSize.size 
                    ? 'gradient-primary text-white border-primary' 
                    : 'border-gray-200 hover:border-primary hover:bg-blue-50'
                }`}
                onClick={() => handleSizeSelect(tvSize.size)}
              >
                <Tv className="w-6 h-6" />
                <div className="text-lg font-semibold">{tvSize.label}</div>
                <div className="text-sm opacity-75">{tvSize.category}</div>
              </Button>
            ))}
          </div>

          {bookingData.tvSize > 0 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center text-green-700">
                <Tv className="w-4 h-4 mr-2" />
                <span className="font-medium">
                  Selected: {bookingData.tvSize}" TV ({getTVSizeCategory(bookingData.tvSize)})
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Preview Section */}
      {bookingData.roomPhotoUrl && bookingData.tvSize > 0 && (
        <AIPreview
          originalImageUrl={bookingData.roomPhotoUrl}
          previewImageUrl={bookingData.aiPreviewUrl}
          isGenerating={isGeneratingPreview}
          onGeneratePreview={bookingData.wallType && bookingData.mountType ? handleGeneratePreview : undefined}
        />
      )}
    </div>
  );
}
