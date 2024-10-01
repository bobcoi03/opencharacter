"use client";

import React, { useState, useEffect } from "react";
import { CoreMessage } from "ai";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RegenerationProps {
  messages: CoreMessage[];
  onRegenerate: (messages: CoreMessage[]) => Promise<void>;
  selectedModel: string;
  character: any; // Replace with proper type
  chatSession: string | undefined;
}

const MAX_REGENERATIONS = 30;

const RegenerationFeature: React.FC<RegenerationProps> = ({
  messages,
  onRegenerate,
  selectedModel,
  character,
  chatSession,
}) => {
  const [regenerations, setRegenerations] = useState<CoreMessage[][]>([
    messages,
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleRegenerate = async () => {
    if (regenerations.length >= MAX_REGENERATIONS) {
      console.log("Maximum regenerations reached");
      return;
    }

    const newMessages = [...regenerations[currentIndex]];
    newMessages.pop(); // Remove the last assistant message

    try {
      await onRegenerate(newMessages);
      setRegenerations([...regenerations, newMessages]);
      setCurrentIndex(regenerations.length);
    } catch (error) {
      console.error("Regeneration failed:", error);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < regenerations.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleRegenerate();
    }
  };

  return (
    <div className="flex items-center justify-center space-x-2 mt-2">
      <button
        onClick={handlePrevious}
        disabled={currentIndex === 0}
        className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {currentIndex + 1} / {regenerations.length}
      </span>
      <button
        onClick={handleNext}
        disabled={
          regenerations.length >= MAX_REGENERATIONS &&
          currentIndex === regenerations.length - 1
        }
        className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default RegenerationFeature;
