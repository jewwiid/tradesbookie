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
    // Use GPT-4o to edit the original image by adding a TV
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional photo editor specializing in TV installation previews. Your task is to describe exactly how to add a TV to the existing room photo while keeping everything else identical. Be extremely specific about maintaining the original room's appearance, lighting, and perspective.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this room photo and provide detailed instructions for adding a ${tvSize}" TV to create an installation preview. 

BOOKING DETAILS:
- TV Size: ${tvSize} inches
- Mount Type: ${mountType}
- Wall Type: ${wallType}
- Cable Concealment: ${concealment}

CRITICAL REQUIREMENTS:
1. Keep the EXACT same room - same walls, furniture, lighting, colors, textures
2. Keep the EXACT same camera angle and perspective
3. Only add a TV mounted on the most suitable wall
4. TV should be black (powered off)
5. Mount should match the specified type: ${mountType}
6. If concealment is requested, hide cables appropriately
7. Maintain realistic proportions and shadows

Describe the TV placement location and how it integrates with the existing room without changing anything else. Format as detailed editing instructions.`
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
      max_tokens: 1000,
    });

    const editingInstructions = response.choices[0].message.content;

    // Create a highly specific prompt for DALL-E that emphasizes maintaining the original room
    const imagePrompt = `Photo-realistic room interior EXACTLY like the reference image provided, but with a ${tvSize}" flat-screen TV added.

ROOM SPECIFICATIONS FROM REFERENCE:
- Keep identical wall colors, textures, and finishes
- Keep identical furniture placement and style  
- Keep identical lighting conditions and shadows
- Keep identical camera angle and perspective
- Keep identical floor and ceiling
- Keep identical decorative elements

TV INSTALLATION DETAILS:
- ${tvSize}" black flat-screen TV (powered off)
- ${mountType} wall mount on ${wallType} wall
- ${concealment === 'none' ? 'Visible cables' : 'Hidden/concealed cables'}
- Professional installation appearance
- Proper proportions for room size
- Natural shadows cast by TV

CRITICAL: This should look like the SAME room as the reference, just with a TV professionally installed. Do not redesign, redecorate, or change the room's character in any way.`;

    // Generate the TV preview image
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
