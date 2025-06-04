import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useBooking } from '@/hooks/use-booking';
import { useToast } from '@/hooks/use-toast';

export default function PhotoUpload() {
  const { bookingData, updateBookingData, uploadRoomPhoto } = useBooking();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const result = await uploadRoomPhoto(file);
      if (result.success) {
        toast({
          title: "Photo uploaded successfully",
          description: "Your room photo has been analyzed and is ready for AI preview.",
        });
      } else {
        setUploadError(result.error || 'Failed to upload photo');
      }
    } catch (error) {
      setUploadError('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const fakeEvent = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <Card className="bg-white rounded-3xl shadow-xl">
      <CardHeader className="text-center">
        <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <Camera className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
          Upload Your Room Photo
        </CardTitle>
        <CardDescription className="text-lg text-gray-600">
          Take a photo of the wall where you want your TV mounted. Our AI will show you a preview!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!bookingData.roomPhotoUrl ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-primary transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {isUploading ? (
              <div className="space-y-4">
                <div className="loading-spinner w-8 h-8 mx-auto"></div>
                <p className="text-lg text-gray-600">Uploading and analyzing your photo...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg text-gray-600 mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={bookingData.roomPhotoUrl}
                alt="Room photo"
                className="w-full h-64 object-cover"
              />
              <Badge className="absolute top-4 right-4 bg-green-500 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Photo uploaded successfully
              </Badge>
            </div>
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Camera className="w-4 h-4 mr-2" />
                Choose Different Photo
              </Button>
            </div>
          </div>
        )}

        {uploadError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
            <AlertCircle className="w-4 h-4 mr-2" />
            {uploadError}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <h4 className="font-medium text-gray-900 mb-2">Tips for best results:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Take the photo from where you'll be watching TV</li>
            <li>• Ensure the wall is clearly visible and well-lit</li>
            <li>• Include surrounding furniture for context</li>
            <li>• Avoid backlighting or shadows on the wall</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
