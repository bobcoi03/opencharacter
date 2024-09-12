import { Suspense } from 'react';
import Image from 'next/image';
import { AudioLines } from 'lucide-react';
import EllipsisButton from "@/components/chat-settings-button";
import MessageAndInput from './messages-and-input';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { characters, chat_sessions, users } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { CoreMessage } from 'ai';
import ShareButton from '@/components/share-button';

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

  let initialMessages: CoreMessage[] = [
    { role: 'system', content: character.description },
    { role: 'assistant', content: character.greeting }
  ];

  if (session?.user) {
    const chatSession = await db.query.chat_sessions.findFirst({
      where: and(
        eq(chat_sessions.user_id, session.user.id!),
        eq(chat_sessions.character_id, character.id)
      ),
    });
    
    if (chatSession) {
      initialMessages = [
        { role: 'system', content: character.description },
        { role: 'assistant', content: character.greeting },
        ...(chatSession.messages as CoreMessage[]).slice(2)
      ];
    }
  }

  return (
    <div className="flex flex-col h-screen dark:bg-neutral-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-neutral-900 p-4 flex items-center justify-between dark:border-neutral-700">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
            <Image src={character.avatar_image_url ?? "/default-avatar.jpg"} alt={`${character.name}'s avatar`} width={40} height={40} className="object-cover w-full h-full" />
          </div>
          <div>
            <h2 className="font-light text-black dark:text-white">{character.name}</h2>
            <p className="text-xs font-light text-gray-600 dark:text-gray-400">by {made_by_user?.name}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">

          <ShareButton />

          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors border border-gray-200 dark:border-neutral-700">
            <AudioLines className="text-gray-600 dark:text-gray-400" />
          </button>
          <Suspense fallback={<div className="w-10 h-10" />}>
            <EllipsisButton 
              character={character}
              made_by_username={made_by_user?.name!}
            />
          </Suspense>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-grow overflow-hidden w-full">
        <MessageAndInput 
          user={session?.user} 
          character={character}
          made_by_name={made_by_user?.name!}
          messages={initialMessages}
        />
      </div>
    </div>
  );
}