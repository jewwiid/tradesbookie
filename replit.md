# tradesbook.ie - TV Installation Service Platform

## Overview

tradesbook.ie is a full-stack web application that connects customers with professional TV installers through an intelligent booking system. The platform features AI-powered room analysis, dynamic pricing, QR code tracking, and multi-role dashboards for customers, installers, and administrators.

## System Architecture

The application follows a modern full-stack architecture:

**Frontend**: React 18 with TypeScript, using Vite for build tooling and Wouter for routing. UI components are built with Radix UI primitives and styled with Tailwind CSS using the shadcn/ui design system.

**Backend**: Node.js with Express.js serving both API endpoints and static files. The server handles file uploads, AI integration, and business logic.

**Database**: PostgreSQL with Drizzle ORM for type-safe database operations. Uses Neon Database for serverless PostgreSQL hosting.

**AI Integration**: OpenAI GPT-4o for room analysis and installation recommendations.

**Deployment**: Configured for Replit with autoscaling deployment target.

## Key Components

### Frontend Architecture
- **Component Structure**: Modular React components with TypeScript
- **State Management**: React Query for server state, local component state for UI
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Routing**: File-based routing with Wouter
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **API Layer**: RESTful API with Express.js
- **Database Layer**: Drizzle ORM with PostgreSQL
- **File Handling**: Multer for image uploads with size limits
- **AI Services**: OpenAI integration for room analysis and TV placement recommendations
- **Session Management**: Express sessions with PostgreSQL storage

### Database Schema
The application uses a multi-tenant architecture with the following key entities:
- **Users**: Customer information and authentication
- **Installers**: Service provider profiles and business details
- **Bookings**: Installation requests with scheduling and pricing
- **Fee Structures**: Configurable commission rates per installer and service type
- **Job Assignments**: Installer-booking relationships and status tracking

### Authentication & Authorization
- Session-based authentication using express-session
- Multi-role support (Customer, Installer, Admin)
- OIDC integration for Replit authentication
- Secure session storage in PostgreSQL

## Data Flow

1. **Customer Journey**:
   - Photo upload → AI room analysis → Service selection → Scheduling → Payment → QR code generation

2. **AI Processing**:
   - Room photo analysis using GPT-4o
   - Installation recommendations based on room layout
   - TV placement visualization suggestions

3. **Installer Workflow**:
   - Job notification → Acceptance → Completion → Payment processing

4. **Admin Operations**:
   - Fee structure management → Booking oversight → Revenue tracking

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI primitives
- **openai**: AI integration for room analysis
- **qrcode**: QR code generation for booking tracking

### Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Fast JavaScript bundling

### File Upload & Processing
- **multer**: Multipart form data handling
- **Image processing**: Base64 encoding for AI analysis

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

- **Development**: `npm run dev` - Runs with hot reloading via Vite
- **Build**: `npm run build` - Builds client with Vite, server with ESBuild
- **Production**: `npm run start` - Serves built application
- **Database**: `npm run db:push` - Applies schema changes to PostgreSQL

**Environment Variables Required**:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API access
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit environment identifier

**Port Configuration**: 
- Internal port 5000, external port 80 for web traffic
- Automatic port forwarding configured in .replit

## Current Status

**✅ Lead Generation Business Model Transformation Complete (July 1, 2025):**
- Transformed from commission-based to lead generation marketplace
- Customers book for free and pay installers directly (cash, card, bank transfer)
- Installers pay platform fixed lead fees (€12-€35) to access customer requests
- Platform revenue from connection fees instead of service commissions
- Complete installer wallet system with credit management and transaction tracking
- Real-time lead marketplace with profit margin calculations

**✅ New Revenue Structure:**
- Table Mount Small: €60 customer estimate, €12 lead fee (80% installer margin)
- Bronze Wall Mount: €120 customer estimate, €20 lead fee (83% installer margin)
- Silver Premium: €180 customer estimate, €25 lead fee (86% installer margin)
- Gold Premium Large: €380 customer estimate, €35 lead fee (91% installer margin)
- Fixed lead fees provide predictable platform revenue vs. variable commissions

**Authentication System Fixed:**
- Restored proper Replit Auth OIDC integration (June 19, 2025)
- Removed temporary localStorage admin session workaround
- All /api/login and /api/logout routes now work correctly with Replit authentication
- Fixed session handling and logout flow with proper session destruction

**✅ Real-Time Analytics System:**
- Replaced all mock/fallback data with authentic database-driven analytics
- Website metrics now track actual bookings, revenue, and user activity
- Real-time statistics refresh every 30 seconds for live dashboard updates
- Geographic data extracted from actual booking addresses
- Service popularity calculated from real booking data
- Monthly trends generated from authentic booking dates
- Admin dashboard shows live website performance data

**Current Implementation Status:**

**✅ Registration System:**
- Client registration: Automatic via Replit Auth (no separate registration needed)
- Installer registration: Full registration form with business details, specialties, and service areas
- Installer login: Demo access with password "demo123" for any email address
- Automatic installer profile creation for demo users

**✅ Uber-Style Installer Matching System:**
- Interactive map of Ireland showing real-time installation requests
- Real-time request acceptance/decline with immediate customer notifications
- Email and SMS notification system for booking confirmations
- Online/offline availability toggle for installers
- Color-coded urgency levels (standard, urgent, emergency)
- Distance-based job matching with earnings display

**✅ Core Features Completed:**
- AI generation now only occurs at final booking summary step
- Realistic AI prompts implemented using DALL-E for TV installation previews  
- Progressive preview messaging added throughout booking flow
- Database fallback system implemented for demo functionality
- Booking system works end-to-end with proper error handling
- Uber-style real-time installer dashboard with map view and list view
- Customer notification system (email/SMS) when requests are accepted
- AI TV recommendation service with 5-question personalized questionnaire
- **Comprehensive Admin Dashboard with full platform control**
- **Multi-role authentication system with admin access controls**
- **Complete metrics dashboard showing platform performance**
- **Stripe Payment Processing with secure checkout and confirmation system**
- **Complete payment flow from booking creation to payment success**
- **Integrated payment endpoints with webhook support for real-time updates**
- **Google Workspace Email Integration with professional HTML templates**
- **Privacy Policy page with GDPR compliance and comprehensive user rights**
- **Enhanced camera functionality with improved mobile device support**
- **Professional footer component with business information and legal links**

**✅ Real-Time Matching Flow:**
1. Customer submits installation request → appears on installer map
2. Installer views requests on interactive Ireland map or list view
3. Installer accepts request → customer receives instant email/SMS notification
4. Both parties can proceed with scheduling and project commencement

**Database Configuration:**
The application now includes a robust fallback system. When the database is unavailable, it creates temporary bookings for demonstration purposes while providing clear feedback about database connectivity.

**Recent Major Updates:**
- **Guest Access System**: Modified authentication to allow public access to main features with guest booking limits (2 tries per day)
- **Replit Auth Integration**: Replaced custom authentication with proper OIDC implementation using Replit as identity provider
- **Secure Session Management**: Implemented PostgreSQL-backed session storage with proper user management
- **Freemium Model**: Users can try AI preview service twice daily without registration, unlimited access with authentication
- **Usage Tracking**: Local storage tracks daily usage with automatic reset, encouraging user registration after limits
- **Uber-Style System**: Transformed installer dashboard into real-time request matching system
- **Interactive Map**: Added clickable Ireland map with color-coded request markers
- **Notification System**: Implemented email/SMS notifications for booking confirmations
- **Real-Time Updates**: Added 30-second refresh intervals for live request updates
- **API Endpoints**: Created complete REST API for installer request management
- **AI TV Recommendation**: Added personalized 5-question quiz using OpenAI to recommend optimal TV types
- **TV Technology Matching**: Integrated QLED, MINI LED, OLED, 144Hz Frame TV, and anti-reflection recommendations
- **Geographic Enhancement**: Added comprehensive Republic of Ireland coverage with all 32 counties
- **Device Expertise**: Enhanced installer registration with detailed device type selection
- **Partnership Integration**: Added Harvey Norman retailer partnership for product sourcing assistance
- **Enhanced Customer Review System**: Implemented complete review functionality with database schema, storage operations, and API endpoints
- **Real Customer Reviews**: Created comprehensive installer profile component displaying authentic customer feedback with star ratings and verified purchase badges
- **Review Management**: Added ability for customers to write detailed reviews with ratings, titles, and comments for completed bookings

## Changelog

- June 14, 2025: Initial setup
- June 14, 2025: Enhanced AI preview generation to maintain original room appearance while adding TV placement
- June 14, 2025: Added camera functionality with automatic image compression 
- June 14, 2025: Integrated booking flow inputs (wall type, mount type, concealment) into AI prompt generation
- June 14, 2025: Fixed AI timing to only generate at final step, improved realism in prompts, addressed database connection issues
- June 14, 2025: Enhanced installer registration with comprehensive Republic of Ireland coverage (all 32 counties)
- June 14, 2025: Added detailed device expertise selection and service area mapping for installers
- June 14, 2025: Integrated Harvey Norman partnership for product sourcing assistance in booking flow
- June 14, 2025: Implemented comprehensive installer service capabilities including emergency callouts and weekend availability
- June 14, 2025: Added AI TV recommendation service with 5-question personalized questionnaire using OpenAI GPT-4o
- June 14, 2025: Integrated TV technology matching for QLED, MINI LED, OLED, 144Hz Frame TV, and anti-reflection displays
- June 14, 2025: Created comprehensive recommendation engine considering usage, budget, room environment, gaming needs, and feature priorities
- June 14, 2025: Added contact form with pre-filled user preferences that sends detailed inquiry to admin email
- June 14, 2025: Implemented automatic customer confirmation emails with inquiry details and follow-up timeline
- June 15, 2025: Replaced custom authentication with Replit Auth using OpenID Connect (OIDC)
- June 15, 2025: Implemented secure session management with PostgreSQL storage and proper user operations
- June 15, 2025: Added authentication middleware and landing page for unauthenticated users
- June 15, 2025: Created user authentication header with profile information and logout functionality
- June 15, 2025: Implemented guest booking system allowing 2 free AI preview tries per day without registration
- June 15, 2025: Modified authentication flow to show public landing page with freemium access model
- June 15, 2025: Added usage tracking and daily reset functionality for guest users
- June 15, 2025: Implemented comprehensive admin dashboard with full platform control capabilities
- June 15, 2025: Added admin-only endpoints for user management, installer oversight, and booking administration
- June 15, 2025: Created complete metrics dashboard showing platform performance and system health
- June 15, 2025: Integrated Stripe payment processing with secure checkout flow and booking confirmation system
- June 15, 2025: Implemented payment endpoints, checkout page, and booking success page with QR code generation
- June 15, 2025: Modified booking flow to redirect to Stripe Elements for secure payment processing
- June 15, 2025: Added comprehensive payment tracking to admin dashboard with transaction history, payment status monitoring, and revenue analytics
- June 15, 2025: Enhanced database schema with payment fields for tracking Stripe payment intents, status, and amounts
- June 15, 2025: Implemented Payment Management section in admin dashboard showing successful, pending, and failed payments with detailed transaction table
- June 15, 2025: Improved mobile UI design for admin dashboard with responsive tab navigation and mobile-friendly card layouts
- June 15, 2025: Enhanced tab navigation to work better on mobile with icon/text combinations and responsive grid layouts
- June 15, 2025: Added mobile card view for payment transactions with separate mobile and desktop layouts for optimal viewing experience
- June 15, 2025: Fixed AI preview timing issue - AI generation now only occurs at final booking summary step, not during TV size selection
- June 15, 2025: Restored room analysis functionality to photo upload step, displaying AI recommendations and warnings immediately after upload
- June 15, 2025: Fixed image persistence throughout booking flow with proper base64 data URL formatting
- June 15, 2025: Resolved booking creation failures by adding missing createUser method and fixing schema imports
- June 15, 2025: Fixed broken navigation links by creating How It Works, Pricing, and Our Installers pages with proper routing
- June 15, 2025: Resolved runtime errors and authentication issues, fixed OIDC configuration and Passport strategy registration
- June 15, 2025: Complete rebranding from SmartTVMount to tradesbook.ie across all platform components, navigation, pages, and email templates
- June 15, 2025: Implemented comprehensive customer review system with database schema, storage operations, and API endpoints for authentic installer feedback
- June 15, 2025: Created enhanced installer profile component displaying real customer reviews with star ratings, verified purchase badges, and review writing functionality
- June 15, 2025: Updated Our Installers page to showcase installer profiles with integrated customer review system and modal dialogs for full profile viewing
- June 16, 2025: Optimized AI room preview system with aggressive room preservation prompts, gpt-image-1 model, and reduced image size (512x512) for faster generation
- June 16, 2025: Fixed booking creation validation errors by correcting data type handling, adding missing database columns, and resolving schema constraint issues
- June 16, 2025: Enhanced TV recommendation system with real-time market data integration using Perplexity API for current pricing, availability, and market insights
- June 16, 2025: Added live market analysis displaying current TV models, pricing trends, best deals, and retailer availability from Irish market sources
- June 16, 2025: Implemented dual AI system: Perplexity for real-time market data + OpenAI for personalized analysis and recommendation logic
- June 16, 2025: Added installation difficulty prediction to photo upload step with AI-powered complexity assessment, time estimates, and price impact warnings
- June 16, 2025: Enhanced TV recommendation display to prominently feature actual product models with specific model numbers, current Irish pricing, and availability from major retailers
- June 16, 2025: Integrated visual difficulty indicators (Easy/Moderate/Difficult/Expert) with color-coded complexity levels and detailed installation factors analysis
- June 16, 2025: Redesigned Current Market Insights section with improved visual hierarchy, clean formatting, and dedicated sections for market analysis, pricing trends, and future considerations
- June 16, 2025: Enhanced Best Deals section with card-based layout and better visual presentation of promotional offers from Irish retailers
- June 17, 2025: Added OHK Energy solar panel installation section on homepage for generating sales leads with commission-based referral system
- June 17, 2025: Created comprehensive solar enquiry form with contact details, property information, and SEAI grant preferences
- June 17, 2025: Implemented solar enquiry database schema and API endpoints for lead storage and admin dashboard management
- June 17, 2025: Added email notification system for new solar leads with automatic admin alerts and customer confirmation
- June 17, 2025: Fixed non-functional booking management action buttons in admin dashboard with proper view and edit dialog functionality
- June 17, 2025: Enhanced AI preview generation to incorporate all booking selections including cable concealment and soundbar installation for accurate customer previews
- June 17, 2025: Fixed QR code display in admin dashboard to show actual scannable QR images instead of reference text codes
- June 20, 2025: Replaced mock installation data with real database queries from bookings table for Installation Coverage Map and Statistics
- June 20, 2025: Implemented intelligent county extraction from booking addresses to accurately populate installation location data
- June 20, 2025: Added test booking data across Irish counties to demonstrate real-time installation tracking functionality
- June 21, 2025: Fixed pricing discrepancy in service selection - implemented dynamic commission-included pricing based on TV size
- June 21, 2025: Updated service filtering logic to show only appropriate services for selected TV size (no smaller options after selection)
- June 21, 2025: Removed hourly rate field from installer registration form as installers receive set fees, not hourly rates
- June 26, 2025: Integrated Google Workspace email functionality with Gmail API for professional email communications
- June 26, 2025: Added comprehensive privacy policy page with GDPR compliance and user rights information
- June 26, 2025: Enhanced booking confirmation system with professional HTML email templates for customers and installers
- June 26, 2025: Created Gmail service module with booking confirmations, installer notifications, and admin alerts
- June 26, 2025: Added comprehensive footer component with privacy policy link and business information
- June 26, 2025: Fixed camera initialization issue in photo upload with improved error handling and mobile support
- June 26, 2025: Created complete legal documentation suite including Terms of Service, Cookie Policy, and GDPR Compliance pages
- June 26, 2025: Added proper routing for all legal pages and updated footer navigation with working links
- June 26, 2025: Updated footer social media links with authentic tradesbook.ie social media accounts
- June 26, 2025: Successfully configured Gmail API with web application OAuth credentials for professional email notifications
- June 26, 2025: Implemented working email notification system for bookings, TV recommendations, and solar enquiries
- June 26, 2025: Completed comprehensive email testing validation - all notification types working with professional HTML templates
- June 26, 2025: Fixed solar enquiry database schema and confirmed all email types send successfully to valid addresses
- June 26, 2025: Fixed email delivery issues by implementing proper email configuration system with valid addresses
- June 26, 2025: Resolved installer notification delivery problems and missing job details (earnings now display correctly)
- June 26, 2025: Updated email configuration to use production Google Workspace aliases (bookings@, installer@, noreply@ routing correctly)
- June 26, 2025: Confirmed email system working with proper alias routing - customer emails via bookings@ and installer notifications via installer@
- June 26, 2025: Corrected email flow logic - customer confirmations from noreply@ (prevents spam), installer notifications from installer@ (enables communication)
- June 26, 2025: Fixed QR code display issues across platform - created reliable QR component with proper error handling and fallback states
- June 26, 2025: Enhanced email templates with embedded QR code images - emails now include actual visual QR codes generated as base64 data URLs
- June 26, 2025: Fixed QR tracking URL functionality - added complete booking tracking page with professional styling and proper error handling
- June 26, 2025: Resolved database schema issues preventing QR tracking - added missing columns to match Drizzle schema requirements
- June 26, 2025: Confirmed complete QR code system operational - visual codes in emails link to working tracking pages with booking details
- June 26, 2025: Successfully delivered complete booking flow email simulation to customer with all 5 stages: confirmation, payment authorization, installer assignment, completion receipt, and follow-up review request
- June 26, 2025: Validated end-to-end email system with professional HTML templates, embedded QR codes as base64 images, proper Gmail API delivery, and functional tracking URLs
- June 26, 2025: Fixed QR code display issues in emails - QR codes now properly embed as visual images (2062 character base64 data URLs) with correct sizing and fallback handling
- June 26, 2025: Created functional review system with /review/:qrCode page, comprehensive review submission form, star ratings, and API endpoints for review processing
- June 26, 2025: Implemented referral system with /refer page, unique referral link generation, social sharing options, and €25 reward tracking
- June 26, 2025: Resolved all 404 link errors - review and referral links in emails now lead to fully functional pages with proper routing and UI components
- June 26, 2025: Completed comprehensive referral system with admin dashboard controls for setting referral reward amounts and discount percentages
- June 26, 2025: Added referral code input field to booking contact form with real-time validation and automatic discount calculations
- June 26, 2025: Implemented referral functionality in booking context with SET_REFERRAL action and proper discount application
- June 26, 2025: Successfully tested complete booking flow email simulation to jude.okun@gmail.com with referral discounts and professional formatting
- June 26, 2025: Added comprehensive solar registration form to homepage with OHK Energy branding, professional styling, and full API integration
- June 26, 2025: Solar form includes essential fields (name, email, phone, county, electricity bill) and connects to existing enquiry system with Gmail notifications
- June 26, 2025: Fixed TV recommendation page formatting issues - cleaned up Current Market Insights display, updated section heading to "Alternative TV Models Available", changed contact form title from "Speak with a Salesperson" to "Contact TV Expert"
- June 26, 2025: Confirmed TV recommendation contact form email functionality working properly - admin and customer notifications sending successfully via Gmail API
- June 27, 2025: Implemented Harvey Norman Carrickmines consultation booking system for in-store TV expert meetings
- June 27, 2025: Added comprehensive consultation booking component with Google Maps integration, store information, and professional booking form
- June 27, 2025: Created consultation_bookings database table and API endpoints for managing in-store appointment requests
- June 27, 2025: Integrated consultation booking into TV recommendation flow with email notifications for both admin and customers
- June 27, 2025: Added "subject to availability" disclaimers and removed all "in stock" references from TV recommendations
- June 27, 2025: Enhanced consultation booking emails to include user's quiz inputs for better consultant preparation and alternative suggestions
- June 28, 2025: Updated Book Your TV Installation page with improved wording and increased daily AI preview limit from 2 to 3 tries
- June 28, 2025: Removed "Guest Booking" terminology and clarified that limits apply to AI room generation, not the booking process
- June 28, 2025: Implemented comprehensive email verification system for new user signups with automatic verification emails
- June 28, 2025: Added email verification database fields, API endpoints, and professional verification page with success/error handling
- June 28, 2025: Integrated email verification into Replit Auth flow - new users receive verification emails automatically upon account creation
- June 28, 2025: Created complete verification workflow with 24-hour token expiration, resend functionality, and Gmail integration
- June 28, 2025: Fixed OAuth authentication callback failures by implementing comprehensive error handling and guest login bypass
- June 28, 2025: Added guest authentication mode to resolve Replit OAuth domain configuration issues
- June 28, 2025: Updated navigation components with "Continue as Guest" option for immediate platform access
- June 28, 2025: Resolved OAuth callback Internal Server Error with proper strategy validation and callback URL logging
- June 28, 2025: Completed full OAuth authentication configuration with multi-domain support for Replit, localhost, and tradesbook.ie
- June 28, 2025: Restored complete email verification system for new OAuth users with automatic verification emails
- June 28, 2025: Implemented comprehensive OAuth strategy registration with proper callback URL routing for all deployment environments
- June 28, 2025: Implemented role-based OAuth authentication differentiation for customer/installer/admin signups
- June 28, 2025: Added session-based role tracking to OAuth flow with automatic installer profile creation
- June 28, 2025: Updated installer login and registration pages with OAuth integration for streamlined onboarding
- June 28, 2025: Enhanced navigation with installer-specific authentication links and role-based redirects
- June 28, 2025: Implemented comprehensive real-time analytics system replacing all mock/fallback data with authentic database metrics
- June 28, 2025: Created public analytics endpoints tracking actual bookings, revenue, service popularity, and geographic data
- June 28, 2025: Added real-time statistics with 30-second refresh intervals for live dashboard updates
- June 28, 2025: Replaced static service tier data with dynamic pricing based on actual booking patterns
- June 28, 2025: Fixed OAuth authentication callback session establishment with proper passport serialization/deserialization
- June 28, 2025: Enhanced session management to store user ID and retrieve full user data from database during authentication
- June 28, 2025: Implemented comprehensive OAuth callback debugging with detailed logging for authentication flow troubleshooting
- June 29, 2025: **Successfully completed OAuth Sign-In/Sign-Up flow separation with proper functionality verification**
- June 29, 2025: **Fixed SERVICE_TIERS import error preventing service selection from loading**
- June 29, 2025: **Added separate Sign In (ghost) and Sign Up (primary) buttons to both desktop and mobile navigation**
- June 29, 2025: **Implemented proper OAuth flow differentiation: /api/login uses prompt="login", /api/signup uses prompt="consent"**
- June 29, 2025: **Enhanced session tracking with authAction field to distinguish login vs signup attempts**
- June 29, 2025: **Added account validation logic to prevent mismatched authentication flows**
- June 29, 2025: **Confirmed OAuth consent screen displays correctly for new user registrations**
- June 29, 2025: **Successfully resolved authentication session persistence issues**
- June 29, 2025: **Fixed database schema alignment and user account creation for OAuth flow**
- June 29, 2025: **Verified OAuth authentication working on both development and production domains**
- June 29, 2025: **Confirmed tradesbook.ie production OAuth endpoints properly configured and responding**
- June 29, 2025: **Authenticated users now properly display in navigation with admin dashboard access**
- June 29, 2025: **Fixed referral tracking accuracy - replaced hardcoded values with authentic database calculations**
- June 29, 2025: **Referral statistics now display real data: active codes, total referrals, and earnings from database**
- June 30, 2025: **Fixed wall mount options visibility to customers in booking flow**
- June 30, 2025: **Created proper MountTypeSelection component with wall mount options, pricing (€25-€85), and real-time total calculation**
- June 30, 2025: **Removed missing photo references from wall type selection - implemented clean simple card layouts for better user experience**
- June 30, 2025: **Added "no addons needed" option to booking addons step with proper logic and UI feedback**
- June 30, 2025: **Enhanced installer dashboard to display complete client booking selections including TV size, wall type, mount type, wall mount, addons, and difficulty level**
- June 30, 2025: **Created comprehensive booking details API endpoints for installers with real database integration showing all customer choices**
- July 1, 2025: **Completed full transformation of installer and customer dashboards to reflect lead generation business model**
- July 1, 2025: **Updated installer dashboard terminology: "Jobs This Month" → "Leads This Month", "Assigned Jobs" → "Purchased Leads", added "Lead Fee Paid" indicators**
- July 1, 2025: **Transformed customer dashboard messaging: "Booking Status" → "Request Status", "Booking Confirmed" → "Request Submitted", added "Pay Installer Directly" payment method display**
- July 1, 2025: **Enhanced customer dashboard with clear lead generation messaging: "Your installation request is live on our platform" and payment options (Cash • Card • Bank Transfer)**
- July 1, 2025: **Database cleanup completed: Removed obsolete feeStructures table and commission-based schema elements no longer needed in lead generation model**
- July 1, 2025: **Fixed accessibility issues: Added proper DialogTitle and DialogDescription components to login modals for screen reader compatibility**
- July 1, 2025: **Completed Harvey Norman sales staff referral system with full end-to-end functionality**
- July 1, 2025: **Added Harvey Norman referral management section to admin dashboard for creating and managing sales staff codes**
- July 1, 2025: **Updated contact form to capture and validate Harvey Norman referral codes with real-time discount calculation**
- July 1, 2025: **Implemented 10% customer discount system with installer subsidy structure maintaining platform revenue**
- July 1, 2025: **Fixed database schema issues for referral_codes table to support sales staff codes with nullable user_id**
- July 1, 2025: **Tested complete Harvey Norman referral flow: code creation, validation, discount application, and admin management**
- July 1, 2025: **Fixed duplicate admin buttons in navigation - kept only right-aligned admin button for clean UI**
- July 1, 2025: **Enhanced service selection cards - detailed descriptions now display as inline bullet points for better readability**
- July 1, 2025: **Fixed admin dashboard revenue analytics - replaced "€null" values with accurate platform revenue calculations using lead fees (€12-€35)**
- July 1, 2025: **Added legacy service type mapping for "Premium Wall Mount" to "silver" tier ensuring backward compatibility with existing bookings**
- July 1, 2025: **Fixed admin users management - endpoint now properly queries users table instead of building from incomplete booking data**
- July 1, 2025: **Restored missing 'soniceccko' user record in database with correct registration details (ID: 44041296, June 19, 2025)**
- July 1, 2025: **Updated admin user management interface to replace "Total Spent" with "Lead Requests" reflecting lead generation business model**
- July 1, 2025: **Transformed admin dashboard "Fee Management" to "Lead Pricing Management" reflecting lead generation business model instead of commission-based structure**
- July 1, 2025: **Updated pricing display to show fixed lead fees (€12-€35), customer estimates (€60-€380), and installer profit margins (80-91%) rather than commission percentages**
- July 1, 2025: **Added clear business model explanation: Fixed lead fees as revenue source, customers pay installers directly via cash/card/transfer, predictable platform revenue**
- July 1, 2025: **Transformed "System" tab to "Platform Insights" with lead generation marketplace metrics instead of generic server statistics**
- July 1, 2025: **Added comprehensive platform insights: Monthly lead revenue projections, average lead values, conversion rates, installer retention metrics**
- July 1, 2025: **Created revenue breakdown by service type showing estimated monthly lead volume and platform earnings from each tier**
- July 1, 2025: **Added platform health indicators displaying installer margins (80-91%), lead fee ranges (€12-€35), and annual revenue projections**
- July 1, 2025: **Updated homepage and pricing page display to show "From €X" format instead of fixed prices to reflect installer rate variability**
- July 1, 2025: **Completed wall mount pricing system transformation - moved from hardcoded values to fully database-driven pricing**
- July 1, 2025: **Created wall_mount_pricing table with 6 mount options (€25-€85) including Fixed, Tilting, and Full Motion categories**
- July 1, 2025: **Built complete WallMountPricingManagement admin component with CRUD operations for real-time pricing control**
- July 1, 2025: **Updated MountTypeSelection component to use React Query for dynamic pricing instead of static values**
- July 1, 2025: **Added wall mount pricing management section to admin dashboard under "Pricing" tab**
- July 1, 2025: **Fixed database schema alignment - added needs_wall_mount and wall_mount_option columns to bookings table**
- July 1, 2025: **Resolved accessibility warnings by adding proper DialogTitle and aria-describedby attributes to all dialog components**
- July 1, 2025: **Updated homepage messaging from "Start AI Preview" to "Book TV Installation" reflecting complete booking process**
- July 1, 2025: **Fixed TV recommendation budget constraint enforcement - AI now strictly adheres to selected budget ranges**
- July 1, 2025: **Enhanced TV recommendation prompts with specific budget restrictions and TV type mapping for each price tier**
- July 1, 2025: **Added budget validation function with fallback recommendations to prevent expensive TV suggestions for lower budgets**
- July 1, 2025: **Simplified TV recommendation service by removing problematic Perplexity integration causing timeouts**
- July 1, 2025: **Confirmed budget enforcement working: €400-800 budget recommends QLED, €1500-3000 budget recommends OLED**
- July 1, 2025: **Implemented comprehensive simplified authentication system to reduce booking psychological barriers**
- July 1, 2025: **Created SimplifiedAuthDialog component with three authentication pathways: Harvey Norman invoice, guest booking, and full OAuth registration**
- July 1, 2025: **Added prominent "Book Faster Than Ever" authentication showcase section to homepage with gradient cards demonstrating each option**
- July 1, 2025: **Built Harvey Norman invoice authentication service with database lookup for instant customer login using receipt numbers**
- July 1, 2025: **Enhanced navigation components (desktop and mobile) to include simplified authentication access points**
- July 1, 2025: **Integrated guest booking flow allowing users to start booking with just email and phone, bypassing full registration**
- July 1, 2025: **Fixed database schema issues by adding harvey_norman_invoice, invoice_verified, and registration_method columns to users table**
- July 1, 2025: **Created harvey_norman_invoices lookup table with sample data for testing invoice-based authentication**
- July 1, 2025: **Upgraded Harvey Norman invoice format to include store codes (HN-[STORE]-[NUMBER]) handling duplicate invoice numbers across different stores**
- July 1, 2025: **Implemented comprehensive store code mapping for all 16 Harvey Norman locations across Ireland**
- July 1, 2025: **Added complete store code coverage: BLA (Blanchardstown), CRK (Carrickmines), CAS (Castlebar), DRO (Drogheda), FON (Fonthill), GAL (Galway), KIN (Kinsale Road), LIM (Limerick), LIT (Little Island), NAA (Naas), RAT (Rathfarnham), SLI (Sligo), SWO (Swords), TAL (Tallaght), TRA (Tralee), WAT (Waterford)**
- July 1, 2025: **Enhanced database schema with customerPhone, storeName, and storeCode fields for comprehensive invoice tracking**
- July 1, 2025: **Updated UI guidance with complete store code reference and format examples for customer clarity**
- July 1, 2025: **Fixed critical session persistence bug in Harvey Norman invoice and guest booking authentication using req.login() for proper Passport session establishment**
- July 1, 2025: **Clarified contact information requirement: Invoice-authenticated users must still provide current contact details for installer communication, preventing reliance on potentially outdated invoice data**
- July 2, 2025: **Implemented comprehensive demo installer system with complete lead access protection to prevent revenue bypass**
- July 2, 2025: **Created test@tradesbook.ie demo account with password "demo123" for platform exploration without customer contact access**
- July 2, 2025: **Built two-tier lead system where demo accounts see simplified lead details but cannot purchase leads to access full customer information**
- July 2, 2025: **Added updateBooking method to storage interface and verified end-to-end lead purchase functionality working correctly**
- July 2, 2025: **Redesigned navigation component for better consistency across desktop and mobile views with improved visual hierarchy**
- July 2, 2025: **Enhanced mobile navigation with organized sections (Navigation, For Installers), proper spacing, hover effects, and cleaner layout**
- July 2, 2025: **Improved desktop navigation with better button styling, spacing, and visual consistency using proper hover states and icons**
- July 2, 2025: **Completed transformation to simplified email/password authentication system for installers**
- July 2, 2025: **Removed OAuth complexity and implemented secure bcrypt password hashing for installer registration and login**
- July 2, 2025: **Fixed password authentication bug where login route used base64 encoding while storage expected bcrypt hashing**
- July 2, 2025: **Updated demo account with proper bcrypt password hash and resolved authentication flow end-to-end**
- July 2, 2025: **Installer authentication now works: email/password → profile creation → admin approval → platform access**
- July 2, 2025: **Successfully implemented dual authentication architecture with complete OAuth/installer separation**
- July 2, 2025: **OAuth routes now redirect installer requests to email/password registration, preventing authentication conflicts**
- July 2, 2025: **Fixed OAuth callback handling to properly redirect installer signup attempts to dedicated registration pages**
- July 2, 2025: **Verified end-to-end functionality: OAuth for customers/admins, email/password for installers**
- July 2, 2025: **Modified installer dashboard to always show available jobs regardless of online status**
- July 2, 2025: **Updated online toggle to serve as availability indicator for platform statistics only**
- July 2, 2025: **Jobs now visible at all times with clarified messaging about online status purpose**
- July 2, 2025: **Enhanced demo account credit simulation system for testing lead purchasing functionality**
- July 2, 2025: **Added special handling for installer ID 2 to allow credit addition without payment processing**
- July 2, 2025: **Updated wallet management interface with demo-specific messaging and successful credit simulation**
- July 2, 2025: **Implemented comprehensive fresh mock lead generation system for demo account**
- July 2, 2025: **Fixed duplicate login routes causing demo account authentication bypass**
- July 2, 2025: **Implemented optimized demo lead management system with efficient database usage**
- July 2, 2025: **Fixed demo leads to exactly 3 consistent leads (QR-DEMO-001, QR-DEMO-002, QR-DEMO-003) instead of creating new random leads**
- July 2, 2025: **Optimized system reuses existing demo leads by resetting status and installer assignment rather than creating new database entries**
- July 2, 2025: **Fixed demo account status persistence issue where status updates weren't being applied to API responses**
- July 2, 2025: **Status updates now persist correctly across requests with proper memory cache implementation**
- July 2, 2025: **Performed major database cleanup - removed 43 unnecessary demo bookings (91% reduction from 47 to 4 bookings)**
- July 2, 2025: **Optimized database efficiency by keeping only essential test bookings and current demo leads**
- July 2, 2025: **Fixed schedule proposal API call errors - corrected apiRequest parameter order and date conversion issues**
- July 2, 2025: **Schedule negotiation system now properly converts date strings to Date objects for Zod validation**
- July 2, 2025: **Resolved JSON serialization date issue by handling date conversion on backend before Zod validation**
- July 2, 2025: **Fixed Zod schema for schedule negotiations - accepts both string and Date types with automatic transformation**
- July 2, 2025: **Fixed demo lead duplication issue - disabled automatic creation of new demo bookings on login to prevent database bloat**
- July 2, 2025: **Cleaned up database - removed duplicate QR-DEMO-001 booking, system now maintains exactly 3 consistent demo leads**
- July 2, 2025: **Completed installer registration database constraint fix - resolved null phone field error**
- July 2, 2025: **Enhanced installer registration form with complete field validation (firstName, lastName, businessName, phone, address, county, email, password)**
- July 2, 2025: **Updated registerInstaller storage method to accept all required fields during creation**
- July 2, 2025: **Improved registration success flow with clear next steps and automatic redirect to login page**
- July 2, 2025: **Added comprehensive registration completion instructions including approval process timeline**
- July 2, 2025: **Implemented installer welcome email system using Gmail API with professional HTML templates**
- July 2, 2025: **Created sendInstallerWelcomeEmail function with step-by-step onboarding instructions and approval timeline**
- July 2, 2025: **Integrated email confirmation into registration endpoint - new installers automatically receive welcome emails**
- July 2, 2025: **Enhanced email templates with 4-step onboarding process, dashboard links, and support contact information**
- July 2, 2025: **Successfully resolved Gmail API authentication with fresh OAuth refresh token**
- July 2, 2025: **Confirmed end-to-end email delivery system working with unique Gmail message IDs**
- July 2, 2025: **Welcome email system fully operational for new installer registrations**
- July 2, 2025: **Implemented comprehensive installer approval/rejection email notification system**
- July 2, 2025: **Added automatic email notifications when admin approves or rejects installer applications**
- July 2, 2025: **Created professional email templates for both approval (with score/feedback) and rejection scenarios**
- July 2, 2025: **Integrated approval emails into admin dashboard workflow with Gmail API delivery confirmation**
- July 2, 2025: **Fixed profile photo upload file size limit to 2MB with comprehensive validation**
- July 2, 2025: **Added both client-side and server-side file size validation with immediate user feedback**
- July 2, 2025: **Enhanced multer configuration with proper error handling for oversized files**
- July 2, 2025: **Updated UI text across platform to consistently show 2MB limit instead of previous 10MB/5MB references**
- July 2, 2025: **Enhanced admin dashboard installer review popup with comprehensive profile information display**
- July 2, 2025: **Fixed responsive design issues for laptop screens - added proper scrolling and mobile optimization**
- July 2, 2025: **Organized installer review interface into structured sections: Basic Information, Enhanced Profile Information, and Profile Completion Status**
- July 2, 2025: **Implemented visual status indicators with professional styling and improved dialog layout for better user experience**
- July 2, 2025: **Completed installer deletion functionality for admin dashboard with full database integration**
- July 2, 2025: **Added deleteInstaller method to storage interface and implemented DELETE API endpoint with proper authentication middleware**
- July 2, 2025: **Fixed installer deletion parameter order issue in apiRequest function calls for proper DELETE request handling**
- July 2, 2025: **Enhanced delete confirmation dialog with detailed installer information and comprehensive error handling**
- July 2, 2025: **Made Public Liability Insurance field optional across all installer registration and profile forms**
- July 2, 2025: **Implemented comprehensive "uninsured" badge system for installer profiles without insurance information**
- July 2, 2025: **Added insurance status badges to installer dashboard, admin dashboard, and customer-facing installer profiles**
- July 2, 2025: **Enhanced installer profile displays with clear visual indicators: green "✓ Insured" badge with insurance details, or red "⚠ Uninsured" badge when no insurance provided**
- July 2, 2025: **Updated form validation to remove insurance requirements while maintaining clear messaging about optional nature of coverage**
- July 2, 2025: **Fixed Harvey Norman referral code formatting to use abbreviated format without hyphens**
- July 2, 2025: **Updated referral code generation from "HN-JOHN-CARRICKMINES" to "HNJOHNCRK" for cleaner display**
- July 2, 2025: **Added store abbreviation dropdown in admin dashboard for consistent code generation**
- July 2, 2025: **Updated customer-facing placeholder from "HN-JOHN-CRK" to "HNJOHNCRK" for clarity**
- July 2, 2025: **Enhanced referral code parsing to support both new abbreviated format and legacy hyphenated format for backward compatibility**
- July 2, 2025: **Fixed critical installer approval and deletion system issues**
- July 2, 2025: **Resolved duplicate API routes causing authentication failures**
- July 2, 2025: **Corrected frontend API request parameter order (method, url, data)**
- July 2, 2025: **Implemented proper cascade deletion for installers with foreign key constraint handling**
- July 2, 2025: **Added comprehensive approval workflow logging and email notification system**
- July 2, 2025: **Successfully verified end-to-end installer approval process with Gmail API integration**
- July 2, 2025: **Fixed React hooks ordering error in installer dashboard preventing access after approval**
- July 2, 2025: **Restored missing handleProfileUpdate function in installer dashboard for profile editing functionality**
- July 2, 2025: **Completed comprehensive installer dashboard data isolation fix**
- July 2, 2025: **Replaced hardcoded mock statistics (24 monthly jobs, €2850 earnings, 4.9 rating) with real installer-specific calculations**
- July 2, 2025: **Dashboard now calculates monthly jobs from actual past leads, earnings from real booking data, and ratings from authentic review statistics**
- July 2, 2025: **Fixed all component references from undefined 'requests' variable to proper 'availableRequests' data source**
- July 2, 2025: **Corrected IrelandMap component scope issue - now properly uses 'requests' prop instead of accessing undefined 'availableRequests'**
- July 2, 2025: **Each installer now sees authentic data: 0 monthly jobs, €0 earnings, 0 rating for installer 11 (accurate based on no activity)**
- July 2, 2025: **Completed separation of demo and real data systems for installer dashboard**
- July 2, 2025: **Removed demo bookings from database that were showing to all installers (Emma Collins, Michael Walsh @example.com)**
- July 2, 2025: **Demo account (installer ID 2) still receives demo leads for testing, all other installers see only real customer requests**
- July 2, 2025: **Fixed data isolation: Non-demo installers now see authentic customer requests (Michael Walsh urgent 75" Gold service in Galway)**
- July 2, 2025: **Database cleanup: Removed 4 fake demo bookings and related foreign key constraints for proper data segregation**
- July 2, 2025: **Implemented comprehensive Stripe-integrated credit payment system for installers**
- July 2, 2025: **Created dedicated credit checkout page with Stripe Elements integration for secure payment processing**
- July 2, 2025: **Enhanced installer wallet system with real payment processing (demo account continues with simulation)**
- July 2, 2025: **Added Stripe webhook support for automatic credit addition upon successful payment**
- July 2, 2025: **Fixed installer credit system - real installers now use Stripe checkout, demo account (ID: 2) uses simulation**
- July 2, 2025: **Credit purchase flow: Amount selection → Stripe checkout → Payment confirmation → Automatic wallet credit addition**
- July 2, 2025: **Updated preset credit amounts to €5, €15, €35, €100 (lowered minimum from €10 to €5, added €100 for bulk purchases)**
- July 2, 2025: **Fixed payment intent creation error by correcting storage method from getInstallerProfile to getInstaller**
- July 2, 2025: **Verified end-to-end credit payment system working with Stripe integration and webhook processing**
- July 2, 2025: **Enhanced admin dashboard user management interface to display both user roles (Customer/Admin) and registration types (OAuth/Invoice/Guest/Manual)**
- July 2, 2025: **Updated backend API to include role field in user data response for comprehensive user differentiation**
- July 2, 2025: **Implemented separate Role and Registration Type columns in user management table with color-coded badges**
- July 2, 2025: **Enhanced user deletion confirmation dialog and user details dialog to show both role and registration method information**
- July 2, 2025: **Added comprehensive user type filtering system allowing administrators to distinguish between customers, admins, and different registration methods**
- July 2, 2025: **Implemented comprehensive contact information protection system to prevent platform revenue bypass**
- July 2, 2025: **Protected installer API endpoint to hide personal contact details (phone, email, full address) from public view**
- July 2, 2025: **Added platform protection notices encouraging bookings through tradesbook.ie instead of direct contact**
- July 2, 2025: **Enhanced installer profile display to show only business information while protecting personal contact data**
- July 2, 2025: **Fixed critical design flaw that allowed customers to contact installers directly without using platform booking system**
- July 3, 2025: **Completed comprehensive installer authentication persistence system with session management**
- July 3, 2025: **Created useInstallerAuth hook for persistent authentication state across page navigation**
- July 3, 2025: **Enhanced navigation components with installer-specific authentication display and logout functionality**
- July 3, 2025: **Added proper installer logout endpoints with session destruction and localStorage cleanup**
- July 3, 2025: **Fixed OAuth authentication system for admin/customer users with proper session persistence**
- July 3, 2025: **Implemented dual authentication architecture: OAuth for customers/admins, email/password for installers**
- July 3, 2025: **Fixed hardcoded Dublin TV Solutions installer auto-creation issue**
- July 3, 2025: **Added ENABLE_DEMO_DATA environment variable to control demo installer creation**
- July 3, 2025: **Resolved referral codes crash in admin dashboard with proper error handling**
- July 3, 2025: **Enhanced admin dashboard with safe array handling and user-friendly error messages**
- July 3, 2025: **Extended ENABLE_DEMO_DATA environment variable control to mock users and bookings**
- July 3, 2025: **Protected demo installer auto-creation in login routes with environment variable checks**
- July 3, 2025: **Completed comprehensive demo data control system across all test data creation functions**
- July 3, 2025: **Implemented authentic platform statistics system replacing hardcoded data with real database calculations**
- July 3, 2025: **Created /api/platform/stats endpoint showing real installer count, counties covered, average ratings, and completed installations**
- July 3, 2025: **Updated "Our Installers" page to display accurate platform metrics instead of inflated placeholder numbers (50+ installers, 16 counties, 4.9 rating, 2500+ installations)**
- July 3, 2025: **Implemented comprehensive email template management system for administrators**
- July 3, 2025: **Created 18 pre-configured email templates covering all platform workflows (booking confirmations, installer notifications, payment processing, admin alerts, solar enquiries, referral rewards)**
- July 3, 2025: **Added complete email template CRUD operations with preview functionality and test email capabilities**
- July 3, 2025: **Enhanced admin dashboard with professional email template management interface using shortcodes for dynamic content**
- July 3, 2025: **Email templates now support customizable sender addresses, reply-to fields, and comprehensive shortcode system for personalization**
- July 3, 2025: **Fixed booking submission schema mismatch between frontend and backend causing validation errors**
- July 3, 2025: **Updated frontend booking payload to match database schema (contactName, serviceType, estimatedPrice instead of serviceTierId, subtotal)**
- July 3, 2025: **Resolved TypeScript validation errors in contact form and booking submission hooks**
- July 3, 2025: **Fixed admin notification email format - replaced raw JSON data display with properly formatted booking details**
- July 3, 2025: **Resolved critical booking validation errors preventing submission: fixed roomAnalysis object-to-string conversion and added missing referralDiscount field handling**
- July 3, 2025: **Updated Drizzle schema validation to properly handle roomAnalysis and referralDiscount field types with correct string formatting**
- July 3, 2025: **Enhanced homepage with prominent "Track Your Booking" section for easy access to booking history**
- July 3, 2025: **Added "Track Booking" navigation links to both desktop and mobile navigation menus**
- July 3, 2025: **Fixed critical admin dashboard HTTP token errors by correcting apiRequest parameter order (method, url, data) for DELETE and PATCH requests**
- July 3, 2025: **Admin booking deletion and status update system now fully operational with real-time synchronization**
- July 3, 2025: **Fixed booking tracking system - corrected frontend API call to properly pass tracking code as query parameter**
- July 3, 2025: **Fixed addons display issue in booking tracker - properly format addon objects to show readable names instead of "[object Object]"**
- July 3, 2025: **Enhanced installer notification system for new bookings with lead generation messaging**
- July 3, 2025: **Updated booking creation email flow to notify only approved installers (status === 'approved') instead of all registered installers**
- July 3, 2025: **Redesigned installer notification emails with lead generation focus - emphasizes paid lead opportunities, earnings breakdown, and first-come-first-served urgency**
- July 3, 2025: **Added comprehensive lead fee calculations and profit margins to installer email notifications**
- July 3, 2025: **Enhanced email subject lines and content to clearly communicate lead purchase opportunities to approved installers**
- July 3, 2025: **Fixed critical installer dashboard visibility issue - bookings now properly appear in available leads**
- July 3, 2025: **Updated available-leads endpoint to include "open" status bookings alongside "pending", "urgent", and "confirmed" statuses**
- July 3, 2025: **Resolved booking discovery problem where new bookings with "open" status weren't visible to installers for lead purchase**
- July 3, 2025: **Completed admin email verification management system - administrators can now send re-verification emails to unverified customers directly from User Management tab with proper status indicators and error handling**
- July 3, 2025: **Fixed OAuth user email verification display issue and improved user name display for users without first/last names**
- July 3, 2025: **Corrected invoice user email verification logic - invoice users now properly show as "Unverified" since they authenticate via invoice number, not email verification**
- July 3, 2025: **Implemented admin user deletion protection - disabled delete functionality for admin users in both frontend UI (disabled button with tooltip) and backend API (403 forbidden response) to prevent accidental removal of important accounts**
- July 3, 2025: **Enhanced admin booking details dialog with comprehensive information display including customer details, service specifications, pricing breakdown, location/schedule info, installer assignment status, and system information for better administrative oversight**
- July 3, 2025: **Fixed AI Room Analysis display to show formatted, readable text instead of raw JSON data - now displays recommendations, warnings, difficulty assessment, and confidence levels in organized sections with proper visual formatting**
- July 3, 2025: **Completed comprehensive solar enquiry management system enhancement with status editing dialogs, deletion confirmation, and full database CRUD operations**
- July 3, 2025: **Added complete OHK Energy solar leads management with 7 status options (new, contacted, qualified, converted, not_interested, closed, lost) and color-coded progression tracking**
- July 3, 2025: **Fixed Revenue Breakdown by Service Type to use authentic database data instead of hardcoded fallback values - now queries real service tiers and calculates accurate lead revenue from actual bookings**
- July 3, 2025: **Enhanced platform insights endpoint with proper service type mapping and legacy booking compatibility for accurate revenue analytics**
- July 3, 2025: **Implemented comprehensive cascade deletion system for booking management in admin dashboard**
- July 3, 2025: **Fixed critical booking deletion issue preventing administrators from deleting 'pending' status bookings**
- July 3, 2025: **Enhanced deleteBooking method with proper foreign key constraint handling for all related tables (declined_requests, job_assignments, schedule_negotiations, lead_quality_tracking, reviews, anti_manipulation, customer_verification)**
- July 3, 2025: **Tested and verified complete cascade deletion functionality - admin can now delete any booking regardless of status**
- July 4, 2025: **Fixed broken tracking URLs in customer booking emails - replaced hardcoded tradesbook.ie domain with environment-based URL generation for proper Replit deployment compatibility**
- July 4, 2025: **Updated Gmail service tracking URL generation to use REPL_ID-based URLs instead of production domain for development and testing environments**
- July 4, 2025: **Successfully tested tracking URL fix - booking confirmation email sent to jude.okun@gmail.com with correct domain (https://3cc91570-fa8c-43bf-95a5-55159acf6009.replit.app/track/BK-hK75xZtKv3)**
- July 4, 2025: **Added test-booking-email endpoint for verification and testing of email delivery with proper tracking URL generation**
- July 4, 2025: **Fixed "Total Cost: €undefined" display issue in tracking page and emails by updating field mapping from totalPrice to estimatedTotal**
- July 4, 2025: **Updated booking confirmation email template to use proper fallback logic for price display (estimatedTotal || totalPrice || 'N/A')**

## User Preferences

Preferred communication style: Simple, everyday language.