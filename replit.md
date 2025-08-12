# TV and Product Installation Referral Platform

## Overview
A sophisticated TV and product installation referral platform that leverages intelligent technological solutions to connect service providers with customers through an advanced booking and lead management system.

## Key Technologies
- React.js with TypeScript frontend
- Node.js backend with enhanced authentication
- PostgreSQL database with Drizzle ORM
- Tailwind CSS for responsive design
- AI-powered personalized product recommendations
- Advanced mobile-responsive UI
- Comprehensive product category questionnaires
- **NEW: AI-powered Product Care analysis with critical thinking**

## Recent Changes (January 2025)

### OAuth Authentication System Migration (August 2025)
- **Critical Fix**: Resolved authentication failures by migrating from deprecated Replit OAuth to Google OAuth
  - **Issue**: Replit deprecated their manual OIDC endpoint (`https://replit.com/oidc`) in favor of AI Agent-only "Replit Auth"
  - **Solution**: Updated authentication system to use Google OAuth (`https://accounts.google.com`)
  - **Changes Made**:
    - Updated OIDC discovery endpoint in `server/replitAuth.ts`
    - Changed all strategy names from `replitauth:*` to `googleauth:*`
    - Removed deprecated `offline_access` scope
    - Updated callback and route handlers throughout `server/routes.ts`
  - **Business Benefit**: Stable, enterprise-grade authentication that won't break due to platform changes
  - **Status**: ✅ Successfully tested - OAuth login now redirects properly to Google authentication

**Technical Note**: While Replit offers their new "Replit Auth" system, it only works through AI Agent prompts and would require rebuilding the sophisticated multi-retailer user management system. Google OAuth provides better stability and maintains all existing functionality.

### Platform Rebranding for Multi-Retailer Support (August 2025)
- **Removed Harvey Norman Exclusivity**: Updated all customer-facing interfaces to use generic "Invoice" terminology
  - Homepage card title changed from "Harvey Norman Invoice" to "Invoice"
  - Authentication dialog updated from "Harvey Norman Customer" to "Invoice Customer"
  - Removed hardcoded Harvey Norman store codes and locations from invoice input form
  - Updated placeholder text and error messages to be retailer-agnostic
  - Generic invoice format examples instead of specific store code mappings

- **Database Schema Updates**:
  - Renamed `harveyNormanInvoices` table to `retailerInvoices` for generic support
  - Updated `users.harveyNormanInvoiceNumber` to `users.retailerInvoiceNumber`
  - Changed schema comments to reference "retail partner" instead of specific retailer

- **API Endpoints Generalized**:
  - Updated routes from `/api/harvey-norman/*` to `/api/retail-partner/*`
  - Generic referral code generation using "RT" prefix (Retail Trade) instead of "HN"
  - Smart store code generation from any retailer name instead of hardcoded mappings

- **Smart Retailer Detection System**: 
  - **Created comprehensive retailer detection service** (`server/retailerDetectionService.ts`)
  - **Supports major Irish electrical retailers**: Harvey Norman (HN), Currys (CR), DID Electrical (DD), Power City (PC), Argos (AR), Expert (EX)
  - **Intelligent referral code parsing**: Automatically detects retailer from codes like HNCKMDOUG, CRDUBSARAH, DDGALMIKE, PCLIMJOHN
  - **Invoice format recognition**: Handles multiple invoice formats per retailer (HN-CKM-123456, CR-DUB-789123, DID-987456, PWR-123789)
  - **Dynamic store mapping**: Each retailer has configurable store locations and codes
  - **Enhanced APIs**: `/api/retail-partner/detect`, `/api/retail-partner/retailers` for retailer information
  - **Color-coded retailers**: Each retailer has brand colors for UI consistency

- **Admin Dashboard Updates**:
  - Removed hardcoded Harvey Norman store abbreviations
  - Implemented dynamic store code generation for any electrical retailer
  - Updated referral code prefixes to be retailer-agnostic
  - Enhanced referral code display with retailer branding and store information

**Business Benefit**: Platform can now be pitched to any electrical retailer in Ireland without exclusivity concerns. Booking system automatically recognizes retailer codes (HN=Harvey Norman, CR=Currys, DD=DID, PC=Power City, etc.) and provides retailer-specific branding and validation.

### Enhanced Product Care Section with AI Analysis
- **Created AI-powered Product Care Analysis Service** (`server/productCareAnalysisService.ts`)
  - Uses GPT-4o to analyze products and generate exactly 4-6 comprehensive failure scenarios per product
  - References updated Harvey Norman Product Care documentation for accurate coverage details
  - Employs critical thinking to assess risk levels, potential costs, and how Product Care helps
  - Considers Irish market context (power surges, humidity, repair costs)
  - Generates multiple scenario types: electrical/electronic failures, mechanical wear, environmental damage, accidental damage, and category-specific issues
  - **Enhanced reliability**: 3-attempt retry logic with strict JSON validation to eliminate fallback scenarios
  - **Improved AI prompts**: Structured prompts ensuring consistent JSON responses
  - **Better error handling**: Comprehensive logging and validation to catch issues early

- **Enhanced ProductCareCarousel Component** (`client/src/pages/ai-help.tsx`)
  - Displays multiple intelligent, product-specific risk scenarios with carousel navigation
  - Shows likelihood ratings (High/Medium/Low) with appropriate risk indicators
  - Provides detailed cost breakdown of potential issues vs Product Care coverage
  - Includes personalized recommendations based on product analysis
  - Enhanced error handling with bounds checking and fallback values
  - Replaced "Get Protection Now" button with "Consider Adding Protection" text
  - Added "Get AI Risk Analysis" button for on-demand analysis
  - Multiple scenario support with proper slide navigation

- **Added API Endpoint** (`/api/ai/product-care-analysis`)
  - Accepts product information and optional user context
  - Returns comprehensive risk assessment and scenarios
  - Integrated with existing product information workflow

### Key Features of AI Product Care Analysis
- **Critical Scenario Analysis**: Identifies realistic product failure scenarios with likelihood assessments
- **Cost-Benefit Analysis**: Shows potential savings vs coverage cost with specific monetary estimates
- **Risk Assessment**: Evaluates overall risk level and primary risk factors
- **Environmental Considerations**: Accounts for Irish climate and power conditions
- **Personalized Recommendations**: Tailored advice based on product category and specifications

### Integration Points
- Works with existing Product Information lookup system
- Enhances Product Recommendations section with intelligent care analysis
- Compatible with Product Comparison tool results
- Uses real Harvey Norman Product Care terms and conditions

## User Preferences
- Focus on practical, actionable intelligence over generic information
- Provide realistic cost estimates and scenarios
- Use critical thinking to identify genuine value propositions
- Maintain professional, informative communication style

## Project Architecture
The application follows a modern full-stack architecture with AI-enhanced features:

### Backend Services
- **Product Care Analysis Service**: AI-powered risk assessment and scenario generation
- **Product Information Service**: Perplexity API integration for detailed product data
- **AI Services**: OpenAI GPT-4o integration for intelligent analysis
- **Authentication**: Multiple methods including invoice-based login
- **Database**: PostgreSQL with Drizzle ORM for data persistence

### Frontend Components  
- **Enhanced Product Care Carousel**: Dynamic AI analysis with fallback static content
- **Product Information Display**: Comprehensive product details and recommendations
- **AI Help Assistant**: Multi-tab interface for product discovery and comparison

### Key Improvements Made
1. **Intelligence over Static Content**: Product care now uses AI analysis instead of hardcoded slides
2. **Critical Thinking Implementation**: AI evaluates real product risks and provides reasoned recommendations  
3. **User-Centric Design**: Shows relevant scenarios and costs specific to each product
4. **Comprehensive Coverage**: References actual Harvey Norman Product Care terms and benefits
5. **Graceful Degradation**: Falls back to static content if AI analysis fails

The enhanced product care section now provides users with intelligent, product-specific analysis that helps them understand the genuine value of extended protection coverage based on their specific product and usage context.