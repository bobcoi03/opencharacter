"use client";

import React from 'react';

type Message = {
  character: string;
  content: string;
  timestamp: number;
};

export default function RecentMessages({ messages }: { messages: Message[] }) {
  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold mb-2 text-white">Recent Messages</h2>
      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
        {messages.map((message, index) => (
          <div key={index} className="rounded p-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{message.character}</span>
              <span>{new Date(message.timestamp).toLocaleString()}</span>
            </div>
            <p className="text-sm mt-1">{message.content ? message.content.slice(0, 100) : ""}</p>
          </div>
        ))}
      </div>
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #4B5563 #1F2937;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1F2937;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #4B5563;
          border-radius: 4px;
          border: 2px solid #1F2937;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #6B7280;
        }
      `}</style>
    </div>
  );
}