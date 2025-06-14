# SmartTVMount - TV Installation Service Platform

## Overview

SmartTVMount is a full-stack web application that connects customers with professional TV installers through an intelligent booking system. The platform features AI-powered room analysis, dynamic pricing, QR code tracking, and multi-role dashboards for customers, installers, and administrators.

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

**✅ Real-Time Matching Flow:**
1. Customer submits installation request → appears on installer map
2. Installer views requests on interactive Ireland map or list view
3. Installer accepts request → customer receives instant email/SMS notification
4. Both parties can proceed with scheduling and project commencement

**Database Configuration:**
The application now includes a robust fallback system. When the database is unavailable, it creates temporary bookings for demonstration purposes while providing clear feedback about database connectivity.

**Recent Major Updates:**
- **Uber-Style System**: Transformed installer dashboard into real-time request matching system
- **Interactive Map**: Added clickable Ireland map with color-coded request markers
- **Notification System**: Implemented email/SMS notifications for booking confirmations
- **Real-Time Updates**: Added 30-second refresh intervals for live request updates
- **API Endpoints**: Created complete REST API for installer request management
- **Geographic Enhancement**: Added comprehensive Republic of Ireland coverage with all 32 counties
- **Device Expertise**: Enhanced installer registration with detailed device type selection
- **Partnership Integration**: Added Harvey Norman retailer partnership for product sourcing assistance

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

## User Preferences

Preferred communication style: Simple, everyday language.