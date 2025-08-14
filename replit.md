# TV and Product Installation Referral Platform

## Overview
This project is a sophisticated TV and product installation referral platform connecting service providers with customers. It features an advanced booking and lead management system, leveraging intelligent technological solutions for personalized product recommendations and comprehensive product care analysis. The platform aims to be a leading solution for connecting customers with skilled installers, streamlining the installation process, and offering valuable product care insights. It is designed to support multiple retailers, moving beyond single-retailer exclusivity to capture a broader market.

## User Preferences
- Focus on practical, actionable intelligence over generic information
- Provide realistic cost estimates and scenarios
- Use critical thinking to identify genuine value propositions
- Maintain professional, informative communication style

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
- **Authentication System:** Migrated from deprecated Replit OAuth to Google OAuth for stability, ensuring all existing functionality, including a comprehensive password reset flow, is operational and secure.
- **AI-Powered Email Templates:** Features an AI (GPT-4o) service for generating personalized email templates for tradespersons, customizable by tone and focus, alongside a library of preset templates.
- **AI-Powered Product Care Analysis:** Integrates an AI service (GPT-4o) to analyze products, generate 4-6 comprehensive failure scenarios, assess risk, and estimate costs based on product care documentation, with a focus on critical thinking and real-world applicability. This replaces static content with dynamic, product-specific insights.
- **Multi-Retailer Support:** Implemented a smart retailer detection system capable of identifying major Irish electrical retailers from referral codes and invoice formats, dynamically mapping store locations and supporting generic invoice processing.

**System Design Choices:**
- **Full-Stack Architecture:** Clear separation of frontend and backend concerns.
- **Modular Services:** Backend services are compartmentalized (Product Care Analysis, Product Information, AI Services, Authentication) for maintainability and scalability.
- **Data Persistence:** Relies on PostgreSQL for robust data storage.
- **Security:** Emphasizes secure authentication (OAuth, hashed tokens for password resets) and responsible data handling.
- **Scalability:** Designed to accommodate additional service-specific landing pages and integrate new retailers seamlessly.
- **Graceful Degradation:** The AI Product Care feature includes fallback mechanisms to static content if AI analysis fails.

## External Dependencies
- **OpenAI GPT-4o:** Used for AI-powered personalized email template generation, comprehensive product care analysis, and automated resource content generation from URLs.
- **Perplexity API:** Integrated for detailed product data retrieval within the Product Information Service.
- **Google OAuth:** Utilized for secure user authentication.
- **Gmail Service:** Configured for sending password reset emails.

## Recent Changes (August 2025)

### Enhanced Email Verification System (August 2025)
- **Anti-Spam Email Verification**: Implemented comprehensive email verification system to distinguish real customers from spam registrations
  - **Registration Enhancement**: Updated `/api/auth/register` endpoint to require email verification for new accounts
  - **Login Updates**: Modified `/api/auth/login` to allow unverified users limited access with verification reminders
  - **Email Verification Service**: Integrated existing `emailVerificationService.ts` with registration and login flows
  - **User Interface Components**: Created `EmailVerificationBanner` component for verified user dashboards
  - **Invoice Login Improvements**: Enhanced invoice login form with specific retailer examples (HN-GAL-009876, CR-DUB-123456, RT-BLA-555666)
  - **Database Schema**: Confirmed email verification fields exist (`email_verification_token`, `verification_token_expires`, `is_email_verified`)
  - **Verification Flow**: Users receive verification emails immediately upon registration with 24-hour token expiry
  - **Status**: ✅ Fully operational - email verification prevents spam, real customers can verify and access full features

### Customer Profile Completion System (August 2025)
- **Complete Invoice Authentication Flow**: Fixed and fully implemented invoice-based login system
  - **Database Setup**: Created `retailer_invoices` table with test data for HN-GAL-009876, CR-DUB-123456, RT-BLA-555666
  - **User Authentication**: Enhanced `RetailerDetectionService` to handle complete user creation and login from invoice data
  - **Profile Completion**: Built comprehensive profile setup page at `/customer-profile-setup` with validation
  - **API Endpoints**: Added `PUT /api/auth/profile` for profile updates and user management
  - **Schema Updates**: Added phone field to users table and created missing type exports
  - **Automatic Redirection**: New invoice users are prompted to complete profile with contact details
  - **Multi-Retailer Support**: System properly detects Harvey Norman, Currys, RTV invoices and creates appropriate user accounts
  - **Session Management**: Proper Passport.js session handling for invoice-authenticated users
  - **Status**: ✅ Fully operational - invoice login creates users, profile completion flow working

### Demo Installation Visibility System (August 2025)
- **Fixed Demo Installer Filtering**: Demo installer (test@tradesbook.ie) now properly sees demo-tagged installations
  - **Available Requests**: Demo accounts only see installations marked with `is_demo = true`
  - **Past Leads**: Demo installers only see completed demo installations in their dashboard
  - **Regular Installer Protection**: Non-demo installers never see demo installations, maintaining realistic experience
  - **Database Structure**: `bookings.is_demo` boolean flag properly filters installations by account type
  - **Admin Dashboard**: Admin can tag installations as demo for testing and training purposes
  - **Status**: ✅ Fully operational - demo installer sees demo installations, regular installers see only real jobs

### Critical Invoice Login & Lead Quality Enhancement (August 2025)
- **Fixed Invoice Authentication System**: Resolved fundamental ID type mismatches and improved email verification flow
  - **Database Fix**: Fixed string vs integer ID type conflict in `retailerDetectionService.ts` - now creates proper integer IDs
  - **Enhanced Email Verification**: All new invoice users receive verification emails and must verify before bookings appear as leads
  - **Lead Quality Filtering**: Installers only see bookings from email-verified customers, ensuring high-quality leads
  - **Multi-Retailer Support**: Invoice login works for HN-GAL-009876, CR-DUB-123456, RT-BLA-555666 examples
  - **Verification Flow**: New invoice users get welcome message explaining verification requirement
  - **Anti-Spam Protection**: Unverified customers cannot generate visible leads, preventing spam registrations
  - **Demo Compatibility**: Demo installer functionality preserved while applying verification to real installers
  - **Status**: ✅ Fully operational - invoice login creates verified users, lead filtering ensures quality

### Secure Invoice Authentication System (August 2025)
- **Implemented Proper Store Authentication**: Enhanced security to prevent fake invoice registrations
  - **Security Enhancement**: System no longer auto-creates invoice records for unknown invoice numbers
  - **Verification Requirement**: New invoices must be manually verified by support before system access
  - **Fake Invoice Prevention**: Properly rejects attempts with non-existent invoices like HN-BLA-999999
  - **Support Integration**: Clear messaging directs users to contact support@tradesbook.ie for invoice verification
  - **Database Cleanup**: Removed automatically created fake invoice records from testing
  - **Multi-Retailer Security**: Security applies to all supported retailers (Harvey Norman, Currys, RTV)
  - **Admin Verification Service**: Created `InvoiceVerificationService` for secure admin-controlled invoice additions
  - **Status**: ✅ Fully secured - only pre-verified invoices can authenticate, prevents unauthorized access

### Fixed Installer Revenue Calculation (August 2025)
- **Corrected Lead Map Revenue Display**: Fixed the "Potential Revenue" calculation in the installer dashboard Live Lead Map to properly factor in lead fees
  - **Issue**: Revenue display was only showing total `estimatedEarnings` without subtracting the required `leadFee` installers must pay
  - **Solution**: Updated calculation to show net revenue: `(estimatedEarnings - leadFee)` for accurate financial projections
  - **User Experience**: Changed label from "Potential Revenue" to "Net Potential Revenue" for clarity
  - **Impact**: Installers now see realistic profit expectations when evaluating available leads
  - **Status**: ✅ Fully resolved - installer dashboard now shows accurate net revenue calculations

## Recent Changes (August 2025)

### Multi-Retailer Interface Updates (August 2025)
- **Booking Page Invoice References**: Updated all hardcoded "Harvey Norman Invoice" references to use generic "Invoice" or "Retailer Invoice" terminology
  - **Files Updated**: 
    - `client/src/components/ProtectedBooking.tsx`: Changed card title and description from Harvey Norman-specific to generic invoice
    - `client/src/pages/customer-dashboard.tsx`: Updated sign-in help text to reference "Retailer invoice" instead of Harvey Norman
    - `client/src/pages/booking-tracker.tsx`: Updated tracking instructions and examples to show multiple retailer formats (HN, CR, RT)
  - **Benefits**:
    - Consistent multi-retailer experience across all booking flows
    - Users no longer confused by Harvey Norman-specific references when using other retailers
    - Platform properly reflects its multi-retailer capability
    - Examples now show multiple retailer invoice formats (HN-GAL-009876, CR-DUB-123456, RT-BLA-555666)
  - **Technical Implementation**: Maintains compatibility with existing retailer detection service while presenting generic interface
  - **Status**: ✅ Complete - All booking page references updated to generic multi-retailer terminology

### AI-Powered Content Generation (August 2025)
- **Enhanced Feature**: Dual-input AI content generation for Create New Resource module
  - **Functionality**: Admin users can generate content from either URLs OR markdown text
    - **URL Method**: Paste any URL and AI automatically scrapes and fills fields
    - **Markdown Method**: Paste markdown content and AI transforms it into structured resource
  - **Implementation**:
    - Enhanced `AIContentService` with both URL scraping and markdown processing
    - Added dual input support to `/api/admin/resources/generate-content` endpoint
    - Toggle switch UI for seamless switching between URL and markdown modes
    - Separate validation and error handling for each input method
  - **User Experience**:
    - Elegant toggle switch to choose between URL and Markdown input methods
    - Context-aware placeholder text and instructions for each mode
    - Real-time loading states with method-specific messaging
    - Comprehensive error handling and validation for both input types
    - Only shows in Create mode to prevent overwriting existing content
  - **Technical Features**:
    - **URL Processing**: Enhanced web scraping, HTML cleaning, and fallback mechanisms
    - **Markdown Processing**: Intelligent parsing and transformation of markdown to customer-friendly content
    - Smart content categorization and type detection for both methods
    - Graceful fallback handling for restricted or JavaScript-heavy websites
    - Enhanced error messages and logging for debugging
  - **Status**: ✅ Fully implemented with both URL and Markdown support using GPT-4o integration

### Admin Dashboard Consolidation (August 2025)
- **Unified Resource Management Interface**: Successfully consolidated duplicate admin dashboard tabs for better user experience
  - **Problem**: Three separate tabs ("General Resources", "TV Setup Help", "TV Setup") with overlapping functionality and different dialog forms
  - **Solution**: 
    - Consolidated "General Resources" and "TV Setup Help" into single "Resource Management" tab
    - Renamed "TV Setup" to "TV Setup Bookings" for clarity
    - Removed duplicate CustomerResourcesManagement component with simpler dialog forms
    - Enhanced ResourcesManagement component now handles both CRUD operations and external link functionality
  - **User Benefits**:
    - Single comprehensive interface for all resource management
    - Consistent dialog forms with full feature set (external URLs, brands, priorities, etc.)
    - Reduced confusion from duplicate interfaces
    - Better organization with clear separation between resource management and booking management
  - **Technical Implementation**: 
    - Fixed TypeScript errors in ResourcesManagement component
    - Added comprehensive header explaining unified functionality
    - Feature badges showing External Links, CRUD Operations, Content Management, Brand Specific capabilities
  - **Status**: ✅ Complete consolidation with improved admin workflow