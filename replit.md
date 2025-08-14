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