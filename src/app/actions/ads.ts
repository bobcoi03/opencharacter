"use server";

import { characters, chat_sessions, ChatMessageArray } from "@/server/db/schema";
import { AsyncAdcortexChatClient, SessionInfoSchema, Role } from 'adcortex-js';

export async function getAds(
    character: typeof characters.$inferSelect, 
    chat_session: typeof chat_sessions.$inferSelect, 
    messages: ChatMessageArray
) {
    console.log(`[getAds] Starting with session: ${chat_session.id}, character: ${character.name}`);
    console.log(`[getAds] Messages length: ${messages.length}`);
    
    // Validate API key exists
    if (!process.env.ADCORTEX_API_KEY) {
        console.error("[getAds] Missing ADCORTEX_API_KEY environment variable");
        return null;
    }
    
    try {
        // Initialize session info
        const sessionInfo = SessionInfoSchema.parse({
            session_id: chat_session.id,
            character_name: character.name,
            character_metadata: character.description || "AI assistant",
            user_info: {
                user_id: "anon", // Replace with actual user ID if available
                age: 25, // Default age
                gender: "other", // Default gender
                location: "US", // Default location
                language: "en", // Default language
                interests: ["all"] // Default interests
            },
            platform: {
                name: "OpenCharacter",
                varient: "1.0.0"
            }
        });
        console.log(`[getAds] Session info initialized:`, sessionInfo);

        // Create the async chat client with API key from environment
        const chatClient = new AsyncAdcortexChatClient(
            sessionInfo,
            undefined, // Use default template
            process.env.ADCORTEX_API_KEY, // Use API key from environment
            5, // 5-second timeout
            false, // Enable logging for debugging
            50 // Queue size
        );
        console.log(`[getAds] Async chat client created`);

        // Process the messages
        for (const message of messages) {
            // Map to the appropriate role value
            const messageRole = message.role === 'user' ? Role.user : Role.ai;
            const messageContent = typeof message.content === 'string' 
                ? message.content 
                : JSON.stringify(message.content);
            
            console.log(`[getAds] Processing message - Role: ${messageRole}, Content length: ${messageContent.length}`);
            await chatClient.__call__(messageRole, messageContent);
        }
        console.log(`[getAds] All messages processed`);

        // Get the latest ad
        const latestAd = chatClient.get_latest_ad();
        console.log(`[getAds] Latest ad:`, latestAd);
        
        if (latestAd) {
            // Create context from the latest ad - AsyncAdcortexChatClient.create_context takes no arguments
            const context = chatClient.create_context();
            console.log(`[getAds] Created context:`, context);
            return { ad: latestAd, context };
        }

        console.log(`[getAds] No ad returned`);
        return null;
    } catch (error) {
        console.error("[getAds] Error getting ads:", error);
        if (error instanceof Error) {
            console.error("[getAds] Error details:", error.message, error.stack);
        }
        return null;
    }
}