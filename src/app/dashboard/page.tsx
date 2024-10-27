import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { chat_sessions, characters } from "@/server/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { ChatMessageArray } from "@/server/db/schema";
import LineChartDashboard from "@/components/line-chart";
import RecentMessages from "@/components/recent-messages";
import BarChartDashboard from "@/components/bar-chart";
import { Heart, MessageCircle, User, Tag } from "lucide-react";

export const runtime = "edge";

interface MessageCount {
    date: string;
    count: number;
}

async function getMessageData() {
    const session = await auth();
    const user = session?.user;
  
    if (!user) {
      return null;
    }
  
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 29); // Get data for the last 30 days (including today)
  
    const userCharacters = await db.select()
      .from(characters)
      .where(eq(characters.userId, user.id!));
  
    const messageCounts = await Promise.all(userCharacters.map(async (character) => {
      const dailyCounts = await db.select({
        date: sql<string>`date(last_message_timestamp / 1000, 'unixepoch')`.as('date'),
        count: sql<number>`sum(json_array_length(messages))`.as('count')
      })
      .from(chat_sessions)
      .where(
        and(
          eq(chat_sessions.character_id, character.id),
          gte(chat_sessions.last_message_timestamp, startDate)
        )
      )
      .groupBy(sql`date(last_message_timestamp / 1000, 'unixepoch')`)
      .orderBy(sql`date`);
  
      // Create an array of all dates in the range
      const dateArray = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dateArray.push(d.toISOString().split('T')[0]);
      }
  
      // Fill in missing dates with zero counts
      const filledData = dateArray.map(date => {
        const matchingCount = dailyCounts.find(count => count.date === date);
        return {
          date,
          count: matchingCount ? matchingCount.count : 0
        };
      });
  
      return {
        name: character.name,
        data: filledData
      };
    }));
  
    return messageCounts;
  }

async function getRecentMessages() {
    const session = await auth();
    const user = session?.user;
  
    if (!user) {
      return null;
    }
  
    const recentSessions = await db.select({
      character: characters.name,
      messages: chat_sessions.messages,
      timestamp: chat_sessions.last_message_timestamp
    })
    .from(chat_sessions)
    .innerJoin(characters, eq(chat_sessions.character_id, characters.id))
    .where(eq(characters.userId, user.id!))
    .orderBy(sql`last_message_timestamp desc`)
    .limit(25);
  
    return recentSessions.flatMap(session => {
      const messages = session.messages as ChatMessageArray;
      return messages.slice(-1).map(message => ({
        character: session.character,
        content: message.content,
        timestamp: session.timestamp.getTime() // Convert Date to number (milliseconds)
      }));
    }).sort((a, b) => b.timestamp - a.timestamp).slice(0, 25);
}

async function getUserCountData() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return null;
  }

  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 29); // Get data for the last 30 days (including today)

  const userCharacters = await db.select()
    .from(characters)
    .where(eq(characters.userId, user.id!));

  const userCounts = await db.select({
    date: sql<string>`date(last_message_timestamp / 1000, 'unixepoch')`.as('date'),
    count: sql<number>`count(distinct user_id)`.as('count')
  })
  .from(chat_sessions)
  .where(
    and(
      gte(chat_sessions.last_message_timestamp, startDate),
      sql`character_id IN ${userCharacters.map(c => c.id)}`
    )
  )
  .groupBy(sql`date(last_message_timestamp / 1000, 'unixepoch')`)
  .orderBy(sql`date`);

  // Create an array of all dates in the range
  const dateArray = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dateArray.push(d.toISOString().split('T')[0]);
  }

  // Fill in missing dates with zero counts
  const filledData = dateArray.map(date => {
    const matchingCount = userCounts.find(count => count.date === date);
    return {
      date,
      count: matchingCount ? matchingCount.count : 0
    };
  });

  return filledData;
}

async function getAllCharacters() {
    const session = await auth();
    const user = session?.user;
  
    if (!user) {
      return null;
    }

    const userCharacters = await db.select()
        .from(characters)
        .where(eq(characters.userId, user.id!));

    return userCharacters;
}

interface CharacterGridProps {
    characters: typeof characters.$inferSelect[];
  }
  
  const CharacterCard: React.FC<{ character: typeof characters.$inferSelect }> = ({ character }) => {
    const tags = JSON.parse(character.tags) as string[];
  
    return (
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${character.banner_image_url || '/api/placeholder/800/200'})` }} />
        <div className="p-4">
          <div className="flex items-center mb-4">
            <img
              src={character.avatar_image_url || '/api/placeholder/100/100'}
              alt={character.name}
              className="w-16 h-16 rounded-full mr-4 border-2 border-blue-500"
            />
            <div>
              <h2 className="text-xl font-bold text-white">{character.name}</h2>
              <p className="text-gray-400">{character.tagline}</p>
            </div>
          </div>
          <p className="text-gray-300 mb-4 line-clamp-3">{character.description}</p>
          <div className="flex justify-between items-center text-gray-400 mb-4">
            <span className="flex items-center">
              <MessageCircle size={18} className="mr-1" />
              {character.interactionCount}
            </span>
            <span className="flex items-center">
              <Heart size={18} className="mr-1" />
              {character.likeCount}
            </span>
            <span className="flex items-center">
              <User size={18} className="mr-1" />
              {character.visibility}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                <Tag size={12} className="mr-1" />
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
                +{tags.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const CharacterGrid: React.FC<CharacterGridProps> = ({ characters }) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters.map((character) => (
          <CharacterCard key={character.id} character={character} />
        ))}
      </div>
    );
  };
  
export default async function Dashboard() {
  const messageData = await getMessageData();
  const recentMessages = await getRecentMessages();
  const userCountData = await getUserCountData();

  return (
    <div className="md:ml-16 text-white p-4 mb-16">
      <div className="lg:flex">
        <div className="w-full lg:w-[50%]">
          {messageData && messageData?.length > 0 && <LineChartDashboard messageData={messageData} />}
        </div>
        <div className="w-full lg:w-[50%] mt-4 lg:mt-0">
          {userCountData && userCountData.length > 0 && <BarChartDashboard userCountData={userCountData} />}
        </div>
      </div>
      <div className="w-full lg:w-[50%] mt-4">
        {recentMessages && recentMessages.length > 0 && <RecentMessages messages={recentMessages} />}
      </div>
    </div>
  );
}