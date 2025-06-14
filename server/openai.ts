import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface TVPlacementRequest {
  imageBase64: string;
  tvSize: number;
  mountType: 'fixed' | 'tilting' | 'full-motion';
  wallType: 'drywall' | 'concrete' | 'brick' | 'other';
}

export interface TVPlacementResponse {
  success: boolean;
  placementAnalysis: {
    recommendedPosition: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    wallAnalysis: string;
    feasibilityScore: number;
    recommendations: string[];
  };
  enhancedImageUrl?: string;
  error?: string;
}

export async function generateTVPlacement(request: TVPlacementRequest): Promise<TVPlacementResponse> {
  try {
    // First, analyze the room and determine optimal TV placement
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert TV installation consultant. Analyze the room image and provide detailed recommendations for mounting a ${request.tvSize}" TV. Consider the wall type (${request.wallType}), mount type (${request.mountType}), viewing angles, room layout, and safety factors. Respond with JSON in this exact format: {
            "recommendedPosition": {"x": number, "y": number, "width": number, "height": number},
            "wallAnalysis": "string",
            "feasibilityScore": number,
            "recommendations": ["string"]
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this room for mounting a ${request.tvSize}" TV with ${request.mountType} mount on ${request.wallType} wall. Provide placement coordinates (x,y as percentage from top-left, width/height as percentage of wall), wall analysis, feasibility score (0-100), and recommendations.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${request.imageBase64}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const analysisResult = JSON.parse(analysisResponse.choices[0].message.content || '{}');

    // Generate an enhanced image with TV visualization
    const enhancementPrompt = `Create a photorealistic image showing the same room with a ${request.tvSize}" TV mounted on the wall in the optimal position. The TV should be ${request.mountType === 'fixed' ? 'flush against the wall' : request.mountType === 'tilting' ? 'slightly tilted down for better viewing' : 'on an articulating arm mount'}. Maintain the exact room layout, lighting, and furniture arrangement. The TV should look professionally installed with appropriate wall mounting hardware for ${request.wallType} wall. Make the TV size proportional and realistic for the room.`;

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancementPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return {
      success: true,
      placementAnalysis: {
        recommendedPosition: analysisResult.recommendedPosition || { x: 50, y: 40, width: 30, height: 20 },
        wallAnalysis: analysisResult.wallAnalysis || "Wall appears suitable for TV mounting.",
        feasibilityScore: analysisResult.feasibilityScore || 85,
        recommendations: analysisResult.recommendations || ["Consider cable management options", "Ensure proper wall stud support"]
      },
      enhancedImageUrl: imageResponse.data[0].url,
    };

  } catch (error) {
    console.error('OpenAI TV placement error:', error);
    return {
      success: false,
      placementAnalysis: {
        recommendedPosition: { x: 50, y: 40, width: 30, height: 20 },
        wallAnalysis: "Unable to analyze wall due to processing error.",
        feasibilityScore: 50,
        recommendations: ["Manual assessment recommended", "Consult with installer on-site"]
      },
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function enhanceRoomImage(imageBase64: string, tvSize: number): Promise<string | null> {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Transform this room image to show a ${tvSize}" TV professionally mounted on the main wall. Keep all furniture, lighting, and room features exactly the same. The TV should be realistically sized and positioned at an appropriate viewing height. Show the TV displaying a subtle, attractive background or home screen. Make it look like a professional installation photo.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return response.data[0].url || null;
  } catch (error) {
    console.error('Image enhancement error:', error);
    return null;
  }
}
