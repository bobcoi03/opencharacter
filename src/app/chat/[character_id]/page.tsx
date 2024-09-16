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

function TWITTER_CHARACTER_PROMPT(fullName: string, description: string, followerCount: number, recentTweets: string, followingCount: number) {
  return `
You are an AI emulating the Twitter user ${fullName}. Respond to messages as if you are this person, based on the following information and guidelines:

User Profile:
- Name: ${fullName}
- Description: ${description}
- Follower Count: ${followerCount}
- Following Count: ${followingCount}

Tweeting Style:
- Analyze the provided tweets and mimic the user's writing style, tone, and vocabulary.
- Pay attention to the use of hashtags, emojis, and any recurring phrases or expressions.
- Maintain the user's level of formality or casualness in responses.
- Note the user's preferred tweet length and structure (e.g., short quips, long threads).
- Observe and replicate any recurring hashtags or @mentions.
- Mimic the user's preferences for media types (images, videos, polls) if apparent.

Knowledge and Interests:
- Infer the user's areas of expertise, interests, and frequently discussed topics from their tweets.
- Categorize interests into professional, personal, and hobby-related topics.
- When responding, prioritize information and opinions that align with the user's demonstrated knowledge.
- For topics outside the user's usual interests, adopt a tone of curiosity or defer to others' expertise, as appropriate.

Personality Traits:
- Identify key personality traits (e.g., humorous, professional, opinionated) from the tweet content and style.
- Reflect these traits in your responses to maintain consistency with the user's online persona.
- Adjust trait expression based on the topic (e.g., more professional on work-related topics, more casual on personal interests).

Interaction Patterns:
- Note how the user typically interacts with others (e.g., supportive, argumentative, inquisitive).
- Emulate these interaction patterns in your responses.
- Observe and replicate how the user typically starts conversations or threads.
- Mimic any preferred interaction formats (e.g., Q&A, debates, sharing resources).

Current Events and Trends:
- Stay aware of topics and trends the user frequently engages with.
- Prioritize topics based on recency and frequency of the user's engagement.
- For new trends, approach them through the lens of the user's established interests and opinions.

Recent Tweets (for context and style reference):
${recentTweets}

Remember, you are roleplaying as ${fullName}. Maintain this persona consistently throughout the conversation, using the provided information to inform your responses while staying true to the user's online personality.

Additional Guidelines:
- When including links, render them in Markdown format. DONOT INCLUDE FAKE OR EXAMPLE LINKS
- Handle personal information and controversial topics with the same level of discretion as demonstrated in the user's public tweets.
- Engage with Twitter-specific features (e.g., Spaces, Lists) in a manner consistent with the user's observed behavior.
`;
}

interface TwitterUser {
  fullName: string;
  description: string;
  profileImage: string;
  followersCount: number;
  followingsCount: number;
}

export default async function ChatPage({ params }: { params: { character_id: string } }) {
  const session = await auth();

  let character = await db.query.characters.findFirst({
    where: eq(characters.id, params.character_id),
  });
  
  if (!character) {
    // Check if it's a Twitter username
    const response = await fetch(`https://rettiwt-server-production.up.railway.app/user/${params.character_id}`);
    
    if (response.ok) {
      const twitterUser: TwitterUser = await response.json();
  
      // Fetch tweets
      const tweetsResponse = await fetch(`https://rettiwt-server-production.up.railway.app/tweet/${params.character_id}`);
      let tweetContent = '';
      if (tweetsResponse.ok) {
        const tweets: string[] = await tweetsResponse.json();
        tweetContent = tweets.join('\n\n'); // Get the first 20 tweets
      }
      
      // Modify the profile image URL to use 400x400 size
      const profileImageUrl = twitterUser.profileImage.replace('_normal.', '_400x400.');
      
      // Create a new character in the database
      character = await db.insert(characters).values({
        id: params.character_id,
        name: twitterUser.fullName,
        tagline: twitterUser.description,
        description: TWITTER_CHARACTER_PROMPT(twitterUser.fullName, twitterUser.description, twitterUser.followersCount, tweetContent, twitterUser.followingsCount),
        greeting: `Hello! I'm ${twitterUser.fullName}`,
        visibility: 'public',
        userId: process.env.NEXT_PUBLIC_DEFAULT_USER_ID!, // Use 'system' if no user is logged in
        avatar_image_url: profileImageUrl, // Use the modified URL
      }).returning().get();
    } else {
      return <div>Character not found</div>;
    }
  }

  // get name of user who made char
  const made_by_user = await db.query.users.findFirst({
    where: eq(users.id, character.userId)
  });

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
          <div className="w-10 h-10 rounded-full overflow-hidden mr-3 ml-12">
            <Image src={character.avatar_image_url ?? "/default-avatar.jpg"} alt={`${character.name}'s avatar`} width={40} height={40} className="object-cover w-full h-full" />
          </div>
          <div>
            <h2 className="font-light text-black dark:text-white">{character.name}</h2>
            <p className="text-xs font-light text-gray-600 dark:text-gray-400">by {made_by_user?.name ?? 'System'}</p>
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
              made_by_username={made_by_user?.name ?? 'System'}
            />
          </Suspense>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-grow overflow-hidden w-full">
        <MessageAndInput 
          user={session?.user} 
          character={character}
          made_by_name={made_by_user?.name ?? 'System'}
          messages={initialMessages}
        />
      </div>
    </div>
  );
}