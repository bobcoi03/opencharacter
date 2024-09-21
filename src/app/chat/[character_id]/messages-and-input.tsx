'use client';

import { type CoreMessage } from 'ai';
import { useState, useEffect, useRef } from 'react';
import { readStreamableValue } from 'ai/rsc';
import { continueConversation } from '@/app/actions/chat';
import { User } from 'next-auth';
import Image from 'next/image';
import { Cpu, Check, RotateCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { characters } from '@/server/db/schema';
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import { getModelArray } from '@/lib/llm_models';
import Link from 'next/link';

interface MessageContentProps {
  message: CoreMessage;
  isUser: boolean;
  userName?: string;
  characterName: string;
  characterAvatarUrl?: string | undefined | null;
  isError?: boolean;
  chatSession?: string | null
  onRetry?: () => void;
}

const MessageContent: React.FC<MessageContentProps> = ({ 
  message, 
  isUser, 
  userName, 
  characterName, 
  characterAvatarUrl, 
  isError, 
  onRetry 
}) => {
  const markdownComponents: Partial<Components> = {
    p: ({ children }) => (
      <p className="whitespace-pre-wrap leading-relaxed break-words">
        {children}
      </p>
    )
  };

  return (
    <div className={`flex items-start mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
          <Image
            src={characterAvatarUrl || '/default-avatar.jpg'}
            alt={characterName}
            width={46}
            height={46}
            className="rounded-full w-full h-full object-cover"
          />
        </div>
      )}
      <div className={`flex ${isUser ? 'items-end' : 'items-start'} max-w-[calc(100%-3rem)]`}>
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}>
          <span className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {isUser ? userName || 'You' : characterName}
          </span>
          <div
            className={`p-3 rounded-2xl ${
              isUser
                ? isError
                  ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                  : 'bg-gray-300 dark:bg-neutral-800 text-black dark:text-white'
                : 'bg-gray-200 dark:bg-neutral-700 text-black dark:text-white'
            } max-w-full`}
          >
            <div className="font-display font-light swiper-no-swiping">
              <ReactMarkdown 
                className="prose dark:prose-invert text-black dark:text-white max-w-full overflow-hidden" 
                components={markdownComponents}
              >
                {message.content as string}
              </ReactMarkdown>
              <div className="flex flex-row gap-1 items-center"></div>
            </div>
          </div>
        </div>
      </div>
      {isUser && !isError && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm ml-3 flex-shrink-0">
          {userName?.[0] || 'U'}
        </div>
      )}
    </div>
  );
};

const TypingIndicator: React.FC<{ characterAvatarUrl?: string | undefined | null; characterName: string }> = ({ characterAvatarUrl, characterName }) => {
  return (
    <div className="flex items-start mb-4 justify-start">
      <Image
        src={characterAvatarUrl || '/default-avatar.jpg'}
        alt={characterName}
        width={24}
        height={24}
        className="rounded-full mr-3"
      />
      <div className="flex flex-col items-start">
        <span className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {characterName}
        </span>
        <div className="p-3 rounded-2xl bg-gray-200 dark:bg-neutral-700">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
            <div className="w-2 h-2 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MessageAndInput({ user, character, made_by_name, messages, chat_session }: { user: User | undefined, character: typeof characters.$inferSelect, made_by_name: string, messages: CoreMessage[], chat_session?: string | undefined }) {
    const replacePlaceholders = (content: string | undefined) => {
      if (content === undefined) {
        return content
      }
      return content
        .replace(/{{user}}/g, user?.name ?? "Guest")
        .replace(/{{char}}/g, character.name || "");
    };

    const processedMessages = messages.map(message => ({
      ...message,
      content: replacePlaceholders(message.content as string)
    })) as CoreMessage[];
    const [messagesState, setMessagesState] = useState<CoreMessage[]>(processedMessages);
    const [input, setInput] = useState('');
    const [selectedModel, setSelectedModel] = useState("gryphe/mythomax-l2-13b");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<boolean>(false);
  
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
      const savedModel = localStorage.getItem('selectedModel');
      if (savedModel) {
        setSelectedModel(savedModel);
      }
      scrollToBottom();
    }, [messagesState]);
  
    const handleSubmit = async (input: string, error: boolean = false) => {
      const newMessages: CoreMessage[] = error
        ? [...messagesState]
        : [
            ...messagesState,
            { content: input, role: 'user' },
          ];
      setMessagesState(newMessages);
      setInput('');
      setIsLoading(true);
      setError(false);
  
      try {
        const result = await continueConversation(newMessages, selectedModel, character, chat_session);
        for await (const content of readStreamableValue(result)) {
          setMessagesState([
            ...newMessages,
            {
              role: 'assistant',
              content: replacePlaceholders(content) as string,
            },
          ]);
        }
      } catch (err) {
        console.error('Error in conversation:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    const handleModelSelect = (modelId: string) => {
      setSelectedModel(modelId);
      localStorage.setItem('selectedModel', modelId);
    };

    const handleRetry = () => {
      if (messagesState.length > 0) {
        const lastUserMessage = messagesState[messagesState.length - 1];
        if (lastUserMessage.role === 'user') {
          handleSubmit(lastUserMessage.content as string, true);
        }
      }
    };

    return (
        <div className="flex flex-col h-full relative">
            <style jsx global>{`
            /* Webkit browsers (Chrome, Safari) */
            ::-webkit-scrollbar {
              width: 10px;
            }
            ::-webkit-scrollbar-track {
              background: rgba(0, 0, 0, 0.1);
              border-radius: 5px;
            }
            ::-webkit-scrollbar-thumb {
              background: rgba(0, 0, 0, 0.2);
              border-radius: 5px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: rgba(0, 0, 0, 0.3);
            }

            /* Firefox */
            * {
              scrollbar-width: thin;
              scrollbar-color: rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.1);
            }

            /* Dark mode adjustments */
            @media (prefers-color-scheme: dark) {
              ::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
              }
              ::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
              }
              ::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.3);
              }
              * {
                scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.1);
              }
            }
          `}</style>
          <div className="flex-grow w-full flex justify-center overflow-y-auto">
            <div id="messages-container" className="w-full max-w-2xl">
              {/* Character Information Header */}
              <div className='mx-auto pt-12 pb-6 flex flex-col gap-2 text-center items-center overflow-hidden'>
                <div className="w-24 h-24 rounded-full overflow-hidden mr-3">
                  <Link href={`/character/${character.id}/profile`} >
                    <Image src={character.avatar_image_url ?? "/default-avatar.jpg"} alt={`${character.name}'s avatar`} width={64} height={64} className="object-cover w-full h-full" />                  
                  </Link>
                </div>
                <p className='font-light text-md text-black dark:text-white'>{character.name}</p>
                <ReactMarkdown className='font-light text-md text-slate-600 dark:text-slate-200'>{character.tagline}</ReactMarkdown>
                <p className='font-light text-xs text-slate-600 dark:text-slate-200'>by {made_by_name}</p>
              </div>

              <div className="p-4 pb-32">
                {messagesState.length > 1 && 
                    <>
                  {messagesState.slice(1).map((m, i) => (
                    <MessageContent
                      key={i}
                      message={m}
                      isUser={m.role === 'user'}
                      userName={user?.name ?? "guest"}
                      characterName={character.name}
                      characterAvatarUrl={character.avatar_image_url}
                      isError={error && i === messagesState.length - 2}
                      onRetry={handleRetry}
                    />
                  ))}
                    </>
                }
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
    
          {/* Message Input */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
            <div className="max-w-xl mx-auto w-full">
              {error && (
                <div className="mb-2 p-2 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200 text-sm pointer-events-auto flex justify-between items-center">
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Failed to send message, please try again
                  </p>
                  <RotateCcw
                    className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-600 ml-2"
                    onClick={handleRetry}
                  />
                </div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(input); }} className="pointer-events-auto flex items-center space-x-2">
                <div className="relative flex-grow">
                  <div className="absolute inset-0 bg-gray-300 dark:bg-neutral-700 bg-opacity-20 dark:bg-opacity-20 backdrop-blur-md rounded-full border border-gray-200 dark:border-neutral-700"></div>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Message ${character.name}...`}
                    className="w-full py-4 pl-6 pr-12 bg-transparent relative z-10 outline-none text-black dark:text-white text-lg rounded-3xl"
                  />
                  <button 
                    type="submit" 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black dark:bg-white rounded-full p-2 z-20 transition-opacity opacity-70 hover:opacity-100 focus:opacity-100 hover:cursor-pointer"
                    disabled={!input.trim() || isLoading}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white dark:text-black" fill="none" stroke="currentColor">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="bg-gray-200 dark:bg-neutral-600 rounded-full p-2 z-20 transition-opacity opacity-70 hover:opacity-100 focus:opacity-100 hover:cursor-pointer"
                    >
                      <Cpu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {getModelArray().map((model) => (
                      <DropdownMenuItem
                        key={model.id}
                        onClick={() => handleModelSelect(model.id)}
                        className="flex items-center justify-between"
                      >
                        {model.name}
                        {selectedModel === model.id && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </form>
              <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400 pointer-events-auto">
                {!user && "Sign in to save messages"}
              </p>
            </div>
          </div>
        </div>
    );
}