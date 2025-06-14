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
}

export async function generateTVRecommendation(answers: QuestionnaireAnswers): Promise<TVRecommendation> {
  const prompt = `Based on these user preferences, recommend the best TV technology and specific model:

Usage: ${answers.usage}
Budget: ${answers.budget}
Room Environment: ${answers.room}
Gaming Importance: ${answers.gaming}
Priority Feature: ${answers.features}

Consider these TV technologies:
- QLED: Bright colors, good for bright rooms, Samsung's quantum dot technology
- MINI LED: Local dimming, high contrast, premium brightness control
- OLED: Perfect blacks, infinite contrast, best for dark rooms, premium picture quality
- 144Hz Frame TV: High refresh rate gaming, art mode when not in use
- Anti-Reflection: Matte finish, reduces glare, great for bright environments

Provide a recommendation in JSON format with:
- type: The TV technology (QLED, MINI LED, OLED, 144Hz Frame TV, Anti-Reflection)
- model: A realistic specific model or model series name
- reasons: Array of 3-4 personalized reasons why this TV matches their needs
- pros: Array of 4-5 key advantages
- cons: Array of 2-3 honest considerations or limitations
- priceRange: Realistic price range in euros
- bestFor: Array of 3-4 use cases this TV excels at

Be specific about real TV technologies and realistic model names. Focus on matching their actual stated preferences.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a TV expert who provides personalized recommendations based on user needs. Always respond with valid JSON matching the specified format."
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

    const recommendation: TVRecommendation = JSON.parse(recommendationText);
    
    // Validate the response structure
    if (!recommendation.type || !recommendation.model || !Array.isArray(recommendation.reasons)) {
      throw new Error("Invalid recommendation format");
    }

    return recommendation;
  } catch (error) {
    console.error("TV recommendation error:", error);
    throw new Error("Failed to generate TV recommendation");
  }
}

export async function getTVComparisonInsights(tvType1: string, tvType2: string): Promise<string> {
  const prompt = `Compare ${tvType1} vs ${tvType2} TV technologies. Provide a brief, practical comparison focusing on real-world differences that matter to consumers.`;

  try {
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