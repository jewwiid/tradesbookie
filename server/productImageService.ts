import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ProductImageRequest {
  brand: string;
  model: string;
  tvType: string;
  size?: string;
}

export async function generateProductImage(productInfo: ProductImageRequest): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = `Professional product photography of a ${productInfo.brand} ${productInfo.model} ${productInfo.tvType} TV, front view, clean white background, high-resolution commercial product shot, professional lighting, modern flat screen TV, sleek design, realistic rendering`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural"
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error("No image URL received from OpenAI");
    }

    return imageUrl;
  } catch (error) {
    console.error('Product image generation error:', error);
    throw new Error(`Failed to generate product image: ${String(error)}`);
  }
}

export function getTVImagePlaceholder(brand: string, model: string, tvType: string): string {
  // Return a data URL for a simple SVG placeholder if image generation fails
  const svgPlaceholder = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" fill="#f3f4f6" stroke="#d1d5db" stroke-width="2" rx="8"/>
      <rect x="20" y="20" width="260" height="146" fill="#1f2937" rx="4"/>
      <text x="150" y="105" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="14">
        ${brand}
      </text>
      <text x="150" y="125" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="12">
        ${model}
      </text>
      <text x="150" y="140" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="10">
        ${tvType}
      </text>
      <circle cx="150" cy="180" r="8" fill="#374151"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svgPlaceholder).toString('base64')}`;
}

export async function getProductImageWithFallback(productInfo: ProductImageRequest): Promise<string> {
  try {
    return await generateProductImage(productInfo);
  } catch (error) {
    console.log(`Product image generation failed, using placeholder: ${String(error)}`);
    return getTVImagePlaceholder(productInfo.brand, productInfo.model, productInfo.tvType);
  }
}