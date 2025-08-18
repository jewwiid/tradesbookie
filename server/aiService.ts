import OpenAI from "openai";
import { AIAnalyticsService } from './aiAnalyticsService';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function generateAIPreview(
  base64Image: string, 
  tvSize: number, 
  trackingData?: {
    userId?: string;
    sessionId: string;
    qrCodeId?: string;
    storeLocation?: string;
    userAgent?: string;
    ipAddress?: string;
    deviceType?: string;
    creditUsed?: boolean;
  }
): Promise<string> {
  const startTime = Date.now();
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that helps visualize TV installations. You need to analyze the provided room image and describe how a ${tvSize}" TV would look when professionally mounted on the wall. Focus on realistic placement considering wall space, furniture positioning, and viewing angles. Provide detailed guidance for TV placement without generating actual images.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this room image and provide a detailed description of where and how a ${tvSize}" TV should be mounted on the wall. Consider the room layout, wall space, furniture positioning, and optimal viewing angles. Describe the exact placement, height, and how it would integrate with the existing room design.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    const processingTime = Date.now() - startTime;
    
    const aiResponse = analysis.description || `AI analysis suggests mounting the ${tvSize}" TV on the main wall at eye level, approximately 42-48 inches from the floor to the center of the screen. The placement would complement the existing furniture layout and provide optimal viewing angles.`;
    
    // Track the AI interaction for analytics
    if (trackingData) {
      await AIAnalyticsService.trackInteraction({
        ...trackingData,
        aiTool: 'tv-preview',
        interactionType: 'analysis',
        userPrompt: `TV size: ${tvSize}" with room image analysis`,
        category: 'tv',
        aiResponse,
        processingTimeMs: processingTime,
        responseTokens: response.usage?.completion_tokens,
        analysisData: {
          tvSize,
          analysisType: 'room_visualization',
          wallPlacement: analysis.recommendedWallArea,
          mountingHeight: analysis.mountingHeight
        }
      });
    }
    
    return aiResponse;
    
  } catch (error) {
    console.error("Error generating AI preview:", error);
    
    // Track error for analytics
    if (trackingData) {
      await AIAnalyticsService.trackInteraction({
        ...trackingData,
        aiTool: 'tv-preview',
        interactionType: 'analysis',
        userPrompt: `TV size: ${tvSize}" with room image analysis`,
        category: 'tv',
        aiResponse: 'Error occurred during analysis',
        processingTimeMs: Date.now() - startTime,
        errorOccurred: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    throw new Error("Failed to generate AI preview");
  }
}

export async function analyzeRoomForTVPlacement(base64Image: string): Promise<{
  recommendedWallArea: string;
  mountingHeight: string;
  viewingDistance: string;
  considerations: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional TV installation expert. Analyze room images to provide optimal TV mounting recommendations. Return your analysis in JSON format with specific measurements and considerations."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this room for TV installation. Provide recommendations for wall placement, mounting height, viewing distance, and any special considerations. Format your response as JSON with keys: recommendedWallArea, mountingHeight, viewingDistance, and considerations (array)."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 400,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error("Error analyzing room:", error);
    return {
      recommendedWallArea: "Main wall opposite seating area",
      mountingHeight: "42-48 inches from floor to center",
      viewingDistance: "8-10 feet optimal",
      considerations: ["Check wall studs", "Consider cable management", "Avoid glare from windows"]
    };
  }
}
