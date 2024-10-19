import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { chat_sessions, characters } from "@/server/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { ChatMessageArray } from "@/server/db/schema";
import LineChartDashboard from "@/components/line-chart";
import RecentMessages from "@/components/recent-messages";
import BarChartDashboard from "@/components/bar-chart";

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
  
export default async function Dashboard() {
  const messageData = await getMessageData();
  const recentMessages = await getRecentMessages();
  const userCountData = await getUserCountData();

  if (!messageData || !recentMessages || !userCountData) {
    return <div className="md:ml-16 text-white p-4">Please log in to view the dashboard.</div>;
  }

  return (
    <div className="md:ml-16 text-white p-4 mb-16">
      <div className="lg:flex lg:space-x-4">
        <div className="w-full lg:w-[60%]">
          <LineChartDashboard messageData={messageData} />
        </div>
        <div className="w-full lg:w-[40%] mt-4 lg:mt-0">
          <RecentMessages messages={recentMessages} />
        </div>
      </div>
      <div className="w-full lg:w-[40%] mt-4">
        <BarChartDashboard userCountData={userCountData} />
      </div>
    </div>
  );
}