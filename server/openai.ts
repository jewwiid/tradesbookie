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
  mountType: string = "fixed"
): Promise<AIPreviewResult> {
  try {
    // First, analyze the room to determine the best TV placement
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert TV installation consultant. Analyze the room image and provide detailed placement recommendations for a ${tvSize}" TV with ${mountType} mount. Respond with JSON format containing placement details.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this room image and recommend the optimal placement for a ${tvSize}" TV with a ${mountType} mount. Consider wall space, viewing angles, furniture arrangement, and safety. Provide your response in JSON format with the following structure: {"wall_recommendation": "description", "height_recommendation": "description", "viewing_angle": "description", "safety_considerations": "description", "placement_confidence": "high/medium/low"}`
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
      max_tokens: 1000,
    });

    const analysisResult = JSON.parse(analysisResponse.choices[0].message.content || "{}");
    
    // Generate a detailed prompt for TV placement visualization
    const visualizationPrompt = `Create a photorealistic visualization of a ${tvSize}" TV mounted on the wall in this room. 

Mount type: ${mountType}
Wall recommendation: ${analysisResult.wall_recommendation || "main wall"}
Height: ${analysisResult.height_recommendation || "eye level when seated"}

Requirements:
- Keep the existing room exactly as it is
- Add only a ${tvSize}" flat-screen TV mounted on the appropriate wall
- The TV should look professionally installed with proper proportions
- Maintain realistic lighting and shadows
- The TV should appear to be off (black screen)
- Ensure the mount type is appropriate (${mountType})
- Keep all furniture and decor unchanged

Make it look like a professional installation photo that a customer would see after the work is completed.`;

    // Generate the TV preview image
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: visualizationPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return {
      success: true,
      imageUrl: imageResponse.data[0].url
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
