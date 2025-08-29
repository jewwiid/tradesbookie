import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tv, Sparkles } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import { TV_SIZES } from '@/lib/constants.tsx';
import { apiRequest } from '@/lib/queryClient';

interface StepTVSizeProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepTVSize({ onNext, onBack }: StepTVSizeProps) {
  const { state, dispatch } = useBooking();
  const [selectedSize, setSelectedSize] = useState<number | undefined>(state.tvSize);
  const [aiPreviewLoading, setAiPreviewLoading] = useState(false);
  const [previewView, setPreviewView] = useState<'before' | 'after'>('before');

  const handleSizeSelect = async (size: number) => {
    setSelectedSize(size);
    dispatch({ type: 'SET_TV_SIZE', tvSize: size });

    // Generate AI preview if photo is available
    if (state.photo && !state.aiPreviewImageUrl) {
      setAiPreviewLoading(true);
      try {
        const formData = new FormData();
        formData.append('image', state.photo);
        formData.append('tvSize', size.toString());

        const response = await fetch('/api/ai/enhance-room', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          dispatch({ type: 'SET_AI_PREVIEW', aiPreviewImageUrl: result.enhancedImageUrl });
        }
      } catch (error) {
        console.error('Error generating AI preview:', error);
      } finally {
        setAiPreviewLoading(false);
      }
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-8 lg:p-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Tv className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What's Your TV Size?</h2>
          <p className="text-lg text-gray-600">Select your TV size to see the accurate preview</p>
        </div>

        {/* AI Preview Section */}
        {state.originalImageUrl && (
          <div className="mb-8">
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-lg font-semibold text-gray-900">AI Preview</h3>
                </div>
                {(state.aiPreviewImageUrl || aiPreviewLoading) && (
                  <Tabs value={previewView} onValueChange={(v) => setPreviewView(v as 'before' | 'after')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="before">Before</TabsTrigger>
                      <TabsTrigger value="after" disabled={!state.aiPreviewImageUrl && !aiPreviewLoading}>
                        After
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
              </div>
              
              <div className="relative">
                {previewView === 'before' ? (
                  <img
                    src={state.originalImageUrl}
                    alt="Original room"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                ) : aiPreviewLoading ? (
                  <div className="w-full h-64 bg-gray-200 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Generating AI preview...</p>
                    </div>
                  </div>
                ) : state.aiPreviewImageUrl ? (
                  <div className="relative">
                    <img
                      src={state.aiPreviewImageUrl}
                      alt="AI preview with TV"
                      className="w-full h-64 object-cover rounded-xl"
                    />
                    <div className="absolute top-4 right-4 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>AI Generated</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* TV Size Selection */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {TV_SIZES.map((size) => (
            <button
              key={size.value}
              onClick={() => handleSizeSelect(size.value)}
              className={`p-6 border-2 rounded-2xl transition-all duration-300 text-center ${
                selectedSize === size.value
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
              }`}
            >
              <Tv className={`w-8 h-8 mx-auto mb-3 ${
                selectedSize === size.value ? 'text-indigo-600' : 'text-gray-600'
              }`} />
              <div className="text-lg font-semibold text-gray-900">{size.label}</div>
              <div className="text-sm text-gray-500">{size.category}</div>
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!selectedSize}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
