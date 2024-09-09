"use client"
import React, { useState } from 'react';
import { ArrowLeft, Pencil, ChevronDown, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

const NewCharacterPage = () => {
  const [characterName, setCharacterName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [greeting, setGreeting] = useState('');
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="w-full bg-white dark:bg-neutral-900 min-h-screen p-6">
      <header className="">
        <button onClick={handleBack} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800">
          <ArrowLeft size={16} />
        </button>
      </header>

      <div className="max-w-3xl mx-auto p-4">
        <form className="space-y-4">
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
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="e.g. Albert Einstein"
                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900"
              />
              <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                {characterName.length}/20
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Add a short tagline of your Character"
                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900"
              />
              <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                {tagline.length}/50
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="How would your Character describe themselves?"
                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md h-24 bg-white dark:bg-neutral-900"
              />
              <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                {description.length}/500
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Greeting</label>
              <input
                type="text"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="e.g. Hello, I am Albert. Ask me anything about my scientific contributions."
                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900"
              />
              <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                {greeting.length}/2048
              </div>
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium">Visibility</label>
              <button className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-full flex items-center space-x-2 bg-white dark:bg-neutral-900">
                <Globe size={14} />
                <span>Public</span>
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </form>

        <div className='w-full'>
          <button className="mt-6 text-black px-12 py-2 border border-gray-200 dark:border-gray-700 rounded-full tracking-widest uppercase font-bold bg-transparent hover:bg-[#616467] hover:text-white dark:text-neutral-200 transition duration-200">
            Create Character
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewCharacterPage;