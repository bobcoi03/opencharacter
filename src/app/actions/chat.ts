"use server";

import { createStreamableValue } from "ai/rsc";
import { CoreMessage, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  characters,
  chat_sessions,
  ChatMessageArray,
  personas,
} from "@/server/db/schema";
import { db } from "@/server/db";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { auth } from "@/server/auth";
import { isValidModel, isPaidModel } from "@/lib/llm_models";

// TRIAL RUN!!
const PAID_USER_IDS = [
  "fc735725-b774-4376-bb38-538a3aada18f", // me local
  "ed84afc0-d6d9-4c15-8e4c-757618597ba1", // me prod
  "16f0830a-f6a6-4755-8020-e5420fbbb356", // 1 16/10/24
  "b3abb1e8-8d95-482f-8deb-ea3f86b56348", // m 17/10/24
  "b4cd8ebb-2731-452d-ac6b-06d51e5a8369", // m 20/10/24
];

type ErrorResponse = {
  error: {
    code: number;
    message: string;
    metadata?: Record<string, unknown>;
  };
};

export async function saveChat(
  messages: CoreMessage[],
  character: typeof characters.$inferSelect,
  chat_session_id?: string,
) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("User not authenticated");
  }

  let chatSession;

  if (chat_session_id) {
    // If chat_session_id is provided, fetch the existing session
    chatSession = await db
      .select()
      .from(chat_sessions)
      .where(
        and(
          eq(chat_sessions.id, chat_session_id),
          eq(chat_sessions.user_id, session.user.id),
          eq(chat_sessions.character_id, character.id),
        ),
      )
      .then((rows) => rows[0]);

    if (!chatSession) {
      throw new Error("Chat session not found");
    }
  } else {
    // If no chat_session_id, find the most recent session
    chatSession = await db
      .select()
      .from(chat_sessions)
      .where(
        and(
          eq(chat_sessions.user_id, session.user.id),
          eq(chat_sessions.character_id, character.id),
        ),
      )
      .orderBy(desc(chat_sessions.updated_at))
      .limit(1)
      .then((rows) => rows[0]);
  }

  const now = new Date();

  if (chatSession) {
    // Update existing chat session
    await db
      .update(chat_sessions)
      .set({
        messages: messages as ChatMessageArray,
        interaction_count: sql`${chat_sessions.interaction_count} + 1`,
        last_message_timestamp: now,
        updated_at: now,
      })
      .where(eq(chat_sessions.id, chatSession.id));
  } else {
    // Create new chat session
    chatSession = await db
      .insert(chat_sessions)
      .values({
        user_id: session.user.id,
        character_id: character.id,
        messages: messages as ChatMessageArray,
        interaction_count: 1,
        last_message_timestamp: now,
        created_at: now,
        updated_at: now,
      })
      .returning()
      .then((rows) => rows[0]);
  }

  return chatSession;
}

export async function createChatSession(
  character: typeof characters.$inferInsert,
  messages?: CoreMessage[],
) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    throw new Error("User not authenticated");
  }

  if (character.id === undefined || character.id === null) {
    throw new Error("No character found");
  }

  try {
    const newSession = await db
      .insert(chat_sessions)
      .values({
        user_id: session.user.id!,
        character_id: character.id!,
        messages:
          (messages as ChatMessageArray) ??
          ([
            { role: "system", content: character.description },
            { role: "assistant", content: character.greeting },
          ] as ChatMessageArray),
        interaction_count: 1,
        last_message_timestamp: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning({ id: chat_sessions.id });

    return newSession[0].id;
  } catch (error) {
    console.error("Error creating chat session:", error);
    throw new Error("Failed to create chat session");
  }
}

export async function continueConversation(
  messages: ChatMessageArray,
  model_name: string,
  character: typeof characters.$inferSelect,
  chat_session_id?: string,
) {
  const session = await auth();

  if (!session?.user) {
    return { error: true, message: "Failed to authenticate user" };
  }

  // Check if the model is paid and if the user has access
  if (isPaidModel(model_name) && !PAID_USER_IDS.includes(session.user.id!)) {
    return { error: true, message: "Model is only available to valued anons" };
  }

  // Check if the character is public or if it's private and belongs to the user
  const characterCheck = await db.query.characters.findFirst({
    where: and(
      eq(characters.id, character.id),
      or(
        eq(characters.visibility, "public"),
        and(
          eq(characters.visibility, "private"),
          eq(characters.userId, session.user.id!),
        ),
      ),
    ),
  });

  if (!characterCheck) {
    return {
      error: true,
      message: "You don't have permission to interact with this character",
    };
  }

  let llm_provider = createOpenAI({
    baseURL: "https://openrouter.helicone.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "HTTP-Referer": "https://opencharacter.org", // Optional, for including your app on openrouter.ai rankings.
      "X-Title": "OpenCharacter", // Optional. Shows in rankings on openrouter.ai.
      "Helicone-User-Id": session?.user?.email ?? "guest",
    },
  });


  const model = llm_provider(model_name);

  if (!isValidModel(model_name)) {
    throw new Error("Invalid model: " + model_name);
  }

  // Fetch the default persona for the user
  const defaultPersona = await db
    .select()
    .from(personas)
    .where(
      and(eq(personas.userId, session.user.id!), eq(personas.isDefault, true)),
    )
    .limit(1)
    .then((rows) => rows[0]);

  // Modify the first message to include persona information
  if (defaultPersona && messages.length > 0) {
    const personaInfo = `The user you are chatting to is called: ${defaultPersona.displayName} {{user}}\nBackground information:${defaultPersona.background}\n`;
    messages[0] = {
      ...messages[0],
      role: "system",
      content: `${messages[0].content}\n\n${personaInfo}`,
      id: crypto.randomUUID(), // Add unique id to the first message
    };
  }

  try {
    // Update character interaction count
    const [currentCharacter] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, character.id))
      .limit(1);

    if (!currentCharacter) {
      throw new Error("Character not found");
    }

    await db
      .update(characters)
      .set({
        interactionCount: (currentCharacter.interactionCount ?? 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(characters.id, character.id));
  } catch (error) {
    console.error("Failed to update interaction count:", error);
  }

  let chatSession;

  if (chat_session_id) {
    // If chat_session_id is provided, fetch that specific session
    chatSession = await db
      .select()
      .from(chat_sessions)
      .where(
        and(
          eq(chat_sessions.id, chat_session_id),
          eq(chat_sessions.user_id, session.user.id!),
          eq(chat_sessions.character_id, character.id),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);
  } else {
    // If no chat_session_id, find the most recent session
    chatSession = await db
      .select()
      .from(chat_sessions)
      .where(
        and(
          eq(chat_sessions.user_id, session.user.id!),
          eq(chat_sessions.character_id, character.id),
        ),
      )
      .orderBy(desc(chat_sessions.updated_at))
      .limit(1)
      .then((rows) => rows[0]);
  }

  if (chatSession.summary) {
    console.log("Injecting chat session summary")
    messages[0] = {
      ...messages[0],
      role: "system",
      content: `${messages[0].content}\nChat Memory:${chatSession.summary}`,
      id: crypto.randomUUID(),
    };
  }

  try {
    const result = await streamText({
      model: model,
      messages: messages,
      temperature: character.temperature ?? 1.0,
      topP: character.top_p ?? 1.0,
      topK: character.top_k ?? 0,
      frequencyPenalty: character.frequency_penalty ?? 0.0,
      presencePenalty: character.presence_penalty ?? 0.0,
      maxTokens: character.max_tokens ?? 1000,
      maxRetries: 5,
      onFinish: async (completion) => {
        if (session?.user) {
          try {
            messages.push({
              role: "assistant",
              content: completion.text,
              time: Date.now(),
              id: crypto.randomUUID()
            });

            if (chatSession) {
              await db
                .update(chat_sessions)
                .set({
                  messages: messages as ChatMessageArray,
                  interaction_count: chatSession.interaction_count + 1,
                  last_message_timestamp: new Date(),
                  updated_at: new Date(),
                })
                .where(eq(chat_sessions.id, chatSession.id));
              console.log(`Updated chat session: ${chatSession.id}`);
            } else {
              const newSession = await db
                .insert(chat_sessions)
                .values({
                  user_id: session.user.id!,
                  character_id: character.id,
                  messages: messages as ChatMessageArray,
                  interaction_count: 1,
                  last_message_timestamp: new Date(),
                  created_at: new Date(),
                  updated_at: new Date(),
                })
                .returning({ id: chat_sessions.id });
              console.log(`Created new chat session: ${newSession[0].id}`);
            }
          } catch (error) {
            console.error("Failed to update chat session:", error);
          }
        }
      },
    });

    const stream = createStreamableValue(result.textStream);
    return stream.value;
  } catch (error) {
    console.log("Failed to generate or stream response:", error);
    throw new Error("Failed to generate response. Please try again.");
  }
}

export async function getConversations() {
  const session = await auth();

  if (!session || !session.user) {
    return { error: true, message: "No user found" };
  }

  try {
    const latestSessions = await db
      .select({
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
      .innerJoin(
        db
          .select({
            character_id: chat_sessions.character_id,
            max_updated_at: sql<Date>`MAX(${chat_sessions.updated_at})`.as(
              "max_updated_at",
            ),
          })
          .from(chat_sessions)
          .where(eq(chat_sessions.user_id, session.user.id!))
          .groupBy(chat_sessions.character_id)
          .as("latest_sessions"),
        and(
          eq(
            chat_sessions.character_id,
            sql.raw("latest_sessions.character_id"),
          ),
          eq(
            chat_sessions.updated_at,
            sql.raw("latest_sessions.max_updated_at"),
          ),
        ),
      )
      .orderBy(desc(chat_sessions.updated_at));

    return {
      error: false,
      conversations: latestSessions.map((session) => ({
        id: session.id,
        character_id: session.character_id,
        character_name: session.character_name,
        character_avatar: session.character_avatar,
        last_message_timestamp: new Date(
          session.last_message_timestamp,
        ).toISOString(),
        updated_at: new Date(session.updated_at).toISOString(),
        interaction_count: session.interaction_count,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return { error: true, message: "Failed to fetch conversations" };
  }
}

export async function getAllConversationsByCharacter(character_id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const conversations = await db.query.chat_sessions.findMany({
    where: and(
      eq(chat_sessions.user_id, session.user.id),
      eq(chat_sessions.character_id, character_id),
    ),
    orderBy: [desc(chat_sessions.updated_at)],
  });

  return conversations as typeof chat_sessions.$inferSelect[];
}

export async function deleteChatSession(chatSessionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    // Check if the chat session exists and belongs to the user
    const chatSession = await db.query.chat_sessions.findFirst({
      where: and(
        eq(chat_sessions.id, chatSessionId),
        eq(chat_sessions.user_id, session.user.id)
      ),
    });

    if (!chatSession) {
      return { success: false, error: "Chat session not found or you don't have permission to delete it" };
    }

    // Delete the chat session
    await db.delete(chat_sessions).where(eq(chat_sessions.id, chatSessionId));

    return { success: true, message: "Chat session deleted successfully" };
  } catch (error) {
    console.error("Failed to delete chat session:", error);
    return { success: false, error: "Failed to delete chat session. Please try again." };
  }
}

export async function summarizeConversation(
  messages: ChatMessageArray,
  character: typeof characters.$inferSelect,
  chat_session_id?: string | null
) {
  const session = await auth();

  if (!session?.user) {
    return { error: true, message: "Failed to authenticate user" };
  }

  const model_name = "nousresearch/hermes-3-llama-3.1-405b";
  let chatSession;

  if (chat_session_id) {
    // If chat_session_id is provided, fetch that specific session
    chatSession = await db
      .select()
      .from(chat_sessions)
      .where(
        and(
          eq(chat_sessions.id, chat_session_id),
          eq(chat_sessions.user_id, session.user.id!),
          eq(chat_sessions.character_id, character.id),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);
  } else {
    // If no chat_session_id, find the most recent session
    chatSession = await db
      .select()
      .from(chat_sessions)
      .where(
        and(
          eq(chat_sessions.user_id, session.user.id!),
          eq(chat_sessions.character_id, character.id),
        ),
      )
      .orderBy(desc(chat_sessions.updated_at))
      .limit(1)
      .then((rows) => rows[0]);
  }

  if (!chatSession) {
    return { error: true, message: "No chat session found" };
  }

  let llm_provider = createOpenAI({
    baseURL: "https://openrouter.helicone.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "HTTP-Referer": "https://opencharacter.org",
      "X-Title": "OpenCharacter",
      "Helicone-User-Id": session?.user?.email ?? "guest",
    },
  });

  const model = llm_provider(model_name);

  const summaryPrompt = `Summarize the following conversation between a user and ${character.name}. Provide a concise summary that captures the main points of the conversation:

${messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}

Summary:`;

  try {
    const result = await streamText({
      model: model,
      messages: [{ role: "user", content: summaryPrompt }],
      temperature: 1,
      maxTokens: 900,
      maxRetries: 3,
      onFinish: async (completion) => {
        if (session?.user) {
          try {
            await db
              .update(chat_sessions)
              .set({
                summary: completion.text,
                updated_at: new Date(),
              })
              .where(eq(chat_sessions.id, chatSession!.id));
            console.log(`Updated chat session summary: ${chatSession!.id}`);
          } catch (error) {
            console.error("Failed to update chat session summary:", error);
          }
        }
      },
    });

    const stream = createStreamableValue(result.textStream);
    return stream.value;
  } catch (error) {
    console.log("Failed to generate or stream summary:", error);
    throw new Error("Failed to generate summary. Please try again.");
  }
}

export async function saveSummarization(
  content: string,
  character: typeof characters.$inferSelect,
  chat_session_id?: string | null
) {
  const session = await auth();

  if (!session?.user) {
    return { error: true, message: "Failed to authenticate user" };
  }

  let chatSession;

  if (chat_session_id) {
    // If chat_session_id is provided, fetch that specific session
    chatSession = await db
      .select()
      .from(chat_sessions)
      .where(
        and(
          eq(chat_sessions.id, chat_session_id),
          eq(chat_sessions.user_id, session.user.id!),
          eq(chat_sessions.character_id, character.id)
        )
      )
      .limit(1)
      .then((rows) => rows[0]);
  } else {
    // If no chat_session_id, find the most recent session for the character
    chatSession = await db
      .select()
      .from(chat_sessions)
      .where(
        and(
          eq(chat_sessions.user_id, session.user.id!),
          eq(chat_sessions.character_id, character.id)
        )
      )
      .orderBy(desc(chat_sessions.updated_at))
      .limit(1)
      .then((rows) => rows[0]);
  }

  if (!chatSession) {
    return { error: true, message: "No chat session found for the specified character" };
  }

  try {
    await db
      .update(chat_sessions)
      .set({
        summary: content,
        updated_at: new Date(),
      })
      .where(eq(chat_sessions.id, chatSession.id));

    console.log(`Updated chat session summary: ${chatSession.id} for character: ${character.name}`);
    return { success: true, message: "Summary saved successfully" };
  } catch (error) {
    console.error("Failed to update chat session summary:", error);
    return { error: true, message: "Failed to save summary. Please try again." };
  }
}

export async function fetchSummary(
  character: typeof characters.$inferSelect,
  chat_session_id?: string | null
) {
  const session = await auth();

  if (!session?.user) {
    return { error: true, message: "Failed to authenticate user" };
  }

  let chatSession;

  if (chat_session_id) {
    // If chat_session_id is provided, fetch that specific session
    chatSession = await db
      .select()
      .from(chat_sessions)
      .where(
        and(
          eq(chat_sessions.id, chat_session_id),
          eq(chat_sessions.user_id, session.user.id!),
          eq(chat_sessions.character_id, character.id)
        )
      )
      .limit(1)
      .then((rows) => rows[0]);
  } else {
    // If no chat_session_id, find the most recent session for the character
    chatSession = await db
      .select()
      .from(chat_sessions)
      .where(
        and(
          eq(chat_sessions.user_id, session.user.id!),
          eq(chat_sessions.character_id, character.id)
        )
      )
      .orderBy(desc(chat_sessions.updated_at))
      .limit(1)
      .then((rows) => rows[0]);
  }

  if (!chatSession) {
    return { error: true, message: "No chat session found for the specified character" };
  }

  if (!chatSession.summary) {
    return { error: true, message: "No summary available for this chat session" };
  }

  return {
    success: true,
    summary: chatSession.summary,
    chat_session_id: chatSession.id,
    character_id: character.id,
    character_name: character.name
  };
}