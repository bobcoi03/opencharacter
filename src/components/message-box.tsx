"use client"

import React, { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Cpu, Send, LoaderCircle, Check, RotateCcw } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";
import { getModelArray, Model } from "@/lib/llm_models"
import { CoreMessage } from "ai";
import { ChatMessage, rooms } from "@/server/db/schema";
import { readStreamableValue } from "ai/rsc";
import { characters } from "@/server/db/schema";
import Image from 'next/image';

interface BotGroupChatProps {
  action: (messages: CoreMessage[], room_id: string, model_id: string, character_id: string) => Promise<any>;
  room: typeof rooms.$inferSelect,
  initialMessages: ChatMessage[],
  charactersArray: typeof characters.$inferSelect[],
}

export default function BotGroupChat({ action, room, initialMessages, charactersArray }: BotGroupChatProps) {
    const [selectedModel, setSelectedModel] = useState<Model>({
        id: "gryphe/mythomax-l2-13b",
        name: "gryphe/mythomax-l2-13b"
    });
    const [message, setMessage] = useState<string>("");
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const models = getModelArray();
    const [error, setError] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [currentCharacter, setCurrentCharacter] = useState<typeof characters.$inferSelect | null>(null);

    useEffect(() => {
        if (charactersArray.length > 0 && !currentCharacter) {
            const randomCharacter = charactersArray[Math.floor(Math.random() * charactersArray.length)];
            setCurrentCharacter(randomCharacter);
        }
    }, [charactersArray, currentCharacter]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSendMessage = async () => {
        setError(false);
        setIsLoading(true);
        if (message.trim() && currentCharacter) {
            const newUserMessage: CoreMessage = { role: "user", content: message };
            const newMessages = [...messages, newUserMessage];
            setMessages(newMessages as ChatMessage[]);
            setMessage("");

            try {
                const result = await action(newMessages as CoreMessage[], room.id, selectedModel.id, currentCharacter.id);
                if ("error" in result) {
                    setError(true);
                    return;
                }
                
                let accumulatedContent = "";
                for await (const content of readStreamableValue(result)) {
                    accumulatedContent += content as string;
                    setMessages([
                        ...newMessages as ChatMessage[],
                        {
                            role: "assistant",
                            content: accumulatedContent,
                            character_id: currentCharacter.id
                        },
                    ]);
                }
                
                // Select a new random character for the next message
                const newRandomCharacter = charactersArray[Math.floor(Math.random() * charactersArray.length)];
                setCurrentCharacter(newRandomCharacter);
            } catch (err) {
                console.error("Error sending message:", err);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const getCharacterInfo = (characterId: string | undefined) => {
        if (!characterId) return { name: "Unknown", avatar: null };
        const character = charactersArray.find(c => c.id === characterId);
        return character ? { name: character.name, avatar: character.avatar_image_url } : { name: "Unknown", avatar: null };
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
            <div className="flex-1 p-4 space-y-4">
                {messages.map((message, index) => {
                    const { name, avatar } = getCharacterInfo(message.character_id);
                    return (
                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-start space-x-2 max-w-3/4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                {avatar && (
                                    <Image
                                        src={avatar}
                                        alt={`${name}'s avatar`}
                                        width={40}
                                        height={40}
                                        className="rounded-full w-12 h-12"
                                    />
                                )}
                                <div className={`p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white'}`}>
                                    <p className="font-bold">{message.role === "user" ? "You" : name}</p>
                                    <p>{message.content as string}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {error && 
                <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> Failed to send message. Please try again.</span>
                </div>
            }

            <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                <div className="flex items-center space-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                <Cpu className="w-5 h-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {models.map((model) => (
                                <DropdownMenuItem
                                    key={model.id}
                                    onSelect={() => setSelectedModel(model)}
                                >
                                    <span>{model.name}</span>
                                    {selectedModel.id === model.id && (
                                        <Check className="w-4 h-4 ml-2" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <textarea
                        ref={textareaRef}
                        placeholder={`Type a message (using ${selectedModel.name})...`}
                        className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md resize-none"
                        rows={1}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || isLoading}
                        className="p-2 rounded-full bg-blue-500 text-white disabled:opacity-50"
                    >
                        {isLoading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
}