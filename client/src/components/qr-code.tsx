import { useEffect, useRef } from "react";

interface QRCodeProps {
  value: string;
  size?: number;
}

export default function QRCodeComponent({ value, size = 200 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && window.QRious) {
      new window.QRious({
        element: canvasRef.current,
        value: value,
        size: size,
        level: 'M'
      });
    }
  }, [value, size]);

  return (
    <div className="flex justify-center">
      <canvas
        ref={canvasRef}
        className="border-2 border-gray-200 rounded-lg"
      />
    </div>
  );
}

// Add QRious type declaration
declare global {
  interface Window {
    QRious: any;
  }
}
