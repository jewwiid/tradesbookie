import OpenAI from "openai";
import { db } from "./db";
import { faqAnswers } from "@shared/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FaqResponse {
  answer: string;
  cached: boolean;
}

// Generate a hash for the question to enable cache lookup
function generateQuestionHash(question: string): string {
  return createHash('md5').update(question.toLowerCase().trim()).digest('hex');
}

// Check if we have a cached answer for this question
async function getCachedAnswer(questionHash: string): Promise<string | null> {
  try {
    const cached = await db
      .select()
      .from(faqAnswers)
      .where(eq(faqAnswers.questionHash, questionHash))
      .limit(1);

    if (cached.length > 0 && cached[0].isActive) {
      // Increment use count
      await db
        .update(faqAnswers)
        .set({ 
          useCount: (cached[0].useCount || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(faqAnswers.id, cached[0].id));

      return cached[0].answer;
    }
    return null;
  } catch (error) {
    console.error('Error checking cached answer:', error);
    return null;
  }
}

// Save answer to cache
async function cacheAnswer(question: string, answer: string, questionHash: string): Promise<void> {
  try {
    await db.insert(faqAnswers).values({
      question,
      answer,
      questionHash,
      useCount: 1,
      isActive: true,
    });
  } catch (error) {
    console.error('Error caching answer:', error);
    // Don't throw - caching failure shouldn't break the service
  }
}

// Generate AI answer using OpenAI
async function generateAIAnswer(question: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful electronics sales assistant for tradesbook.ie, a TV installation service platform. Answer questions about:
          
          - TV installation services and mounting
          - Electronics like TVs, soundbars, speakers, and streaming devices
          - Technical troubleshooting for TVs and audio equipment
          - Irish TV services like RTÉ Player, Virgin Media, Sky, Now TV
          - Common TV setup issues and solutions
          - TV recommendation and compatibility
          
          Keep answers concise, friendly, and helpful. If you don't know something specific, suggest contacting customer support. Do not include any links or URLs in your response.`
        },
        {
          role: "user",
          content: question
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again or contact our support team.";
  } catch (error) {
    console.error('Error generating AI answer:', error);
    throw new Error('Unable to generate answer at this time. Please try again later.');
  }
}

// Main FAQ service function
export async function askQuestion(question: string): Promise<FaqResponse> {
  if (!question || question.trim().length === 0) {
    throw new Error('Question cannot be empty');
  }

  const cleanQuestion = question.trim();
  const questionHash = generateQuestionHash(cleanQuestion);

  // Check cache first
  const cachedAnswer = await getCachedAnswer(questionHash);
  if (cachedAnswer) {
    return {
      answer: cachedAnswer,
      cached: true
    };
  }

  // Generate new answer with AI
  const aiAnswer = await generateAIAnswer(cleanQuestion);
  
  // Cache the answer for future use
  await cacheAnswer(cleanQuestion, aiAnswer, questionHash);

  return {
    answer: aiAnswer,
    cached: false
  };
}

// Get popular FAQ questions for suggestions
export async function getPopularQuestions(limit: number = 5): Promise<Array<{ question: string; useCount: number }>> {
  try {
    const popular = await db
      .select({
        question: faqAnswers.question,
        useCount: faqAnswers.useCount
      })
      .from(faqAnswers)
      .where(eq(faqAnswers.isActive, true))
      .orderBy(faqAnswers.useCount)
      .limit(limit);

    return popular.map(item => ({
      question: item.question,
      useCount: item.useCount || 0
    }));
  } catch (error) {
    console.error('Error fetching popular questions:', error);
    return [];
  }
}

// Admin function to manage FAQ answers
export async function updateFaqAnswer(id: number, answer: string): Promise<void> {
  try {
    await db
      .update(faqAnswers)
      .set({ 
        answer,
        updatedAt: new Date()
      })
      .where(eq(faqAnswers.id, id));
  } catch (error) {
    console.error('Error updating FAQ answer:', error);
    throw new Error('Failed to update FAQ answer');
  }
}

// Admin function to deactivate FAQ answer
export async function deactivateFaqAnswer(id: number): Promise<void> {
  try {
    await db
      .update(faqAnswers)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(faqAnswers.id, id));
  } catch (error) {
    console.error('Error deactivating FAQ answer:', error);
    throw new Error('Failed to deactivate FAQ answer');
  }
}