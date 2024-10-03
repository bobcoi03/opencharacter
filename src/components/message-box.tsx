"use client"

import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Cpu, Play, LoaderCircle, Check, RotateCcw } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import SignInButton from "./signin-button";
import { getModelArray, Model } from "@/lib/llm_models"
import { CoreMessage } from "ai";
import { ChatMessage, rooms } from "@/server/db/schema";
import { readStreamableValue } from "ai/rsc";
import { characters } from "@/server/db/schema";

interface MessageBoxProps {
  action: (messages: CoreMessage[], room_id: string, model_id: string, character_id: string) => Promise<any>;
  room: typeof rooms.$inferSelect,
  initialMessages: ChatMessage[],
  charactersArray: typeof characters.$inferSelect[],
}

export default function MessageBox({ action, room, initialMessages, charactersArray }: MessageBoxProps) {
    const [playing, setPlaying] = useState<boolean>(false);
    const [selectedModel, setSelectedModel] = useState<Model>({
        id: "gryphe/mythomax-l2-13b",
        name: "gryphe/mythomax-l2-13b"
    });
    const [message, setMessage] = useState<string>("");
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const models = getModelArray();
    const [error, setError] = useState<boolean>(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [currentCharacter, setCurrentCharacter] = useState<typeof characters.$inferSelect | null>(null);
    
    useEffect(() => {
        adjustTextareaHeight();
    }, [message]);

    useEffect(() => {
        if (charactersArray.length > 0 && !currentCharacter) {
            const randomCharacter = charactersArray[Math.floor(Math.random() * charactersArray.length)];
            setCurrentCharacter(randomCharacter);
        }
    }, [charactersArray, currentCharacter]);

    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = '50px';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 450)}px`;
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            if (e.shiftKey || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                // Shift+Enter on desktop or Enter on mobile: add new line
                setTimeout(adjustTextareaHeight, 0);
                return;
            } else {
                // Enter alone on desktop: send message
                e.preventDefault();
                handleSendMessage();
            }
        } else if (e.key === 'Escape') {
            // Esc key pressed: return height to default
            const textarea = textareaRef.current;
            if (textarea) {
                textarea.style.height = '50px';
            }
        }
    };

    const handleSendMessage = async () => {
        setError(false)
        if (message.trim() && currentCharacter) {
            const newUserMessage: CoreMessage = { role: "user", content: message };
            const newMessages = [...messages, newUserMessage];
            setMessages(newMessages as ChatMessage[]);
            setMessage("");
            if (textareaRef.current) {
                textareaRef.current.style.height = '50px';
            }

            try {
                const result = await action(newMessages as CoreMessage[], room.id, selectedModel.id, currentCharacter.id);
                console.log("result: " + JSON.stringify(result));
                if ("error" in result) {
                    setError(true);
                    return;
                }
                for await (const content of readStreamableValue(result)) {
                    console.log("content: " + content);
                    setMessages(prevMessages => [
                        ...prevMessages,
                        {
                            role: "assistant",
                            content: content as string,
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
            }
        }
    };

    const getCharacterName = (characterId: string | undefined) => {
        if (!characterId) return "Unknown";
        const character = charactersArray.find(c => c.id === characterId);
        return character ? character.name : "Unknown";
    };

    return (
        <div className="w-full border border-red-300 min-h-screen">
        <div className="space-y-4 mb-20">
            {messages.map((message, index) => (
                <div key={index} className="p-4 shadow rounded-lg">
                    <p className="text-left">
                        <strong>{message.character_id ? getCharacterName(message.character_id) : (message.role === "user" ? "You" : "Assistant")}</strong> {message.content as string}
                    </p>
                </div>
            ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 py-4 pointer-events-none w-full max-w-full ">
            <div className="max-w-2xl mx-auto w-full">
                {error && 
                <div className="mb-2 p-2 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200 text-sm pointer-events-auto flex justify-between items-center">
                    <p className="flex items-center">
                    <svg
                        className="w-4 h-4 mr-2 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                        />
                    </svg>
                    Failed to send message, please try again
                    </p>
                    <RotateCcw className="w-4 h-4 hover:cursor-pointer" onClick={() => handleSendMessage()} />
                </div>
                }

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                    }}
                    className="pointer-events-auto flex items-center space-x-2 max-w-full px-2"
                >
                    <div className="relative flex-grow">
                    <div className="absolute inset-0 bg-gray-300 dark:bg-neutral-700 bg-opacity-20 dark:bg-opacity-20 backdrop-blur-md rounded-xl dark:border-neutral-700"></div>
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-20">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                            type="button"
                            className="bg-gray-200 dark:bg-neutral-600 rounded-full p-2 transition-opacity opacity-70 hover:opacity-100 focus:opacity-100 hover:cursor-pointer"
                            >
                            <Cpu className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="max-h-96 overflow-y-auto">
                            {models.map((model) => (
                                <DropdownMenuItem
                                    key={model.id}
                                    onSelect={() => setSelectedModel(model)}
                                    className="w-full flex justify-between"
                                >
                                    {model.name}
                                    {selectedModel.id === model.id && (
                                        <Check className="w-4 h-4 text-green-500" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <textarea
                            ref={textareaRef}
                            placeholder={`Hey (using ${selectedModel.name})`}
                            className="w-full py-4 pl-14 pr-12 bg-transparent relative z-10 outline-none text-black dark:text-white text-lg rounded-xl resize-none overflow-hidden"
                            style={{
                                minHeight: "50px",
                                maxHeight: `450px`,
                                overflowY: "auto",
                                height: '50px',
                                lineHeight: '24px',
                            }}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                    />
                    <button
                        type="submit"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black dark:bg-white rounded-full p-2 z-20 transition-opacity opacity-70 hover:opacity-100 focus:opacity-100 hover:cursor-pointer"
                        disabled={!message.trim()}
                    >
                        <svg
                        viewBox="0 0 24 24"
                        className="w-5 h-5 text-white dark:text-black"
                        fill="none"
                        stroke="currentColor"
                        >
                        <path
                            d="M5 12h14M12 5l7 7-7 7"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        </svg>
                    </button>
                    </div>

                    <div 
                        className="bg-blue-400 rounded-lg justify-center flex items-center hover:cursor-pointer"
                        style={{ height: "50px", width: "50px" }}
                        onClick={() => setPlaying(!playing)}
                    >
                        {!playing ?
                            <Play className="text-black"/>                        
                            :
                            <LoaderCircle className={`text-black ${playing ? 'animate-spin' : ''}`} />
                        }
                    </div>
                </form>

                <Dialog
                    open={false}
                    onOpenChange={() => false}
                >
                    <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sign in to continue</DialogTitle>
                    </DialogHeader>
                    <p>Please sign in to send messages and save your conversation.</p>
                    <SignInButton />
                    </DialogContent>
                </Dialog>
                </div>
            </div>
        </div>
    )
}