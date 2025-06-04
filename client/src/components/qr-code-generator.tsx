import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Download, Share } from 'lucide-react';
import { generateQRCodeDataURL } from '@/lib/qr-utils';
import { useToast } from '@/hooks/use-toast';

interface QRCodeGeneratorProps {
  data: string;
  bookingId: string;
  className?: string;
}

export default function QRCodeGenerator({ data, bookingId, className }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const generateQR = async () => {
      try {
        setIsGenerating(true);
        const qrUrl = await generateQRCodeDataURL(data);
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
        toast({
          title: "Error",
          description: "Failed to generate QR code",
          variant: "destructive",
        });
      } finally {
        setIsGenerating(false);
      }
    };

    if (data) {
      generateQR();
    }
  }, [data, toast]);

  const handleDownload = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `booking-${bookingId}-qr.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Downloaded",
      description: "QR code saved to your device",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TV Installation Booking',
          text: `Access your booking ${bookingId}`,
          url: data,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(data);
        toast({
          title: "Copied",
          description: "Booking link copied to clipboard",
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <QrCode className="w-5 h-5" />
          Your Booking QR Code
        </CardTitle>
        <CardDescription>
          Save this QR code to quickly access your booking details
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        {isGenerating ? (
          <div className="flex items-center justify-center h-48">
            <div className="loading-spinner w-8 h-8"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <img
                src={qrCodeUrl}
                alt="Booking QR Code"
                className="w-48 h-48 border-2 border-gray-200 rounded-lg"
              />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Booking ID: <span className="font-mono font-medium">{bookingId}</span>
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
