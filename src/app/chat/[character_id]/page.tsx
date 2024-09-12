import { Suspense } from 'react';
import Image from 'next/image';
import { AudioLines } from 'lucide-react';
import EllipsisButton from "@/components/chat-settings-button";
import MessageAndInput from './messages-and-input';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { characters, users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';

export default async function ChatPage({ params }: { params: { character_id: string } }) {
  const session = await auth();
  
  const character = await db.query.characters.findFirst({
    where: eq(characters.id, params.character_id),
  })

  if (!character) {
    return <div>Character not found</div>;
  }

  // get name of user who made char
  const made_by_user = await db.query.users.findFirst({
    where: eq(users.id, character.userId)
  })

  return (
    <div className="flex flex-col h-screen dark:bg-neutral-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-neutral-900 p-4 flex items-center justify-between dark:border-neutral-700">
        <div className="flex items-center">
          <Image src={character.avatar_image_url ?? "/default-avatar.jpeg"} alt="Dry Texter" width={40} height={40} className="rounded-full mr-3" />
          <div>
            <h2 className="font-light text-black dark:text-white">{character.name}</h2>
            <p className="text-xs font-light text-gray-600 dark:text-gray-400">by {made_by_user?.name}</p>
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
      <div className="flex-grow overflow-hidden w-full">

        <MessageAndInput 
          user={session?.user} 
          character={character}
          made_by_name={made_by_user?.name!}
        />
      </div>
    </div>
  );
}