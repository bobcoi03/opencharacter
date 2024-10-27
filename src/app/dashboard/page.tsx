import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { chat_sessions, characters } from "@/server/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { ChatMessageArray } from "@/server/db/schema";
import LineChartDashboard from "@/components/line-chart";
import RecentMessages from "@/components/recent-messages";
import BarChartDashboard from "@/components/bar-chart";

export const runtime = "edge";

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
      id: chat_sessions.id,
      character: characters.name,
      characterDetails: {
        name: characters.name,
        tagline: characters.tagline,
        description: characters.description,
        avatar_image_url: characters.avatar_image_url,
        banner_image_url: characters.banner_image_url,
        temperature: characters.temperature,
        top_p: characters.top_p,
        top_k: characters.top_k,
        frequency_penalty: characters.frequency_penalty,
        presence_penalty: characters.presence_penalty,
        repetition_penalty: characters.repetition_penalty,
        min_p: characters.min_p,
        top_a: characters.top_a,
        max_tokens: characters.max_tokens,
        visibility: characters.visibility
      },
      messages: chat_sessions.messages,
      timestamp: chat_sessions.last_message_timestamp
    })
    .from(chat_sessions)
    .innerJoin(characters, eq(chat_sessions.character_id, characters.id))
    .where(eq(characters.userId, user.id!))
    .orderBy(sql`last_message_timestamp desc`)
    .limit(10);
  
    return recentSessions.flatMap(session => {
      const messages = session.messages as ChatMessageArray;
      const lastMessage = messages[messages.length - 1];
      
      const fullConversation = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.time || session.timestamp.getTime()
      }));
  
      // Convert null to undefined for the character details
      const characterDetails = {
        name: session.characterDetails.name,
        tagline: session.characterDetails.tagline,
        description: session.characterDetails.description,
        avatar_image_url: session.characterDetails.avatar_image_url || undefined,
        banner_image_url: session.characterDetails.banner_image_url || undefined,
        temperature: session.characterDetails.temperature ?? undefined,
        top_p: session.characterDetails.top_p ?? undefined,
        top_k: session.characterDetails.top_k ?? undefined,
        frequency_penalty: session.characterDetails.frequency_penalty ?? undefined,
        presence_penalty: session.characterDetails.presence_penalty ?? undefined,
        repetition_penalty: session.characterDetails.repetition_penalty ?? undefined,
        min_p: session.characterDetails.min_p ?? undefined,
        top_a: session.characterDetails.top_a ?? undefined,
        max_tokens: session.characterDetails.max_tokens ?? undefined,
        visibility: session.characterDetails.visibility ?? undefined,
      }
  
      return [{
        character: session.character,
        characterDetails,
        content: lastMessage.content,
        timestamp: session.timestamp.getTime(),
        sessionId: session.id,
        fullConversation
      }];
    }).sort((a, b) => b.timestamp - a.timestamp);
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
    
export default async function Dashboard() {
  const messageData = await getMessageData();
  const recentMessages = await getRecentMessages();
  const userCountData = await getUserCountData();

  return (
    <div className="md:ml-16 text-white p-4 mb-16">
      <div className="lg:flex lg:gap-4">
        <div className="w-full lg:w-[50%]">
          {messageData && messageData?.length > 0 && <LineChartDashboard messageData={messageData} />}
        </div>
        <div className="w-full lg:w-[50%] mt-4 lg:mt-0">
          {userCountData && userCountData.length > 0 && <BarChartDashboard userCountData={userCountData} />}
        </div>
      </div>
      <div className="w-full mt-4">
        {recentMessages && recentMessages.length > 0 && <RecentMessages messages={recentMessages} />}
      </div>
    </div>
  );
}