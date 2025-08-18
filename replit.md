# TV and Product Installation Referral Platform

## Overview
This project is a sophisticated TV and product installation referral platform connecting service providers with customers. It features an advanced booking and lead management system, leveraging intelligent technological solutions for personalized product recommendations and comprehensive product care analysis. The platform aims to be a leading solution for connecting customers with skilled installers, streamlining the installation process, and offering valuable product care insights. It is designed to support multiple retailers, moving beyond single-retailer exclusivity to capture a broader market, enhancing market potential and business vision.

## User Preferences
- Focus on practical, actionable intelligence over generic information
- Provide realistic cost estimates and scenarios
- Use critical thinking to identify genuine value propositions
- Maintain professional, informative communication style

## Recent Changes (August 18, 2025)
- ✅ **Enhanced Admin Installer Onboarding System**: Implemented comprehensive dual-approach installer registration system
  - **Full Registration**: Creates complete installer accounts with auto-generated passwords for immediate access
  - **Basic Profile + Completion Invite**: Creates minimal profiles and sends secure completion invitations for staged onboarding
  - **Profile Completion Flow**: Added secure token-based system allowing installers to complete their own profiles after admin creates basic information
  - **Flexible Onboarding**: Supports scenarios where admins have basic information but installers need to provide detailed business data
  - **Email Integration**: Enhanced Gmail service with professional completion invitation templates including secure completion links
  - **Database Schema Updates**: Added `completionToken`, `completionTokenExpires`, and enhanced `adminNotes` fields to support the new workflow
  - **Admin Workflow Optimization**: Streamlined interface allowing admins to choose registration approach based on available information and installer preference
- ✅ **Fixed Invoice Login Authentication**: Resolved "unable to process invoice login at this time" error by adding missing `retailer_code` and `product_details` columns to the `retailer_invoices` table
- ✅ **Initialized Sample Data**: Successfully populated database with sample invoices to support testing
- ✅ **Verified End-to-End Flow**: Confirmed that invoice authentication + booking creation works seamlessly
  - Users can authenticate with invoice number (e.g., "HN-CKM-2576597")
  - Authenticated users can create bookings that are properly linked to their invoices
  - Bookings include `invoiceNumber` and `invoiceSessionId` for complete traceability
- ✅ **Database Schema Sync**: Resolved schema misalignment between codebase and database tables
- ✅ **Fixed Purchased Leads Dashboard Issue**: Resolved critical bug where installers couldn't see purchased leads in their dashboard
  - **Root Cause**: The `getInstallerPurchasedLeads` method was filtering by non-existent `leadFeeStatus` field instead of actual `status` field
  - **Solution**: Updated method to filter by job assignment status ('purchased', 'accepted', 'in_progress', 'completed')
  - **Impact**: Installers can now see leads they've purchased even before customer acceptance, providing complete visibility into their lead pipeline
- ✅ **Fixed Available Leads Filtering**: Resolved issue where purchased leads still appeared in the available requests for installers
  - **Root Cause**: Available requests endpoint only checked for assigned leads (`booking.installerId`) but not purchased leads via job assignments
  - **Solution**: Added filtering logic to exclude leads already purchased by the specific installer using `getInstallerPurchasedLeads`
  - **Impact**: Installers now see accurate available leads - purchased leads no longer appear as available options
- ✅ **Fixed Lead Fee Display Accuracy**: Resolved issue where purchased leads showed €0.00 instead of correct lead fees
  - **Root Cause**: Lead fees weren't properly calculated in the `getInstallerPurchasedLeads` method when job assignments had incorrect stored fees
  - **Solution**: Updated method to calculate correct lead fees based on service type using `getLeadFee` function, ensuring silver service shows €25.00
  - **Impact**: All purchased leads now display accurate lead fees based on service type pricing
- ✅ **Enhanced Multi-TV Installation Support**: Fixed and verified complete multi-TV installation handling in purchased leads dashboard
  - **Root Cause**: API response was missing `tvInstallations` and `tvQuantity` fields needed for frontend multi-TV display
  - **Solution**: Updated both storage method and route transformation to include multi-TV data and calculated TV quantity
  - **Impact**: Installers can now see detailed TV-by-TV breakdown for multi-installation bookings with proper location, size, and pricing info
- ✅ **Verified Image Support**: Confirmed complete image handling for room photos and AI preview images in lead detail modals
- ✅ **Enhanced Admin Dashboard Cross-View Access**: Implemented comprehensive admin access system for monitoring installer and customer dashboards
  - **Implementation**: Added navigation tabs in admin dashboard allowing admins to access customer and installer views while maintaining admin privileges
  - **Backend Security**: Modified authentication middleware to allow admin users to access installer and customer endpoints with proper authorization checks
  - **Visual Indicators**: Added "Admin View" badges and "Back to Admin" buttons in both customer and installer dashboards when accessed by admin users
  - **TypeScript Compatibility**: Fixed all interface type mismatches and missing properties to ensure stable dashboard loading
  - **Impact**: Admin users can now seamlessly monitor and troubleshoot customer and installer functions without switching accounts
- ✅ **Resolved Admin Dashboard TypeScript Errors**: Fixed critical type definition issues preventing booking management tab from loading
  - **Root Cause**: Interface definitions for Booking and Installer types were missing required properties (isVip, contactName, contactEmail, tvInstallations, leadFee, isDemo)
  - **Solution**: Updated type interfaces to match backend API responses and added proper type casting for complex data structures
  - **Impact**: All admin dashboard tabs now load without breaking, enabling complete administrative functionality
- ✅ **Implemented Complete AI Tools QR Code Generation System**: Added comprehensive QR code generation for in-store AI tool access
  - **QR Service Enhancement**: Extended QRCodeService with generateAIToolQRCode and generateAIToolFlyerSVG methods for AI tool-specific QR codes
  - **Admin Interface**: Added QR code generation functionality to AI Tools Management with store location support and printable flyer downloads
  - **API Endpoints**: Implemented POST /api/admin/ai-tools/:id/qr-code and /api/admin/ai-tools/:id/flyer routes for QR generation and flyer creation
  - **Enhanced AI Help Landing**: Updated ai-help page to handle QR parameters (tool, qr, store) for direct navigation to specific AI tools
  - **Store Integration**: QR codes include store location context and generate URLs like /ai-help?qr={id}&tool={key}&store={location}
  - **Printable Flyers**: Professional SVG flyers with embedded QR codes, tool descriptions, and store branding for in-store display
  - **Impact**: Store staff can now generate and print QR codes for any AI tool, customers can scan to instantly access specific AI features
- ✅ **Fixed Lead Price Display in Multi-TV Booking Details**: Resolved missing lead fee information in TV Installation Details and Pricing Details sections
  - **Root Cause**: Individual TV lead fees weren't being calculated or displayed in multi-TV booking breakdowns
  - **TV Installation Details Fix**: Added individual lead fee calculation and display for each TV based on service type (bronze €20, silver €25, etc.)
  - **Pricing Details Enhancement**: Enhanced pricing breakdown to show per-TV lead fees with service type context for multi-TV bookings
  - **Lead Fee Calculation**: Implemented client-side lead fee calculation using the same pricing structure as the backend (table-top-small €12, bronze €20, silver €25, gold €30, etc.)
  - **Impact**: Admins can now see accurate lead fee breakdowns for each TV in multi-installation bookings, improving cost transparency and lead management

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
- **AI Credit System:** Implemented a comprehensive AI credit system with 3 free AI requests per feature for all users (tracked by session for guests), then 1 credit = 1 AI request pricing. Protects all AI endpoints (TV Preview, Product Care Analysis, FAQ, Product Info, TV Comparison). Requires verified email addresses for credit purchases and usage. Real-time usage tracking for both authenticated and guest users with automatic wallet integration.

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