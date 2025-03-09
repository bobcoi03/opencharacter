"use server";

import { z } from "zod";
import { OpenAI } from "openai";
import { auth } from "@/server/auth";

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
    // Check if user is authenticated
    const session = await auth();
    if (!session || !session.user) {
      console.error("[SERVER] Authentication required for character generation");
      return {
        success: false,
        error: "You must be logged in to generate characters"
      };
    }

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
- description: An extremely detailed description of the character (500-1000 words). This description should include:
  * Physical appearance and distinctive features
  * Personality traits, quirks, and mannerisms
  * Background story and formative experiences
  * Motivations, goals, and aspirations
  * Fears, weaknesses, and internal conflicts
  * Special abilities or skills
  * Speech patterns and vocabulary preferences
  * Relationships and how they interact with others
  * Worldview and philosophical outlook
  * Emotional tendencies and how they process feelings
  * Example dialog snippets using {{user}} and {{char}} placeholders to show how the character speaks and responds
    For example: 
    {{user}}: Who are you?
    {{char}}: I am Iron Man. Billionaire, playboy, philanthropist.
    {{user}}: What do you want?
    {{char}}: I want to ensure the safety of the world with my technology.
  
  This description will be used as a system prompt for an LLM to accurately roleplay as this character, so include any details that would help the AI embody this character convincingly.

- greeting: A greeting message that the character would say when first meeting someone (100-150 characters)

Make sure the character's personality, tone, and style match the user's prompt.

IMPORTANT: The response must be in valid JSON format only, with no additional text.
- The JSON structure must be exactly: {"name": "...", "tagline": "...", "description": "...", "greeting": "..."}
- Do not add any extra fields to the JSON
- Ensure all JSON property names are in double quotes
- Ensure all JSON property values are in double quotes
- Escape all quotes within strings using backslash: \\"
- Escape all newlines as \\n
- Escape all backslashes as \\\\
- Avoid using control characters in the JSON
- Make sure all dialog examples are properly escaped
- Do not use markdown formatting in the JSON content
- Ensure the JSON is properly closed with all matching braces`;

    // Call the OpenAI API directly
    console.log("[SERVER] Sending request with model:", model);
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a character based on this prompt: "${prompt}"` }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });
    console.log("[SERVER] Received response from OpenAI API:", {
      status: "success",
      usage: response.usage,
      finishReason: response.choices[0]?.finish_reason
    });

    // Get the response content
    const content = response.choices[0]?.message.content;
    
    // Parse the JSON response with better error handling
    try {
      if (!content) {
        console.error("[SERVER] No content in response");
        return {
          success: false,
          error: "No content in response from AI service"
        };
      }
      
      // Try to clean the content before parsing
      const cleanedContent = content
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
        .replace(/\\(?!["\\/bfnrt])/g, "\\\\") // Escape backslashes that aren't already part of escape sequences
        .replace(/([^\\])"/g, '$1\\"') // Escape unescaped quotes
        .replace(/([^\\])\\([^"\\/bfnrt])/g, '$1\\\\$2'); // Fix improperly escaped characters
      
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.log("[SERVER] First cleaning attempt failed, trying more aggressive cleaning");
        
        // More aggressive JSON repair attempt
        const fixedContent = cleanedContent
          // Fix common JSON structure issues
          .replace(/,\s*}/g, '}') // Remove trailing commas
          .replace(/}\s*{/g, '},{') // Fix missing commas between objects
          .replace(/"\s*}/g, '"}') // Fix missing quotes at end of properties
          .replace(/"\s*:/g, '":') // Fix spacing in property names
          .replace(/:\s*"/g, ':"') // Fix spacing in property values
          .replace(/([^\\])"([^:]*)"/g, '$1\\"$2\\"'); // Escape quotes in values
          
        try {
          // Try to extract just the main JSON object if there's extra text
          const jsonMatch = fixedContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResponse = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("Could not extract JSON object");
          }
        } catch (secondParseError) {
          console.error("[SERVER] Second parsing attempt failed:", secondParseError);
          throw parseError; // Re-throw the original error
        }
      }
      
      // Validate the response structure
      if (!parsedResponse.name || !parsedResponse.tagline || 
          !parsedResponse.description || !parsedResponse.greeting) {
        console.error("[SERVER] Invalid response structure:", parsedResponse);
        return {
          success: false,
          error: "Invalid response structure from AI service"
        };
      }
      
      return {
        success: true,
        character: {
          name: parsedResponse.name,
          tagline: parsedResponse.tagline,
          description: parsedResponse.description,
          greeting: parsedResponse.greeting
        }
      };
    } catch (error: unknown) {
      console.error("[SERVER] Failed to parse LLM response:", error);
      console.error("[SERVER] Raw content that failed to parse:", content || "No content");
      
      // Attempt a more lenient parsing approach if standard parsing fails
      try {
        // Try to extract JSON using regex if the content might have extra text
        if (content) {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extractedJson = jsonMatch[0];
            const parsedResponse = JSON.parse(extractedJson);
            
            if (parsedResponse.name && parsedResponse.tagline && 
                parsedResponse.description && parsedResponse.greeting) {
              console.log("[SERVER] Successfully parsed JSON after extraction");
              return {
                success: true,
                character: {
                  name: parsedResponse.name,
                  tagline: parsedResponse.tagline,
                  description: parsedResponse.description,
                  greeting: parsedResponse.greeting
                }
              };
            }
          }
        }
      } catch (secondError) {
        console.error("[SERVER] Failed second parsing attempt:", secondError);
      }
      
      return {
        success: false,
        error: `Failed to parse response from AI service: ${error instanceof Error ? error.message : String(error)}`
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