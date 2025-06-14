import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, CloudUpload, CheckCircle } from 'lucide-react';
import { useBookingStore } from '@/lib/booking-store';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploadProps {
  onNext: () => void;
}

export default function PhotoUpload({ onNext }: PhotoUploadProps) {
  const { data, updateData } = useBookingStore();
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiRequest('POST', '/api/upload-room-image', formData);
      const result = await response.json();

      updateData({
        photo: result.imageBase64,
        analysisResult: result.analysis
      });

      toast({
        title: "Photo uploaded successfully!",
        description: "Your room has been analyzed by our AI.",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: "Please try uploading your photo again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    updateData({ photo: undefined, analysisResult: undefined });
    onNext();
  };

  return (
    <Card className="typeform-card">
      <CardContent className="text-center">
        <div className="w-20 h-20 typeform-gradient rounded-full flex items-center justify-center mx-auto mb-6">
          <Camera className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Room Photo</h2>
        <p className="text-lg text-gray-600 mb-8">Take a photo of the wall where you want your TV mounted. Our AI will show you a preview!</p>
        
        <div 
          className={`border-2 border-dashed rounded-2xl p-8 mb-6 transition-colors cursor-pointer ${
            data.photo ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary'
          }`}
          onClick={() => document.getElementById('photoUpload')?.click()}
        >
          <input 
            type="file" 
            id="photoUpload" 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          
          {!data.photo ? (
            <div className="text-center">
              <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-2">
                {isUploading ? 'Uploading and analyzing...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
            </div>
          ) : (
            <div className="text-center">
              <img 
                src={data.photo} 
                alt="Uploaded room" 
                className="max-w-full h-64 object-cover rounded-xl mx-auto mb-4"
              />
              <div className="flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-green-600 font-medium">Photo uploaded successfully!</span>
              </div>
              {data.analysisResult && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Room Analysis:</strong> {data.analysisResult.roomType} - {data.analysisResult.wallSuitability}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={handleSkip} disabled={isUploading}>
            Skip this step
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!data.photo && !isUploading}
            className="btn-primary"
          >
            {isUploading ? 'Processing...' : 'Continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
