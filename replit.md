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