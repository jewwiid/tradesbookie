# TV and Product Installation Referral Platform

## Overview
A sophisticated TV and product installation referral platform connecting service providers with customers through an advanced booking and lead management system. The platform aims to be a multi-retailer solution, moving beyond single-retailer exclusivity, to address the broader Irish electrical retail market. It leverages AI for personalized recommendations, product care analysis, and streamlined operational workflows, offering comprehensive service showcases and transparent pricing. The business vision is to provide a scalable architecture ready for additional service-specific landing pages and improved user journeys, positioning itself as a central hub for installation services.

## User Preferences
- Focus on practical, actionable intelligence over generic information
- Provide realistic cost estimates and scenarios
- Use critical thinking to identify genuine value propositions
- Maintain professional, informative communication style

## System Architecture
The application employs a modern full-stack architecture with AI-enhanced features, focusing on modularity and scalability.

**UI/UX Decisions:**
- **Responsive Design:** Utilizes Tailwind CSS for a mobile-first approach and professional styling across all interfaces.
- **Dedicated Landing Pages:** Creation of specialized service pages (e.g., TV Installation) to reduce homepage clutter, improve focus, and optimize conversion paths.
- **Dynamic Content:** AI-powered carousels and information displays for personalized user experiences, with graceful degradation to static content if AI analysis fails.
- **Retailer Branding:** Dynamic display of retailer-specific branding and store information based on intelligent detection.

**Technical Implementations:**
- **Frontend:** React.js with TypeScript for robust and scalable UI development.
- **Backend:** Node.js with enhanced authentication, supporting multiple authentication methods including invoice-based login.
- **Database:** PostgreSQL with Drizzle ORM for data persistence, featuring schema designed for multi-retailer support.
- **AI Integration:** OpenAI GPT-4o for intelligent analysis, email template generation, and comprehensive product care analysis. This includes critical scenario analysis, cost-benefit analysis, and personalized recommendations.
- **Authentication System:** Migration to Google OAuth for stable, enterprise-grade authentication.
- **Password Reset:** Comprehensive and secure password reset flow with token hashing, expiration, and email integration.

**Feature Specifications & System Design Choices:**
- **Multi-Retailer Support:** Platform re-branding and architectural changes to support any electrical retailer in Ireland. This includes generic "Invoice" terminology, `retailerInvoices` database schema, generalized API endpoints, and a sophisticated retailer detection service.
- **AI-Powered Product Care Analysis:** A service that generates 4-6 comprehensive failure scenarios per product, assessing risk levels, potential costs, and how Product Care mitigates these. It incorporates critical thinking, considers the Irish market context, and integrates with existing product information systems.
- **AI-Powered Tradesperson Email Templates:** An enhanced onboarding system utilizing AI to create personalized email templates for each trade skill, with customizable tone and focus, and a comprehensive preset template library.
- **Website Restructuring:** Dedicated landing pages for specific services (e.g., TV Installation) and a restructured homepage to improve user journey and service discoverability.

## External Dependencies
- **OpenAI GPT-4o:** Used for AI-powered product care analysis, personalized product recommendations, and tradesperson email template generation.
- **Perplexity API:** Integrated for detailed product information lookup.
- **Google OAuth:** Utilized for user authentication.
- **PostgreSQL:** The primary database for data storage and retrieval, managed with Drizzle ORM.
- **Gmail Service:** Configured for sending password reset links and other transactional emails.