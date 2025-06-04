import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface TVPlacementRequest {
  roomImageBase64: string;
  tvSize: number;
  mountType: 'fixed' | 'tilting' | 'full-motion';
  wallType: 'drywall' | 'concrete' | 'brick' | 'other';
}

export interface TVPlacementResponse {
  success: boolean;
  imageUrl?: string;
  description?: string;
  error?: string;
}

export async function generateTVPlacementPreview(
  request: TVPlacementRequest
): Promise<TVPlacementResponse> {
  try {
    // First, analyze the room image to understand the space
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert TV installation consultant. Analyze room photos to determine the best TV placement. Respond with JSON containing placement recommendations."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this room photo for TV installation. The customer wants to mount a ${request.tvSize}" TV with a ${request.mountType} mount on a ${request.wallType} wall. 
              
              Please provide:
              1. The best wall location for the TV
              2. Optimal height from floor
              3. Any furniture that might need to be moved
              4. Viewing angle considerations
              5. A detailed description for image generation
              
              Respond in JSON format with these fields: wallLocation, optimalHeight, furnitureNotes, viewingNotes, imagePrompt`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${request.roomImageBase64}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const analysis = JSON.parse(analysisResponse.choices[0].message.content || "{}");
    
    // Generate the TV placement image using DALL-E
    const imagePrompt = `Photo-realistic interior room image showing a ${request.tvSize}" flat screen TV mounted on the wall with a ${request.mountType} mount. ${analysis.imagePrompt || 'Modern living room with TV mounted at optimal viewing height, showing clean cable management and professional installation.'} The TV should be prominently displayed on the wall, appearing naturally integrated into the space. High quality, realistic lighting, clean and modern aesthetic.`;

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return {
      success: true,
      imageUrl: imageResponse.data[0].url,
      description: `${request.tvSize}" TV mounted using ${request.mountType} mount. ${analysis.wallLocation ? `Recommended placement: ${analysis.wallLocation}` : ''} ${analysis.optimalHeight ? `Optimal height: ${analysis.optimalHeight}` : ''}`
    };

  } catch (error: any) {
    console.error("Error generating TV placement preview:", error);
    return {
      success: false,
      error: `Failed to generate TV placement preview: ${error.message}`
    };
  }
}

export async function analyzeRoomForTVInstallation(
  roomImageBase64: string
): Promise<{
  success: boolean;
  analysis?: {
    wallSuitability: string;
    recommendedTVSize: string;
    potentialChallenges: string[];
    installationNotes: string;
  };
  error?: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional TV installation expert. Analyze room photos to provide installation recommendations and identify potential challenges."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this room for TV installation. Provide recommendations about wall suitability, optimal TV size, potential installation challenges, and any special installation notes. Respond in JSON format with fields: wallSuitability, recommendedTVSize, potentialChallenges (array), installationNotes."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${roomImageBase64}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      success: true,
      analysis
    };

  } catch (error: any) {
    console.error("Error analyzing room:", error);
    return {
      success: false,
      error: `Failed to analyze room: ${error.message}`
    };
  }
}
