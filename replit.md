# TV and Product Installation Referral Platform

## Overview
This project is a sophisticated TV and product installation referral platform connecting service providers with customers. It features an advanced booking and lead management system, leveraging intelligent technological solutions for personalized product recommendations and comprehensive product care analysis. The platform aims to be a leading solution for connecting customers with skilled installers, streamlining the installation process, and offering valuable product care insights. It is designed to support multiple retailers, moving beyond single-retailer exclusivity to capture a broader market, enhancing market potential and business vision.

## User Preferences
- Focus on practical, actionable intelligence over generic information
- Provide realistic cost estimates and scenarios
- Use critical thinking to identify genuine value propositions
- Maintain professional, informative communication style

## Recent Changes (August 14, 2025)
- ✅ **Fixed Invoice Login Authentication**: Resolved "unable to process invoice login at this time" error by adding missing `retailer_code` and `product_details` columns to the `retailer_invoices` table
- ✅ **Initialized Sample Data**: Successfully populated database with sample invoices to support testing
- ✅ **Verified End-to-End Flow**: Confirmed that invoice authentication + booking creation works seamlessly
  - Users can authenticate with invoice number (e.g., "HN-CKM-2576597")
  - Authenticated users can create bookings that are properly linked to their invoices
  - Bookings include `invoiceNumber` and `invoiceSessionId` for complete traceability
- ✅ **Database Schema Sync**: Resolved schema misalignment between codebase and database tables

## System Architecture
The application employs a modern full-stack architecture with AI-enhanced features, prioritizing a mobile-first, responsive design.

**UI/UX Decisions:**
- **Admin Dashboard Consolidation:** Consolidated multiple admin tabs into a unified "Resource Management" interface for improved usability and consistency, separating resource and booking management clearly.
- **Dedicated Landing Pages:** Created a dedicated TV Installation landing page for a comprehensive service showcase, detailed descriptions, and optimized call-to-actions. This also involved restructuring the homepage to be cleaner and more service-agnostic, with updated navigation for better discoverability.
- **Multi-Retailer Rebranding:** Updated all customer-facing interfaces to use generic "Invoice" terminology and removed hardcoded retailer-specific elements to support a multi-retailer model.
- **Dynamic UI Elements:** Utilizes Tailwind CSS for responsive design and dynamic components like the ProductCareCarousel, which displays AI-generated risk scenarios.

**Technical Implementations & Feature Specifications:**
- **Frontend:** React.js with TypeScript.
- **Backend:** Node.js with enhanced authentication.
- **Database:** PostgreSQL with Drizzle ORM.
- **Authentication System:** Migrated from deprecated Replit OAuth to Google OAuth- for stability, ensuring all existing functionality, including a comprehensive password reset flow, is operational and secure. Includes an email verification system and a robust invoice authentication flow for customer profile completion. Secure invoice authentication prevents fake registrations.
- **AI-Powered Email Templates:** Features an AI (GPT-4o) service for generating personalized email templates for tradespersons, customizable by tone and focus, alongside a library of preset templates.
- **AI-Powered Product Care Analysis:** Integrates an AI service (GPT-4o) to analyze products, generate 4-6 comprehensive failure scenarios, assess risk, and estimate costs based on product care documentation, with a focus on critical thinking and real-world applicability. This replaces static content with dynamic, product-specific insights.
- **Multi-Retailer Support:** Implemented a smart retailer detection system capable of identifying major Irish electrical retailers from referral codes and invoice formats, dynamically mapping store locations and supporting generic invoice processing. All booking page references now use generic "Invoice" or "Retailer Invoice" terminology.
- **AI-Powered Content Generation:** Admin users can generate content for the "Create New Resource" module from either URLs (web scraping) or markdown text, powered by GPT-4o.
- **Installer Revenue Calculation:** Corrected lead map revenue display in the installer dashboard to show net potential revenue (estimated earnings minus lead fee).
- **Demo Installation Visibility System:** Demo installers (e.g., test@tradesbook.ie) now only see installations marked as `is_demo = true`, while regular installers do not see demo installations.
- **Comprehensive Credit Refund System:** Implemented a complete credit management system handling all cancellation scenarios: customer cancellations (full refunds), installer withdrawals (partial refunds based on job stage), expired leads (automatic refunds), and fraud prevention refunds. All refunds maintain accurate wallet balances and transaction records with proper audit trails.

**System Design Choices:**
- **Full-Stack Architecture:** Clear separation of frontend and backend concerns.
- **Modular Services:** Backend services are compartmentalized (Product Care Analysis, Product Information, AI Services, Authentication) for maintainability and scalability.
- **Data Persistence:** Relies on PostgreSQL for robust data storage.
- **Security:** Emphasizes secure authentication (OAuth, hashed tokens for password resets, email verification, pre-verified invoice access) and responsible data handling.
- **Scalability:** Designed to accommodate additional service-specific landing pages and integrate new retailers seamlessly.
- **Graceful Degradation:** The AI Product Care feature includes fallback mechanisms to static content if AI analysis fails.

## External Dependencies
- **OpenAI GPT-4o:** Used for AI-powered personalized email template generation, comprehensive product care analysis, and automated resource content generation from URLs or markdown.
- **Perplexity API:** Integrated for detailed product data retrieval within the Product Information Service.
- **Google OAuth:** Utilized for secure user authentication.
- **Gmail Service:** Configured for sending password reset and verification emails.