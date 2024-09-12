"use client";

import React, { useState } from 'react';

export default function ShareButton() {
  const [shareMessage, setShareMessage] = useState('');

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareMessage('URL copied!');
      setTimeout(() => setShareMessage(''), 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      setShareMessage('Failed to copy');
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleShare}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors border border-gray-200 dark:border-neutral-700 text-xs font-medium text-gray-600 dark:text-gray-400"
      >
        Share
      </button>
      {shareMessage && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
          {shareMessage}
        </div>
      )}
    </div>
  );
}