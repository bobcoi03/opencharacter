'use server';

import { createStreamableValue } from 'ai/rsc';
import { CoreMessage, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export async function continueConversation(messages: CoreMessage[], model_name: string) {
  const model = groq(model_name);
  console.log("selected model: ", model);
  const result = await streamText({
    model: model,
    messages,
  });

  const stream = createStreamableValue(result.textStream);
  return stream.value;
}