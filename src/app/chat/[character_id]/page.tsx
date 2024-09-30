import { Suspense } from 'react';
import Image from 'next/image';
import { ArrowLeft, AudioLines, ChevronLeft } from 'lucide-react';
import EllipsisButton from "@/components/chat-settings-button";
import MessageAndInput from './messages-and-input';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { characters, chat_sessions, personas, users } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { CoreMessage } from 'ai';
import ShareButton from '@/components/share-button';
import Link from 'next/link';

export const runtime = 'edge';

export async function generateMetadata({ params }: { params: { character_id: string } }) {
  const character = await db.query.characters.findFirst({
    where: eq(characters.id, params.character_id),
  });

  if (!character) {
    return {
      title: 'Character Not Found',
    };
  }

  return {
    title: `Chat with ${character.name}`,
    description: character.description.substring(0, 100),
    openGraph: {
      images: [{ url: character.avatar_image_url || '/default-avatar.png' }],
    },
  };
}

// Function to resolve t.co URLs by following redirects
async function resolveTwitterUrl(shortUrl: string): Promise<string> {
  try {
    const response = await fetch(shortUrl, { 
      method: 'HEAD',
      redirect: 'manual'
    });
    
    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get('location');
      if (location) {
        return location;
      }
    }
    // If no redirect, return the original URL
    return shortUrl;
  } catch (error) {
    console.error(`Error resolving URL ${shortUrl}:`, error);
    return shortUrl; // Return original URL if resolution fails
  }
}

// Function to convert Twitter-style URLs to real Markdown links
async function convertTwitterUrls(text: string): Promise<string> {
  // Regular expression to match Twitter-style URLs
  const twitterUrlRegex = /https?:\/\/t\.co\/\w+/g;
  
  // Find all matches
  const matches = text.match(twitterUrlRegex) || [];
  
  // Resolve all URLs concurrently
  const resolvedUrls = await Promise.all(matches.map(resolveTwitterUrl));
  
  // Create a map of short URLs to resolved URLs
  const urlMap = Object.fromEntries(matches.map((shortUrl, index) => [shortUrl, resolvedUrls[index]]));
  
  // Replace each match with a Markdown link
  return text.replace(twitterUrlRegex, (match) => {
    const resolvedUrl = urlMap[match];
    return `[${resolvedUrl}](${resolvedUrl})`;
  });
}

async function TWITTER_CHARACTER_PROMPT(fullName: string, description: string, followerCount: number, recentTweets: string, followingCount: number) {
  // Function to convert Twitter-style URLs to real Markdown links
  async function convertTwitterUrls(text: string): Promise<string> {
    // Regular expression to match Twitter-style URLs
    const twitterUrlRegex = /https?:\/\/t\.co\/\w+/g;
    
    // Find all matches
    const matches = text.match(twitterUrlRegex) || [];
    
    // Resolve all URLs concurrently
    const resolvedUrls = await Promise.all(matches.map(resolveTwitterUrl));
    
    // Create a map of short URLs to resolved URLs
    const urlMap = Object.fromEntries(matches.map((shortUrl, index) => [shortUrl, resolvedUrls[index]]));
    
    // Replace each match with a Markdown link
    return text.replace(twitterUrlRegex, (match) => {
      const resolvedUrl = urlMap[match];
      return `[${match}](${resolvedUrl})`;
    });
  }
  // Convert URLs in recent tweets
  const convertedTweets = await convertTwitterUrls(recentTweets);

  return `
You are an AI designed to roleplay the Twitter user ${fullName}. Respond to messages as if you are this person, based on the following information and guidelines:

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
${convertedTweets}

Remember, you are roleplaying as ${fullName}. Maintain this persona consistently throughout the conversation, using the provided information to inform your responses while staying true to the user's online personality.

Additional Guidelines:
- When including links, use the full, resolved URLs as shown in the recent tweets.
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

export default async function ChatPage({ params, searchParams }: { params: { character_id: string }, searchParams: { [key: string]: string | string[] | undefined }
}) {
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
      let resolvedDescription = ""
      if (twitterUser.description) {
        resolvedDescription = await convertTwitterUrls(twitterUser.description);
      }
      // Create a new character in the database
      character = await db.insert(characters).values({
        id: params.character_id,
        name: twitterUser.fullName,
        tagline: resolvedDescription,
        description: await TWITTER_CHARACTER_PROMPT(twitterUser.fullName, twitterUser.description, twitterUser.followersCount, tweetContent, twitterUser.followingsCount),
        greeting: `Hello! I'm ${twitterUser.fullName}`,
        visibility: 'public',
        userId: session?.user?.id!,
        avatar_image_url: profileImageUrl, // Use the modified URL
      }).returning().get();
    } else {
      return <div>Character not found</div>;
    }
  }

  let initialMessages: CoreMessage[] = [
    { role: 'system', content: character.description },
    { role: 'assistant', content: character.greeting }
  ];


  let persona;
  if (session?.user) {
    let chatSession;
  
    if (searchParams.session) {
      // If a specific session ID is provided in the URL
      console.log("searchParams: session: ", searchParams.session)
      
      chatSession = await db.query.chat_sessions.findFirst({
        where: and(
          eq(chat_sessions.id, searchParams.session as string),
          eq(chat_sessions.user_id, session.user.id!),
          eq(chat_sessions.character_id, character.id)
        )
      });
    } else {
      // If no specific session ID is provided, get the most recent session
      chatSession = await db.query.chat_sessions.findFirst({
        where: and(
          eq(chat_sessions.user_id, session.user.id!),
          eq(chat_sessions.character_id, character.id)
        ),
        orderBy: [desc(chat_sessions.updated_at)]
      });
    }
    
    if (chatSession) {
      initialMessages = [
        { role: 'system', content: character.description },
        { role: 'assistant', content: character.greeting },
        ...(chatSession.messages as CoreMessage[]).slice(2)
      ];
    }

    persona = await db.query.personas.findFirst({
      where: and (
        eq(personas.userId, session.user.id!),
        eq(personas.isDefault, true)
      )
    })
  }

  console.log("persona: ", persona)

  return (
    <div className="flex flex-col dark:bg-neutral-900 relative overflow-x-hidden max-w-full">
      {/* Chat Header - Absolute Positioned */}
      <div className="bg-white dark:bg-neutral-900 p-4 flex items-center justify-between dark:border-neutral-700 fixed md:fixed top-0 md:top-0 left-0 right-0 z-10">
        <div className="flex items-center">

          <Link href={"/"} >
            <ChevronLeft className='w-8 h-8 text-neutral-700'/>          
          </Link>


          <Link className="w-10 h-10 rounded-full overflow-hidden mr-3 ml-6" href={`/character/${character.id}/profile`}>
            <Image src={character.avatar_image_url ?? "/default-avatar.jpg"} alt={`${character.name}'s avatar`} width={40} height={40} className="object-cover w-full h-full" />
          </Link>
          <div>
            <h2 className="font-light text-black dark:text-white">{character.name}</h2>
            <p className="text-xs font-light text-gray-600 dark:text-gray-400">by Anon</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <ShareButton />
          <Suspense fallback={<div className="w-10 h-10" />}>
            <EllipsisButton 
              character={character}
              made_by_username={'Anon'}
            />
          </Suspense>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-grow overflow-y-auto pt-[72px] pb-4"> {/* Adjust pt value based on your header height */}
        <MessageAndInput 
          user={session?.user} 
          character={character}
          made_by_name={'Anon'}
          messages={initialMessages}
          chat_session={searchParams.session as string ?? null}
          persona={persona}
        />
      </div>
    </div>
  );
}