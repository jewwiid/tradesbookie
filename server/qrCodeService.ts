import QRCode from "qrcode";
import { storage } from "./storage";
import { nanoid } from "nanoid";

export class QRCodeService {
  static readonly BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://tradesbook.ie'
    : `https://${process.env.REPLIT_DEV_DOMAIN}`;

  /**
   * Generate a unique QR code for a product category
   */
  static async generateCategoryQRCode(categoryId: number, categorySlug: string): Promise<{ qrCodeId: string; qrCodeUrl: string; qrCodeData: string }> {
    // Generate unique QR code identifier
    const qrCodeId = nanoid(12);
    
    // Create the URL that the QR code will point to
    const targetUrl = `${this.BASE_URL}/find-product/${categorySlug}?qr=${qrCodeId}`;
    
    // Generate QR code image as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(targetUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });

    return {
      qrCodeId,
      qrCodeUrl: qrCodeDataUrl,
      qrCodeData: targetUrl
    };
  }

  /**
   * Generate a printable flyer for a product category
   */
  static generateFlyerSVG(category: {
    name: string;
    description: string;
    iconEmoji: string;
    backgroundColor: string;
    textColor: string;
    qrCodeUrl: string;
  }): string {
    // Generate SVG for printable flyer
    return `
<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="400" height="600" fill="${category.backgroundColor}" rx="10"/>
  
  <!-- Header -->
  <text x="200" y="60" text-anchor="middle" fill="${category.textColor}" 
        font-family="Arial, sans-serif" font-size="28" font-weight="bold">
    ${category.iconEmoji} ${category.name}
  </text>
  
  <!-- Description -->
  <foreignObject x="30" y="90" width="340" height="120">
    <div xmlns="http://www.w3.org/1999/xhtml" 
         style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.4; 
                color: ${category.textColor}; text-align: center; padding: 10px;">
      ${category.description}
    </div>
  </foreignObject>
  
  <!-- QR Code Container -->
  <rect x="75" y="230" width="250" height="250" fill="white" rx="15" stroke="${category.textColor}" stroke-width="2"/>
  
  <!-- QR Code (embedded as data URL) -->
  <image x="85" y="240" width="230" height="230" href="${category.qrCodeUrl}"/>
  
  <!-- Instructions -->
  <text x="200" y="520" text-anchor="middle" fill="${category.textColor}" 
        font-family="Arial, sans-serif" font-size="18" font-weight="bold">
    Scan for AI TV Recommendations
  </text>
  
  <!-- Subtitle -->
  <text x="200" y="545" text-anchor="middle" fill="${category.textColor}" 
        font-family="Arial, sans-serif" font-size="14">
    Get personalized TV suggestions from Harvey Norman
  </text>
  
  <!-- Footer -->
  <text x="200" y="575" text-anchor="middle" fill="${category.textColor}" 
        font-family="Arial, sans-serif" font-size="12" font-weight="bold">
    tradesbook.ie
  </text>
</svg>`.trim();
  }

  /**
   * Track QR code scan with analytics
   */
  static async trackQRCodeScan(
    qrCodeId: string, 
    sessionId: string,
    userAgent?: string,
    ipAddress?: string,
    userId?: number
  ): Promise<{ success: boolean; categoryId?: number; error?: string }> {
    try {
      // Find the category by QR code ID
      const category = await storage.getProductCategoryByQrCodeId(qrCodeId);
      
      if (!category) {
        return { success: false, error: 'QR code not found' };
      }

      // Detect device type from user agent
      const deviceType = this.detectDeviceType(userAgent);

      // Create scan record
      await storage.createQrCodeScan({
        categoryId: category.id,
        sessionId,
        userId: userId || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        deviceType,
        scanLocation: null,
        referrerUrl: null,
      });

      // Increment category scan count
      await storage.incrementCategoryScanCount(category.id);

      return { success: true, categoryId: category.id };
    } catch (error) {
      console.error('Error tracking QR code scan:', error);
      return { success: false, error: 'Failed to track scan' };
    }
  }

  /**
   * Detect device type from user agent
   */
  private static detectDeviceType(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * Create a bulk flyer PDF with multiple categories
   */
  static generateBulkFlyerSVG(categories: Array<{
    name: string;
    description: string;
    iconEmoji: string;
    backgroundColor: string;
    textColor: string;
    qrCodeUrl: string;
  }>): string {
    const itemsPerRow = 2;
    const rows = Math.ceil(categories.length / itemsPerRow);
    const itemWidth = 400;
    const itemHeight = 600;
    const totalWidth = itemsPerRow * itemWidth;
    const totalHeight = rows * itemHeight;

    let svgContent = `<svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">`;

    categories.forEach((category, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const x = col * itemWidth;
      const y = row * itemHeight;

      svgContent += `
      <g transform="translate(${x}, ${y})">
        ${this.generateFlyerSVG(category)}
      </g>`;
    });

    svgContent += '</svg>';
    
    return svgContent;
  }
}