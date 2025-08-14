import { eq } from "drizzle-orm";
import { db } from "./db";
import { retailerInvoices, users } from "../shared/schema";

export interface RetailerInfo {
  code: string;
  name: string;
  fullName: string;
  color: string;
  invoiceFormats: string[];
  referralCodePrefix: string;
  storeLocations?: Record<string, string>;
}

export interface ParsedInvoice {
  retailerCode: string;
  storeCode?: string;
  invoiceNumber: string;
  retailerInfo: RetailerInfo;
}

export interface ParsedReferralCode {
  retailerCode: string;
  storeCode?: string;
  staffName?: string;
  retailerInfo: RetailerInfo;
  originalCode: string;
}

export class RetailerDetectionService {
  private retailers: Record<string, RetailerInfo> = {
    'HN': {
      code: 'HN',
      name: 'Harvey Norman',
      fullName: 'Harvey Norman',
      color: '#e63946',
      invoiceFormats: ['HN-{STORE}-{NUMBER}', 'HN{STORE}{NUMBER}'],
      referralCodePrefix: 'HN',
      storeLocations: {
        'BLA': 'Blanchardstown',
        'CKM': 'Carrickmines',
        'CRK': 'Cork',
        'CAS': 'Castlebar',
        'DRO': 'Drogheda',
        'FON': 'Fonthill',
        'GAL': 'Galway',
        'KIN': 'Kinsale Road',
        'LIM': 'Limerick',
        'LIT': 'Little Island',
        'NAA': 'Naas',
        'RAT': 'Rathfarnham',
        'SLI': 'Sligo',
        'SWO': 'Swords',
        'TAL': 'Tallaght',
        'TRA': 'Tralee',
        'WAT': 'Waterford'
      }
    },
    'CR': {
      code: 'CR',
      name: 'Currys',
      fullName: 'Currys PC World',
      color: '#0066cc',
      invoiceFormats: ['CR-{STORE}-{NUMBER}', 'CR{STORE}{NUMBER}', 'CU-{NUMBER}'],
      referralCodePrefix: 'CR',
      storeLocations: {
        'DUB': 'Dublin',
        'CRK': 'Cork',
        'GAL': 'Galway',
        'LIM': 'Limerick',
        'WAT': 'Waterford',
        'BLA': 'Blanchardstown',
        'TAL': 'Tallaght',
        'SWO': 'Swords'
      }
    },
    'DD': {
      code: 'DD',
      name: 'DID Electrical',
      fullName: 'DID Electrical',
      color: '#ff6b35',
      invoiceFormats: ['DD-{STORE}-{NUMBER}', 'DD{STORE}{NUMBER}', 'DID-{NUMBER}'],
      referralCodePrefix: 'DD',
      storeLocations: {
        'DUB': 'Dublin',
        'CRK': 'Cork',
        'GAL': 'Galway',
        'LIM': 'Limerick',
        'WAT': 'Waterford',
        'ATH': 'Athlone',
        'DRO': 'Drogheda',
        'KIL': 'Kilkenny'
      }
    },
    'PC': {
      code: 'PC',
      name: 'Power City',
      fullName: 'Power City',
      color: '#00a651',
      invoiceFormats: ['PC-{STORE}-{NUMBER}', 'PC{STORE}{NUMBER}', 'PWR-{NUMBER}'],
      referralCodePrefix: 'PC',
      storeLocations: {
        'DUB': 'Dublin',
        'CRK': 'Cork',
        'GAL': 'Galway',
        'LIM': 'Limerick',
        'WAT': 'Waterford',
        'BLA': 'Blanchardstown',
        'TAL': 'Tallaght',
        'CAS': 'Castlebar'
      }
    },
    'AR': {
      code: 'AR',
      name: 'Argos',
      fullName: 'Argos Ireland',
      color: '#e60012',
      invoiceFormats: ['AR-{NUMBER}', 'ARG-{NUMBER}', 'AG{NUMBER}'],
      referralCodePrefix: 'AR',
      storeLocations: {
        'DUB': 'Dublin',
        'CRK': 'Cork',
        'GAL': 'Galway',
        'LIM': 'Limerick',
        'WAT': 'Waterford'
      }
    },
    'EX': {
      code: 'EX',
      name: 'Expert',
      fullName: 'Expert Electrical',
      color: '#1e3a8a',
      invoiceFormats: ['EX-{STORE}-{NUMBER}', 'EX{STORE}{NUMBER}', 'EXP-{NUMBER}'],
      referralCodePrefix: 'EX',
      storeLocations: {
        'DUB': 'Dublin',
        'CRK': 'Cork',
        'GAL': 'Galway',
        'LIM': 'Limerick'
      }
    }
  };

  /**
   * Detect retailer from invoice number
   */
  detectRetailerFromInvoice(invoiceNumber: string): ParsedInvoice | null {
    const upperInvoice = invoiceNumber.toUpperCase().trim();

    // Try each retailer's formats
    for (const [code, retailer] of Object.entries(this.retailers)) {
      // Try format with hyphens: XX-STORE-NUMBER
      const regexWithStore = new RegExp(`^${code}-([A-Z]{2,4})-(\\d{4,8})$`);
      const matchWithStore = upperInvoice.match(regexWithStore);
      if (matchWithStore) {
        return {
          retailerCode: code,
          storeCode: matchWithStore[1],
          invoiceNumber: matchWithStore[2],
          retailerInfo: retailer
        };
      }

      // Try format without hyphens: XXSTORENUMBER
      const regexNoHyphens = new RegExp(`^${code}([A-Z]{2,4})(\\d{4,8})$`);
      const matchNoHyphens = upperInvoice.match(regexNoHyphens);
      if (matchNoHyphens) {
        return {
          retailerCode: code,
          storeCode: matchNoHyphens[1],
          invoiceNumber: matchNoHyphens[2],
          retailerInfo: retailer
        };
      }

      // Try simple format: XX-NUMBER
      const regexSimple = new RegExp(`^${code}-(\\d{4,8})$`);
      const matchSimple = upperInvoice.match(regexSimple);
      if (matchSimple) {
        return {
          retailerCode: code,
          invoiceNumber: matchSimple[1],
          retailerInfo: retailer
        };
      }

      // Try alternative simple formats
      if (code === 'DD') {
        const didMatch = upperInvoice.match(/^DID-(\d{4,8})$/);
        if (didMatch) {
          return {
            retailerCode: code,
            invoiceNumber: didMatch[1],
            retailerInfo: retailer
          };
        }
      }

      if (code === 'PC') {
        const pwrMatch = upperInvoice.match(/^PWR-(\d{4,8})$/);
        if (pwrMatch) {
          return {
            retailerCode: code,
            invoiceNumber: pwrMatch[1],
            retailerInfo: retailer
          };
        }
      }

      if (code === 'AR') {
        const argMatch = upperInvoice.match(/^ARG-(\d{4,8})$/);
        if (argMatch) {
          return {
            retailerCode: code,
            invoiceNumber: argMatch[1],
            retailerInfo: retailer
          };
        }
      }
    }

    return null;
  }

  /**
   * Detect retailer from referral code
   */
  detectRetailerFromReferralCode(referralCode: string): ParsedReferralCode | null {
    const upperCode = referralCode.toUpperCase().trim();

    // Try each retailer's prefix
    for (const [code, retailer] of Object.entries(this.retailers)) {
      if (upperCode.startsWith(code)) {
        // Extract store code and staff name from referral code
        // Format: HNCKMDOUG (HN + CKM + DOUG)
        const remaining = upperCode.substring(code.length);
        
        let storeCode: string | undefined;
        let staffName: string | undefined;

        // Try to extract store code
        if (retailer.storeLocations) {
          for (const [store, location] of Object.entries(retailer.storeLocations)) {
            if (remaining.startsWith(store)) {
              storeCode = store;
              staffName = remaining.substring(store.length);
              break;
            }
          }
        }

        // If no store code found, treat the whole remaining as staff name
        if (!storeCode && remaining.length > 0) {
          staffName = remaining;
        }

        return {
          retailerCode: code,
          storeCode,
          staffName,
          retailerInfo: retailer,
          originalCode: referralCode
        };
      }
    }

    return null;
  }

  /**
   * Get full store name
   */
  getStoreName(retailerCode: string, storeCode?: string): string {
    const retailer = this.retailers[retailerCode];
    if (!retailer) return 'Unknown Store';

    if (storeCode && retailer.storeLocations?.[storeCode]) {
      return `${retailer.fullName} ${retailer.storeLocations[storeCode]}`;
    }

    return retailer.fullName;
  }

  /**
   * Generate retailer-specific referral code
   */
  generateReferralCode(retailerCode: string, storeCode: string, staffName: string): string {
    const retailer = this.retailers[retailerCode];
    if (!retailer) return `RT${storeCode}${staffName}`.toUpperCase();

    return `${retailer.referralCodePrefix}${storeCode}${staffName}`.toUpperCase();
  }

  /**
   * Get all supported retailers
   */
  getAllRetailers(): RetailerInfo[] {
    return Object.values(this.retailers);
  }

  /**
   * Get retailer by code
   */
  getRetailer(code: string): RetailerInfo | null {
    return this.retailers[code] || null;
  }

  /**
   * Validate invoice format for any retailer
   */
  isValidInvoiceFormat(invoiceNumber: string): boolean {
    return this.detectRetailerFromInvoice(invoiceNumber) !== null;
  }

  /**
   * Enhanced login with retailer detection
   */
  async loginWithInvoice(invoiceNumber: string): Promise<{
    success: boolean;
    user?: any;
    message: string;
    isNewRegistration?: boolean;
    retailerInfo?: RetailerInfo;
  }> {
    try {
      // Detect retailer from invoice
      const parsedInvoice = this.detectRetailerFromInvoice(invoiceNumber);
      if (!parsedInvoice) {
        return {
          success: false,
          message: "Invalid invoice format. Please check your invoice number and try again."
        };
      }

      // Look up invoice in database
      const invoiceData = await db.select()
        .from(retailerInvoices)
        .where(eq(retailerInvoices.invoiceNumber, invoiceNumber))
        .limit(1);

      if (invoiceData.length === 0) {
        return {
          success: false,
          message: `No purchase record found for this ${parsedInvoice.retailerInfo.name} invoice. Please check the invoice number.`
        };
      }

      const invoice = invoiceData[0];

      // Check if user already exists with this email
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.email, invoice.customerEmail))
        .limit(1);

      let user;
      let isNewRegistration = false;

      if (existingUser.length > 0) {
        // User exists, update registration method if needed
        user = existingUser[0];
        
        if (user.registrationMethod !== 'invoice') {
          await db.update(users)
            .set({ 
              registrationMethod: 'invoice',
              retailerInvoiceNumber: invoiceNumber,
              invoiceVerified: true 
            })
            .where(eq(users.id, user.id));
        }
      } else {
        // Create new user from invoice data with proper integer ID
        const nameParts = invoice.customerName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const newUserData = {
          email: invoice.customerEmail,
          firstName,
          lastName,
          phone: invoice.customerPhone || null,
          role: 'customer',
          registrationMethod: 'invoice',
          retailerInvoiceNumber: invoiceNumber,
          invoiceVerified: true,
          emailVerified: false // Require email verification even for invoice users
        };

        const [createdUser] = await db.insert(users)
          .values([newUserData])
          .returning();
        
        user = createdUser;
        isNewRegistration = true;
        
        // Send verification email for new invoice users
        try {
          const { generateVerificationToken, sendVerificationEmail } = await import('./emailVerificationService');
          const verificationToken = await generateVerificationToken();
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
          
          // Update user with verification token
          await db.update(users)
            .set({
              emailVerificationToken: verificationToken,
              emailVerificationExpires: expiresAt
            })
            .where(eq(users.id, createdUser.id));
            
          // Send verification email
          await sendVerificationEmail(invoice.customerEmail, firstName, verificationToken);
          console.log(`✅ Verification email sent to invoice user: ${invoice.customerEmail}`);
        } catch (emailError) {
          console.error('❌ Error sending verification email to invoice user:', emailError);
          // Continue with user creation even if email fails
        }
      }

      // Mark invoice as used for registration
      await db.update(retailerInvoices)
        .set({ isUsedForRegistration: true })
        .where(eq(retailerInvoices.id, invoice.id));

      const welcomeMessage = isNewRegistration 
        ? `Welcome to tradesbook.ie! We've created your account using your ${parsedInvoice.retailerInfo.name} purchase. Please verify your email address to complete your registration and allow installers to see your booking requests.`
        : `Welcome back! You've been authenticated using your ${parsedInvoice.retailerInfo.name} purchase.`;

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          registrationMethod: user.registrationMethod,
          emailVerified: user.emailVerified
        },
        message: welcomeMessage,
        retailerInfo: parsedInvoice.retailerInfo,
        isNewRegistration
      };

    } catch (error) {
      console.error('Invoice login error:', error);
      return {
        success: false,
        message: "Unable to process invoice login at this time. Please try again later."
      };
    }
  }

  /**
   * Update store locations for a retailer (Admin functionality)
   */
  updateStoreLocations(retailerCode: string, newStoreLocations: Record<string, string>): boolean {
    if (this.retailers[retailerCode]) {
      this.retailers[retailerCode].storeLocations = { 
        ...this.retailers[retailerCode].storeLocations,
        ...newStoreLocations 
      };
      return true;
    }
    return false;
  }

  /**
   * Add new store location to a retailer
   */
  addStoreLocation(retailerCode: string, storeCode: string, storeName: string): boolean {
    if (this.retailers[retailerCode]) {
      this.retailers[retailerCode].storeLocations[storeCode] = storeName;
      return true;
    }
    return false;
  }

  /**
   * Remove store location from a retailer
   */
  removeStoreLocation(retailerCode: string, storeCode: string): boolean {
    if (this.retailers[retailerCode] && this.retailers[retailerCode].storeLocations[storeCode]) {
      delete this.retailers[retailerCode].storeLocations[storeCode];
      return true;
    }
    return false;
  }
}

// Create singleton instance
export const retailerDetectionService = new RetailerDetectionService();