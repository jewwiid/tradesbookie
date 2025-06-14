import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "default_key"
});

export interface AIPreviewResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export async function generateTVPreview(
  roomImageBase64: string,
  tvSize: string,
  mountType: string = "fixed",
  wallType: string = "drywall",
  concealment: string = "none"
): Promise<AIPreviewResult> {
  try {
    // First analyze the existing room to understand its characteristics
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a TV installation expert. Analyze this room photo and describe its key characteristics for creating a realistic TV installation preview."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this room photo and describe: 1) Wall colors and textures, 2) Lighting conditions, 3) Furniture placement, 4) Room style and decor, 5) Best wall for TV placement. Keep description under 100 words and focus on visual details that would help recreate this exact room with a TV added.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${roomImageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 150
    });

    const roomDescription = analysisResponse.choices[0].message.content;

    // Generate realistic TV installation that maintains the original room appearance
    const enhancedPrompt = `Exact replica of this room: ${roomDescription}. Add ONLY a ${tvSize}-inch black flat-screen TV mounted on the most suitable wall using a ${mountType} mount at proper viewing height (55-65 inches from floor). ${concealment === 'concealed' ? 'All cables hidden behind wall for clean installation' : 'Power cable neatly run along wall'}. Keep everything else identical: same lighting, same furniture positions, same wall colors, same decor, same perspective. The TV should appear as if professionally installed in this exact space without changing anything else.`;

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return {
      success: true,
      imageUrl: imageResponse.data?.[0]?.url || ""
    };

  } catch (error) {
    console.error("Error generating TV preview:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate TV preview"
    };
  }
}

export async function analyzeRoomForTVPlacement(roomImageBase64: string): Promise<{
  recommendations: string[];
  warnings: string[];
  confidence: "high" | "medium" | "low";
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional TV installation expert. Analyze room images and provide installation recommendations and warnings. Respond in JSON format."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this room for TV installation. Provide recommendations for optimal TV placement and any warnings about potential issues. Format your response as JSON: {"recommendations": ["list of recommendations"], "warnings": ["list of warnings"], "confidence": "high/medium/low"}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${roomImageBase64}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      recommendations: result.recommendations || [],
      warnings: result.warnings || [],
      confidence: result.confidence || "medium"
    };
  } catch (error) {
    console.error("Error analyzing room:", error);
    return {
      recommendations: ["Unable to analyze room automatically. Our installer will assess during visit."],
      warnings: ["Please ensure adequate wall space and power outlets are available."],
      confidence: "low"
    };
  }
}
