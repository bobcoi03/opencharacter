import { Suspense } from 'react';
import Image from 'next/image';
import { AudioLines } from 'lucide-react';
import EllipsisButton from "@/components/chat-settings-button";
import MessageAndInput from './messages-and-input';
import { auth } from '@/server/auth';

export const runtime = 'edge';

export default async function ChatPage({ params }: { params: { character_id: string } }) {
  const session = await auth();

  return (
    <div className="flex flex-col h-screen dark:bg-neutral-900">
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

      {/* Chat Content */}
      <div className="flex-grow overflow-hidden">
        <MessageAndInput 
          user={session?.user} 
          character_id={params.character_id}
        />
      </div>
    </div>
  );
}