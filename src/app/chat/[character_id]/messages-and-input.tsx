'use client';

import { type CoreMessage } from 'ai';
import { useState, useEffect } from 'react';
import { readStreamableValue } from 'ai/rsc';
import { continueConversation } from '@/app/actions/chat';
import { User } from 'next-auth';
import Image from 'next/image';

interface MessageContentProps {
  message: CoreMessage;
  isUser: boolean;
  userName?: string;
}

const MessageContent: React.FC<MessageContentProps> = ({ message, isUser, userName }) => {
  return (
    <div className={`flex items-start mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <Image
          src="/andy-demo.webp"
          alt="Dry Texter"
          width={40}
          height={40}
          className="rounded-full mr-3"
        />
      )}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <span className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {isUser ? userName || 'You' : 'Dry Texter'}
        </span>
        <div
          className={`p-3 rounded-2xl max-w-2xl ${
            isUser
              ? 'bg-gray-300 dark:bg-neutral-800 text-black dark:text-white'
              : 'bg-gray-200 dark:bg-neutral-700 text-black dark:text-white'
          }`}
        >
          {message.content as string}
        </div>
      </div>
      {isUser && (
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm ml-3">
          {userName?.[0] || 'U'}
        </div>
      )}
    </div>
  );
};

export default function MessageAndInput({ user, character_id }: { user: User | undefined, character_id: string }) {
    const [messages, setMessages] = useState<CoreMessage[]>([]);
    const [input, setInput] = useState('');
  
    useEffect(() => {
      // Scroll to bottom when messages change
      window.scrollTo(0, document.body.scrollHeight);
    }, [messages]);
  
    const handleSubmit = async (input: string) => {
      const newMessages: CoreMessage[] = [
        ...messages,
        { content: input, role: 'user' },
      ];
      setMessages(newMessages);
      setInput('');
      const result = await continueConversation(newMessages);
      for await (const content of readStreamableValue(result)) {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: content as string,
          },
        ]);
      }
    };

    return (
        <div className="flex flex-col h-full relative">
          <div id="messages-container" className="flex-grow overflow-y-auto p-4 pb-32">
            {messages.map((m, i) => (
              <MessageContent
                key={i}
                message={m}
                isUser={m.role === 'user'}
                userName={user?.name ?? "guest"}
              />
            ))}
          </div>
    
          {/* Message Input */}
          <TransparentInputArea onSubmit={handleSubmit} />

        </div>
    );
}

const TransparentInputArea: React.FC<{ onSubmit: (input: string) => void }> = ({ onSubmit }) => {
    const [input, setInput] = useState('');
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (input.trim()) {
        onSubmit(input);
        setInput('');
      }
    };
  
    return (
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
        <div className="max-w-3xl mx-auto w-full">
          <form onSubmit={handleSubmit} className="pointer-events-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-white dark:bg-neutral-800 bg-opacity-20 dark:bg-opacity-20 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-neutral-700"></div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Dry Texter..."
                className="w-full py-4 pl-6 pr-12 bg-transparent relative z-10 outline-none text-black dark:text-white text-lg rounded-3xl"
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black dark:bg-white rounded-full p-2 z-20 transition-opacity opacity-70 hover:opacity-100 focus:opacity-100 hover:cursor-pointer"
                disabled={!input.trim()}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white dark:text-black" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </form>
          <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400 pointer-events-auto">
            Remember: Everything Characters say is made up!
          </p>
        </div>
      </div>
    );
};
