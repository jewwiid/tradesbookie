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

**Current Implementation Status:**

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

## User Preferences

Preferred communication style: Simple, everyday language.