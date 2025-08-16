import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, X, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Trash2, Star } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BeforeAfterPhotoCaptureProps {
  bookingId: number;
  tvCount: number;
  onPhotosCompleted: (photos: BeforeAfterPhoto[]) => void;
  onCancel: () => void;
}

interface BeforeAfterPhoto {
  tvIndex: number;
  beforePhoto?: string; // base64 string
  afterPhoto?: string; // base64 string
  timestamp?: Date;
}

interface CapturedPhoto {
  id: string;
  base64: string;
  timestamp: Date;
}

export default function BeforeAfterPhotoCapture({ 
  bookingId, 
  tvCount, 
  onPhotosCompleted, 
  onCancel 
}: BeforeAfterPhotoCaptureProps) {
  const [currentTvIndex, setCurrentTvIndex] = useState(0);
  const [currentPhotoType, setCurrentPhotoType] = useState<'before' | 'after'>('before');
  const [capturedPhotos, setCapturedPhotos] = useState<BeforeAfterPhoto[]>(
    Array.from({ length: tvCount }, (_, i) => ({ tvIndex: i }))
  );
  const [showCamera, setShowCamera] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const uploadPhotosMutation = useMutation({
    mutationFn: async (photos: BeforeAfterPhoto[]) => {
      return apiRequest('POST', '/api/installer/upload-before-after-photos', {
        bookingId, photos
      });
    },
    onSuccess: () => {
      toast({
        title: "Photos uploaded successfully!",
        description: "Before and after photos have been saved. You'll earn quality stars for complete photo sets!"
      });
      onPhotosCompleted(capturedPhotos);
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
            const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
            
            setCapturedPhotos(prev => {
              const updated = [...prev];
              if (currentPhotoType === 'before') {
                updated[currentTvIndex] = {
                  ...updated[currentTvIndex],
                  beforePhoto: base64Data,
                  timestamp: new Date()
                };
              } else {
                updated[currentTvIndex] = {
                  ...updated[currentTvIndex],
                  afterPhoto: base64Data,
                  timestamp: new Date()
                };
              }
              return updated;
            });
            
            toast({
              title: `${currentPhotoType === 'before' ? 'Before' : 'After'} photo captured!`,
              description: `TV ${currentTvIndex + 1} ${currentPhotoType} photo saved.`
            });
            
            stopCamera();
            
            // Auto-advance logic
            if (currentPhotoType === 'before') {
              // Move to after photo for same TV
              setCurrentPhotoType('after');
            } else {
              // Move to next TV's before photo
              if (currentTvIndex < tvCount - 1) {
                setCurrentTvIndex(prev => prev + 1);
                setCurrentPhotoType('before');
              }
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

  const deletePhoto = (tvIndex: number, photoType: 'before' | 'after') => {
    setCapturedPhotos(prev => {
      const updated = [...prev];
      if (photoType === 'before') {
        updated[tvIndex] = { ...updated[tvIndex], beforePhoto: undefined };
      } else {
        updated[tvIndex] = { ...updated[tvIndex], afterPhoto: undefined };
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    const allPhotosComplete = capturedPhotos.every(tv => tv.beforePhoto && tv.afterPhoto);
    
    if (!allPhotosComplete) {
      const missingCount = capturedPhotos.reduce((count, tv) => {
        let missing = 0;
        if (!tv.beforePhoto) missing++;
        if (!tv.afterPhoto) missing++;
        return count + missing;
      }, 0);
      
      toast({
        title: "Incomplete photo capture",
        description: `Please capture all before and after photos. ${missingCount} photos still needed.`,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    uploadPhotosMutation.mutate(capturedPhotos);
  };

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const totalPhotosCompleted = capturedPhotos.reduce((count, tv) => {
    let completed = 0;
    if (tv.beforePhoto) completed++;
    if (tv.afterPhoto) completed++;
    return count + completed;
  }, 0);
  const totalPhotosNeeded = tvCount * 2; // 2 photos per TV

  // Calculate potential stars based on completion
  const photoCompletionRate = (totalPhotosCompleted / totalPhotosNeeded) * 100;
  const potentialPhotoStars = photoCompletionRate === 100 ? 3 : photoCompletionRate >= 80 ? 2 : photoCompletionRate >= 50 ? 1 : 0;

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
                    TV {currentTvIndex + 1} - {currentPhotoType === 'before' ? 'BEFORE' : 'AFTER'} Installation
                  </p>
                  <p className="text-white/80 text-xs">
                    {currentPhotoType === 'before' 
                      ? 'Take photo BEFORE mounting the TV' 
                      : 'Take photo AFTER mounting the TV'
                    }
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
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Camera className="w-6 h-6" />
                  <span>Before & After Photos</span>
                  <div className="flex items-center space-x-1 ml-2">
                    {Array.from({ length: Math.max(1, potentialPhotoStars) }, (_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < potentialPhotoStars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-1">
                      ({potentialPhotoStars}/3 Photo Stars)
                    </span>
                  </div>
                </div>
                <Badge variant="outline">
                  {totalPhotosCompleted} / {totalPhotosNeeded} photos
                </Badge>
              </CardTitle>
              <p className="text-muted-foreground">
                Capture before and after photos for each TV installation to earn quality stars and qualify for credit refunds. 
                Complete photo sets improve your rating and increase customer satisfaction.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Photo capture progress */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: tvCount }, (_, tvIndex) => {
                  const tvPhotos = capturedPhotos[tvIndex];
                  const isActiveTv = tvIndex === currentTvIndex;
                  
                  return (
                    <Card key={tvIndex} className={`relative ${isActiveTv ? 'ring-2 ring-primary' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">TV Installation {tvIndex + 1}</h3>
                          <div className="flex items-center space-x-1">
                            {tvPhotos.beforePhoto && tvPhotos.afterPhoto ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-orange-500" />
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {/* Before Photo */}
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-center">Before</div>
                            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                              {tvPhotos.beforePhoto ? (
                                <img 
                                  src={`data:image/jpeg;base64,${tvPhotos.beforePhoto}`}
                                  alt={`TV ${tvIndex + 1} before installation`}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <div className="text-center">
                                  <Camera className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">Before</p>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-center">
                              {tvPhotos.beforePhoto ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deletePhoto(tvIndex, 'before')}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              ) : (
                                isActiveTv && currentPhotoType === 'before' && (
                                  <Button 
                                    onClick={startCamera}
                                    size="sm"
                                    className="w-full"
                                  >
                                    <Camera className="w-4 h-4 mr-2" />
                                    Take Before
                                  </Button>
                                )
                              )}
                            </div>
                          </div>
                          
                          {/* After Photo */}
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-center">After</div>
                            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                              {tvPhotos.afterPhoto ? (
                                <img 
                                  src={`data:image/jpeg;base64,${tvPhotos.afterPhoto}`}
                                  alt={`TV ${tvIndex + 1} after installation`}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <div className="text-center">
                                  <Camera className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">After</p>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-center">
                              {tvPhotos.afterPhoto ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deletePhoto(tvIndex, 'after')}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              ) : (
                                isActiveTv && currentPhotoType === 'after' && (
                                  <Button 
                                    onClick={startCamera}
                                    size="sm"
                                    className="w-full"
                                  >
                                    <Camera className="w-4 h-4 mr-2" />
                                    Take After
                                  </Button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
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
                    onClick={() => {
                      if (currentPhotoType === 'after') {
                        setCurrentPhotoType('before');
                      } else if (currentTvIndex > 0) {
                        setCurrentTvIndex(prev => prev - 1);
                        setCurrentPhotoType('after');
                      }
                    }}
                    disabled={currentTvIndex === 0 && currentPhotoType === 'before'}
                    size="sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentPhotoType === 'before') {
                        setCurrentPhotoType('after');
                      } else if (currentTvIndex < tvCount - 1) {
                        setCurrentTvIndex(prev => prev + 1);
                        setCurrentPhotoType('before');
                      }
                    }}
                    disabled={currentTvIndex >= tvCount - 1 && currentPhotoType === 'after'}
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
                    disabled={totalPhotosCompleted !== totalPhotosNeeded || isUploading}
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
                        Complete Installation ({totalPhotosCompleted}/{totalPhotosNeeded})
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Quality Stars Info */}
              {totalPhotosCompleted > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium">Quality Star System</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Complete all before/after photos to earn 3 Photo Stars. Combined with customer reviews, 
                    you can earn up to 5 Total Stars and qualify for credit refunds of up to 50% of lead fees.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}