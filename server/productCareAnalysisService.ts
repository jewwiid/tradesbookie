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
  try {
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

OUTPUT FORMAT (JSON):
{
  "criticalScenarios": [
    {
      "scenario": "Specific realistic failure scenario",
      "likelihood": "High/Medium/Low",
      "potentialCost": "€XX-€XXX range or specific amount",
      "howProductCareHelps": "Detailed explanation of coverage benefits",
      "timeframe": "When this typically occurs",
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

Provide a comprehensive critical analysis of why Product Care would benefit this specific product, with realistic scenarios and cost considerations.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    const analysisText = response.choices[0].message.content;
    
    if (!analysisText) {
      throw new Error("No analysis received from OpenAI");
    }

    // Try to parse as JSON
    try {
      const analysis = JSON.parse(analysisText);
      return analysis as ProductCareAnalysis;
    } catch (parseError) {
      // Fallback: create structured response from text
      return parseTextToAnalysis(analysisText, productInfo);
    }

  } catch (error) {
    console.error('Product Care analysis error:', error);
    
    // Provide fallback analysis
    return generateFallbackAnalysis(productInfo);
  }
}

function parseTextToAnalysis(text: string, productInfo: any): ProductCareAnalysis {
  // Extract scenarios from text when JSON parsing fails
  const scenarios: ProductCareScenario[] = [
    {
      scenario: `${productInfo.category} component failure or malfunction`,
      likelihood: 'Medium',
      potentialCost: '€150-€400',
      howProductCareHelps: 'Covers all repair costs including parts, labor, and call-out fees',
      timeframe: 'Typically occurs after warranty expires (2-4 years)',
      preventiveMeasures: ['Regular maintenance', 'Proper usage according to manual']
    }
  ];

  const riskAssessment: RiskAssessment = {
    overallRiskLevel: 'Medium',
    primaryRisks: ['Component wear and tear', 'Electrical issues'],
    environmentalFactors: ['Irish humidity', 'Power fluctuations'],
    usagePatternRisks: ['Heavy daily use', 'Improper handling']
  };

  const costBenefitAnalysis: CostBenefitAnalysis = {
    potentialSavings: 'Up to €300-€500 in repair costs',
    worstCaseScenario: 'Complete product failure requiring replacement',
    recommendedCoverage: '3-year coverage for optimal value',
    reasoning: 'Provides protection during post-warranty period when failures are most common'
  };

  return {
    criticalScenarios: scenarios,
    riskAssessment,
    personalizedRecommendations: [
      'Consider Product Care to avoid unexpected repair bills',
      'Extended coverage provides peace of mind for premium products'
    ],
    costBenefitAnalysis
  };
}

function generateFallbackAnalysis(productInfo: any): ProductCareAnalysis {
  const scenarios: ProductCareScenario[] = [
    {
      scenario: `Power surge damage to ${productInfo.name}`,
      likelihood: 'Medium',
      potentialCost: '€200-€500',
      howProductCareHelps: 'Surge protection coverage included - full repair or replacement covered',
      timeframe: 'Can occur at any time, especially during storms',
      preventiveMeasures: ['Use surge protectors', 'Unplug during electrical storms']
    },
    {
      scenario: 'Component failure after manufacturer warranty expires',
      likelihood: 'High',
      potentialCost: '€150-€400',
      howProductCareHelps: 'All parts, labor, and call-out fees covered by Product Care',
      timeframe: 'Most common 2-4 years after purchase',
      preventiveMeasures: ['Follow maintenance guidelines', 'Keep in suitable environment']
    }
  ];

  return {
    criticalScenarios: scenarios,
    riskAssessment: {
      overallRiskLevel: 'Medium',
      primaryRisks: ['Post-warranty failures', 'Power-related damage'],
      environmentalFactors: ['Irish weather conditions', 'Voltage fluctuations'],
      usagePatternRisks: ['Daily wear and tear', 'Accidental damage']
    },
    personalizedRecommendations: [
      `For a ${productInfo.category} in this price range, Product Care provides valuable protection against common failures`,
      'Consider 3-year coverage to bridge the gap after manufacturer warranty expires',
      'Ireland-based support team ensures quick resolution of any issues'
    ],
    costBenefitAnalysis: {
      potentialSavings: 'Potentially €300-€600 in repair costs',
      worstCaseScenario: 'Complete replacement needed outside warranty period',
      recommendedCoverage: '3-year extended protection',
      reasoning: 'Cost of coverage typically less than one major repair incident'
    }
  };
}