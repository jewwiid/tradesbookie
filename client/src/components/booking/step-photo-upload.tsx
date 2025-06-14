import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Camera, X } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';

interface StepPhotoUploadProps {
  onNext: () => void;
  onSkip: () => void;
}

export function StepPhotoUpload({ onNext, onSkip }: StepPhotoUploadProps) {
  const { state, dispatch } = useBooking();
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        dispatch({ 
          type: 'SET_PHOTO', 
          photo: file, 
          originalImageUrl: result 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const removePhoto = () => {
    dispatch({ type: 'SET_PHOTO', photo: null });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-8 lg:p-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Room Photo</h2>
          <p className="text-lg text-gray-600">
            Take a photo of the wall where you want your TV mounted. Our AI will show you a preview!
          </p>
        </div>

        {!state.photo ? (
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-indigo-400'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => document.getElementById('photo-upload')?.click()}
          >
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 mb-2">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
          </div>
        ) : (
          <div className="relative">
            <img
              src={state.originalImageUrl}
              alt="Room preview"
              className="w-full h-64 object-cover rounded-xl"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={removePhoto}
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="mt-4 p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-green-700 font-medium">
                ✓ Photo uploaded successfully! Our AI will create a preview in the next step.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={onSkip}>
            Skip this step
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!state.photo}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
