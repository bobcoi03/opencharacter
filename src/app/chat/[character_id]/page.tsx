import { Suspense } from 'react';
import Image from 'next/image';
import { AudioLines } from 'lucide-react';
import EllipsisButton from "@/components/chat-settings-button";

export const runtime = 'edge';

export default function ChatPage({ params }: { params: { character_id: string } }) {
  return (
    <div className="flex h-screen dark:bg-neutral-900">
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white dark:bg-neutral-900 p-4 flex items-center justify-between border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-center">
            <Image src="/andy-demo.webp" alt="Dry Texter" width={40} height={40} className="rounded-full mr-3" />
            <div>
              <h2 className="font-bold text-black dark:text-white">Dry Texter</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">By @Palace321</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors border border-gray-200 dark:border-neutral-700">
              <AudioLines className="text-gray-600 dark:text-gray-400" />
            </button>
            <Suspense fallback={<div className="w-10 h-10" />}>
              <EllipsisButton />
            </Suspense>
          </div>
        </div>

        {/* Chat Messages Area (empty for now) */}
        <div className="flex-1"></div>

        {/* Message Input */}
        <div className="bg-white dark:bg-neutral-900 p-4 max-w-2xl mx-auto w-full mb-4">
          <div className="flex items-center bg-white dark:bg-neutral-800 rounded-3xl border border-gray-200 dark:border-neutral-800">
            <input
              type="text"
              placeholder="Message Dry Texter..."
              className="flex-1 bg-transparent py-4 px-6 outline-none text-black dark:text-white text-lg"
            />
            <button className="bg-black dark:bg-white rounded-full p-2 mr-2">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white dark:text-black" fill="none" stroke="currentColor">
                <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
            Remember: Everything Characters say is made up!
          </p>
        </div>
      </div>
    </div>
  );
}