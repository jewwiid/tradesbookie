if (!process.env.PERPLEXITY_API_KEY) {
  throw new Error("PERPLEXITY_API_KEY environment variable must be set");
}

interface TVComparisonResult {
  winner: string;
  verdict: string;
  model1_name: string;
  model1_rating: number;
  model1_review: string;
  model2_name: string;
  model2_rating: number;
  model2_review: string;
  key_differences: string[];
}

export async function compareTVModels(model1: string, model2: string): Promise<TVComparisonResult> {
  const prompt = `Compare these two TV models and provide a comprehensive analysis with current 2024-2025 market information:

Model 1: ${model1}
Model 2: ${model2}

I need a detailed comparison with the following structure:
1. Overall winner and reasoning based on current market data
2. Individual reviews for each model with ratings (1-5 stars)
3. Key differences between the models
4. A comprehensive verdict explaining which is better and why

Focus on current information including:
- Picture quality (HDR, contrast, brightness, color accuracy) - use RTINGS measurements
- Smart TV features and operating system
- Build quality and design
- Current market pricing and value for money
- Gaming performance (if applicable) - include RTINGS input lag and gaming scores
- Sound quality
- Current availability in Irish market (Harvey Norman)
- Latest reviews and reliability data from RTINGS and other expert sources
- 2024-2025 model updates and improvements
- RTINGS overall scores and specific measurement data

Please provide current pricing information and availability status. Respond with valid JSON in this exact format:
{
  "winner": "Model name that wins overall",
  "verdict": "Comprehensive paragraph explaining the verdict and recommendation with current market context",
  "model1_name": "Clean model name for model 1",
  "model1_rating": 4,
  "model1_review": "Detailed review of model 1's strengths and weaknesses with current market info",
  "model2_name": "Clean model name for model 2", 
  "model2_rating": 3,
  "model2_review": "Detailed review of model 2's strengths and weaknesses with current market info",
  "key_differences": [
    "Current pricing difference",
    "Performance difference",
    "Feature difference"
  ]
}`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: "You are an expert TV reviewer with access to current market data and RTINGS professional measurements. Analyze real TV specifications, RTINGS test results, current pricing, and latest reviews. Always respond with valid JSON matching the specified format. Use current 2024-2025 market information and include specific RTINGS scores where available."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: "month",
        stream: false,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const comparisonText = data.choices[0]?.message?.content;
    
    if (!comparisonText) {
      throw new Error("No comparison generated from Perplexity API");
    }

    console.log("Raw Perplexity comparison response:", comparisonText);

    try {
      const comparison = JSON.parse(comparisonText) as TVComparisonResult;
      
      // Validate required fields
      if (!comparison.winner || !comparison.verdict || !comparison.model1_name || !comparison.model2_name) {
        throw new Error("Invalid comparison response format");
      }

      // Ensure ratings are within valid range
      comparison.model1_rating = Math.max(1, Math.min(5, comparison.model1_rating));
      comparison.model2_rating = Math.max(1, Math.min(5, comparison.model2_rating));

      // Ensure key_differences is an array
      if (!Array.isArray(comparison.key_differences)) {
        comparison.key_differences = [];
      }

      console.log("Successfully parsed TV comparison with live data:", {
        winner: comparison.winner,
        model1: comparison.model1_name,
        model2: comparison.model2_name,
        model1_rating: comparison.model1_rating,
        model2_rating: comparison.model2_rating
      });

      return comparison;
    } catch (parseError) {
      console.error("Failed to parse Perplexity comparison response:", parseError);
      console.error("Raw response was:", comparisonText);
      throw new Error("Failed to parse Perplexity comparison response");
    }
  } catch (error) {
    console.error("Error generating TV comparison with live data:", error);
    throw new Error("Failed to generate TV comparison with current market data");
  }
}