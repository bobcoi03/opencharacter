"use server";

import { createStreamableValue } from "ai/rsc";
import { CoreMessage, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  characters,
  chat_sessions,
  ChatMessageArray,
  subscriptions,
  personas,
  user_credits
} from "@/server/db/schema";
import { db } from "@/server/db";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { auth } from "@/server/auth";
import { isValidModel, isPaidModel, isMeteredModel } from "@/lib/llm_models";
import { checkAndIncrementRequestCount } from "@/lib/request-limits";
import { getPayAsYouGo } from "./user";

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
  base_url?: string,
  api_key?: string,
) {
  console.log("Starting continueConversation with:", {
    modelName: model_name,
    characterId: character.id,
    chatSessionId: chat_session_id,
    messagesCount: messages.length
  });

  const session = await auth();

  if (!session?.user?.id) {
    console.log("Authentication failed - no user session");
    return { error: true, message: "Failed to authenticate user" };
  }

  // Check if the model is paid and if the user has access
  // First check subscription status for the user
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, session.user.id),
  });

  const isSubscribed = subscription?.status === "active" || subscription?.status === "trialing";

  if (isPaidModel(model_name)) {
    if (!isSubscribed) {
      console.log("User attempted to use paid model without active subscription:", {
        userId: session.user.id,
        model: model_name
      });
      return { error: true, message: "You must be a paid user to use this model" };
    }
  } else if (!isSubscribed && !api_key) {
    // Only check request limits for non-subscribed users using free models
    // If the user has an API key, they can use the model without being limited
    try {
      const { remainingRequests } = await checkAndIncrementRequestCount(session.user.id);
      console.log("Free tier request count updated:", {
        userId: session.user.id,
        remainingRequests
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Daily request limit exceeded")) {
        return { error: true, message: error.message };
      }
      throw error;
    }
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

  // Get the user's default persona
  const defaultPersona = await db
    .select()
    .from(personas)
    .where(
      and(
        eq(personas.userId, session.user.id!),
        eq(personas.isDefault, true)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  let systemContent = messages[0].content;

  // Add persona if available
  if (defaultPersona) {
    console.log("Injecting default persona for user:", session.user.id);
    systemContent = `${systemContent}\nUser Persona: ${defaultPersona.background}`;
  }

  if (chatSession && chatSession.summary) {
    console.log("Injecting chat session summary for session:", chatSession.id);
    systemContent = `${systemContent}\nChat Memory: ${chatSession.summary}`;
  }

  // Update the system message with combined content
  messages[0] = {
    ...messages[0],
    role: "system",
    content: systemContent,
    id: crypto.randomUUID(),
  };

  try {
    let response;
    if (!isValidModel(model_name) && !base_url) {
      console.log("INVALID MODEL NAME:", model_name);
      throw new Error("Invalid model: " + model_name);
    }

    if (base_url) {
      console.log("Using custom base URL:", base_url);
      console.log("Using custom API key:", api_key);
      console.log("Using custom model:", model_name);

      // Clean messages by removing id field
      const cleanMessages = messages.map(({ id, ...rest }) => rest);

      // Prepare headers with required fields but allow for API-specific headers
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${api_key}`,
        "Content-Type": "application/json",
      };

      // Prepare the request body with all possible parameters
      const requestBody = {
        model: model_name,
        messages: cleanMessages,
        stream: true,
        temperature: character.temperature ?? 1.0,
        top_p: character.top_p ?? 1.0,
        max_tokens: character.max_tokens ?? 1000,
      };

      try {
        response = await fetch(base_url, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error("API Error Response:", {
            status: response.status,
            statusText: response.statusText,
            data: errorData,
          });
          throw new Error(`API request failed: ${errorData}`);
        }
      } catch (error) {
        console.error("Failed to make API request:", error);
        throw error;
      }
    } else {

      if (isMeteredModel(model_name)) {
        const payAsYouGo = await getPayAsYouGo();

        if (!payAsYouGo.pay_as_you_go) {
          return { error: true, message: "You must toggle on pay-as-you-go in subscriptions to use this model" };
        } else {
          // Check user's credit balance before proceeding
          const userCredits = await db
            .select()
            .from(user_credits)
            .where(eq(user_credits.userId, session.user.id!))
            .limit(1)
            .then(rows => rows[0]);

          if (!userCredits) {
            return { error: true, message: "No credit record found for your account" };
          }

          if (userCredits.balance <= 0) {
            return { error: true, message: "Insufficient credits. Please add more credits to continue using this model." };
          }
          
          // Estimate minimum required balance based on model type
          // Different models have different costs, so we set a minimum threshold
          const minimumRequiredBalance = 0.1; // Increase threshold to $0.10 minimum
          
          // Additional model-specific cost estimation
          // These are conservative estimates for typical prompt + completion costs
          const modelCostEstimates: Record<string, number> = {
            "anthropic/claude-3.7-sonnet": 0.15,
            "anthropic/claude-3.7-sonnet:thinking": 0.15,
            "anthropic/claude-3-opus": 0.25,
            "openai/gpt-4o-2024-11-20": 0.15,
            "openai/o1": 0.3,
            "x-ai/grok-2-1212": 0.15,
          };
          
          // Get model-specific threshold or use the default
          const modelSpecificThreshold = modelCostEstimates[model_name] || minimumRequiredBalance;
          
          if (userCredits.balance < modelSpecificThreshold) {
            return { 
              error: true, 
              message: `Your credit balance ($${userCredits.balance.toFixed(2)}) is too low for ${model_name}. Please add at least $${modelSpecificThreshold.toFixed(2)} to continue.` 
            };
          }
        }
      }

      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://opencharacter.org",
          "X-Title": "OpenCharacter",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model_name,
          messages: messages,
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
    let responseId = '';

    const textStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              if (isSubscribed && isMeteredModel(model_name) && responseId) {
                console.log("Recording metered model:", responseId);
                await recordMeteredModels(responseId);
              }
              break;
            }

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

                if (json.id) {
                  responseId = json.id;
                }

                // If we get a finish_reason, we're done
                if (choice.finish_reason) {
                  responseId = json.id;
                  console.log("Received finish_reason with responseId:", responseId);
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
    return streamValue.value;
  } catch (error) {
    console.error("Failed to generate response:", error);
    throw new Error(error as string);
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
        title: chat_sessions.title,
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
        title: session.title,
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
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://opencharacter.org",
      "X-Title": "OpenCharacter",
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

async function recordMeteredModels(gen_id: string) {
  console.log("Recording metered model with ID:", gen_id);
  
  if (!gen_id || gen_id.trim() === '') {
    console.error("Invalid generation ID provided:", gen_id);
    return;
  }
  
  // Get the current session and subscription status
  const currentSession = await auth();
  
  if (!currentSession?.user?.id) {
    console.log("No user session found for metering");
    return;
  }
      
  try {
    // Implement polling with exponential backoff
    const maxRetries = 5;
    const initialBackoff = 500; // Start with 500ms
    
    let attempt = 0;
    let generationData = null;
    
    while (attempt < maxRetries && !generationData) {
      attempt++;
      const backoffTime = initialBackoff * Math.pow(2, attempt - 1); // Exponential backoff
      
      console.log(`Attempt ${attempt} to fetch generation data, waiting ${backoffTime}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      
      const generation = await fetch(
        `https://openrouter.ai/api/v1/generation?id=${gen_id}`,
        { 
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://opencharacter.org",
            "X-Title": "OpenCharacter",
            "Content-Type": "application/json",
          },
        },
      );
      
      if (generation.ok) {
        const stats = await generation.json() as {
          data?: {
            total_cost: number;
            tokens_prompt?: number;
            tokens_completion?: number;
          };
        };
        
        // Check if we have valid data
        if (stats.data?.total_cost !== undefined) {
          generationData = stats.data;
          console.log("Successfully retrieved generation data:", {
            cost: stats.data.total_cost,
            promptTokens: stats.data.tokens_prompt,
            completionTokens: stats.data.tokens_completion
          });
          break;
        } else {
          console.log(`Attempt ${attempt}: Generation data not yet available or incomplete`);
        }
      } else {
        console.log(`Attempt ${attempt}: Failed to fetch generation data, status: ${generation.status}`);
      }
      
      // If we've reached the max retries, log an error
      if (attempt === maxRetries) {
        console.error("Failed to retrieve generation data after maximum retries");
      }
    }
    
    // Continue with the rest of the function using generationData
    if (!generationData) {
      console.error("Failed to retrieve valid generation data");
      // Use a fallback minimum cost to ensure we still charge something
      // This is a safety measure in case the OpenRouter API is temporarily unavailable
      generationData = {
        total_cost: 0.001, // Minimal fallback cost
        tokens_prompt: 0,
        tokens_completion: 0
      };
      console.log("Using fallback minimum cost due to inability to fetch actual cost");
    }

    console.log("Generation stats:", generationData);
    
    // Apply 100% premium to the total cost
    const baseCost = generationData.total_cost;
    const premiumRate = 2; // 100% premium
    const finalCost = baseCost * premiumRate;

    console.log(`Base cost: ${baseCost}, Final cost with 100% premium: ${finalCost}`);

    // Get user's current credit balance
    const userCredits = await db
      .select()
      .from(user_credits)
      .where(eq(user_credits.userId, currentSession.user.id))
      .limit(1)
      .then(rows => rows[0]);

    if (!userCredits) {
      console.error("No credit record found for user:", currentSession.user.id);
      return;
    }

    // Check if user has sufficient balance
    if (userCredits.balance < finalCost) {
      console.error(`Insufficient credits for user: ${currentSession.user.id}. Required: ${finalCost}, Available: ${userCredits.balance}`);
      
      // Only allow the transaction if the user has at least 50% of the required cost
      // This prevents users from getting free inferences with tiny balances
      if (userCredits.balance < finalCost * 0.5) {
        throw new Error(`Insufficient credits. Required: $${finalCost.toFixed(4)}, Available: $${userCredits.balance.toFixed(4)}`);
      }
      
      console.warn(`User has partial credits - will deduct available amount: ${userCredits.balance}`);
    }

    // Update user's credit balance
    await db
      .update(user_credits)
      .set({ 
        balance: Math.max(0, userCredits.balance - finalCost),
        lastUpdated: new Date()
      })
      .where(eq(user_credits.userId, currentSession.user.id));

    const actualDeduction = Math.min(finalCost, userCredits.balance);
    
    // Log a warning if the cost exceeds the available balance
    if (finalCost > userCredits.balance) {
      console.warn(`Warning: Cost (${finalCost}) exceeds available balance (${userCredits.balance}). Deducting only ${actualDeduction} and setting balance to 0.`);
    }
    
    console.log(`Deducted ${actualDeduction} from user ${currentSession.user.id}'s balance (base cost: ${baseCost}, premium: 100%)`);
  } catch (error) {
    console.error("Error in recordMeteredModels:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

export async function updateChatSessionTitle(conversationId: string, title: string) {
  const session = await auth();

  if (!session?.user) {
    return { error: true, message: "Failed to authenticate user" };
  }

  try {
    await db
      .update(chat_sessions)
      .set({ title: title })
      .where(eq(chat_sessions.id, conversationId));
    return { error: false, message: "Title updated successfully" };
  } catch (error) {
    console.error("Error in updateChatSessionTitle:", error);
    return { error: true, message: "Failed to update title" };
  }
}