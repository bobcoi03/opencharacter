'use server';

import { createStreamableValue } from 'ai/rsc';
import { CoreMessage, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { characters, chat_sessions, ChatMessageArray} from '@/server/db/schema';
import { db } from '@/server/db';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/server/auth';

type ErrorResponse = {
  error: {
    code: number;
    message: string;
    metadata?: Record<string, unknown>;
  };
};

const groq = createOpenAI({
  baseUrl: "https://groq.helicone.ai/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
  headers: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  }
});

const openrouter = createOpenAI({
  baseURL: "https://openrouter.helicone.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "HTTP-Referer": "https://opencharacter.org", // Optional, for including your app on openrouter.ai rankings.
    "X-Title": "OpenCharacter", // Optional. Shows in rankings on openrouter.ai.
  }
});

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  headers: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  }
})

export async function continueConversation(messages: CoreMessage[], model_name: string, character: typeof characters.$inferSelect) {
  let model;
  switch (model_name) {
    case 'gpt-4o-mini':
      model = openai(model_name);
      break;
    case 'lizpreciatior/lzlv-70b-fp16-hf':
      model = openrouter(model_name);
      break;
    case 'deepseek/deepseek-chat':
      model = openrouter(model_name);
      break;
    case 'gryphe/mythomax-l2-13b':
      model = openrouter(model_name);
      break;
    default:
      model = groq(model_name);
  }
  const session = await auth();

  // Update character interaction count
  try {
    const [currentCharacter] = await db.select()
      .from(characters)
      .where(eq(characters.id, character.id))
      .limit(1);
    if (!currentCharacter) {
      throw new Error('Character not found');
    }
    await db.update(characters)
      .set({
        interactionCount: (currentCharacter.interactionCount ?? 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(characters.id, character.id));
  } catch (error) {
    console.error('Failed to update interaction count:', error);
    // Consider whether you want to throw this error or continue
  }

  try {
    const result = await streamText({
      model: model,
      messages,
      temperature: 1,  
      onFinish: async (completion) => {
        if (session?.user) {
          try {
            messages.push({
              role: 'assistant',
              content: completion.text
            });

            let chatSession = await db.select()
              .from(chat_sessions)
              .where(
                and(
                  eq(chat_sessions.user_id, session.user.id!),
                  eq(chat_sessions.character_id, character.id)
                )
              )
              .limit(1)
              .then(rows => rows[0]);

            if (chatSession) {
              await db.update(chat_sessions)
                .set({
                  messages: messages as ChatMessageArray,
                  interaction_count: chatSession.interaction_count + 1,
                  last_message_timestamp: new Date(),
                  updated_at: new Date()
                })
                .where(eq(chat_sessions.id, chatSession.id));
            } else {
              await db.insert(chat_sessions)
                .values({
                  user_id: session.user.id!,
                  character_id: character.id,
                  messages: messages as ChatMessageArray,
                  interaction_count: 1,
                  last_message_timestamp: new Date(),
                  created_at: new Date(),
                  updated_at: new Date()
                });
            }
          } catch (error) {
            console.error('Failed to update chat session:', error);
            // Consider whether you want to throw this error or continue
          }
        }
      }
    });

    const stream = createStreamableValue(result.textStream);
    return stream.value;
  } catch (error) {
    console.error('Failed to generate or stream response:', error);
    throw new Error('Failed to generate response. Please try again later.');
  }
}

export async function getConversations() {
  const session = await auth();

  if (!session || !session.user) {
    return { error: true, message: "No user found" };
  }

  try {
    const userChatSessions = await db.select({
      id: chat_sessions.id,
      character_id: chat_sessions.character_id,
      last_message_timestamp: chat_sessions.last_message_timestamp,
      updated_at: chat_sessions.updated_at,
      interaction_count: chat_sessions.interaction_count,
      character_name: characters.name,
      character_avatar: characters.avatar_image_url,
    })
      .from(chat_sessions)
      .leftJoin(characters, eq(chat_sessions.character_id, characters.id))
      .where(eq(chat_sessions.user_id, session.user.id!))
      .orderBy(desc(chat_sessions.updated_at));

    return {
      error: false,
      conversations: userChatSessions.map(session => ({
        id: session.id,
        character_id: session.character_id,
        character_name: session.character_name,
        character_avatar: session.character_avatar,
        last_message_timestamp: new Date(session.last_message_timestamp).toISOString(),
        updated_at: new Date(session.updated_at).toISOString(),
        interaction_count: session.interaction_count,
      }))
    };
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return { error: true, message: "Failed to fetch conversations" };
  }
}