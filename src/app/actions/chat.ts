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
  user_credits,
  ChatMessage,
  MultimodalContent
} from "@/server/db/schema";
import { db } from "@/server/db";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { auth } from "@/server/auth";
import { isValidModel, isPaidModel, isMeteredModel } from "@/lib/llm_models";
import { getPayAsYouGo } from "./user";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';
import { checkAndIncrementRequestCount } from "@/lib/request-limits";

type ErrorResponse = {
  error: {
    code: number;
    message: string;
    metadata?: Record<string, unknown>;
  };
};

// Instantiate the S3 client configured for R2
const s3Client = new S3Client({
  region: "auto", // R2 doesn't use regions like AWS S3
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const R2_BUCKET_NAME = "chat-images"; // The name of your R2 bucket

export async function saveChat(
  incomingMessages: ChatMessageArray, // Rename to avoid confusion
  character: typeof characters.$inferSelect,
  chat_session_id?: string,
) {
  const session = await auth();
  const userId = session?.user?.id; // Get user ID
  if (!userId) {
    console.error("[saveChat] Authentication failed - no valid user ID found");
    throw new Error("User not authenticated");
  }

  // --- Process incoming messages for potential Data URIs before saving ---
  let messagesToSave: ChatMessageArray;
  try {
     messagesToSave = await Promise.all(incomingMessages.map(async (msg, index) => { // Add index for logging
      if (msg.role === 'user' && typeof msg.content === 'string') {
        try {
          // Check if it looks like a JSON array first
          if (!msg.content.trim().startsWith('[')) {
             console.log(`[saveChat Process Msg ${index}] User message content is string but not JSON array, skipping processing.`);
             return msg;
          }

          const parsedContent: MultimodalContent[] = JSON.parse(msg.content);
          if (Array.isArray(parsedContent)) {
            let needsUpdate = false;
            const updatedParts = await Promise.all(parsedContent.map(async (part) => {
              if (part.type === 'image_url' && part.image_url?.url?.startsWith('data:')) {
                console.log(`[saveChat Process Msg ${index}] Found data URI in user message part, processing...`);
                needsUpdate = true;
                try {
                  // Use a more flexible regex to capture mime type
                  const match = part.image_url.url.match(/^data:image\/([^;]+);base64,(.*)$/);
                  if (!match) {
                    console.warn(`[saveChat Process Msg ${index}] Could not parse image data URI (flexible regex), keeping original part. URL start:`, part.image_url.url.substring(0, 60));
                    return part;
                  }
                  // Mime type is now image/ + match[1]
                  const mimeType = `image/${match[1]}`;
                  const base64Data = match[2];
                  const imageBuffer = Buffer.from(base64Data, 'base64');
                  // Use match[1] (subtype like 'jpeg') for file extension if possible
                  const fileExtension = match[1].split('+')[0] || 'png'; // Handle things like svg+xml, default png
                  const imageKey = `${userId}/${uuidv4()}.${fileExtension}`;

                  await s3Client.send(new PutObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: imageKey,
                    Body: imageBuffer,
                    ContentType: mimeType,
                  }));
                  return { ...part, image_url: { url: imageKey } };
                } catch (uploadError) {
                  console.error(`[saveChat Process Msg ${index}] Error uploading image to R2:`, uploadError);
                  console.warn(`[saveChat Process Msg ${index}] Keeping original image part due to upload error.`);
                  return part; // Return original part if upload fails
                }
              }
              return part; // Return non-image or already processed parts
            }));

            if (needsUpdate) {
              const updatedContentString = JSON.stringify(updatedParts);
              return { ...msg, content: updatedContentString };
            } else {
               return msg; // Return original if no update needed
            }
          } else {
             return msg; // Return original if parse results in non-array
          }
        } catch (e) {
          console.warn(`[saveChat Process Msg ${index}] Failed to parse user message content as JSON: ${e instanceof Error ? e.message : String(e)}. Keeping original.`);
          // Keep original message if JSON parsing fails (might be plain text)
          return msg;
        }
      }
      // Return original message if not user or content not string
      return msg;
    }));

    // Sanity check: Compare counts
    if (messagesToSave.length !== incomingMessages.length) {
       console.warn(`[saveChat] Mismatch in message count after processing! Before: ${incomingMessages.length}, After: ${messagesToSave.length}. This might indicate a dropped message.`);
       // Potentially throw an error or handle this case depending on requirements
    }

  } catch (processingError) {
     console.error("[saveChat] Critical error during message processing (Promise.all):", processingError);
     // Decide how to handle: rethrow, use original messages, return error?
     // For now, let's rethrow to indicate failure
     throw new Error("Failed to process messages before saving.");
  }
  // --- End message processing ---

  // Log size before saving
  try {
    const messagesString = JSON.stringify(messagesToSave);
    // Add a check for potentially problematic size
    const MAX_SIZE_BYTES = 10 * 1024 * 1024; // Example: 1MB limit for D1 text field? Check D1 limits.
    if (messagesString.length > MAX_SIZE_BYTES) {
       console.warn(`[saveChat] Processed messages string size (${messagesString.length}) exceeds threshold (${MAX_SIZE_BYTES}). Potential D1 limit issue.`);
       // Optionally truncate or throw error here
    }
  } catch (stringifyError) {
     console.error("[saveChat] Failed to stringify messages for size check:", stringifyError);
  }

  let chatSession;

  // --- Find existing or latest session ---
  if (chat_session_id) {
    chatSession = await db
      .select()
      .from(chat_sessions)
      .where(
        and(
          eq(chat_sessions.id, chat_session_id),
          eq(chat_sessions.user_id, userId),
          eq(chat_sessions.character_id, character.id),
        ),
      )
      .then((rows) => rows[0]); // Simplified

    if (!chatSession) {
      console.error("[saveChat] Chat session not found for provided ID, cannot save.", { chat_session_id, userId, characterId: character.id });
      throw new Error("Chat session not found");
    }
  } else {
    chatSession = await db
      .select()
      .from(chat_sessions)
      .where(
        and(
          eq(chat_sessions.user_id, userId),
          eq(chat_sessions.character_id, character.id),
        ),
      )
      .orderBy(desc(chat_sessions.updated_at))
      .limit(1)
      .then((rows) => rows[0]); // Simplified
  }
  // --- End session finding ---

  const now = new Date();

  if (chatSession) {
    // --- Update Existing Session ---
    try {
      await db
        .update(chat_sessions)
        .set({
          messages: messagesToSave as ChatMessageArray, // Save the processed messages
          interaction_count: sql`${chat_sessions.interaction_count} + 1`,
          last_message_timestamp: now,
          updated_at: now,
        })
        .where(eq(chat_sessions.id, chatSession.id));
    } catch (dbError) {
       console.error("[saveChat] FAILED to update chat session in DB:", dbError);
       console.error("[saveChat] Failed session details:", { sessionId: chatSession.id });
       // Rethrow or handle error appropriately
       throw new Error(`Failed to update chat session: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
    }
    // --- End Update ---
  } else {
    // --- Create New Session ---
    try {
      const inserted = await db
        .insert(chat_sessions)
        .values({
          user_id: userId,
          character_id: character.id,
          messages: messagesToSave as ChatMessageArray, // Save the processed messages
          interaction_count: 1,
          last_message_timestamp: now,
          created_at: now,
          updated_at: now,
        })
        .returning() // Get the inserted row back
        .then((rows) => rows[0]); // Should only be one row

      if (!inserted) {
         console.error("[saveChat] FAILED to insert new chat session or retrieve inserted row.");
         throw new Error("Failed to create new chat session: Insert operation returned no result.");
      }
      chatSession = inserted; // Assign the newly created session
    } catch (dbError) {
       console.error("[saveChat] FAILED to insert new chat session into DB:", dbError);
       // Rethrow or handle error appropriately
       throw new Error(`Failed to insert new chat session: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
    }
    // --- End Create ---
  }

  return chatSession; // Return the final session (either found or created)
}

export async function createChatSession(
  character: typeof characters.$inferInsert,
  messages?: ChatMessageArray,
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
  // --- Add check to prevent direct selection of the multimodal model ---
  if (model_name === "mistralai/mistral-small-3.1-24b-instruct") {
    console.warn("User attempted to directly select the internal multimodal model:", model_name);
    return { error: true, message: "This model cannot be selected directly." };
  }
  // --- End direct selection check ---

  console.log("Original Model:", model_name);
  console.log("Incoming Messages Structure (Last message content sample):", JSON.stringify(messages.slice(-1).map(msg => ({
    ...msg,
    content: typeof msg.content === 'string' && msg.content.length > 100
      ? msg.content.slice(0, 100) + '...'
      : msg.content
  })), null, 2));

  const session = await auth();
  const userId = session?.user?.id; // Get user ID early

  if (!userId) { // Ensure userId is available before proceeding
    return { error: true, message: "Failed to authenticate user" };
  }

  // --- Determine effective model name based on last message content ---
  let effectiveModelName = model_name;
  const lastMessage = messages[messages.length - 1];
  let isMultimodal = false;

  if (lastMessage && typeof lastMessage.content === 'string') {
      try {
          const parsedContent: MultimodalContent[] = JSON.parse(lastMessage.content);

          if (Array.isArray(parsedContent)) {
              const imageParts = parsedContent.filter(
                  part => part.type === 'image_url' && part.image_url?.url?.startsWith('data:')
              );

              if (imageParts.length > 0) {
                  isMultimodal = true;
                  console.log(`Found ${imageParts.length} image(s) in the last message.`);

                  // Create copies of the content to modify for LLM and DB
                  const llmMessageContent: MultimodalContent[] = JSON.parse(JSON.stringify(parsedContent)); // Deep copy for LLM
                  const dbMessageContent: MultimodalContent[] = JSON.parse(JSON.stringify(parsedContent)); // Deep copy for DB storage

                  // Process each image
                  for (let i = 0; i < imageParts.length; i++) {
                      const part = imageParts[i]; // Original part to get data URI
                      const llmPart = llmMessageContent.find(p => p.type === 'image_url' && p.image_url?.url === part.image_url?.url);
                      const dbPart = dbMessageContent.find(p => p.type === 'image_url' && p.image_url?.url === part.image_url?.url);

                      if (part.image_url && part.image_url.url && llmPart?.image_url && dbPart?.image_url) {
                          try {
                              // Use a more flexible regex to capture mime type
                              const match = part.image_url.url.match(/^data:image\/([^;]+);base64,(.*)$/);
                              if (!match) {
                                  console.warn("[continueConversation] Could not parse image data URI (flexible regex):", part.image_url.url.substring(0, 60) + "...");
                                  continue;
                              }
                              // Mime type is now image/ + match[1]
                              const mimeType = `image/${match[1]}`;
                              const base64Data = match[2];
                              const imageBuffer = Buffer.from(base64Data, 'base64');
                              // Use match[1] (subtype like 'jpeg') for file extension if possible
                              const fileExtension = match[1].split('+')[0] || 'png'; // Handle things like svg+xml, default png
                              const imageKey = `${userId}/${uuidv4()}.${fileExtension}`;

                              console.log(`Uploading image to R2: ${imageKey}`);
                              await s3Client.send(new PutObjectCommand({
                                  Bucket: R2_BUCKET_NAME,
                                  Key: imageKey,
                                  Body: imageBuffer,
                                  ContentType: mimeType,
                              }));

                              console.log(`Generating presigned URL for: ${imageKey}`);
                              const presignedUrl = await getSignedUrl(
                                  s3Client,
                                  new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: imageKey }),
                                  { expiresIn: 3600 } // URL expires in 1 hour
                              );
                              console.log(`Successfully generated presigned URL.`);

                              // Update the LLM version with the presigned URL
                              llmPart.image_url.url = presignedUrl;

                              // Update the DB version with the R2 Key
                              dbPart.image_url.url = imageKey;

                          } catch (uploadError) {
                              console.error("Error processing image:", uploadError);
                              // Skip updating this image if upload/signing fails
                          }
                      }
                  }
                  // IMPORTANT: Update the *original* lastMessage content for DB saving
                  lastMessage.content = JSON.stringify(dbMessageContent);
                  console.log("Updated original last message content with R2 keys for DB.");

                  // Prepare messages for the LLM API call using the llmMessageContent
                  // This logic needs to be adjusted where messages are prepared for fetch

              } else {
                   console.log("Parsed string content is array but no image data URI.");
              }
          } else {
               console.log("Parsed string content is not an array.");
          }
      } catch (e) {
          // JSON parsing failed, means it's just a plain string
          console.log("Content is a plain string (JSON parse failed), no image processing needed.");
      }
  } else if (lastMessage) {
       console.log("Last message content is not a string or message is missing.");
  }

  // --- Variable to hold the content specifically for the LLM call ---
  let llmApiMessages = messages; // Default to original messages

  // If multimodal processing happened, create a modified messages array for the LLM
  if (isMultimodal && lastMessage && typeof lastMessage.content === 'string') {
    try {
        // We already processed images and stored the DB version in lastMessage.content.
        // Now, retrieve the LLM version (which we built as llmMessageContent earlier).
        // Need to reconstruct llmMessageContent if not accessible here.
        // Re-parsing and rebuilding llmMessageContent based on dbMessageContent and generating URLs again is inefficient.
        // Let's store llmMessageContent temporarily if isMultimodal is true.

        // REVISED APPROACH: Modify the logic above to store llmMessageContent if needed later.
        // Let's rethink - the code above *already* modified lastMessage.content to the DB version.
        // We need the LLM version *before* preparing the API call.

        // --- Re-Revised Logic within the image processing block ---
        // Inside the `if (imageParts.length > 0)` block, after the loop:
        // 1. Keep `lastMessage.content = JSON.stringify(dbMessageContent);`
        // 2. Create `llmApiMessages` as a deep copy of `messages`.
        // 3. Update the last message content *in `llmApiMessages`* using `JSON.stringify(llmMessageContent)`.
        //    (Need llmMessageContent accessible here). --> Let's pass it.

        // Let's simplify: We only need to modify the *content* for the last message for the API call.

        const dbParsedContentForLLM = JSON.parse(lastMessage.content) as MultimodalContent[];
        const llmMessageContentForLLM: MultimodalContent[] = [];
        const presignedUrlMap = new Map<string, string>(); // Map R2 Key -> Presigned URL

        // Regenerate presigned URLs based on the keys stored in the DB message content
        for (const part of dbParsedContentForLLM) {
            if (part.type === 'image_url' && part.image_url?.url && !part.image_url.url.startsWith('http')) {
                const imageKey = part.image_url.url; // This is the R2 key
                try {
                    const presignedUrl = await getSignedUrl(
                        s3Client,
                        new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: imageKey }),
                        { expiresIn: 3600 }
                    );
                    presignedUrlMap.set(imageKey, presignedUrl);
                    llmMessageContentForLLM.push({ ...part, image_url: { url: presignedUrl } });
                } catch (urlError) {
                    console.error(`Failed to generate presigned URL for key ${imageKey}:`, urlError);
                    llmMessageContentForLLM.push(part); // Keep the key if URL generation fails
                }
            } else {
                llmMessageContentForLLM.push(part);
            }
        }

        // Create a deep copy of messages for the API call
        llmApiMessages = messages.map((msg, index) => {
            if (index === messages.length - 1) {
                // Replace the last message's content with the one containing presigned URLs
                return { ...msg, content: JSON.stringify(llmMessageContentForLLM) };
            }
            return msg; // Keep other messages as they are
        });
        console.log("Prepared separate message list for LLM API with presigned URLs.");

    } catch (e) {
        console.error("Error preparing messages for LLM API:", e);
        // Fallback to original messages if error occurs
        llmApiMessages = messages;
    }
  }

  // --- End Multimodal LLM Preparation ---

  if (isMultimodal) {
      console.log("Forcing model to mistralai/mistral-small-3.1-24b-instruct and bypassing cost checks due to multimodal content.");
      effectiveModelName = "mistralai/mistral-small-3.1-24b-instruct";
  } else {
      console.log("Using originally selected model:", model_name);
      effectiveModelName = model_name;
  }
  console.log("Effective Model Name:", effectiveModelName);
  // --- End model name determination ---

  // Check subscription status
  const subscription = userId ? await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  }) : null;
  const isSubscribed = subscription?.status === "active" || subscription?.status === "trialing";

  // --- Apply top-level paid check ONLY if NOT multimodal ---
  if (!isMultimodal) {
    if (isPaidModel(effectiveModelName)) {
      if (!isSubscribed) {
        return { error: true, message: `You must be a Pro user to use the ${effectiveModelName} model` };
      }
    }
    // Apply standard free tier checks (if any active)
    /**
     * 
     * 
     *     else if (!isSubscribed && !api_key) {
      try {
        const { remainingRequests } = await checkAndIncrementRequestCount(userId);
        console.log(`Free tier user ${userId} request OK. Remaining: ${remainingRequests}`);
      } catch (error) {
        console.error(`Free tier user ${userId} request limit exceeded:`, error);
        if (error instanceof Error) {
          return { error: true, message: error.message };
        }
        return { error: true, message: "Daily request limit potentially exceeded." };
      }
    }
     */

  } else {
      console.log("Skipping top-level paid/subscription/limit check because request is multimodal.");
  }
  // --- End conditional paid check ---

  // Check if the character is public or if it's private and belongs to the user
  const characterCheck = userId ? await db.query.characters.findFirst({
    where: and(
      eq(characters.id, character.id),
      or(
        eq(characters.visibility, "public"),
        and(
          eq(characters.visibility, "private"),
          eq(characters.userId, userId),
        ),
      ),
    ),
  }) : null;

  if (!characterCheck) {
    console.log("Character access check failed:", {
      characterId: character.id,
      userId: userId
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
          eq(chat_sessions.user_id, userId),
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
          eq(chat_sessions.user_id, userId),
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
  const defaultPersona = userId ? await db
    .select()
    .from(personas)
    .where(
      and(
        eq(personas.userId, userId),
        eq(personas.isDefault, true)
      )
    )
    .limit(1)
    .then((rows) => rows[0]) : null;

  // Find the index of the first system message or assume it's the first message
  let systemMessageIndex = messages.findIndex(msg => msg.role === 'system');
  if (systemMessageIndex === -1) {
      console.warn("No system message found, prepending a default one.");
      messages.unshift({ role: "system", content: character.description, id: crypto.randomUUID() });
      systemMessageIndex = 0;
  }


  let systemContent = messages[systemMessageIndex].content;
  // Ensure systemContent is treated as a string for modification
  if (Array.isArray(systemContent)) {
      console.warn("System message content is an array, attempting to extract text.");
      systemContent = (systemContent as MultimodalContent[])
          .filter(part => part.type === 'text')
          .map(part => part.text)
          .join('\n') || character.description; // Fallback to character description
  }


  // Add persona if available
  if (defaultPersona) {
    console.log("Injecting default persona for user:", userId);
    systemContent = `${systemContent}\nUser Persona: ${defaultPersona.background}`;
  }

  if (chatSession && chatSession.summary) {
    console.log("Injecting chat session summary for session:", chatSession.id);
    systemContent = `${systemContent}\nChat Memory: ${chatSession.summary}`;
  }

  // Update the system message with combined content
  messages[systemMessageIndex] = {
    ...messages[systemMessageIndex],
    role: "system", // Ensure role is system
    content: systemContent as string, // System message content should be string
  };

  try {
    let response: Response | undefined;
    if (!isValidModel(effectiveModelName) && !base_url && !isMultimodal) {
        console.log("INVALID EFFECTIVE MODEL NAME:", effectiveModelName);
        return { error: true, message: "Invalid model: " + effectiveModelName };
     }

    if (base_url) {
      console.log("Using custom base URL with effective model:", effectiveModelName);
      // --- Prepare messages for Custom API (using llmApiMessages) ---
      const cleanMessages = llmApiMessages.map(msg => {
         let finalContent: string | MultimodalContent[] = msg.content;
         if (typeof msg.content === 'string') {
             try {
                 const parsed = JSON.parse(msg.content);
                 if (Array.isArray(parsed)) { finalContent = parsed; }
             } catch (e) { /* Keep string content */ }
         }
         return { role: msg.role, content: finalContent };
      });
      // --- End message preparation ---

      const headers: Record<string, string> = {
         "Authorization": `Bearer ${api_key}`,
         "Content-Type": "application/json",
      };
      const requestBody = {
         model: effectiveModelName,
         messages: cleanMessages,
         stream: true,
         temperature: character.temperature ?? 1.0,
         top_p: character.top_p ?? 1.0,
         top_k: character.top_k ?? 0,
      };
      try {
         response = await fetch(base_url, {
             method: "POST",
             headers,
             body: JSON.stringify(requestBody),
         });
      } catch (error) {
         console.error("Failed to make custom API request:", error);
         return { error: true, message: `Failed to make custom API request: ${error instanceof Error ? error.message : String(error)}` };
      }

    } else {
      // --- OpenRouter Path (using llmApiMessages) ---
      console.log("Using OpenRouter with effective model:", effectiveModelName);

      // --- Block Metered Models --- 
      if (isMeteredModel(effectiveModelName) && !isMultimodal) {
        console.warn(`Attempted to use disabled metered model: ${effectiveModelName}`);
        return { error: true, message: "Metered models are currently disabled. Please choose another model." };
      }
      // --- End Block Metered Models ---

      // --- Prepare messages for OpenRouter (using llmApiMessages) --- 
      const openRouterMessages = llmApiMessages.map(msg => {
          let finalContent: string | MultimodalContent[] = msg.content; // Assume string initially
          if (typeof msg.content === 'string') {
              try {
                  const parsed = JSON.parse(msg.content);
                  // If parsing succeeds AND it's an array, use the parsed array
                  if (Array.isArray(parsed)) {
                      finalContent = parsed;
                  }
                  // Otherwise, keep the original string content
              } catch (e) {
                  // Keep original string if JSON parse fails
                  finalContent = msg.content;
              }
          }
          // If msg.content wasn't a string originally (e.g., system message?), handle appropriately
          // This assumes content is either string or needs parsing from stringified array
          return {
              role: msg.role,
              content: finalContent
          };
      });
      // --- End message preparation ---

      try {
          response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                  "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                  "HTTP-Referer": "https://opencharacter.org",
                  "X-Title": "OpenCharacter",
                  "Content-Type": "application/json",
               },
              body: JSON.stringify({
                  model: effectiveModelName,
                  messages: openRouterMessages, // Send the potentially parsed messages
                  temperature: character.temperature ?? 1.0,
                  top_p: character.top_p ?? 1.0,
                  top_k: character.top_k ?? 0,
                  frequency_penalty: character.frequency_penalty ?? 0.0,
                  presence_penalty: character.presence_penalty ?? 0.0,
                  max_tokens: character.max_tokens ?? 1000,
                  provider: { allow_fallbacks: false },
                  stream: true,
              })
          });
      } catch (error) { 
           console.error("Failed to make OpenRouter API request:", error);
           return { error: true, message: `Failed to make OpenRouter API request: ${error instanceof Error ? error.message : String(error)}` };
      }
    }

    if (!response) {
        console.error("API response object is undefined after fetch attempts.");
        return { error: true, message: "Failed to get a valid API response object." };
    }

    // --- Stream processing ---
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed using ${effectiveModelName}:`, response.status, errorText);
      // Throw or return error object
      return { error: true, message: `API request failed with status ${response.status}: ${errorText}` };
     }
    const stream = response.body;
    if (!stream) {
        console.error("No response stream available");
        return { error: true, message: "No response stream available" };
    }

    console.log("Starting stream processing for model:", effectiveModelName);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let responseId = '';
    let accumulatedText = '';

    const textStream = new ReadableStream({
      async start(controller) {
          try {
              while (true) {
                  const { done, value } = await reader.read();
                  if (done) {
                       console.log("Stream finished. Full response text:", accumulatedText);
                       // --- Metering Check on Finish - Skip if multimodal ---
                       // Metered model recording disabled.
                      break;
                  }
                   buffer += decoder.decode(value, { stream: true });
                   const lines = buffer.split('\n');
                   buffer = lines.pop() || '';

                   for (const line of lines) {
                       if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;
                       if (!line.startsWith('data: ')) continue;
                       try {
                           const json = JSON.parse(line.slice(6));
                           if (json.id && !responseId) responseId = json.id;
                           if (!json.choices || json.choices.length === 0) continue;
                           const choice = json.choices[0];
                           const content = choice.delta?.content ?? choice.message?.content;
                           if (content) {
                               controller.enqueue(content);
                               accumulatedText += content;
                           }
                           if (choice.finish_reason) {
                               console.log("Received finish_reason:", choice.finish_reason, "with responseId:", responseId || json.id);
                               // --- Metering Check on Finish Reason - Skip if multimodal ---
                               // Metered model recording disabled.
                           }
                       } catch (e) { console.error('Error parsing SSE JSON:', e); console.log('Problematic line:', line); }
                   }
               }
               controller.close();
           } catch (error) { console.error("Stream processing error:", error); controller.error(error); }
       },
    });

    const [stream1, stream2] = textStream.tee();
    const streamValue = createStreamableValue(stream1);
    return streamValue.value;

  } catch (error) {
    console.error(`Overall error in continueConversation with ${effectiveModelName}:`, error);
    return { error: true, message: `Failed to generate response: ${error instanceof Error ? error.message : String(error)}` };
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

export async function createChatRecommendations(chatMessages: ChatMessageArray) {
  console.log("Creating chat recommendations");
  const session = await auth();

  if (!session?.user) {
    return { error: true, message: "Failed to authenticate user" };
  }
  
  try {
    // If chat messages is longer than 3, grab just the latest 3 messages
    const recentMessages = chatMessages.length > 3 
      ? chatMessages.slice(-3) 
      : chatMessages;
    
    console.log(`Creating chat recommendations based on ${recentMessages.length} recent messages`);
    
    // Format the conversation for the model
    const conversationContent = recentMessages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    // Using mistral/ministral-8b model with structured output
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://opencharacter.org",
        "X-Title": "OpenCharacter",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-saba",
        messages: [
          {
            role: "user", 
            content: `Given this conversation, provide 3 different appropriate response options that the user might want to use:

${conversationContent}

Generate 3 distinct response options that vary in tone and content. Each should have a brief title and the actual message text. Try to be creative, fun and silly! Don't be afraid to be weird and creative! You are recommending for the USER and the BOT IS THE ASSISTANT`
          }
        ],
        temperature: 1.0,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "message_recommendations",
            strict: true,
            schema: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: {
                        type: "string",
                        description: "A short title (1-4 words) describing the message, e.g., 'Flirt back', 'Tell a joke', 'Reject politely'"
                      },
                      message: {
                        type: "string",
                        description: "The actual message text to send (1-3 short sentences)"
                      }
                    },
                    required: ["title", "message"],
                    additionalProperties: false
                  },
                }
              },
              required: ["recommendations"],
              additionalProperties: false
            }
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Failed to generate recommendations:", {
        status: response.status,
        data: errorData
      });
      throw new Error(`Failed to generate recommendations: ${errorData}`);
    }

    const result = await response.json() as {
      choices: [{
        message: {
          content: string;
        }
      }]
    };
    const recommendations = JSON.parse(result.choices[0].message.content);
    
    return { 
      error: false, 
      recommendations: recommendations.recommendations,
      message: "Successfully generated chat recommendations" 
    };
  } catch (error) {
    console.error("Error in createChatRecommendations:", error);
    return { error: true, message: "Failed to create chat recommendations" };
  }
}

// --- New Server Action to Get Presigned URL ---
export async function getPresignedUrlForImageKey(imageKey: string): Promise<{ url?: string; error?: string }> {
  // Basic validation: Check if the key looks plausible (e.g., contains a slash)
  // You might want more robust validation depending on your key structure.
  if (!imageKey || !imageKey.includes('/')) {
    console.error("Invalid image key format provided:", imageKey);
    return { error: "Invalid image key format." };
  }

  // Optional: Add authentication here if you want to restrict URL generation
  // const session = await auth();
  // if (!session?.user?.id) {
  //   return { error: "User not authenticated." };
  // }
  // // Optional: Check if the key prefix matches the authenticated user ID
  // if (!imageKey.startsWith(`${session.user.id}/`)) {
  //    console.warn(`User ${session.user.id} attempted to access key ${imageKey}`);
  //    return { error: "Permission denied." };
  // }

  try {
    console.log(`Generating presigned URL for key: ${imageKey}`);
    const presignedUrl = await getSignedUrl(
      s3Client, // Reuse the existing S3 client configured for R2
      new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: imageKey }),
      { expiresIn: 3600 } // URL expires in 1 hour
    );
    console.log(`Successfully generated presigned URL for key: ${imageKey}`);
    return { url: presignedUrl };
  } catch (error) {
    console.error(`Failed to generate presigned URL for key ${imageKey}:`, error);
    // Check for specific S3 errors like NoSuchKey if needed
    if (error instanceof Error && (error.name === 'NoSuchKey' || (error as any).$metadata?.httpStatusCode === 404)) {
         return { error: "Image not found." };
    }
    return { error: "Failed to retrieve image URL." };
  }
}
// --- End New Server Action ---