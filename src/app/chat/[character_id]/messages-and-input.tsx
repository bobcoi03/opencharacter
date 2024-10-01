"use client";

import { type CoreMessage } from "ai";
import { useState, useEffect, useRef } from "react";
import { readStreamableValue } from "ai/rsc";
import { continueConversation } from "@/app/actions/chat";
import { saveChat, createChatSession } from "@/app/actions/index";
import { User } from "next-auth";
import Image from "next/image";
import {
  Cpu,
  Check,
  RotateCcw,
  Edit,
  Trash2,
  MoreHorizontal,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { characters, personas } from "@/server/db/schema";
import ReactMarkdown from "react-markdown";
import { Components } from "react-markdown";
import { getModelArray } from "@/lib/llm_models";
import SignInButton from "@/components/signin-button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

const MAX_TEXTAREA_HEIGHT = 450; // maximum height in pixels

function Renegerate() {
  return (
    <div className="flex items-center justify-center space-x-2 mt-2">
      <button className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 disabled:opacity-50">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm text-gray-500 dark:text-gray-400">1</span>
      <button className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 disabled:opacity-50">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

interface MessageContentProps {
  message: CoreMessage;
  index: number;
  isUser: boolean;
  userName?: string;
  characterName: string;
  characterAvatarUrl?: string | undefined | null;
  isError?: boolean;
  chatSession?: string | null;
  onRetry?: () => void;
  onEdit: (index: number, editedContent: string) => void;
  onDelete: (index: number) => void;
  onGoBackRegenerate?: (toIndex: number) => void;
  regenerations: number;
  currentRegenerationIndex: number;

}

const UserAvatar = ({ userName }: { userName: string }) => {
  const firstLetter = (userName || "U")[0].toUpperCase();
  const gradientClass = `bg-gradient-to-br from-black via-black to-purple-300`;

  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${gradientClass}`}
    >
      {firstLetter}
    </div>
  );
};

const MessageContent: React.FC<MessageContentProps> = ({
  message,
  index,
  isUser,
  userName,
  characterName,
  characterAvatarUrl,
  isError,
  onRetry,
  onEdit,
  onDelete,
  onGoBackRegenerate,
  regenerations,
  currentRegenerationIndex
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleted, setDeleted] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content as string);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const markdownComponents: Partial<Components> = {
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    em: ({ children }) => <em className="text-neutral-300">{children}</em>,
    code: ({ children }) => (
      <code className="bg-neutral-800 px-1 py-0.5 rounded text-sm text-neutral-200">
        {children}
      </code>
    ),
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      adjustTextareaHeight();
    }
  }, [isEditing, editedContent]);

  useEffect(() => {
    setEditedContent(message.content as string);
  }, [message.content]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(message.content as string);
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleSave = () => {
    onEdit(index, editedContent);
    setIsEditing(false);
  };

  const confirmDelete = () => {
    onDelete(index);
    setIsDeleteDialogOpen(false);
  };

  const handleCancel = () => {
    setEditedContent(message.content as string);
    setIsEditing(false);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
    adjustTextareaHeight();
  };

  if (deleted) {
    return null;
  }

  return (
    <>
      <div
        className="flex items-start mb-8 w-full overflow-hidden group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-10 h-10 rounded-full mr-4 flex-shrink-0">
          {isUser ? (
            <UserAvatar userName={userName ?? "Guest"} />
          ) : (
            <Image
              src={characterAvatarUrl || "/default-avatar.jpg"}
              alt={characterName}
              width={24}
              height={24}
              className="rounded-full w-full h-full object-cover"
            />
          )}
        </div>
        <div className="flex flex-col max-w-full flex-grow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-neutral-400">
              {isUser ? userName || "You" : characterName}
            </span>
            {!isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`text-neutral-400 hover:text-neutral-300 focus:outline-none transition-opacity duration-200 ${
                      isHovered ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="max-w-xl text-wrap break-words">
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  ref={textareaRef}
                  value={editedContent}
                  onChange={handleTextareaChange}
                  className="min-h-[100px] text-sm text-slate-300 overflow-hidden"
                  rows={1}
                />
                <div className="flex justify-start gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="rounded-full"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="rounded-full">
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <ReactMarkdown
                className="text-sm text-slate-300 text-wrap break-words"
                components={markdownComponents}
              >
                {message.content as string}
              </ReactMarkdown>
            )}
          </div>
          {!isUser && onRetry && !isEditing && regenerations === 0 && (
            <button
              onClick={onRetry}
              className="text-neutral-500 hover:text-neutral-300 transition-colors duration-200 ml-2 mt-4"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
         {!isUser && regenerations > 0 && (
            <div className="flex items-center space-x-2 mt-4 ml-2">
              <button 
                className="p-1 rounded-full"
                onClick={() => onGoBackRegenerate && onGoBackRegenerate(currentRegenerationIndex - 1)}
                disabled={currentRegenerationIndex === 0}
              >
                <ChevronLeft className={`w-4 h-4 ${currentRegenerationIndex === 0 && "text-slate-700"}`} />
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentRegenerationIndex} / 30
              </span>
              <button 
                className="p-1 rounded-full"
                onClick={() => {
                  if (currentRegenerationIndex === regenerations - 1 && regenerations < 30) {
                    onRetry && onRetry();
                  } else {
                    onGoBackRegenerate && onGoBackRegenerate(currentRegenerationIndex + 1);
                  }
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-2xl flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Delete message</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this message?</p>
          <DialogFooter className="flex gap-4 justify-between w-full mt-6">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function MessageAndInput({
  user,
  character,
  made_by_name,
  messages,
  chat_session,
  persona,
}: {
  user: User | undefined;
  character: typeof characters.$inferSelect;
  made_by_name: string;
  messages: CoreMessage[];
  chat_session?: string | undefined;
  persona?: typeof personas.$inferSelect | undefined;
}) {
  const router = useRouter();
  const replacePlaceholders = (content: string | undefined) => {
    if (content === undefined) {
      return content;
    }
    return content
      .replace(/{{user}}/g, persona?.displayName || user?.name || "Guest")  
      .replace(/{{char}}/g, character.name || "");
  };

  const processedMessages = messages.map((message) => ({
    ...message,
    content: replacePlaceholders(message.content as string),
  })) as CoreMessage[];
  const [messagesState, setMessagesState] =
    useState<CoreMessage[]>(processedMessages);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("deepseek/deepseek-chat");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<boolean>(false);
  const [isSignInDialogOpen, setIsSignInDialogOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [regenerations, setRegenerations] = useState<string[]>([]);
  const [currentRegenerationIndex, setCurrentRegenerationIndex] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;

      // Add scrollbar if content exceeds max height
      textareaRef.current.style.overflowY =
        scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
    }
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (window.innerWidth > 768) {
      // Desktop
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(input);
      } else if (e.key === "Escape") {
        e.preventDefault();
        resetTextareaHeight();
        if (input.trim() === "") {
          setInput("");
        }
      }
    }
  };

  const handleEdit = async (index: number, editedContent: string) => {
    const newMessages = messagesState.map((msg, i) =>
      i === index ? ({ ...msg, content: editedContent } as CoreMessage) : msg,
    );

    setMessagesState(newMessages);

    try {
      await saveChat(newMessages, character, chat_session);
    } catch (error) {
      console.error("Failed to save edited message:", error);
      // Optionally, revert the change in the UI or show an error message to the user
    }
  };

  const handleOnGoBackRegenerate = async (index: number) => {
    if (index >= 0 && index < regenerations.length) {
      const wantMessage = regenerations[index];
      const newMessages = [...messagesState];
      
      // Find the last assistant message and replace its content
      for (let i = newMessages.length - 1; i >= 0; i--) {
        if (newMessages[i].role === "assistant") {
          newMessages[i].content = wantMessage;
          break;
        }
      }
      
      setMessagesState(newMessages);
      await saveChat(newMessages, character, chat_session)
      setCurrentRegenerationIndex(index);
    }
  };

  const handleDelete = async (index: number) => {
    const newMessages = messagesState.filter((_, i) => i !== index);

    setMessagesState(newMessages);

    try {
      await saveChat(newMessages, character, chat_session);
    } catch (error) {
      console.error("Failed to save after deleting message:", error);
      // Optionally, revert the change in the UI or show an error message to the user
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const savedModel = localStorage.getItem("selectedModel");
    if (savedModel) {
      setSelectedModel(savedModel);
    }
    scrollToBottom();
  }, [messagesState]);

  const handleInputFocus = () => {
    if (!user) {
      setIsSignInDialogOpen(true);
    }
  };

  const handleSubmit = async (
    input: string,
    error: boolean = false,
    regenerate: boolean = false,
  ) => {
    if (!user) {
      setIsSignInDialogOpen(true);
      return;
    }

    if (input === "") {
      return;
    }

    let newMessages: CoreMessage[];

    if (regenerate && !error) {
      // Remove the last assistant message
      newMessages = messagesState.slice(0, -1);
    } else if (error) {
      newMessages = [...messagesState];
    } else {
      newMessages = [...messagesState, { content: input, role: "user" }];
    }

    setMessagesState(newMessages);
    setInput("");
    resetTextareaHeight();
    setIsLoading(true);
    setError(false);

    try {
      const result = await continueConversation(
        newMessages,
        selectedModel,
        character,
        chat_session,
      );
      console.log("result: " + JSON.stringify(result));
      if ("error" in result) {
        setError(true);
        return;
      }
      for await (const content of readStreamableValue(result)) {
        setMessagesState([
          ...newMessages,
          {
            role: "assistant",
            content: replacePlaceholders(content) as string,
          },
        ]);
        setRegenerations([
          ...regenerations,
          replacePlaceholders(content) as string,
        ]);
        setCurrentRegenerationIndex(regenerations.length);  // This sets it to the new last index
      }
    } catch (err) {
      setError(true);
    } finally {
      setIsLoading(false);
      if (!regenerate && !error) {
        setCurrentRegenerationIndex(0)
        setRegenerations([])
      }
    }
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem("selectedModel", modelId);
  };

  const handleRetry = () => {
    console.log("Attempting to retry the last message.");
    if (messagesState.length > 1) {
      // Ensure there are at least two messages
      const lastMessage = messagesState[messagesState.length - 1];
      const lastUserMessage = messagesState[messagesState.length - 2];

      if (lastMessage.role === "user") {
        console.log("Retrying the user's message due to an error.");
        // Error case: retry the user's message
        handleSubmit(lastMessage.content as string, true);
      } else if (lastMessage.role === "assistant") {
        console.log("Retrying the last user message to get a new assistant response.");
        // Regeneration case: retry the last user message to get a new assistant response
        handleSubmit(lastUserMessage.content as string, false, true);
      }
    } else {
      console.log("Not enough messages to retry.");
    }
  };

  return (
    <div className="flex flex-col h-full relative max-w-full overflow-x-hidden">
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
      <div className="flex-grow w-full flex justify-center overflow-y-auto mx-auto">
        <div id="messages-container" className="w-full mx-auto max-w-2xl">
          {/* Character Information Header */}
          <div className="mx-auto pt-12 pb-6 flex flex-col gap-2 text-center items-center overflow-hidden">
            <div className="w-24 h-24 rounded-full overflow-hidden mr-3">
              <Link href={`/character/${character.id}/profile`}>
                <Image
                  src={character.avatar_image_url ?? "/default-avatar.jpg"}
                  alt={`${character.name}'s avatar`}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </Link>
            </div>
            <p className="font-light text-md text-black dark:text-white">
              {character.name}
            </p>
            <ReactMarkdown className="font-light text-md text-slate-600 dark:text-slate-200">
              {character.tagline}
            </ReactMarkdown>
            <p className="font-light text-xs text-slate-600 dark:text-slate-200">
              by {made_by_name}
            </p>
          </div>

          <div className="pb-32 max-w-2xl mx-auto px-2">
            {messagesState.length > 1 && (
              <>
                {messagesState.slice(1).map((m, i) => (
                  <MessageContent
                    key={i}
                    message={m}
                    index={i + 1}
                    isUser={m.role === "user"}
                    userName={persona?.displayName ?? user?.name ?? "Guest"}
                    characterName={character.name}
                    characterAvatarUrl={character.avatar_image_url}
                    isError={error && i === messagesState.length - 2}
                    onRetry={
                      m.role === "assistant" &&
                      i === messagesState.length - 2 &&
                      messagesState.length > 2 &&
                      !isLoading
                        ? handleRetry
                        : undefined
                    }
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    regenerations={
                      m.role === "assistant" &&
                      i === messagesState.length - 2 &&
                      messagesState.length > 2 &&
                      !isLoading ?
                        regenerations.length
                         :
                        0
                    }
                    currentRegenerationIndex={currentRegenerationIndex}
                    onGoBackRegenerate={handleOnGoBackRegenerate}
                  />
                ))}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="fixed bottom-0 left-0 right-0 py-4 pointer-events-none w-full max-w-full">
        <div className="max-w-2xl mx-auto w-full">
          {error && (
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
              <RotateCcw
                className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-600 ml-2"
                onClick={handleRetry}
              />
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(input);
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
              </div>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                placeholder={`Message ${character.name}...`}
                className="w-full py-3 pl-14 pr-12 bg-transparent relative z-10 outline-none text-black dark:text-white text-lg rounded-xl resize-none overflow-hidden"
                style={{
                  minHeight: "50px",
                  maxHeight: `${MAX_TEXTAREA_HEIGHT}px`,
                  overflowY: "auto",
                }}
                rows={1}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black dark:bg-white rounded-full p-2 z-20 transition-opacity opacity-70 hover:opacity-100 focus:opacity-100 hover:cursor-pointer"
                disabled={!input.trim() || isLoading}
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
          </form>

          <Dialog
            open={isSignInDialogOpen}
            onOpenChange={setIsSignInDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sign in to continue</DialogTitle>
              </DialogHeader>
              <p>Please sign in to send messages and save your conversation.</p>
              <SignInButton />
            </DialogContent>
          </Dialog>

          <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400 pointer-events-auto">
            {!user && "Sign in to save messages"}
          </p>
        </div>
      </div>
    </div>
  );
}
