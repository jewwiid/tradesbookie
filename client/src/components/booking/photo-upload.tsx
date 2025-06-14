import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CloudUpload, Camera, CheckCircle, X } from "lucide-react";
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
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log('Uploading file:', file.name, file.size, file.type);
      
      const formData = new FormData();
      formData.append('photo', file);
      
      // Log FormData contents
      console.log('FormData created with photo field');
      
      const response = await fetch('/api/upload-room-photo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }
      
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

  const startCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: 'environment' }, // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
        setShowCamera(true);
      }
    } catch (error: any) {
      console.error("Camera error:", error);
      let description = "Please allow camera access to take a photo";
      
      if (error.name === 'NotAllowedError') {
        description = "Camera access was denied. Please allow camera access and try again.";
      } else if (error.name === 'NotFoundError') {
        description = "No camera found on this device.";
      } else if (error.name === 'NotSupportedError') {
        description = "Camera is not supported in this browser.";
      }
      
      toast({
        title: "Camera initialization failed",
        description,
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
            handleFile(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="text-center">
      <div className="step-indicator">
        <Camera className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-foreground mb-4">Upload Your Room Photo</h2>
      <p className="text-lg text-muted-foreground mb-8">
        Take a photo of the wall where you want your TV mounted. Our AI will show you a preview!
      </p>

{!bookingData.roomPhotoBase64 && !showCamera ? (
        <>
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
          
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-muted-foreground/25"></div>
            <span className="text-sm text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-muted-foreground/25"></div>
          </div>
          
          <Button 
            onClick={startCamera}
            variant="outline"
            className="w-full mb-6 h-12 text-lg"
            disabled={uploadMutation.isPending}
          >
            <Camera className="w-5 h-5 mr-2" />
            Use Camera
          </Button>
        </>
      ) : showCamera ? (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-w-md mx-auto rounded-xl"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
            </div>
            
            <div className="flex justify-center gap-4 mt-4">
              <Button
                onClick={capturePhoto}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                <Camera className="w-5 h-5 mr-2" />
                Take Photo
              </Button>
              <Button
                onClick={stopCamera}
                variant="outline"
                size="lg"
              >
                <X className="w-5 h-5 mr-2" />
                Cancel
              </Button>
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
