import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable must be set");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  const prompt = `Compare these two TV models and provide a comprehensive analysis:

Model 1: ${model1}
Model 2: ${model2}

Please provide a detailed comparison with the following structure:
1. Overall winner and reasoning
2. Individual reviews for each model with ratings (1-5 stars)
3. Key differences between the models
4. A comprehensive verdict explaining which is better and why

Focus on:
- Picture quality (HDR, contrast, brightness, color accuracy)
- Smart TV features and operating system
- Build quality and design
- Value for money
- Gaming performance (if applicable)
- Sound quality
- Irish market availability and pricing
- Reliability and brand reputation

Respond with valid JSON in this exact format:
{
  "winner": "Model name that wins overall",
  "verdict": "Comprehensive paragraph explaining the verdict and recommendation",
  "model1_name": "Clean model name for model 1",
  "model1_rating": 4,
  "model1_review": "Detailed review of model 1's strengths and weaknesses",
  "model2_name": "Clean model name for model 2", 
  "model2_rating": 3,
  "model2_review": "Detailed review of model 2's strengths and weaknesses",
  "key_differences": [
    "Difference 1",
    "Difference 2",
    "Difference 3"
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert TV reviewer with deep knowledge of the Irish electronics market. Provide honest, detailed comparisons based on real TV specifications, performance data, and market pricing. Always respond with valid JSON matching the specified format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const comparisonText = response.choices[0].message.content;
    if (!comparisonText) {
      throw new Error("No comparison generated");
    }

    console.log("Raw AI comparison response:", comparisonText);

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

      console.log("Successfully parsed TV comparison:", {
        winner: comparison.winner,
        model1: comparison.model1_name,
        model2: comparison.model2_name,
        model1_rating: comparison.model1_rating,
        model2_rating: comparison.model2_rating
      });

      return comparison;
    } catch (parseError) {
      console.error("Failed to parse AI comparison response:", parseError);
      console.error("Raw response was:", comparisonText);
      throw new Error("Failed to parse AI comparison response");
    }
  } catch (error) {
    console.error("Error generating TV comparison:", error);
    throw new Error("Failed to generate TV comparison");
  }
}