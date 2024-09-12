"use client"

import React, { useState } from 'react';
import { ArrowLeft, Upload, Globe } from 'lucide-react';
import Link from 'next/link';
import { SubmitButton } from '@/app/new/submit-button';

export function CreateCharacterForm({ action }: { action: (formData: FormData) => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError("File size exceeds 5MB limit");
        setPreviewUrl(null);
        event.target.value = ''; // Reset the input
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

  return (
    <div className="w-full bg-white dark:bg-neutral-900 min-h-screen p-6">
      <header>
        <Link href="/" className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 inline-block">
          <ArrowLeft size={16} />
        </Link>
      </header>

      <div className="max-w-3xl mx-auto p-4">
        <form className="space-y-4" action={action}>
          <div className="flex flex-col items-center mb-6">
            <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full mb-2 flex items-center justify-center overflow-hidden relative">
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar preview" className="w-full h-full object-cover" />
              ) : (
                <Upload size={32} className="text-gray-400 dark:text-gray-500" />
              )}
              <input
                type="file"
                name="avatar"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required
              />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Character Avatar</h2>
            {fileError && <p className="text-red-500 text-sm mt-1">{fileError}</p>}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Max file size: 5MB</p>
          </div>

          <div className="space-y-3">
            <label className="block mb-1 text-sm font-medium">Character Name</label>
            <div>
              <input
                type="text"
                name="name"
                placeholder="Character name e.g. Albert Einstein"
                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900"
                required
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
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Description</label>
              <textarea
                name="description"
                placeholder="How would your Character describe themselves?"
                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md h-24 bg-white dark:bg-neutral-900"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Greeting</label>
              <input
                type="text"
                name="greeting"
                placeholder="e.g. Hello, I am Albert. Ask me anything about my scientific contributions."
                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Visibility</label>
              <div className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-full flex items-center space-x-2 bg-white dark:bg-neutral-900">
                <Globe size={14} />
                <span>public</span>
              </div>
            </div>
          </div>

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}