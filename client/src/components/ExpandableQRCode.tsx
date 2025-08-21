import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import QRCode from "@/components/QRCode";
import { QrCode, ChevronDown, ChevronUp, Download } from "lucide-react";

interface ExpandableQRCodeProps {
  qrCode: string;
  bookingId?: string | number;
  size?: number;
  className?: string;
  showInline?: boolean;
  title?: string;
  description?: string;
}

export default function ExpandableQRCode({ 
  qrCode, 
  bookingId, 
  size = 200, 
  className = "",
  showInline = false,
  title = "Booking QR Code",
  description = "Scan this QR code to track installation progress"
}: ExpandableQRCodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const qrCodeUrl = `${window.location.origin}/qr-tracking/${qrCode}`;

  const downloadQRCode = () => {
    // Create a temporary canvas to generate QR code for download
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    import('qrcode').then((QRCodeLib) => {
      QRCodeLib.default.toCanvas(canvas, qrCodeUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(() => {
        // Create download link
        const link = document.createElement('a');
        link.download = `booking-qr-${qrCode}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }).catch((error) => {
        console.error('Error generating QR code for download:', error);
      });
    });
  };

  if (showInline) {
    return (
      <div className={`${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 p-0 h-auto text-primary hover:text-primary/80"
        >
          <QrCode className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isExpanded ? 'Hide QR Code' : 'Show QR Code'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
        
        {isExpanded && (
          <div className="mt-3 bg-gray-50 p-4 border rounded-lg text-center space-y-3">
            <Dialog>
              <DialogTrigger asChild>
                <div className="cursor-pointer hover:opacity-80 transition-opacity">
                  <QRCode value={qrCodeUrl} size={size} />
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{title}</DialogTitle>
                  <DialogDescription>
                    {description}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center space-y-4">
                  <QRCode value={qrCodeUrl} size={300} />
                  <div className="text-center space-y-2">
                    {bookingId && (
                      <p className="text-sm text-gray-500 font-mono">
                        Booking: {bookingId}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Scan to track installation progress
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={downloadQRCode}
                    className="space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download QR Code</span>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{description}</p>
              <p className="text-xs text-blue-600">Click on QR code above for larger view</p>
              {bookingId && (
                <p className="text-xs text-gray-500 font-mono">
                  Booking: {bookingId}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQRCode}
                className="space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download QR</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Modal version for larger displays
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={`space-x-2 ${className}`}>
          <QrCode className="w-4 h-4" />
          <span>View QR Code</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <QRCode value={qrCodeUrl} size={250} />
          <div className="text-center space-y-2">
            {bookingId && (
              <p className="text-sm text-gray-500 font-mono">
                Booking: {bookingId}
              </p>
            )}
            <p className="text-xs text-gray-400">
              Scan to track installation progress
            </p>
          </div>
          <Button
            variant="outline"
            onClick={downloadQRCode}
            className="space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download QR Code</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}