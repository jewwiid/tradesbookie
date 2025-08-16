import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, X, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CompletionPhotoCaptureProps {
  bookingId: number;
  tvCount: number;
  onPhotosCompleted: (photos: string[]) => void;
  onCancel: () => void;
}

interface CapturedPhoto {
  id: string;
  base64: string;
  timestamp: Date;
}

export default function CompletionPhotoCapture({ 
  bookingId, 
  tvCount, 
  onPhotosCompleted, 
  onCancel 
}: CompletionPhotoCaptureProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const uploadPhotosMutation = useMutation({
    mutationFn: async (photos: string[]) => {
      return apiRequest('POST', '/api/installer/upload-completion-photos', {
        bookingId, photos
      });
    },
    onSuccess: () => {
      toast({
        title: "Photos uploaded successfully!",
        description: "Installation completion photos have been saved."
      });
      onPhotosCompleted(capturedPhotos.map(p => p.base64));
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        } 
      });
      
      streamRef.current = stream;
      setShowCamera(true);
      
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(err => {
              console.error("Video play failed:", err);
            });
          };
        }
      }, 100);
      
    } catch (error: any) {
      console.error("Camera error:", error);
      toast({
        title: "Camera initialization failed",
        description: "Please allow camera access to take photos",
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
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Camera error",
        description: "Camera not properly initialized. Please try again.",
        variant: "destructive"
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
      toast({
        title: "Camera not ready",
        description: "Please wait for camera to fully load.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const maxWidth = 1920;
      const maxHeight = 1080;
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            const photoId = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const newPhoto: CapturedPhoto = {
              id: photoId,
              base64: base64.split(',')[1], // Remove data:image/jpeg;base64, prefix
              timestamp: new Date()
            };
            
            setCapturedPhotos(prev => {
              const updated = [...prev];
              updated[currentPhotoIndex] = newPhoto;
              return updated;
            });
            
            toast({
              title: `TV ${currentPhotoIndex + 1} photo captured!`,
              description: `${tvCount - currentPhotoIndex - 1} more photos needed.`
            });
            
            stopCamera();
            
            // Auto-advance to next photo if not the last one
            if (currentPhotoIndex < tvCount - 1) {
              setCurrentPhotoIndex(prev => prev + 1);
            }
          };
          reader.readAsDataURL(blob);
        }
      }, 'image/jpeg', 0.8);
      
    } catch (error) {
      console.error('Error during photo capture:', error);
      toast({
        title: "Capture failed",
        description: "An error occurred while capturing the photo.",
        variant: "destructive"
      });
    }
  };

  const deletePhoto = (index: number) => {
    setCapturedPhotos(prev => {
      const updated = [...prev];
      updated[index] = undefined as any;
      return updated.filter((_, i) => i !== index || i < tvCount);
    });
  };

  const handleSubmit = async () => {
    const validPhotos = capturedPhotos.filter(p => p && p.base64);
    if (validPhotos.length !== tvCount) {
      toast({
        title: "Incomplete photo capture",
        description: `Please capture photos for all ${tvCount} TV installations.`,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    uploadPhotosMutation.mutate(validPhotos.map(p => p.base64));
  };

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const allPhotosCompleted = capturedPhotos.filter(p => p && p.base64).length === tvCount;

  return (
    <div className="min-h-screen bg-background p-4">
      {showCamera ? (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Camera controls overlay */}
            <div className="absolute bottom-20 left-0 right-0 px-4">
              <div className="text-center mb-6">
                <div className="bg-black/60 rounded-full px-4 py-2 inline-block">
                  <p className="text-white text-sm font-medium">
                    TV Installation {currentPhotoIndex + 1} of {tvCount}
                  </p>
                  <p className="text-white/80 text-xs">
                    Take a clear photo of the installed TV
                  </p>
                </div>
              </div>
              
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={stopCamera}
                  className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 text-white hover:bg-white/30 transition-all duration-200 flex items-center justify-center"
                  type="button"
                >
                  <X className="w-6 h-6" />
                </button>
                
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full bg-white text-black hover:bg-gray-200 transition-all duration-200 flex items-center justify-center shadow-lg active:scale-95"
                  type="button"
                >
                  <Camera className="w-8 h-8" />
                </button>
                
                <div className="w-16 h-16" /> {/* Spacer for symmetry */}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Camera className="w-6 h-6" />
                  <span>Installation Completion Photos</span>
                </div>
                <Badge variant="outline">
                  {capturedPhotos.filter(p => p && p.base64).length} / {tvCount}
                </Badge>
              </CardTitle>
              <p className="text-muted-foreground">
                Take a photo of each installed TV to complete the job. Clear photos help with customer satisfaction and quality assurance.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Photo capture progress */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: tvCount }, (_, index) => {
                  const photo = capturedPhotos[index];
                  const isActive = index === currentPhotoIndex;
                  
                  return (
                    <Card key={index} className={`relative ${isActive ? 'ring-2 ring-primary' : ''}`}>
                      <CardContent className="p-4">
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-3">
                          {photo && photo.base64 ? (
                            <img 
                              src={`data:image/jpeg;base64,${photo.base64}`}
                              alt={`TV ${index + 1} installation`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="text-center">
                              <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">
                                TV {index + 1}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {photo && photo.base64 ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                            )}
                            <span className="text-sm font-medium">
                              TV {index + 1}
                            </span>
                          </div>
                          
                          {photo && photo.base64 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deletePhoto(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        {isActive && !photo && (
                          <Button 
                            onClick={startCamera}
                            className="w-full mt-2"
                            size="sm"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Take Photo
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {/* Navigation controls */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}
                    disabled={currentPhotoIndex === 0}
                    size="sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPhotoIndex(Math.min(tvCount - 1, currentPhotoIndex + 1))}
                    disabled={currentPhotoIndex >= tvCount - 1}
                    size="sm"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={!allPhotosCompleted || isUploading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete Installation ({capturedPhotos.filter(p => p && p.base64).length}/{tvCount})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}