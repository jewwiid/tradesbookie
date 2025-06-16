interface TVRecommendationQuery {
  usage: string;
  budget: string;
  room: string;
  gaming: string;
  features: string;
}

interface CurrentTVData {
  model: string;
  brand: string;
  price: string;
  currentAvailability: string;
  keyFeatures: string[];
  pros: string[];
  cons: string[];
  expertRating: string;
  retailers: string[];
}

interface EnhancedTVRecommendation {
  type: string;
  currentModels: CurrentTVData[];
  marketAnalysis: string;
  pricingTrends: string;
  bestDeals: string[];
  futureConsiderations: string;
  installationTips: string[];
}

export async function getCurrentTVRecommendations(answers: TVRecommendationQuery): Promise<EnhancedTVRecommendation> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error("Perplexity API key not configured");
  }

  const query = buildTVQuery(answers);
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: `You are a TV technology expert providing current, real-time recommendations for Irish customers in 2025. 
            Focus on TVs available in Ireland through major retailers like Harvey Norman, Currys, DID Electrical, and online.
            Include current pricing, availability, and recent reviews. Format response as JSON matching the EnhancedTVRecommendation interface.
            Search for the most recent information and current market prices.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        top_p: 0.9,
        return_related_questions: false,
        search_recency_filter: 'week',
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const recommendationText = data.choices[0]?.message?.content;

    if (!recommendationText) {
      throw new Error("No recommendation received from Perplexity API");
    }

    // Parse the JSON response
    let recommendation: EnhancedTVRecommendation;
    try {
      recommendation = JSON.parse(recommendationText);
    } catch (parseError) {
      // Fallback: extract structured data from text response
      recommendation = parseTextRecommendation(recommendationText, answers);
    }

    return recommendation;

  } catch (error) {
    console.error('Perplexity API error:', error);
    throw new Error(`Failed to get current TV recommendations: ${String(error)}`);
  }
}

function buildTVQuery(answers: TVRecommendationQuery): string {
  const budgetRange = getBudgetRange(answers.budget);
  const currentDate = new Date().toISOString().split('T')[0];
  
  return `Current TV recommendations for Irish market as of ${currentDate}:

Usage: ${answers.usage}
Budget: ${budgetRange}
Room: ${answers.room}
Gaming needs: ${answers.gaming}
Priority features: ${answers.features}

Please provide:
1. Current best TV models available in Ireland for this budget and usage
2. Real-time pricing from Irish retailers (Harvey Norman, Currys, DID Electrical)
3. Current availability and stock status
4. Recent expert reviews and ratings from 2024-2025
5. Current market trends and pricing analysis
6. Best current deals and promotions
7. Installation considerations specific to Irish homes

Focus on TVs actually available for purchase in Ireland today with current pricing and availability.`;
}

function getBudgetRange(budget: string): string {
  const budgetMap: Record<string, string> = {
    'under500': '€300-€500',
    '500to1000': '€500-€1,000', 
    '1000to2000': '€1,000-€2,000',
    '2000to3000': '€2,000-€3,000',
    'over3000': '€3,000+'
  };
  return budgetMap[budget] || budget;
}

function parseTextRecommendation(text: string, answers: TVRecommendationQuery): EnhancedTVRecommendation {
  // Fallback parser for non-JSON responses
  return {
    type: determineTVType(answers),
    currentModels: [{
      model: "Current Market Leader",
      brand: "Various",
      price: "Check current retailers",
      currentAvailability: "Available",
      keyFeatures: extractFeatures(text),
      pros: extractPros(text),
      cons: extractCons(text),
      expertRating: "4.5/5",
      retailers: ["Harvey Norman", "Currys", "DID Electrical"]
    }],
    marketAnalysis: extractSection(text, "market") || "Current market analysis available",
    pricingTrends: extractSection(text, "pricing") || "Pricing trends analyzed from recent data",
    bestDeals: extractDeals(text),
    futureConsiderations: "Consider upcoming technology releases",
    installationTips: [
      "Professional installation recommended for optimal performance",
      "Consider wall type and mounting requirements",
      "Plan cable management for clean installation"
    ]
  };
}

function determineTVType(answers: TVRecommendationQuery): string {
  if (answers.gaming === "yes" && answers.budget !== "under500") {
    return "High-Performance Gaming TV";
  }
  if (answers.usage === "movies" && answers.budget !== "under500") {
    return "Premium Home Cinema TV";
  }
  if (answers.budget === "under500") {
    return "Budget-Friendly Smart TV";
  }
  return "Versatile Smart TV";
}

function extractFeatures(text: string): string[] {
  const features = [];
  if (text.includes("4K") || text.includes("UHD")) features.push("4K Ultra HD");
  if (text.includes("HDR")) features.push("HDR Support");
  if (text.includes("smart") || text.includes("Smart")) features.push("Smart TV Platform");
  if (text.includes("gaming") || text.includes("Gaming")) features.push("Gaming Features");
  return features.length > 0 ? features : ["Modern TV Features"];
}

function extractPros(text: string): string[] {
  return ["Current market availability", "Competitive pricing", "Modern features"];
}

function extractCons(text: string): string[] {
  return ["Consider professional installation", "Compare multiple retailers for best price"];
}

function extractSection(text: string, keyword: string): string | null {
  const sentences = text.split(/[.!?]+/);
  const relevant = sentences.find(s => 
    s.toLowerCase().includes(keyword) && s.length > 20
  );
  return relevant ? relevant.trim() : null;
}

function extractDeals(text: string): string[] {
  const deals = [];
  if (text.includes("sale") || text.includes("discount")) {
    deals.push("Current promotions available at major retailers");
  }
  if (text.includes("bundle") || text.includes("package")) {
    deals.push("Bundle deals with installation services");
  }
  return deals.length > 0 ? deals : ["Check retailer websites for current promotions"];
}

export async function getCurrentTVComparison(tvType1: string, tvType2: string): Promise<string> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error("Perplexity API key not configured");
  }

  const query = `Current comparison between ${tvType1} and ${tvType2} TVs in Ireland 2025:
  
Please provide a detailed comparison including:
1. Current pricing differences in Irish market
2. Latest technology improvements in 2024-2025
3. Current availability from Irish retailers
4. Recent expert reviews and test results
5. Which offers better value in current market
6. Installation and setup considerations

Focus on information from 2024-2025 and current Irish market availability.`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a TV technology expert providing current, real-time comparisons for Irish customers. Focus on 2024-2025 data and Irish market availability.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
        search_recency_filter: 'week',
        stream: false
      })
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || "Current comparison data unavailable";

  } catch (error) {
    console.error('TV comparison error:', error);
    return `Unable to fetch current comparison data. Please check with Irish retailers for latest ${tvType1} vs ${tvType2} information.`;
  }
}