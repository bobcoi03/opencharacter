import React from 'react';
import { ArrowLeft, Pencil, Globe } from 'lucide-react';
import Link from 'next/link';
import { createCharacter } from '@/app/actions/character';
import { redirect } from 'next/navigation';
import { SubmitButton } from './submit-button';

export const runtime = "edge";

export default function NewCharacterPage() {
  async function handleSubmit(formData: FormData) {
    'use server'

    const result = await createCharacter(formData);
    if (result.success && result.character) {
      redirect(`/chat/${result.character.id}`);
    } else {
      console.error("Error creating character:", result.error, result.details);
      // Here you might want to return these errors to the client
      // For now, we'll just throw a generic error
      throw new Error(result.error || 'Failed to create character');
    }
  }

  return (
    <div className="w-full bg-white dark:bg-neutral-900 min-h-screen p-6">
      <header className="">
        <Link href="/" className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 inline-block">
          <ArrowLeft size={16} />
        </Link>
      </header>

      <div className="max-w-3xl mx-auto p-4">
        <form className="space-y-4" action={handleSubmit}>
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-orange-400 rounded-full mb-2 flex items-center justify-center">
              <Pencil size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Character name</h2>
          </div>

          <div className="space-y-3">
            <div>
              <input
                type="text"
                name="name"
                placeholder="e.g. Albert Einstein"
                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Tagline</label>
              <input
                type="text"
                name="tagline"
                placeholder="Add a short tagline of your Character"
                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Description</label>
              <textarea
                name="description"
                placeholder="How would your Character describe themselves?"
                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md h-24 bg-white dark:bg-neutral-900"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Greeting</label>
              <input
                type="text"
                name="greeting"
                placeholder="e.g. Hello, I am Albert. Ask me anything about my scientific contributions."
                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900"
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