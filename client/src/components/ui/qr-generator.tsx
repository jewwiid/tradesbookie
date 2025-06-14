import { useEffect, useRef } from 'react';
import { generateQRCodeDataURL } from '@/lib/qr-utils';

interface QRGeneratorProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRGenerator({ value, size = 200, className = "" }: QRGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    // Create a simple QR-like pattern
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#FFFFFF';
    const cellSize = size / 25;

    // Generate pattern based on the value
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        const hash = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const shouldFill = (i * 25 + j + hash) % 3 === 0;
        if (shouldFill) {
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }
    }

    // Add positioning squares (corners)
    ctx.fillStyle = '#000000';
    const squareSize = cellSize * 3;
    
    // Top-left
    ctx.fillRect(0, 0, squareSize, squareSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cellSize, cellSize, cellSize, cellSize);
    
    // Top-right
    ctx.fillStyle = '#000000';
    ctx.fillRect(size - squareSize, 0, squareSize, squareSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(size - squareSize + cellSize, cellSize, cellSize, cellSize);
    
    // Bottom-left
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, size - squareSize, squareSize, squareSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cellSize, size - squareSize + cellSize, cellSize, cellSize);

  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      className={`border-2 border-gray-200 rounded-lg ${className}`}
    />
  );
}
