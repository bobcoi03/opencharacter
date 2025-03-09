"use client";

import { useState, useTransition, useEffect } from "react";
import { generateImages, type ImageGenerationInput } from "@/app/actions/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  
  // Log component mount and state changes
  useEffect(() => {
    console.log("[CLIENT] ImageGenerator component mounted");
    
    return () => {
      console.log("[CLIENT] ImageGenerator component unmounted");
    };
  }, []);
  
  useEffect(() => {
    if (images.length > 0) {
      console.log("[CLIENT] Images state updated:", images);
    }
  }, [images]);
  
  useEffect(() => {
    if (error) {
      console.log("[CLIENT] Error state updated:", error);
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[CLIENT] Form submitted with prompt:", prompt);
    
    if (!prompt.trim()) {
      console.log("[CLIENT] Empty prompt, showing error");
      setError("Please enter a prompt");
      return;
    }

    console.log("[CLIENT] Clearing previous error");
    setError(null);
    
    console.log("[CLIENT] Starting image generation transition");
    startTransition(async () => {
      try {
        console.log("[CLIENT] Preparing input for server action");
        const input: ImageGenerationInput = {
          prompt: prompt.trim(),
          // Using default values for other parameters
          guidance: 3.5,
          goFast: true,
          megapixels: "1",
          numOutputs: 1,
          aspectRatio: "1:1",
          outputFormat: "webp",
          outputQuality: 80,
          promptStrength: 0.8,
          numInferenceSteps: 3,
          disableSafetyChecker: true,
        };
        console.log("[CLIENT] Input prepared:", input);

        console.log("[CLIENT] Calling generateImages server action");
        const result = await generateImages(input);
        console.log("[CLIENT] Server action response:", result);
        
        if (result.success) {
          console.log("[CLIENT] Image generation successful, updating images state");
          setImages(result.images);
        } else {
          console.error("[CLIENT] Image generation failed:", result.error);
          setError(result.error || "Failed to generate images");
        }
      } catch (err) {
        console.error("[CLIENT] Unexpected error during image generation:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">AI Image Generator</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="prompt" className="text-sm font-medium">
            Enter your prompt
          </label>
          <Textarea
            id="prompt"
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => {
              console.log("[CLIENT] Prompt input changed:", e.target.value);
              setPrompt(e.target.value);
            }}
            className="min-h-[120px]"
            disabled={isPending}
          />
        </div>
        
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Image...
            </>
          ) : (
            "Generate Image"
          )}
        </Button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Generated Image</h2>
          <div className="max-w-2xl mx-auto">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <img
                  src={images[0]}
                  alt="Generated image"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                  onLoad={() => console.log(`[CLIENT] Image loaded:`, images[0])}
                  onError={(e) => console.error(`[CLIENT] Error loading image:`, e)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 