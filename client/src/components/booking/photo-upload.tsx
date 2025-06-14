import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CloudUpload, Camera, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BookingData } from "@/lib/booking-utils";

interface PhotoUploadProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
}

export default function PhotoUpload({ bookingData, updateBookingData }: PhotoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await apiRequest('POST', '/api/upload-room-photo', formData);
      return response.json();
    },
    onSuccess: (data) => {
      updateBookingData({
        roomPhotoBase64: data.imageBase64,
        roomAnalysis: data.analysis
      });
      toast({
        title: "Photo uploaded successfully!",
        description: "Your room photo has been analyzed by our AI."
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      uploadMutation.mutate(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, JPEG)",
        variant: "destructive"
      });
    }
  }, [uploadMutation, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="text-center">
      <div className="step-indicator">
        <Camera className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-foreground mb-4">Upload Your Room Photo</h2>
      <p className="text-lg text-muted-foreground mb-8">
        Take a photo of the wall where you want your TV mounted. Our AI will show you a preview!
      </p>

      {!bookingData.roomPhotoBase64 ? (
        <Card 
          className={`border-2 border-dashed ${dragActive ? 'border-primary bg-blue-50' : 'border-muted-foreground/25'} hover:border-primary transition-colors cursor-pointer mb-6`}
          onDrop={handleDrop}
          onDragOver={handleDrag}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onClick={() => document.getElementById('photo-upload')?.click()}
        >
          <CardContent className="p-8">
            <input
              type="file"
              id="photo-upload"
              className="hidden"
              accept="image/*"
              onChange={handleFileInput}
              disabled={uploadMutation.isPending}
            />
            
            <div className="text-center">
              <CloudUpload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-foreground mb-2">
                {uploadMutation.isPending ? "Uploading..." : "Click to upload or drag and drop"}
              </p>
              <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="text-center">
              <img 
                src={`data:image/jpeg;base64,${bookingData.roomPhotoBase64}`}
                alt="Room photo" 
                className="max-w-full h-64 object-cover rounded-xl mx-auto mb-4"
              />
              <div className="flex items-center justify-center text-success">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Photo uploaded successfully!</span>
              </div>
              
              {bookingData.roomAnalysis && (
                <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                  <h4 className="font-semibold text-foreground mb-2">AI Room Analysis</h4>
                  {bookingData.roomAnalysis.recommendations?.length > 0 && (
                    <div className="mb-2">
                      <h5 className="text-sm font-medium text-foreground">Recommendations:</h5>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {bookingData.roomAnalysis.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {bookingData.roomAnalysis.warnings?.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-warning">Considerations:</h5>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {bookingData.roomAnalysis.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={() => updateBookingData({ roomPhotoBase64: undefined, roomAnalysis: undefined })}
          className="text-muted-foreground hover:text-foreground"
        >
          Skip this step
        </Button>
      </div>
    </div>
  );
}
