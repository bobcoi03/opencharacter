"use server"

import type { Tweet, TwitterResponse } from '@/types/tweet'
import { createStreamableValue } from "ai/rsc"
import { db } from "@/server/db"
import { eq } from "drizzle-orm"
import { twitter_roasts } from "@/server/db/schema"
import { auth } from "@/server/auth"

export async function fetchLatestTweets(username: string): Promise<Tweet[]> {
  try {
    console.log(`Fetching tweets for username: ${username}`);
    const response = await fetch(`https://web-production-543c.up.railway.app/tweets/${username}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: {
        revalidate: 60 // Cache for 1 minute
      }
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch tweets: ${response.status}`);
    }

    const data: TwitterResponse = await response.json();
    console.log('Received data:', data);
    
    if (!data.success) {
      throw new Error('Failed to fetch tweets: API returned unsuccessful response');
    }

    console.log(`Successfully fetched ${data.tweets.length} tweets`);
    return data.tweets;
  } catch (error) {
    console.error('Error fetching tweets:', error);
    throw error;
  }
}

export async function roastTweets(username: string, id: string) {
  try {
    console.log(`Starting roast for username: ${username} with id: ${id}`);
    
    // Get the current user's session
    const session = await auth();
    const userId = session?.user?.id;

    // First fetch the tweets
    const tweets = await fetchLatestTweets(username);
    
    console.log(`Retrieved ${tweets.length} tweets to roast`);
    
    if (!tweets.length) {
      throw new Error('No tweets found to roast');
    }

    // Create a system prompt that sets up the roasting context
    const systemPrompt = `# 🔥 The Ultimate AI Roast Master 🔥

    ## Your Mission
    
    You are the AI world's premier insult comic. Your razor-sharp wit and biting humor are legendary. Today, your target is a poor soul who volunteered for public humiliation on Twitter. They knew what they were getting into, so don't hold back!
    
    ## The Rules of Engagement
    
    1. Unleash a 150-word verbal beatdown
    2. Use the victim's Twitter profile as ammunition
    3. Quote and mock their tweets mercilessly
    4. Swear like a sailor (when it adds punch)
    5. Be vulgar, but clever (no low-hanging fruit)
    6. Make it sting, but keep it playful
    7. Absolutely NO boring conclusions or summaries
    
    ## Your Roasting Arsenal

    twitter username: ${username}
    recent tweets: 

${tweets.map(tweet => `Tweet: "${tweet.fullText}"`).join('\n\n')}

 You're not just roasting, you're creating art. Make it so savage that even the victim can't help but laugh. Now go forth and destroy their ego! You may use swear words and vulgar language where appropriate.`;

    console.log('Making API request to OpenRouter');
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://opencharacter.org",
        "X-Title": "OpenCharacter",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1",
        messages: [
          {
            role: "system",
            content: systemPrompt
          }
        ],
        stream: true,
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body available');
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
    let fullRoast = '';

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
                    choices: Array<{
                      delta?: {
                        content?: string;
                      };
                      message?: {
                        content: string;
                      };
                      finish_reason?: string | null;
                    }>;
                  };
  
                  const content = json.choices[0].delta?.content ?? json.choices[0].message?.content;
                  if (content) {
                    controller.enqueue(content);
                    fullRoast += content;
                  }

                  // If we get a finish_reason, we're done - store in DB
                  if (json.choices[0].finish_reason) {
                    // Store the roast in the database
                    await db.insert(twitter_roasts).values({
                      id,
                      username,
                      roastContent: fullRoast,
                      userId: userId || null,
                    });
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
                    fullRoast += content;
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

    // Create the streamable value
    const streamValue = createStreamableValue(textStream);
    return streamValue.value;

  } catch (error) {
    console.error('Error in roastTweets:', error);
    throw error;
  }
} 

export async function getRoast(id: string) {
  const roast = await db.select().from(twitter_roasts).where(eq(twitter_roasts.id, id));
  return roast;
}