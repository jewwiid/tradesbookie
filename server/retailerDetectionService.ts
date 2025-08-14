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
    },
    'RT': {
      code: 'RT',
      name: 'RTV',
      fullName: 'Radio TV World',
      color: '#ff4444',
      invoiceFormats: ['RT-{STORE}-{NUMBER}', 'RT{STORE}{NUMBER}', 'RTV-{NUMBER}'],
      referralCodePrefix: 'RT',
      storeLocations: {
        'DUB': 'Dublin',
        'COR': 'Cork',
        'GAL': 'Galway',
        'LIM': 'Limerick',
        'WAT': 'Waterford',
        'ATH': 'Athlone',
        'DRO': 'Drogheda',
        'KIL': 'Kilkenny',
        'BLA': 'Blanchardstown'
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
    requiresVerification?: boolean;
    showStoreSignup?: boolean;
    unknownInvoice?: string;
  }> {
    try {
      // Detect retailer from invoice
      const parsedInvoice = this.detectRetailerFromInvoice(invoiceNumber);
      if (!parsedInvoice) {
        return {
          success: false,
          message: "Invalid invoice format. This store is not currently supported. If you represent a store that would like to join our platform, please apply to become a partner store.",
          showStoreSignup: true,
          unknownInvoice: invoiceNumber
        };
      }

      // Look up invoice in database
      let invoiceData = await db.select()
        .from(retailerInvoices)
        .where(eq(retailerInvoices.invoiceNumber, invoiceNumber))
        .limit(1);

      let invoice;
      let isNewInvoice = false;

      if (invoiceData.length === 0) {
        // SECURITY: Invoice doesn't exist in our verified database
        // This could be either:
        // 1. A legitimate new customer with a real invoice (needs manual verification)
        // 2. Someone trying to create a fake invoice (security risk)
        
        console.log(`⚠️ Unknown invoice attempted: ${invoiceNumber} - requiring verification`);
        
        return {
          success: false,
          message: `This ${parsedInvoice.retailerInfo.name} invoice (${invoiceNumber}) is not in our system. For security, new invoices must be verified. Please contact support at support@tradesbook.ie with your invoice details, or use an invoice from a previous verified purchase.`,
          requiresVerification: true,
          invoiceNumber: invoiceNumber,
          retailerInfo: parsedInvoice.retailerInfo,
          showStoreSignup: true
        }
      } else {
        invoice = invoiceData[0];
      }

      // Check if user already exists with this email (skip for new placeholder invoices)
      let existingUser = [];
      if (!isNewInvoice) {
        existingUser = await db.select()
          .from(users)
          .where(eq(users.email, invoice.customerEmail))
          .limit(1);
      }

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
        let customerEmail, firstName, lastName;
        
        if (isNewInvoice) {
          // For new invoices, we need to collect customer info
          // Use a temporary email that will be updated during profile completion
          customerEmail = `new.customer.${invoiceNumber.toLowerCase().replace('-', '.')}@temp.registration`;
          firstName = 'New';
          lastName = 'Customer';
        } else {
          // Use existing invoice data
          const nameParts = invoice.customerName.split(' ');
          customerEmail = invoice.customerEmail;
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }

        const newUserData = {
          email: customerEmail,
          firstName,
          lastName,
          phone: invoice.customerPhone || null,
          role: 'customer',
          registrationMethod: 'invoice',
          retailerInvoiceNumber: invoiceNumber,
          invoiceVerified: !isNewInvoice, // New invoices need completion
          emailVerified: false, // Always require email verification
          profileCompleted: !isNewInvoice // New invoices need profile completion
        };

        const [createdUser] = await db.insert(users)
          .values([newUserData])
          .returning();
        
        user = createdUser;
        isNewRegistration = true;
        
        // Handle email verification for new users
        if (!isNewInvoice && customerEmail && !customerEmail.includes('@temp.')) {
          // Send verification email for existing invoice users with real emails
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
            await sendVerificationEmail(customerEmail, firstName, verificationToken);
            console.log(`✅ Verification email sent to invoice user: ${customerEmail}`);
          } catch (emailError) {
            console.error('❌ Error sending verification email to invoice user:', emailError);
            // Continue with user creation even if email fails
          }
        }
      }

      // Mark invoice as used for registration
      await db.update(retailerInvoices)
        .set({ isUsedForRegistration: true })
        .where(eq(retailerInvoices.id, invoice.id));

      let welcomeMessage;
      let needsProfileCompletion = false;

      if (isNewRegistration && isNewInvoice) {
        welcomeMessage = `Welcome to tradesbook.ie! We've recognized your ${parsedInvoice.retailerInfo.name} invoice ${invoiceNumber}. Please complete your profile with your contact details to proceed.`;
        needsProfileCompletion = true;
      } else if (isNewRegistration) {
        welcomeMessage = `Welcome to tradesbook.ie! We've created your account using your ${parsedInvoice.retailerInfo.name} purchase. Please verify your email address to complete your registration and allow installers to see your booking requests.`;
      } else {
        welcomeMessage = `Welcome back! You've been authenticated using your ${parsedInvoice.retailerInfo.name} purchase.`;
      }

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
          emailVerified: user.emailVerified,
          profileCompleted: user.profileCompleted || false
        },
        message: welcomeMessage,
        retailerInfo: parsedInvoice.retailerInfo,
        isNewRegistration,
        needsProfileCompletion,
        invoiceNumber: invoiceNumber
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

  /**
   * Add a new retailer/franchise
   */
  addRetailer(retailerData: {
    code: string;
    name: string;
    fullName: string;
    color: string;
    invoiceFormats?: string[];
    referralCodePrefix?: string;
    storeLocations?: Record<string, string>;
  }): boolean {
    const code = retailerData.code.toUpperCase();
    
    // Check if retailer already exists
    if (this.retailers[code]) {
      return false;
    }

    // Create retailer with defaults
    this.retailers[code] = {
      code,
      name: retailerData.name,
      fullName: retailerData.fullName,
      color: retailerData.color,
      invoiceFormats: retailerData.invoiceFormats || [`${code}-{STORE}-{NUMBER}`, `${code}{STORE}{NUMBER}`],
      referralCodePrefix: retailerData.referralCodePrefix || code,
      storeLocations: retailerData.storeLocations || {}
    };

    return true;
  }

  /**
   * Update an existing retailer/franchise
   */
  updateRetailer(code: string, updates: {
    name?: string;
    fullName?: string;
    color?: string;
    invoiceFormats?: string[];
    referralCodePrefix?: string;
  }): boolean {
    const upperCode = code.toUpperCase();
    
    if (!this.retailers[upperCode]) {
      return false;
    }

    // Update only provided fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        this.retailers[upperCode][key] = updates[key];
      }
    });

    return true;
  }

  /**
   * Delete a retailer/franchise and all its store locations
   */
  deleteRetailer(code: string): boolean {
    const upperCode = code.toUpperCase();
    
    if (!this.retailers[upperCode]) {
      return false;
    }

    delete this.retailers[upperCode];
    return true;
  }

  /**
   * Check if retailer code exists
   */
  retailerExists(code: string): boolean {
    return !!this.retailers[code.toUpperCase()];
  }
}

// Create singleton instance
export const retailerDetectionService = new RetailerDetectionService();