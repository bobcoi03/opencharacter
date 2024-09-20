'use server';

import { createStreamableValue } from 'ai/rsc';
import { CoreMessage, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { characters, chat_sessions, ChatMessageArray} from '@/server/db/schema';
import { db } from '@/server/db';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/server/auth';

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

export async function continueConversation(messages: CoreMessage[], model_name: string, character: typeof characters.$inferSelect) {
  const model = openrouter(model_name)
  const session = await auth();

  try {
    // Update character interaction count
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
  }

  try {
    const result = await streamText({
      model: model,
      messages,
      temperature: character.temperature ?? 1.0,
      topP: character.top_p ?? 1.0,
      topK: character.top_k ?? 0,
      frequencyPenalty: character.frequency_penalty ?? 0.0,
      presencePenalty: character.presence_penalty ?? 0.0,
      maxTokens: character.max_tokens ?? 200,
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
              console.log(`Updated chat session: ${chatSession.id}`);
            } else {
              const newSession = await db.insert(chat_sessions)
                .values({
                  user_id: session.user.id!,
                  character_id: character.id,
                  messages: messages as ChatMessageArray,
                  interaction_count: 1,
                  last_message_timestamp: new Date(),
                  created_at: new Date(),
                  updated_at: new Date()
                })
                .returning({ id: chat_sessions.id });
              console.log(`Created new chat session: ${newSession[0].id}`);
            }
          } catch (error) {
            console.error('Failed to update chat session:', error);
          }
        }
      }
    });

    const stream = createStreamableValue(result.textStream);
    console.log('Successfully created streamable value');
    return stream.value;
  } catch (error) {
    console.error('Failed to generate or stream response:', JSON.stringify(error));
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