import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Camera, ArrowLeft, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { StepProps, RoomAnalysisResult } from "@/lib/types";
import { IMAGE_UPLOAD } from "@/lib/constants";

export function PhotoUpload({ formData, updateFormData, onNext, onPrev }: StepProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const analyzeRoomMutation = useMutation({
    mutationFn: async (file: File): Promise<RoomAnalysisResult> => {
      const formDataUpload = new FormData();
      formDataUpload.append('photo', file);
      
      const response = await apiRequest('POST', '/api/analyze-room', formDataUpload);
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success && result.imageBase64) {
        updateFormData({
          roomPhotoBase64: result.imageBase64,
          roomAnalysis: result.analysis
        });
        setUploadError(null);
      } else {
        setUploadError(result.error || 'Failed to analyze room photo');
      }
    },
    onError: (error: any) => {
      setUploadError(error.message || 'Failed to upload photo');
    }
  });

  const validateFile = (file: File): string | null => {
    if (file.size > IMAGE_UPLOAD.MAX_SIZE) {
      return 'File size must be less than 10MB';
    }
    
    if (!IMAGE_UPLOAD.ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a valid image file (JPEG, PNG, WebP)';
    }
    
    return null;
  };

  const handleFileUpload = useCallback((file: File) => {
    setUploadError(null);
    
    const validation = validateFile(file);
    if (validation) {
      setUploadError(validation);
      return;
    }

    // Store the file for later use
    updateFormData({ roomPhoto: file });
    
    // Analyze the room
    analyzeRoomMutation.mutate(file);
  }, [updateFormData, analyzeRoomMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleSkip = () => {
    updateFormData({ roomPhoto: undefined, roomPhotoBase64: undefined });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <Camera className="w-8 h-8 text-white" />
        </div>
        <p className="text-lg text-gray-600 mb-8">
          Take a photo of the wall where you want your TV mounted. Our AI will show you a preview!
        </p>
      </div>

      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed cursor-pointer transition-all duration-300 ${
          dragActive 
            ? 'border-primary bg-blue-50' 
            : formData.roomPhotoBase64
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-primary hover:bg-blue-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('photoUpload')?.click()}
      >
        <CardContent className="p-8">
          <input
            type="file"
            id="photoUpload"
            className="hidden"
            accept={IMAGE_UPLOAD.MIME_TYPES}
            onChange={handleFileInput}
          />
          
          {formData.roomPhotoBase64 ? (
            <div className="text-center">
              <img
                src={`data:image/jpeg;base64,${formData.roomPhotoBase64}`}
                alt="Room preview"
                className="max-w-full h-64 object-cover rounded-xl mx-auto mb-4"
              />
              <p className="text-success font-medium mb-2">Photo uploaded successfully!</p>
              {formData.roomAnalysis && (
                <div className="text-left bg-white rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">AI Analysis:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Wall Suitability:</strong> {formData.roomAnalysis.wallSuitability}</p>
                    <p><strong>Recommended TV Size:</strong> {formData.roomAnalysis.recommendedTVSize}</p>
                    {formData.roomAnalysis.potentialChallenges.length > 0 && (
                      <div>
                        <strong>Potential Challenges:</strong>
                        <ul className="list-disc list-inside ml-2">
                          {formData.roomAnalysis.potentialChallenges.map((challenge, index) => (
                            <li key={index}>{challenge}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : analyzeRoomMutation.isPending ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg text-gray-600 mb-2">Analyzing your room...</p>
              <p className="text-sm text-gray-500">Our AI is examining the photo to provide installation recommendations</p>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-2">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-500">PNG, JPG, WebP up to 10MB</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Alert */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Photo Tips:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Take the photo from where you'll be sitting</li>
                <li>• Include the entire wall where the TV will go</li>
                <li>• Make sure the lighting is good and the image is clear</li>
                <li>• Remove any existing TV or wall decorations if possible</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={handleSkip}>
          Skip this step
        </Button>
        <Button 
          onClick={onNext} 
          className="btn-primary"
          disabled={analyzeRoomMutation.isPending}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
