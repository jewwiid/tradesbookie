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

CRITICAL: Generate 4-6 comprehensive scenarios covering different types of failures that Product Care covers.
Include a variety of scenarios such as:
- Electrical/electronic failures (surge damage, component failures)
- Mechanical wear and tear issues
- Accidental damage scenarios (if applicable to category)
- Environmental damage (dust, humidity, overheating)
- Age-related component deterioration
- Category-specific issues (food spoilage for fridges, laundry costs for washing machines, etc.)

OUTPUT FORMAT (JSON):
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

Provide a comprehensive critical analysis with 4-6 different realistic failure scenarios that Product Care would cover for this specific product. Include various types of failures: electrical/electronic, mechanical wear, environmental damage, accidental damage (if applicable), and category-specific issues. Make each scenario detailed with specific cost estimates and clear explanations of how Product Care helps.`
        }
      ],
      max_tokens: 3000,
      temperature: 0.2
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

function generateCategorySpecificScenarios(productInfo: any): ProductCareScenario[] {
  const category = productInfo.category.toLowerCase();
  const baseScenarios: ProductCareScenario[] = [];

  // Universal scenarios for all electronics
  baseScenarios.push({
    scenario: `Power surge damage to ${productInfo.name} during electrical storm`,
    likelihood: 'Medium',
    potentialCost: '€200-€500 for board replacement or full unit replacement',
    howProductCareHelps: 'Surge protection coverage included - covers electrical damage from power fluctuations and surges at no extra cost',
    timeframe: 'Can occur at any time, especially during Irish weather events',
    preventiveMeasures: ['Use surge protectors', 'Unplug during storms']
  });

  baseScenarios.push({
    scenario: 'Component failure after manufacturer warranty expires',
    likelihood: 'High',
    potentialCost: '€150-€400 including parts, labor, and call-out fees',
    howProductCareHelps: 'All repair costs covered including authorized technician visits and genuine parts replacement',
    timeframe: 'Most common 2-4 years after purchase when warranty ends',
    preventiveMeasures: ['Follow maintenance guidelines', 'Regular cleaning']
  });

  // Category-specific scenarios
  if (category.includes('tv') || category.includes('television') || category.includes('display')) {
    baseScenarios.push({
      scenario: 'Screen crack from accidental impact or child/pet damage',
      likelihood: 'Medium',
      potentialCost: '€300-€800 for screen replacement (often 60-70% of new TV cost)',
      howProductCareHelps: 'Accidental damage coverage for 12 months - covers screen replacement with admin fee only (€25-€100)',
      timeframe: 'Most common in first 2 years of ownership',
      preventiveMeasures: ['Wall mounting', 'Child safety measures']
    });

    baseScenarios.push({
      scenario: 'Internal overheating causing display or processing failures',
      likelihood: 'Medium',
      potentialCost: '€200-€450 for main board or cooling system repairs',
      howProductCareHelps: 'Covers dust build-up and internal overheating damage - includes cleaning and component replacement',
      timeframe: 'Usually occurs after 3-5 years, especially in dusty environments',
      preventiveMeasures: ['Regular dusting of vents', 'Adequate ventilation space']
    });
  }

  if (category.includes('fridge') || category.includes('freezer') || category.includes('refrigerat')) {
    baseScenarios.push({
      scenario: 'Compressor failure leading to cooling system breakdown',
      likelihood: 'Medium',
      potentialCost: '€400-€700 for compressor replacement plus lost food',
      howProductCareHelps: 'Covers compressor repairs AND up to €500 food spoilage compensation for any food lost due to covered faults',
      timeframe: 'Common 4-6 years after purchase',
      preventiveMeasures: ['Regular coil cleaning', 'Avoid overloading']
    });
  }

  if (category.includes('washing') || category.includes('dryer') || category.includes('laundry')) {
    baseScenarios.push({
      scenario: 'Motor or drum bearing failure causing loud noises and poor performance',
      likelihood: 'Medium',
      potentialCost: '€250-€500 for motor/bearing replacement and labor',
      howProductCareHelps: 'Covers mechanical failures AND up to €150 laundry expenses if repair takes over 10 days',
      timeframe: 'Typically 4-7 years with regular use',
      preventiveMeasures: ['Balanced loads', 'Regular cleaning cycles']
    });
  }

  // Add more scenarios based on available knowledge base
  baseScenarios.push({
    scenario: 'Wear and tear causing multiple component degradation',
    likelihood: 'High',
    potentialCost: '€100-€300 for multiple small repairs that add up',
    howProductCareHelps: 'Covers wear and tear damage that manufacturer warranties exclude - all parts and labor included',
    timeframe: 'Progressive degradation typically starts year 3-4',
    preventiveMeasures: ['Proper usage according to manual', 'Regular maintenance']
  });

  return baseScenarios.slice(0, 6); // Return up to 6 scenarios
}

function parseTextToAnalysis(text: string, productInfo: any): ProductCareAnalysis {
  // Generate comprehensive scenarios when JSON parsing fails
  const scenarios: ProductCareScenario[] = generateCategorySpecificScenarios(productInfo);

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
  // Use the same comprehensive scenario generation as the text parser
  const scenarios: ProductCareScenario[] = generateCategorySpecificScenarios(productInfo);

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