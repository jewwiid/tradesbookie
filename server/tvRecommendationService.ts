import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable must be set");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface QuestionnaireAnswers {
  usage: string;
  budget: string;
  room: string;
  gaming: string;
  features: string;
}

interface TVRecommendation {
  type: string;
  model: string;
  reasons: string[];
  pros: string[];
  cons: string[];
  priceRange: string;
  bestFor: string[];
  currentModels?: any[];
  marketAnalysis?: string;
  pricingTrends?: string;
  bestDeals?: string[];
  realTimeData?: boolean;
}

export async function generateTVRecommendation(answers: QuestionnaireAnswers): Promise<TVRecommendation> {
  try {
    console.log("Starting TV recommendation with answers:", answers);

    // Use OpenAI for personalized analysis and recommendation logic
    const prompt = `Based on these user preferences, recommend the BEST TV technology and specific model that STRICTLY FITS their budget:

Usage: ${answers.usage}
Budget: ${answers.budget}
Room Environment: ${answers.room}
Gaming Importance: ${answers.gaming}
Priority Feature: ${answers.features}

IMPORTANT: Budget restrictions are MANDATORY. Match these exact budget ranges:
- budget (€400-€800): Only recommend entry-level QLED or standard LED TVs. NO OLED, NO MINI LED, NO premium features
- mid (€800-€1,500): Mid-range QLED, entry-level OLED (smaller sizes), or MINI LED options
- high (€1,500-€3,000): Premium OLED, high-end QLED, advanced MINI LED, 144Hz Frame TVs
- premium (€3,000+): Flagship OLED, premium MINI LED, largest sizes, all premium features

TV Technologies by budget tier:
- €400-€800: Standard LED, Basic QLED (Samsung Q60, LG QNED, Sony X80K series)
- €800-€1,500: Mid QLED (Samsung Q70/Q80), Small OLED (LG C3 48-55"), TCL C845
- €1,500-€3,000: Premium OLED (LG C3/G3 65-77"), High-end QLED (Samsung QN90), MINI LED
- €3,000+: Flagship models (LG G4, Samsung QN95, Sony A95L)

CRITICAL: Your priceRange MUST match the user's selected budget range. Do not exceed it.

Provide a recommendation in JSON format with:
- type: The TV technology that fits the budget (Standard LED, QLED, MINI LED, OLED, 144Hz Frame TV)
- model: A realistic specific model within the budget range
- reasons: Array of 3-4 personalized reasons why this TV matches their needs AND budget
- pros: Array of 4-5 key advantages considering the budget constraints
- cons: Array of 2-3 honest considerations including budget limitations if applicable
- priceRange: MUST be within the user's selected budget range
- bestFor: Array of 3-4 use cases this TV excels at within this price category
- currentModels: Array of 2-3 alternative TV models in the same budget range, each with: { model, brand, price, keyFeatures, pros, cons }

Be realistic about what features are available at each price point.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a TV expert who provides personalized recommendations with STRICT BUDGET ADHERENCE. Budget ranges are mandatory constraints - never exceed them. If user selects €400-€800, recommend ONLY TVs in that range. Match user preferences within their budget, don't suggest upgrades. Always respond with valid JSON matching the specified format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const recommendationText = response.choices[0].message.content;
    if (!recommendationText) {
      throw new Error("No recommendation generated");
    }

    console.log("Raw AI response:", recommendationText);

    let recommendation: TVRecommendation;
    try {
      recommendation = JSON.parse(recommendationText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw text that failed to parse:", recommendationText);
      throw new Error("Invalid JSON response from AI");
    }
    
    // Validate the response structure
    if (!recommendation.type || !recommendation.model || !Array.isArray(recommendation.reasons)) {
      console.error("Invalid recommendation structure:", {
        hasType: !!recommendation.type,
        hasModel: !!recommendation.model,
        hasReasonsArray: Array.isArray(recommendation.reasons),
        actualRecommendation: recommendation
      });
      throw new Error("Invalid recommendation format");
    }

    // Enforce budget constraints with post-processing validation
    const budgetValidation = validateBudgetConstraints(recommendation, answers.budget);
    if (!budgetValidation.isValid) {
      console.log(`Budget validation failed: ${budgetValidation.message}. Adjusting recommendation.`);
      // Override with budget-appropriate recommendation
      Object.assign(recommendation, budgetValidation.adjustedRecommendation);
    }

    // Ensure currentModels are present - generate fallback if missing
    if (!recommendation.currentModels || recommendation.currentModels.length === 0) {
      recommendation.currentModels = generateAlternativeModels(answers.budget, recommendation.type);
    }

    return recommendation;
  } catch (error) {
    console.error("TV recommendation error:", error);
    throw new Error("Failed to generate TV recommendation");
  }
}

function validateBudgetConstraints(recommendation: TVRecommendation, budget: string): {
  isValid: boolean;
  message?: string;
  adjustedRecommendation?: Partial<TVRecommendation>;
} {
  const budgetRanges = {
    budget: { min: 400, max: 800, allowedTypes: ['Standard LED', 'Basic QLED'] },
    mid: { min: 800, max: 1500, allowedTypes: ['QLED', 'OLED', 'MINI LED'] },
    high: { min: 1500, max: 3000, allowedTypes: ['Premium OLED', 'High-end QLED', 'MINI LED', '144Hz Frame TV'] },
    premium: { min: 3000, max: 10000, allowedTypes: ['Premium OLED', 'Flagship QLED', 'MINI LED', '144Hz Frame TV'] }
  };

  const budgetInfo = budgetRanges[budget as keyof typeof budgetRanges];
  if (!budgetInfo) return { isValid: true };

  // Check if price range matches budget
  const priceRange = recommendation.priceRange.toLowerCase();
  const priceNumbers = priceRange.match(/\d+/g);
  
  if (priceNumbers && priceNumbers.length >= 1) {
    const minPrice = parseInt(priceNumbers[0]);
    const maxPrice = priceNumbers.length > 1 ? parseInt(priceNumbers[1]) : minPrice + 200;
    
    // If the recommended price is significantly above budget, override it
    if (minPrice > budgetInfo.max) {
      return {
        isValid: false,
        message: `Recommended price ${minPrice} exceeds budget maximum ${budgetInfo.max}`,
        adjustedRecommendation: getBudgetAppropriateRecommendation(budget)
      };
    }
  }

  return { isValid: true };
}

function generateAlternativeModels(budget: string, tvType: string): any[] {
  const budgetModels = {
    budget: [
      {
        model: "Samsung Q60C 55\"",
        brand: "Samsung",
        price: "€650-€750",
        keyFeatures: ["4K QLED", "Smart TV", "HDR10+"],
        pros: ["Great value", "Reliable brand", "Good picture quality"],
        cons: ["Basic local dimming", "Limited gaming features"]
      },
      {
        model: "LG QNED80 50\"",
        brand: "LG",
        price: "€550-€650",
        keyFeatures: ["4K QNED", "webOS", "HDR10"],
        pros: ["Smart interface", "Good color accuracy", "Energy efficient"],
        cons: ["Smaller size", "Standard refresh rate"]
      },
      {
        model: "TCL C745 55\"",
        brand: "TCL",
        price: "€500-€600",
        keyFeatures: ["4K QLED", "Google TV", "Dolby Vision"],
        pros: ["Excellent value", "Google TV platform", "HDR support"],
        cons: ["Lesser known brand", "Basic build quality"]
      }
    ],
    mid: [
      {
        model: "Samsung Q70C 55\"",
        brand: "Samsung",
        price: "€1,100-€1,300",
        keyFeatures: ["4K QLED", "120Hz", "Gaming Hub"],
        pros: ["Gaming features", "Bright display", "Premium design"],
        cons: ["No OLED contrast", "Reflection issues"]
      },
      {
        model: "LG C3 OLED 48\"",
        brand: "LG",
        price: "€1,200-€1,400",
        keyFeatures: ["4K OLED", "120Hz", "webOS"],
        pros: ["Perfect blacks", "Gaming optimized", "Thin design"],
        cons: ["Smaller size", "Potential burn-in"]
      },
      {
        model: "Sony X90L 55\"",
        brand: "Sony",
        price: "€1,000-€1,200",
        keyFeatures: ["4K LED", "XR Processor", "Google TV"],
        pros: ["Excellent processing", "Natural colors", "Good upscaling"],
        cons: ["Limited HDR brightness", "Average gaming features"]
      }
    ],
    high: [
      {
        model: "LG C3 OLED 65\"",
        brand: "LG",
        price: "€1,800-€2,200",
        keyFeatures: ["4K OLED", "120Hz", "Dolby Vision IQ"],
        pros: ["Perfect contrast", "Gaming excellence", "Premium design"],
        cons: ["Potential burn-in", "Reflection sensitivity"]
      },
      {
        model: "Samsung QN90C 65\"",
        brand: "Samsung",
        price: "€2,000-€2,400",
        keyFeatures: ["4K Neo QLED", "Mini LED", "120Hz"],
        pros: ["Extremely bright", "No burn-in risk", "Gaming features"],
        cons: ["Higher price", "Complex interface"]
      },
      {
        model: "Sony A80L OLED 65\"",
        brand: "Sony",
        price: "€1,900-€2,300",
        keyFeatures: ["4K OLED", "XR Processor", "Acoustic Surface"],
        pros: ["Natural picture", "Great upscaling", "Unique sound"],
        cons: ["Gaming limitations", "Slower interface"]
      }
    ],
    premium: [
      {
        model: "LG G3 OLED 77\"",
        brand: "LG",
        price: "€3,500-€4,200",
        keyFeatures: ["4K OLED evo", "Gallery Design", "120Hz"],
        pros: ["Ultra-thin design", "Gallery mount", "Exceptional picture"],
        cons: ["Very expensive", "Requires wall mount"]
      },
      {
        model: "Samsung QN95C 75\"",
        brand: "Samsung",
        price: "€3,200-€3,800",
        keyFeatures: ["8K Neo QLED", "Mini LED", "AI Upscaling"],
        pros: ["8K resolution", "Future-proof", "Extreme brightness"],
        cons: ["Limited 8K content", "High power consumption"]
      },
      {
        model: "Sony A95L QD-OLED 77\"",
        brand: "Sony",
        price: "€4,000-€4,800",
        keyFeatures: ["4K QD-OLED", "XR Processor", "Acoustic Surface+"],
        pros: ["Quantum Dot OLED", "Exceptional color", "Premium audio"],
        cons: ["Highest price", "Limited availability"]
      }
    ]
  };

  return budgetModels[budget as keyof typeof budgetModels] || budgetModels.mid;
}

function getBudgetAppropriateRecommendation(budget: string): Partial<TVRecommendation> {
  const budgetRecommendations = {
    budget: {
      type: 'Standard LED QLED',
      model: 'Samsung Q60C 55" or LG QNED80 50"',
      priceRange: '€450 - €750',
      reasons: ['Excellent value for money within your budget', 'Good picture quality for the price point', 'Smart TV features included', 'Reliable brand quality'],
      pros: ['Affordable pricing', 'Good build quality', 'Smart TV capabilities', 'Energy efficient', 'Multiple size options'],
      cons: ['Limited HDR performance', 'Basic local dimming', 'Standard refresh rate'],
      bestFor: ['Everyday viewing', 'Streaming services', 'Budget-conscious buyers', 'Secondary room TVs']
    },
    mid: {
      type: 'Mid-Range QLED',
      model: 'Samsung Q70C 55" or LG C3 OLED 48"',
      priceRange: '€900 - €1,400',
      reasons: ['Great balance of features and price', 'Enhanced picture quality', 'Gaming features included', 'Premium build quality'],
      pros: ['Excellent picture quality', 'Good HDR support', 'Low input lag for gaming', 'Sleek design', 'Advanced smart features'],
      cons: ['Higher price than basic models', 'Limited size options in OLED', 'Power consumption'],
      bestFor: ['Movie enthusiasts', 'Casual gaming', 'Living room centerpiece', 'HDR content viewing']
    },
    high: {
      type: 'Premium OLED',
      model: 'LG C3 OLED 65" or Samsung QN90C 65"',
      priceRange: '€1,600 - €2,800',
      reasons: ['Premium picture quality', 'Latest gaming features', 'Large screen size', 'Future-proof technology'],
      pros: ['Perfect blacks (OLED)', 'High refresh rate gaming', 'Premium design', 'Latest smart features', 'Excellent HDR'],
      cons: ['Premium pricing', 'OLED burn-in potential', 'Higher power usage'],
      bestFor: ['Home cinema', 'Gaming enthusiasts', 'Large living rooms', 'Premium viewing experience']
    },
    premium: {
      type: 'Flagship OLED',
      model: 'LG G4 OLED 77" or Samsung QN95C 75"',
      priceRange: '€3,200 - €5,500',
      reasons: ['Flagship technology', 'Largest screen sizes', 'Best-in-class features', 'Premium materials and design'],
      pros: ['Cutting-edge picture quality', 'Gallery design', 'All premium features', 'Large screen sizes', 'Future-proof'],
      cons: ['Very high price', 'Requires professional installation', 'High power consumption'],
      bestFor: ['Home theater rooms', 'Luxury installations', 'Tech enthusiasts', 'Large entertainment spaces']
    }
  };

  return budgetRecommendations[budget as keyof typeof budgetRecommendations] || budgetRecommendations.budget;
}

export async function getTVComparisonInsights(tvType1: string, tvType2: string): Promise<string> {
  try {
    const prompt = `Compare ${tvType1} vs ${tvType2} TV technologies. Provide a brief, practical comparison focusing on real-world differences that matter to consumers.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a TV technology expert. Provide practical, consumer-focused comparisons."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
    });

    return response.choices[0].message.content || "Comparison not available";
  } catch (error) {
    console.error("TV comparison error:", error);
    throw new Error("Failed to generate comparison");
  }
}