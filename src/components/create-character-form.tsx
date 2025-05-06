"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Upload, Globe, Lock, AlertTriangle, Tag, ChevronUp, ChevronDown  } from "lucide-react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { characters } from "@/server/db/schema";
import { CharacterTags, AllCharacterTags, SFWCharacterTags, CharacterTag } from "@/types/character-tags";
import ButtonDialogs from "./prompt-suggestions";

type CharacterVisibility = "public" | "private";

export function CreateCharacterForm({
  action,
  character,
  editMode = false,
}: {
  action: (formData: FormData) => void;
  character?: typeof characters.$inferSelect;
  editMode?: boolean;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [descriptionCharCount, setDescriptionCharCount] = useState<number>(
    character?.description.length ?? 0,
  );
  const [visibility, setVisibility] = useState<CharacterVisibility>(
    (character?.visibility as CharacterVisibility) ?? "public",
  );
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [selectedTags, setSelectedTags] = useState<CharacterTag[]>(() => {
    if (character?.tags) {
      try {
        const parsedTags = JSON.parse(character.tags);
        return Array.isArray(parsedTags) ? parsedTags.filter((tag): tag is CharacterTag => AllCharacterTags.includes(tag as CharacterTag)) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(character?.banner_image_url ?? null);
  const [bannerFileError, setBannerFileError] = useState<string | null>(null);

  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setBannerFileError("File size exceeds 5MB limit");
        setBannerPreviewUrl(null);
        event.target.value = "";
      } else {
        setBannerFileError(null);
        const reader = new FileReader();
        reader.onloadend = () => {
          setBannerPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleTagToggle = (tag: CharacterTag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  useEffect(() => {
    if (character) {
      setDescriptionCharCount(character.description.length);
      setVisibility((character.visibility as CharacterVisibility) ?? "public");
    }
  }, [character]);

  useEffect(() => {
    if (character) {
      setPreviewUrl(character.avatar_image_url ?? "/default-avatar.jpg");
      setVisibility(character.visibility as "public" | "private");
    }
  }, [character]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError("File size exceeds 5MB limit");
        setPreviewUrl(null);
        event.target.value = ""; // Reset the input
      } else {
        setFileError(null);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    formData.set('tags', JSON.stringify(selectedTags));
    try {
      await action(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };  

  return (
    <div className="w-full bg-white dark:bg-neutral-900 min-h-screen p-6 overflow-y-auto mb-12 md:px-16 mx-auto">
      <header>
        <Link
          href="/"
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 inline-block"
        >
          <ArrowLeft size={16} />
        </Link>
      </header>

      <div className="max-w-3xl mx-auto overflow-x-hidden">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 mb-6 overflow-hidden">
            {bannerPreviewUrl ? (
              <img
                src={bannerPreviewUrl}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Upload size={32} className="text-gray-400 dark:text-gray-500" />
              </div>
            )}
            <input
              type="file"
              name="banner"
              accept="image/*"
              onChange={handleBannerChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {bannerFileError && (
              <p className="absolute bottom-2 left-2 text-red-500 text-sm bg-white/80 px-2 py-1 rounded">
                {bannerFileError}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center mb-6">
            <div className="w-36 h-36 bg-gray-200 dark:bg-gray-700 rounded-full mb-2 flex items-center justify-center overflow-hidden relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Upload
                  size={32}
                  className="text-gray-400 dark:text-gray-500"
                />
              )}
              <input
                type="file"
                name="avatar"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required={!editMode}
              />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Character Avatar
            </h2>
            {fileError && (
              <p className="text-red-500 text-sm mt-1">{fileError}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Max file size: 5MB
            </p>
          </div>

          <div className="space-y-3">
            <label className="block mb-1 text-sm font-medium">
              Character Name
            </label>
            <div>
              <input
                type="text"
                name="name"
                placeholder="Character name e.g. Albert Einstein"
                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900"
                required
                defaultValue={character ? character.name : ""}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Tagline</label>
              <input
                type="text"
                name="tagline"
                placeholder="Add a short tagline of your Character"
                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900"
                required
                defaultValue={character ? character.tagline : ""}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">
                System Prompt
              </label>
              <textarea
                name="description"
                placeholder="Describe your character to the language model, how it should act, reply, etc..."
                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md h-24 bg-white dark:bg-neutral-900"
                required
                defaultValue={character ? character.description : ""}
                onKeyUp={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  setDescriptionCharCount(target.value.length);
                }}
              />
              <p className="text-xs font-light text-gray-500">
                character length: {descriptionCharCount}
              </p>

            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Greeting</label>
              <textarea
                rows={4}
                name="greeting"
                placeholder="e.g. Hello, I am Albert. Ask me anything about my scientific contributions."
                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900 max-h-96"
                required
                defaultValue={character ? character.greeting : ""}
              />
            </div>

            <ButtonDialogs />

            <div>
              <label className="block mb-1 text-sm font-medium">
                Visibility
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setVisibility("public")}
                  className={`px-3 py-1 text-sm border rounded-full flex items-center space-x-2 ${
                    visibility === "public"
                      ? "border-blue-500 text-blue-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <Globe size={14} />
                  <span>Public</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility("private")}
                  className={`px-3 py-1 text-sm border rounded-full flex items-center space-x-2 ${
                    visibility === "private"
                      ? "border-blue-500 text-blue-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <Lock size={14} />
                  <span>Private</span>
                </button>
              </div>
              <input type="hidden" name="visibility" value={visibility} />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              Character Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {AllCharacterTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 text-sm border rounded-full flex items-center space-x-2 ${
                    selectedTags.includes(tag)
                      ? "border-blue-500 text-blue-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <span>{tag}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center text-amber-500 text-sm">
              <AlertTriangle size={14} className="mr-1" />
              <span>If your character contains nudity, sexually explicit content, or other NSFW elements, please make sure to tag it as NSFW.</span>
            </div>
          </div>

          <div>
              <label className="block mb-1 text-sm font-medium">
                Max Tokens
              </label>
              <input
                type="number"
                name="max_tokens"
                min="1"
                step="1"
                defaultValue={character?.max_tokens ?? 600}
                max={9999}
                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum number of tokens in the response. 1 or above. Limits the
                length of the generated text.
              </p>
            </div>

          <div className="space-y-3">
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="flex items-center text-sm"
              >
                {showAdvancedSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span className="text-sm font-medium text-white ">Advanced AI Behavior Configuration</span>
              </button>

              {showAdvancedSettings && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium">Temperature</label>
                    <input
                      type="number"
                      name="temperature"
                      min="0"
                      max="2"
                      step="0.1"
                      defaultValue={character?.temperature ?? 1.0}
                      className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Influences response variety. 0.0 to 2.0. Lower values: more predictable; Higher values: more diverse.
                    </p>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">Top P</label>
                    <input
                      type="number"
                      name="top_p"
                      min="0"
                      max="1"
                      step="0.05"
                      defaultValue={character?.top_p ?? 1.0}
                      className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Limits token choices to top percentage. 0.0 to 1.0. Lower values: more predictable; Higher values: more diverse.
                    </p>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">Top K</label>
                    <input
                      type="number"
                      name="top_k"
                      min="0"
                      step="1"
                      defaultValue={character?.top_k ?? 0}
                      className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Limits token choices to top K. 0 or above. Lower values: more predictable; 0: consider all choices.
                    </p>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">Frequency Penalty</label>
                    <input
                      type="number"
                      name="frequency_penalty"
                      min="-2"
                      max="2"
                      step="0.1"
                      defaultValue={character?.frequency_penalty ?? 0.0}
                      className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Controls token repetition based on frequency. -2.0 to 2.0. Positive: reduce repetition; Negative: encourage repetition.
                    </p>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">Presence Penalty</label>
                    <input
                      type="number"
                      name="presence_penalty"
                      min="-2"
                      max="2"
                      step="0.1"
                      defaultValue={character?.presence_penalty ?? 0.0}
                      className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Adjusts repetition of used tokens. -2.0 to 2.0. Positive: reduce repetition; Negative: encourage repetition.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`mt-6 px-12 py-2 border border-gray-200 dark:border-gray-700 rounded-full tracking-widest uppercase font-bold transition duration-200 flex items-center justify-center w-full md:w-auto
              ${isSubmitting 
                ? 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                : 'bg-transparent hover:bg-[#616467] hover:text-white text-black dark:text-neutral-200'
              }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500 dark:text-gray-400" />
                <span>{editMode ? 'Saving...' : 'Creating...'}</span>
              </div>
            ) : (
              editMode ? 'Save Changes' : 'Create Character'
            )}
          </button>      
        </form>
      </div>
    </div>
  );
}
