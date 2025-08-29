import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

interface QRCodeGeneratorProps {
  text: string;
  size?: number;
  className?: string;
}

interface QRCodeResponse {
  qrCode: string;
}

export default function QRCodeGenerator({ text, size = 200, className = "" }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: qrData } = useQuery({
    queryKey: [`/api/qr-code/${encodeURIComponent(text)}`],
    enabled: !!text
  });

  // Type the QR data response
  const typedQrData = qrData as QRCodeResponse | undefined;

  useEffect(() => {
    if (typedQrData?.qrCode && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          canvas.width = size;
          canvas.height = size;
          ctx.drawImage(img, 0, 0, size, size);
        };
        img.src = typedQrData.qrCode;
      }
    }
  }, [typedQrData, size]);

  return (
    <canvas
      ref={canvasRef}
      className={`border-2 border-border rounded-lg ${className}`}
      width={size}
      height={size}
    />
  );
}
