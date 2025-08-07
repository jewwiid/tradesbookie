import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CloudUpload, Camera, CheckCircle, X, RotateCcw, Info } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BookingData } from "@/lib/booking-utils";

interface PhotoUploadProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  onNext?: () => void;
}

export default function PhotoUpload({ bookingData, updateBookingData, onNext }: PhotoUploadProps) {
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
        compressedRoomPhoto: data.compressedBase64,
        roomAnalysis: data.analysis,
        compressionInfo: {
          originalSize: data.originalSize,
          compressedSize: data.compressedSize,
          compressionRatio: data.compressionRatio
        }
      });
      
      console.log(`Image compression: ${data.compressionRatio}% smaller (${Math.round(data.originalSize / 1024)}KB → ${Math.round(data.compressedSize / 1024)}KB)`);
      
      toast({
        title: "Photo uploaded successfully!",
        description: "Room analyzed - AI preview will be generated at final booking step."
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

  const compressImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 1920x1080)
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const compressedFile = await compressImage(file);
      console.log('Original size:', file.size, 'Compressed size:', compressedFile.size);
      uploadMutation.mutate(compressedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, JPEG)",
        variant: "destructive"
      });
    }
  }, [uploadMutation, toast, compressImage]);

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
        description = "Camera constraints not supported. Trying again...";
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

  const switchCamera = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.error("Video play failed:", err);
          });
        };
      }
    } catch (error) {
      console.error("Camera switch failed:", error);
      toast({
        title: "Camera switch failed",
        description: "Unable to switch camera. Using current camera.",
        variant: "destructive"
      });
    }
  };

  const capturePhoto = () => {
    console.log('Capture button clicked');
    
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
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
    
    console.log('Video ready state:', video.readyState);
    console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
    
    if (!context) {
      console.error('Canvas context not available');
      toast({
        title: "Capture failed",
        description: "Unable to initialize canvas. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video not ready - dimensions are 0');
      toast({
        title: "Camera not ready",
        description: "Please wait for camera to fully load.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Set reasonable capture dimensions
      const maxWidth = 1920;
      const maxHeight = 1080;
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      console.log('Original video dimensions:', width, 'x', height);
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      console.log('Capture dimensions:', width, 'x', height);
      
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
      
      console.log('Image drawn to canvas');
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
          console.log('Camera photo captured successfully, size:', file.size);
          handleFile(file);
          stopCamera();
        } else {
          console.error('Failed to create blob from canvas');
          toast({
            title: "Capture failed",
            description: "Unable to process photo. Please try again.",
            variant: "destructive"
          });
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
                <p className="text-sm text-muted-foreground">PNG, JPG up to 2MB</p>
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
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          
          {/* Full screen camera preview */}
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              webkit-playsinline="true"
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Loading indicator */}
            {showCamera && videoRef.current && videoRef.current.readyState < 3 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-lg">Initializing camera...</p>
                </div>
              </div>
            )}
            
            {/* Camera controls overlay - positioned higher for better mobile accessibility */}
            <div className="absolute bottom-20 left-0 right-0 px-4">
              {/* Instructions */}
              <div className="text-center mb-6">
                <p className="text-white text-sm bg-black/60 rounded-full px-4 py-2 inline-block">
                  Position camera to show your TV wall
                </p>
              </div>
              
              {/* Control buttons */}
              <div className="flex justify-center items-center gap-4">
                {/* Cancel button */}
                <button
                  onClick={stopCamera}
                  className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 text-white hover:bg-white/30 transition-all duration-200 flex items-center justify-center"
                  type="button"
                >
                  <X className="w-6 h-6" />
                </button>
                
                {/* Capture button - larger and more prominent */}
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full bg-white text-black hover:bg-gray-200 transition-all duration-200 flex items-center justify-center shadow-lg active:scale-95"
                  type="button"
                >
                  <Camera className="w-8 h-8" />
                </button>
                
                {/* Switch camera button */}
                <button
                  onClick={switchCamera}
                  className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 text-white hover:bg-white/30 transition-all duration-200 flex items-center justify-center"
                  type="button"
                >
                  <RotateCcw className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
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
                <div className="mt-4 space-y-4">
                  {/* Installation Difficulty Assessment */}
                  {bookingData.roomAnalysis.difficultyAssessment && (
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Installation Difficulty Assessment
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3">
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-gray-600 block">COMPLEXITY</span>
                          <div className={`inline-flex px-3 py-1.5 rounded-full text-xs font-medium ${
                            bookingData.roomAnalysis.difficultyAssessment.level === 'easy' ? 'bg-green-100 text-green-700' :
                            bookingData.roomAnalysis.difficultyAssessment.level === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                            bookingData.roomAnalysis.difficultyAssessment.level === 'difficult' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {bookingData.roomAnalysis.difficultyAssessment.level.toUpperCase()}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-gray-600 block">ESTIMATED TIME</span>
                          <p className="text-sm font-medium text-foreground">{bookingData.roomAnalysis.difficultyAssessment.estimatedTime}</p>
                        </div>
                      </div>

                      {bookingData.roomAnalysis.difficultyAssessment.factors?.length > 0 && (
                        <div className="mb-3">
                          <h6 className="text-xs font-medium text-gray-600 mb-2">KEY FACTORS</h6>
                          <div className="flex flex-wrap gap-2">
                            {bookingData.roomAnalysis.difficultyAssessment.factors.map((factor, idx) => (
                              <span key={idx} className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-gray-700 border shadow-sm">
                                {factor}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {bookingData.roomAnalysis.difficultyAssessment.priceImpact !== 'none' && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-white rounded-lg border shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              bookingData.roomAnalysis.difficultyAssessment.priceImpact === 'low' ? 'bg-yellow-400' :
                              bookingData.roomAnalysis.difficultyAssessment.priceImpact === 'medium' ? 'bg-orange-400' :
                              'bg-red-400'
                            }`}></div>
                            <span className="text-xs font-medium text-gray-600">PRICE IMPACT:</span>
                          </div>
                          <span className="text-sm font-bold text-gray-800">
                            {bookingData.roomAnalysis.difficultyAssessment.priceImpact === 'low' ? '+10-20%' :
                             bookingData.roomAnalysis.difficultyAssessment.priceImpact === 'medium' ? '+20-40%' :
                             '+40%+'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Room Analysis */}
                  <div className="p-4 sm:p-6 bg-muted rounded-lg text-left">
                    <h4 className="font-semibold text-foreground mb-3">AI Room Analysis</h4>
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
                </div>
              )}
              
              {/* Photo Storage Consent Section */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="photo-storage-consent"
                    checked={bookingData.photoStorageConsent || false}
                    onCheckedChange={(checked) => 
                      updateBookingData({ photoStorageConsent: checked as boolean })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor="photo-storage-consent" 
                      className="text-sm font-medium cursor-pointer flex items-start"
                    >
                      <Info className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-gray-900 mb-1">
                          Share room photo with installer for better preparation
                        </div>
                        <div className="text-gray-600 text-xs">
                          Allow your installer to see the room photo and AI analysis to better prepare for your installation. This helps ensure they bring the right tools and equipment.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                
                {!bookingData.photoStorageConsent && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    <strong>Note:</strong> If photo sharing is declined, only the room analysis text will be visible to your installer to help assess the installation complexity.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={() => {
            updateBookingData({ roomPhotoBase64: undefined, roomAnalysis: undefined, photoStorageConsent: false });
            onNext?.();
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          Skip this step
        </Button>
      </div>
    </div>
  );
}
