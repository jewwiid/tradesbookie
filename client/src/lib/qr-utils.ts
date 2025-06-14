export function generateQRCodeDataURL(text: string, size: number = 200): string {
  // Simple QR code generation for demo purposes
  // In a real app, you'd use a proper QR library like qrcode.js
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  canvas.width = size;
  canvas.height = size;
  
  // Create a simple QR-like pattern for demo
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  
  ctx.fillStyle = '#FFFFFF';
  const cellSize = size / 25;
  
  // Create a pattern that looks QR-like
  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 25; j++) {
      const shouldFill = (i + j + text.charCodeAt(0)) % 3 === 0;
      if (shouldFill) {
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }
  }
  
  return canvas.toDataURL();
}

export function createBookingQRCode(bookingId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/customer-dashboard?booking=${bookingId}`;
}
