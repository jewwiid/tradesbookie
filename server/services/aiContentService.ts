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
      // Fetch the webpage content with better headers
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Enhanced content extraction with multiple strategies
      const extractedData = this.extractEnhancedContent(html);
      
      // Check if we have sufficient content
      if (!extractedData.textContent || extractedData.textContent.length < 50) {
        // Try a fallback approach - generate content based on just URL and basic info
        console.log(`Limited content extracted (${extractedData.textContent?.length || 0} chars), attempting AI-based generation from URL`);
        return this.generateContentFromUrlOnly(url, extractedData.title, extractedData.description);
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
            content: `Analyze this webpage content and generate resource information:\n\nURL: ${url}\n\nTitle: ${extractedData.title}\n\nMeta Description: ${extractedData.description}\n\nContent:\n${extractedData.textContent.slice(0, 8000)}`
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
      throw new Error(`Failed to generate content from URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Enhanced HTML content extraction with multiple strategies
   */
  private static extractEnhancedContent(html: string): {
    title: string;
    description: string;
    textContent: string;
  } {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=['"]description['"][^>]*content=['"]([^'"]*)['"]/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // Extract main content areas with priority
    let textContent = '';
    
    // Try structured content first
    const contentSelectors = [
      /<main[^>]*>([\s\S]*?)<\/main>/gi,
      /<article[^>]*>([\s\S]*?)<\/article>/gi,
      /<div[^>]*class=['"][^'"]*content[^'"]*['"][^>]*>([\s\S]*?)<\/div>/gi,
      /<section[^>]*>([\s\S]*?)<\/section>/gi
    ];

    for (const selector of contentSelectors) {
      const regex = new RegExp(selector.source, selector.flags);
      const matches: string[] = [];
      let match;
      while ((match = regex.exec(html)) !== null) {
        matches.push(match[1]);
        if (!regex.global) break;
      }
      if (matches.length > 0) {
        textContent = matches.join(' ');
        break;
      }
    }

    // Fallback to body content
    if (!textContent) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      textContent = bodyMatch ? bodyMatch[1] : html;
    }

    // Clean the content
    textContent = this.cleanHtmlContent(textContent);

    return { title, description, textContent };
  }

  /**
   * Clean HTML content
   */
  private static cleanHtmlContent(html: string): string {
    // Remove unwanted elements
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
    
    // Remove HTML tags
    text = text.replace(/<[^>]*>/g, ' ');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  /**
   * Fallback method for URLs with limited extractable content
   */
  private static async generateContentFromUrlOnly(url: string, title?: string, description?: string): Promise<ContentGenerationResult> {
    console.log('Using URL-only generation fallback');
    
    // Parse URL for context clues
    const urlParts = new URL(url);
    const domain = urlParts.hostname;
    const path = urlParts.pathname;
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert content curator for a TV installation and product support platform. Based on the URL and any available metadata, create helpful resource information.

Your task is to create:
1. A clear, engaging title (max 80 characters)
2. A concise description (max 200 characters) - brief summary
3. Helpful content (300-800 words) - practical guide/information based on URL context
4. Appropriate category from: setup-guides, troubleshooting, video-tutorials, faqs, maintenance
5. Resource type from: guide, faq, video, checklist, manual

Focus on practical, actionable information relevant to TV installation, product setup, or customer support. Make content accessible to non-technical users.

If the URL suggests a specific product or service, create content around that topic. Be helpful and informative.

Respond in JSON format with these exact keys: title, description, content, category, type`
        },
        {
          role: "user",
          content: `Generate resource information based on this URL and metadata:

URL: ${url}
Domain: ${domain}
Path: ${path}
${title ? `Page Title: ${title}` : ''}
${description ? `Meta Description: ${description}` : ''}

Create helpful content related to this URL that would be valuable for customers needing TV installation or product support assistance.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0.4
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      title: result.title || `${domain} Resource`,
      description: result.description || `Helpful resource from ${domain}`,
      content: result.content || `This resource from ${url} provides helpful information for product setup and support.`,
      category: this.validateCategory(result.category),
      type: this.validateType(result.type)
    };
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