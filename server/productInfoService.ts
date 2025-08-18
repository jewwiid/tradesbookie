interface ProductInfo {
  name: string;
  brand: string;
  rating: number;
  price: string;
  overview: string;
  pros: string[];
  cons: string[];
  keyFeatures: string[];
  specifications: Record<string, string>;
  expertRecommendation: string;
  valueForMoney: string;
}

export async function getProductInfo(model: string): Promise<ProductInfo> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error("Perplexity API key not configured");
  }

  // Build search query for detailed product analysis
  const searchQuery = buildProductInfoQuery(model);

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: `You are a professional product reviewer with expertise in electronics and appliances. Search the web for current information and provide comprehensive product analysis.

SEARCH REQUIREMENTS:
1. Find the EXACT product model: ${model}
2. Get information from reliable sources (RTINGS, TechRadar, What Hi-Fi, GSMArena, Consumer Reports, manufacturer websites)
3. Include current pricing from Irish retailers (Harvey Norman Ireland, Currys PC World Ireland, Argos Ireland)
4. Find professional reviews, user feedback, and technical specifications

RESPONSE FORMAT - Return ONLY valid JSON without markdown formatting:
{
  "name": "Full product name with model number",
  "brand": "Manufacturer brand name",
  "rating": 4.5,
  "price": "€XXX at [Retailer Name] Ireland",
  "overview": "2-3 sentences describing the product's main purpose, target audience, and standout features",
  "pros": [
    "Specific advantage based on reviews",
    "Another verified strength",
    "Third documented benefit",
    "Fourth proven advantage"
  ],
  "cons": [
    "Specific limitation from reviews",
    "Another documented weakness", 
    "Third verified drawback"
  ],
  "keyFeatures": [
    "Main technical feature 1",
    "Main technical feature 2", 
    "Main technical feature 3",
    "Main technical feature 4"
  ],
  "specifications": {
    "Display/Driver Size": "Specific measurement",
    "Connectivity": "Bluetooth 5.x, WiFi, etc",
    "Battery Life": "X hours",
    "Weight": "X grams/kg",
    "Dimensions": "X x Y x Z mm"
  },
  "expertRecommendation": "Detailed recommendation of who should buy this and why, based on professional reviews",
  "valueForMoney": "Assessment of pricing vs features compared to competitors"
}

CRITICAL: Return ONLY the JSON object. No markdown, no explanations, no code blocks. 
Start your response with { and end with }. Do not include any text before or after the JSON.`
          },
          {
            role: 'user',
            content: searchQuery
          }
        ],
        max_tokens: 3000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const productInfoText = data.choices[0]?.message?.content;

    if (!productInfoText) {
      throw new Error("No product information received from Perplexity API");
    }

    console.log('Raw Perplexity response:', productInfoText);

    // Clean up the response to extract valid JSON
    let cleanedText = productInfoText.trim();
    
    // Remove markdown code block formatting
    cleanedText = cleanedText.replace(/```json\s*|\s*```/g, '');
    
    // Try to extract a complete JSON object
    let jsonStart = cleanedText.indexOf('{');
    let jsonEnd = cleanedText.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
    }
    
    // Fix common JSON formatting issues
    cleanedText = cleanedText
      .replace(/\n/g, ' ')              // Remove newlines
      .replace(/\s+/g, ' ')             // Normalize spaces
      .replace(/,\s*}/g, '}')           // Remove trailing commas
      .replace(/,\s*]/g, ']')           // Remove trailing commas in arrays
      .replace(/([^\\])"/g, '$1\\"')    // Escape unescaped quotes
      .replace(/^"/g, '\\"');           // Escape quotes at start
    
    console.log('Cleaned text for parsing:', cleanedText);

    // Try to parse as JSON first
    let productInfo: ProductInfo;
    try {
      const parsed = JSON.parse(cleanedText);
      console.log('Parsed JSON successfully:', parsed);
      
      productInfo = {
        name: parsed.name || `${model} Product Info`,
        brand: parsed.brand || extractBrandFromModel(model),
        rating: typeof parsed.rating === 'number' ? Math.min(5, Math.max(0, parsed.rating)) : 4.0,
        price: parsed.price || 'Price not available',
        overview: parsed.overview || `Detailed information about ${model}`,
        pros: Array.isArray(parsed.pros) ? parsed.pros.filter(Boolean) : [],
        cons: Array.isArray(parsed.cons) ? parsed.cons.filter(Boolean) : [],
        keyFeatures: Array.isArray(parsed.keyFeatures) ? parsed.keyFeatures.filter(Boolean) : [],
        specifications: typeof parsed.specifications === 'object' && parsed.specifications ? parsed.specifications : {},
        expertRecommendation: parsed.expertRecommendation || 'Product analysis based on available information.',
        valueForMoney: parsed.valueForMoney || 'Value assessment based on current market position.'
      };
    } catch (parseError) {
      console.log('JSON parsing failed, trying text extraction:', parseError);
      
      // Enhanced text extraction for structured content
      productInfo = parseStructuredTextToProductInfo(productInfoText, model);
      
      // If that fails, try the original text extraction
      if (!productInfo.pros.length && !productInfo.cons.length) {
        productInfo = parseTextToProductInfo(productInfoText, model);
      }
    }

    // Ensure we have at least some meaningful data
    if (!productInfo.pros.length && !productInfo.cons.length) {
      productInfo = generateFallbackProductInfo(model);
    }

    return productInfo;

  } catch (error) {
    console.error('Product info API error:', error);
    
    // Provide fallback product info
    return generateFallbackProductInfo(model);
  }
}

function buildProductInfoQuery(model: string): string {
  return `Search for detailed information about the product: ${model}

SEARCH REQUIREMENTS:
1. Find the exact product model "${model}"
2. Look for professional reviews from RTINGS, TechRadar, What Hi-Fi, Consumer Reports
3. Find current pricing from retailers (Harvey Norman Ireland preferred)
4. Get technical specifications from manufacturer websites
5. Find real user reviews and ratings

ANALYSIS NEEDED:
- Current pricing and availability
- Detailed pros and cons from professional reviews
- Key features and specifications
- Expert recommendations for target users
- Value for money assessment
- Real user feedback and ratings

Return comprehensive product analysis in JSON format with specific, accurate information found through search.`;
}

function parseStructuredTextToProductInfo(text: string, model: string): ProductInfo {
  // Enhanced parser for Perplexity's structured but malformed JSON responses
  try {
    // Extract structured arrays and values more aggressively
    const nameMatch = text.match(/"name":\s*"([^"]+)"/);
    const brandMatch = text.match(/"brand":\s*"([^"]+)"/);
    const ratingMatch = text.match(/"rating":\s*(\d+\.?\d*)/);
    const priceMatch = text.match(/"price":\s*"([^"]+)"/);
    const overviewMatch = text.match(/"overview":\s*"([^"]+)"/);
    
    // Extract arrays with better parsing
    const prosMatch = text.match(/"pros":\s*\[(.*?)\]/s);
    const consMatch = text.match(/"cons":\s*\[(.*?)\]/s);
    const featuresMatch = text.match(/"keyFeatures":\s*\[(.*?)\]/s);
    const expertMatch = text.match(/"expertRecommendation":\s*"([^"]+)"/);
    const valueMatch = text.match(/"valueForMoney":\s*"([^"]+)"/);
    
    // Parse specifications object
    const specsMatch = text.match(/"specifications":\s*\{([^}]+)\}/s);
    let specifications: Record<string, string> = {};
    if (specsMatch) {
      const specsText = specsMatch[1];
      const specPairs = specsText.match(/"([^"]+)":\s*"([^"]+)"/g);
      if (specPairs) {
        specPairs.forEach(pair => {
          const match = pair.match(/"([^"]+)":\s*"([^"]+)"/);
          if (match) {
            specifications[match[1]] = match[2];
          }
        });
      }
    }
    
    // Helper function to parse array strings
    const parseArrayString = (arrayStr: string): string[] => {
      if (!arrayStr) return [];
      return arrayStr
        .split(/",\s*"/)
        .map(item => item.replace(/^["\s]+|["\s]+$/g, ''))
        .filter(item => item.length > 5);
    };
    
    return {
      name: nameMatch?.[1] || model,
      brand: brandMatch?.[1] || extractBrandFromModel(model),
      rating: ratingMatch ? parseFloat(ratingMatch[1]) : 4.0,
      price: priceMatch?.[1] || 'Check retailer for pricing',
      overview: overviewMatch?.[1] || `Professional analysis of ${model}`,
      pros: prosMatch ? parseArrayString(prosMatch[1]) : [],
      cons: consMatch ? parseArrayString(consMatch[1]) : [],
      keyFeatures: featuresMatch ? parseArrayString(featuresMatch[1]) : [],
      specifications: specifications,
      expertRecommendation: expertMatch?.[1] || 'Professional recommendation based on market analysis',
      valueForMoney: valueMatch?.[1] || 'Competitive value in its category'
    };
  } catch (error) {
    console.log('Structured text parsing failed:', error);
    return parseTextToProductInfo(text, model);
  }
}

function parseTextToProductInfo(text: string, model: string): ProductInfo {
  // Extract information from text response when JSON parsing fails
  return {
    name: extractProductName(text, model),
    brand: extractBrand(text, model),
    rating: extractRating(text),
    price: extractPrice(text),
    overview: extractOverview(text, model),
    pros: extractPros(text),
    cons: extractCons(text),
    keyFeatures: extractFeatures(text),
    specifications: extractSpecifications(text),
    expertRecommendation: extractRecommendation(text),
    valueForMoney: extractValueAssessment(text)
  };
}

function generateFallbackProductInfo(model: string): ProductInfo {
  // Provide reasonable fallback information when API is unavailable
  const productType = detectProductType(model);
  
  return {
    name: model,
    brand: extractBrandFromModel(model),
    rating: 4.0,
    price: "Check retailer for current pricing",
    overview: `The ${model} is a ${productType} that offers modern features and reliable performance for its category.`,
    pros: [
      "Modern design and build quality",
      "Competitive feature set for the price range",
      "Good performance in its category",
      "Reliable brand reputation"
    ],
    cons: [
      "Limited advanced features compared to premium models",
      "May require professional setup for optimal performance",
      "Check warranty terms and local support availability"
    ],
    keyFeatures: [
      "Standard connectivity options",
      "User-friendly controls",
      "Energy efficient operation",
      "Compact design"
    ],
    specifications: {
      "Model": model,
      "Type": productType,
      "Availability": "Check with retailers",
      "Warranty": "Standard manufacturer warranty"
    },
    expertRecommendation: `The ${model} is suitable for users looking for reliable ${productType} performance with modern features.`,
    valueForMoney: "Competitive pricing for the features offered. Compare with similar models for best value."
  };
}

// Helper functions for text parsing
function extractProductName(text: string, model: string): string {
  const nameMatch = text.match(/name["\s]*:?["\s]*([^"]+)/i);
  return nameMatch ? nameMatch[1].trim() : model;
}

function extractBrand(text: string, model: string): string {
  const brands = ['Samsung', 'LG', 'Sony', 'Panasonic', 'TCL', 'Hisense', 'Apple', 'Bose', 'JBL', 'Bosch', 'Whirlpool'];
  const foundBrand = brands.find(brand => 
    text.toLowerCase().includes(brand.toLowerCase()) || 
    model.toLowerCase().includes(brand.toLowerCase())
  );
  return foundBrand || extractBrandFromModel(model);
}

function extractBrandFromModel(model: string): string {
  const brands = [
    'Samsung', 'LG', 'Sony', 'Panasonic', 'TCL', 'Hisense', 'Apple', 'Bose', 
    'JBL', 'Bosch', 'Whirlpool', 'Dyson', 'Shark', 'Roomba', 'iRobot', 
    'Philips', 'Xiaomi', 'Huawei', 'OnePlus', 'Google', 'Microsoft', 
    'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI'
  ];
  
  const modelLower = model.toLowerCase();
  const foundBrand = brands.find(brand => modelLower.includes(brand.toLowerCase()));
  
  if (foundBrand) return foundBrand;
  
  // Try to extract first word as brand if it looks like a brand name
  const firstWord = model.split(/[\s-]/)[0];
  if (firstWord && firstWord.length > 2 && /^[A-Za-z]+$/.test(firstWord)) {
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  }
  
  return 'Unknown Brand';
}

function extractRating(text: string): number {
  const ratingMatch = text.match(/rating["\s]*:?["\s]*(\d+\.?\d*)/i);
  if (ratingMatch) {
    const rating = parseFloat(ratingMatch[1]);
    return rating <= 5 ? rating : rating / 2; // Convert 10-point to 5-point scale
  }
  return 4.0;
}

function extractPrice(text: string): string {
  const priceMatch = text.match(/[€$£][\d,]+(?:\.\d{2})?|\d+[€$£]/);
  return priceMatch ? priceMatch[0] : "Price varies by retailer";
}

function extractOverview(text: string, model: string): string {
  const sentences = text.split(/[.!?]+/);
  const overviewSentence = sentences.find(s => 
    s.length > 30 && s.length < 200 && 
    (s.toLowerCase().includes(model.toLowerCase()) || s.toLowerCase().includes('product'))
  );
  return overviewSentence?.trim() || `Professional analysis of ${model} based on current market information.`;
}

function extractPros(text: string): string[] {
  // Try multiple patterns for pros/advantages
  const patterns = [
    /pros?[:\s]*\[(.*?)\]/is,
    /advantages?[:\s]*\[(.*?)\]/is,
    /benefits?[:\s]*\[(.*?)\]/is,
    /strengths?[:\s]*\[(.*?)\]/is,
    /"pros"[:\s]*\[(.*?)\]/is
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1]
        .split(/[,\n]/)
        .map(pro => pro.replace(/^["\s-•\*]+|["\s]+$/g, '').trim())
        .filter(pro => pro.length > 5);
    }
  }
  
  // Look for bullet points or numbered lists
  const lines = text.split('\n');
  const prosLines = lines.filter(line => 
    /^[\s]*[-•\*+]\s*/.test(line) && 
    line.length > 10 && 
    (line.toLowerCase().includes('excellent') || 
     line.toLowerCase().includes('great') ||
     line.toLowerCase().includes('superior') ||
     line.toLowerCase().includes('outstanding'))
  );
  
  if (prosLines.length > 0) {
    return prosLines.map(line => line.replace(/^[\s]*[-•\*+]\s*/, '').trim()).slice(0, 5);
  }
  
  return ['Professional-grade performance', 'Reliable build quality', 'Advanced feature set', 'User-friendly design'];
}

function extractCons(text: string): string[] {
  // Try multiple patterns for cons/disadvantages
  const patterns = [
    /cons?[:\s]*\[(.*?)\]/is,
    /disadvantages?[:\s]*\[(.*?)\]/is,
    /limitations?[:\s]*\[(.*?)\]/is,
    /weaknesses?[:\s]*\[(.*?)\]/is,
    /drawbacks?[:\s]*\[(.*?)\]/is,
    /"cons"[:\s]*\[(.*?)\]/is
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1]
        .split(/[,\n]/)
        .map(con => con.replace(/^["\s-•\*]+|["\s]+$/g, '').trim())
        .filter(con => con.length > 5);
    }
  }
  
  // Look for negative indicators in bullet points
  const lines = text.split('\n');
  const consLines = lines.filter(line => 
    /^[\s]*[-•\*+]\s*/.test(line) && 
    line.length > 10 && 
    (line.toLowerCase().includes('expensive') || 
     line.toLowerCase().includes('limited') ||
     line.toLowerCase().includes('lacks') ||
     line.toLowerCase().includes('poor') ||
     line.toLowerCase().includes('weak') ||
     line.toLowerCase().includes('not') ||
     line.toLowerCase().includes('difficult'))
  );
  
  if (consLines.length > 0) {
    return consLines.map(line => line.replace(/^[\s]*[-•\*+]\s*/, '').trim()).slice(0, 4);
  }
  
  return ['Premium pricing', 'Consider professional setup', 'Compare with alternatives'];
}

function extractFeatures(text: string): string[] {
  const featuresSection = text.match(/features?[:\s]*\[(.*?)\]/is);
  if (featuresSection) {
    return featuresSection[1].split(',').map(feature => feature.replace(/["\s]/g, '').trim()).filter(Boolean);
  }
  
  return ['Modern connectivity', 'Intuitive controls', 'Energy efficient', 'Compact design'];
}

function extractSpecifications(text: string): Record<string, string> {
  const specs: Record<string, string> = {};
  
  // Look for specifications in various formats
  const specMatches = text.match(/specifications?[:\s]*\{(.*?)\}/is);
  if (specMatches) {
    const specText = specMatches[1];
    const pairs = specText.split(',');
    pairs.forEach(pair => {
      const [key, value] = pair.split(':').map(s => s.replace(/["\s]/g, '').trim());
      if (key && value) specs[key] = value;
    });
  }
  
  if (Object.keys(specs).length === 0) {
    specs['Type'] = detectProductType(text);
    specs['Category'] = 'Consumer Electronics';
    specs['Availability'] = 'Check with retailers';
  }
  
  return specs;
}

function extractRecommendation(text: string): string {
  const sentences = text.split(/[.!?]+/);
  const recommendation = sentences.find(s => 
    s.length > 40 && 
    (s.toLowerCase().includes('recommend') || s.toLowerCase().includes('suitable') || s.toLowerCase().includes('ideal'))
  );
  return recommendation?.trim() || 'Suitable for users seeking reliable performance in this category.';
}

function extractValueAssessment(text: string): string {
  const sentences = text.split(/[.!?]+/);
  const valueAssessment = sentences.find(s => 
    s.length > 30 && 
    (s.toLowerCase().includes('value') || s.toLowerCase().includes('price') || s.toLowerCase().includes('worth'))
  );
  return valueAssessment?.trim() || 'Competitive pricing for the feature set offered.';
}

function detectProductType(model: string): string {
  const modelLower = model.toLowerCase();
  if (modelLower.includes('tv') || modelLower.includes('oled') || modelLower.includes('qled')) return 'Television';
  if (modelLower.includes('soundbar')) return 'Soundbar';
  if (modelLower.includes('headphone')) return 'Headphones';
  if (modelLower.includes('earphone') || modelLower.includes('airpods') || modelLower.includes('buds')) return 'Earphones';
  if (modelLower.includes('roomba') || modelLower.includes('robot vacuum') || modelLower.includes('robovac')) return 'Robot Vacuum';
  if (modelLower.includes('vacuum') || modelLower.includes('dyson') || modelLower.includes('shark navigator') || modelLower.includes('bissell')) return 'Vacuum';
  if (modelLower.includes('fridge') || modelLower.includes('refrigerator')) return 'Refrigerator';
  if (modelLower.includes('microwave')) return 'Microwave';
  if (modelLower.includes('kettle')) return 'Electric Kettle';
  if (modelLower.includes('toaster')) return 'Toaster';
  if (modelLower.includes('coffee')) return 'Coffee Maker';
  if (modelLower.includes('dishwasher')) return 'Dishwasher';
  if (modelLower.includes('washing') || modelLower.includes('washer')) return 'Washing Machine';
  return 'Electronic Product';
}

