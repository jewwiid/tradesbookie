import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "default_key"
});

export interface ProductCareAnalysis {
  criticalScenarios: ProductCareScenario[];
  riskAssessment: RiskAssessment;
  personalizedRecommendations: string[];
  costBenefitAnalysis: CostBenefitAnalysis;
}

export interface ProductCareScenario {
  scenario: string;
  likelihood: 'High' | 'Medium' | 'Low';
  potentialCost: string;
  howProductCareHelps: string;
  timeframe: string;
  preventiveMeasures?: string[];
}

export interface RiskAssessment {
  overallRiskLevel: 'High' | 'Medium' | 'Low';
  primaryRisks: string[];
  environmentalFactors: string[];
  usagePatternRisks: string[];
}

export interface CostBenefitAnalysis {
  potentialSavings: string;
  worstCaseScenario: string;
  recommendedCoverage: string;
  reasoning: string;
}

const PRODUCT_CARE_KNOWLEDGE_BASE = `
HARVEY NORMAN PRODUCT CARE COVERAGE DETAILS:

GENERAL COVERAGE:
- 2, 3, or 4 year protection terms available
- Covers all parts, labor, and call-out fees
- New-for-old replacement if repair not economical
- Coverage for wear & tear and environmental factors (dust, internal overheating)
- Transferable coverage if product is sold or gifted
- International coverage up to €300
- No Lemon Guarantee: replacement after 3rd qualified repair needed
- Surge protection against electrical interference and voltage fluctuations

ACCIDENTAL DAMAGE COVERAGE (12 months from purchase):
- Covers drops, spills, cracked screens, unintentional accidents
- Admin fees: €25 (<€200), €50 (€200-€500), €100 (>€500)
- 30-day no-cover period applies

CATEGORY-SPECIFIC BENEFITS:

TVs & OLED TVs:
- Cracked screen coverage for accidental damage
- Surge protection for power spikes that can damage boards
- Dust build-up and internal overheating coverage
- OLED-specific peace of mind with extended protection

Fridges & Freezers:
- Food spoilage cover up to €500 for covered faults
- Protection against compressor failures and cooling system issues

Washing Machines & Dryers:
- Laundry expenses covered up to €150 if repair takes 10+ days
- Motor and mechanical component failures
- Water damage and electrical issues

Gaming Consoles:
- Accidental drops and liquid damage (controllers excluded)
- Overheating and ventilation system failures
- Hard drive and storage component failures

Laptops & Tablets:
- Liquid spill coverage (coffee, water damage)
- Screen and keyboard damage protection
- Battery and charging system failures
- Worldwide coverage for travel

Headphones & Audio:
- Battery degradation issues (excluding user-replaceable batteries)
- Driver and speaker component failures
- Sweat and moisture damage for wearables

Vacuum Cleaners:
- Motor and suction system failures
- Blockage and clog-related damage
- Battery issues for cordless models (user-replaceable batteries excluded)

Kitchen Appliances:
- Heating element failures
- Control panel and electronic component issues
- Seal and door mechanism problems

EXCLUSIONS:
- Loss, theft, or negligence
- Cosmetic damage that doesn't affect functionality
- Accessories (some exceptions apply)
- User-replaceable batteries in certain products
- Deliberate damage or misuse

CLAIM PROCESS:
- 24/7 online registration at www.productcareclaims.ie
- Ireland-based customer care team (1800 200 503)
- Monday-Friday 9:00am-5:30pm
- Authorized repairer network ensures quality repairs
`;

export async function analyzeProductCare(
  productInfo: {
    name: string;
    brand: string;
    category: string;
    price: string;
    keyFeatures: string[];
    specifications: Record<string, string>;
    pros: string[];
    cons: string[];
  },
  userContext?: {
    usage?: string;
    environment?: string;
    experience?: string;
  }
): Promise<ProductCareAnalysis> {
  // Try up to 3 times to get a valid response
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Product Care analysis attempt ${attempt} for ${productInfo.name}`);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a product risk assessment expert analyzing products for Product Care recommendations. Your role is to use critical thinking and deep analysis to identify potential failure scenarios and explain how Product Care coverage would help users avoid unexpected costs.

KNOWLEDGE BASE:
${PRODUCT_CARE_KNOWLEDGE_BASE}

ANALYSIS REQUIREMENTS:
1. Use critical thinking to identify realistic failure scenarios based on:
   - Product category common issues
   - Brand-specific known problems
   - Environmental factors (Irish climate, power surges)
   - Usage patterns and wear points
   - Manufacturing weak points

2. For each scenario, explain:
   - Why it's likely to happen
   - What the cost would be without coverage
   - Exactly how Product Care would help
   - When it might occur in the product's lifecycle

3. Consider the Irish market context:
   - Power surge issues common in Ireland
   - Humidity and weather effects
   - Average repair costs vs replacement costs
   - Harvey Norman's authorized repair network

4. Provide realistic cost estimates based on:
   - Typical repair costs for the product category
   - Replacement value analysis
   - Labor and call-out fees in Ireland

CRITICAL: Generate exactly 4-6 comprehensive scenarios covering different types of failures that Product Care covers.
Include a variety of scenarios such as:
- Electrical/electronic failures (surge damage, component failures)
- Mechanical wear and tear issues
- Accidental damage scenarios (if applicable to category)
- Environmental damage (dust, humidity, overheating)
- Age-related component deterioration
- Category-specific issues (food spoilage for fridges, laundry costs for washing machines, etc.)

YOU MUST RETURN ONLY VALID JSON. NO MARKDOWN, NO EXPLANATIONS, NO ADDITIONAL TEXT.

JSON STRUCTURE:
{
  "criticalScenarios": [
    {
      "scenario": "Specific realistic failure scenario with details",
      "likelihood": "High/Medium/Low",
      "potentialCost": "€XX-€XXX range or specific amount with reasoning",
      "howProductCareHelps": "Detailed explanation of specific coverage benefits and process",
      "timeframe": "When this typically occurs in product lifecycle",
      "preventiveMeasures": ["Optional prevention tips"]
    }
  ],
  "riskAssessment": {
    "overallRiskLevel": "High/Medium/Low",
    "primaryRisks": ["Main failure points"],
    "environmentalFactors": ["Irish climate considerations"],
    "usagePatternRisks": ["How usage affects longevity"]
  },
  "costBenefitAnalysis": {
    "potentialSavings": "Money saved vs coverage cost",
    "worstCaseScenario": "Most expensive potential failure",
    "recommendedCoverage": "Suggested protection length",
    "reasoning": "Why this coverage makes financial sense"
  },
  "personalizedRecommendations": [
    "Specific advice based on product and usage"
  ]
}

Be analytical, realistic, and focus on genuine value proposition. Avoid generic statements.`
          },
          {
            role: "user",
            content: `Analyze this product for Product Care recommendations:

PRODUCT DETAILS:
Name: ${productInfo.name}
Brand: ${productInfo.brand}
Category: ${productInfo.category}
Price: ${productInfo.price}
Key Features: ${productInfo.keyFeatures.join(', ')}
Specifications: ${JSON.stringify(productInfo.specifications)}
Known Pros: ${productInfo.pros.join(', ')}
Known Cons: ${productInfo.cons.join(', ')}

${userContext ? `USER CONTEXT:
Usage: ${userContext.usage || 'Not specified'}
Environment: ${userContext.environment || 'Not specified'}
Experience: ${userContext.experience || 'Not specified'}` : ''}

RESPOND WITH VALID JSON ONLY - NO MARKDOWN OR ADDITIONAL TEXT.

Provide exactly 4-6 different realistic failure scenarios that Product Care would cover for this specific product.`
          }
        ],
        max_tokens: 3500,
        temperature: 0.1
      });

      const analysisText = response.choices[0].message.content;
      
      if (!analysisText) {
        console.error(`Attempt ${attempt}: No analysis received from OpenAI`);
        continue;
      }

      // Clean the response text - remove any markdown formatting
      let cleanedText = analysisText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      }
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\s*/g, '').replace(/```\s*$/g, '');
      }

      // Validate JSON structure
      try {
        const analysis = JSON.parse(cleanedText);
        
        // Validate required fields exist
        if (!analysis.criticalScenarios || !Array.isArray(analysis.criticalScenarios)) {
          throw new Error('Invalid criticalScenarios structure');
        }
        
        if (analysis.criticalScenarios.length < 4 || analysis.criticalScenarios.length > 6) {
          throw new Error(`Invalid number of scenarios: ${analysis.criticalScenarios.length}`);
        }

        // Validate each scenario has required fields
        for (const scenario of analysis.criticalScenarios) {
          if (!scenario.scenario || !scenario.likelihood || !scenario.potentialCost || !scenario.howProductCareHelps || !scenario.timeframe) {
            throw new Error('Missing required scenario fields');
          }
        }

        console.log(`✅ Successfully parsed Product Care analysis on attempt ${attempt}`);
        return analysis as ProductCareAnalysis;
        
      } catch (parseError) {
        console.error(`Attempt ${attempt}: JSON parsing failed:`, parseError);
        console.error(`Response text: ${cleanedText.substring(0, 200)}...`);
        
        if (attempt === 3) {
          throw parseError; // Re-throw on final attempt
        }
        continue;
      }

    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === 3) {
        throw error; // Re-throw on final attempt
      }
    }
  }

  // This should never be reached due to re-throwing on final attempt
  throw new Error('All retry attempts failed - AI analysis service unavailable');
}