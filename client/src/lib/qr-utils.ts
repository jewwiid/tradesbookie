export const generateQRCodeDataURL = (data: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a simple QR code data URL using a placeholder approach
      // In a real implementation, you would use a proper QR code library
      const size = 200;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      // Simple QR code placeholder - fill with a pattern
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, size, size);
      
      // Add white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(10, 10, size - 20, size - 20);
      
      // Add some QR-like pattern
      ctx.fillStyle = '#000000';
      for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 20; j++) {
          if ((i + j) % 2 === 0 || (i * j) % 3 === 0) {
            ctx.fillRect(i * 9 + 15, j * 9 + 15, 8, 8);
          }
        }
      }
      
      // Add corner markers
      const cornerSize = 30;
      const positions = [
        [15, 15],
        [size - cornerSize - 15, 15],
        [15, size - cornerSize - 15]
      ];
      
      positions.forEach(([x, y]) => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, cornerSize, cornerSize);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 5, y + 5, cornerSize - 10, cornerSize - 10);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 10, y + 10, cornerSize - 20, cornerSize - 20);
      });
      
      // Add center text (booking ID)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(size/2 - 40, size/2 - 15, 80, 30);
      ctx.fillStyle = '#000000';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(data.slice(-8), size/2, size/2 + 5);
      
      resolve(canvas.toDataURL());
    } catch (error) {
      reject(error);
    }
  });
};

export const extractTokenFromURL = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
};

export const generateAccessURL = (token: string): string => {
  const baseURL = window.location.origin;
  return `${baseURL}/customer-access?token=${token}`;
};
