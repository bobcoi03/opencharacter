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
import { isValidModel, isPaidModel, isDAWModel } from "@/lib/llm_models";
import { PAID_USER_IDS } from "@/lib/utils";

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
  console.log("Starting continueConversation with:", {
    modelName: model_name,
    characterId: character.id,
    chatSessionId: chat_session_id,
    messagesCount: messages.length
  });

  const session = await auth();

  if (!session?.user) {
    console.log("Authentication failed - no user session");
    return { error: true, message: "Failed to authenticate user" };
  }

  // Check if the model is paid and if the user has access
  if (isPaidModel(model_name) && !PAID_USER_IDS.includes(session.user.id!)) {
    console.log("User attempted to use paid model without access:", {
      userId: session.user.id,
      model: model_name
    });
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
    console.log("Character access check failed:", {
      characterId: character.id,
      userId: session.user.id
    });
    return {
      error: true,
      message: "You don't have permission to interact with this character",
    };
  }

  let chatSession;

  if (chat_session_id) {
    console.log("Fetching specific chat session:", chat_session_id);
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
    console.log("Fetching most recent chat session for character:", character.id);
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

  try {
    // Update character interaction count
    const [currentCharacter] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, character.id))
      .limit(1);

    if (!currentCharacter) {
      console.log("Character not found for interaction count update:", character.id);
      throw new Error("Character not found");
    }

    console.log("Updating character interaction count:", {
      characterId: character.id,
      currentCount: currentCharacter.interactionCount
    });

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

  if (chatSession && chatSession.summary) {
    console.log("Injecting chat session summary for session:", chatSession.id);
    messages[0] = {
      ...messages[0],
      role: "system",
      content: `${messages[0].content}\nChat Memory:${chatSession.summary}`,
      id: crypto.randomUUID(),
    };
  }

  try {
    let response;

    if (isDAWModel(model_name)) {
      console.log("Using DAW model:", model_name);
      if (!process.env.DAW_API_KEY) {
        console.error("DAW API key not configured");
        return { error: true, message: "DAW service is currently unavailable" };
      }

      const sessionId = chat_session_id ?? chatSession?.id;
      console.log("Making DAW API request with session:", sessionId);

      response = await fetch("https://daw.isinyour.skin/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.DAW_API_KEY}`,
          "UserID": session.user.id!,
          "SessionID": sessionId ?? "00000000-0000-0000-0000-000000000000",
          "CharacterID": character.id
        },
        body: JSON.stringify({
          messages,
          model: model_name,
          temperature: character.temperature ?? 1.0,
          top_p: character.top_p ?? 1.0,
          top_k: character.top_k ?? 0,
          frequency_penalty: character.frequency_penalty ?? 0.0,
          presence_penalty: character.presence_penalty ?? 0.0,
          max_tokens: character.max_tokens ?? 1000,
          stream: true,
        })
      });
    } else {
      if (!isValidModel(model_name)) {
        console.log("INVALID MODEL NAME:", model_name);
        throw new Error("Invalid model: " + model_name);
      }

      console.log("Making OpenRouter API request with model:", model_name);
      response = await fetch("https://openrouter.helicone.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
          "HTTP-Referer": "https://opencharacter.org",
          "X-Title": "OpenCharacter",
          "Helicone-User-Id": session?.user?.email ?? "guest",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model_name,
          messages,
          temperature: character.temperature ?? 1.0,
          top_p: character.top_p ?? 1.0,
          top_k: character.top_k ?? 0,
          frequency_penalty: character.frequency_penalty ?? 0.0,
          presence_penalty: character.presence_penalty ?? 0.0,
          max_tokens: character.max_tokens ?? 1000,
          provider: {
            allow_fallbacks: false
          },
          stream: true,
        })
      });
    }

    if (!response.ok) {
      console.error("API request failed:", response.status);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const stream = response.body;
    if (!stream) {
      console.error("No response stream available");
      throw new Error("No response stream available");
    }

    console.log("Starting stream processing");
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const textStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() === '') continue;
              if (line.trim() === 'data: [DONE]') continue;
              if (!line.startsWith('data: ')) continue;

              try {
                const json = JSON.parse(line.slice(6)) as {
                  id: string;
                  object: 'chat.completion' | 'chat.completion.chunk';
                  choices: Array<{
                    delta?: {
                      content?: string;
                    };
                    message?: {
                      content: string;
                    };
                    index: number;
                    finish_reason: string | null;
                  }>;
                };

                // Skip if this is the final usage message (empty choices)
                if (json.choices.length === 0) continue;

                const choice = json.choices[0];
                const content = choice.delta?.content ?? choice.message?.content;

                if (content) {
                  controller.enqueue(content);
                }

                // If we get a finish_reason, we're done
                if (choice.finish_reason) {
                  break;
                }
              } catch (e) {
                console.error('Error parsing SSE JSON:', e);
                console.log('Problematic line:', line);
              }
            }
          }

          // Final buffer processing
          if (buffer) {
            try {
              if (buffer.startsWith('data: ')) {
                const json = JSON.parse(buffer.slice(6)) as {
                  choices: Array<{
                    delta?: {
                      content?: string;
                    };
                    message?: {
                      content: string;
                    };
                  }>;
                };

                const content = json.choices[0].delta?.content ?? json.choices[0].message?.content;
                if (content) {
                  controller.enqueue(content);
                }
              }
            } catch (e) {
              console.error('Error parsing final buffer:', e);
              console.log('Final buffer:', buffer);
            }
          }

          controller.close();
        } catch (error) {
          console.error("Stream processing error:", error);
          controller.error(error);
        }
      },
    });

    console.log("Creating stream branches");
    // Create a TransformStream to fork the stream
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
      },
    });

    // Create two branches of the stream
    const [stream1, stream2] = textStream.tee();

    // Create the streamable value from the first branch
    const streamValue = createStreamableValue(stream1);

    // Use the second branch for accumulating the full completion
    let fullCompletion = '';
    stream2.pipeTo(new WritableStream({
      write(chunk) {
        fullCompletion += chunk;
        console.log("Accumulated response:", fullCompletion);
      },
      async close() {
        if (session?.user) {
          console.log("Stream completed, updating chat session");
          try {
            messages.push({
              role: "assistant",
              content: fullCompletion,
              time: Date.now(),
              id: crypto.randomUUID()
            });

            if (chatSession) {
              console.log("Updating existing chat session:", chatSession.id);
              try {
                await db.update(chat_sessions)
                  .set({
                    messages: messages as ChatMessageArray,
                    interaction_count: chatSession.interaction_count + 1,
                    last_message_timestamp: new Date(),
                    updated_at: new Date(),
                  })
                  .where(eq(chat_sessions.id, chatSession.id));
                console.log(`Updated chat session: ${chatSession.id}`);
              } catch (error) {
                console.error("Failed to update chat session:", error);
              }
            } else {
              console.log("Creating new chat session");
              try {
                const newSession = await db.insert(chat_sessions)
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
              } catch (error) {
                console.error("Failed to create chat session:", error);
              }
            }
          } catch (error) {
            console.error("Failed to handle chat session:", error);
          }
        }
      }
    })).catch((error) => {
      console.error("Failed to process stream:", error);
    });

    return streamValue.value;
  } catch (error) {
    console.error("Failed to generate response:", error);
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

  const model_name = "mistralai/mistral-nemo";
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

export async function toggleChatSessionSharing(
  character: typeof characters.$inferSelect | null,
  chat_session_id?: string
) {
  const session = await auth();

  if (!session?.user) {
    return { error: true, message: "User not authenticated" };
  }

  // Check if character exists
  if (!character) {
    return { error: true, message: "No character provided" };
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

    if (!chatSession) {
      return { error: true, message: "Chat session not found or you don't have permission to access it" };
    }
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

    if (!chatSession) {
      return { error: true, message: "No chat session found for this character" };
    }
  }

  // Toggle the share field
  const newShareValue = !chatSession.share;

  try {
    // Update the chat session with the new share value
    await db
      .update(chat_sessions)
      .set({
        share: newShareValue,
        updated_at: new Date(),
      })
      .where(eq(chat_sessions.id, chatSession.id));

    return {
      success: true,
      message: `Chat session sharing ${newShareValue ? 'enabled' : 'disabled'} successfully`,
      chatSession: {
        id: chatSession.id,
        share: newShareValue,
        character_id: character.id,
        character_name: character.name
      }
    };
  } catch (error) {
    console.error("Failed to update chat session sharing status:", error);
    return { error: true, message: "Failed to update sharing status. Please try again." };
  }
}

export async function getChatSessionShareStatus(
  character: typeof characters.$inferSelect | null,
  chat_session_id?: string
) {
  const session = await auth();

  if (!session?.user) {
    return { error: true, message: "User not authenticated" };
  }

  // Check if character exists
  if (!character) {
    return { error: true, message: "No character provided" };
  }

  let chatSession;

  if (chat_session_id) {
    // If chat_session_id is provided, fetch that specific session
    chatSession = await db
      .select({
        id: chat_sessions.id,
        share: chat_sessions.share,
        character_id: chat_sessions.character_id,
      })
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

    if (!chatSession) {
      return { error: true, message: "Chat session not found or you don't have permission to access it" };
    }
  } else {
    // If no chat_session_id, find the most recent session for the character
    chatSession = await db
      .select({
        id: chat_sessions.id,
        share: chat_sessions.share,
        character_id: chat_sessions.character_id,
      })
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

    if (!chatSession) {
      return { error: true, message: "No chat session found for this character" };
    }
  }

  return {
    success: true,
    chatSession: {
      id: chatSession.id,
      share: chatSession.share,
      character_id: chatSession.character_id,
      character_name: character.name
    }
  };
}
