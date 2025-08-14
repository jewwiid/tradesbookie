import { pgTable, serial, varchar, text, timestamp, boolean, decimal } from 'drizzle-orm/pg-core';

// Store Partner Applications - Stores wanting to join the platform
export const storePartnerApplications = pgTable("store_partner_applications", {
  id: serial("id").primaryKey(),
  
  // Store Information
  storeName: varchar("store_name", { length: 200 }).notNull(),
  businessName: varchar("business_name", { length: 200 }).notNull(),
  websiteUrl: varchar("website_url", { length: 500 }),
  
  // Contact Details
  contactName: varchar("contact_name", { length: 100 }).notNull(),
  contactEmail: varchar("contact_email", { length: 150 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 20 }),
  contactPosition: varchar("contact_position", { length: 100 }), // Manager, Owner, etc.
  
  // Business Details
  businessRegistrationNumber: varchar("business_registration_number", { length: 50 }),
  vatNumber: varchar("vat_number", { length: 50 }),
  yearsInBusiness: varchar("years_in_business", { length: 20 }),
  numberOfLocations: varchar("number_of_locations", { length: 10 }),
  primaryProducts: text("primary_products"), // TVs, Electronics, Home Appliances, etc.
  
  // Geographic Information
  headOfficeAddress: text("head_office_address"),
  serviceAreas: text("service_areas"), // Dublin, Cork, National, etc.
  storeLocations: text("store_locations"), // JSON array of store locations
  
  // Partnership Interest
  monthlyInvoiceVolume: varchar("monthly_invoice_volume", { length: 20 }), // <50, 50-200, 200-500, 500+
  installationServicesOffered: boolean("installation_services_offered").default(false),
  currentInstallationPartners: text("current_installation_partners"),
  reasonForJoining: text("reason_for_joining"),
  
  // Technical Requirements
  invoiceFormat: varchar("invoice_format", { length: 100 }), // How their invoices are formatted
  sampleInvoiceNumber: varchar("sample_invoice_number", { length: 50 }),
  posSystemUsed: varchar("pos_system_used", { length: 100 }),
  canProvideInvoiceData: boolean("can_provide_invoice_data").default(false),
  
  // Application Status
  status: varchar("status", { length: 20 }).default("pending"), // pending, under_review, approved, rejected, on_hold
  adminNotes: text("admin_notes"),
  reviewedBy: varchar("reviewed_by", { length: 100 }),
  reviewedAt: timestamp("reviewed_at"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  
  // Integration Details (filled after approval)
  retailerCode: varchar("retailer_code", { length: 10 }), // e.g., 'ST' for new store
  invoicePrefix: varchar("invoice_prefix", { length: 20 }), // e.g., 'ST-{STORE}-{NUMBER}'
  
  // Source tracking
  submittedViaInvoice: varchar("submitted_via_invoice", { length: 50 }), // Invoice that triggered the application
  referralSource: varchar("referral_source", { length: 100 }), // How they heard about us
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Export type for TypeScript
export type StorePartnerApplication = typeof storePartnerApplications.$inferSelect;
export type NewStorePartnerApplication = typeof storePartnerApplications.$inferInsert;