"use server";

import { z } from "zod";
import { OpenAI } from "openai";

// Define the response type
export type CharacterGenerationResponse = {
  success: boolean;
  character?: {
    name: string;
    tagline: string;
    description: string;
    greeting: string;
  };
  error?: string;
};

/**
 * Server action to generate character details using OpenAI API compatible LLMs
 */
export async function generateCharacterDetails(
  prompt: string
): Promise<CharacterGenerationResponse> {
  console.log("[SERVER] generateCharacterDetails called with prompt:", prompt);
  
  try {
    // Validate the input
    if (!prompt.trim()) {
      console.log("[SERVER] Empty prompt received, returning error");
      return {
        success: false,
        error: "Prompt is required"
      };
    }

    // Get OpenAI API configuration from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1";
    const model = process.env.OPENAI_MODEL || "mistralai/mistral-nemo";
    
    console.log("[SERVER] Using OpenAI configuration:", { 
      baseUrl, 
      model,
      apiKeyConfigured: !!apiKey 
    });
    
    if (!apiKey) {
      console.error("[SERVER] OpenAI API key is not configured");
      return {
        success: false,
        error: "AI service is not properly configured"
      };
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey,
      baseURL: baseUrl,
    });
    console.log("[SERVER] OpenAI client initialized");

    // Create a structured prompt for the LLM
    const systemPrompt = `You are a creative character generator. 
Your task is to create a fictional character based on the user's prompt.
Generate a JSON response with the following fields:
- name: A suitable name for the character
- tagline: A short, catchy one-liner that describes the character (max 100 characters)
- description: A detailed description of the character (200-300 characters)
- greeting: A greeting message that the character would say when first meeting someone (100-150 characters)

Make sure the character's personality, tone, and style match the user's prompt.
The response should be in valid JSON format only, with no additional text.`;

    // Call the OpenAI API directly
    console.log("[SERVER] Sending request with model:", model);
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a character based on this prompt: "${prompt}"` }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });
    console.log("[SERVER] Received response from OpenAI API:", {
      status: "success",
      usage: response.usage,
      finishReason: response.choices[0]?.finish_reason
    });

    // Get the response content
    const content = response.choices[0]?.message.content;
    
    if (!content) {
      console.error("[SERVER] No content in OpenAI response");
      return {
        success: false,
        error: "Failed to generate character details"
      };
    }

    try {
      console.log("[SERVER] Parsing LLM response content:", content);
      const characterData = JSON.parse(content);
      console.log("[SERVER] Successfully parsed character data:", characterData);
      
      return {
        success: true,
        character: {
          name: characterData.name,
          tagline: characterData.tagline,
          description: characterData.description,
          greeting: characterData.greeting
        }
      };
    } catch (parseError) {
      console.error("[SERVER] Failed to parse LLM response:", parseError);
      console.error("[SERVER] Raw content that failed to parse:", content);
      return {
        success: false,
        error: "Failed to parse character data"
      };
    }
  } catch (error) {
    console.error("[SERVER] Character generation error:", error);
    if (error instanceof Error) {
      console.error("[SERVER] Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
} 