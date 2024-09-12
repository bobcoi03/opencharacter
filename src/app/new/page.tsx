import React from 'react';
import { ArrowLeft, Pencil, Globe } from 'lucide-react';
import Link from 'next/link';
import { createCharacter } from '@/app/actions/character';
import { redirect } from 'next/navigation';
import { CreateCharacterForm } from '@/components/create-character-form';

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
    <CreateCharacterForm action={handleSubmit} />
  );
}