"use client";

import React, { useState } from "react";
import { Upload } from "lucide-react";

export default function ShareButton({ url }: { url?: string }) {
  const [shareMessage, setShareMessage] = useState("");

  const handleShare = async () => {
    const url_set = url ?? window.location.href;
    try {
      await navigator.clipboard.writeText(url_set);
      setShareMessage("Share Link Copied To Clipboard!");
      setTimeout(() => setShareMessage(""), 3000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      setShareMessage("Failed to copy");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 hover:bg-neutral-800 transition-colors border border-neutral-700 text-gray-400"
        aria-label="Share"
      >
        <Upload size={18} />
      </button>
      {shareMessage && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
          {shareMessage}
        </div>
      )}
    </div>
  );
}
