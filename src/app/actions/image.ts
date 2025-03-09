"use server";

import { z } from "zod";

// Define the schema for the image generation input
const imageGenerationSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  guidance: z.number().min(0).max(10).default(3.5),
  goFast: z.boolean().default(true),
  megapixels: z.string().default("1"),
  // Always generate exactly 1 image
  numOutputs: z.literal(1).default(1),
  aspectRatio: z.string().default("1:1"),
  outputFormat: z.string().default("webp"),
  outputQuality: z.number().min(0).max(100).default(80),
  promptStrength: z.number().min(0).max(1).default(0.8),
  numInferenceSteps: z.number().min(1).max(4).default(3),
  seed: z.number().optional(),
  disableSafetyChecker: z.boolean().default(false),
});

// Define the type based on the schema
export type ImageGenerationInput = z.infer<typeof imageGenerationSchema>;

// Define the response type
export type ImageGenerationResponse = {
  success: boolean;
  images: string[];
  error?: string;
};

// Define the expected Replicate API response structure
type ReplicateResponse = {
  id: string;
  version: string;
  urls: {
    get: string;
    cancel: string;
  };
  created_at: string;
  completed_at: string;
  status: string;
  input: Record<string, any>;
  output: string[] | null;
  error: string | null;
  logs: string | null;
  metrics: Record<string, any>;
};

/**
 * Server action to generate images using Replicate's API
 */
export async function generateImages(
  input: ImageGenerationInput
): Promise<ImageGenerationResponse> {
  console.log("[SERVER] generateImages called with input:", JSON.stringify(input, null, 2));
  
  try {
    // Validate the input
    console.log("[SERVER] Validating input...");
    const validatedInput = imageGenerationSchema.parse(input);
    console.log("[SERVER] Input validation successful");

    // Check if the API token is available
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      console.error("[SERVER] REPLICATE_API_TOKEN is not set");
      throw new Error("REPLICATE_API_TOKEN is not set");
    }
    console.log("[SERVER] API token is available");

    // Prepare the request payload
    const payload = {
      input: {
        prompt: validatedInput.prompt,
        guidance: validatedInput.guidance,
        go_fast: validatedInput.goFast,
        megapixels: validatedInput.megapixels,
        num_outputs: 1,
        aspect_ratio: validatedInput.aspectRatio,
        output_format: validatedInput.outputFormat,
        output_quality: validatedInput.outputQuality,
        prompt_strength: validatedInput.promptStrength,
        num_inference_steps: validatedInput.numInferenceSteps,
        ...(validatedInput.seed !== undefined && { seed: validatedInput.seed }),
        disable_safety_checker: true,
      },
    };
    console.log("[SERVER] Request payload prepared:", JSON.stringify(payload, null, 2));

    // Make the API request
    console.log("[SERVER] Making API request to Replicate...");
    const response = await fetch(
      "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify(payload),
      }
    );
    console.log("[SERVER] API response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json() as { detail?: string };
      console.error("[SERVER] API error response:", errorData);
      throw new Error(
        `Replicate API error: ${errorData.detail || response.statusText}`
      );
    }

    // Parse the response
    console.log("[SERVER] Parsing API response...");
    const responseText = await response.text();
    console.log("[SERVER] Raw API response:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText) as ReplicateResponse;
      console.log("[SERVER] Parsed API response:", JSON.stringify(data, null, 2));
      
      // Log the structure of the response for debugging
      console.log("[SERVER] Response structure:", {
        id: typeof data.id,
        version: typeof data.version,
        status: data.status,
        outputType: data.output ? (Array.isArray(data.output) ? 'array' : typeof data.output) : 'null',
        outputLength: data.output && Array.isArray(data.output) ? data.output.length : 0,
        error: data.error,
      });
    } catch (parseError) {
      console.error("[SERVER] Error parsing API response:", parseError);
      throw new Error("Failed to parse API response");
    }
    
    // Check if there's an error in the response
    if (data.error) {
      console.error("[SERVER] Error in API response:", data.error);
      throw new Error(`Replicate API error: ${data.error}`);
    }
    
    // Check if the output is available
    if (!data.output) {
      console.error("[SERVER] No output in API response");
      throw new Error("No images were generated");
    }
    
    // The output should be an array of image URLs
    if (!Array.isArray(data.output)) {
      console.log("[SERVER] Output is not an array, converting to array with single item");
      return {
        success: true,
        images: [data.output as unknown as string],
      };
    }

    console.log("[SERVER] Returning successful response with images:", data.output);

    return {
      success: true,
      images: data.output,
    };
  } catch (error) {
    console.error("[SERVER] Image generation error:", error);
    return {
      success: false,
      images: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
