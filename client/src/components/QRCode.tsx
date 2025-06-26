import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCodeComponent({ value, size = 200, className = "" }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).catch((error) => {
        console.error('Error generating QR code:', error);
        // Fallback: show the text value
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = size;
            canvas.height = size;
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = '#333';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('QR Code', size / 2, size / 2 - 10);
            ctx.fillText(value.slice(0, 20), size / 2, size / 2 + 10);
          }
        }
      });
    }
  }, [value, size]);

  if (!value) {
    return (
      <div 
        className={`bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-gray-500 text-sm">No QR Data</span>
      </div>
    );
  }

  return (
    <canvas 
      ref={canvasRef}
      className={`border-2 border-gray-200 rounded-lg ${className}`}
    />
  );
}