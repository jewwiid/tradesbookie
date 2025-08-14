import { db } from './db';
import { retailerInvoices, users } from '../shared/schema';
import { eq } from 'drizzle-orm';

export interface VerifiedInvoiceData {
  invoiceNumber: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  retailerCode: string;
  storeCode: string;
  storeName: string;
  purchaseAmount?: number;
  purchaseDate: Date;
  productDetails?: string;
}

/**
 * Invoice Verification Service
 * Handles secure addition of verified invoices to the system
 */
export class InvoiceVerificationService {
  
  /**
   * Admin function to add a verified invoice to the system
   * This should only be called after manual verification of invoice authenticity
   */
  async addVerifiedInvoice(invoiceData: VerifiedInvoiceData): Promise<{
    success: boolean;
    message: string;
    invoiceId?: number;
  }> {
    try {
      // Check if invoice already exists
      const existingInvoice = await db.select()
        .from(retailerInvoices)
        .where(eq(retailerInvoices.invoiceNumber, invoiceData.invoiceNumber))
        .limit(1);

      if (existingInvoice.length > 0) {
        return {
          success: false,
          message: `Invoice ${invoiceData.invoiceNumber} already exists in the system.`
        };
      }

      // Insert verified invoice
      const [createdInvoice] = await db.insert(retailerInvoices)
        .values({
          invoiceNumber: invoiceData.invoiceNumber,
          customerEmail: invoiceData.customerEmail,
          customerName: invoiceData.customerName,
          customerPhone: invoiceData.customerPhone || null,
          retailerCode: invoiceData.retailerCode,
          storeCode: invoiceData.storeCode,
          storeName: invoiceData.storeName,
          purchaseAmount: invoiceData.purchaseAmount || null,
          purchaseDate: invoiceData.purchaseDate,
          retailerCode: invoiceData.retailerCode,
          productDetails: invoiceData.productDetails || null,
          isUsedForRegistration: false
        })
        .returning();

      console.log(`✅ Admin added verified invoice: ${invoiceData.invoiceNumber}`);

      return {
        success: true,
        message: `Invoice ${invoiceData.invoiceNumber} has been successfully verified and added to the system.`,
        invoiceId: createdInvoice.id
      };

    } catch (error) {
      console.error('Error adding verified invoice:', error);
      return {
        success: false,
        message: 'Failed to add verified invoice. Please try again.'
      };
    }
  }

  /**
   * Get list of invoices requiring verification
   */
  async getPendingVerifications(): Promise<{
    invoiceNumber: string;
    attemptedAt: Date;
    retailerInfo: string;
  }[]> {
    // This would track attempted logins that failed verification
    // For now, return empty array as we're not storing failed attempts
    return [];
  }

  /**
   * Validate invoice format and extract retailer info
   */
  validateInvoiceFormat(invoiceNumber: string): {
    isValid: boolean;
    retailerCode?: string;
    storeCode?: string;
    retailerName?: string;
  } {
    const upperInvoice = invoiceNumber.toUpperCase().trim();

    // Harvey Norman: HN-STORE-NUMBER
    if (upperInvoice.match(/^HN-[A-Z]{3}-\d{6}$/)) {
      const parts = upperInvoice.split('-');
      return {
        isValid: true,
        retailerCode: 'HN',
        storeCode: parts[1],
        retailerName: 'Harvey Norman'
      };
    }

    // Currys: CR-STORE-NUMBER
    if (upperInvoice.match(/^CR-[A-Z]{3}-\d{6}$/)) {
      const parts = upperInvoice.split('-');
      return {
        isValid: true,
        retailerCode: 'CR',
        storeCode: parts[1],
        retailerName: 'Currys'
      };
    }

    // RTV: RT-STORE-NUMBER
    if (upperInvoice.match(/^RT-[A-Z]{3}-\d{6}$/)) {
      const parts = upperInvoice.split('-');
      return {
        isValid: true,
        retailerCode: 'RT',
        storeCode: parts[1],
        retailerName: 'RTV'
      };
    }

    return {
      isValid: false
    };
  }
}

export const invoiceVerificationService = new InvoiceVerificationService();