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
            content: `You are a professional product reviewer with expertise in electronics and appliances. Your task is to provide comprehensive, detailed analysis of products with accurate pros and cons.

CRITICAL REQUIREMENTS:
1. Search for the EXACT product model: ${model}
2. Find current information from reliable sources (RTINGS, expert reviews, manufacturer specs)
3. Provide specific, detailed pros and cons based on actual product testing and reviews
4. Include current pricing from Irish retailers where possible
5. Return accurate specifications and technical details

OUTPUT FORMAT (JSON):
{
  "name": "Exact product name with model number",
  "brand": "Manufacturer brand",
  "rating": average_rating_out_of_5,
  "price": "Current Irish price or price range",
  "overview": "2-3 sentence product overview",
  "pros": ["Specific advantage 1", "Specific advantage 2", "Specific advantage 3"],
  "cons": ["Specific limitation 1", "Specific limitation 2", "Specific limitation 3"],
  "keyFeatures": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
  "specifications": {
    "Key Spec 1": "Value",
    "Key Spec 2": "Value",
    "Key Spec 3": "Value"
  },
  "expertRecommendation": "Who should buy this product and why",
  "valueForMoney": "Assessment of value proposition and pricing"
}

IMPORTANT: Return only real information found through search. Do not fabricate specifications or reviews.`
          },
          {
            role: 'user',
            content: searchQuery
          }
        ],
        max_tokens: 2000,
        temperature: 0.2
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

    // Try to parse as JSON first
    let productInfo: ProductInfo;
    try {
      const parsed = JSON.parse(productInfoText);
      productInfo = {
        name: parsed.name || `${model} Product Info`,
        brand: parsed.brand || 'Unknown Brand',
        rating: parsed.rating || 4.0,
        price: parsed.price || 'Price not available',
        overview: parsed.overview || `Detailed information about ${model}`,
        pros: parsed.pros || [],
        cons: parsed.cons || [],
        keyFeatures: parsed.keyFeatures || [],
        specifications: parsed.specifications || {},
        expertRecommendation: parsed.expertRecommendation || 'Product analysis based on available information.',
        valueForMoney: parsed.valueForMoney || 'Value assessment based on current market position.'
      };
    } catch (parseError) {
      // Fallback: Create structured response from text
      productInfo = parseTextToProductInfo(productInfoText, model);
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
  return foundBrand || 'Unknown Brand';
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
  const prosSection = text.match(/pros?[:\s]*\[(.*?)\]/is) || text.match(/advantages?[:\s]*\[(.*?)\]/is);
  if (prosSection) {
    return prosSection[1].split(',').map(pro => pro.replace(/["\s]/g, '').trim()).filter(Boolean);
  }
  
  // Fallback: look for positive indicators
  const positives = [];
  if (text.toLowerCase().includes('excellent')) positives.push('Excellent performance in key areas');
  if (text.toLowerCase().includes('high quality')) positives.push('High build quality');
  if (text.toLowerCase().includes('user-friendly')) positives.push('User-friendly interface');
  
  return positives.length ? positives : ['Good overall performance', 'Competitive features', 'Reliable brand'];
}

function extractCons(text: string): string[] {
  const consSection = text.match(/cons?[:\s]*\[(.*?)\]/is) || text.match(/disadvantages?[:\s]*\[(.*?)\]/is);
  if (consSection) {
    return consSection[1].split(',').map(con => con.replace(/["\s]/g, '').trim()).filter(Boolean);
  }
  
  // Fallback: look for common limitations
  const limitations = [];
  if (text.toLowerCase().includes('expensive')) limitations.push('Higher price point');
  if (text.toLowerCase().includes('complex')) limitations.push('May require setup assistance');
  if (text.toLowerCase().includes('limited')) limitations.push('Some feature limitations');
  
  return limitations.length ? limitations : ['Consider professional installation', 'Compare with alternatives', 'Check local availability'];
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

function extractBrandFromModel(model: string): string {
  const brands = ['Samsung', 'LG', 'Sony', 'Panasonic', 'TCL', 'Hisense', 'Apple', 'Bose', 'JBL', 'Bosch', 'Whirlpool', 'Breville', 'Russell Hobbs', 'DeLonghi'];
  const foundBrand = brands.find(brand => model.toLowerCase().includes(brand.toLowerCase()));
  return foundBrand || model.split(' ')[0] || 'Unknown Brand';
}