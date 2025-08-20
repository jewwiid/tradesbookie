import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Check, X, FileImage, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PhotoProgress {
  id?: number;
  bookingId: number;
  installerId: number;
  tvIndex: number;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  beforePhotoSource?: string;
  afterPhotoSource?: string;
  isCompleted?: boolean;
}

interface FlexiblePhotoCaptureProps {
  bookingId: number;
  tvCount: number;
  tvNames?: string[]; // Room names for each TV
  workflowStage: 'before' | 'after' | 'both'; // Controls available photo types
  allowBeforeUpload?: boolean; // Whether before photos can be uploaded or camera-only
  onPhotosComplete?: (photos: Array<{ beforePhoto: string; afterPhoto: string; tvIndex: number }>) => void;
  onCancel: () => void;
  onProgressSave?: (tvIndex: number, progress: PhotoProgress) => void; // Called when progress is saved
}

interface CapturedPhoto {
  base64: string;
  timestamp: Date;
  source: 'camera' | 'upload';
}

export default function FlexiblePhotoCapture({ 
  bookingId, 
  tvCount, 
  tvNames = [],
  workflowStage,
  allowBeforeUpload = true,
  onPhotosComplete, 
  onCancel,
  onProgressSave
}: FlexiblePhotoCaptureProps) {
  const [currentTvIndex, setCurrentTvIndex] = useState(0);
  const [currentPhotoType, setCurrentPhotoType] = useState<'before' | 'after'>(
    workflowStage === 'after' ? 'after' : 'before'
  );
  const [photos, setPhotos] = useState<Map<string, CapturedPhoto>>(new Map());
  const [showCamera, setShowCamera] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load existing progress from API
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['/api/installer/photo-progress', bookingId],
    queryFn: () => apiRequest('GET', `/api/installer/photo-progress/${bookingId}`)
  });

  // Save photo progress to API
  const saveProgressMutation = useMutation({
    mutationFn: async ({ tvIndex, beforePhoto, afterPhoto, beforeSource, afterSource }: {
      tvIndex: number;
      beforePhoto?: string;
      afterPhoto?: string;
      beforeSource?: string;
      afterSource?: string;
    }) => {
      return apiRequest('POST', '/api/installer/photo-progress', {
        bookingId,
        tvIndex,
        beforePhotoUrl: beforePhoto,
        afterPhotoUrl: afterPhoto,
        beforePhotoSource: beforeSource,
        afterPhotoSource: afterSource,
        isCompleted: false
      });
    },
    onSuccess: (data, variables) => {
      onProgressSave?.(variables.tvIndex, data.progress);
      queryClient.invalidateQueries({ queryKey: ['/api/installer/photo-progress', bookingId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save progress",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Initialize photos from progress data
  useEffect(() => {
    if (progressData?.progress) {
      const initialPhotos = new Map();
      
      progressData.progress.forEach((progress: PhotoProgress) => {
        if (progress.beforePhotoUrl) {
          initialPhotos.set(`${progress.tvIndex}-before`, {
            base64: progress.beforePhotoUrl,
            timestamp: new Date(),
            source: progress.beforePhotoSource as 'camera' | 'upload'
          });
        }
        if (progress.afterPhotoUrl) {
          initialPhotos.set(`${progress.tvIndex}-after`, {
            base64: progress.afterPhotoUrl,
            timestamp: new Date(),
            source: progress.afterPhotoSource as 'camera' | 'upload'
          });
        }
      });
      
      setPhotos(initialPhotos);
    }
  }, [progressData]);

  const getPhotoKey = (tvIndex: number, type: 'before' | 'after') => `${tvIndex}-${type}`;

  const startCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser");
      }

      // Request camera permission with fallback constraints
      let stream;
      try {
        // Try with preferred back camera
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          } 
        });
      } catch (e) {
        // Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          } 
        });
      }
      
      streamRef.current = stream;
      setShowCamera(true);
      
      // Wait for video element to be available
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          
          // Handle video loading
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded");
            videoRef.current?.play().catch(err => {
              console.error("Video play failed:", err);
            });
          };
          
          videoRef.current.oncanplay = () => {
            console.log("Video can play");
          };
          
          videoRef.current.onerror = (err) => {
            console.error("Video error:", err);
          };
        }
      }, 100);
      
    } catch (error: any) {
      console.error("Camera error:", error);
      let description = "Please allow camera access to take a photo";
      
      if (error.name === 'NotAllowedError') {
        description = "Camera access was denied. Please allow camera access and try again.";
      } else if (error.name === 'NotFoundError') {
        description = "No camera found on this device.";
      } else if (error.name === 'NotSupportedError') {
        description = "Camera is not supported in this browser.";
      } else if (error.name === 'OverconstrainedError') {
        description = "Camera constraints not supported. Trying basic camera...";
        // Retry with basic constraints
        setTimeout(() => startCameraBasic(), 1000);
        return;
      }
      
      toast({
        title: "Camera initialization failed",
        description,
        variant: "destructive"
      });
    }
  };

  const startCameraBasic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setShowCamera(true);
      
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
          };
        }
      }, 100);
    } catch (error: any) {
      console.error("Basic camera error:", error);
      toast({
        title: "Camera unavailable",
        description: "Unable to access camera. Please use file upload instead.",
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
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    const photoKey = getPhotoKey(currentTvIndex, currentPhotoType);
    
    const newPhoto: CapturedPhoto = {
      base64,
      timestamp: new Date(),
      source: 'camera'
    };
    
    setPhotos(prev => new Map(prev).set(photoKey, newPhoto));
    stopCamera();
    
    // Save progress immediately
    const progressData: any = {
      tvIndex: currentTvIndex,
    };
    
    if (currentPhotoType === 'before') {
      progressData.beforePhoto = base64;
      progressData.beforeSource = 'camera';
    } else {
      progressData.afterPhoto = base64;
      progressData.afterSource = 'camera';
    }
    
    saveProgressMutation.mutate(progressData);
    
    // Move to next photo or TV
    if (workflowStage === 'both') {
      if (currentPhotoType === 'before') {
        setCurrentPhotoType('after');
      } else {
        if (currentTvIndex < tvCount - 1) {
          setCurrentTvIndex(currentTvIndex + 1);
          setCurrentPhotoType('before');
        }
      }
    } else if (currentTvIndex < tvCount - 1) {
      setCurrentTvIndex(currentTvIndex + 1);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if upload is allowed for current photo type
    if (currentPhotoType === 'after' || !allowBeforeUpload) {
      toast({
        title: "Upload not allowed",
        description: "After photos must be taken with camera for authenticity",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const photoKey = getPhotoKey(currentTvIndex, currentPhotoType);
      
      const newPhoto: CapturedPhoto = {
        base64,
        timestamp: new Date(),
        source: 'upload'
      };
      
      setPhotos(prev => new Map(prev).set(photoKey, newPhoto));
      
      // Save progress immediately
      saveProgressMutation.mutate({
        tvIndex: currentTvIndex,
        beforePhoto: base64,
        beforeSource: 'upload'
      });
      
      // Move to next photo
      if (workflowStage === 'both' && currentPhotoType === 'before') {
        setCurrentPhotoType('after');
      } else if (currentTvIndex < tvCount - 1) {
        setCurrentTvIndex(currentTvIndex + 1);
        if (workflowStage === 'both') {
          setCurrentPhotoType('before');
        }
      }
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const deletePhoto = (tvIndex: number, type: 'before' | 'after') => {
    const photoKey = getPhotoKey(tvIndex, type);
    setPhotos(prev => {
      const newPhotos = new Map(prev);
      newPhotos.delete(photoKey);
      return newPhotos;
    });
    
    // Update progress to remove the photo
    const progressData: any = {
      tvIndex,
    };
    
    if (type === 'before') {
      progressData.beforePhoto = null;
      progressData.beforeSource = 'camera';
    } else {
      progressData.afterPhoto = null;
      progressData.afterSource = 'camera';
    }
    
    saveProgressMutation.mutate(progressData);
  };

  const isPhotoRequired = (tvIndex: number, type: 'before' | 'after') => {
    if (workflowStage === 'before' && type === 'after') return false;
    if (workflowStage === 'after' && type === 'before') return false;
    return true;
  };

  const getPhotoCount = () => {
    let beforeCount = 0;
    let afterCount = 0;
    
    for (let i = 0; i < tvCount; i++) {
      if (photos.has(getPhotoKey(i, 'before'))) beforeCount++;
      if (photos.has(getPhotoKey(i, 'after'))) afterCount++;
    }
    
    return { beforeCount, afterCount };
  };

  const isReadyToComplete = () => {
    const { beforeCount, afterCount } = getPhotoCount();
    
    if (workflowStage === 'before') {
      return beforeCount === tvCount;
    } else if (workflowStage === 'after') {
      return afterCount === tvCount;
    } else {
      return beforeCount === tvCount && afterCount === tvCount;
    }
  };

  const handleComplete = () => {
    if (!isReadyToComplete()) return;
    
    // Convert photos to expected format
    const completedPhotos = [];
    for (let i = 0; i < tvCount; i++) {
      const beforePhoto = photos.get(getPhotoKey(i, 'before'));
      const afterPhoto = photos.get(getPhotoKey(i, 'after'));
      
      completedPhotos.push({
        tvIndex: i,
        beforePhoto: beforePhoto?.base64 || '',
        afterPhoto: afterPhoto?.base64 || ''
      });
    }
    
    onPhotosComplete?.(completedPhotos);
  };

  const getCurrentTvName = () => {
    return tvNames[currentTvIndex] || `TV ${currentTvIndex + 1}`;
  };

  const { beforeCount, afterCount } = getPhotoCount();

  if (progressLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Loading Photo Progress...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Installation Photo Progress</span>
            <div className="flex gap-2">
              {workflowStage !== 'after' && (
                <Badge variant="outline">
                  Before: {beforeCount}/{tvCount}
                </Badge>
              )}
              {workflowStage !== 'before' && (
                <Badge variant="outline">
                  After: {afterCount}/{tvCount}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: tvCount }, (_, i) => {
              const tvName = tvNames[i] || `TV ${i + 1}`;
              const beforePhoto = photos.get(getPhotoKey(i, 'before'));
              const afterPhoto = photos.get(getPhotoKey(i, 'after'));
              
              return (
                <Card key={i} className={`${i === currentTvIndex ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{tvName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {workflowStage !== 'after' && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Before</span>
                        {beforePhoto ? (
                          <div className="flex items-center gap-1">
                            <Check className="h-4 w-4 text-green-500" />
                            <Badge variant="secondary" className="text-xs">
                              {beforePhoto.source}
                            </Badge>
                          </div>
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    )}
                    {workflowStage !== 'before' && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">After</span>
                        {afterPhoto ? (
                          <div className="flex items-center gap-1">
                            <Check className="h-4 w-4 text-green-500" />
                            <Badge variant="secondary" className="text-xs">camera</Badge>
                          </div>
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Photo Capture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {getCurrentTvName()} - {currentPhotoType === 'before' ? 'Before' : 'After'} Photo
            </span>
            <div className="flex gap-2">
              {currentTvIndex > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentTvIndex(currentTvIndex - 1)}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
              {currentTvIndex < tvCount - 1 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentTvIndex(currentTvIndex + 1)}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showCamera ? (
            <div className="space-y-4">
              {/* Current photo preview */}
              {photos.has(getPhotoKey(currentTvIndex, currentPhotoType)) && (
                <div className="relative">
                  <img 
                    src={photos.get(getPhotoKey(currentTvIndex, currentPhotoType))?.base64}
                    alt={`${currentPhotoType} photo`}
                    className="w-full max-w-md mx-auto rounded-lg shadow-md"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => deletePhoto(currentTvIndex, currentPhotoType)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Capture options */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={startCamera} className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Take Photo
                </Button>
                
                {/* Upload only for before photos when allowed */}
                {currentPhotoType === 'before' && allowBeforeUpload && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <FileImage className="h-4 w-4" />
                      Upload Photo
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </>
                )}
              </div>
              
              {currentPhotoType === 'after' && (
                <div className="flex items-center gap-2 text-sm text-amber-600 justify-center">
                  <AlertCircle className="h-4 w-4" />
                  After photos must be taken with camera for authenticity
                </div>
              )}
            </div>
          ) : (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">
                      Camera - {getCurrentTvName()} {currentPhotoType === 'before' ? 'Before' : 'After'} Photo
                    </h3>
                  </div>
                  
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Camera overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-4 border-2 border-white border-opacity-50 rounded-lg"></div>
                      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        {currentPhotoType === 'before' ? 'Before Installation' : 'After Installation'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <Button onClick={capturePhoto} size="lg" className="flex-1">
                      <Camera className="h-5 w-5 mr-2" />
                      Capture Photo
                    </Button>
                    <Button variant="outline" onClick={stopCamera} size="lg">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                  
                  {currentPhotoType === 'after' && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 justify-center">
                      <AlertCircle className="h-4 w-4" />
                      After photos must be taken with camera for authenticity
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        
        <Button 
          onClick={handleComplete}
          disabled={!isReadyToComplete() || isUploading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Completing...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Complete Photos
            </>
          )}
        </Button>
      </div>
    </div>
  );
}