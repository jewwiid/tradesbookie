import { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  CameraOff, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (result: string) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
  clearResult?: boolean; // Add prop to clear scanner state
}

export default function QRScanner({ onScanSuccess, onError, isLoading, clearResult }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<string>('');
  const [scanError, setScanError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    // Check camera permissions on mount
    checkCameraPermission();

    return () => {
      // Cleanup scanner when component unmounts
      if (scannerRef.current) {
        scannerRef.current.destroy();
      }
    };
  }, []);

  // Clear scanner state when clearResult prop changes
  useEffect(() => {
    if (clearResult) {
      setScanResult('');
      setScanError('');
      setIsScanning(false);
      if (scannerRef.current) {
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    }
  }, [clearResult]);

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      // Stop the stream immediately after checking permission
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setHasPermission(false);
      setScanError('Camera access denied. Please enable camera permissions to scan QR codes.');
    }
  };

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setIsScanning(true);
      setScanError('');
      setScanResult('');

      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          let scannedData = result.data;
          
          // Extract QR code from URL if it's a full URL
          if (scannedData.includes('/qr-tracking/')) {
            const parts = scannedData.split('/qr-tracking/');
            scannedData = parts[1] || result.data;
          }
          
          setScanResult(result.data); // Show full URL in UI
          onScanSuccess(scannedData); // Send just the QR code to verification
          stopScanning();
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera if available
        }
      );

      await scannerRef.current.start();
    } catch (error) {
      setIsScanning(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start camera';
      setScanError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  if (hasPermission === false) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Camera access is required to scan QR codes. Please enable camera permissions in your browser settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Camera className="w-5 h-5" />
          <span>QR Code Scanner</span>
        </CardTitle>
        <CardDescription>
          Scan the customer's QR code to verify location and unlock the job
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Camera Preview */}
          <div className="relative w-full aspect-square max-w-sm mx-auto bg-gray-100 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              style={{ display: isScanning ? 'block' : 'none' }}
              playsInline
              muted
            />
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Camera preview will appear here</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-2">
            {!isScanning ? (
              <Button 
                onClick={startScanning} 
                disabled={hasPermission !== true || isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                Start Scanning
              </Button>
            ) : (
              <Button 
                onClick={stopScanning} 
                variant="outline"
                className="w-full sm:w-auto"
              >
                <CameraOff className="w-4 h-4 mr-2" />
                Stop Scanning
              </Button>
            )}
          </div>

          {/* Success Message */}
          {scanResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                QR Code detected: {scanResult}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {scanError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {scanError}
              </AlertDescription>
            </Alert>
          )}

          {/* Scanning Status */}
          {isScanning && (
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">Scanning for QR codes...</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Point your camera at the customer's QR code
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}