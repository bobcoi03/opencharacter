import React from 'react';
import { createCharacter } from '@/app/actions/character';
import { redirect } from 'next/navigation';
import { CreateCharacterForm } from '@/components/create-character-form';
import { auth } from '@/server/auth';

export const runtime = "edge";

export default async function NewCharacterPage() {
  const session = await auth()

  if (!session || !session.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Sign In Required</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You must be signed in to create a character.
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(formData: FormData) {
    'use server'

    const result = await createCharacter(formData);
    if (result.success && result.character) {
      redirect(`/chat/${result.character.id}`);
    } else {
      console.error("Error creating character:", result.error, result.details);
      throw new Error(result.error || 'Failed to create character');
    }
  }

  return (
    <CreateCharacterForm action={handleSubmit} />
  );
}