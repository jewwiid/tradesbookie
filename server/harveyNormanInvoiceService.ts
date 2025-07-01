import { db } from './db';
import { harveyNormanInvoices, users } from '../shared/schema';
import { eq } from 'drizzle-orm';

export interface InvoiceLoginResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
  };
  message: string;
  isNewRegistration?: boolean;
}

export class HarveyNormanInvoiceService {
  /**
   * Login or register user using Harvey Norman invoice number
   */
  async loginWithInvoice(invoiceNumber: string): Promise<InvoiceLoginResult> {
    try {
      // Look up invoice in database
      const invoice = await db.select()
        .from(harveyNormanInvoices)
        .where(eq(harveyNormanInvoices.invoiceNumber, invoiceNumber))
        .limit(1);

      if (invoice.length === 0) {
        return {
          success: false,
          message: "Invoice number not found. Please check your Harvey Norman receipt and try again."
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
              harveyNormanInvoiceNumber: invoiceNumber,
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
          harveyNormanInvoiceNumber: invoiceNumber,
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
      await db.update(harveyNormanInvoices)
        .set({ isUsedForRegistration: true })
        .where(eq(harveyNormanInvoices.id, invoiceData.id));

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
          ? "Welcome! Your account has been created using your Harvey Norman purchase."
          : "Welcome back! Logged in using your Harvey Norman invoice.",
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
        invoiceNumber: 'HN-2025-001234',
        customerEmail: 'john.smith@email.com',
        customerName: 'John Smith',
        purchaseDate: new Date('2025-06-15'),
        tvModel: 'Samsung 55" QLED',
        tvSize: '55"',
        purchaseAmount: '899.99'
      },
      {
        invoiceNumber: 'HN-2025-005678',
        customerEmail: 'mary.jones@email.com',
        customerName: 'Mary Jones',
        purchaseDate: new Date('2025-06-20'),
        tvModel: 'LG 65" OLED',
        tvSize: '65"',
        purchaseAmount: '1299.99'
      },
      {
        invoiceNumber: 'HN-2025-009876',
        customerEmail: 'david.brown@email.com',
        customerName: 'David Brown',
        purchaseDate: new Date('2025-06-25'),
        tvModel: 'Sony 43" LED',
        tvSize: '43"',
        purchaseAmount: '549.99'
      }
    ];

    try {
      for (const invoice of sampleInvoices) {
        // Check if invoice already exists
        const existing = await db.select()
          .from(harveyNormanInvoices)
          .where(eq(harveyNormanInvoices.invoiceNumber, invoice.invoiceNumber))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(harveyNormanInvoices).values(invoice);
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
    // Harvey Norman invoice format: Simple 7-digit number (e.g., 2576597)
    const regex = /^\d{7}$/;
    return regex.test(invoiceNumber);
  }
}

export const harveyNormanInvoiceService = new HarveyNormanInvoiceService();