"use client";

import { useState, useTransition, useRef } from "react";
import { generateImages, type ImageGenerationInput } from "@/app/actions/image";
import { createCharacter } from "@/app/actions/character";
import { generateCharacterDetails } from "@/app/actions/character-generator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Wand2, RefreshCw, AlertTriangle, LogIn, Sparkles } from "lucide-react";
import { type CharacterTag, NSFWCharacterTags } from "@/types/character-tags";
import { Switch } from "@/components/ui/switch";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type GeneratedCharacter = {
  name: string;
  tagline: string;
  description: string;
  greeting: string;
  tags: CharacterTag[];
  imageUrl: string | null;
};

export default function AutoCharacterGenerator() {
  const { data: session, status } = useSession();
  const [prompt, setPrompt] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [isNsfw, setIsNsfw] = useState(false);
  const [isGenerating, startGenerating] = useTransition();
  const [isRegeneratingImage, startRegeneratingImage] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [generatedCharacter, setGeneratedCharacter] = useState<GeneratedCharacter | null>(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  
  // Refs for editable fields
  const nameRef = useRef<HTMLInputElement>(null);
  const taglineRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const greetingRef = useRef<HTMLTextAreaElement>(null);

  const router = useRouter();

  // Handle prompt input change
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Check authentication on first keystroke
    if (newValue.length === 1 && !prompt.length && status !== "authenticated") {
      console.log("[CLIENT] User started typing but is not authenticated, showing auth dialog");
      setShowAuthDialog(true);
      // Still set the prompt value so it's preserved if they authenticate
      setPrompt(newValue);
      return;
    }
    
    setPrompt(newValue);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[CLIENT] Generate character initiated with prompt:", prompt);
    
    // Check if user is authenticated
    if (status !== "authenticated") {
      console.log("[CLIENT] User not authenticated, showing auth dialog");
      setShowAuthDialog(true);
      return;
    }
    
    if (!prompt.trim()) {
      console.log("[CLIENT] Empty prompt, showing error");
      setError("Please enter a prompt");
      return;
    }
    
    setError(null);
    
    startGenerating(async () => {
      try {
        console.log("[CLIENT] Starting character generation process");
        // Step 1: Generate character details using the server action
        console.log("[CLIENT] Calling generateCharacterDetails with prompt:", prompt.trim());
        const characterResult = await generateCharacterDetails(prompt.trim());
        console.log("[CLIENT] Character generation result:", characterResult);
        
        if (!characterResult.success || !characterResult.character) {
          console.error("[CLIENT] Character generation failed:", characterResult.error);
          
          // Check if the error is related to authentication
          if (characterResult.error?.includes("logged in") || characterResult.error?.includes("authentication")) {
            setShowAuthDialog(true);
          } else {
            setError(characterResult.error || "Failed to generate character details");
          }
          return;
        }
        
        // Step 2: Generate an image
        console.log("[CLIENT] Character generated successfully, now generating image");
        const defaultImagePrompt = `${prompt}, character portrait, high quality, detailed`;
        setImagePrompt(defaultImagePrompt);
        
        const imageInput: ImageGenerationInput = {
          prompt: defaultImagePrompt,
          guidance: 3.5,
          goFast: true,
          megapixels: "1",
          numOutputs: 1,
          aspectRatio: "1:1",
          outputFormat: "webp",
          outputQuality: 80,
          promptStrength: 0.8,
          numInferenceSteps: 4,
          disableSafetyChecker: false,
        };
        
        console.log("[CLIENT] Calling generateImages with input:", imageInput);
        const imageResult = await generateImages(imageInput);
        console.log("[CLIENT] Image generation result:", imageResult);
        
        if (imageResult.success) {
          console.log("[CLIENT] Image generated successfully");
          // Default to empty array for tags if not provided
          const defaultTags: CharacterTag[] = [];
          
          setGeneratedCharacter({
            ...characterResult.character,
            imageUrl: imageResult.images[0],
            tags: defaultTags
          });
        } else {
          console.warn("[CLIENT] Image generation failed, proceeding with character only");
          // Default to empty array for tags if not provided
          const defaultTags: CharacterTag[] = [];
          
          setGeneratedCharacter({
            ...characterResult.character,
            imageUrl: null,
            tags: defaultTags
          });
          setError("Image generation failed, but character details were created");
        }
      } catch (err) {
        console.error("[CLIENT] Error during character generation:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    });
  };

  const handleRegenerateImage = () => {
    if (!generatedCharacter) {
      console.warn("[CLIENT] Attempted to regenerate image without a character");
      return;
    }
    
    console.log("[CLIENT] Regenerating image for character:", generatedCharacter.name);
    
    startRegeneratingImage(async () => {
      try {
        const imageInput: ImageGenerationInput = {
          prompt: imagePrompt || `${prompt}, character portrait, high quality, detailed`,
          guidance: 3.5,
          goFast: true,
          megapixels: "1",
          numOutputs: 1,
          aspectRatio: "1:1",
          outputFormat: "webp",
          outputQuality: 65,
          promptStrength: 0.8,
          numInferenceSteps: 3,
          disableSafetyChecker: false,
        };
        
        console.log("[CLIENT] Calling generateImages for regeneration with input:", imageInput);
        const imageResult = await generateImages(imageInput);
        console.log("[CLIENT] Image regeneration result:", imageResult);
        
        if (imageResult.success) {
          console.log("[CLIENT] Image regenerated successfully");
          setGeneratedCharacter({
            ...generatedCharacter,
            imageUrl: imageResult.images[0]
          });
        } else {
          console.error("[CLIENT] Failed to regenerate image:", imageResult);
          setError("Failed to regenerate image");
        }
      } catch (err) {
        console.error("[CLIENT] Error during image regeneration:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    });
  };

  const handleSaveRequest = () => {
    if (!generatedCharacter) {
      console.warn("[CLIENT] Attempted to save without a character");
      return;
    }
    
    // Update the character tags based on the NSFW toggle
    const updatedTags = [...generatedCharacter.tags];
    
    // Add or remove NSFW tag based on toggle
    if (isNsfw && !updatedTags.includes('nsfw' as CharacterTag)) {
      updatedTags.push('nsfw' as CharacterTag);
    } else if (!isNsfw) {
      // Remove any NSFW tags if toggle is off
      const filteredTags = updatedTags.filter(tag => 
        !NSFWCharacterTags.includes(tag as any)
      );
      setGeneratedCharacter({
        ...generatedCharacter,
        tags: filteredTags
      });
    }
    
    // Check if the character has any NSFW tags
    const hasNsfwTags = isNsfw || updatedTags.some(tag => 
      NSFWCharacterTags.includes(tag as any)
    );
    
    // If character has NSFW tags but the toggle is off, turn it on
    if (hasNsfwTags && !isNsfw) {
      setIsNsfw(true);
    }
    
    // Update character tags before showing dialog
    if (isNsfw) {
      setGeneratedCharacter({
        ...generatedCharacter,
        tags: updatedTags
      });
    }
    
    // Always show confirmation dialog
    setShowConfirmationDialog(true);
  };

  const handleSaveCharacter = () => {
    if (!generatedCharacter) return;
    
    console.log("[CLIENT] Saving character:", generatedCharacter.name);
    
    startSaving(async () => {
      try {
        // Create a FormData object to submit
        const formData = new FormData();
        
        // Get the current values from refs
        const currentName = nameRef.current?.value || generatedCharacter.name;
        const currentTagline = taglineRef.current?.value || generatedCharacter.tagline;
        const currentDescription = descriptionRef.current?.value || generatedCharacter.description;
        const currentGreeting = greetingRef.current?.value || generatedCharacter.greeting;
        
        console.log("[CLIENT] Saving character with updated values:", {
          name: currentName,
          tagline: currentTagline,
          description: currentDescription.substring(0, 20) + "...",
          greeting: currentGreeting.substring(0, 20) + "...",
          tags: generatedCharacter.tags,
          hasImage: !!generatedCharacter.imageUrl
        });
        
        // Add the character details from the refs (to get any edits)
        formData.append("name", currentName);
        formData.append("tagline", currentTagline);
        formData.append("description", currentDescription);
        formData.append("greeting", currentGreeting);
        formData.append("visibility", "public");
        formData.append("tags", JSON.stringify(generatedCharacter.tags));
        
        // Handle the image
        if (generatedCharacter.imageUrl) {
          console.log("[CLIENT] Fetching and attaching image from URL");
          // Fetch the image and convert it to a File object
          const response = await fetch(generatedCharacter.imageUrl);
          const blob = await response.blob();
          const file = new File([blob], "avatar.webp", { type: "image/webp" });
          formData.append("avatar", file);
        }
        
        // Call the createCharacter action
        console.log("[CLIENT] Calling createCharacter action");
        const result = await createCharacter(formData);
        console.log("[CLIENT] Character creation result:", result);
        
        if (result.success) {
          console.log("[CLIENT] Character created successfully");
          // Reset the form and show success message
          setPrompt("");
          setGeneratedCharacter(null);
          setIsNsfw(false);
          
          // Redirect to the chat page with the new character
          if (result.character && result.character.id) {
            router.push(`/chat/${result.character.id}`);
          } else {
            alert("Character created successfully!");
          }
        } else {
          console.error("[CLIENT] Failed to create character:", result.error);
          setError(result.error || "Failed to create character");
        }
      } catch (err) {
        console.error("[CLIENT] Error in character creation:", err);
        setError("An unexpected error occurred");
      }
    });
  };

  return (
    <>
      {/* Authentication Dialog */}
      <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Authentication Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be signed in to generate characters. Your prompt will be preserved after signing in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => signIn('google', { callbackUrl: window.location.href })}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in with Google
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-full max-w-4xl mx-auto p-4 space-y-6">      
        {!generatedCharacter ? (
          <form onSubmit={handleGenerate} className="space-y-4 max-w-2xl mx-auto mt-12">
            <div className="space-y-2">
              <div className="text-xl font-medium text-center">
                Describe your character
              </div>
              <Textarea
                id="prompt"
                placeholder="e.g., anime character, fantasy wizard, sci-fi robot, historical figure..."
                value={prompt}
                onChange={handlePromptChange}
                className="min-h-[120px] rounded-xl border-2 focus:border-blue-400 focus:ring-blue-400"
                disabled={isGenerating}
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isGenerating} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Character...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Character
                </>
              )}
            </Button>
            
            {/* Hero section explaining the functionality */}
            <div className="mt-12 p-6 rounded-2xl shadow-sm">
              <h2 className="text-2xl font-bold text-center text-blue-800 mb-4">AI Character Creator</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded-full w-12 h-12 mx-auto flex items-center justify-center shadow-sm">
                    <Sparkles className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-blue-700">Describe</h3>
                  <p className="text-sm text-gray-600">Simply describe your character idea in a few sentences</p>
                </div>
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded-full w-12 h-12 mx-auto flex items-center justify-center shadow-sm">
                    <Wand2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-blue-700">Generate</h3>
                  <p className="text-sm text-gray-600">Our AI creates a complete character profile with personality</p>
                </div>
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded-full w-12 h-12 mx-auto flex items-center justify-center shadow-sm">
                    <Save className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-blue-700">Save</h3>
                  <p className="text-sm text-gray-600">Edit and save your character to use in conversations</p>
                </div>
              </div>
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>Create unique AI characters with distinct personalities, backstories, and visual styles.</p>
                <p className="mt-1">Perfect for roleplay, storytelling, or creating virtual companions.</p>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-6 p-6 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-medium">Name</Label>
                  <Input 
                    id="name" 
                    ref={nameRef}
                    defaultValue={generatedCharacter.name} 
                    className="rounded-xl border-2 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tagline" className="font-medium">Tagline</Label>
                  <Input 
                    id="tagline" 
                    ref={taglineRef}
                    defaultValue={generatedCharacter.tagline} 
                    className="rounded-xl border-2 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-medium">Description</Label>
                  <Textarea 
                    id="description" 
                    ref={descriptionRef}
                    defaultValue={generatedCharacter.description} 
                    className="min-h-[120px] rounded-xl border-2 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="greeting" className="font-medium">Greeting</Label>
                  <Textarea 
                    id="greeting" 
                    ref={greetingRef}
                    defaultValue={generatedCharacter.greeting} 
                    className="min-h-[80px] rounded-xl border-2 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {generatedCharacter.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          NSFWCharacterTags.includes(tag as any)
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* NSFW Toggle - Moved here from the initial form */}
                <div className="flex items-center space-x-2 pt-2 border-t">
                  <Switch
                    id="nsfw-toggle"
                    checked={isNsfw}
                    onCheckedChange={setIsNsfw}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label htmlFor="nsfw-toggle" className="flex items-center cursor-pointer">
                    <span className="mr-2">Mark as NSFW Content</span>
                    {isNsfw && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        18+
                      </span>
                    )}
                  </Label>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="font-medium">Character Avatar</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRegenerateImage}
                    disabled={isRegeneratingImage}
                    className="border-blue-300 hover:bg-blue-50 hover:text-blue-700 rounded-xl"
                  >
                    {isRegeneratingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="imagePrompt" className="font-medium">Image Prompt</Label>
                  <Textarea
                    id="imagePrompt"
                    placeholder="Customize the image prompt and regenerate..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="min-h-[80px] rounded-xl border-2 focus:border-blue-400 focus:ring-blue-400 text-sm"
                    disabled={isRegeneratingImage}
                  />
                </div>
                
                {generatedCharacter.imageUrl ? (
                  <Card className="overflow-hidden rounded-2xl border-2 border-blue-100 shadow-md">
                    <CardContent className="p-0">
                      <img
                        src={generatedCharacter.imageUrl}
                        alt="Generated character avatar"
                        className="w-full h-auto object-cover rounded-xl"
                        loading="lazy"
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-blue-50 rounded-2xl border-2 border-blue-100">
                    <p className="text-blue-500">No image generated</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log("[CLIENT] User clicked 'Start Over'");
                  setGeneratedCharacter(null);
                  setIsNsfw(false);
                }}
                disabled={isSaving}
                className="border-blue-300 hover:bg-blue-50 hover:text-blue-700 rounded-xl"
              >
                Start Over
              </Button>
              
              <Button 
                onClick={handleSaveRequest}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Character...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Character
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 shadow-sm max-w-2xl mx-auto">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Character Creation Confirmation Dialog */}
        <AlertDialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Character Creation Confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                Please review your character before creating:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Ensure all information is accurate</li>
                  <li>Verify that the content complies with our community guidelines</li>
                  {isNsfw && (
                    <>
                      <li className="text-red-600 font-semibold">This character contains NSFW content</li>
                      <li className="text-red-600">You must be 18 years or older to create NSFW content</li>
                      <li className="text-red-600">This character will be marked as NSFW</li>
                    </>
                  )}
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  setShowConfirmationDialog(false);
                  handleSaveCharacter();
                }}
                className={isNsfw ? "bg-red-600 hover:bg-red-700 rounded-xl" : "bg-blue-600 hover:bg-blue-700 rounded-xl"}
              >
                {isNsfw ? "I Confirm (NSFW)" : "Create Character"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
} 