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
    // Generate a realistic TV installation preview using DALL-E
    const imagePrompt = `Create a realistic, professional photo of a living room interior with a ${tvSize}-inch flat-screen TV mounted on a ${wallType} wall using a ${mountType} wall mount. Modern flat-screen TV, powered off with black screen, ${mountType} wall mount at optimal viewing height, ${wallType} wall with appropriate texture, ${concealment === 'concealed' ? 'all cables hidden behind wall' : 'power cable visible along wall'}, natural interior lighting, clean modern home interior, realistic proportions and shadows, professional installation appearance. Style: Photo-realistic interior photography, well-lit, clean and modern home setting.`;

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
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
