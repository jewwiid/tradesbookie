# tradesbook.ie - TV Installation Service Platform

## Overview
tradesbook.ie is a full-stack web application that connects customers with professional TV installers via an intelligent booking system. Key features include AI-powered room analysis for installation recommendations, dynamic pricing, QR code tracking for bookings, and multi-role dashboards for customers, installers, and administrators. The platform has transitioned to a lead generation marketplace model, where installers pay a fixed fee for customer leads, and customers pay installers directly. This shifts the platform's revenue source from commissions to lead connection fees, enhancing predictability and scalability.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The application uses a modern full-stack architecture.

**Frontend**: React 18 with TypeScript, Vite, Wouter for routing, Radix UI primitives, and Tailwind CSS with shadcn/ui for styling. State management uses React Query for server state and local component state. Forms are handled with React Hook Form and Zod validation.

**Backend**: Node.js with Express.js, serving API endpoints and static files. It manages file uploads, AI integration, and business logic. Session-based authentication is used with multi-role support (Customer, Installer, Admin), including OIDC integration for Replit authentication. Secure session storage is in PostgreSQL.

**Database**: PostgreSQL with Drizzle ORM, hosted on Neon Database for serverless hosting. The schema supports multi-tenant architecture with Users, Installers, Bookings, Fee Structures, and Job Assignments.

**AI Integration**: OpenAI GPT-4o is used for AI room analysis, installation recommendations, and TV placement visualization.

**Deployment**: Configured for Replit with autoscaling.

**Key Features & Design Decisions**:
- **Authentication**: Dual authentication architecture: OAuth for customers/admins, and email/password for installers. Simplified authentication options include Harvey Norman invoice lookup and guest booking. Email verification system for new signups.
- **Lead Generation Model**: Customers book for free; installers pay fixed lead fees. Installer wallet system for credit management and transaction tracking.
- **Installer Matching**: Uber-style real-time installer matching with an interactive map, availability toggles, distance-based job matching, and urgency levels. Email and SMS notifications for booking confirmations.
- **AI-Powered Recommendations**: AI room analysis for installation previews, TV placement suggestions, and a personalized 5-question TV recommendation questionnaire.
- **Admin Dashboard**: Comprehensive dashboard for managing users, installers, bookings, lead pricing, and platform insights. Includes real-time analytics for bookings, revenue, and user activity.
- **Review System**: Comprehensive customer review system with star ratings and verified purchase badges for installers.
- **Payment Processing**: Stripe integration for installer credit payments with secure checkout and webhook support.
- **Email System**: Google Workspace Email Integration for professional HTML email templates across all platform communications (booking confirmations, installer notifications, admin alerts).
- **Security**: Contact information protection to prevent direct contact bypass.

## External Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection.
- **drizzle-orm**: Type-safe database ORM.
- **@tanstack/react-query**: Server state management.
- **@radix-ui/react-***: Accessible UI primitives.
- **openai**: AI integration for room analysis.
- **qrcode**: QR code generation for booking tracking.
- **multer**: Multipart form data handling.
- **bcrypt**: Password hashing.
- **stripe**: Payment processing.
- **nodemailer**: Email sending.
- **passport**: Authentication middleware.
- **express-session**: Session management.
- **Wouter**: Client-side routing.
- **Tailwind CSS**: Utility-first styling.
- **React Hook Form**: Form validation.
- **Zod**: Schema validation.
- **Leaflet/OpenStreetMap**: Interactive maps and geocoding.