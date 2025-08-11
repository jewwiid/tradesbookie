import { db } from './db';
import { retailerInvoices, users } from '../shared/schema';
import { eq } from 'drizzle-orm';

export interface InvoiceLoginResult {
  success: boolean;
  user?: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
  };
  message: string;
  isNewRegistration?: boolean;
}

export class RetailerInvoiceService {
  /**
   * Login or register user using retailer invoice number
   */
  async loginWithInvoice(invoiceNumber: string): Promise<InvoiceLoginResult> {
    try {
      // Look up invoice in database
      const invoice = await db.select()
        .from(retailerInvoices)
        .where(eq(retailerInvoices.invoiceNumber, invoiceNumber))
        .limit(1);

      if (invoice.length === 0) {
        return {
          success: false,
          message: "Invoice number not found. Please check your receipt and try again."
        };
      }

      const invoiceData = invoice[0];

      // Check if user already exists with this email
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.email, invoiceData.customerEmail))
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
        // Create new user from invoice data
        const userId = Math.floor(Math.random() * 1000000000); // Generate random integer ID
        const nameParts = invoiceData.customerName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const newUserData = {
          id: userId,
          email: invoiceData.customerEmail,
          firstName,
          lastName,
          role: 'customer',
          registrationMethod: 'invoice',
          retailerInvoiceNumber: invoiceNumber,
          invoiceVerified: true,
          emailVerified: true, // Auto-verify for invoice users
        };

        await db.insert(users).values(newUserData);
        
        user = {
          id: userId,
          email: invoiceData.customerEmail,
          firstName,
          lastName,
          role: 'customer'
        };
        
        isNewRegistration = true;
      }

      // Mark invoice as used for registration
      await db.update(retailerInvoices)
        .set({ isUsedForRegistration: true })
        .where(eq(retailerInvoices.id, invoiceData.id));

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email || '',
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        message: isNewRegistration 
          ? "Welcome! Your account has been created using your purchase receipt."
          : "Welcome back! Logged in using your receipt.",
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
   * Add sample invoice data for testing
   */
  async createSampleInvoices(): Promise<void> {
    const sampleInvoices = [
      {
        invoiceNumber: 'HN-CKM-2576597',
        customerEmail: 'jude.okun@email.com',
        customerName: 'Jude Okun',
        customerPhone: '0851159264',
        purchaseDate: new Date('2025-05-05'),
        tvModel: 'SILKN DUAL LED MASK',
        tvSize: 'N/A',
        purchaseAmount: '224.50',
        storeName: 'Harvey Norman Carrickmines',
        storeCode: 'CKM'
      },
      {
        invoiceNumber: 'HN-DUB-001234',
        customerEmail: 'john.smith@email.com',
        customerName: 'John Smith',
        customerPhone: '0871234567',
        purchaseDate: new Date('2025-06-15'),
        tvModel: 'Samsung 55" QLED',
        tvSize: '55"',
        purchaseAmount: '899.99',
        storeName: 'Harvey Norman Dublin',
        storeCode: 'DUB'
      },
      {
        invoiceNumber: 'HN-CRK-005678',
        customerEmail: 'mary.jones@email.com',
        customerName: 'Mary Jones',
        customerPhone: '0879876543',
        purchaseDate: new Date('2025-06-20'),
        tvModel: 'LG 65" OLED',
        tvSize: '65"',
        purchaseAmount: '1299.99',
        storeName: 'Harvey Norman Cork',
        storeCode: 'CRK'
      },
      {
        invoiceNumber: 'HN-GAL-009876',
        customerEmail: 'david.brown@email.com',
        customerName: 'David Brown',
        customerPhone: '0861122334',
        purchaseDate: new Date('2025-06-25'),
        tvModel: 'Sony 43" LED',
        tvSize: '43"',
        purchaseAmount: '549.99',
        storeName: 'Harvey Norman Galway',
        storeCode: 'GAL'
      },
      {
        invoiceNumber: 'HN-LIM-012345',
        customerEmail: 'sarah.murphy@email.com',
        customerName: 'Sarah Murphy',
        customerPhone: '0863456789',
        purchaseDate: new Date('2025-06-28'),
        tvModel: 'Samsung 75" QLED',
        tvSize: '75"',
        purchaseAmount: '1599.99',
        storeName: 'Harvey Norman Limerick',
        storeCode: 'LIM'
      },
      {
        invoiceNumber: 'HN-BLA-112233',
        customerEmail: 'david.walsh@email.com',
        customerName: 'David Walsh',
        customerPhone: '0851234567',
        purchaseDate: new Date('2025-06-30'),
        tvModel: 'LG 65" OLED',
        tvSize: '65"',
        purchaseAmount: '1299.00',
        storeName: 'Harvey Norman Blanchardstown',
        storeCode: 'BLA'
      },
      {
        invoiceNumber: 'HN-TAL-998877',
        customerEmail: 'sarah.kelly@email.com',
        customerName: 'Sarah Kelly',
        customerPhone: '0865432109',
        purchaseDate: new Date('2025-07-01'),
        tvModel: 'Sony 55" Bravia',
        tvSize: '55"',
        purchaseAmount: '749.99',
        storeName: 'Harvey Norman Tallaght',
        storeCode: 'TAL'
      },
      {
        invoiceNumber: 'HN-WAT-445566',
        customerEmail: 'michael.brown@email.com',
        customerName: 'Michael Brown',
        customerPhone: '0877654321',
        purchaseDate: new Date('2025-06-25'),
        tvModel: 'Samsung 43" Crystal UHD',
        tvSize: '43"',
        purchaseAmount: '399.99',
        storeName: 'Harvey Norman Waterford',
        storeCode: 'WAT'
      }
    ];

    try {
      for (const invoice of sampleInvoices) {
        // Check if invoice already exists
        const existing = await db.select()
          .from(retailerInvoices)
          .where(eq(retailerInvoices.invoiceNumber, invoice.invoiceNumber))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(retailerInvoices).values(invoice);
          console.log(`Created sample invoice: ${invoice.invoiceNumber}`);
        }
      }
    } catch (error) {
      console.error('Error creating sample invoices:', error);
    }
  }

  /**
   * Validate invoice format
   */
  isValidInvoiceFormat(invoiceNumber: string): boolean {
    // Harvey Norman invoice format: HN-[STORE_CODE]-[INVOICE_NUMBER] or HN[STORE_CODE][INVOICE_NUMBER]
    // Store codes: CKM (Carrickmines), CRK (Cork), DUB (Dublin), GAL (Galway), LIM (Limerick), etc.
    // Invoice numbers are typically 7 digits but can vary
    const regexWithHyphens = /^HN-[A-Z]{3,4}-\d{6,8}$/;
    const regexWithoutHyphens = /^HN[A-Z]{3,4}\d{6,8}$/;
    return regexWithHyphens.test(invoiceNumber) || regexWithoutHyphens.test(invoiceNumber);
  }

  /**
   * Parse invoice number to extract store code and invoice number
   */
  parseInvoiceNumber(invoiceNumber: string): { storeCode: string; invoiceNum: string } | null {
    // Try format with hyphens: HN-[STORE_CODE]-[INVOICE_NUMBER]
    const regexWithHyphens = /^HN-([A-Z]{3,4})-(\d{6,8})$/;
    const matchWithHyphens = invoiceNumber.match(regexWithHyphens);
    if (matchWithHyphens) {
      return {
        storeCode: matchWithHyphens[1],
        invoiceNum: matchWithHyphens[2]
      };
    }

    // Try format without hyphens: HN[STORE_CODE][INVOICE_NUMBER]
    const regexWithoutHyphens = /^HN([A-Z]{3,4})(\d{6,8})$/;
    const matchWithoutHyphens = invoiceNumber.match(regexWithoutHyphens);
    if (matchWithoutHyphens) {
      return {
        storeCode: matchWithoutHyphens[1],
        invoiceNum: matchWithoutHyphens[2]
      };
    }

    return null;
  }

  /**
   * Get store name from store code
   */
  getStoreName(storeCode: string): string {
    const storeMap: Record<string, string> = {
      'BLA': 'Harvey Norman Blanchardstown',
      'CKM': 'Harvey Norman Carrickmines',
      'CRK': 'Harvey Norman Cork',
      'CAS': 'Harvey Norman Castlebar',
      'DRO': 'Harvey Norman Drogheda',
      'FON': 'Harvey Norman Fonthill',
      'GAL': 'Harvey Norman Galway',
      'KIN': 'Harvey Norman Kinsale Road',
      'LIM': 'Harvey Norman Limerick',
      'LIT': 'Harvey Norman Little Island',
      'NAA': 'Harvey Norman Naas',
      'RAT': 'Harvey Norman Rathfarnham',
      'SLI': 'Harvey Norman Sligo',
      'SWO': 'Harvey Norman Swords',
      'TAL': 'Harvey Norman Tallaght',
      'TRA': 'Harvey Norman Tralee',
      'WAT': 'Harvey Norman Waterford'
    };
    return storeMap[storeCode] || `Harvey Norman ${storeCode}`;
  }
}

export const retailerInvoiceService = new RetailerInvoiceService();