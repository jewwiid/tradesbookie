if (!process.env.PERPLEXITY_API_KEY) {
  throw new Error("PERPLEXITY_API_KEY environment variable must be set");
}

interface QuestionnaireAnswers {
  question1: string; // Category-specific question 1 answer
  question2: string; // Category-specific question 2 answer
  question3: string; // Category-specific question 3 answer
}

interface ProductComparisonResult {
  winner: string;
  verdict: string;
  model1_name: string;
  model1_rating: number;
  model1_review: string;
  model2_name: string;
  model2_rating: number;
  model2_review: string;
  key_differences: string[];
  personalized_recommendation: string;
  budget_consideration: string;
}

export async function compareElectronicProducts(
  product1: string, 
  product2: string, 
  productCategory: string,
  questionnaire: QuestionnaireAnswers
): Promise<ProductComparisonResult> {
  
  const personalizedContext = `
User Profile based on ${productCategory} category questions:
- Answer 1: ${questionnaire.question1}
- Answer 2: ${questionnaire.question2}
- Answer 3: ${questionnaire.question3}
`;

  const prompt = `Compare these two ${productCategory} products and provide a comprehensive analysis with current 2024-2025 market information, personalized for this specific user:

${personalizedContext}

Product 1: ${product1}
Product 2: ${product2}
Category: ${productCategory}

I need a detailed comparison with the following structure:
1. Overall winner and reasoning based on current market data AND user's specific needs
2. Individual reviews for each product with ratings (1-5 stars)
3. Key differences between the products
4. A comprehensive verdict explaining which is better for THIS SPECIFIC USER and why
5. Personalized recommendation based on their usage, experience level, and priorities
6. Budget consideration for this user's priorities

Focus on current information including:
- Performance benchmarks and real-world testing data
- Build quality and design
- Current market pricing and value for money
- User experience and ease of use (especially considering their technical experience level)
- Feature set and how it aligns with their stated usage and priorities
- Current availability in Irish/European market
- Latest reviews and reliability data from expert sources
- 2024-2025 model updates and improvements
- Compatibility and ecosystem considerations
- Long-term value and future-proofing

Tailor the comparison specifically to their answers for ${productCategory}:
- Question 1 response: ${questionnaire.question1}
- Question 2 response: ${questionnaire.question2}
- Question 3 response: ${questionnaire.question3}

Use these specific responses to provide highly personalized recommendations that align with their stated preferences for this product category.

Please provide current pricing information and availability status. Respond with valid JSON in this exact format:
{
  "winner": "Product name that wins overall for this user",
  "verdict": "Comprehensive paragraph explaining the verdict and recommendation with current market context and user-specific reasoning",
  "model1_name": "Clean product name for product 1",
  "model1_rating": 4,
  "model1_review": "Detailed review of product 1's strengths and weaknesses with current market info and how it fits this user's needs",
  "model2_name": "Clean product name for product 2", 
  "model2_rating": 3,
  "model2_review": "Detailed review of product 2's strengths and weaknesses with current market info and how it fits this user's needs",
  "key_differences": [
    "Current pricing difference and value for this user",
    "Performance difference relevant to their usage",
    "Feature difference that matters for their priorities",
    "Ease of use difference considering their technical experience"
  ],
  "personalized_recommendation": "Specific recommendation explaining why the winner is perfect for this user's usage, experience level, and priorities",
  "budget_consideration": "Analysis of whether the recommended product offers good value for this user's specific priorities and needs"
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
            content: "You are an expert electronics reviewer and buying guide specialist. Provide accurate, current information based on real market data and reviews. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response format from Perplexity API");
    }

    const content = data.choices[0].message.content;
    
    // Clean the response - remove any markdown formatting or extra text
    let cleanContent = content.trim();
    
    // Extract JSON if it's wrapped in markdown code blocks
    const jsonMatch = cleanContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      cleanContent = jsonMatch[1].trim();
    }
    
    // Remove any text before the first { or after the last }
    const firstBrace = cleanContent.indexOf('{');
    const lastBrace = cleanContent.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
    }

    try {
      const result = JSON.parse(cleanContent);
      
      // Validate required fields
      const requiredFields = ['winner', 'verdict', 'model1_name', 'model1_rating', 'model1_review', 
                             'model2_name', 'model2_rating', 'model2_review', 'key_differences', 
                             'personalized_recommendation', 'budget_consideration'];
      
      for (const field of requiredFields) {
        if (!result[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      return result;
    } catch (parseError) {
      console.error("Failed to parse Perplexity response as JSON:", parseError);
      console.error("Raw content:", cleanContent);
      throw new Error("Failed to parse product comparison response");
    }
  } catch (error) {
    console.error("Electronic product comparison error:", error);
    throw new Error("Failed to generate electronic product comparison with current market data");
  }
}