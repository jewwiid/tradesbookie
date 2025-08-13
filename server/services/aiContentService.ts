import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface ContentGenerationResult {
  title: string;
  description: string;
  content: string;
  category: string;
  type: string;
}

export class AIContentService {
  
  /**
   * Scrapes content from a URL and generates resource description and content
   */
  static async generateContentFromUrl(url: string): Promise<ContentGenerationResult> {
    try {
      // First, fetch the webpage content
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Extract text content from HTML (basic extraction)
      const textContent = this.extractTextFromHtml(html);
      
      if (!textContent || textContent.length < 100) {
        throw new Error("Unable to extract sufficient content from the provided URL");
      }

      // Use GPT-4o to analyze and generate resource content
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert content curator for a TV installation and product support platform. Analyze the provided webpage content and create structured resource information.

Your task is to create:
1. A clear, engaging title (max 80 characters)
2. A concise description (max 200 characters) - brief summary for listings
3. Detailed content (300-1500 words) - comprehensive guide/information
4. Appropriate category from: setup-guides, troubleshooting, video-tutorials, faqs, maintenance
5. Resource type from: guide, faq, video, checklist, manual

Focus on practical, actionable information relevant to TV installation, product setup, or customer support. Make content accessible to non-technical users.

Respond in JSON format with these exact keys: title, description, content, category, type`
          },
          {
            role: "user",
            content: `Analyze this webpage content and generate resource information:\n\nURL: ${url}\n\nContent:\n${textContent.slice(0, 8000)}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.3
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Validate and sanitize the response
      return {
        title: result.title || "Generated Resource",
        description: result.description || "Auto-generated resource description",
        content: result.content || "Auto-generated content from provided URL",
        category: this.validateCategory(result.category),
        type: this.validateType(result.type)
      };

    } catch (error) {
      console.error('AI Content Generation Error:', error);
      throw new Error(`Failed to generate content from URL: ${error.message}`);
    }
  }

  /**
   * Basic HTML text extraction
   */
  private static extractTextFromHtml(html: string): string {
    // Remove script and style elements
    let text = html.replace(/<script[^>]*>.*?<\/script>/gis, '');
    text = text.replace(/<style[^>]*>.*?<\/style>/gis, '');
    
    // Remove HTML tags
    text = text.replace(/<[^>]*>/g, ' ');
    
    // Decode common HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  /**
   * Validate and ensure category is from allowed list
   */
  private static validateCategory(category: string): string {
    const validCategories = ['setup-guides', 'troubleshooting', 'video-tutorials', 'faqs', 'maintenance'];
    const normalizedCategory = category?.toLowerCase().replace(/[^a-z-]/g, '');
    
    if (validCategories.includes(normalizedCategory)) {
      return normalizedCategory;
    }
    
    // Default fallback based on common patterns
    if (category?.toLowerCase().includes('troubleshoot')) return 'troubleshooting';
    if (category?.toLowerCase().includes('video')) return 'video-tutorials';
    if (category?.toLowerCase().includes('faq')) return 'faqs';
    if (category?.toLowerCase().includes('maintenance')) return 'maintenance';
    
    return 'setup-guides'; // Default fallback
  }

  /**
   * Validate and ensure type is from allowed list
   */
  private static validateType(type: string): string {
    const validTypes = ['guide', 'faq', 'video', 'checklist', 'manual'];
    const normalizedType = type?.toLowerCase().replace(/[^a-z]/g, '');
    
    if (validTypes.includes(normalizedType)) {
      return normalizedType;
    }
    
    // Default fallback based on common patterns
    if (type?.toLowerCase().includes('video')) return 'video';
    if (type?.toLowerCase().includes('faq')) return 'faq';
    if (type?.toLowerCase().includes('checklist')) return 'checklist';
    if (type?.toLowerCase().includes('manual')) return 'manual';
    
    return 'guide'; // Default fallback
  }
}